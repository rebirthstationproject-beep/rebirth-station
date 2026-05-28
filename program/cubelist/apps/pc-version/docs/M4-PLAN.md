# M4 Plugin SDK — 단계별 완전 구현 계획

**시작**: 2026-05-27 21:30
**목표 완료**: 2026-05-28 08:00 (~10시간, ~40 사이클 × 15분)
**모드**: autonomous cron 15분 자율 진행

## 현재 상태 (v21)

| Phase | 항목 | 상태 |
|---|---|---|
| 1 | plugin 자산 추출 (`_plugins/<id>/`) | ✅ |
| 1 | cubeone 에 plugin 메타 reference | ✅ |
| 2 | iframe + MockWebSocket + SDK 메시지 ~20종 | ✅ |
| 2 | Tauri asset:// 프로토콜 + CSP | ✅ |
| 2 | PropertyInspector iframe + sdpi-components | **✅ 사용자 검증됨 (Tomato Timer 옵션 폼 표시 OK)** |
| 3 | Action runtime (큐브 셀 실시간 갱신) | ⏳ 사용자 검증 필요 |
| 3 | 다중 instance (cube N개 = N독립) | ⏳ 검증 필요 |
| 4 | Native (.exe) plugin 지원 | ⛔ 미구현 |
| 4 | StreamDeck+ encoder (dial/touch) | ⛔ 미구현 |
| 4 | switchToProfile / getDeviceList | ⛔ stub |

## 단계별 계획

### Step 1 — Action Runtime 검증 + 안정화 (예상 2~4 cron, 30~60분)
- 1.1: PluginActionRunner mount 로그 강화 (어떤 큐브 마운트, iframe URL, connected 상태)
- 1.2: iframe error 복구 — 1차 실패 시 자동 재시도 (3회)
- 1.3: 큐브 셀에 시각 indicator (작은 점, 작동/에러/대기)
- 1.4: setImage 빈도 측정 (DevTools 없이) — runtime status 에 표기
- 1.5: 모든 28 plugin 각각 Tomato 같은 자산 + cubeone 변환 가능 검증

### Step 2 — Tauri Custom URI Scheme Protocol (예상 4~6 cron, 1~1.5시간)
- 2.1: Rust register_asynchronous_uri_scheme_protocol("cubelist-plugin") 등록
- 2.2: cubelist-plugin://<plugin_id>/<path> → 라이브러리 폴더 안 파일 read
- 2.3: HTTP response 헤더 우리가 제어 (X-Frame-Options 제거, CORS allow, MIME type 정확)
- 2.4: PluginRuntime 이 convertFileSrc 대신 cubelist-plugin:// 사용
- 2.5: asset:// 폴백 유지 (호환성)

### Step 3 — Native (.exe) Plugin 지원 (예상 8~12 cron, 2~3시간)
- 3.1: Rust 측 WebSocket 서버 (`tokio-tungstenite`) 띄움 — 동적 포트
- 3.2: spawn_plugin_process Tauri 명령 — child .exe 실행
- 3.3: SDK 표준 인자 (-port, -pluginUUID, -registerEvent, -info)
- 3.4: process ↔ Rust WS ↔ frontend IPC 라우팅
- 3.5: frontend PluginRuntime 분기 — CodePath 가 .exe 이면 native runtime
- 3.6: process lifecycle (시작/종료/crash 재시작)
- 3.7: process pool 관리 (큐브당 1 process)
- 3.8: CPU plugin 검증 (실 CPU usage 표시)
- 3.9: OBS Tools 검증 (OBS WebSocket 연결 시도하지만 OBS 없으면 graceful)

### Step 4 — 잔여 SDK 메시지 (예상 4~6 cron, 1~1.5시간)
- 4.1: switchToProfile → 큐브 list 전환에 매핑
- 4.2: getDeviceList → 가상 device 반환
- 4.3: setFeedback / setFeedbackLayout (StreamDeck+ 인코더)
- 4.4: dialDown / dialRotate / touchTap (인코더 SDK)
- 4.5: setTriggerDescription (인코더 안내 텍스트)

### Step 5 — 다중 Instance + 안정성 (예상 4~6 cron, 1~1.5시간)
- 5.1: 같은 plugin 의 cube N개 = N 독립 context UUID 검증 (Tomato Timer 4개 시각 동시)
- 5.2: 메모리 leak 진단 (iframe unmount 시 cleanup)
- 5.3: crash recovery (plugin JS exception 시 runtime 재마운트)
- 5.4: deep settings 보존 (localStorage 동기 + cubeone 갱신)

### Step 6 — 28 Plugin 전체 검증 (예상 8~10 cron, 2~2.5시간)
- 6.1: HTML plugin (Tomato, Audio Mute, Discord, Voicemod, ...) 각각 검증
- 6.2: Native plugin (CPU, OBS Tools, Streamlabs) 각각 검증
- 6.3: 암호화 manifest plugin (Spotify, Twitch, Adobe) en.json fallback 검증
- 6.4: 작동 안 되는 plugin = 명세 (어떤 SDK 메시지 미지원인지)
- 6.5: 보고서 자동 생성 (PLUGIN-COMPATIBILITY.md)

### Step 7 — 마무리 (예상 2~4 cron, 30~60분)
- 7.1: 사용자 워크플로우 안내 강화 (변환 가이드, 다중 인스턴스 사용법)
- 7.2: 에러 메시지 한국어 + 친화적
- 7.3: 최종 commit + push + 변경 로그
- 7.4: 사용자에게 완료 보고

## 매 cron 의 작업 패턴

1. 직전 사이클 결과 확인 (M4-PROGRESS.md tail)
2. 다음 sub-step 선택 (현재 Step 안)
3. 코드 변경 + 빌드 + exe 재빌드 + 시각 검증 (vite preview)
4. commit + push
5. M4-PROGRESS.md 에 진행 기록

## 솔직한 한계 / 위험

- **Tauri exe 실제 동작 검증은 사용자 환경 의존** — vite preview = asset:// 작동 안 함
- **Native plugin 의 OS API 의존** = Tauri spawn 으로 가능하나 plugin 의 system calls 가 작동하려면 OS 권한 OK 여야
- **plugin 보안** = 1인용 OK, 추후 배포 시 sandbox 강화 필요
- **autonomous 진행 = 막힐 가능성** = 막히면 M4-PROGRESS.md 에 "blocked" 기록 + 다음 cron 에서 우회 시도
