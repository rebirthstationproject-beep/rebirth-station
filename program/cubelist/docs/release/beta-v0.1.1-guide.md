# 큐브 리스트 PC v0.1.1 베타 출시 가이드 (2026-05-31)

> Phase 1 ~ 5 P2 + Rust OS impl 완료 상태에서 베타 출시까지 단계별 가이드.
> 이전 v0.1.0 (cron #25) → v0.1.1 (Phase 1·3·5 P2 + 영구 lock 완료).

## 1. v0.1.0 → v0.1.1 변경 요약

### 파일 spec 영구 lock (P0)
- `.cubeone` / `.cubelist` / `.cubepack` v3 영구 lock
- Cube/CubeList/CubePack에 영구 옵셔널 필드 추가:
  - `states` (멀티 상태)
  - `title_style` (Font/Color/Alignment)
  - `controller_type` (main/dial/touchpad)
  - `extensions` / `streamdeck_meta` / `streamdeck_source` (forward-compat)
- `docs/specs/cubeone-v3.md` / `cubelist-v3.md` / `cubepack-v3.md` / `streamdeck-compat.md` 4종 명세

### P1 11 신규 액션 (스트림덱 100% 호환)
- media_key / page_navigate / page_jump / folder_up / folder_open / window_close
- system_sleep / system_actionbar_toggle / hotkey_toggle / audio_play / profile_rotate
- frontend specs + Rust ActionPayload variant + guard + dispatch
- 즉시 OS impl: media_key (enigo) + window_close (Alt+F4)
- 나머지: frontend store 처리 또는 Tier 3 stub

### P2 동적 큐브 시스템
- live_clock / live_timer / live_gauge / live_battery
- `lib/dynamic-cube.ts` tick 시스템 (DynamicCubeRegistry)
- `lib/useDynamicCubes.ts` React hook (1s/30s/5s interval)
- CubeGrid 통합 — 정적 큐브 영향 0

### `.streamDeckProfile` → `.cubepack` 변환기
- `scripts/import-streamdeck-profile.mjs` 신규
- DefaultProfiles 13개 검증 — 13 .cubepack / 742 큐브 변환

### 시각 강화
- 큐브 셀 LCD 톤 (pure black + inset shadow + LED 글로우)
- PNG_TINY invert filter
- NO_ICON placeholder letter
- 그리드 베젤 (#0a0a0a)

---

## 2. D-06 — Tauri Updater 엔드포인트 결정 보조

### 3 옵션 비교

| 옵션 | 비용 | 안정성 | 설정 복잡도 | 권장도 |
|---|---|---|---|---|
| **GitHub Releases** | $0 | 높음 (GitHub SLA) | 낮음 (API 활용) | ★★★ 권장 |
| Vercel Static | $0 (free tier) | 중간 (Vercel 비용 폭탄 학습) | 중간 | ★ |
| AWS S3 | ~$1/월 | 매우 높음 | 높음 (IAM/policy) | ★★ |

### 권장: GitHub Releases

이유:
- 비용 0 (무료)
- 추가 인프라 불필요
- Vercel 비용 폭탄 학습 회피 (`feedback_vercel_cost_protection`)
- `rebirthstationproject-beep/rebirth-station` repo 이미 있음

### GitHub Releases 설정 절차

```powershell
# 1. Ed25519 키 생성 (Tauri Updater 서명용)
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version
cargo tauri signer generate -w ~/.tauri/myapp.key
# 출력: public key (tauri.conf.json) + private key (~/.tauri/myapp.key)

# 2. tauri.conf.json plugins.updater 추가
# {
#   "plugins": {
#     "updater": {
#       "active": true,
#       "endpoints": [
#         "https://github.com/rebirthstationproject-beep/rebirth-station/releases/latest/download/latest.json"
#       ],
#       "pubkey": "<위에서 생성한 public key>",
#       "dialog": true
#     }
#   }
# }

# 3. GitHub Actions workflow (이미 .github/workflows/ 에 추가 예정)
#    - tauri build 실행
#    - latest.json + .msi 자동 업로드
```

### latest.json 형식 예시
```json
{
  "version": "0.1.1",
  "notes": "v0.1.1 베타 — Phase 1~5 P2 완료",
  "pub_date": "2026-05-31T15:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<Ed25519 서명>",
      "url": "https://github.com/rebirthstationproject-beep/rebirth-station/releases/download/v0.1.1/cubelist-pc-helper_0.1.1_x64-setup.msi"
    }
  }
}
```

---

## 3. D-07 — EV 코드 사이닝 결정 보조

### 3 옵션 비교

| 옵션 | 비용 | SmartScreen | 사용자 경험 | 권장 시점 |
|---|---|---|---|---|
| **무서명** | $0 | 경고 표시 | "내 PC 보호" 클릭 필요 | **베타 단계 권장** |
| OV 인증서 (Sectigo 등) | $100~200/년 | 일정 평판 누적 후 통과 | 1~3개월 후 자동 통과 | Q2 진입 시 |
| EV 인증서 (DigiCert 등) | $300~500/년 | 즉시 통과 | 첫 다운로드부터 깨끗 | Q3 매출 시작 후 |

### 베타 무서명 안내 메시지 (사용자용)

```
큐브 리스트 v0.1.1 베타입니다.

Windows SmartScreen 이 "보호된 PC" 경고를 표시할 수 있습니다.
이는 새 인증서가 아직 평판을 누적하지 못한 정상적인 단계입니다.

설치 절차:
1. "추가 정보" 클릭
2. "실행" 클릭
3. 정상 설치

정식 출시 시점에 EV 코드 사이닝 인증서 적용 예정.
```

### 권장
**베타 = 무서명** + Q2 진입 직전 (사용자 50+ 또는 마켓플레이스 첫 매출 후) EV 구매.

---

## 4. cargo tauri build 실행 가이드

### 사전 준비 (1회만)

```powershell
# 1. Rust toolchain (없으면 설치)
winget install Rustlang.Rustup
# 또는 https://rustup.rs 에서 다운로드

# 2. Visual Studio Build Tools (없으면 설치)
winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

# 3. Tauri CLI
cargo install tauri-cli --version "^2"

# 4. WebView2 Runtime (보통 Windows 11 기본 설치)
#    없으면 https://developer.microsoft.com/microsoft-edge/webview2/ 에서 설치
```

### 빌드 명령

```powershell
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version

# 1. frontend 의존성 + 빌드
cd frontend
npm install
npm run build
cd ..

# 2. Tauri release 빌드 (keys feature 포함, OS 액션 활성)
cargo tauri build --features keys

# 산출:
# target/release/cubelist-pc-helper.exe (실 OS 액션)
# target/release/bundle/msi/cubelist-pc-helper_0.1.1_x64_en-US.msi (설치 패키지)
# target/release/bundle/nsis/cubelist-pc-helper_0.1.1_x64-setup.exe (NSIS 설치 패키지)
```

### 빌드 시간 예상
- 첫 빌드: 5~30분 (의존성 컴파일, 환경 의존)
- 증분 빌드: 30초~3분

### 빌드 실패 시
1. `cargo clean` 후 재시도
2. Rust toolchain 업데이트 (`rustup update`)
3. tauri-cli 업데이트 (`cargo install tauri-cli --force`)
4. WebView2 Runtime 재설치

---

## 5. GitHub Release v0.1.1 체크리스트

### 출시 전 검증
- [ ] frontend build → `dist/` 생성 확인
- [ ] cargo check 통과 (default + keys feature 양쪽)
- [ ] cargo tauri build --features keys 완료
- [ ] .msi 또는 -setup.exe 정상 동작 확인
- [ ] 라이브러리 등록 → 28 plugin (.cubelist) 표시
- [ ] StreamDeck 디스플레이 톤 시각 확인
- [ ] 동적 큐브 (live_clock 등) tick 확인

### 출시 절차
```powershell
# 1. 버전 태그
git tag -a v0.1.1 -m "v0.1.1 베타 — Phase 1~5 P2 완료"
git push origin v0.1.1

# 2. GitHub Release 생성 (CLI)
gh release create v0.1.1 \
  target/release/bundle/msi/cubelist-pc-helper_0.1.1_x64_en-US.msi \
  target/release/bundle/nsis/cubelist-pc-helper_0.1.1_x64-setup.exe \
  --title "큐브 리스트 v0.1.1 베타" \
  --notes-file docs/release/v0.1.1-release-notes.md \
  --prerelease

# 3. latest.json 업로드 (Updater 활성 시)
gh release upload v0.1.1 docs/release/latest.json
```

### CHANGELOG 자동 갱신
- `docs/release/v0.1.1-release-notes.md` 신규
- `apps/pc-version/CHANGELOG.md` v0.1.1 섹션 추가

---

## 6. 다음 단계 (v0.1.2 ~ v0.2.0)

| 작업 | 우선순위 | 예상 |
|---|---|---|
| 라이브러리 UX (트리 검색·필터) | 높음 | 1~2일 |
| Tier 2 액션 동의 시스템 (system_actionbar_toggle / audio_play 등 활성) | 중 | 2~3일 |
| Tier 3 액션 (system_sleep) 명시 토글 시스템 | 중 | 1~2일 |
| 모바일 PWA 동기화 강화 (M5+) | 중 | 2~3일 |
| 큐브팩 마켓플레이스 (가격 + 결제) | 낮음 (Q2) | 3~5일 |
| E2E 자동화 (Playwright + Tauri WebDriver) | 낮음 (v1.0 전) | 2~3일 |

---

## 7. 결정 요청

1. **D-06 Updater 엔드포인트**: GitHub Releases (권장) / Vercel / S3?
2. **D-07 EV 사이닝 시점**: 베타 무서명 (권장) / OV 즉시 / EV 즉시?
3. **빌드 환경 확인**: Rust + VS Build Tools + tauri-cli 설치되어 있나요?
4. **v0.1.1 베타 출시 진행 OK?**: 결정 후 `cargo tauri build` 시작

권장 답변 = **GitHub Releases + 베타 무서명 + 사용자 빌드 환경 확인 후 진행**.
