# 09 — 플랫폼 역할 확정 + 상세 실행 로드맵 (2026-06-10)

> 사용자 확정 방향성 (영구, memory: project_cubelist_platform_roles):
> 1. **큐브 = 아이콘 임베드 온전한 1파일** (분리 관리 금지). 아이콘팩 = 리스트 스킨 일괄 적용만.
> 2. **라벨 표시 ON** + SD 플러그인 변환 시 자체 라벨·라이선스로 변형 (Elgato 라이선스 문제 사전 차단).
> 3. **PC** = 제작/관리/정리 특화 + 작동 페이지 필수 / **모바일** = 작동 메인 + 간단 URL 제작 + 파일→Supabase / **웹** = PC 동일 기능 → 리버스 가입 → 주소모아·케이링크 링크 큐브화 + 사이트 내 작동 페이지.

---

## 즉시 실행 (W1~W3 — 이번 라운드, PC 버전)

### W1 — PC 작동 모드 (Play Mode) ★ 핵심
PC 역할 = "제작 + **실질 작동 페이지**". 현재 편집기는 클릭=선택이라 작동 페이지가 없다.

- TopBar에 `▶ 작동` 토글(또는 MainTab 3번째 탭 'play') 신설 → **PlayMode 전체 화면**:
  - 현재 팩의 리스트 탭(상단, 최소 chrome) + 큐브 그리드.
  - **단일 클릭 = 즉시 실행**: 기존 `executeCube`/`fireCubeKey`(tauri-bridge) 재사용. folder 큐브 = 진입, page_navigate = 페이지 이동.
  - live_* 큐브는 중앙 tick으로 동작(R1-3 자산 재사용), 라벨 토글·show_labels 반영.
  - Tier 2/3 액션은 기존 동의 체계(ConsentDialog) 경유.
  - `Esc` 또는 우상단 ✕ = 편집 모드 복귀. 편집 기능(DnD/인스펙터/삭제) 전부 비노출.
  - 실행 결과 오류는 비차단 토스트(작동 흐름 끊지 않음).
- 브라우저 dev(비 Tauri): link 큐브만 window.open, 나머지는 "PC 앱 전용" 토스트.

### W2 — 리스트 스킨 (아이콘팩 일괄 적용)
- `스킨 적용` 버튼(리스트 컨텍스트 또는 grid-meta-actions): `.cubeiconpack` 또는 `.streamDeckIconPack` ZIP 선택.
- 파서: manifest.json + icons.json + icons/*.svg|png 읽기 (jszip 기존 의존성).
- 매칭(보수적): 큐브 라벨·sd_uuid 토큰 ↔ 아이콘 파일명/태그 정규화 비교. 미매칭은 변경 없음.
- 적용: `icon_url` 임베드 교체(data URL), 원본 `metadata.pre_skin_icon` 보존 + `metadata.skin_source` 기록.
- `스킨 해제`: pre_skin_icon 일괄 복원.
- 미리보기 다이얼로그: 매칭 N/전체 M 표시 + 적용/취소.

### W3 — SD 변환 라이선스 클린화
- plugin-converter / library-loader: 변환 산출 큐브에 `metadata.origin = 'streamdeck-conversion'` + CubePack.license = `'restricted'` 자동 마킹.
- 마켓 메타 에디터(MarketplaceMetaEditor): restricted 팩 → 배포 차단 + 안내문 "Stream Deck 변환 자산 포함 — 개인 사용 전용, 마켓 배포 불가" (i18n 3언어).
- 라벨: 변환 시 우리 컨벤션(한국어 우선 자체 라벨) 유지 — Elgato 고유 명칭은 보존하되 상표 표기는 메타로만.
- 자체 아이콘 카탈로그(icon-catalog-photoshop 등)로 교체 가능한 큐브는 추후 "클린 스킨" 제공 (W2 메커니즘 재사용).

### W1~W3 공통
- 외과수술적 변경 / 무채색 토큰 / 신규 타입 필드 전부 옵셔널(모바일 PWA spec 호환) / 신규 라벨 i18n ko·en·ja.
- 검증: npm run build + cargo check. 완료 시 단계별 commit (push는 부모 세션).
- **완료 후 사용자 직접 확인**: `cargo tauri dev` GUI 기동 → 작동 모드·라이브 큐브·스킨 체험.

---

## 다음 라운드 (이번 실행 제외 — 순서 고정)

### M-A. 모바일 (mobile-pwa) 정렬
1. 작동 페이지를 메인 화면으로 (제작 UI는 보조).
2. 간단 URL 큐브 제작(링크모음/북마크 수준)만 유지 — 고급 제작은 PC 유도.
3. `.cubepack`/`.cubelist` 파일 불러오기/저장 (1차 파일 기반).
4. 이후 Supabase 계정 동기화 (riverbirth 계정 = entitlement 기존 정책).

### M-B. 웹 "큐브 리스트" (리버스 스테이션 사이트)
1. PC frontend를 웹 빌드로 이식 (Tauri invoke 의존부 = capability 가드: link/clipboard만 웹 실행, 동적은 "PC 앱 연결" 표기 — docs/08 C-B2 3계층 모델).
2. 리버스 스테이션 가입/로그인 연동.
3. 파일 업로드 → 웹 작동 페이지 (개인 리스트 페이지의 원형).

### M-C. 3사 통합 (피벗 전략 본선, business-plans/cubelist-pivot-plan-2026-06-06.md)
1. 주소모아 모든 링크 = 큐브 교체 (1,431 변환분 활용).
2. 주소모아/케이링크 페이지에 큐브 리스트 작동 페이지 삽입 — 링크 외 큐브도 동일 사용(웹 제약은 3계층 모델).
3. 케이링크 복제 런칭 게이트(Phase 4)와 연동.
