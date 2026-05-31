# `.cubeone` v3 영구 lock 명세 (2026-05-31)

> 본 명세는 **2026-05-31 시점 StreamDeck Action spec 슈퍼셋 + 큐브 리스트 확장 = 영구 lock**.
> 이후 변경 금지. 새 필드는 `extensions` 로 흡수. 새 action_type은 enum 추가만 허용 (삭제·rename 금지).

## 1. 정의

`.cubeone` = 단일 큐브 (StreamDeck Action 1개 = 1 `.cubeone`)

## 2. ZIP 컨테이너 구조

```
<id>.cubeone (ZIP)
└── manifest.json
```

## 3. manifest.json 영구 필드

```typescript
{
  "rbs_format_version": 3,                  // 영구 lock = 3
  "kind": "cubeone",                        // 영구 lock = "cubeone"
  "id": string,                             // UUID
  "license": "free" | "paid" | "restricted",
  "created_at": string,                     // ISO 8601
  "updated_at": string,
  "rbs_min_version": "0.1.0",
  "cube": Cube                              // 아래 Cube 영구 lock
}
```

## 4. `Cube` 영구 lock 필드

### 4.1 영구 필수 필드 (변경 0)
| 필드 | 타입 | 의미 |
|---|---|---|
| `id` | string | UUID |
| `sort_order` | number | 정렬 키 |
| `label` | string | 큐브 라벨 |
| `icon_url` | string \| null | data URL 또는 외부 URL |
| `action_type` | CubeActionType enum | 액션 타입 (추가만 가능) |
| `action_payload` | Record<string, unknown> | 액션별 사용자 설정 |

### 4.2 영구 옵셔널 필드 (P0 추가, 미사용 = 무시)
| 필드 | 타입 | 의미 | StreamDeck 매핑 |
|---|---|---|---|
| `metadata` | Record<string, unknown> | 자유 메타 | — |
| `states` | CubeState[] | 멀티 상태 (토글) | Action.States[] |
| `title_style` | CubeTitleStyle | 라벨 스타일 | Action.States[].Title/Font/... |
| `controller_type` | 'main' \| 'dial' \| 'touchpad' | 컨트롤러 분기 | Action.Controllers[] |
| `extensions` | Record<string, unknown> | Forward-compat 자유 형식 | — |
| `streamdeck_meta` | Record<string, unknown> | 변환 원본 보존 | StreamDeck Action 원본 |

### 4.3 `CubeState`
```typescript
{
  label?: string;
  image?: string;                           // data URL 또는 외부 URL
  action_payload?: Record<string, unknown>; // state별 payload override
  extensions?: Record<string, unknown>;
}
```

### 4.4 `CubeTitleStyle` (StreamDeck Title 메타 1:1)
```typescript
{
  font_family?: string;
  font_size?: number;
  font_style?: 'normal' | 'bold' | 'italic' | 'bold_italic';
  font_underline?: boolean;
  outline_thickness?: number;
  show?: boolean;
  linked?: boolean;                         // LinkedTitle (사용자 지정 vs 자동)
  title?: string;
  alignment?: 'top' | 'middle' | 'bottom';
  color?: string;                           // #RRGGBB
}
```

## 5. `CubeActionType` enum (영구 lock + 추가 자유)

### 5.1 현재 enum (10종)
- `link` — URL 열기
- `shortcut` — 키 조합
- `macro` — 다중 step
- `folder` — 서브덱 진입
- `text_insert` — 텍스트 삽입
- `clipboard_copy` — 클립보드 복사
- `app_launch` — 앱 실행
- `focus_window` — 창 포커스
- `mouse_click` — 마우스 클릭
- `plugin_action` — 커스텀 plugin (StreamDeck plugin 호환)

### 5.2 추가 예정 (P1, 영구 lock 안 추가만 가능)
- `media_key` (multimedia plugin)
- `page_navigate` / `page_jump` (system.pagination + page)
- `folder_up` / `folder_open` (profile.backtoparent + openchild)
- `window_close` (system.close)
- `system_sleep` (system.sleep)
- `system_actionbar_toggle` (system.actionbar)
- `hotkey_toggle` (system.hotkeyswitch, states 의존)
- `audio_play` (soundboard)
- `profile_rotate` (선택)

### 5.3 동적 큐브 (P2, 영구 lock 안 추가 자유)
- `live_clock` (system.digitaltime)
- `live_timer` (timer)
- `live_gauge` / `live_battery` (자체 확장)

## 6. 호환성 규칙 (영구)

1. **모든 옵셔널 필드** — 없으면 기본값 또는 무시
2. **action_type enum** — 추가만 가능, 삭제·rename 금지
3. **rbs_format_version** = 3 영구 lock. v4 필요 시 별도 spec 분기
4. **extensions** — 자유 형식, schema validate 무관
5. **streamdeck_meta** — 변환 원본 보존, 변환기는 reversible 보장 노력

## 7. 호환 시나리오

| 시나리오 | 동작 |
|---|---|
| 구버전 reader 가 P0 옵셔널 필드 모르면 | 무시 (기존 필드만 파싱) |
| 새 reader 가 구버전 `.cubeone` 만나면 | 정상 파싱 (옵셔널 필드 = 기본값) |
| StreamDeck 새 SDK 새 필드 추가 | 변환기가 `streamdeck_meta` 또는 `extensions` 로 흡수 |
| 우리 자체 새 액션 도입 | `action_type` enum 추가 (삭제 X) |
