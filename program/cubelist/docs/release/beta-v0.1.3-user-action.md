# 큐브 리스트 PC v0.1.3 베타 — 사용자 액션 체크리스트

> 본 문서는 v0.1.3 베타 출시 전 **사용자 환경에서만 가능한 액션**과 그 결정 흐름을 담습니다.
> 코드/문서/CI 측면은 v0.1.3 메인 작업 완료 (2026-06-01).

작성: 2026-06-01 Phase 10

---

## 출시 준비도

| 영역 | 진행 |
|---|---|
| 핵심 기능 (Phase 1~5 P2 + Rust OS impl + LiveSync + 마켓플레이스 mockup) | ✅ |
| 인스펙터 + 4 자동 cover 경로 + 라이센스 prompt | ✅ |
| i18n 130+ 키 (ko/en/ja) + Tier 2/3 동의 + SettingsPanel 5 섹션 | ✅ |
| CI E2E 17 smoke + Tauri smoke 4 시나리오 | ✅ |
| 사용자 가이드 v0.1.3 보강 + 베타 출시 체크리스트 | ✅ |
| ExecutionStatus 6 variant (Ok/Failed/PermissionRequired/ActionNotFound/InvalidPayload/Timeout) | ✅ |
| **D-01 사용자 환경 `cargo tauri build`** | ⏳ 사용자 액션 |
| **D-02 .msi/.exe 산출물 검증** | ⏳ 사용자 액션 |
| **D-03 Smoke 수동 검증** (앱 기동/팩 로드/큐브 실행) | ⏳ 사용자 액션 |
| **D-04 GitHub Release 작성** | ⏳ 사용자 결정 |
| **D-05 README/landing 페이지 다운로드 링크 갱신** | ⏳ 사용자 결정 |
| **D-06 EV 코드 사이닝 인증서 도입 여부** | ⏳ 사용자 결정 |
| **D-07 자동 업데이트 채널 도입 여부** | ⏳ 사용자 결정 |

---

## D-01 — `cargo tauri build` 실행

### 사전 조건

- Rust 1.74+ (rustup default stable)
- Node.js 20+ + npm
- Windows 10/11 (다른 OS 빌드는 별도 머신)

### 실행

```powershell
# 1) frontend 빌드 (vite)
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version\frontend
npm install
npm run build

# 2) Tauri release 빌드 (target/release/bundle/msi/*.msi)
cd ..
cargo tauri build

# 산출물 위치
# - target/release/bundle/msi/cubelist-pc-helper_0.1.3_x64_en-US.msi
# - target/release/bundle/nsis/cubelist-pc-helper_0.1.3_x64-setup.exe
```

### 예상 시간

- frontend: 1~2분
- cargo tauri build: 5~10분 (첫 빌드는 의존성 컴파일로 더 오래 걸림)

---

## D-02 — 산출물 검증

체크리스트:

- [ ] `.msi` 파일 존재 + 크기 30~50 MB
- [ ] `.exe` (NSIS) 파일 존재
- [ ] 설치 후 시작 메뉴에 "큐브 리스트" 등록
- [ ] 첫 실행 시 1280×800 윈도우 표시
- [ ] WebView2 Runtime 자동 감지 (Windows 10/11 보통 사전 설치)

---

## D-03 — Smoke 수동 검증

### 핵심 시나리오 (10분 소요)

1. **앱 기동** → 데모 큐브팩 자동 로드
2. **TopBar 📥 가져오기** → 샘플 `.cubepack` 로드
3. **큐브 우클릭 → 편집** → 인스펙터 갱신
4. **큐브 우클릭 → 🖼 이미지 변경** → file picker → 즉시 반영
5. **큐브 우클릭 → 🏪 큐브팩 cover로 사용** → alert + 메타 갱신
6. **TopBar 🏪 팩 정보** → MarketplaceMetaEditor + silent 자동 캡처
7. **TopBar 📤 내보내기** → silent 자동 cover + 다운로드
8. **MainTab 🏪 마켓플레이스** → 6 카드 + 카드 클릭 → 상세 페이지
9. **유료 큐브팩 → 구매 버튼** → install_paid alert + 라이센스 prompt → "CL-short" → invalid alert
10. **Ctrl+F** → 전역 검색 → 큐브 클릭 → 인스펙터 자동 선택
11. **TopBar ⚙ 설정** → 단축키 viewer 6 항목 표시
12. **언어 ko → en → ja 전환** → 모든 UI 즉시 반영

