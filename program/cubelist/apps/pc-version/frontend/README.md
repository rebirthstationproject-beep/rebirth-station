# 큐브 리스트 — PC 편집기 (frontend)

리버스 스테이션 · 큐브 리스트 · PC 데스크톱 풀창 편집기 (Tauri WebView 호스트).

## 위치

`apps/pc-version/frontend/` — Vite + React + TypeScript 셸. Tauri (`../src/`) 가 이 디렉토리의 빌드 산출물을 WebView2 로 로드.

## 진행 단계 (M1 ~)

- **M1 (현재 — 셸 완료)**: 3-패널 레이아웃 (좌 카테고리 / 중 그리드 / 우 인스펙터) + 상단 큐브팩 탭 + 하단 플러그인 라이브러리
- M2: `.cubepack` 로드/저장 + 드래그&드롭 (`@dnd-kit`)
- M3: 액션 시스템 트레이트 + 인스펙터 스키마 동적 폼
- M4: 플러그인 라이브러리 + PropertyInspector 임베드
- M5: 모바일 PWA ↔ PC 동기화
- M6: 카테고리 시드 카탈로그 연결
- M7: 폴더 + 페이지 + 멀티액션

## 개발 실행

```powershell
# 1. 의존성 설치 (최초 1회)
cd apps\pc-version\frontend
npm install

# 2. 개발 서버
npm run dev          # http://127.0.0.1:3002

# 3. Tauri 측에서 (별도 터미널)
cd apps\pc-version
cargo tauri dev      # devUrl = http://127.0.0.1:3002 로 변경 필요 (tauri.conf.json)
```

## 빌드

```powershell
npm run build        # dist/ 산출
```

Tauri `frontendDist` = `frontend/dist`.

## 의존성 정책

- `react`, `react-dom`: ^18
- 추후 추가 (M2~): `@dnd-kit/*` (드래그&드롭), `zustand` (상태), 모바일 PWA 와 같은 버전 유지
- 스타일: 일반 CSS (M2 결정 시 Tailwind 도입 검토)
- 코드 공유 패키지(`packages/cube-ui-shared/`) = M2 architect 결정

## 디자인 토큰

`src/styles.css` 의 `:root` 변수.
브랜드 컬러는 **리버스 스테이션 브랜드 세션 결정 대기 중** ([memory: feedback_rebirth_station_color_policy]).
그때까지 코어 무채색 톤만 사용. 핑크/액센트 컬러 사용 금지.
