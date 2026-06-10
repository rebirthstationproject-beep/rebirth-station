# 08 — 큐브 리스트 PC 품질 재설계 계획 (Stream Deck 동급화)

> 작성: Fable 5 직접 검토, 2026-06-10
> 근거: Stream Deck 실물 플러그인 분석(C:\Users\PC\Downloads\플러그인) + PC frontend 전수 검토
> 실행: 본 문서가 수정 에이전트의 권위 스펙. R1 → R2 → R3 순서 엄수.

---

## 0. 진단 요약 (왜 "어설퍼" 보이는가)

방향(포맷·타입·변환)은 건강하다. 문제는 UI 실행 계층 4가지다.

| # | 문제 | 근거 위치 |
|---|---|---|
| P1 | **라이브 큐브 렌더 우선순위 뒤집힘** — `icon_url` 있으면 정적 아이콘이 LiveCubeVisual을 덮음. 변환 큐브는 전부 아이콘 보유 → 시계가 멈춰 보임 | `App.tsx:800` `(!hasIcon \|\| isPlaceholderIcon)` 조건, `App.tsx:2104` 동일. 커밋 6a89c77 "icon 우선"의 부작용 |
| P2 | **라이브 시스템 이중 구현** — `useDynamicCubes`(중앙 1초 tick registry) + `LiveCubeVisual`(컴포넌트별 setInterval) 동시 가동. 포맷 표기도 불일치('HH:MM' vs 'HH:mm') | `lib/useDynamicCubes.ts` vs `components/LiveCubeVisual.tsx` |
| P3 | **라이브 데이터 가짜** — monitor/gauge=sin 파동, network=random, weather/stock=정적 payload. Tauri 실측 없음 | `LiveCubeVisual.tsx:234,294,384` |
| P4 | **셀 렌더러 2벌 중복 + 모놀리스** — `CubeMakerCenter` 내 inline 셀(App.tsx:765~837)과 `SortableCubeCell`(App.tsx:2004~2151)이 같은 분기 로직 복제. 이미 회귀 2회 유발(6a89c77, e45604d). App.tsx 2,291줄. `_LegacySidebar` 죽은 코드. `DEFAULT_LIBRARY_DIR` 개인 경로 하드코딩(App.tsx:126) |

Stream Deck 대비 시각 격차의 직접 원인:
- SD 키 = **아이콘 풀블리드 + 선택적 타이틀 오버레이, 그 외 0**. 우리 셀 = 아이콘 + 라벨 + `action_type` 원문 배지("live_clock", "plugin_action") 3층 노출 = 개발자 용어 노이즈.
- SD 디스플레이 키는 **항상 살아 있음**(시계는 무조건 움직임). 우리는 P1 때문에 죽어 보임.

---

## R1 — 구조 안정화 (회귀 방지 기반) ★ 최우선

### R1-1. CubeCell 단일 컴포넌트 추출
- 신규 `src/components/CubeCell.tsx`: 셀 비주얼 전체(아이콘 분기 + 라이브 + placeholder + 라벨 + 상태 클래스)를 단일 컴포넌트로.
- props: `cube`, `selected?`, `selectionIndex?`, `invalid?`, `dragHandleProps?` 등 — 비주얼은 한 곳, 동작(클릭/드래그/컨텍스트메뉴)은 호출부 유지.
- `CubeMakerCenter` inline 셀과 `SortableCubeCell` 양쪽이 이걸 소비. **분기 로직 복제 0이 완료 조건.**
- 셀 관련 인라인 스타일을 `styles.css` 클래스로 이동 (기존 무채색 토큰 사용, 신규 컬러 금지 — memory: feedback_rebirth_station_color_policy).

