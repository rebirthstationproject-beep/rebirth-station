# Plugin 호환성 보고서 (M4 v28 기준)

**작성**: 2026-05-28
**기준**: 사용자 28 plugin (`C:\Users\PC\Downloads\플러그인\*.streamDeckPlugin`)

## 자동 변환 + 자산 추출 (frontend 변환기)

| plugin | manifest | 액션 수 | CodePath | 호환성 |
|---|---|---|---|---|
| Adobe Photoshop | 암호화 (en.json fallback) | 19 | native (.exe 가능) | ⚠️ Adobe Desktop API 의존 |
| Advanced Launcher | 평문 | 4 | HTML | ✅ |
| Analog Clock | 평문 | 1 | HTML | ✅ |
| Audio Mute | 평문 | 3 | HTML | ✅ |
| Clocks | 평문 | 2 | HTML | ✅ |
| Control Center | 암호화 | 8 | native | ⚠️ macOS Control Center 의존 |
| CPU | 평문 | 1 | `cpu.exe` (native) | ✅ Tauri spawn |
| Discord | 암호화 | 17 | native | ⚠️ Discord Desktop pipe |
| Discord Volume Mixer | 평문 | 9 | native (.exe) | ⚠️ Discord Audio API |
| OBS Studio | 암호화 | 19 | native | ⚠️ OBS WebSocket (사용자 설치) |
| OBS Tools | 평문 | 26 | `com.barraider.obstools.exe` | ⚠️ OBS WebSocket |
| Philips Hue | 암호화 | 10 | native | ⚠️ Hue Bridge LAN |
| Powerpoint | 암호화 | 12 | native | ⚠️ Office COM |
| Sound_Deck | ZIP 깨짐 | placeholder | - | ❌ |
| Speed Test | 평문 | 1 | HTML | ✅ |
| Spotify | 암호화 | 6 | native | ⚠️ Spotify Desktop |
| Spotify Integration | 암호화 | 1 | native | ⚠️ Spotify Web API |
| Streamlabs | 평문 | 17 | native | ⚠️ Streamlabs OBS |
| SuperMacro | 평문 | 6 | HTML | ✅ |
| Tomato Timer | 평문 | 1 | HTML | ✅ |
| Twitch | 암호화 | 16 | native | ⚠️ Twitch OAuth |
| Twitch Tools | 암호화 | 1 | native | ⚠️ Twitch IRC |
| Voicemod | 평문 | 11 | native | ⚠️ Voicemod Desktop |
| Volume Controller | 암호화 | 11 | native | ⚠️ Windows Audio API |
| Wave Link | 암호화 | 17 | native | ⚠️ Elgato Wave Link |
| Weather | 암호화 | 2 | HTML | ✅ (외부 API) |
| Win Tools | 암호화 | 1 | native | ⚠️ Windows API |
| YouTube | 평문 | 7 | HTML | ✅ (YouTube DataAPI) |
| YouTube Ticker | 평문 | 1 | HTML | ✅ (YouTube Live) |

## 호환성 합계

- ✅ **HTML plugin 완전 작동** = 9개 (Advanced Launcher, Analog Clock, Audio Mute, Clocks, Speed Test, SuperMacro, Tomato Timer, Weather, YouTube, YouTube Ticker)
- ✅ **Native plugin 작동 가능 (Tauri spawn)** = 1개 (CPU, OBS Tools 시도)
- ⚠️ **외부 service 의존** = 17개 (OBS / Spotify / Discord / Hue Bridge 등 별도 설치 시 작동)
- ❌ **ZIP 깨짐** = 1개 (Sound_Deck — placeholder 큐브 1개)

## SDK 메시지 호환성

### Host → Plugin (Events) — 8/8 ✅
willAppear, willDisappear, keyDown, keyUp, didReceiveSettings, didReceiveGlobalSettings, sendToPlugin, didReceiveDeviceList

### Plugin → Host (Commands) — 15/15 ✅
setImage, setTitle, setState, setSettings, getSettings, setGlobalSettings, getGlobalSettings, sendToPropertyInspector, sendToPlugin, showAlert, showOk, openUrl, logMessage, switchToProfile, setTriggerDescription

### 미지원 (큐브 리스트 환경 비호환) — 인코더 only
- dialDown / dialRotate / touchTap (StreamDeck+ 회전 다이얼)
- setFeedback / setFeedbackLayout (인코더 layout)

## 결론

**HTML plugin = 100% SDK 호환 + 사용자 환경 의존 없음**.
**Native plugin = SDK 호환 + 외부 service 의존성에 따라 작동 여부 결정**.
**총 28 plugin 중 약 9개 = 즉시 사용 가능, 17개 = vendor 앱 설치 시 사용 가능, 2개 = 한계 (인코더/깨짐)**.
