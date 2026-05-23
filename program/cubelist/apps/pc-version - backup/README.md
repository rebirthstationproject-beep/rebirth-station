# 큐브 리스트 PC 헬퍼 (Tauri v2)

리버스 스테이션 (Rebirth Station) · 큐브 리스트 (Cube List) — Windows-first 데스크톱 앱.

## 책임

- WebView2 호스트 — `apps/web` (`http://localhost:3001/list`) 렌더링
- 시스템 트레이 (좌클릭 = 창 토글, 우클릭 = 메뉴)
- localhost WebSocket 서버 (`127.0.0.1:23456`) — 모바일 PWA ↔ PC 단축키·매크로 브리지 (Phase W2+)
- 전역 핫키 등록 (`~/.cubelist/hotkeys.json`)
- autostart 플러그인 (사용자 토글)

## 첫 실행

전제: Visual Studio Community 2022 (MSVC 14.44+), Rust 1.95.0+, `cargo tauri-cli` 설치 완료.

```powershell
# 1. apps/web dev 서버 (별도 터미널)
cd apps\web
npm install
npm run dev   # http://localhost:3001 리스닝

# 2. PC 헬퍼 GUI 빌드 + 실행
cd apps\pc-helper
cargo tauri dev
```

성공 시:
- 데스크톱 윈도우 480×720 표시 (WebView2가 `/list` 로드)
- 트레이 아이콘 등록
- 콘솔에 `리스닝 시작: 127.0.0.1:23456` 로그

실행 파일 (debug):
- `target/debug/cubelist-pc-helper.exe`

릴리스 빌드:
- `cargo tauri build` → `src-tauri/target/release/bundle/{msi,nsis}/...`

## Feature 분기

| feature | 동작 |
|---|---|
| `gui` (default) | Tauri 윈도우 + 트레이 + WS 서버 + 핫키 |
| 없음 (`--no-default-features`) | CLI 모드, WS 서버만 |

`Cargo.toml`의 `default = ["gui"]` 결정 사유: 사용자 일반 시나리오 = GUI 진입. CLI 모드는 헤드리스 서버 fallback 전용.

## Tauri 2.x 진입 정착본 (2026-05-23)

빌드 첫 시도 시 마주친 항목 — 향후 갱신 시 참조:

1. **`Emitter` trait import**
   - `lib.rs` / `tray.rs` 모두 `use tauri::{Emitter, Manager};` 필수
   - Tauri 1.x `Manager::emit_all` 폐기 → 2.x는 `Emitter::emit` 전용

2. **autostart 플러그인**
   - `tauri.conf.json` `plugins.autostart`에 객체 두면 `invalid type: map, expected unit` 런타임 실패
   - 설정은 Rust `tauri_plugin_autostart::init(LaunchAgent, Some(vec!["--minimized".into()]))`만 사용
   - `tauri.conf.json` `plugins = {}` 비움

3. **icons 5종 필수**
   - `icons/32x32.png` · `icons/128x128.png` · `icons/128x128@2x.png` · `icons/icon.ico` · `icons/icon.icns` (mac은 더미 OK)
   - `icons/tray.png` (트레이용, 32×32 권장)
   - 누락 시 `cargo tauri build` 단계에서 즉시 fail

자세한 트러블슈팅 = `docs/desktop-app-setup.md`.

## WS 서버 핸드셰이크 (Phase W2 정착본)

- Origin 화이트리스트: `https://주소모아.com`, `tauri://localhost`
- HMAC + nonce + ±30s 타임스탬프 + 재사용 캐시 (최근 100개)
- 페어링: Supabase Auth 세션 + QR 2-factor, `user_devices` 미등록 기기 차단

## 알려진 제약

- macOS 빌드: Phase 2 이후 (Windows-only 1차)
- 코드 사이닝: EV 인증서 미보유 → SmartScreen 경고 노출 (Q2 진입 전 EV 발급 필요)
- 시크릿 저장: Windows Credential Manager (`keyring` crate), 평문 디스크 저장 금지

## 의존성

핵심 (`Cargo.toml`):

- `tauri` v2.11.2 + `tauri-plugin-{autostart,global-shortcut,shell}`
- `axum` + `tokio-tungstenite` (WS 서버)
- `enigo` (키·마우스, SendInput 기반)
- `hmac` + `sha2` (페어링)
- `keyring` (Windows Credential Manager)

금지: `inputbot` (AV 오탐), `windows-rs` 직접 호출.

## 상위 참조

- `E:\Claude-Workspace\jusomoa-list\CLAUDE.md` — 개발 트랙 정책
- `docs/tech-review.md` — 아키텍처 정착본
- `docs/desktop-app-setup.md` — 트러블슈팅 + 정착본
- `HANDOFF.md` — 현재 단계