### R1-2. 라이브 렌더 우선순위 반전 (P1 해소)
- 규칙: `action_type`이 `live_*`면 **무조건 LiveCubeVisual 렌더**. 아이콘은 폴백이 아니라 옵트인.
- 정적 아이콘을 원하는 경우만 `cube.metadata.live_static_icon === true` 토글(인스펙터에 체크박스 "정적 아이콘 사용" 추가)로 아이콘 렌더.
- 6a89c77이 막으려던 회귀(heuristic 오매핑으로 일반 큐브가 live로 둔갑→아이콘 소실)는 **매핑 측에서 방어**: heuristic remap 시 원본 아이콘을 `metadata.original_icon_url`에 보존하고, 인스펙터에서 action_type을 비-live로 되돌리면 즉시 복원.

### R1-3. 라이브 tick 단일화 (P2 해소)
- 중앙 tick 1개: `useDynamicCubes`를 단일 소스로 유지·확장 (11종 live 전부 지원하도록).
- `LiveCubeVisual` 내부의 모든 `setInterval` 제거 → `now: number`(또는 tick 데이터)를 props로 받는 **순수 렌더러**로 전환.
- 그리드 컨테이너(CubeGrid / CubeMakerCenter)가 `useDynamicCubes` 한 번 호출 → 각 CubeCell에 전달.
- 시간 포맷 표기 'HH:mm' 계열로 통일 (기존 저장 payload 'HH:MM' 호환 파싱 유지).

### R1-4. 죽은 코드·하드코딩 정리
- `_LegacySidebar` 삭제 (사용처 0 확인 후).
- `DEFAULT_LIBRARY_DIR` 하드코딩 제거 → 설정(SettingsPanel)에서 라이브러리 폴더 지정. 미설정 시 자동 시도 없이 데모 팩.
- `dynamic-cube.ts`의 `liveGaugeTick`/`liveBatteryTick` SVG-via-icon_url 경로는 LiveCubeVisual 일원화 후 미사용이면 제거(라벨 tick만 유지).

### R1 검증
- `npm run build` 통과 + `cargo check` 통과.
- 수동 시나리오: live_clock 큐브(아이콘 있는 변환본 포함)가 그리드에서 초 단위로 움직임 / 일반 큐브 아이콘 그대로 / DnD·선택·컨텍스트메뉴 정상.

---

## R2 — 셀 시인성 재설계 (Stream Deck 동급)

### R2-1. 셀 정보 위계 (SD 모델)
- **아이콘 풀블리드**: `cube-icon-bg`가 셀 전체(정사각). 라운드 12~14px, 배경 `#0d0d0d` 통일.
- **라벨 = 하단 오버레이**: 셀 안 하단 그라데이션 스크림 위 1줄 ellipsis (SD 타이틀과 동일 위치). `title_style.show === false`면 숨김. 리스트 단위 "라벨 표시" 토글 제공(기본 ON — 링크모음 특성상 라벨 중요).
- **`action_type` 원문 배지 전면 제거**. 대체: 선택 시 인스펙터에 표시 + 셀 hover 툴팁 유지. live/폴더 등 구분이 필요한 것만 우상단 6px 점/글리프 (무채색).
- 검증 오류 dot, 선택 순번 뱃지는 유지하되 동일 좌표 체계(우상단/좌상단)로 정리.

### R2-2. placeholder 품질 통일
- 현행 3종 혼재(글자+그라데이션 / 생성 SVG 60% / 레터) → **1종 통일**: 무채색 다크 타일 + 중앙 글리프(생성 SVG) + 미세 노이즈 텍스처 없음. `labelToGradient` 컬러 그라데이션은 제거(무채색 정책).
- 생성 SVG는 `backgroundSize` 60% 고정이 아니라 글리프 비율 기반 중앙 배치.

### R2-3. 그리드 정돈
- 셀 크기 토큰화: `--cube-size`(기본 96px), `--cube-gap`(10px), `--cube-radius`(12px) — styles.css :root.
- "+ 새 큐브" 셀 / trail 빈 슬롯: onMouseEnter/Leave 인라인 opacity 조작 제거 → CSS `:hover`.
- 페이지 인디케이터·PageSizeGuide 시각 소음 축소(작게, 하단 고정 1줄).

