# 큐브 리스트 — 현재 상태 (STATE)

> 매 세션 시작 시 여기부터. 마지막 갱신: 2026-05-23 (M0 완료 / 사용자 결정 D-01~03 영구화)

---

## 0. 핵심 결정 (영구) — `docs/05-decisions.md` 참조

- **D-01**: 두 트랙 분리 (모바일 PWA + PC 버전)
- **D-02**: 모노레포 위치 = `rebirth-station/program/cubelist/`
- **D-03**: 파일 포맷 `.cubeone v3` (ZIP 컨테이너) 유지
- **D-04**: PC 데스크톱 풀창 UI 위치 = `apps/pc-version/frontend/` (잠정)

---

## 1. 현재 디렉토리 (M0 완료 후)

```
E:\Claude-Workspace\rebirth-station\program\cubelist\
├── PROJECT.md
├── STATE.md                  ← 여기
├── docs/                     (01~05 + 향후 추가)
├── cubeone/                  ✅ 큐브 데이터 라이브러리 (이전 완료)
└── apps/
    ├── mobile-pwa/           ✅ 기존 jusomoa-list/apps/web (Next.js, ~70% 완성)
    ├── mobile-native/        ✅ Capacitor (이전 완료)
    ├── pc-version/           Rust/Tauri 헬퍼 (~25%) — PC 풀창 UI 신설 예정
    └── pc-version - backup/  사용자 백업본 (보존)
```

**잔여 정리 (다음 세션):**
- `jusomoa-list/apps/web/` 빈 디렉토리 (잠금 풀린 후 제거)
- `jusomoa-list/` 자체 — 큐브 리스트 자산 빠진 후 어떤 자산이 남는지 정리 (D-05 미결정)

---

## 2. 마일스톤 진행 보드 (D-01 결정 반영, 대폭 재작성)

| M | 이름 | 상태 |
|---|---|---|
| **분석/계획** | 보고서 4종 + 결정 로그 | ✅ 완료 (`docs/01-05`) |
| **M0** | 두 트랙 분리 + 자산 이동 | ✅ **완료** (2026-05-23) |
| M1 | PC 데스크톱 UI 신설 (Tauri 풀창) | 🔄 **진행 중** (셸 완료 / D-05 잠정 채택) |
| M2 | PC ↔ 모바일 PWA 코드 공유 패키지 (`packages/cube-ui-shared` 또는 의존성 X 결정) | ⏳ M1 진입 시 architect 호출하여 확정 |
| M3 | 액션 시스템 트레이트 표준화 + 코어 8종 | ⏳ M1 종속 |
| M4 | 플러그인 SDK v1 (`.cubeplugin`) | ⏳ M3 종속 |
| M5 | 모바일 PWA ↔ PC 페어링 검증 + 거치 모드 강화 | ⏳ M3 종속 |
| M6 | 카테고리 뷰 PC 적용 (모바일은 이미 있음) | ⏳ M1 종속 |
| M7 | 폴더(서브덱) + 페이지 + 멀티액션 (PC 우선) | ⏳ M3 종속 |
| M8 | i18n 동기화(한/영/일) + Tauri Updater + EV 사이닝 | ⏳ M1~M7 종속 |
| M9 | 베타 출시 (PC + 모바일 동시) | ⏳ M8 종속 |

**중요 정정**: `docs/01-status-gap.md` / `docs/02-roadmap.md` 의 일부 진단이 틀렸음 — 큐브 리스트는 **모바일 PWA로 ~70% 이미 완성**되어 있음 (`apps/mobile-pwa/components/cube/*` 13 파일 ~340 KB, `/api/cubeone v3` 가동, `/seeds` 카탈로그 + SeedEntry 타입 + 다국어 ko/en/ja 등). 재작성 필요.

---

## 3. M0 완료 산출물

