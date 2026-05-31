# 큐브 리스트 PC 사용자 가이드 (v0.1.1)

> Rebirth Station 큐브 리스트 — StreamDeck 동등 + 자유도 확장 + 큐브 무제한.

## 1. 시스템 개요

### 큐브 개념
- **큐브 (Cube)** = 1개 기능 버튼 (링크 / 단축키 / 매크로 / 시계 / 배터리 등)
- **큐브 리스트 (Cube List)** = 큐브 묶음 = 그리드 1탭 (= StreamDeck 페이지)
- **큐브 팩 (Cube Pack)** = 리스트 묶음 = 앱 1개 분량 (= StreamDeck 프로필)

### 파일 포맷
- `.cubeone` — 단일 큐브
- `.cubelist` — 큐브 묶음 (StreamDeck `.streamDeckPlugin` 변환 산물)
- `.cubepack` — 다중 리스트 묶음 (StreamDeck `.streamDeckProfile` 변환 산물)

### StreamDeck 호환
- **사용자 정의 영구 매핑**: StreamDeck 플러그인/프로필 → 큐브 리스트/팩 변환 100% 호환
- **차이점**: StreamDeck 물리 버튼 한도 (Mini 6 / Std 15 / XL 32 / Plus 8+인코더) vs **큐브 무제한** (페이지·폴더 확장)
- **나머지 구성은 동일** (액션·메타·이미지·Settings·States·Title·Controllers)

---

## 2. PC 앱 설치 및 실행

### 시스템 요구사항
- Windows 10/11 (64-bit)
- WebView2 Runtime (보통 기본 설치)

### 다운로드 + 설치
1. GitHub Releases에서 `cubelist-pc-helper_0.1.1_x64-setup.exe` 다운로드
2. 실행 → SmartScreen 경고 시 "추가 정보" → "실행"
3. 설치 마법사 진행
4. 시작 메뉴에서 "큐브 리스트" 실행

### 첫 실행
- 1280×800 윈도우 표시
- 사이드바 (왼쪽) + 큐브 그리드 (중앙) + 인스펙터 (오른쪽) 3-패널 레이아웃
- 데모 큐브팩 자동 로드 (생산성 + 미디어 리스트)

---

## 3. StreamDeck 플러그인 → 큐브 리스트 변환

### 방법 A — PC 앱 내장 변환 (권장)
1. TopBar **"📥 플러그인 변환"** 클릭
2. `.streamDeckPlugin` 파일 선택 (Ctrl+클릭으로 다수 선택 가능)
3. 자동 변환 → 라이브러리에 큐브 리스트 추가
4. 변환 통계 알림 표시

### 방법 B — 스크립트 일괄 변환 (개발자 모드)
```powershell
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version
node scripts/import-streamdeck-plugins.mjs "C:\Users\PC\Downloads\플러그인"
# 출력: C:\Users\PC\Downloads\플러그인\CUBE\
#   각 plugin → 폴더 (= 큐브 리스트) / 폴더 안 .cubeone × N (각 Action)
```

### 변환 매핑
- 각 StreamDeck Action 1개 = 큐브 1개 (.cubeone)
- Action 라벨/아이콘/플러그인 자산 자동 추출
- Tier 1 액션 (website / open / openapp / hotkey / text / mouse) → 직접 매핑
- P1 11 신규 액션 (multimedia / pagination / page / backtoparent / openchild / close / sleep / actionbar / hotkeyswitch / soundboard / rotate) → 자동 매핑
- 나머지 → `plugin_action` (M4 Plugin Runtime 으로 실행)

---

## 4. StreamDeck 프로필 → 큐브팩 변환

### 스크립트 일괄 변환
```powershell
cd E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version
node scripts/import-streamdeck-profile.mjs ^
  "C:\Program Files\Elgato\StreamDeck\DefaultProfiles" ^
  "C:\Users\PC\Downloads\프로필\CUBEPACK"
# 출력: 각 .streamDeckProfile → 1 .cubepack
# 디바이스별 그리드 자동 매핑 (Mini 3×2 / Std 5×3 / XL 8×4 / Plus 4×2 / Neo 4×2)
```