### 액션 시나리오 (선택)

- `link` — 링크 큐브 클릭 → 브라우저 오픈
- `hotkey_toggle` — 단축키 큐브 클릭 → states 토글
- `app_launch` — 앱 실행 큐브 → Tier 2 prompt → 영구 동의

---

## D-04 — GitHub Release 작성

```
Tag: v0.1.3-beta
Title: Cube List PC v0.1.3 베타
Body: docs/release/v0.1.3-release-notes.md (작성 예정)
Artifacts:
  - cubelist-pc-helper_0.1.3_x64_en-US.msi
  - cubelist-pc-helper_0.1.3_x64-setup.exe
  - SHA256 체크섬 (.txt)
```

> Release 작성 시 "Pre-release" 체크박스 ON.

---

## D-05 — README/landing 갱신

- `README.md` 베타 다운로드 링크
- `apps/landing/` (있다면) 베타 배너
- 변경 사항: 라이센스 prompt mock / 마켓플레이스 mockup / v0.1.4 예고

---

## D-06 — EV 코드 사이닝 (옵션, 비용 발생)

### 도입 시 효과

- SmartScreen 경고 즉시 제거 (사용자 신뢰도 ↑)
- 자동 업데이트 채널 도입 시 필수에 가까움

### 비용

- DigiCert EV 인증서: USD $400~600/년
- Sectigo EV: USD $300~500/년
- 하드웨어 토큰 (HSM) 또는 클라우드 HSM 필수

### v0.1.3 베타 권고

> **미도입** — 베타 단계에서는 SmartScreen 우회 안내 (USER_GUIDE 2.3 절) 로 충분. v1.0 정식 출시 직전 도입.

---

## D-07 — 자동 업데이트 채널 (옵션)

### 도입 시 효과

- 사용자 클릭 1회로 신버전 자동 설치
- 보안 패치 빠른 전파

### 구현

- `tauri-plugin-updater` + 자체 서버 또는 GitHub Releases 활용
- 업데이트 매니페스트 JSON: `https://updates.rebirthstation.com/cubelist/latest.json`
- Ed25519 서명 검증 (라이센스 키와 동일 키체인 활용)

### v0.1.3 베타 권고

> **미도입** — 베타 사용자는 GitHub Releases 수동 다운로드. v0.1.4 마일스톤에서 활성화 (라이센스 키 Ed25519 서명 인프라 공유).

---

## 결정 흐름도 (의사결정 순서)

```
1. D-01 cargo tauri build 성공?
   YES → D-02
   NO  → 빌드 에러 보고 → 수정

2. D-02 산출물 정상?
   YES → D-03
   NO  → tauri.conf.json / build.rs 점검

3. D-03 Smoke 통과?
   YES → D-04 진행
   NO  → 사용자 보고 후 v0.1.3.1 패치 또는 v0.1.4 진입

4. D-04 GitHub Release 작성 가능?
   사용자가 Pre-release 작성 OK → 진행
   "아직 외부 공개 안 함" → 내부 사용자만 .msi 직접 배포

5. D-05 README 갱신?
   외부 공개 OK → 다운로드 링크 갱신
   내부만 → 베타 안내만

6. D-06 EV 사이닝?
   v0.1.3 베타 → 미도입 (권고)
   v1.0 정식 → 도입 (필수에 가까움)

7. D-07 자동 업데이트?
   v0.1.3 베타 → 미도입 (권고)
   v0.1.4 → 활성화 (라이센스 인프라 공유)
```

---

## 참고

- USER_GUIDE: `docs/USER_GUIDE.md` v0.1.3 보강
- 이전 베타 가이드: `docs/release/beta-v0.1.1-guide.md`
- CHANGELOG: `CHANGELOG.md` v0.1.3 + Phase 1~10 (2026-06-01)
