# 큐브 리스트 — 결정 로그 (Decisions)

> 영구 결정 사항. 변경 시 새 항목으로 추가하고 이전 결정은 "Superseded by Dxx" 로 표기.

---

## D-2026-05-23-01 — 두 트랙 분리 (영구·비협상)

**결정**: 큐브 리스트는 **모바일 PWA 버전**과 **PC 버전** 두 트랙으로 분리. 둘 다 필요.

**Why**:
- 사용자 명시 (2026-05-23): "개발 된 부분이 모바일 PWA 버전이라면 일단 개발 된 부분은 따로 모바일 PWA 버전으로 분리. PC 버전은 스트림덱과 동일한 방향으로 추가 개발 진행"

**How to apply**:
- 기존 `jusomoa-list/apps/web` (Next.js · 14 페이지 · 컴포넌트 13종 · ~340 KB) = **모바일 PWA 트랙**
- 기존 `jusomoa-list/apps/mobile` (Capacitor) = **모바일 네이티브 트랙** (PWA를 네이티브 래퍼로 감싸기)
- `rebirth-station/program/cubelist/apps/pc-version` (Rust/Tauri 헬퍼) = **PC 버전 트랙** (StreamDeck 동등 풀창 UI 신규 추가)
- 두 트랙은 독립 빌드/배포, 같은 파일 포맷 (`.cubeone v3` ZIP) + 같은 백엔드(Supabase) 공유

**Supersedes**: 이전 보고서 `docs/01-status-gap.md` 의 "PC 메인 격상" 제안 (D1=A 권장). 부분 폐기 — PC 메인은 PC 트랙 한정, 모바일 PWA는 그대로 모바일 메인 모드.

---

## D-2026-05-23-02 — 모노레포 통합 위치 (영구)

**결정**: 큐브 리스트 모노레포는 `rebirth-station/program/cubelist/` 하위에서 운영. 기존 `jusomoa-list/apps/*` 자산은 이쪽으로 분리 이전.

**디렉토리 구조 (영구)**:
```
E:\Claude-Workspace\rebirth-station\program\cubelist\
├── PROJECT.md
├── STATE.md
├── docs/                  공통 문서
├── cubeone/               큐브 데이터 라이브러리 (jusomoa-list/cubeone에서 이전)
├── apps/
│   ├── pc-version/        ← PC 트랙 (Rust/Tauri 헬퍼 + 신규 데스크톱 풀창 UI)
│   ├── mobile-pwa/        ← 모바일 PWA 트랙 (jusomoa-list/apps/web에서 이전)
│   └── mobile-native/     ← 모바일 네이티브 트랙 (jusomoa-list/apps/mobile에서 이전, Capacitor)
├── index.html             SEO 랜딩 (rebirthstation.com)
├── og/, blog/, ...        마케팅 페이지
```

**Why**: 두 트랙이 같은 파일 포맷·백엔드·디자인 토큰을 공유. 단일 워크스페이스에서 동기 관리 필요.

**How to apply**:
- 본 결정 시점에 apps/web, apps/mobile, cubeone 이동 실행
- supabase/, scripts/ 는 추가 결정 필요 (둘 다 큐브 리스트 + 주소모아 본체 공유 가능성 검토)

---

## D-2026-05-23-03 — 파일 포맷 v3 채택 (확인)

**결정**: `.cubeone` = ZIP 컨테이너 `{ manifest.json, icon.webp }` v3 포맷 유지.

**Why**: 이미 `/api/cubeone/route.ts` (현 `apps/mobile-pwa/app/api/cubeone/route.ts`) 에서 가동 중. 변경 사유 없음.

**How to apply**:
- `.cubeone` v3 그대로 유지
- `.cubelist` (탭 1개 = 큐브 묶음) + `.cubepack` (앱 1개 = 리스트 묶음) 스펙 = v3 호환 ZIP 으로 확장 정의 (M1)
- PC 버전 Rust 측에 v3 호환 I/O 라이브러리 신규 추가