### 변환 매핑
- Profile.Device.Model → device_hint 자동
- Page 1개 = 큐브 리스트 1개
- Action 좌표 (col, row) → cube.sort_order (row × cols + col)
- States[] / Title 메타 / Settings / Controllers 모두 보존 (영구 lock)

---

## 5. 라이브러리 등록 + 사이드바 탐색

### 라이브러리 폴더 등록
1. TopBar 우상단 **📁 폴더 아이콘** 클릭
2. 폴더 경로 입력 (예: `C:\Users\PC\Downloads\플러그인\CUBE`)
3. 확인 → 자동 스캔
4. 사이드바에 큐브 리스트 트리 표시

### 사이드바 트리 구조
```
📂 내 라이브러리
├── 📁 Spotify (큐브 리스트 = 폴더)
│   ├── ▫ Multimedia
│   ├── ▫ Spotify Liked
│   └── ...
├── 📁 OBS Studio
│   └── ...
└── 📁 기타 (최상위 .cubeone 묶음)
```

### 큐브 클릭
- **단일 클릭** = 선택 (인스펙터에 상세 표시)
- **드래그** = 그리드 슬롯으로 배치
- **더블 클릭 (그리드 안)** = 실행
- **휠 (그리드 안)** = StreamDeck+ 인코더 dialRotate 매핑

---

## 6. 그리드에 큐브 배치

### 방법 1 — 라이브러리에서 드래그
- 사이드바 큐브 → 그리드 빈 슬롯에 드래그
- 자동 sort_order 부여

### 방법 2 — 빈 슬롯 클릭 (자유 슬롯 배치)
- 그리드 빈 슬롯 (점선) 클릭
- 자동 큐브 생성 (action_type 기본 = link, 인스펙터에서 변경)

### 그리드 레이아웃 변경
- TopBar "⚙ 그리드 설정" 클릭
- 컬럼 수 (3~8) + 페이지당 큐브 수 자유 설정

---

## 7. 큐브 편집 (인스펙터)

### 인스펙터 필드
| 필드 | 의미 |
|---|---|
| 라벨 | 큐브 하단 표시 텍스트 |
| 액션 타입 | 25 enum 중 선택 (10 코어 + 11 P1 + 4 P2) |
| 액션별 폼 | 동적 schema (URL/keys/path/text 등) |
| Tier 배지 | 1(안전) / 2(동의) / 3(영구토글) |
| 카테고리 | 생산성 / 미디어 / 개발 / 디자인 / 게이밍 / 시스템 / 웹 |
| 테스트 실행 | ▶ 버튼 (Tauri 환경 한정) |

### 액션 타입 카테고리
- **링크/웹**: link
- **단축키**: shortcut / hotkey_toggle
- **시스템**: app_launch / window_close / system_sleep / system_actionbar_toggle / page_navigate / page_jump / folder_up / folder_open / profile_rotate
- **미디어**: media_key / audio_play
- **텍스트/클립**: text_insert / clipboard_copy
- **마우스**: mouse_click
- **매크로**: macro (5 step 종류 비주얼 폼)
- **폴더**: folder (서브덱)
- **동적**: live_clock / live_timer / live_gauge / live_battery
- **플러그인**: plugin_action (StreamDeck plugin 변환분)

---

## 8. 큐브 실행

### 그리드에서
- 큐브 더블클릭 → 즉시 실행
- 인스펙터 **▶ 테스트 실행** 버튼

### Tier별 동작
- **Tier 1** (안전): 즉시 실행 (link / text_insert / clipboard_copy / media_key 등)
- **Tier 2** (동의): 첫 실행 시 동의 prompt (예정, 현재 stub)
- **Tier 3** (영구토글): 사용자 명시 활성 후 실행 (system_sleep)

### plugin_action 실행
- M4 Plugin Runtime SDK가 자동 처리
- HTML PropertyInspector iframe
- Native .exe sidecar 자동 spawn

---

## 9. 동적 큐브 (시계/타이머/게이지/배터리)

### live_clock — 디지털 시계
- 형식: HH:MM:SS (1초 갱신) / HH:MM (30초 갱신) / h:MM AM/PM (1분 갱신)
- 사용 예: 시간 항상 표시

### live_timer — 카운트다운 타이머
- 목표 epoch ms 입력 → 남은 시간 자동 갱신 (1초)
- 형식: MM:SS 또는 HH:MM:SS

