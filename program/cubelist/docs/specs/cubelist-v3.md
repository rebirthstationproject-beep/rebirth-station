# `.cubelist` v3 영구 lock 명세 (2026-05-31)

> 본 명세는 **2026-05-31 시점 StreamDeck `.streamDeckPlugin` 변환 산물 + 자체 큐브 묶음 spec = 영구 lock**.
> `.streamDeckPlugin → .cubelist` 매핑 (사용자 영구 정의).
> 핵심 차이: 스트림덱 = 물리 버튼 한도 / 큐브 = **개수 제한 없음**.

## 1. 정의

`.cubelist` = 큐브 묶음 = 그리드 1 탭

용도:
- StreamDeck `.streamDeckPlugin` 변환 산물 (개발자 SDK 액션이 모두 큐브화된 라이브러리)
- 사용자가 그리드에 직접 배치한 큐브 묶음
- 케이링크/주소모아 미니 에디터에서 생성한 큐브 묶음 (link 액션만)

## 2. ZIP 컨테이너 구조

```
<id>.cubelist (ZIP)
├── manifest.json
└── cubes/
    ├── <cube-id-1>.cubeone
    ├── <cube-id-2>.cubeone
    └── ...
```

## 3. manifest.json 영구 필드

```typescript
{
  "rbs_format_version": 3,
  "kind": "cubelist",
  "id": string,
  "author": string,                         // 변환 시 StreamDeck.Author
  "description": string,
  "license": "free" | "paid" | "restricted",
  "created_at": string,
  "updated_at": string,
  "rbs_min_version": "0.1.0",
  "list": CubeList                          // 아래 CubeList 영구 lock
}
```

## 4. `CubeList` 영구 lock 필드

### 4.1 영구 필수 필드
| 필드 | 타입 | 의미 |
|---|---|---|
| `id` | string | UUID |
| `name` | string | 리스트 이름 (탭 표시) |
| `sort_order` | number | 탭 정렬 순서 |
| `cubes` | Cube[] | 큐브 배열 |
| `order` | { ref: string; sort_order: number }[] | ZIP 안 cubes/*.cubeone 참조 (export 시 사용) |

### 4.2 영구 옵셔널 필드
| 필드 | 타입 | 의미 | StreamDeck 매핑 |
|---|---|---|---|
| `cols` | number | 그리드 컬럼 수 (3~8, 기본 5) | Profile.GridLayout 자동 매핑 |
| `cubes_per_page` | number | 한 페이지 큐브 수 (기본 cols × 3) | StreamDeck Pagination |
| `metadata` | Record<string, unknown> | 자유 메타 | — |
| `grid_layout` | DeviceHint | 디바이스 hint | Profile.Device.Model |
| `controller_type` | 'main' \| 'dial' \| 'touchpad' | 컨트롤러 분기 | Controllers[] |
| `current_folder_id` | string | 현재 진입 폴더 (M7) | — |
| `cube_ids` | string[] | folder type 자식 큐브 id | — |
| `extensions` | Record<string, unknown> | Forward-compat | — |
| `streamdeck_source` | Record<string, unknown> | 원본 보존 | StreamDeck Page manifest |

## 5. `DeviceHint` enum

| Hint | 그리드 | StreamDeck 디바이스 |
|---|---|---|
| `streamdeck_mini` | 3×2 = 6 | StreamDeckMini |
| `streamdeck_standard` | 5×3 = 15 | StreamDeck (1st gen / MK.2) |
| `streamdeck_mk2` | 5×3 = 15 | StreamDeck MK.2 |
| `streamdeck_xl` | 8×4 = 32 | StreamDeckXL |
| `streamdeck_plus` | 4×2 키 + 4 인코더 + LCD | StreamDeckPlus |
| `streamdeck_neo` | 4×2 = 8 | StreamDeckNeo |
| `corsair_nightsword` | — | Corsair Nightsword |
| `corsair_vanguard96` | — | Corsair Vanguard 96 |
| `corsair_vanguard99` | — | Corsair Vanguard 99 |
| `discord_deckmini` | — | Discord DeckMini |
| `galleon_100sd` | — | Galleon 100SD |
| `xlr_dock` | — | XLR Dock |
| `cubelist_unlimited` | **무제한** | **우리 자체 (영구 차별점)** |

## 6. 호환성 규칙 (영구)

1. 모든 옵셔널 필드 — 없으면 기본값
2. `.streamDeckPlugin` 변환 시 — Action들이 자동 큐브화, sort_order 자동 부여
3. 개수 제한 없음 — 페이지네이션 + 폴더로 무한 확장 (영구 차별점)
4. 스트림덱이 미래 새 디바이스 출시 시 `device_hint` 추가만 (삭제 X)

## 7. 변환 흐름

```
StreamDeck .streamDeckPlugin (SDK 패키지)
   │
   │ scripts/import-streamdeck-plugins.mjs
   │ src/lib/plugin-converter.ts (in-app)
   ▼
.cubelist (큐브 묶음)
   ├── manifest.json (name = StreamDeck plugin Name)
   └── cubes/
       ├── <action-1>.cubeone  (cube.action_type = 'plugin_action')
       ├── <action-2>.cubeone
       └── ...
```

## 8. 호환 시나리오

| 시나리오 | 동작 |
|---|---|
| 사용자 .cubelist 생성 (이미지+링크만) | cube.action_type='link' 만 사용, PC 100% 파싱 |
| PC 변환된 .cubelist 온라인 import | link 큐브만 표시·편집, 다른 액션 = "PC 전용" 안내 |
| StreamDeck 미래 새 Action 카테고리 | 변환기가 plugin_action 또는 신규 enum 으로 흡수 |