---

## D-2026-05-23-05 — M1 PC UI 기술 결정 (잠정 채택)

**결정 (잠정, 사용자 확정 대기)**:
- **UI 프레임워크**: Vite + React + TypeScript
- **모바일 PWA 코드 공유**: M1 단계 = X (셸은 독립), M2 단계에서 architect 호출로 `packages/cube-ui-shared/` 도입 여부 재결정
- **Tauri 윈도우 모드**: 1-window 풀창 (1280×800, resizable). 편집기 = 메인 모드. 트레이로 최소화. 러너 모드(소형 창)는 M5 별창 추가
- **스타일**: 추후 Tailwind 또는 CSS Modules — M1 셸 단계는 일반 CSS

**Why**:
- Hook 진행 조건 + 사용자 명시 권한("PC 버전 = StreamDeck 방향으로 추가 개발 진행")
- Vite + React = 모바일 PWA와 같은 React 생태계 → M2에서 컴포넌트 공유 옵션 열림
- 1-window = StreamDeck 동등 + Tauri 윈도우 관리 단순화

**되돌리기**:
- 사용자가 다르게 결정 시 `apps/pc-version/frontend/` 폐기 후 새 셸 (보일러플레이트만 있어 폐기 비용 작음)

**다음**: M2 진입 시 architect 호출 → 코드 공유 전략 + 디자인 토큰 표준화 확정

---

## D-2026-05-23-04 — PC 트랙 UI 위치 (잠정)

**결정**: PC 버전 데스크톱 풀창 UI는 `apps/pc-version/` 내부에 신설 (모바일 PWA와 코드 분리).

**잠정 사유**: 사용자 결정 "PC 버전 = 스트림덱 동일 방향" 명시 + 모바일 PWA와 UI/UX 패턴 다름 (480×720 vs 1280×800+, 모바일 터치 vs 데스크톱 마우스+키보드).

**구조 (잠정)**:
```
apps/pc-version/
├── Cargo.toml           Rust 백엔드
├── src/                 (현재 25%)
├── src-tauri/           Tauri 설정 (현재 tauri.conf.json)
├── frontend/            ← 신규: Vite + React (또는 별도) StreamDeck 동등 풀창 UI
└── icons/
```

**대안 검토 필요 (M0 종료 후)**:
- 옵션 A: pc-version 안 frontend/ 신설 (위와 같음)
- 옵션 B: 별도 `apps/pc-desktop/` 디렉토리 (Tauri 백엔드와 분리)
- 옵션 C: mobile-pwa 코드 일부 공유 (`packages/cube-ui-shared/`)

옵션 A 잠정 채택. M1 진입 시 architect 호출하여 확정.

---

## 미결 결정 (사용자 추가 결정 필요)

### D? — supabase/ 디렉토리 위치
- 현재: `jusomoa-list/supabase/` (마이그레이션 + Edge Functions)
- 후보 A: `cubelist/supabase/` 로 이전 (큐브 리스트 전용)
- 후보 B: 별도 `rebirth-station/supabase-shared/` (주소모아·큐브 리스트 공유)
- 후보 C: 현재 위치 유지

**임시**: 현재 위치 유지 (변경 안 함).

### D? — scripts/ + docs/ + cubeone-tools
- 현재: `jusomoa-list/scripts/` (validate-plugin-manifests.mjs, mirror, refresh 등)
- 큐브 리스트 전용으로 보임 → 함께 이전 필요
- M0 종료 후 결정.

### D? — `jusomoa-list/` 디렉토리 잔여물 정리
- 큐브 리스트 자산이 빠진 후 `jusomoa-list/`에는 무엇이 남는가?
- 사용자 영구 메모리 `feedback_terminology_list`: "jusomoa-list" = 레거시 디렉토리명, 사용 금지
- M0 종료 후 디렉토리 자체 처분 결정.
