# 큐브 리스트 — 현황 진단 & StreamDeck GAP 분석

작성: 2026-05-23 · 기준: `C:\Program Files\Elgato\StreamDeck` v(2026-05-11 빌드) + `E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version` 코드 트리.

---

> ## ⚠️ 정정 노트 (2026-05-24 · cron #26)
>
> 본 문서의 일부 진단은 **사전 검토 부족 상태에서 작성**되어 사실과 다릅니다. 정확한 정정:
>
> | 항목 | 본 문서 (틀림) | 실제 |
> |---|---|---|
> | 편집기 UI 진척 | "0%" | 모바일 PWA `apps/mobile-pwa/components/cube/*` 13 파일 ~340 KB 이미 존재 (인스펙터 59 KB · 매크로 26 KB) |
> | 파일 포맷 | "미정의" | `.cubeone v3` ZIP 컨테이너 이미 가동 (`apps/mobile-pwa/lib/cube-format/spec.ts`) |
> | "PC 메인 격상" 제안 | D1=A 권장 | **D-01 결정**: 모바일 PWA + PC 두 트랙 분리 (`docs/05-decisions.md`) |
> | 카테고리 시드 | "없음" | `apps/mobile-pwa/app/seeds/SeedsList.tsx` 22 KB 가동 |
>
> **현재 실제 진척률 (2026-05-24)**: ≈ 90% — M0~M8 핵심 9 마일스톤 완료, M9 베타 준비 단계.
>
> **권위 소스**:
> - 산출 종합: `CHANGELOG.md` v0.1.0
> - 현재 상태: `STATE.md`
> - 영구 결정: `docs/05-decisions.md`
> - 베타 체크리스트: `docs/07-release-checklist.md`
>
> 본 문서는 **historical record** 로 보존 — 초기 진단의 한계 + 사용자 분리 결정 흐름 추적용.

---

---

## 1. 핵심 결론 (먼저)

**큐브 리스트는 현재 StreamDeck과 동등 수준이 아니다.** 같은 카테고리의 제품군에 속하지도 않는 단계.

| 지표 | 추정치 |
|---|---|
| 백엔드(Rust) 진척 | **약 25%** (액션 4종/인증/플러그인 골격만, 액션 표준화·플러그인 SDK·파일 포맷 부재) |
| **편집기 UI** 진척 | **0%** (PC 편집기 풀창이 존재하지 않음) |
| 러너 UI 진척 | 약 40% (`apps/web` Next.js 페이지 12종 — 단, 모바일/PWA 가정으로 설계됨) |
| 파일 포맷 (`.cubeone/list/pack`) | **미정의** (코드/스키마 없음) |
| 플러그인 SDK | **미설계** (manifest/signature 골격만 존재) |
| 멀티 디바이스 / 폴더 / 페이지 | **없음** |

### 방향 자체가 정반대

- **StreamDeck**: PC = 메인 편집기 + 러너, 하드웨어/모바일 = 출력 디바이스
- **현재 큐브 리스트**: 모바일 PWA = 메인 (편집·실행), PC = 그 PWA를 WebView2로 띄우는 **호스트**

→ 사용자가 요청한 "StreamDeck 동등 + 자유도 확장 + 유휴 모바일 컴패니언" 모델로 가려면 **PC를 메인 편집기로 격상**시키는 방향 전환이 필요.

---

## 2. StreamDeck 정찰 결과

### 2.1 런타임
- **C++ + Qt6 + QML** (Qt6Quick.dll · Qt6Qml.dll · Qt6QmlModels.dll)
- **QtWebEngine** (Qt6WebEngineCore.dll = 199 MB Chromium 임베드) — 플러그인 PropertyInspector 렌더
- StreamDeck.exe 단일 진입 (26 MB), 전체 설치 **432 MB**
- 오디오: Qt6Multimedia · 입력: enigo 아닌 자체 SDK · 코랜시르(Corsair) iCUE SDK 통합 (`iCUESDK.x64_2019.dll`)

