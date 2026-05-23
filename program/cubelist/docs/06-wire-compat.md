# Wire 호환성 정착본 (M5 cron #15)

PC 트랙 (`apps/pc-version` Rust) ↔ 모바일 PWA 트랙 (`apps/mobile-pwa` TS) 간 와이어
프로토콜 호환성 확정. 변경 시 본 문서 + 양쪽 spec 파일 동시 갱신 필수.

## 1. 검증 결과 (2026-05-24 cron #15)

| 영역 | Rust spec | TS spec | 호환 |
|---|---|---|---|
| PROTOCOL_VERSION | `1` (`messages.rs`) | `1` (`types/protocol.ts`) | ✅ |
| `ClientEvent::Hello` | protocol_version · device_id · nonce · timestamp_ms · hmac | 동일 | ✅ |
| `ClientEvent::PressItem` | board_id · item_id · press_kind · action | 동일 | ✅ |
| `ClientEvent::Ping` | 단일 variant | 동일 | ✅ |
| `ClientEvent::RunMacro` | macro_id · params (serde_json::Map) | 동일 (Record<string, unknown>) | ✅ |
| `ServerEvent::Welcome` | protocol_version · helper_version · capabilities | 동일 | ✅ |
| `ServerEvent::AuthRejected` | reason | 동일 | ✅ |
| `ServerEvent::ItemExecuted` | item_id · status · elapsed_ms | 동일 | ✅ |
| `PressKind` | tap / long / double | 동일 | ✅ |
| `MouseButton` | left / right / middle | 동일 | ✅ |
| `PairingPayload` | session_token · otp_secret · expires_at · device_fingerprint | 동일 | ✅ |
| `ActionPayload` 10 enum | link · shortcut · macro · folder · text_insert · clipboard_copy · app_launch · focus_window · mouse_click · plugin_action | 동일 | ✅ |
| `plugin_action.action_id` | Rust execute_plugin_action 가 옵셔널 필드 lookup (cron #14) | **이전 결함**: 누락 → 본 사이클에서 `action_id?: string` 추가 + Rust fallback | ✅ 정정 완료 |

## 2. plugin_action 라우팅 (M4 cron #14 + M5 cron #15)

```
모바일 PWA 큐브 누름
  ↓ press_item · action = { action_type: 'plugin_action', plugin_uuid, action_id?, payload }
PC 헬퍼 WS 수신 → actions::execute(ActionPayload::PluginAction)
  ↓ execute_plugin_action(plugin_uuid, payload)
  ↓ plugins::list_installed() 조회 → plugin_uuid 매칭
  ↓ action_id 명시 → manifest 액션 lookup
  ↓ action_id 미명시 → 첫 액션 fallback + tracing::warn
  ↓ 무한 재귀 방지 (inner action_type == "plugin_action" 거부)
  ↓ inner ActionPayload 재구성 (action.action_type + payload.payload)
  ↓ Box::pin(execute(inner)) async 재귀
```

**`action_id?` 결정 사유 (Karpathy 원칙 3 외과수술적)**:
- 모바일 PWA 가 단일 액션 플러그인 (대다수) 만 송신하는 시나리오 = action_id 생략 가능
- 멀티 액션 플러그인 = action_id 필수 명시 권장 (헬퍼 warn 로그로 안내)
- PC frontend (`plugin-registry.ts buildPluginActionPayload`) 는 항상 동봉

## 3. 페어링 흐름 (M5 호환 기준)

```
1. 모바일 PWA 가 Supabase Auth 로그인
2. PC 헬퍼 트레이 → "QR 페어링" → Tauri invoke `generate_pairing_qr`
   → PairingPayload { session_token, otp_secret, expires_at: now+60s, device_fingerprint }
3. PC 헬퍼 GUI 가 PairingPayload JSON 을 QR 코드로 렌더
4. 모바일 PWA `parsePairingQr(raw)` → TTL 검증 → Supabase Edge Function `/pair-device`
5. Edge Function: user_devices 등록 + HMAC secret 안전 채널 전송
6. 모바일 PWA: HMAC secret 을 IndexedDB 저장 (localStorage 금지)
7. 모바일 PWA: ws://127.0.0.1:23456/ws 접속 → Hello 송신
8. PC 헬퍼: HMAC + nonce + ±30s + 재사용 캐시 검증 → Welcome 응답
```

**HMAC 계산**: `HMAC-SHA256(secret, nonce | timestamp_ms | device_id)` → hex

**Origin 화이트리스트**:
- `https://주소모아.com` (모바일 PWA 운영 도메인)
- `tauri://localhost` (PC frontend 가 LAN WS 모드로 접속할 경우, M5 cron #15+ 미사용)

## 4. 후속 (M5+)

- (a) PC frontend `tauri-bridge.ts` 에 LAN WS 클라이언트 옵션 — 비-Tauri dev 환경에서 LAN WS 로 PC 헬퍼 접속 (모바일 PWA 와 동일 wire)
- (b) Supabase Realtime 폴백 채널 — LAN WS 실패 시 자동 전환 (mobile-pwa 측 이미 정착)
- (c) E2E 시나리오 자동화 (Playwright: PC frontend dev + 모바일 PWA dev + QR 페어링)

## 5. 변경 절차 (Wire 깨짐 방지)

1. spec 변경이 필요한 경우 본 문서 **먼저** 갱신
2. Rust `protocol/messages.rs` + TS `types/protocol.ts` 같은 PR 내 동시 변경
3. cargo test + npm run typecheck 양쪽 통과 확인
4. 본 docs/06-wire-compat.md 의 호환성 테이블 표시 갱신