1. ✅ 모바일 PWA 자산 이동: `jusomoa-list/apps/web` (15 항목 + `.next` + `node_modules`) → `cubelist/apps/mobile-pwa`
2. ✅ 모바일 네이티브 이동: `jusomoa-list/apps/mobile` → `cubelist/apps/mobile-native`
3. ✅ 큐브 데이터 이동: `jusomoa-list/cubeone` → `cubelist/cubeone`
4. ✅ `docs/05-decisions.md` 결정 영구화 (D-01~04)
5. ⚠️ 잔여: 빈 `jusomoa-list/apps/web` 디렉토리 (잠금으로 디렉토리만 남음)
6. ⏸ 추가 결정 필요: `supabase/`, `scripts/`, `docs/`, `e2e/`, `data/`, `input/` 이전 여부 — D-05

---

## 4. M1 — PC 데스크톱 UI 신설 (진행 중)

### 잠정 결정 (D-05, 사용자 확정 대기)
- UI 프레임워크: **Vite + React + TypeScript**
- 모바일 PWA 공유: M1 = X, M2 architect 호출 시 재결정
- Tauri 윈도우: **1-window 풀창 1280×800**, 트레이 최소화

### 셸 완료 산출물 (`apps/pc-version/frontend/`)
- `package.json` · `vite.config.ts` (port 3002) · `tsconfig.json`
- `index.html` · `src/main.tsx` · `src/App.tsx` (3-패널 레이아웃 셸)
- `src/styles.css` (코어 무채색 토큰)
- `README.md` (개발 실행 + M2~M7 단계 표기)
- `tauri.conf.json` 갱신: devUrl → 127.0.0.1:3002, frontendDist → frontend/dist, window 480×720 → 1280×800, label "editor"
- CSP `connect-src` 에 127.0.0.1:3002 추가

### 첫 실행 검증 (사용자 또는 다음 세션)
```powershell
# 1. frontend 의존성 설치
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version\frontend
npm install

# 2. frontend dev 서버
npm run dev      # http://127.0.0.1:3002 셸 확인

# 3. Tauri 측 (별도 터미널)
cd ..
cargo tauri dev  # 1280×800 윈도우에 frontend 로드 확인
```

### M1 남은 작업
- [ ] frontend 의존성 설치 + 단독 dev 서버 확인 (npm install)
- [ ] Tauri dev 통합 확인 (cargo tauri dev로 1280×800 셸 표시)
- [ ] 트레이 클릭 → editor 윈도우 토글 동작 확인 (tray.rs 기존 코드 호환성)
- [ ] 셸 시각 OK → architect 호출 → M2 진입

### M2 진입 전 D-05 확정 필요 항목
1. UI 프레임워크 최종 확정 (현재 Vite+React 잠정)
2. 모바일 PWA 코드 공유 = packages/cube-ui-shared/ vs 완전 분리
3. Tailwind CSS 도입 여부 (현재 일반 CSS)
4. `@dnd-kit` · `zustand` 의존성 추가 (M2 진입 시)

---

## 5. 솔직한 사용자 보고 (이전 보고서 정정)

> 본 세션 시작 시 `jusomoa-list/CLAUDE.md` 와 `apps/web/` 정밀 검토를 안 했음.
> 그 결과 `docs/01-status-gap.md` 에 "편집기 UI 0% / 파일포맷 미정의" 라는 **잘못된 진단** 기재됨.
>
> 실제: 모바일 PWA = ~70%+ 완성 (인스펙터 59 KB · 매크로 에디터 26 KB · 그리드 + 표 + 검색 + 임포트 + 카테고리 시드 + 다국어 ko/en/ja).
>
> 사용자 메시지 (2026-05-23) "모바일 PWA / PC 두 트랙 분리" 받고 정정 완료. M0 = 분리 이동 = 완료.
> docs/01·02 의 잘못된 부분은 다음 doc-updater 호출 시 정정 예정.

---

## 6. 일일 진행 매뉴얼

```
1. 새 세션 진입 → STATE.md 읽음
2. "마일스톤 진행 보드" 의 ⏳ 첫 항목 확인
3. M1 진입 시 = architect 호출 → D-05 (UI 프레임워크/공유 전략/창 모드) 결정
4. 사용자 결정 받음 → docs/05-decisions.md 에 D-05 추가
5. planner 호출 → 당일 태스크 도출
6. 각 태스크 완료 → STATE.md 마일스톤 보드 갱신
```
