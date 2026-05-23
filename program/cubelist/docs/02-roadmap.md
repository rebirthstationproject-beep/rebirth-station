# 큐브 리스트 — 단계별 로드맵 (M0 ~ M9)

기준: `01-status-gap.md`. 목표: StreamDeck 동등 + 자유도 확장 + 유휴 모바일 컴패니언.

---

## 방향 결정 (Karpathy 원칙 1 — 가정 명시)

**제안 방향 = "PC 메인 편집기 격상 + 모바일은 컴패니언으로 재정의"**

근거:
- 사용자 요청 명시: "StreamDeck PC 프로그램을 기반으로 두고 거기서부터 개선"
- StreamDeck 자체가 PC-메인/모바일-보조 모델
- 큐브팩 마켓플레이스가 의미를 가지려면 PC 편집기가 메인이어야 (모바일에서 큐브 50개를 드래그&드롭 편집은 불편)

**다른 해석 가능:**
- 해석 B: "모바일이 메인 + PC 편집은 부가 기능" → 현재 코드 베이스 활용도 높음 (M2 작업량 ↓)
- 해석 C: "PC 편집기와 모바일 러너 양쪽 다 동급 메인" → 작업량 최대

**기본은 A로 가정해서 로드맵 작성. 다르게 결정하시면 M2/M5 작업량 조정.**

---

## 마일스톤 개요

| M | 이름 | 산출 | 기간 추정 | 종속 |
|---|---|---|---|---|
| M0 | 모노레포 통합 + 잔류물 회수 | apps/web, apps/mobile 이동 + 포맷 의문 해소 | 0.5d | – |
| M1 | 파일 포맷 v1 + I/O 라이브러리 | `.cubeone/.cubelist/.cubepack` JSON Schema + Rust/TS 양쪽 입출력 | 3d | M0 |
| M2 | 편집기 UI 셸 | PC 편집기 풀창 (1280×800), 좌-카테고리/중앙-그리드/우-인스펙터/상단-팩탭 | 5d | M1 |
| M3 | 액션 시스템 표준화 | 액션 트레이트 + 코어 액션 8종 + 인스펙터 동기화 | 4d | M2 |
| M4 | 플러그인 SDK v1 | `.cubeplugin` 포맷 + 로더 + PropertyInspector (WebView 임베드) | 5d | M3 |
| M5 | 러너 모드 분리 + 모바일 컴패니언 | 데스크톱 미니 모드 + 모바일 PWA 동기화 + 햅틱 | 4d | M2, M3 |
| M6 | 카테고리 뷰 + 큐브 시드 카탈로그 | 카테고리 트리 + 빌트인 큐브 갤러리 + 검색 | 3d | M3 |
| M7 | 폴더(서브덱) + 페이지 + 멀티액션 | 페이지 탭, 폴더 큐브, 멀티액션 큐브 | 3d | M3 |
| M8 | 다국어(한/영) + 자동 업데이트 + 코드 사이닝 | i18n 풀패스 + Tauri Updater + EV 서명 (미보유 시 SmartScreen 처리) | 3d | M2~M7 |
| M9 | 베타 출시 | Windows 베타 빌드 + 모바일 베타 (TestFlight/Internal) | 2d | M8 |

**합산 추정: 약 32일 풀데이.** (실제로는 병렬화로 단축 가능 — 에이전트 트랙 분리)

---

## M0 — 모노레포 통합 + 잔류물 회수 (0.5d)

**Why**: 큐브 리스트 시스템이 두 레포(`jusomoa-list/apps/*` + `rebirth-station/.../cubelist/apps/pc-version`)에 분산. 단일 워크스페이스로 통합해야 빌드/로드맵 진행 가능.

**Tasks**
1. `jusomoa-list/apps/web/` → `cubelist/apps/web-version/` 이동
2. `jusomoa-list/apps/mobile/` → `cubelist/apps/mobile-version/` 이동
3. cubelist 루트에 `pnpm-workspace.yaml` 또는 `package.json` workspaces 정의
4. 의문 해소: `/api/cubeone/route.ts`, `/list/page.tsx`, `/seeds/SeedsList.tsx` 내용 정밀 검토 → M1 작업량 재산정
5. `jusomoa-list/CLAUDE.md`에서 큐브 리스트 트랙 분리/이전 표기

**검증**: `cubelist/` 루트에서 `pnpm install && pnpm -r build` 통과.

---

## M1 — 파일 포맷 v1 + I/O 라이브러리 (3d)

**Why**: 모든 후속 UI/플러그인/액션이 파일 포맷에 의존. 먼저 박는다.