### 2.2 핵심 추상 = 3축 폴더 시스템
| StreamDeck 폴더 | 의미 | 큐브 리스트 매핑 |
|---|---|---|
| `Plugins/com.elgato.streamdeck.*.sdPlugin/` | 액션·기능 = 모두 플러그인 | `.cubeplugin` (신규 정의 필요) |
| `DefaultProfiles/*.streamDeckProfile` | 디바이스별 디폴트 큐브 배치 패키지 | `.cubepack` |
| `PageIcons/*.sdIcons/` | 큐브에 입힐 아이콘 팩 | `.cubeicons` (신규 정의 필요) |

### 2.3 코어 플러그인 25종 (모두 액션)
> StreamDeck의 모든 기능은 플러그인. 코어조차도 동일한 SDK로 작성됨.

키 입력 / 폴더(서브덱) 진입·탈출 / 페이지 / 멀티액션 / 핫키 / 핫키 스위치 / 마우스 / 멀티미디어 / 시스템(open, openapp, website, sleep, debug, close, pagination, brightness, digitaltime, text, actionbar) / 사운드보드 / 타이머 / VSDT 토글 / 다이얼(Plus 전용).

### 2.4 디바이스 14종 프로파일
StreamDeck/Mini/XL/Plus/PlusXL/Neo/LL/Galleon100/XLRDock + Discord Deck Mini + Corsair (Vanguard 96/99·Nightsword).

### 2.5 PluginUI = WebSocket 기반 PropertyInspector
`PluginUI/0.0.0.js` + `versions.json` 단일 JS — 메인 앱과 플러그인 간 WebSocket 통신, HTML/JS로 플러그인 설정 UI 작성.

### 2.6 다국어
`Translations/` 폴더 — 영어 + 다국어 .qm 번역 파일.

### 2.7 아이콘 팩 17종
arrow · camera · commerce · connectivity · device · elgato · file · layout · logo · media · number · object · operations · status · textformatting · tools · user.

---

## 3. 현재 큐브 리스트 코드 정밀 진단

### 3.1 실제 구성 (모노레포 형태)
```
E:\Claude-Workspace\
├── rebirth-station\program\cubelist\
│   ├── index.html (SEO 랜딩)
│   └── apps\pc-version\           ← Rust/Tauri 헬퍼 ✓ 옮김 완료
└── jusomoa-list\apps\
    ├── web\                       ← Next.js UI (큐브 페이지 12종) — 같은 시스템 일부, 미이동
    └── mobile\                    ← Capacitor 컴패니언 — 같은 시스템 일부, 미이동
```

### 3.2 `apps/pc-version` (Rust/Tauri)
- **잘 된 것 ✓**
  - 시스템 트레이 (`tray.rs`)
  - 전역 핫키 등록 (`hotkeys.rs` + tauri-plugin-global-shortcut)
  - LAN WebSocket 서버 (`ws_server.rs` 127.0.0.1:23456)
  - HMAC 페어링 + nonce + Windows Credential Manager (`auth/`)
  - 액션 4종: link / shortcut / macro / permissions (`actions/`)
  - 플러그인 manifest/signature/static_scan 스캔 (`plugins/`)
  - autostart, --minimized 인자 처리
  - Cargo features 분기 (gui/keys/cli)

- **누락 ✗**
  - **편집기 UI 없음** (윈도우 480×720 — 편집기 사이즈 아님)
  - 액션이 enum 하드코딩 (확장 불가, 플러그인 아님)
  - 플러그인 로더 본체 없음 (스캔만 함, 실행/PropertyInspector 미연결)
  - 큐브/리스트/팩 파일 입출력 없음 (포맷 미정의)
  - 페이지·폴더(서브덱) 개념 없음
  - 멀티액션 없음
  - 멀티 디바이스 추상 없음
  - 카테고리 인덱스 없음
  - i18n 없음

