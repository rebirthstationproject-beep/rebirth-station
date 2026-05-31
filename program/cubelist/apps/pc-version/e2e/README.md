# 큐브 리스트 PC — E2E 테스트 (v0.1.3+)

## 설정

```powershell
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version\e2e

# 의존성 + 브라우저 설치 (1회)
npm install
npm run install:browsers
```

## 실행

```powershell
# 전체 테스트 (Vite dev 서버 자동 기동)
npm test

# UI 모드 (디버깅 친화)
npm run test:ui

# 디버거 모드 (스텝별 정지)
npm run test:debug

# 리포트 보기 (실행 후)
npm run test:report
```

## 테스트 파일

- `tests/smoke.spec.ts` — 핵심 화면 표시 + 마켓플레이스 + 전역 검색 + 인스펙터

## CI 통합

`.github/workflows/cubelist-pc-e2e.yml` 추가 시 자동 PR 검증 (별도 작업).

## Tauri WebDriver 통합 (v0.2 예정)

현재는 Vite dev 서버 (브라우저) 기반. v0.2 에서 Tauri WebDriver 통합으로 실 OS 액션도 검증 예정.

## 환경 변수

- `E2E_BASE_URL` — Vite dev URL 오버라이드 (기본 `http://127.0.0.1:3002`)
- `CI=true` — 재시도 2회 + workers 1 + HTML 리포트 자동
