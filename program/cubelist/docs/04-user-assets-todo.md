# 큐브 리스트 — 사용자 직접 제작 필요 아이콘/아트 자산

본 목록은 **사용자(=오너)가 직접 새로 제작**해야 하는 시각 자산입니다. 코드 진행과 병렬로 제작 가능.

규칙: **fal.ai 이미지 절대규칙 + 디자인 토큰 보존 + 한글 글씨 최소화** ([memory: feedback_image_production_rules_v3], [memory: feedback_brand_preservation], [memory: feedback_rebirth_station_color_policy]).

리버스 스테이션 코어 = **Stream Deck 무채색 톤** 유지 (브랜드 세션 결정 대기 중).

---

## 우선순위 P0 — M2 진입 전 필요

### A. 앱 아이콘 (5종 + 트레이 2종)
| 파일 | 사이즈 | 용도 | 톤 |
|---|---|---|---|
| `icons/icon.ico` | multi-res | Windows 실행 파일 | 무채색 + 큐브 상징 |
| `icons/icon.icns` | multi-res | macOS (Phase 2) | 동일 |
| `icons/32x32.png` | 32px | 작은 디스플레이 | 동일 |
| `icons/128x128.png` | 128px | 표준 | 동일 |
| `icons/128x128@2x.png` | 256px | Retina | 동일 |
| `icons/tray-light.png` | 32px | 트레이 (라이트 테마) | 진한 회색 + 투명 배경 |
| `icons/tray-dark.png` | 32px | 트레이 (다크 테마) | 밝은 회색 + 투명 배경 |

**현재 자리채우기 상태** — 모두 교체 필요.

### B. 빈 큐브 슬롯 (Empty Cube)
| 파일 | 사이즈 | 용도 |
|---|---|---|
| `assets/cube-empty-light.png` | 144×144 | 빈 슬롯 (라이트) |
| `assets/cube-empty-dark.png` | 144×144 | 빈 슬롯 (다크) |
| `assets/cube-add.png` | 144×144 | + 추가 버튼 |

큐브 한 칸은 144×144 권장 (StreamDeck 키 표준 72×72의 2× 레티나).

---

## 우선순위 P1 — M3 (액션 시스템) 진입 전 필요

### C. 코어 액션 아이콘 (8종 — M3 범위)
| ID | 라벨 | 아이콘 컨셉 |
|---|---|---|
| `open-url` | 링크 열기 | 지구본 또는 화살표+창 |
| `open-app` | 앱 실행 | 정사각 앱 아이콘 형태 |
| `run-shortcut` | 단축키 | 키보드 키 |
| `run-macro` | 매크로 | 톱니바퀴 시퀀스 |
| `open-folder` | 폴더(서브덱) | 폴더 |
| `back-to-parent` | 뒤로 | ← |
| `next-page` / `prev-page` | 페이지 이동 | ▶ / ◀ |
| `multi-action` | 멀티액션 | 점 3개 + 화살표 |

각 144×144 PNG (투명 배경) + SVG 원본 1세트.

### D. 액션 타입 인디케이터 (인스펙터용, 24×24 작은 아이콘)
액션 카테고리 라벨에 붙는 작은 픽토그램. 위 C와 동일 컨셉이지만 24×24 단색.

---

## 우선순위 P2 — M6 (카테고리 뷰) 진입 전 필요

### E. 카테고리 아이콘 12종 (사이드바)
| 카테고리 | 컨셉 |
|---|---|
| 생산성 | 체크리스트 |
| 미디어 | 음표·필름 |
| 개발 | `</>` |
| 디자인 | 펜툴 |
| 게이밍 | 게임패드 |
| 시스템 | 톱니바퀴 |
| 통신 | 말풍선 |
| 스마트홈 | 집 |
| 스트리밍 | 카메라 |
| 오피스 | 문서 |
| 웹 | 지구 |
| 파일 | 폴더+ |

각 48×48 + 24×24 두 사이즈. 무채색 + 활성 시 액센트 컬러 1종 (브랜드 결정 대기).

### F. 빌트인 큐브 시드 아이콘 (~40종)
StreamDeck `PageIcons` 17종 + 큐브 리스트 자체 보강 23종. M6에서 카탈로그 채울 때 필요.

**제안 시드 목록 (40개):**
Volume Up · Volume Down · Mute · Play · Pause · Stop · Next Track · Prev Track · Mic Mute · Cam Toggle · Screen Lock · Sleep · Brightness Up/Down · New Tab · Close Tab · Find · Copy · Paste · Cut · Undo · Redo · Save · Bold · Italic · Underline · Email · Calendar · Notes · Calculator · Terminal · File Explorer · Browser · Spotify · Discord · Slack · OBS Start · OBS Mute · Zoom Mute · YouTube · Custom URL.

---

## 우선순위 P3 — M5 (러너) + M9 (출시) 전 필요

### G. 온보딩 일러스트 (3~5장)
- "안 쓰는 폰을 거치하세요"
- "큐브를 드래그하세요"
- "PC와 페어링하세요"

스타일: 리버스 스테이션 무채색 + 인물 실루엣 (한글 글씨 X — 텍스트는 별도 레이어).

### H. 마케팅용 OG 이미지 (1200×630)
- `og/cubelist-pc.png` — PC 편집기 화면 합성
- `og/cubelist-mobile.png` — 거치된 폰 합성
- `og/cubelist-pack.png` — 마켓플레이스용

### I. 디바이스 프리뷰 일러스트 (선택)
StreamDeck의 디바이스 카탈로그 같은 컨셉. 우리는 "거치된 폰 + PC + 다양한 폰 사이즈" 3종.

---

## 비-제작 자산 (코드/엔지니어링이 처리)

- 큐브팩 메타 JSON 템플릿 → 엔지니어링
- 큐브 그리드 셀 보더/그림자 → CSS 변수
- 다국어 문자열 → i18n 트랙
- 큐브 애니메이션 (hover/press) → CSS/Framer Motion

---

## 산출 형식 가이드

| 항목 | 형식 |
|---|---|
| 앱 아이콘 | `.ico` + `.icns` + `.png` (multi-size) |
| 큐브/액션 아이콘 | `.png` 144×144 + `.svg` 원본 |
| 인디케이터 | `.svg` 단색 24×24 |
| 카테고리 | `.svg` 24/48px |
| 일러스트 | `.png` 또는 `.webp` 2000px+ |
| OG | `.png` 1200×630 |

배치 경로 제안:
```
cubelist/apps/pc-version/icons/         (앱·트레이)
cubelist/assets/cubes/                  (코어 큐브 아이콘)
cubelist/assets/categories/             (카테고리)
cubelist/assets/seeds/                  (빌트인 시드)
cubelist/assets/onboarding/             (일러스트)
cubelist/assets/og/                     (마케팅)
```

---

## 일정 동기화

| M | 필요 자산 | 사용자 제작 마감 |
|---|---|---|
| M2 진입 | P0 (A·B) | M1 종료 시 |
| M3 진입 | P1 (C·D) | M2 종료 시 |
| M6 진입 | P2 (E·F) | M5 종료 시 |
| M5/M9 | P3 (G·H·I) | M8 종료 시 |

자산 미제작 시 = **자리채우기 SVG로 진행하되 시각 디버그 마커 유지**. 출시 전 P0~P2 모두 교체 필수.