**스펙 초안**
```
.cubeone   = ZIP { manifest.json + icon.png + (action.json) }
             단일 큐브 익스포트/공유 단위
.cubelist  = ZIP { manifest.json + cubes/*.cubeone + layout.json }
             탭 1개분 큐브 배열 + 그리드 레이아웃
.cubepack  = ZIP { manifest.json + lists/*.cubelist + meta.json + icons/* }
             큐브팩(앱) 전체 = 여러 리스트 묶음 + 카테고리 메타
```

**Tasks**
1. JSON Schema 정의 (Draft 2020-12) — `docs/specs/`에 보관
2. Rust 크레이트 `cubelist-format` (`apps/pc-version` 내부 또는 별도 lib crate)
3. TS 패키지 `@cubelist/format` (`packages/format/`)
4. 라운드트립 테스트 (Rust 인코딩 → TS 디코딩, 반대)
5. 마이그레이션 가이드 (`/api/cubeone/route.ts` 기존 흔적과 호환)

**검증**: 양쪽 라이브러리가 같은 파일을 읽고 동일 JSON 출력.

---

## M2 — 편집기 UI 셸 (5d)

**Why**: 가장 큰 GAP. 풀창 편집기 없이는 StreamDeck 동급 불가.

**레이아웃** (Tauri 윈도우 1280×800, resizable, decorations: true)
```
┌─────────────────────────────────────────────────────────────┐
│ 큐브팩 탭 [ 기본 ] [ 작업 ] [ 게이밍 ] [+]    [디바이스] [⚙]│
├──────────┬──────────────────────────────┬────────────────────┤
│ 카테고리 │       큐브 그리드             │  큐브 인스펙터      │
│          │   (현재 페이지/폴더)          │                    │
│ - 생산성 │   ┌──┬──┬──┬──┬──┐           │ 라벨: [Open Chrome]│
│ - 미디어 │   │  │  │  │  │  │           │ 아이콘: [선택]      │
│ - 개발   │   ├──┼──┼──┼──┼──┤           │ 액션 타입: ▼ Open  │
│ - 디자인 │   │  │  │  │  │  │           │ 파라미터: ...      │
│ - 시스템 │   └──┴──┴──┴──┴──┘           │                    │
│          │                              │                    │
│ [+ 추가] │  페이지: ◀ 1/3 ▶             │ [저장] [내보내기]   │
└──────────┴──────────────────────────────┴────────────────────┘
```

**Tasks**
1. Tauri 윈도우 분리: `editor` (메인 풀창) vs `runner` (기존 480×720 미니창) — `tauri.conf.json` 2-window 설정
2. `apps/web-version`(또는 신설 `apps/editor`)에 라우트 `/editor` 신설 + 셸 컴포넌트
3. `@dnd-kit` 그리드 (현재 의존성 활용)
4. zustand 상태: 현재 큐브팩 / 리스트 / 페이지 / 선택된 큐브
5. 카테고리 사이드바 (M6에서 본격 채움 — 지금은 골격)
6. 인스펙터 (M3에서 본격 채움 — 지금은 골격)
7. 임포트/익스포트 버튼 → M1 라이브러리 호출

**검증**: 빈 큐브팩 생성 → 큐브 드래그 배치 → `.cubepack` 저장 → 재로드.

---

## M3 — 액션 시스템 표준화 (4d)

**Why**: StreamDeck 25개 코어 액션 동등 + 플러그인 SDK 진입 전 표준 트레이트 박기.

**Rust 트레이트 (api 초안)**
```rust
pub trait CubeAction: Send + Sync {
    fn id(&self) -> &str;
    fn category(&self) -> ActionCategory;
    async fn execute(&self, ctx: &ActionContext) -> Result<()>;
    fn inspector_schema(&self) -> serde_json::Value; // PropertyInspector 자동 생성
}
```

**코어 액션 8종 (M3 범위)**
1. OpenUrl (link)
2. OpenApp (시스템 앱 실행)
3. RunShortcut (Ctrl+C 같은 단축키 전송)
4. RunMacro (시퀀스)
5. OpenFolder (서브덱 진입)
6. BackToParent (서브덱 탈출)
7. NextPage / PrevPage
8. MultiAction (여러 액션 순차)

**Tasks**
1. `actions/` 모듈 트레이트 + 디스패처 재작성 (현재 enum → trait object)
2. Tier 권한 시스템 유지 (현재 guard.rs/permissions.rs 활용)
3. 인스펙터 자동 생성 (JSON Schema → React 폼)
4. 단위 테스트 80%+

---

## M4 — 플러그인 SDK v1 (5d)