### live_gauge — 게이지 (수치 + 색상 바)
- value / min / max + unit + label_prefix
- 자동 SVG 바 (hue 0=빨강 → 120=초록)
- 사용 예: CPU 사용량, 디스크 잔량

### live_battery — 배터리 잔량
- 시스템 (navigator.getBattery) 또는 수동 입력
- 배터리 모양 SVG + 색상 (>50 초록 / >20 노랑 / 그 외 빨강)

---

## 10. 큐브 리스트 저장 + 내보내기

### 저장
- TopBar **"💾 저장"** 클릭
- 활성 큐브 리스트 → 라이브러리 폴더에 `.cubelist` (또는 다중 페이지면 `.cubedeck`) 저장
- 라이브러리 폴더 미등록 시 다운로드 폴더에 저장

### 내보내기
- **개별 큐브** = 인스펙터 우상단 메뉴 → `.cubeone` 다운로드
- **큐브 리스트** = TopBar 메뉴 → `.cubelist` 다운로드
- **큐브 팩 (전체)** = TopBar **"📤 내보내기"** → `.cubepack` 다운로드

### 가져오기
- **개별 큐브** = TopBar 메뉴 → `.cubeone` 선택 → 라이브러리 풀에 등록
- **큐브 리스트** = TopBar 메뉴 → `.cubelist` 선택 → 라이브러리에 추가
- **큐브 팩** = TopBar **"📥 가져오기"** → `.cubepack` 선택 → 현재 작업 영역으로 로드

---

## 11. 단축키 & UX 팁

| 단축키 | 동작 |
|---|---|
| Ctrl+S | 저장 |
| Ctrl+Z / Ctrl+Y | 실행 취소 / 다시 실행 (예정) |
| Delete | 선택 큐브 삭제 |
| F2 | 선택 큐브 라벨 즉시 편집 |
| Esc | 폴더 → 상위 |

### 다국어 (i18n)
- TopBar 우측 **KO | EN | JA** 토글
- localStorage 영속 (다음 실행 시 유지)

---

## 12. 자주 묻는 질문

### Q. StreamDeck 디바이스 없어도 사용 가능한가요?
**A.** 네. 큐브 리스트는 100% PC 소프트웨어 — StreamDeck HW 불필요. 마우스/키보드만으로 조작.

### Q. StreamDeck에서 작동하던 플러그인이 변환 후 작동 안 합니다.
**A.** 다음 경우 가능:
- DRM/암호화 plugin (Elgato 자체 보안 모듈 의존)
- 실시간 API plugin (Twitch/Discord 등 OAuth 의존)
- HW 의존 plugin (인코더·LCD 전용)

대부분의 일반 plugin은 변환 후 정상 작동. M4 Plugin Runtime이 PI HTML + Sidecar .exe 자동 호스팅.

### Q. 큐브 무제한이라는데 진짜 무제한인가요?
**A.** 네. 페이지네이션 (cubes_per_page) + 폴더 (서브덱) 무한 중첩으로 사실상 무제한. StreamDeck 물리 버튼 한도와 무관.

### Q. 모바일에서도 사용 가능한가요?
**A.** 모바일 PWA 트랙이 별도로 있습니다 (`apps/mobile-pwa/`). M5 wire 호환으로 PC ↔ 모바일 페어링 가능.

### Q. 파일 포맷이 미래에 바뀌나요?
**A.** **영구 lock** (2026-05-31). `rbs_format_version: 3` 영구 유지. 신규 필드는 `extensions` / `streamdeck_meta`로 흡수. StreamDeck SDK 미래 변경도 변환기가 forward-compat로 흡수.

---

## 13. 참고 자료

- 파일 spec: `docs/specs/cubeone-v3.md` / `cubelist-v3.md` / `cubepack-v3.md`
- StreamDeck 호환: `docs/specs/streamdeck-compat.md`
- 베타 출시 가이드: `docs/release/beta-v0.1.1-guide.md`
- 변경 이력: `CHANGELOG.md`

## 14. 문의 / 버그 신고

- GitHub Issues: `https://github.com/rebirthstationproject-beep/rebirth-station/issues`
- 이메일: rebirthstationproject@gmail.com
