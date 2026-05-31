# `.cubepack` v3 영구 lock 명세 (2026-05-31)

> 본 명세는 **2026-05-31 시점 StreamDeck `.streamDeckProfile` 변환 산물 + 자체 다중 리스트 묶음 spec = 영구 lock**.
> `.streamDeckProfile → .cubepack` 매핑 (사용자 영구 정의).

## 1. 정의

`.cubepack` = 다중 리스트(탭) 묶음 = 앱 1개 분량 또는 사용자 페이지+키 배치

용도:
- StreamDeck `.streamDeckProfile` 변환 산물 (사용자 페이지 배치 그대로 재현)
- 사용자가 PC 앱에서 만든 다중 탭 + 큐브 배치
- 큐브팩 마켓플레이스 배포 단위 (플랫폼/프로그램 단위 — Figma·OBS·VS Code 등)

## 2. ZIP 컨테이너 구조

```
<id>.cubepack (ZIP)
├── manifest.json
└── lists/
    ├── <list-id-1>.cubelist
    ├── <list-id-2>.cubelist
    └── ...
```

각 `.cubelist` 안에 또 `cubes/*.cubeone` (3 레벨 중첩).

## 3. manifest.json 영구 필드

```typescript
{
  "rbs_format_version": 3,
  "kind": "cubepack",
  "id": string,
  "name": string,
  "license": "free" | "paid" | "restricted",
  "created_at": string,
  "updated_at": string,
  "rbs_min_version": "0.1.0",
  "pack": CubePack
}
```

## 4. `CubePack` 영구 lock 필드

### 4.1 영구 필수 필드
| 필드 | 타입 | 의미 |
|---|---|---|
| `id` | string | UUID |
| `name` | string | 팩 이름 |
| `lists` | CubeList[] | 리스트(탭) 배열 |

### 4.2 영구 옵셔널 필드
| 필드 | 타입 | 의미 | StreamDeck 매핑 |
|---|---|---|---|
| `category` | string | 카테고리 (생산성·미디어·...) | — |
| `cubes` | Cube[] | 큐브 라이브러리 풀 (Phase 2b) | — |
| `description` | string | 팩 설명 | StreamDeck Profile.Description |
| `metadata` | Record<string, unknown> | 자유 메타 | — |
| `rbs_format_version` | 3 | 영구 lock 버전 | — |
| `license` | 'free' \| 'paid' \| 'restricted' | 라이선스 | — |
| `cubes_per_page_default` | number | 페이지 기본 큐브 수 | — |
| `device_hint` | DeviceHint | 변환 원본 디바이스 | Profile.Device.Model |
| `streamdeck_source` | Record<string, unknown> | 변환 원본 보존 | StreamDeck Profile manifest |
| `extensions` | Record<string, unknown> | Forward-compat | — |

## 5. 변환 흐름

```
StreamDeck .streamDeckProfile (사용자 페이지+키 배치)
   │
   │ scripts/import-streamdeck-profile.mjs (Step 1.5 예정)
   ▼
.cubepack (다중 리스트 묶음)
   ├── manifest.json (name = Profile.Name, device_hint = Profile.Device.Model)
   └── lists/
       ├── <page-1>.cubelist  (cubes = Page.Controllers[].Actions {col,row} 매핑)
       ├── <page-2>.cubelist
       └── ...
```

### 5.1 디바이스별 그리드 자동 매핑 표
| StreamDeck 디바이스 | grid_layout | DeviceHint |
|---|---|---|
| StreamDeckMini | 3×2 = 6 | streamdeck_mini |
| StreamDeck / MK.2 | 5×3 = 15 | streamdeck_standard |
| StreamDeckXL | 8×4 = 32 | streamdeck_xl |
| StreamDeckPlus | 4×2 + 4 인코더 | streamdeck_plus |
| StreamDeckNeo | 4×2 = 8 | streamdeck_neo |

## 6. 호환성 규칙 (영구)

1. 모든 옵셔널 필드 — 없으면 기본값
2. `lists` 빈 배열 허용 (빈 팩)
3. 디바이스 hint 추가만 가능 (삭제·rename 금지)
4. 큐브팩 정책 (영구): 플랫폼/프로그램 단위 (Figma·OBS·VS Code 등)
5. 직군 묶음·가상 카탈로그 금지 (`feedback_cubepack_policy_v2`)

## 7. 호환 시나리오

| 시나리오 | 동작 |
|---|---|
| 사용자 .cubepack 생성 (다중 탭) | 정상 lists 배열 |
| .streamDeckProfile 13 DefaultProfile 변환 | device_hint 자동 + streamdeck_source 원본 보존 |
| StreamDeck 새 디바이스 출시 | device_hint enum 추가만 |
| 큐브팩 마켓플레이스 거래 | license + cubes_per_page_default + category 활용 |
