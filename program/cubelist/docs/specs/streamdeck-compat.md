# StreamDeck ↔ 큐브 변환 매트릭스 영구 정의 (2026-05-31)

> 본 명세는 **2026-05-31 시점 StreamDeck SDK + Profile 형식과의 100% 변환 호환성** 영구 정의.
> 미래 StreamDeck SDK 변경 시 = 변환기가 신규 필드를 `streamdeck_meta` / `streamdeck_source` / `extensions` 로 흡수, 본 매트릭스는 변경 0.

## 1. 사용자 영구 정의 (2026-05-31)

> ".streamDeckPlugin → .cubelist 가 맞는 표현이야 큐브들을 모아서 구성한것 = 다른점 스트림덱은 물리적인 버튼 수 제한으로 개수제한이 있는데 우리는 개수 제한이 없다는 점이 다르면 되고 나머지 구성은 동일하게"

### 영구 매핑

| StreamDeck | 큐브 시스템 | 의미 |
|---|---|---|
| `.streamDeckPlugin` (개발자 SDK 패키지) | `.cubelist` | 변환 산물 = 큐브 묶음 |
| `.streamDeckProfile` (사용자 페이지+키 배치) | `.cubepack` | 다중 리스트 묶음 |
| Action 1개 (UUID) | Cube 1개 (action_type + payload) | 단일 기능 단위 |
| Profile Page (Controllers+Actions) | CubeList (cubes 배열) | 단일 탭 |
| Action 좌표 (col, row) | Cube.sort_order + grid_layout | 위치 메타 |
| States[] 멀티 상태 | Cube.states[] | 토글 액션 |
| Title 메타 (Font/Color/Alignment) | Cube.title_style | 라벨 스타일 |

### 영구 차이점

| 항목 | StreamDeck | 큐브 |
|---|---|---|
| 큐브 개수 | 물리 버튼 한도 (Mini 6 / Std 15 / XL 32 / Plus 8+인코더) | **무제한** (페이지·폴더 확장) |
| 디바이스 | 전용 HW (StreamDeck Mini/Std/XL/Plus/Neo 등) | PC 앱 SW UI |
| 백라이트 | LCD 자체 | 큐브 셀 검은 배경 + LED 글로우 효과 (시각 모방) |
| 인코더 (dial) | StreamDeck+ 전용 HW | 마우스 wheel 매핑 |
| LCD touchpad | StreamDeck+ 전용 HW | 마우스 클릭 매핑 |

## 2. 액션 매트릭스 (25 내장 plugin)

### 2.1 직접 매핑 (5/14 시스템 액션)
| StreamDeck Built-in | PC action_type | 상태 |
|---|---|---|
| `com.elgato.streamdeck.system.hotkey` | `shortcut` | ✅ 직접 매핑 |
| `com.elgato.streamdeck.system.open` | `app_launch` | ✅ |
| `com.elgato.streamdeck.system.openapp` | `app_launch` | ✅ |
| `com.elgato.streamdeck.system.website` | `link` | ✅ |
| `com.elgato.streamdeck.system.text` | `text_insert` | ✅ |
| `com.elgato.streamdeck.system.mouse` | `mouse_click` | ✅ |
| `com.elgato.streamdeck.keys` | `shortcut` | ✅ |
| `com.elgato.streamdeck.multiactions` | `macro` | ✅ |

### 2.2 plugin_action 통합 매핑 (나머지)
- 모든 미매핑 액션 = `plugin_action`
- `cube.action_payload.plugin_uuid` = 원본 UUID 보존
- `cube.action_payload.plugin_id` = `_plugins/<id>/` 자산 폴더 식별
- `cube.action_payload.code_path` / `code_kind` = HTML iframe 또는 Native exe
- `cube.action_payload.pi_path` = PropertyInspector 경로
- `cube.action_payload.sidecar_exes` = Sidecar process 들

### 2.3 P1 신규 액션 (영구 lock 안 추가, Step 1.2)
- `media_key` (multimedia)
- `page_navigate` / `page_jump` (system.pagination + page)
- `folder_up` / `folder_open` (profile.backtoparent + openchild)
- `window_close` (system.close)
- `system_sleep` (system.sleep)
- `system_actionbar_toggle` (system.actionbar)
- `hotkey_toggle` (system.hotkeyswitch, states 의존)
- `audio_play` (soundboard)
- `profile_rotate` (선택)

### 2.4 P2 동적 큐브 (영구 lock 안 추가, Phase 5)
- `live_clock` (system.digitaltime)
- `live_timer` (timer)
- `live_gauge` / `live_battery` (자체 확장)

## 3. 메타 매트릭스

