# 큐브 리스트 PC 트랙 — 베타 릴리즈 체크리스트 (M9)

작성: 2026-05-24 (cron #24). cron 자동 진행 사이클로 M0~M8 핵심 완료 후 베타 출시 준비.

---

## 1. M0~M8 완료 항목 요약

| M | 영역 | 산출 |
|---|---|---|
| M0 | 모노레포 통합 | apps/{mobile-pwa, mobile-native, pc-version} + cubeone/ 자산 이전 |
| M1 | PC 데스크톱 UI 셸 | Vite + React + TS 3-패널 + Tauri devUrl/frontendDist 연결 |
| M2 | 데이터 모델 + 편집 | zustand store + 다중 리스트 탭 + @dnd-kit reorder + .cubepack ZIP I/O + 양방향 인스펙터 + 큐브 추가/삭제 |
| M3 | 액션 시스템 | actions/ 10 spec + 동적 payload 폼 + Rust 10 enum + guard + 9 OS impl + Tauri execute_cube + frontend bridge |
| M4 | 플러그인 SDK v1 | .cubeplugin 포맷 spec + Rust loader (ZIP/traversal/서명 hook) + invoke list_plugins/install_plugin + frontend plugin-registry + Inspector 통합 + 샘플 |
| M5 | 모바일 PWA ↔ PC 호환 | wire 12 영역 검증 + action_id fallback + docs/06-wire-compat.md |
| M6 | 카테고리 뷰 | ActionCategory 7종 + Sidebar 3섹션 (카테고리/빌트인/플러그인) + 통합 필터 |
| M7 | 폴더 + 페이지 + 멀티액션 | folder stack + visibleCubes 격리 + 페이지네이션 + MacroStepEditor 5종 비주얼 |
| M8 | i18n + Updater 인프라 | useTranslation (ko/en/ja) + 24 라벨 + LocaleSwitcher + Updater 매니페스트 활성 |

**현재 위치**: M9 베타 출시 준비 단계. 결정 대기 2건 (D-06, D-07).

---

## 2. 결정 대기 (사용자 필요)

### D-06 Tauri Updater 엔드포인트 + Ed25519 pubkey

Tauri Updater 가 정상 동작하려면 다음 3가지 필요:
1. **Ed25519 키 쌍 생성** — `cargo tauri signer generate -w ~/.tauri/cubelist.key`
2. **엔드포인트 호스팅** (3 옵션):
   - **GitHub Releases**: 무료, 표준. `https://github.com/rebirthstationproject-beep/rebirth-station/releases/latest/download/latest.json`
   - **Vercel 정적 호스팅**: 도메인 깔끔 (`https://rebirthstation.com/updates/cubelist/latest.json`)
   - **S3/CloudFlare R2**: 비용 ↑, 권장 X (소규모)
3. **`tauri.conf.json` `plugins.updater.endpoints` + `pubkey` 추가**

**권장**: GitHub Releases (무료 + 자동 매니페스트 업로드 Action 가능).

### D-07 EV 코드 사이닝 인증서

| 옵션 | 가격 | SmartScreen | 리드타임 |
|---|---|---|---|
| 무서명 | $0 | 다운로드 시 매번 경고 + 사용자 수동 해제 | 0 |
| OV 인증서 | $100~200/년 | 수천 다운로드 누적 후 자동 통과 | 1주 |
| **EV 인증서** | **$300~500/년** | **즉시 통과 (배포 첫날부터)** | 2~4주 |

**권장**: 베타 단계 = 무서명 + SmartScreen 안내 페이지, **Q2 진입 직전 EV 발급**.

**잠정 (사용자 결정 전)**: 베타는 무서명으로 진행, 다운로드 페이지에 "Windows Defender SmartScreen 경고 시 → 추가 정보 → 실행" 안내 명시.

---

## 3. 베타 빌드 절차 (Windows)

```powershell
# 사전 조건
# - Visual Studio 2022 Build Tools (MSVC v143)
# - Rust 1.95.0+ (stable)
# - Node 20.x
# - cargo install tauri-cli --version "^2"

cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version

# 1. frontend dist 갱신
cd frontend
npm install
npm run build

# 2. Rust 헬퍼 + Tauri bundle (msi + nsis 양쪽, 약 5~15분)
cd ..
cargo tauri build --features keys

# 산출물 위치
# target/release/bundle/msi/큐브 리스트_0.1.0_x64_ko-KR.msi
# target/release/bundle/nsis/큐브 리스트_0.1.0_x64-setup.exe
# target/release/bundle/updater/큐브 리스트_0.1.0_x64-setup.nsis.zip (Updater 매니페스트용)
```

---

## 4. 배포 흐름 (GitHub Releases 가정)

```
1. 버전 bump
   - apps/pc-version/Cargo.toml: version = "0.1.0" → "0.1.1"
   - apps/pc-version/tauri.conf.json: "version": "0.1.0" → "0.1.1"
   - apps/pc-version/frontend/package.json: 동일

2. cargo tauri build --features keys

3. GitHub Release 작성
   - Tag: cubelist-pc-v0.1.1
   - Title: 큐브 리스트 PC v0.1.1 (베타)
   - Asset 업로드:
     · *.msi
     · *.exe
     · *.nsis.zip (Updater 매니페스트)
     · latest.json (Updater 엔드포인트용 — 자동 생성 스크립트 후속)

4. Updater 매니페스트 latest.json 형식 (예시):
   {
     "version": "0.1.1",
     "notes": "베타 — 폴더/페이지/매크로 추가",
     "pub_date": "2026-05-24T12:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "signature": "...",
         "url": "https://github.com/rebirthstationproject-beep/rebirth-station/releases/download/cubelist-pc-v0.1.1/큐브-리스트_0.1.1_x64-setup.nsis.zip"
       }
     }
   }

5. 사용자에게 SmartScreen 안내 (EV 사이닝 전):
   "Windows 보호 안내: 실행 → 추가 정보 → 실행"
```

---

## 5. 베타 진입 전 체크

- [ ] D-06 Updater 엔드포인트 결정 → tauri.conf.json plugins.updater 채우기
- [ ] D-07 EV 사이닝 결정 (또는 베타 = 무서명)
- [ ] cargo tauri build --features keys 통과 확인 (사용자 환경)
- [ ] frontend build 통과 확인 (이미 ✅)
- [ ] 시각 검증: cargo tauri dev → 1280×800 편집기 셸 표시 + 데모 큐브팩 로드 + 드래그&드롭
- [ ] 모바일 PWA 와 wire 호환 검증 (E2E, M9 후반 자동화 또는 수동)
- [ ] PROJECT.md / STATE.md 최종 갱신 (M9 ✅ 표기)
- [ ] CHANGELOG.md 신설 (v0.1.0 베타 노트)

---

## 6. 모바일 PWA 트랙 (M9 병렬)

PC 베타와 별개로 모바일 PWA 트랙도 베타 출시 준비:
- Capacitor 빌드 → Android internal testing / iOS TestFlight
- PWA 직접 배포 (Vercel) — 모바일 브라우저에서 즉시 사용
- 페어링 흐름 E2E (PC 헬퍼 ↔ 모바일 PWA QR)

본 체크리스트는 PC 트랙 한정. 모바일 PWA 베타는 `apps/mobile-pwa/` 별도 작업.

---

## 7. 후속 (베타 → v1.0)

- ed25519-dalek 실 서명 검증 활성 (`plugins/signature.rs` 현재 placeholder)
- LAN WS 클라이언트 (PC frontend 비-Tauri 경로)
- PropertyInspector iframe 임베드 (.cubeplugin v2 — inspector/ runtime/ 활성)
- 모바일 PWA 시드 카탈로그 PC 이식
- E2E 자동화 (Playwright + Tauri WebDriver)
- 멀티 플랫폼 (macOS) 빌드