### R2 검증
- 빌드 통과 + 스크린샷 비교용 데모 팩 렌더 확인(시계·타이머·링크·placeholder 혼합 리스트).

---

## R3 — 라이브 실데이터 (Tauri 백엔드)

### R3-1. Rust sysinfo 커맨드
- `Cargo.toml`에 `sysinfo` 추가 (feature 게이트 불필요, 읽기 전용).
- `src/commands.rs`에 `get_system_metrics` invoke 신설: `{ cpu_percent, ram_used_mb, ram_total_mb, disk_used_gb, disk_total_gb, network_rx_kbps, network_tx_kbps }` 1회 스냅샷.
- frontend `lib/system-metrics.ts`: 5초 폴링 zustand store (Tauri 환경에서만, 브라우저 dev는 placeholder 유지 + "DEV" 표기).
- `live_monitor`(cpu/ram/disk/network)와 `live_gauge`(source=cpu 등), `live_network`가 실측 소비. sin/random 코드 제거.

### R3-2. live_weather — Open-Meteo (무료·키 불필요)
- payload: `{ latitude, longitude, location_label }` (인스펙터 입력). `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,weather_code` 10분 캐시.
- weather_code → 글리프 매핑(맑음/구름/비/눈/뇌우/안개 6종). 오프라인/실패 시 마지막 값 + "—" 표시. fal.ai 불필요(자체 SVG — memory: feedback_fal_ai_external_info_only).

### R3-3. live_clock/alarm/timer — 이미 실데이터(시스템 시간). R1-3 단일 tick으로 충분.
### R3-4. live_stock / live_calendar / live_news — 이번 범위 제외 (소스 결정 대기). 셀에 "설정 필요" 상태 표기만 정직하게.

### R3 검증
- `cargo check` + `npm run build` + Tauri dev에서 CPU% 실측값 움직임 확인(가능 환경에서). 브라우저 dev 폴백 정상.

---

## R4 — 아이콘팩 (.cubeiconpack) [후속 — 이번 실행 제외, 스펙만 확정]

- SD 모델 채택: **기능과 아이콘 완전 분리**.
- `.cubeiconpack` = ZIP `{ manifest.json(id/name/author/version), icons.json(메타 배열), icons/*.svg|png, cover.png }` — `.streamDeckIconPack`(sdIconPack)과 1:1, 변환기는 리네이밍+manifest 변환 수준.
- 큐브 아이콘 해석 순서(영구): ① `icon_override`(사용자 지정, 아이콘팩 ref 또는 업로드) ② 임베드 `icon_url` ③ 생성 SVG ④ 레터 placeholder. live_* 큐브는 R1-2 규칙 우선.
- 인스펙터 아이콘 피커: 설치된 아이콘팩 브라우즈 + 검색.
- 라이선스: 기존 SD 아이콘팩 재배포는 라이선스 확인 필수(Entypo=CC BY-SA 등). 마켓 배포는 자체 제작 카탈로그 우선(icon-catalog-photoshop.ts 72종이 시작점).
- 마켓플레이스 Layer 3 상품군: 아이콘팩 = 독립 판매 단위.

---

## 공통 규칙 (에이전트 필수 준수)
1. 외과수술적 변경 — 본 계획 항목 외 리팩터·포매팅 금지.
2. 무채색 토큰만 사용. 신규 브랜드 컬러 도입 금지. 기존 `--bg-*`/`--text*`/`--border` 토큰 재사용.
3. 각 R 단계 완료 시 `npm run build`(frontend) + `cargo check`(pc-version) 통과 후 commit & push (specific path만 add).
4. 포맷/타입(`types/cube.ts`, `cubepack-io.ts`) 변경 시 모바일 PWA `lib/cube-format/spec.ts` 호환 유지 — 신규 필드는 전부 옵셔널.
5. i18n: 신규 사용자 노출 라벨은 `messages.ts` 3개 언어(ko/en/ja) 키 추가.