| StreamDeck manifest | Cube/CubeList 필드 | 변환 |
|---|---|---|
| Action.UUID | action_payload.plugin_uuid | 원본 보존 |
| Action.Name | label | 직접 |
| Action.Icon | icon_url (data URL) | base64 인라인 |
| Action.States[].Image | states[].image | 멀티 상태 시 |
| Action.States[0].Image | icon_url (default) | 단일 상태 시 |
| Action.States[].Title 메타 | states[].title_style 또는 title_style | Font/Color/Alignment |
| Action.States[].LinkedTitle | title_style.linked | true/false |
| Action.Tooltip | metadata.sd_tooltip | 보존 |
| Action.Controllers | controller_type | 'main'/'dial'/'touchpad' |
| Action.PropertyInspectorPath | action_payload.pi_path | M4 A |
| Action.Encoder | extensions.encoder | dial 전용 메타 |
| Action.SupportedInMultiActions | extensions | 보존 |
| Action.VisibleInActionsList | extensions | 보존 |
| Profile.Device.Model | device_hint | 자동 매핑 |
| Profile.Pages | lists (CubeList[]) | 다중 탭 |
| Page.Controllers[].Actions {col,row} | cubes[].sort_order | 좌표 → 1D 정렬 |
| Page.Manifest | streamdeck_source | 원본 보존 |
| Sidecar .exe 자동 spawn | action_payload.sidecar_exes | M4 B |
| 다국어 manifest (ko/en/ja/zh) | metadata.i18n | M4 C |

## 4. 변환기 위치

| 형식 | 변환기 | 상태 |
|---|---|---|
| `.streamDeckPlugin` → `.cubelist` | `scripts/import-streamdeck-plugins.mjs` + `frontend/src/lib/plugin-converter.ts` | ✅ 작동 (28 plugin 변환 검증) |
| `.streamDeckProfile` → `.cubepack` | `scripts/import-streamdeck-profile.mjs` | △ Step 1.5 예정 |
| .cubelist → .streamDeckPlugin (역변환) | 미작성 | 추후 (선택) |
| .cubepack → .streamDeckProfile (역변환) | 미작성 | 추후 (선택) |

## 5. 호환 시나리오 (영구)

| 시나리오 | 동작 |
|---|---|
| StreamDeck 새 SDK 새 필드 추가 | 변환기가 `streamdeck_meta` / `streamdeck_source` 로 흡수, spec 변경 0 |
| StreamDeck 새 디바이스 (예: XL2) | device_hint enum 추가만 (기존 삭제 X) |
| StreamDeck 기존 필드 deprecate | 우리는 보존 (역변환 가능성) |
| 미래 우리 자체 액션 추가 | action_type enum 추가만 |
| 큐브 → StreamDeck 역변환 필요 | streamdeck_meta + streamdeck_source 로 reversible 재구성 |

## 6. 변환 한계 (명시)

| StreamDeck 영역 | 변환 한계 | 회피 |
|---|---|---|
| JS/HTML 실행 환경 (Property Inspector) | M4 Plugin Runtime SDK 로 iframe 호스팅 | ✅ M4 Phase 2/3/4 완료 |
| Native plugin .exe | Sidecar spawn 시스템 | ✅ M4 B |
| 인코더 dial 회전 | 마우스 wheel 매핑 | ✅ M4 D |
| LCD touchpad | 마우스 클릭 | ✅ |
| LED 백라이트 | 큐브 셀 글로우 효과 (시각 모방) | ✅ styles.css LCD 톤 |
| DRM/암호화 plugin | 보안 모듈 미구현 | ⚠️ 일부 plugin 차단 |
| 실시간 게이밍 API | plugin 자체 OAuth | △ 검증 필요 |

## 7. 영구 lock 약속

본 매트릭스는 2026-05-31 시점 StreamDeck 형식 + 큐브 시스템 형식의 변환 호환성을 정의합니다.

- 미래 StreamDeck SDK 변경 시 → 변환기가 신규 필드를 forward-compat 필드로 흡수, **본 매트릭스 변경 0**
- 미래 큐브 시스템 새 액션 추가 시 → enum 추가만, 기존 필드 변경 X
- StreamDeck 미지원 디바이스 발견 시 → device_hint 추가만

## 8. 인접 명세

- `cubeone-v3.md` — 단일 큐브 영구 lock
- `cubelist-v3.md` — 큐브 묶음 영구 lock (.streamDeckPlugin 변환 산물)
- `cubepack-v3.md` — 다중 리스트 묶음 영구 lock (.streamDeckProfile 변환 산물)
- `cubeplugin.md` — 우리 자체 SDK 패키지 (별도 결정 Q-E 대기)

## 9. 메모리 참조

- `project_cubelist_file_mapping.md` — 영구 매핑 정의
- `project_master_flow_2026-05-31.md` — Step 1~4 마스터 흐름
- `project_cubelist_multi_version.md` — ver.주소모아 / ver.케이링크 / 풀 버전 3 분기
