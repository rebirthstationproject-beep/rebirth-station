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
| M1 | PC 데스크톱 UI 신설 (Tauri 풀창) | 🔄 셸+빌드 통과 / cargo tauri dev GUI 검증 사용자 대기 |
| M2 | 큐브팩 데이터 모델 + 다중 리스트 탭 + 인스펙터 + DnD + `.cubepack` I/O + 추가/삭제 | ✅ **주요 기능 완료** (v1·v2 호환 import 만 후속) |
| M3 | 액션 시스템 트레이트 표준화 + 코어 10종 + 인스펙터 동적 폼 | ✅ **완료** (9/9 액션 OS impl · plugin_action 만 M4 대기) |
| M4 | 플러그인 SDK v1 (`.cubeplugin`) | ✅ **완료** (spec + manifest + loader + invoke + frontend + Inspector + 설치 버튼 + PluginAction execute + 서명 hook + 샘플 ZIP) |
| M5 | 모바일 PWA ↔ PC 페어링 검증 + 거치 모드 강화 | ✅ **종결** (wire 12 영역 일치 + action_id fallback + 정착 문서 / LAN WS·거치=후속 plus-feature) |
| M6 | 카테고리 뷰 PC 적용 (모바일은 이미 있음) | ✅ **완료** (빌트인 10 + 플러그인 + 카테고리 필터 + manifest category) |
| M7 | 폴더(서브덱) + 페이지 + 멀티액션 (PC 우선) | ✅ **완료** (폴더 stack + 페이지네이션 + MacroStepEditor 5종 비주얼 폼) |
| M8 | i18n 동기화(한/영/일) + Tauri Updater + EV 사이닝 | ✅ **핵심 완료** (i18n + LocaleSwitcher + 24 라벨 t() + Updater 매니페스트) · Updater 엔드포인트·EV 사이닝=결정 대기 |
| M9 | 베타 출시 (PC + 모바일 동시) | 🔄 **준비 완료** (체크리스트 + CHANGELOG v0.1.0 + 버전 일치 ✅) · D-06/07 사용자 결정 + tauri build = 외부 단계 |

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
- [x] frontend 의존성 설치 ✅ (2026-05-24, npm install exit 0)
- [x] Vite 빌드 통과 ✅ (31 modules · gzip 47 KB JS + 1 KB CSS · 336ms)
- [x] M0+M1 commit & push ✅ (cron #1, commit `5a86d60`, 2,903 files / 73,338 lines, origin/main)
- [ ] Tauri dev 통합 확인 (cargo tauri dev로 1280×800 셸 표시) — cron 사이클 또는 사용자
- [ ] 트레이 클릭 → editor 윈도우 토글 동작 확인 (tray.rs 기존 코드 호환성)
- [ ] 셸 시각 OK → architect 호출 → M2 진입

### cron 사이클 #1 (2026-05-24) 산출물
- `.gitignore` 보강 (`target/` `*.pdb` `*.rlib` `src-tauri/target/` `src-tauri/gen/schemas/` `*.tsbuildinfo`) — target unstage 후 amend
- commit `5a86d60` push 성공 (oauth2:PAT URL 임시 방식, .git/config 무탑재 — `feedback_git_token_exposure` 준수)
- Tauri/Rust 빌드 캐시(`target/`) 12k+ 파일 제외 → 실 자산 2,903 파일

### cron 사이클 #2 (2026-05-24) 산출물 — M2 진입
- `apps/pc-version/frontend/`:
  - `package.json`: `@dnd-kit/core`·`sortable`·`utilities` + `zustand` 추가
  - `src/types/cube.ts`: Cube · CubeList · CubePack + action_type 10 enum (모바일 PWA 호환)
  - `src/store/editor.ts`: zustand 편집기 store (loadPack/selectList/selectCube/upsertCube/removeCube/reorderCubes)
  - `src/lib/demo-pack.ts`: 검증용 데모 큐브팩 (생산성·미디어 2 리스트)
  - `src/App.tsx`: useEffect 자동 시드 + 다중 리스트 탭 + 그리드/인스펙터 store 연결
  - `src/styles.css`: 큐브 셀 label·badge·빈 슬롯(점선)
- 빌드: 36 modules · gzip 48.75 KB JS + 1.25 KB CSS · 350ms
- commit `ffb0fdd` push 성공
- ⚠️ 정리 대상 (cron #3): tsc -b 산출 .js 부산물 (App.js/editor.js 등) 5개 — `.gitignore`에 `src/**/*.js` 추가 + `git rm --cached`

### cron 사이클 #3 (2026-05-24) 산출물
- `tsconfig.json`: `noEmit: true` (tsc 산출물 src/ 오염 차단)
- `package.json` build: `tsc -b && vite build` → `tsc --noEmit && vite build`
- `.gitignore` (rebirth-station 루트): Rust/Tauri `target/ *.pdb *.rlib src-tauri/target/ gen/schemas/`, TS `**/frontend/src/**/*.js *.tsbuildinfo`
- `src/App.tsx`: `SortableCubeCell` + `DndContext` + `SortableContext (rectSortingStrategy)` + `PointerSensor 4px` + `KeyboardSensor` + a11y attribute 분리 처리
- `src/styles.css`: `.cube-cell.is-dragging` 그림자
- 기존 `.js` 부산물 5개 untrack + 디스크 삭제
- 빌드: 40 modules · gzip 63.67 KB JS + 1.29 KB CSS · 463ms
- commit `1eb93b4` push 성공 (9 files, +98/-288)

### cron 사이클 #4 (2026-05-24) 산출물
- 의존성: `jszip ^3.10.1` + `@types/node` 추가
- `src/lib/cubepack-io.ts` 신설:
  · `exportCubepack(pack)` → v3 ZIP (3-레벨 중첩: cubepack → lists/*.cubelist → cubes/*.cubeone)
  · `importCubepack(blob)` → v3 디코딩 + `CubepackFormatError` 표준화
  · `downloadCubepack` → 브라우저 다운로드 + URL.revokeObjectURL
  · 모바일 PWA `spec.ts` 호환 매니페스트 (rbs_format_version 3, license, action_type 10 enum)
- `App.tsx TopBar`: 가져오기/내보내기 버튼 + 오류 alert
- 빌드: 44 modules · gzip 95.77 KB JS (jszip 포함) · 676ms
- commit `2528c0e` push 성공 (+479 lines, 4 files)

### cron 사이클 #5 (2026-05-24) 산출물 — M2 보완
- `App.tsx Inspector`: defaultValue → controlled value+onChange (라벨/액션 타입 양방향)
- 액션 타입 변경 시 `defaultPayloadFor(type)` 으로 payload 자동 초기화 (10 enum)
- "큐브 삭제" 버튼 + window.confirm
- `CubeGrid` 첫 빈 슬롯 onClick → `crypto.randomUUID` + `upsertCube` + `selectCube` (자동 포커스)
- styles.css: `.is-empty:hover` + `.btn-danger`
- 빌드: 44 modules · gzip 96.22 KB JS + 1.35 KB CSS · 691ms
- commit `d143d72` push 성공 (+100/-9, 2 files)

### cron 사이클 #6 (2026-05-24) 산출물 — M3 진입
- `src/lib/actions/` 신설 (12 파일): `types.ts` + 10 specs + `index.ts`
  · `ActionSpec`: id · label · description · tier(1~3) · defaultPayload · schema[] · validatePayload
  · `FieldSchema`: text · url · textarea · number · checkbox · select · string-list · json
- `src/components/ActionPayloadForm.tsx`: 스키마 기반 동적 필드 + Tier 배지 + 검증 inline 표시
- App.tsx Inspector: ACTIONS 자동 매핑 + ActionPayloadForm 임베드 + 중복 `defaultPayloadFor` 삭제
- styles.css: `.payload-form` `.tier-badge` `.payload-errors` `.field-hint`
- 빌드: 56 modules · gzip 98.30 KB JS + 1.58 KB CSS · 689ms
- commit `1ac8661` push 성공

### cron 사이클 #7 (2026-05-24) 산출물 — Rust 시그니처 정렬
- `protocol/messages.rs`: ActionPayload variant 7 추가 (Folder/TextInsert/ClipboardCopy/AppLaunch/FocusWindow/MouseClick/PluginAction) + `default_mouse_button` helper
- `actions/mod.rs`: dispatch 10 variant 완비 (신규 7종 = FeatureDisabled/PermissionRequired stub)
- `actions/guard.rs`: 7종 validate (folder/text/app_launch/focus_window/mouse_click/plugin_action) + 위험 경로/payload 크기 차단
- 검증: `cargo check --no-default-features` Finished dev 14.13s · exit 0
- commit `0c5db70` (+169/-1, 3 files)

### cron 사이클 #8 (2026-05-24) 산출물 — Tauri 통합
- `src/commands.rs`: `execute_cube` invoke + `ExecuteResultDto` / `ExecuteErrorDto` (kind 4종 + tier)
- `src/lib.rs`: invoke_handler 등록
- 의존성: `@tauri-apps/api ^2` (dynamic import, core 청크 분리)
- `src/lib/tauri-bridge.ts`: `isTauri()` · `executeCube()` · `describeExecuteError()`
- Inspector "▶ 테스트 실행" 버튼 (Tauri / browser-dev 환경 표시)
- 검증: cargo check 0.65s · npm build 60 modules · gzip 99.39 KB · 738ms
- commit `3d2c1fd` (+173 lines, 7 files)

### cron 사이클 #9 (2026-05-24) 산출물 — clipboard + app_launch
- Cargo.toml: `arboard ^3` optional 추가, `keys` feature 에 포함
- `actions/clipboard.rs` 신설 (keys feature):
  · `set_clipboard(text)` — arboard 직접 호출
  · `insert_text(text)` — 클립보드 + 30ms 지연 + Ctrl+V (한글/이모지 안전)
- `actions/app_launch.rs` 신설 (feature 무관, std::process):
  · `Command::spawn` + stdin/stdout/stderr Stdio::null (자식 격리)
- `actions/mod.rs` dispatch: TextInsert/ClipboardCopy/AppLaunch → 실 OS 호출 + feature gate stub
- 검증: cargo check --no-default-features → 7.39s exit 0
- commit `da5cd65` (+247/-10, 5 files)

### cron 사이클 #10 (2026-05-24) 산출물 — M3 마무리 ✅
- Cargo.toml: target.'cfg(target_os = "windows")'.dependencies 에 windows-sys ^0.59 (Win32_Foundation + Win32_UI_WindowsAndMessaging)
- `actions/focus_window.rs`:
  · Windows: EnumWindows 콜백 + UTF-16 디코딩 + case-insensitive contains 매칭 + SetForegroundWindow
  · 비 Windows: FeatureDisabled
  · 단위 테스트 4 (contains_exact/wildcards/case_insensitive/empty)
- `actions/mouse.rs` (keys feature): enigo Mouse move_mouse + button (Coordinate::Abs/Rel · MouseButton 3종)
- `mod.rs` dispatch: FocusWindow/MouseClick → 실 호출
- **검증 양쪽 통과**:
  · `cargo check --no-default-features` → 1.43s exit 0
  · `cargo check --features keys` → 7.62s exit 0 (enigo + arboard + windows-sys 첫 컴파일)
- commit `554aaa3` (+199/-4)

### M3 종합 완료 산출 (cron #5 ~ #10)
| 영역 | 산출 |
|---|---|
| frontend specs | `src/lib/actions/` 12 파일 (10 specs + types + index) |
| 동적 폼 | `components/ActionPayloadForm.tsx` (8 field 타입 + Tier 배지 + 검증) |
| Rust 시그니처 | `ActionPayload` 10 variant + `MacroStepDto` 5 variant |
| Rust guard | 10 validate 함수 (위험 경로/payload 크기/좌표 범위) |
| Rust OS impl | link · shortcut · macro · clipboard_copy · text_insert · app_launch · focus_window · mouse_click (9/9) |
| Tauri 통합 | `execute_cube` invoke + frontend `tauri-bridge.ts` + 테스트 실행 버튼 |
| plugin_action | M4 SDK 진입 시 활성 (현재 PermissionRequired(3) 차단) |

### cron 사이클 #11 (2026-05-24) 산출물 — M4 진입
- `docs/specs/cubeplugin.md` 신설 — ZIP 컨테이너 + manifest 스키마 + 4중 방어 + StreamDeck 매핑표
- `src/plugins/manifest.rs`:
  · action_type 화이트리스트 10종 (M3 frontend ACTIONS 동기)
  · ManifestAction 확장 (schema/description/tier/icon_ref)
  · RequestedPermission rename ("tier_1" 명시) — 사전 결함 정정
- `src/protocol/messages.rs`: 테스트 fixture 누락 `action` 추가 (사전 결함, 빌드 차단 해소)
- `plugins-examples/com.rebirthstation.system.openapp/manifest.json` 신설 — app_launch 액션 + Tier 2 + schema 2 필드 샘플
- 검증: `cargo test --lib plugins::manifest` → 4 passed in 1.29s · exit 0
- commit `9979e77` (+142/-4)

### cron 사이클 #12 (2026-05-24) 산출물 — M4 backend
- Cargo.toml: `zip ^2` (deflate only)
- `src/plugins/loader.rs` 신설:
  · `installed_dir()` ~/.cubelist/plugins, `list_installed()` 디렉토리 스캔
  · `install_zip(bytes)` ZIP traversal 2단계 방어 (prefix 차단 + canonicalize 재확인)
  · `LoaderError` enum (HomeMissing/Io/Zip/Manifest/ManifestMissing/PathTraversal/Utf8)
- `src/commands.rs` + `lib.rs`: `list_plugins`, `install_plugin` invoke 등록
- 검증: cargo check → 6.68s exit 0 (zip 2.4.2 + zopfli 첫 컴파일)
- commit `c482449` (+225/-2, 6 files)

### cron 사이클 #13 (2026-05-24) 산출물 — M4 frontend ✅
- `src/lib/plugin-registry.ts` 신설:
  · PluginManifest / ManifestAction TS 미러 (Rust 1:1)
  · PluginActionEntry + qualified_id ("plugin:<pkg>:<id>") + parseQualifiedId
  · usePluginRegistry zustand: installed/loading/error + refresh/install + allActions/getAction
  · PluginActionPayload (인덱스 시그니처로 Cube.action_payload 호환)
- App.tsx:
  · 부팅 시 refreshPlugins() useEffect
  · TopBar "+ 플러그인" 버튼 (.cubeplugin 파일 선택 → install → alert)
  · Inspector action_type select: optgroup "빌트인" + "플러그인 (N)"
  · inferSelectValue / handleActionTypeChange 헬퍼 (빌트인↔플러그인 라우팅)
- 검증: npm run build → 61 modules · gzip 100.11 KB JS · 735ms
- commit `3e6f38d` (+268/-10, 2 files)

### cron 사이클 #14 (2026-05-24) 산출물 — M4 ✅ 완료
- `actions/mod.rs`: `execute_plugin_action` 추가 — list_installed 조회 + action_id lookup + inner ActionPayload 재구성 + 무한재귀 방지 + Box::pin async 재귀
- `plugins/loader.rs`: install_zip 에 manifest.sig hook — v1 검증 시도 후 로그만 (강제 거부는 v2+), read_manifest_text 헬퍼 분리, 2-pass archive 구조
- `scripts/build-sample-plugin.mjs`: 디렉토리 → .cubeplugin ZIP CLI (jszip · deflate 6)
- `plugins-examples/com.rebirthstation.system.openapp.cubeplugin`: 샘플 산출 (649 bytes)
- 검증: cargo check exit 0 · node build-sample-plugin 1 file → ZIP OK
- commit `658e984` (+197/-10, 4 files)

### M4 종합 산출 (cron #11 ~ #14)
| 영역 | 산출 |
|---|---|
| spec 문서 | `docs/specs/cubeplugin.md` (ZIP 구조 + 4중 방어 + StreamDeck 매핑) |
| Rust manifest | `plugins/manifest.rs` (10 enum + schema/tier/icon_ref + RequestedPermission rename) |
| Rust loader | `plugins/loader.rs` (installed_dir + list_installed + install_zip + traversal 2단계 + signature hook) |
| Tauri invoke | `commands.rs` (list_plugins + install_plugin) |
| Rust execute | `actions/mod.rs::execute_plugin_action` (Box::pin async 재귀) |
| frontend 레지스트리 | `lib/plugin-registry.ts` (zustand + qualified_id + buildPluginActionPayload) |
| Inspector | optgroup "빌트인" + "플러그인 (N)" + 라우팅 |
| TopBar | "+ 플러그인" 버튼 |
| 샘플 | `plugins-examples/com.rebirthstation.system.openapp.cubeplugin` (649 bytes) |
| 빌드 도구 | `scripts/build-sample-plugin.mjs` |
| 후속 (W2+) | ed25519-dalek 실 검증, PropertyInspector iframe (M5+) |

### cron 사이클 #15 (2026-05-24) 산출물 — M5 wire 호환 ✅
- 검증 12 영역 일치 (PROTOCOL_VERSION/Hello/PressItem/PressKind/MouseButton/PairingPayload/ActionPayload 10 enum)
- 사전 결함 1: `plugin_action.action_id` TS 측 누락 → 옵셔널 추가
- Rust `execute_plugin_action` action_id fallback (모바일 PWA 구버전 호환) + warn 로그
- `docs/06-wire-compat.md` 신설 (호환 테이블 + 라우팅 흐름 + 변경 절차)
- 검증 양쪽 통과: cargo check 10.22s exit 0 · mobile-pwa typecheck exit 0
- commit `a1cd3f6` (+101/-13, 3 files)

### cron 사이클 #16 (2026-05-24) 산출물 — M5 종결 + M6 시작
- M5 종결 사유: wire 호환 ✅ + Tauri invoke baseline 가동 + LAN WS = dev plus-feature (feedback_no_meaningless_phases)
- M6 시작:
  · App.tsx Sidebar 에 "설치된 플러그인 (N)" 섹션 추가
  · 플러그인 액션 버튼 클릭 → 현재 리스트에 plugin_action 큐브 즉시 추가 (sort_order=max+1)
  · default_payload 복사 + selectCube 자동 포커스 + 리스트 미선택 시 disabled
  · 0개 안내 (상단 "+ 플러그인" 가이드)
- styles.css: .sidebar-section 다중 + .plugin-list/btn/label/meta (코어 무채색)
- 빌드: 61 modules · gzip 100.40 KB JS + 1.69 KB CSS · 768ms
- commit `1d37fad` (+106/-1)

### cron 사이클 #17 (2026-05-24) 산출물 — M6 본격
- `actions/types.ts`: ActionCategory (7종) + ACTION_CATEGORIES + ActionSpec.category 옵셔널
- 10 action 파일 category 매핑 (link=웹, text_insert/clipboard_copy=생산성, 나머지=시스템, plugin_action=미설정)
- `actions/index.ts`: ActionCategory·ACTION_CATEGORIES re-export
- App.tsx Sidebar 재구성:
  · 카테고리 필터 ("전체" + 7종) — `useState<ActionCategory|null>`
  · "빌트인 액션 (N)" 섹션 — 1클릭 큐브 추가 + meta (id·tier·category)
  · "플러그인 (N)" 섹션 유지 (manifest category 매핑 후 동일 필터 적용)
  · 공통 `addCube()` 헬퍼 (sort_order=max+1 · auto-focus · 미선택 disabled)
- styles.css: `.category-btn.is-active`
- 빌드: 62 modules · gzip 100.57 KB JS + 1.70 KB CSS · 741ms
- commit `002dbe9` (+119/-19, 14 files)

### cron 사이클 #18 (2026-05-24) 산출물 — M6 ✅ 완료
- Rust `plugins/manifest.rs ManifestAction.category: Option<String>` 옵셔널 추가
- TS `plugin-registry.ts ManifestAction + PluginActionEntry.category?: ActionCategory` 동기
- App.tsx Sidebar: pluginFiltered = category 일치 필터 활성
- 샘플 manifest.json + ZIP 재빌드 (649 → 666 bytes)
- 검증 3중 통과: ZIP OK · cargo 0.84s · npm 808ms
- commit `17e24ad` (+14/-2, 5 files)

### M6 종합 산출 (cron #16 ~ #18)
| 영역 | 산출 |
|---|---|
| 사이드바 | "카테고리 (전체+7)" + "빌트인 액션 (N)" + "플러그인 (N)" 3 섹션 |
| 1클릭 큐브 추가 | 빌트인/플러그인 양쪽 동일 UX (sort_order=max+1, auto-focus) |
| 카테고리 enum | 한글 7종 (생산성·미디어·개발·디자인·게이밍·시스템·웹) Rust/TS 동기 |
| 매핑 | 빌트인 9/10 + 플러그인 manifest.category 옵셔널 |
| StreamDeck 동등 | "Add Action" 패널 대응 (모바일 PWA 시드 카탈로그 이식은 nice-to-have, M9 전) |

### cron 사이클 #19 (2026-05-24) 산출물 — M7 폴더 ✅
- editor store: current_folder_id + folder_stack + visibleCubes() + currentFolder() + enterFolder/exitFolder
- visibleCubes 로직:
  · 루트: 다른 folder 의 cube_ids 에 포함된 큐브 자동 제외 (서브덱 격리)
  · 폴더 안: 현재 folder.cube_ids 매칭만
- 부수효과: loadPack/closePack/selectList 시 폴더 상태 자동 초기화
- App.tsx GridArea: 브레드크럼 + 큐브 수 표시 + visibleCubes 전달
- SortableCubeCell: folder 타입 → "📁" + onDoubleClick → enterFolder + is-folder 스타일
- 빌드: 62 modules · gzip 101.06 KB JS + 1.81 KB CSS · 873ms
- commit `f834f9b` (+141/-10, 3 files)

### cron 사이클 #20 (2026-05-24) 산출물 — M7 페이지 ✅
- CubeList.cubes_per_page 옵셔널 (기본 = cols × 3)
- editor store: current_page + scopedCubes() + visibleCubes() page slice + pageSize() + totalPages() + setPage/nextPage/prevPage
- 모든 진입/탈출 hook 에서 page 0 리셋 (loadPack/closePack/selectList/enterFolder/exitFolder)
- GridArea: 페이지 인디케이터 + ◀/▶ 버튼 (disabled 정확 분기)
- emptySlots = pageSize - 현재 페이지 큐브 수 (마지막 페이지 빈 슬롯)
- 빌드: 62 modules · gzip 101.36 KB JS + 1.84 KB CSS · 898ms
- commit `784608d` (+123/-16, 4 files)

### cron 사이클 #21 (2026-05-24) 산출물 — M7 ✅ 완료
- `types/cube.ts`: MouseButton + MacroStep discriminated union (kind 5종) + defaultMacroStep(kind) (Rust MacroStepDto 1:1)
- `components/MacroStepEditor.tsx` 신설:
  · step 카드 (번호 배지 + kind 라벨 + ▲▼✕ 컨트롤)
  · 상단 "+ <kind>" 5 버튼 (key/delay/launch_app/focus_window/click)
  · step별 동적 폼 (kind switch: key=string-list, delay=number, launch_app=path+args, focus_window=pattern, click=x/y/button 3-col)
- `ActionPayloadForm.tsx`: actionType==='macro' 시 schema 폼 우회 → MacroStepEditor 위임
- `styles.css`: .macro-editor / .macro-step / .macro-step-grid 등 12 클래스
- 빌드: 64 modules · gzip 102.16 KB JS + 2.01 KB CSS · 861ms
- commit `0a06aab` (+320/-4, 4 files)

### M7 종합 산출 (cron #19 ~ #21)
| 영역 | 산출 |
|---|---|
| 폴더 (cron #19) | current_folder_id + folder_stack + visibleCubes 격리 + 더블클릭 진입 + 브레드크럼 |
| 페이지 (cron #20) | cubes_per_page + current_page + scopedCubes/visibleCubes slice + ◀▶ 버튼 + N/M 인디케이터 |
| 멀티액션 (cron #21) | MacroStepEditor 5 step 비주얼 폼 (macro sub-feature, 별도 enum 미신설) |

### cron 사이클 #22 (2026-05-24) 산출물 — M8 인프라
- `lib/i18n/messages.ts`: Locale 3종 + MessageKey 28 키 + MESSAGES 사전 풀세트 + detectLocale
- `lib/i18n/useTranslation.tsx`: I18nProvider (localStorage cubelist:locale + <html lang>) + useTranslation hook + ko fallback
- `main.tsx`: <I18nProvider> 래핑
- `tauri.conf.json`: createUpdaterArtifacts true (Updater 매니페스트 .json 자동 생성)
- 빌드: 66 modules · gzip 103.41 KB JS · 742ms
- commit `6677052` (+210/-2, 4 files)

### 결정 대기 (사용자 D-06~07)
- **D-06 Tauri Updater 엔드포인트**: GitHub Releases? Vercel? S3? + Ed25519 pubkey 생성
- **D-07 EV 코드 사이닝 인증서**: $300~500/년 — 미보유 시 SmartScreen 경고 (Q2 진입 전 권장)

### cron 사이클 #23 (2026-05-24) 산출물 — M8 라벨 + LocaleSwitcher ✅
- `components/LocaleSwitcher.tsx`: KO|EN|JA 3-state 인라인 버튼 + is-active + aria-pressed
- App.tsx 라벨 24 키 t() 교체 (TopBar 7 + Sidebar 6 + GridArea 4 + Inspector 7)
- TopBar 우측에 LocaleSwitcher 임베드 (⚙ 좌측)
- styles.css: .locale-switcher / .locale-btn (Consolas 토글)
- 빌드: 67 modules · gzip 103.60 KB JS + 2.08 KB CSS · 756ms
- commit `bdd87fb` (+99/-32, 3 files)

### M8 종합 산출 (cron #22 ~ #23)
| 영역 | 산출 |
|---|---|
| i18n 인프라 | messages.ts (Locale 3 + MessageKey 28 + 사전 풀세트) + useTranslation.tsx (Provider/hook) |
| LocaleSwitcher | TopBar 3-state 즉시 전환 + localStorage + <html lang> 동기 |
| 라벨 교체 | TopBar/Sidebar/GridArea/Inspector 24 키 적용 (MacroStepEditor 라벨 = nice-to-have 후속) |
| Updater | tauri.conf.json createUpdaterArtifacts: true (매니페스트 자동 생성) |
| 결정 대기 | D-06 Updater 엔드포인트 + D-07 EV 사이닝 |

### cron 사이클 #24 (2026-05-24) 산출물 — M9 진입 (베타 준비)
- `docs/07-release-checklist.md` 신설 (7 섹션):
  · M0~M8 산출 요약 테이블
  · 결정 대기 D-06 (Updater 엔드포인트 3 옵션 + Ed25519 키 생성) / D-07 (사이닝 무/OV/EV 옵션 비교)
  · Windows 베타 빌드 절차 (cargo tauri build --features keys)
  · GitHub Releases 배포 흐름 + latest.json 매니페스트 형식
  · 베타 진입 전 체크리스트 8 항목
  · 모바일 PWA 트랙 병렬 안내
  · 베타 → v1.0 후속 (서명 활성 / LAN WS / PropertyInspector iframe / E2E)
- PROJECT.md: "현재 진척률 ≈ 90%" 헤더 추가 + 릴리즈 체크리스트 경로 안내
- commit/push 대기

### cron 사이클 #25 (2026-05-24) 산출물 — M9 베타 준비 완료
- 3 파일 버전 0.1.0 일치 확인 (Cargo.toml + tauri.conf.json + frontend/package.json)
- `CHANGELOG.md` v0.1.0 베타 노트 — Keep a Changelog 형식, cron #1~#24 종합:
  · Added: 8 영역 (파일포맷·UI·데모·M3 actions·M4 SDK·M5 호환·M6 카탈로그·M7 폴더+페이지+매크로·M8 i18n+Updater·문서 9종)
  · Changed: 사전 결함 4건 정정
  · Removed: tsc .js 부산물
  · Security: ZIP traversal · AppLaunch 위험경로 · HMAC · Tier 1~3
  · Known Limitations: 6건 (서명 placeholder / LAN WS / iframe inspector / 시드 / E2E / macOS)
  · Decisions: D-01~05 영구 + D-06/07 pending
- commit `7a75681` (+129, 1 file)

### 종합 산출 (M0 ~ M9 베타 준비, cron #0 ~ #25)
- 9 마일스톤 완료 (M0/M3/M4/M5/M6/M7/M8 ✅ · M1/M2 정착 · M9 베타 준비)
- 26 git commits (5a86d60 ~ 7a75681)
- 코드: frontend 67 modules (gzip 103.60 KB) + Rust pc-helper + 12 actions + 11 plugins manifest
- 문서: PROJECT.md / STATE.md / CHANGELOG.md / docs/{01~07} + specs/cubeplugin.md

### Pending Decisions (사용자 답 필요)
- **D-06 Updater 엔드포인트**: GitHub Releases (권장 · 무료) / Vercel / S3
  · 결정 후 Ed25519 키 생성 + tauri.conf.json plugins.updater 채우기 + GitHub Action 매니페스트 자동 업로드
- **D-07 EV 코드 사이닝**: 베타=무서명+안내 / OV 인증서 $100~200/년 / EV $300~500/년 즉시 통과
  · 베타 단계는 무서명 가능. Q2 진입 직전 EV 권장

### cron 사이클 #26 (2026-05-24) 산출물 — Pending Task #8 80% 정리
- docs/01-status-gap.md 상단 정정 노트 (편집기 0%·파일포맷 미정의·PC 메인 격상 등 4건 정정 + 권위 소스 이관)
- docs/02-roadmap.md 상단 정정 노트 (cron #1~#25 실 진행 완료 + 가정 정정)
- 두 문서 historical record 보존 — 초기 진단 + 사용자 결정 흐름 추적용
- jusomoa-list/apps/web 빈 디렉토리: 잠금 유지 (80+ node 프로세스 핸들) → 사용자 dev server 종료 후 manual 제거 권장
- commit `a266e40` (+42, 2 files)

### ⚠ cron 자동 진행 한계 도달 (2026-05-24 · cron #26)

본 cron 사이클 (id `1251e70a`, 매시 7/22/37/52분) 으로 의미 있게 진행 가능한 작업이 사실상
종결. 남은 작업은 모두 **외부 의존**:

| 잔여 | 차단 요인 |
|---|---|
| D-06 Updater 엔드포인트 + Ed25519 키 | 사용자 결정 필요 (GitHub Releases vs Vercel vs S3) |
| D-07 EV 코드 사이닝 | 사용자 결정 + $300~500/년 인증서 구매 (베타는 무서명 가능) |
| 실 `cargo tauri build` | 사용자 환경 의존 (VS Build Tools + Rust 1.95 + tauri-cli, 5~30분) |
| GUI 시각 검증 | 헤드리스 환경에서 수행 불가 |
| jusomoa-list 빈 web 제거 | dev server 종료 필요 (사용자 수동) |
| 모바일 PWA 베타 (Capacitor) | mobile-pwa 별도 트랙 |

[memory: feedback_no_meaningless_phases] "사용자 목표 미연결 시 즉시 고지" 준수 — cron 자동
진행 의미 있는 작업이 더 이상 없으므로 본 cron 은 다음 사이클부터 휴면 권장.

### 사용자 결정 / 다음 단계 (선택)

- **옵션 1** — D-06/07 답변 (Updater 엔드포인트 + 사이닝 정책) → cron 즉시 재가동 + GitHub Release 작성
- **옵션 2** — 사용자 환경에서 `cargo tauri build --features keys` 시도 → 결과 STATE 기록 후 cron 재가동
- **옵션 3** — 모바일 PWA 베타 트랙 (Capacitor internal testing) 별도 진행 — cron prompt 변경 필요
- **옵션 4** — 다른 클라이언트 프로젝트로 전환 (jusomoa / aiklink / thaipl / placecite / btceater 등)
- **옵션 5** — cron 즉시 해제 (`CronDelete 1251e70a`)

### cron 사이클 #27 다음 액션 (휴면 권장)

위 옵션 중 사용자 명시 결정 도착 시점에 cron 재가동. 그때까지 본 cron 은 매시 7/22/37/52분
**STATE.md 점검만** 수행하고 추가 변경 없이 보고. 새 정보 / 결정 없으면 noop.

### cron 1251e70a — 사이클 #29 (2026-05-24) 자체 해제

- cron #27~#28 모두 noop 확인 (원격/로컬/결정 변화 없음)
- [memory: feedback_cron_policy] "의미 없는 반복 cron 금지" 적용
- `CronDelete 1251e70a` 호출 → 즉시 해제 완료
- 사용자 결정 도착 시 새 cron 등록 권장:
  · D-06/07 답변 → `CronCreate */15 * * * *` + 새 prompt (GitHub Release 작성 사이클)
  · 다른 사이트 전환 → 해당 사이트 prompt
  · 모바일 PWA 베타 → 별도 prompt

### 자동 진행 cron (id: `1251e70a`)
- 스케줄: 매시 7/22/37/52분 (15분 간격, off-minute)
- 7일 자동 만료 (사용자 요청 시 즉시 해제 가능)
- 세션 종료 시 사라짐 — 24/7 필요 시 별도 routines (/schedule) 등록 권장
- 동작: STATE.md 첫 🔄/⏳ 항목의 다음 한 단계 진행 + commit&push

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
