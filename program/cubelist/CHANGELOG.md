# Changelog — 큐브 리스트 PC 트랙

본 파일은 PC 트랙 (`apps/pc-version/`) 버전 변경 이력. 모바일 PWA / 네이티브 트랙은 별도.

형식: [Keep a Changelog](https://keepachangelog.com/) · 버전 [Semantic Versioning](https://semver.org/).

---

## [Unreleased] (v0.1.4 작업 중)

### Planned

- 마켓플레이스 서버 API + PayPal/Binance Pay 결제 통합
- 라이센스 키 발급 (Ed25519 서명) + 실 검증
- 큐브팩 게시 워크플로우 (인스펙터 → 서버 검증 → 카탈로그)
- LiveSync 양방향 (모바일 → PC RequestExecute 활용 강화)
- 모바일 PWA selection_change UI 시각 강화 (PC 측 페이지/폴더 미러)
- Tauri WebDriver E2E 통합 (Rust 액션 실 검증)
- 모바일 PWA 큐브 우클릭 컨텍스트 메뉴 (PC 5 액션 동기)
- 모바일 PWA 자체 page state 도입 (PC page_index 동기 표시)

---

## [0.1.3] — 2026-05-31 (계속, commits c8bee1b → 본 turn)

### Added (이번 turn)

**i18n + UX 보강**
- CubeContextMenu 5 액션 i18n 키 추가 (ko/en/ja 동기)
  - `cube_ctx.edit` / `cube_ctx.duplicate` / `cube_ctx.change_image` / `cube_ctx.use_as_cover` / `cube_ctx.delete`
  - alert / confirm 메시지 3건도 t() 적용 (delete_confirm / image_too_large / no_icon / cover_set)
  - 큐브 라벨 (copy) suffix 한글 → 영문 (다국어 안전)
- PackDetail handleInstall 분기 (무료 / 유료)
  - 무료: `mp.install_free` mock 안내
  - 유료: `mp.install_paid` 안내 → `mp.license_prompt` 라이센스 키 입력 prompt
  - v0.1.3 모든 키 무효 처리 (`CL-` prefix + 16자 이상 형식 체크만, 서버 검증은 v0.1.4)
- 모바일 PWA CubeGrid — PC selection page_index 안내 ribbon
  - PC가 page_index > 0 일 때 amber ribbon 표시 ("🖥 PC에서 페이지 N 표시 중")
  - 모바일은 page state 없이 전체 큐브 한 화면 표시 안내

**Phase 5 (2026-06-01 야간 루프)** — Inspector 검증 인라인 에러 UI
- 큐브 라벨 빈 값일 때 인라인 alert + 빨간 border (aria-invalid=true)
- i18n `inspector.label_required` (ko/en/ja)
- ActionPayloadForm 의 payload errors 와 일관된 표시 스타일

**Phase 4 (2026-06-01 야간 루프)** — MarketplaceMetaEditor silent 자동 캡처
- 첫 열림 시 confirm prompt 제거 → silent 자동 캡처 (handleExport 와 동일 정책)
- 사용자는 ✕ 제거 버튼으로 명시 거부 가능
- 캡처 실패 시 silent — 사용자가 수동 캡처 버튼으로 재시도
- try/finally 로 autoCaptureBusy 정리 보장

**Phase 3 (2026-06-01 야간 루프)** — Inspector state_index 빠른 사이클 UI
- CubeStatesEditor — states 2개 이상일 때 ← / → 사이클 버튼 + N/total 카운트
- wrap-around (0 ↔ length-1)
- 클릭 시 `setStateIndex` + `notifyStateChange` (Rust broadcast 트리거)
- 현재 state 라벨 인라인 표시

**Phase 2 (2026-06-01 야간 루프)** — 모바일 PWA 큐브 컨텍스트 메뉴 PC 일관성
- 모바일 CubeContextMenu — "이미지 변경" 액션 신규 (PC와 동일 file picker + 1MB 한도)
- 이미지 변경 핸들러 CubeListView 에 연결 (`handleContextChangeImage`)
- localStore.updateItem 으로 icon_url dataUrl 저장 + loadBoards 갱신
- i18n 키 `change_image` / `image_too_large` 추가 (ko/en/ja)
- cover 액션은 모바일 미적용 — 모바일에는 큐브팩 cover 개념 없음 (board 단위 관리)

---

## [0.1.3] — 2026-05-31 (베타)

오늘 세션 commits 4347db7 → (현재). 마켓플레이스 mockup + 전역 검색 + 키보드 네비게이션.

### Added (신규)

**마켓플레이스 (v0.1.3 사전 mockup)**
- `types/marketplace.ts`:
  - 16 Platform enum (figma/obs/vscode/photoshop/illustrator/premiere/after_effects/davinci/blender/unity/unreal/twitch/discord/spotify/youtube/other)
  - PaymentType (one_time / monthly / yearly)
  - MarketplaceAuthor + MarketplaceRating
  - emptyMarketplaceMeta / formatPrice (cents → USD) / validateMarketplaceMeta
- `components/MarketplaceMetaEditor.tsx` — CubePack 메타 편집 모달
  - 작성자 이름 + 이메일 + 플랫폼 + 가격 + 결제 방식 + 버전 + 태그 + 긴 설명 + 변경 이력 + 데모 영상 URL
  - 검증 오류 인라인 표시 (작성자 필수, 가격 0~$1000, 설명 10K자 한도, 태그 20개, 스크린샷 10개)
  - localStorage 자동 영속 (CubePack.extensions.marketplace, P0 영구 lock 활용)
  - Esc + overlay 클릭 닫기
- `components/MarketplaceCatalog.tsx` — 카탈로그 mockup
  - 6 mock 큐브팩 카드 (OBS / VS Code / Figma / Discord / Photoshop / Twitch)
  - 카테고리 필터 (16 플랫폼 + 전체)
  - 가격 필터 (전체 / 무료 / 유료)
  - 정렬 (인기 / 평점 / 가격 낮은/높은 순 / 최신)
  - 검색 (이름 + 작성자 + 태그 + 설명)
  - 큐브팩 카드 (커버 + 이름 + 작성자 + 가격 + 평점 + 큐브 수 + 태그)
- TopBar 🏪 팩 정보 버튼 (pack 있을 때만 활성)
- MainTab 'marketplace' 추가 (큐브 만들기 / 큐브 리스트 만들기 / 🏪 마켓플레이스)

**전역 검색 (Ctrl+F / Cmd+F)**
- `components/GlobalSearch.tsx` — 전역 검색 모달
  - 검색 대상: 큐브 라벨 + 액션 타입 + metadata + 리스트명
  - 활성 pack 내 모든 큐브 + 라이브러리 풀
  - 최대 200건 (필터링)
  - 결과 클릭 → selectList + selectCube
  - input/textarea 포커스 시 Ctrl+F 무시 (브라우저 기본 동작 보존)

**키보드 네비게이션 (CubeGrid)**
- ←/→ 큐브 인접 선택
- ↑/↓ cols 단위 행 이동
- Enter 선택 큐브 실행 (executeCube)
- Ctrl+E 큐브팩 export
- Ctrl+F 전역 검색
- Esc 모달/메뉴 닫기

**큐브 셀 invalid 표시**
- useMemo validatePayload 실시간
- `.cube-cell.is-invalid::after` 빨간 ! dot (우상단, 14×14)
- title attr 검증 오류 인라인 (hover 표시)

**마켓플레이스 spec 문서**
- `docs/specs/marketplace-preview-v1.md`
  - MarketplaceMeta TypeScript 인터페이스
  - 라우트 구조 + 게시 워크플로우
  - 결제 사전 검토 (PayPal + Binance Pay 영구)
  - 라이센스 키 (Ed25519 + offline 그레이스 7일)
  - 보안 정책 + 진행 단계 12~18일

### Changed (변경)

- React import: useEffect, useMemo, useRef, useState
- styles.css: 마켓플레이스 카탈로그 / 모달 / 전역 검색 / btn-primary 추가

### Added (v0.1.3 추가, commits 44c41b4 → 1a7ff18)

**PackDetail 큐브팩 상세 페이지**
- `lib/marketplace-mock.ts`: MOCK_PACKS 6 (카탈로그 + 상세 공유) + MockPackPreviewCube + deviceGrid 매핑
- `components/PackDetail.tsx`: Hero 섹션 + 디바이스 미리보기 + 설명/변경이력/안내
  - 가격 표시 무료/단순/구독 (월/년)
  - 디바이스별 그리드 자동 (Mini 3×2 / Std 5×3 / XL 8×4 / Plus 4×2 / Neo 4×2)
  - 빈 슬롯 dashed 표시
  - 구매 버튼 mock alert (v0.1.4 활성)
- App.tsx `selectedPackId` state — 카탈로그 ↔ 상세 전환

**E2E Playwright 셋업**
- `e2e/playwright.config.ts`: Vite dev 자동 기동 + chromium + trace/screenshot/video
- `e2e/tests/smoke.spec.ts`: 8 핵심 시나리오
  - 앱 렌더링 + 데모 큐브팩 자동 로드
  - TopBar 핵심 액션 + MainTab 3개
  - 마켓플레이스 카탈로그 6 카드 + 카드 클릭 → 상세
  - 검색 'OBS' → 1건 필터링
  - Ctrl+F 전역 검색 + Esc 닫기
  - 큐브 셀 클릭 → 인스펙터 + CubePreview
- `e2e/package.json` + README
- `.github/workflows/cubelist-pc-e2e.yml`: PR + push 자동, Playwright browser cache, HTML report + traces 업로드

**큐브팩 커버 자동 캡처**
- `lib/pack-thumbnail.ts`: captureCubeListThumbnail
  - canvas 1280×720 (16:9) + LCD 톤 그라데이션
  - 첫 16큐브 4×4 그리드 (110×110 + gap 14)
  - icon_url 시도 → contain 모드 / 단색 fallback 8색 팔레트 + 첫 글자
  - 둥근 사각형 (radius 14) + inset white outline
  - 하단 큐브팩 이름 (36px bold) + subtitle
  - 5초 타임아웃
- MarketplaceMetaEditor `📷 첫 리스트 자동 캡처` 버튼 + 미리보기 + 제거
- 결과 PNG data URL → CubePack.extensions.marketplace.cover_url 영속

### Added (v0.1.3 추가, commits 1a7ff18 → (현재))

**GitHub Actions CI E2E 자동화**
- `.github/workflows/cubelist-pc-e2e.yml`: PR + main push 자동 트리거
  - paths 필터: program/cubelist/apps/pc-version/** 변경 감지
  - Ubuntu Node 20 + frontend npm ci + build
  - Playwright browsers cache (key by package.json hash, cache hit 시 OS deps만 설치)
  - chromium 전용 (CI 자원 최적화)
  - HTML report + traces 자동 업로드 (실패 시, 14일 보존)

**LiveSyncBridge 모바일 PWA 동기화 wire (v0.1.4 사전)**
- `docs/specs/live-sync-wire-v1.md`:
  - cube_update (label/icon_url/state_index delta, PC → 모바일)
  - selection_change (list_id/cube_id/page_index/current_folder_id)
  - request_execute (모바일 → PC, HMAC 인증)
  - subscribe (모바일 → PC, cube_ids 또는 all_in_active_list)
  - 보안: 기존 HMAC + nonce + ±30s + Origin, Tier 동의 prompt 유지
  - 진행 단계 4~5일 (v0.1.4)
- `lib/LiveSyncBridge.ts` singleton:
  - subscribe / emitCubeUpdate (delta) / emitSelectionChange / resetCache
  - window.__cubelistLiveSync dev 콘솔 노출
- 통합:
  - useDynamicCubes applyTick → liveSync.emitCubeUpdate
  - cube-states.ts advanceStateIndex → liveSync.emitCubeUpdate (label + icon + state_index)
  - store/editor.ts selectList / selectCube → liveSync.emitSelectionChange

**i18n 다국어 확장 (ko/en/ja)**
- 신규 키 47개 (마켓플레이스 + PackDetail + ConsentDialog + GlobalSearch + Inspector states + MainTab)
- MarketplaceCatalog t() 적용 — 타이틀/검색/필터/정렬/카운트/empty
- 모든 메시지 ko/en/ja 동기 (예: '큐브팩' / 'pack(s)' / 'パック')

**ConsentDialog (1회/영구 옵션)**
- `components/ConsentDialog.tsx` 신규 — window.confirm 대체
  - Tier 2/3 시각 차별화 (border-color, badge color: 노란 vs 빨강)
  - 3 옵션: 거부 / 이번만 허용 / 영구 허용
  - Esc + overlay 클릭 = 거부
  - showConsentDialog(actionType, tier) Promise → 'allow_once' | 'allow_always' | 'deny'
  - 중복 prompt 방지 (promptOpen flag)
  - lazy chunk 분리 (2.15KB)
- tauri-bridge.ts requireConsent → async + showConsentDialog 통합
  - 'allow_always' 시 localStorage 영속 (기존 동작)
  - 'allow_once' 시 일회성 통과

### Changed (변경)

- tauri-bridge.ts executeCube → await requireConsent (async)
- i18n MessageKey union 확장 (47 신규 키)

### Added (v0.1.3 추가, commits dd700f9 → (현재))

**i18n 완성 (총 96 키 ko/en/ja 동기)**
- MainTab / GlobalSearch / PackDetail / CubeStatesEditor / CubePreview t() 적용
- SettingsPanel 본문 17 신규 키 (settings.*) 추가
- PackDetail 디바이스 토글 5 신규 키 (mp.device_*)

**SettingsPanel 신규 컴포넌트**
- TopBar ⚙ 클릭 → 4 섹션 모달
  - 언어 / Language / 言語 (LocaleSwitcher)
  - 📁 라이브러리 폴더 (현재 경로 + prompt 변경)
  - 🔒 영구 동의 (loadConsents 목록 + 개별/일괄 제거)
  - 🔄 동기화 (LiveSyncBridge 활성 안내)
- localStorage cubelist:tier_consents 직접 관리
- clearAllTierConsents 일괄 초기화
- Esc + overlay 클릭 닫기

**PackDetail 디바이스 사이즈 토글**
- 5 디바이스 옵션 (Mini 3×2 / Standard 5×3 / XL 8×4 / Plus 4×2 / Unlimited)
- DeviceToggleButton 컴포넌트
- 클릭 시 deviceOverride state → DevicePreview 그리드 즉시 변경
- 같은 버튼 재클릭 시 원래 device_hint 복귀
- accent 컬러 활성 표시

**Rust broadcast Tauri command (v0.1.4 사전)**
- `commands::broadcast_cube_update(cube_id, label, icon_url, state_index)`
- `commands::broadcast_selection_change(list_id, cube_id, page_index, current_folder_id)`
- tracing::debug 로그 (v0.1.4 진입 시 WebSocket subscribers broadcast)
- `lib.rs` invoke_handler 등록 (12 → 14 commands)

**LiveSyncBridge → Tauri invoke 자동 통합**
- broadcast() 시 forwardToRust() 호출
- Tauri 환경 감지 (window.__TAURI_INTERNALS__)
- invoke 실패 silent — frontend subscribers 은 이미 동작

### Added (v0.1.3 추가, commits 8ecde54 → (현재))

**Rust WebSocket broadcast 실 구현**
- `protocol/messages.rs ServerEvent` 확장:
  - `CubeUpdate { cube_id, label?, icon_url?, state_index?, timestamp_ms }`
  - `SelectionChange { list_id?, cube_id?, page_index?, current_folder_id?, timestamp_ms }`
  - 모든 Option 필드 `#[serde(skip_serializing_if = 'Option::is_none')]` (변경된 필드만 wire)
- `ws_server.rs broadcast 인프라`:
  - `static BROADCAST_TX: OnceLock<broadcast::Sender<ServerEvent>>`
  - `live_sync_sender()` 외부 노출 함수
  - channel capacity 128 (slow consumer 보호)
- `handle_socket tokio::select!`:
  - biased — broadcast 우선
  - sync_rx.recv() / socket.recv() 동시 대기
  - Lagged 시 warn + skip / Closed 시 break
- `commands.rs broadcast 함수 실 구현`:
  - timestamp_ms 자동 (SystemTime)
  - ServerEvent 생성 → `live_sync_sender().send(event)`
  - 0 구독자 SendError 무시

### Changed (변경)

- ws_server handle_socket: while let → loop + tokio::select! (broadcast 통합)

### Added (v0.1.3 추가, commits abf2ce1 → (현재))

**큐브 우클릭 "큐브팩 cover로 사용"**
- `CubeContextMenu` 5번째 아이템: 🏪 큐브팩 cover로 사용
- 클릭 시 cube.icon_url → CubePack.extensions.marketplace.cover_url 갱신
- 이미지 없는 큐브 선택 시 alert
- MENU_ITEMS 4 → 5 (높이 조정)

**큐브팩 export 시 자동 cover 캡처**
- TopBar 📤 내보내기 핸들러 (handleExport):
  - cover_url 없고 lists 있으면 captureCubeListThumbnail 자동 시도
  - 캡처 성공 시 packToExport.extensions.marketplace.cover_url 임시 주입
  - 캡처 실패해도 export 계속 (silent fail)
- 사용자 명시 동의 prompt 없음 — export 산출물에만 임시 포함 (영구 저장 X)
- MarketplaceMetaEditor 의 명시 캡처와 별개 동작

### Added (v0.1.3 추가, commits 463bdcb → adff2b8 → abf2ce1)

**e2e 5 신규 smoke 테스트 (총 13개)**
- ⚙ 설정 패널 표시 + 4 섹션 + 완료 닫기
- PackDetail 디바이스 토글 5 버튼 + is-active class
- Ctrl+E 큐브팩 export 단축키 (dialog dismiss)
- 마켓플레이스 가격 필터 'free' → 2건 (OBS + Discord)
- 인스펙터 큐브 전환 시 미리보기 갱신

**모바일 PWA WebSocket handler (v0.1.4 본 작업)**
- `types/protocol.ts ServerEvent` 확장:
  - `cube_update` (cube_id + label?/icon_url?/state_index?/timestamp_ms)
  - `selection_change` (list_id?/cube_id?/page_index?/current_folder_id?/timestamp_ms)
- `ws-client.ts handleServerEvent`:
  - cube_update / selection_change case 추가
  - 모든 이벤트 'message' 리스너 통합 위임
- `lib/hooks/useLiveSync.ts` (신규):
  - `useLiveSync(client)` → `{ cubeUpdates: Map<id, update>, selection }`
  - out-of-order 메시지 보호 (timestamp_ms 비교)
  - undefined vs null icon_url 구분
  - getCubeLiveDisplay helper
- `useHelperConnection` client reactive 노출:
  - useState client 추가 (외부 hook 이 reactive 접근)
  - 마운트/언마운트 시 setClient
- `components/cube/Cube.tsx liveOverride prop`:
  - PC LiveSyncBridge 업데이트 우선 적용
  - rawItem → item shadowing (기존 코드 변경 최소)
- `components/cube/CubeGrid.tsx`:
  - useHelperConnection().client + useLiveSync hook 통합
  - liveSync.cubeUpdates.get(item.id) lookup
  - SortableCube liveOverride prop 전달

**Tauri + Vite dev 동시 기동 스크립트**
- `scripts/dev-all.ps1`:
  - Vite dev 서버 background job 시작 (포트 3002)
  - 최대 30초 ready 대기 (http://127.0.0.1:3002 200)
  - Tauri dev --features keys 시작
  - finally 절에서 Vite job 정리

### Changed (변경)

- useHelperConnection: clientRef → useState 변경 (reactive client 노출)
- CubeGrid items.map → ({ ... return (...); }) 변환

### 다음 (v0.1.4+)

- 마켓플레이스 서버 API + PayPal/Binance Pay 통합
- 라이센스 키 발급 + Ed25519 검증
- Tauri WebDriver E2E 통합
- 큐브팩 미리보기 자동 캡처 → cover 즉시 적용
- 모바일 PWA selection_change UI 반영 (PC 측 선택 큐브 모바일 미러)
- LiveSync 양방향 (모바일 → PC selection 송신)

---

## [0.1.2] — 2026-05-31 (베타)

오늘 세션 commits 049ffac → 919e29d. UX 강화 + states 시스템 + 인스펙터 미리보기.

### Added (신규)

**우클릭 컨텍스트 메뉴**
- `components/CubeContextMenu.tsx` 4 액션: 편집 / 복제 (sort_order +0.5) / 이미지 변경 (file picker → data URL) / 삭제 (확인)
- 외부 클릭 + Esc 자동 닫기
- 화면 밖 침범 방지 (adjustedX/Y)
- SortableCubeCell + 라이브러리 cell 양쪽 통합 (Fragment 래핑)

**App 루트 드래그드롭 zone**
- `components/DropZone.tsx` — 5 형식 자동 분류
  - `.streamDeckPlugin` → plugin-converter 자동
  - `.streamDeckProfile` → 안내 (PC 앱 변환기 미구현, scripts 사용 안내)
  - `.cubeone` → 활성 list 끝에 추가
  - `.cubelist`/`.cubedeck` → 활성 pack 에 추가 또는 신규 pack 생성
  - `.cubepack` → pack 통째 로드
- 전체 화면 overlay (dragenter 감지) + fade-in
- 분류 결과 alert 요약

**큐브팩 export 단축키**
- Ctrl+E (Cmd+E) → 활성 cubepack 다운로드
- input/textarea/select 포커스 시 무시

**hotkey_toggle states 시스템 (P0 영구 lock 실 활용)**
- `lib/cube-states.ts`:
  - `getCurrentStateIndex` / `advanceStateIndex` / `setStateIndex` / `applyCurrentState`
  - `resolveActionForExecution` — 실행 시 active state payload 반환 + 자동 advance
  - `ensureHotkeyToggleStates` — 인스펙터에서 기본 ON/OFF 생성
  - `notifyStateChange` / `listenStateChange` — CustomEvent
  - localStorage 영속 (`cubelist:cube_states`)
- `lib/useCubeStates.ts` hook — listenStateChange + applyCurrentState 자동 갱신
- `tauri-bridge.ts` executeCube:
  - resolveActionForExecution 호출
  - hotkey_toggle → shortcut으로 변환 (Rust 측 keys 송신)
- CubeGrid 통합: state > dynamic 우선순위
- Rust `mod.rs HotkeyToggle` stub 해제 — on_keys 우선 execute_shortcut

**인스펙터 강화**
- `components/CubePreview.tsx` — 인스펙터 상단 큐브 셀 실시간 미리보기
  - live_* 동적 큐브 1초 tick
  - states 변경 listen
  - LCD 톤 그대로
- `components/CubeStatesEditor.tsx` — states 배열 편집 UI
  - 활성 state 토글 dot (currentIndex)
  - 추가 / 삭제 (마지막 1개 보호)
  - hotkey_toggle: keys 조합 인라인 (Ctrl+Shift+A 형식)
- `handleActionTypeChange` — hotkey_toggle 선택 시 states 2개 자동 생성

**.cubelist import (드래그드롭)**
- `cubepack-io.ts importCubelist` — readListZip 재사용
- 활성 pack 있으면 lists 끝에 추가 + selectList
- pack 없으면 신규 pack 생성

**라이브러리 트리 검색**
- 사이드바 상단 검색 input (큐브 리스트·큐브 동시 매칭)
- 검색 시 자동 펼치기
- 클리어 버튼

**Tier 2/3 사용자 동의 시스템**
- `tauri-bridge.ts requireConsent` — 위험 액션 실행 전 prompt
- localStorage 영속 (`cubelist:tier_consents`)
- `clearAllTierConsents` 설정 UI 초기화

### Changed (변경)

- Cargo.toml windows-sys features 추가: `Win32_System_Power` (SetSuspendState)
- FieldSchema number/select 에 required/min/max/step 추가

### Security

- audio_play 위험 경로 차단 (cmd.exe / powershell / wscript / cscript / regsvr32 / mshta / /bin/sh / /bin/bash)
- 이미지 업로드 (컨텍스트 메뉴) 1MB 제한
- DropZone Files type 검증 (외부 파일만)

### OS impl 활성 (Tier 2/3)

- `system_sleep` (Tier 3) — windows-sys SetSuspendState
- `system_actionbar_toggle` (Tier 2) — Shell_TrayWnd ShowWindow
- `audio_play` (Tier 1) — rundll32 url.dll,FileProtocolHandler
- `hotkey_toggle` — frontend states → shortcut 변환

### 다음 (v0.1.3+)

- 모바일 PWA ↔ PC live_clock/timer/states 동기화
- 큐브팩 마켓플레이스 (가격 + 라이선스 + 결제)
- E2E 자동화 (Playwright + Tauri WebDriver)
- 인스펙터 validatePayload 에러 인라인 표시 (다음 turn 진행)

---

## [0.1.1] — 2026-05-31 (베타)

오늘 세션 commits b675151 → 69bdcb7. Phase 1 ~ 5 P2 + Rust OS impl + 사용자 가이드 + UX 개선.

### Added (신규)

**파일 spec 영구 lock (P0)**
- `.cubeone` v3 / `.cubelist` v3 / `.cubepack` v3 영구 lock — 이후 변경 0 보장
- Cube에 영구 옵셔널 필드 추가: `states` (멀티 상태), `title_style` (Font/Color/Alignment), `controller_type` (main/dial/touchpad)
- forward-compat 필드: `extensions` / `streamdeck_meta` / `streamdeck_source` — schema validate 무관 자유 형식
- DeviceHint enum (13 StreamDeck 디바이스 + `cubelist_unlimited` 영구 차별점)
- 4 명세 문서:
  - `docs/specs/cubeone-v3.md`
  - `docs/specs/cubelist-v3.md`
  - `docs/specs/cubepack-v3.md`
  - `docs/specs/streamdeck-compat.md`

**P1 11 신규 액션 (Phase 3, StreamDeck 100% 호환)**
- `media_key` (multimedia: play/pause/next/prev/stop/volume±/mute)
- `page_navigate` / `page_jump` (system.pagination + page)
- `folder_up` / `folder_open` (profile.backtoparent + openchild)
- `window_close` (system.close — Alt+F4)
- `system_sleep` (system.sleep — Tier 3 stub)
- `system_actionbar_toggle` (system.actionbar — Tier 2 stub)
- `hotkey_toggle` (system.hotkeyswitch — states 의존, Tier 2 stub)
- `audio_play` (soundboard — Tier 1 stub, OS impl 추가 예정)
- `profile_rotate` (큐브 리스트 회전)
- frontend specs + Rust ActionPayload variant + guard + dispatch 모두 추가
- 즉시 OS impl: `media_key` (enigo Key::Media*), `window_close` (Alt+F4)
- frontend 처리 (Rust no-op): `page_navigate`, `page_jump`, `folder_up`, `folder_open`, `profile_rotate`

**P2 동적 큐브 시스템 (Phase 5)**
- `lib/dynamic-cube.ts` DynamicCubeRegistry + 4 tick 구현
  - `liveClockTick` (HH:MM:SS / HH:MM / h:MM AM/PM)
  - `liveTimerTick` (target_ms 카운트다운)
  - `liveGaugeTick` (SVG bar, hue 0~120, value/min/max + unit)
  - `liveBatteryTick` (SVG 배터리 모양, 색상 단계, navigator.getBattery 자동)
- `lib/useDynamicCubes.ts` React hook
  - CubeGrid 레벨 watch, 정적 큐브 영향 0
  - tick interval: 1s (clock SS) / 30s (clock HH:MM) / 5s (gauge/battery)
  - cleanup 시 clearInterval
- `lib/actions/p2_actions.ts` 4 액션 spec
- CubeGrid 통합 — dynamicUpdates Map<cubeId, DynamicUpdate>로 라벨/이미지 override

**`.streamDeckProfile` → `.cubepack` 변환기**
- `scripts/import-streamdeck-profile.mjs` 신규
- ZIP 내부 Profiles/* 자동 스캔 (외부 Pages.Pages 는 디스플레이 순서일 뿐 확인)
- Profile.Device.Model → device_hint (13 디바이스 + cubelist_unlimited 폴백)
- Page.Controllers[].Actions{col,row} → cubes[].sort_order (row × cols + col)
- States[] → Cube.states / Title 메타 → Cube.title_style (P0 영구 lock 필드 실 활용)
- streamdeck_meta + streamdeck_source 원본 보존 (forward-compat)
- 13 DefaultProfile 변환 검증: 13 .cubepack / 742 큐브

**시각 강화 (StreamDeck LCD 톤 모방)**
- 큐브 셀 배경 = pure black (#000000) + inset white outline + drop shadow = LCD 패널 깊이감
- hover 시 outline + shadow 증가 (키 누름 직전 느낌)
- 선택 시 LED 글로우 (`outline: 2px solid var(--accent)` + `box-shadow: 0 0 12px rgba(255, 196, 0, 0.4)`)
- 그리드 베젤 = #0a0a0a + inset shadow (StreamDeck 본체 매트 톤)
- PNG_TINY (< 800 byte) → `filter: invert(1) brightness(1.4)` 자동 가시화 (23 cube)
- NO_ICON placeholder → 라벨 첫 글자 28px 중앙 표시 (4 cube)

**이미지 변환 호환 v1·v2 (30% → 11% 미렌더링)**
- SVG `fill="#ddd"` 단색 → `#ffffff` 일괄 정규화 (3자 + 6자 hex + RGB 컴포넌트 회색조 판정)
- 우선순위 변경: @3x/@2x PNG (컬러풀세트) > SVG (단색 가능성, 정규화 후)
- bestImageForAction 3단계 fallback (actionSlug + UUID segment + camelCase 분해)
- PNG_TINY 회피 강화 (size < 800 byte 시 SVG 우선)
- 결과: plugin_icon_fallback 49 → 0, @2x.png 매칭 118 → 169 (+51건)

**사용자 가이드**
- `docs/USER_GUIDE.md` (13 섹션 + FAQ)
- `docs/release/beta-v0.1.1-guide.md` (D-06/D-07 결정 보조 + cargo tauri build 절차)

**라이브러리 UX**
- 사이드바 검색 input (🔍 큐브 리스트·큐브 동시 매칭)
- 검색 시 자동 펼치기 (autoExpand)
- 클리어 버튼 (×)

**메타데이터 보강 (placeholder 가시화)**
- cube.metadata에 `icon_source` / `icon_size_bytes` / `icon_is_tiny` / `icon_is_placeholder` 추가
- frontend className 자동 분기 (`icon-tiny` / `icon-placeholder`)

### Changed (변경)

- `FieldSchema.number` 에 `min` / `max` / `step` / `required` 추가
- `FieldSchema.select` 에 `required` 추가
- `CubeActionType` enum: 10 → 25 (P1 11 + P2 4)
- `ACTION_TYPES` Set (cubepack-io.ts) 동기

### Security

- `validate_media_key` 7 키 화이트리스트만 허용
- `validate_direction` next/prev 만 허용
- AudioPlay URL 길이 / volume 범위 검증
- LiveGauge min < max 검증
- HotkeyToggle on/off_keys 비공 검증

### Known Limitations

- Tier 2 OS impl: system_actionbar_toggle / hotkey_toggle / audio_play — PermissionRequired(2) stub
- Tier 3 OS impl: system_sleep — PermissionRequired(3) stub
- 모바일 PWA ↔ PC live_clock/timer 동기화 = M5+ 후속
- live_battery navigator.getBattery 미지원 브라우저 → manual 폴백 필요
- 동의 시스템 (consent dialog + 영속화) = v0.1.2 예정

### Pending Decisions

- D-06 Updater 엔드포인트 — GitHub Releases (권장) / Vercel / S3
- D-07 EV 코드 사이닝 — 베타 무서명 (권장) / OV / EV

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