**Why**: 자유도 = 플러그인. 우리가 코어 액션을 추가하는 만큼 외부도 추가 가능해야.

**.cubeplugin 포맷**
```
my-plugin.cubeplugin (ZIP)
├── manifest.json    { id, name, version, actions[], permissions[], signature }
├── icon.png
├── inspector/       (PropertyInspector HTML/JS - WebView 임베드)
└── runtime/         (런타임 코드 — JS sandbox 또는 WASM)
```

**런타임 옵션 (Karpathy 원칙 2 단순함)**
- **JS 샌드박스** (QuickJS/V8 isolate) — 빠른 진입, 보안 위험
- **WASM** — 안전하지만 진입장벽 ↑
- **외부 프로세스 + WS** (StreamDeck 방식) — 가장 호환성 좋음

→ **v1은 외부 프로세스 + WS 방식 (StreamDeck SDK 부분 호환).** WASM은 v2.

**Tasks**
1. 플러그인 manifest schema 확정
2. 서명 검증 (이미 `plugins/signature.rs` 골격 있음)
3. 로더 + 워커 (외부 프로세스 spawn + WS 페어링)
4. PropertyInspector 임베드 (WebView 내부 iframe 또는 별창)
5. 샘플 플러그인 1개 (`com.rebirthstation.cubelist.system.openapp.cubeplugin`)

---

## M5 — 러너 모드 분리 + 모바일 컴패니언 (4d)

**Tasks**
1. PC 미니 러너: 트레이 클릭 → 480×720 항상위 모드 (기존 윈도우 재활용)
2. 모바일 PWA 러너: `apps/mobile-version` 정비 + PC와 WS 페어링
3. 큐브팩 동기화: 편집기에서 저장 → 러너 자동 리로드 (이벤트 emit)
4. 햅틱 (모바일 진동) + nosleep (화면 켬, 이미 의존성 있음)

---

## M6 — 카테고리 뷰 + 큐브 시드 카탈로그 (3d)

**카테고리 트리 v1 (12개)**
생산성 · 미디어 · 개발 · 디자인 · 게이밍 · 시스템 · 통신 · 스마트홈 · 스트리밍 · 오피스 · 웹 · 파일.

**Tasks**
1. 카테고리 메타 스키마 + 큐브 → 카테고리 매핑
2. `/seeds` 페이지 → 카테고리 트리 + 검색 + 미리보기
3. "이 큐브 추가" → 현재 큐브팩에 삽입
4. 마켓플레이스 연동 훅 (M7 이후 본격)

---

## M7 — 폴더(서브덱) + 페이지 + 멀티액션 (3d)
StreamDeck 동등 기능 보강.

---

## M8 — 다국어(한/영) + 자동 업데이트 + 코드 사이닝 (3d)
- i18n 라이브러리 (Next.js side: next-intl 또는 i18next)
- Tauri Updater 활성화 (`createUpdaterArtifacts: true`)
- EV 인증서 미보유 시: SmartScreen 처리 안내 + 점진적 평판 빌드업 가이드

---

## M9 — 베타 출시 (2d)
- Windows NSIS/MSI 베타 빌드
- 모바일 베타 (Capacitor → Android internal testing / iOS TestFlight)
- 베타 텔레메트리 옵트인
- 런칭 노트 작성

---

## 위험 등록부 (Risk Register)

| 위험 | 영향 | 완화 |
|---|---|---|
| 플러그인 SDK가 StreamDeck과 비호환 → 마켓 생태계 부재 | HIGH | StreamDeck SDK 부분 호환 검토 (manifest 키 매핑) |
| EV 인증서 미보유 → SmartScreen 경고 | MED | 무서명 + 평판 빌드업 → 6개월 후 EV |
| 모바일 컴패니언 PWA가 iOS 제약 (백그라운드 WS, 햅틱) | MED | 네이티브 Capacitor 플러그인 보강 |
| `/api/cubeone` 기존 포맷과 신 스키마 충돌 | LOW | M1에서 마이그레이션 함수 작성 |
| Tauri WebView2 보안 정책이 플러그인 임베드 제약 | MED | CSP 화이트리스트 명시 + 별도 BrowserWindow |

---

## 사용자 결정 필요 항목 (3개만)

1. **방향 A/B/C** 중 선택 (위 "방향 결정" 섹션)
2. **모노레포 통합 OK?** (`jusomoa-list/apps/web` + `mobile` → `cubelist/apps/`로 이동)
3. **M1 파일 포맷 ZIP 방식 OK?** (단일 JSON 방식 가능하지만 아이콘/리소스 임베드 어려움)