### 3.3 `apps/web` (Next.js · 미이동)
**이미 만들어진 페이지 (총 14 페이지):**
- `/list` 14 KB — **큐브 리스트 메인 화면 (러너)**
- `/pair` 12 KB — QR 페어링
- `/plugins` + `/plugins/[packageId]` — 플러그인 카탈로그
- `/seeds` + `/seeds/SeedsList.tsx` 22 KB — 빌트인 큐브 시드
- `/account` 20 KB · `/account/delete` 9 KB
- `/marketplace/policy` · `/insights` · `/pro` · `/about` · `/demo/directory`
- `/api/cubeone` 7.5 KB — **`.cubeone` 파일 API (이미 존재!)**
- `/api/seeds/[file]` — 시드 파일 API

**핵심 의존성:**
- `@dnd-kit/*` — 드래그&드롭 (큐브 그리드 편집용)
- `jszip` — **`.cubepack` 압축 처리 가능성 큼**
- `qrcode.react` + `html5-qrcode` — 페어링
- `@supabase/supabase-js` — 백엔드 (마켓·계정)
- `zustand` — 상태
- `nosleep.js` — 모바일 화면 켜둠 (러너 가정 강한 증거)

**핵심 의문:** `/api/cubeone/route.ts`가 7.5 KB로 존재 → 파일 포맷 일부가 사실 정의되어 있을 가능성. **읽어봐야 확정.**

### 3.4 `apps/mobile` (Capacitor)
- `capacitor.config.ts` + `src/` + `widgets/` 디렉토리 존재
- 모바일 컴패니언 = 이미 트랙 시작됨

---

## 4. 영역별 GAP 요약

| 영역 | StreamDeck | 큐브 리스트 현재 | GAP |
|---|---|---|---|
| 런타임 | C++/Qt6/QML | Rust/Tauri (WebView2) | OK (다른 스택, 동등 능력) |
| **편집기 UI** | 풀창 Qt+QML | **없음** | **CRITICAL** |
| 액션 시스템 | 25개 코어 플러그인, 모두 동일 SDK | 4종 하드코딩 enum | **HIGH** |
| 플러그인 SDK | `.sdPlugin` + WS PropertyInspector | 골격만 | **HIGH** |
| 파일 포맷 | `.streamDeckProfile` (압축 패키지) | `.cubeone` 일부 흔적 (web API), 나머지 미정의 | **HIGH** |
| 아이콘 팩 | 17종 `.sdIcons` 디렉토리 | 없음 | MED |
| 페이지/폴더 | 풀 지원 | 없음 | **HIGH** |
| 멀티액션 | 별도 플러그인 | 없음 | MED |
| 멀티 디바이스 | 14종 | 없음 (모바일 컴패니언 1종 가정) | LOW (큐브는 디바이스 비종속) |
| 모바일 컴패니언 | Stream Deck Mobile (별도 앱) | apps/mobile (Capacitor) 일부 | OK |
| 다국어 | Qt Translations | 없음 | MED |
| WS 서버 | PI ↔ App | LAN PWA ↔ Helper | 다른 용도이나 OK |
| 트레이 | 있음 | 있음 ✓ | OK |
| 시크릿 | OS 키체인 | Windows Credential Manager ✓ | OK |
| 코드 사이닝 | EV 있음 | 없음 | LOW (출시 직전 처리) |

---

## 5. 잔류 의문 (다음 단계 전 확인 필요)

1. **`apps/web/api/cubeone/route.ts`** 내용 — `.cubeone` 포맷이 어디까지 정의되었는지 확정해야 M1 일정 변동.
2. **`/list/page.tsx`** 가 편집기인지 러너인지 — 14 KB 분량이라 판단 필요.
3. **`/seeds/SeedsList.tsx`** 22 KB가 카테고리 트리/빌트인 큐브 카탈로그인지 — 그렇다면 카테고리 뷰 일부 재활용 가능.

확인 즉시 `02-roadmap.md` M0 작업량 재산정.
