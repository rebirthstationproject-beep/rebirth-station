# Changelog — 큐브 리스트 PC 트랙

본 파일은 PC 트랙 (`apps/pc-version/`) 버전 변경 이력. 모바일 PWA / 네이티브 트랙은 별도.

형식: [Keep a Changelog](https://keepachangelog.com/) · 버전 [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

(다음 릴리즈 예정 변경 — D-06 (Updater 엔드포인트) + D-07 (EV 사이닝) 결정 후 v0.1.0 → v0.1.1)

---

## [0.1.0] — 2026-05-24 (베타)

자동 진행 cron 사이클 #1 ~ #24 종합. M0~M8 핵심 9 마일스톤 산출.

### Added (신규)

**파일 포맷**
- `.cubeone` v3 ZIP 컨테이너 호환 (모바일 PWA spec.ts 와 동등)
- `.cubelist` / `.cubepack` v3 인코딩/디코딩 (`src/lib/cubepack-io.ts`)
- `.cubeplugin` v1 ZIP 컨테이너 (`docs/specs/cubeplugin.md`)
- 샘플 플러그인 `com.rebirthstation.system.openapp.cubeplugin`

**편집기 UI (PC frontend, Vite + React + TypeScript)**
- 3-패널 셸 (카테고리 사이드바 / 큐브 그리드 / 인스펙터) + 상단 큐브팩 탭 + 하단 플러그인 라이브러리 자리
- 1280×800 풀창 (Tauri editor window)
- 코어 무채색 디자인 토큰 (`feedback_rebirth_station_color_policy`)
- 큐브 그리드 @dnd-kit/sortable 드래그 reorder + sort_order 사이값 보간
- TopBar: 가져오기 / 내보내기 / + 플러그인 / 설정 / LocaleSwitcher
- 다중 리스트 탭 + zustand store
- Inspector: 라벨 + 액션 타입 select (빌트인 10 + 플러그인 동적) + 동적 payload 폼 + 테스트 실행 / 삭제 버튼

**데모 시드**
- `lib/demo-pack.ts` — 생산성/미디어 2 리스트 (Anthropic / GitHub / 복사 / MediaPlayPause)

**액션 시스템 (M3)**
- frontend `lib/actions/` 10 spec (link / shortcut / macro / folder / text_insert / clipboard_copy / app_launch / focus_window / mouse_click / plugin_action)
- ActionSpec: id · label · description · tier (1/2/3) · category (7종) · defaultPayload · schema · validatePayload
- 동적 payload 폼 (8 field 타입: text / url / textarea / number / checkbox / select / string-list / json)
- Rust `ActionPayload` 10 variant + `guard` 10 validate (위험 경로 / payload 크기 / 좌표 범위)
- Rust 9 OS impl: link · shortcut · macro · clipboard_copy · text_insert · app_launch · focus_window · mouse_click + folder UI no-op
  - arboard (클립보드 크로스 플랫폼) + enigo (키/마우스) + windows-sys (Windows 창 관리)
- Tauri `execute_cube` invoke + frontend `tauri-bridge.ts` (isTauri 감지 + 한글 에러 메시지)

**플러그인 SDK (M4)**
- Rust `plugins/loader.rs` — installed_dir + list_installed + install_zip + ZIP traversal 2단계 방어
- manifest action_type 10 enum 화이트리스트 + schema/description/tier/icon_ref/category 옵셔널
- Tauri invoke `list_plugins` / `install_plugin`
- frontend `lib/plugin-registry.ts` zustand + qualified_id 라우팅
- `execute_plugin_action` Box::pin async 재귀 + 무한 재귀 방지 + action_id fallback
- manifest.sig hook (v1 = 검증 시도 후 경고만, v2+ = 강제 거부 예정)
- 빌드 도구 `scripts/build-sample-plugin.mjs`

**모바일 PWA 호환 (M5)**
- Wire 12 영역 호환 검증 (PROTOCOL_VERSION / Hello / PressItem / PressKind / MouseButton / PairingPayload / ActionPayload 10 enum)
- `plugin_action.action_id` 옵셔널 추가 (모바일 PWA + Rust fallback)
- `docs/06-wire-compat.md` 정착 문서

**카테고리 카탈로그 (M6)**
- ActionCategory 7종 (생산성 / 미디어 / 개발 / 디자인 / 게이밍 / 시스템 / 웹)
- Sidebar 3섹션 (카테고리 필터 + 빌트인 N + 플러그인 N) + 1클릭 큐브 추가
- 빌트인 9/10 매핑 + 플러그인 manifest.category 옵셔널

**폴더 + 페이지 + 멀티액션 (M7)**
- 폴더(서브덱) `current_folder_id` + folder_stack (다중 깊이) + visibleCubes 자동 격리 + "📁" prefix + 더블클릭 진입 + "↩ 상위" 브레드크럼
- 페이지네이션 `cubes_per_page` + current_page + ◀/▶ + "N/M" 인디케이터
- MacroStepEditor 5 step 종류 비주얼 폼 (key / click / delay / launch_app / focus_window)
- macro 의 sub-feature 로 멀티액션 처리 (별도 enum 미신설, StreamDeck multi_action 등가)

**i18n + Updater (M8)**
- `lib/i18n/` — Locale ko / en / ja + MessageKey 28 키 + 사전 풀세트 + detectLocale (navigator.language)
- I18nProvider + useTranslation hook + localStorage `cubelist:locale` 영속 + `<html lang>` 동기
- LocaleSwitcher (TopBar 우측 KO|EN|JA 3-state)
- 라벨 24 키 t() 교체 (TopBar 7 + Sidebar 6 + GridArea 4 + Inspector 7)
- Tauri `createUpdaterArtifacts: true` (자동 매니페스트 생성)

**문서 (`docs/`)**
- 01-status-gap.md (현황 + 정정 사실)
- 02-roadmap.md (M0~M9 로드맵)
- 03-agents.md (마일스톤 × 에이전트 매트릭스)
- 04-user-assets-todo.md (사용자 직접 제작 자산)
- 05-decisions.md (D-01~05 영구 결정)
- 06-wire-compat.md (모바일 PWA ↔ PC wire 호환 정착)
- 07-release-checklist.md (베타 릴리즈 8 항목 체크)
- specs/cubeplugin.md (포맷 v1)
- PROJECT.md / STATE.md (단일 진입점 + 마일스톤 보드)

### Changed (변경)

- Rust `plugins/manifest.rs RequestedPermission` rename ("tier_1" 명시) — 사전 결함 정정
- Rust `protocol/messages.rs` PressItem 테스트 fixture 누락 `action` 추가 — 사전 빌드 차단 해소
- `tsconfig.json noEmit: true` + `build = "tsc --noEmit && vite build"` — tsc 부산물 src/ 오염 차단
- `.gitignore` 보강: target/ *.pdb *.rlib src-tauri/target/ gen/schemas/ *.tsbuildinfo

### Removed (제거)

- `src/**/*.js` tsc 부산물 (cron #3 untrack)

### Security

- ZIP 경로 traversal 2단계 방어 (`..` / `/` / `\\` prefix 차단 + canonicalize 외부 탈출 재확인)
- AppLaunch 위험 경로 차단 (cmd.exe / powershell / wscript / cscript / regsvr32 / mshta / /bin/sh / /bin/bash)
- HMAC + nonce + ±30s + Origin 화이트리스트 (LAN WS, 모바일 PWA 측 정착)
- Tier 1/2/3 권한 등급 (안전 / 동의 / 영구토글)

### Known Limitations

- Ed25519 서명 검증 = placeholder (v2+ 활성)
- LAN WS 클라이언트 (PC frontend 비-Tauri 경로) = dev plus-feature, M5+ 미도입
- PropertyInspector iframe 임베드 = .cubeplugin v2 (inspector/ runtime/ 활성 시점)
- 모바일 PWA 시드 카탈로그 PC 이식 = nice-to-have
- E2E 자동화 (Playwright + Tauri WebDriver) = v1.0 전 도입 권장
- macOS 빌드 = Phase 2 (현재 Windows-only)

### Decisions (영구)

- D-01: 두 트랙 분리 (모바일 PWA + PC 버전)
- D-02: 모노레포 위치 = `rebirth-station/program/cubelist/`
- D-03: 파일 포맷 `.cubeone v3` ZIP 컨테이너 유지
- D-04: PC UI 위치 = `apps/pc-version/frontend/`
- D-05: PC 기술 = Vite + React + TS, Tauri 1-window 1280×800

### Pending Decisions

- D-06: Tauri Updater 엔드포인트 (GitHub Releases / Vercel / S3) + Ed25519 pubkey 생성
- D-07: EV 코드 사이닝 인증서 구매 시점 (베타 = 무서명 + SmartScreen 안내)
