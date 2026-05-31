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

## Tauri WebDriver 통합 (v0.1.3 사전 — 2026-06-01)

`tauri-driver.config.ts` + `tests/tauri/` 디렉토리 셋업 완료. v0.1.4 CI 통합 예정.

### 실행 (사용자 환경)

```powershell
# 최초 1회 — Rust 툴체인 + tauri-driver
cargo install tauri-driver --locked

# 1) Tauri 디버그 바이너리 빌드 (target/debug/cubelist)
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version
cargo tauri build --debug

# 2) 별도 터미널에서 tauri-driver 백그라운드 구동
tauri-driver

# 3) WebdriverIO 실행 (e2e/ 디렉토리)
cd e2e
npx wdio run tauri-driver.config.ts
```

### Tauri smoke 시나리오

`tests/tauri/smoke.spec.ts`:
1. 앱 기동 → `#root` 렌더링
2. TopBar "새 큐브팩" 버튼 클릭
3. "큐브 만들기" 탭 진입 → 인스펙터 label input 활성
4. label "Test Cube" 입력 → 저장 → 큐브 그리드 노출 확인

### v0.1.4 자동화 (CI)

- `.github/workflows/cubelist-pc-tauri-e2e.yml` 추가
- 매 PR 마다 `cargo tauri build --debug` + `tauri-driver` 자동 구동 + 시나리오 실행
- Linux runner: xvfb + WebKit2GTK
- macOS runner: WebKit
- Windows runner: WebView2

## 환경 변수

- `E2E_BASE_URL` — Vite dev URL 오버라이드 (기본 `http://127.0.0.1:3002`)
- `CI=true` — 재시도 2회 + workers 1 + HTML 리포트 자동
