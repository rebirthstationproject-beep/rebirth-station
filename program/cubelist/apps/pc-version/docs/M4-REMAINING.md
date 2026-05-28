# M4 잔여 작업 — 기능적 동일성 솔직 보고

## 현재 v28 까지 완성된 기능 (StreamDeck SDK 호환)

### Host → Plugin events (8종)
- ✅ willAppear / willDisappear
- ✅ keyDown / keyUp
- ✅ didReceiveSettings / didReceiveGlobalSettings
- ✅ sendToPlugin (PI → action)
- ✅ didReceiveDeviceList (getDeviceList 응답)

### Plugin → Host commands (15종)
- ✅ setImage / setTitle / setState
- ✅ setSettings / getSettings
- ✅ setGlobalSettings / getGlobalSettings
- ✅ sendToPropertyInspector / sendToPlugin
- ✅ showAlert / showOk
- ✅ openUrl
- ✅ logMessage
- ✅ switchToProfile (host 콜백)
- ✅ setTriggerDescription (StreamDeck+ 인코더, 큐브 환경 = 표시만)
- ⚪ setFeedback / setFeedbackLayout — 인코더 layout, 큐브 리스트 비호환 = 무시

### Plugin 환경 종류
- ✅ HTML/JS plugin (Tomato Timer, Audio Mute, Voicemod, Discord Volume Mixer, Spotify, Twitch 등) — iframe + MockWebSocket
- ✅ Native (.exe) plugin (CPU, OBS Tools, Streamlabs 등) — child_process spawn + Rust WS 서버
- ✅ 암호화 manifest (ELGATO 매직) — en.json 평문 fallback
- ✅ PropertyInspector iframe — 옵션 폼 + 양방향 통신
- ✅ 다중 instance — 같은 plugin 큐브 N 개 = N 독립 context UUID + N 독립 process

### 인프라
- ✅ Tauri custom URI scheme (`cubelist-plugin://`) — HTTP 헤더 제어, X-Frame-Options 우회
- ✅ HTML `<base href>` 자동 inject — 상대 경로 정확 resolve
- ✅ Rust WebSocket 서버 (동적 포트, tokio-tungstenite)
- ✅ Process pool 관리 (HashMap, unmount 시 child kill)

## ⚠ 작동 불가능 / 부분 작동 — 솔직 보고

### A. 인코더 (StreamDeck+ 전용) — 큐브 리스트 환경 비호환
- `dialDown` / `dialRotate` / `touchTap` — 우리 큐브 셀 = 키만, 회전 다이얼 없음
- 영향 plugin: Wave Link, Streamlabs 일부 — 인코더 액션만 작동 안 함, 일반 키 액션은 OK

### B. Native plugin 의 외부 service 의존
- OBS Tools — OBS Studio (사용자 PC 에 별도 설치) 의 WebSocket 에 연결 시도. 미설치 시 graceful 실패
- Spotify Integration — Spotify Desktop 의 native API. 다른 vendor (BarRaider) 가 Spotify 미설치 시 작동 안 함
- Discord Volume Mixer — Discord Desktop 의 named pipe 사용
- 모두 사용자 환경 (OBS / Spotify / Discord 설치 여부) 에 의존. 큐브 리스트 측에서 더 할 수 있는 작업 없음.

### C. plugin manifest 의 multi-action
- StreamDeck 의 multi-action = 1 키에 여러 액션 묶음. 큐브 리스트 = 큐브 자체 macro 액션 지원 (이미)
- plugin_action 큐브 안에서 multi-action 은 미지원

### D. plugin 의 OS native call (예: Win32 COM, AppleScript)
- HTML plugin 의 OS call = WebView2 sandbox 안 = 직접 OS API 호출 어려움. 단 plugin 의 backend 가 .exe 면 OK (Native runtime 으로 작동)
- 일부 plugin = HTML + native 사이드카 (`bin/*.exe`). 우리 변환은 모든 .exe 보존하지만 자동 spawn 안 함 (manifest CodePath 만 spawn). 사이드카 plugin 은 작동 안 함.

### E. plugin update mechanism
- StreamDeck plugin 의 자동 업데이트 (Elgato MarketPlace) — 큐브 리스트 미지원. 사용자가 수동 .streamDeckPlugin 재변환

### F. plugin 다국어 (Localization)
- 큐브 라벨 = en.json 만 (현재). 한국어 plugin 시 ko.json 추출 추가 가능 (미구현)

### G. plugin 의 Property Inspector 가 외부 API 호출
- 일부 PI 가 OAuth (예: Twitch login) 또는 외부 fetch. CSP 제약으로 일부 차단 가능
- 현재 CSP = unsafe-inline + unsafe-eval + 모든 origin 허용. 대부분 OK 예상

## 잔여 코드 작업 (큰 변경 없음)

1. **plugin manifest 의 `Categories` → 큐브 만들기 페이지 카테고리 폴더** — 작은 UX 개선
2. **plugin 의 `Profiles` 폴더 (StreamDeck plugin 기본 layout)** — 큐브 리스트 list 자동 생성으로 매핑 가능
3. **사용자 plugin 추가 시 자동 reload** — 이미 구현 (window.location.reload)
4. **action 별 PropertyInspectorPath** — manifest 의 Actions[].PropertyInspectorPath 가 다를 수 있음. 현재 default propertyinspector/index.html 사용. 일부 plugin 은 액션 별 다른 PI 경로 — 추가 작업 가능

## 결론

**기능적 동일 = 95%+ 달성 가능**. 작동 안 되는 부분은:
- 외부 service 의존 plugin (사용자 PC 환경)
- 인코더 (StreamDeck+ 전용, 우리는 키 액션 환경)
- 일부 native sidecar plugin

**진짜 잔여 작업** (사용자가 100% 동일성 요구 시):
- A. action 별 PropertyInspectorPath 분기 (변환기에 추출)
- B. sidecar .exe 자동 spawn (CodePath 외에 bin/*.exe 도 시작)
- C. plugin 다국어 (ko.json / ja.json 등 fallback)
- D. 인코더 UI 추가 (큐브 셀에 회전 인디케이터)
- E. plugin 자동 업데이트 mechanism

A~C 는 1~2 cron 안 가능. D~E 는 큰 작업 (UX 재설계 / 별도 시스템).
