# M4 진행 로그

## 2026-05-27 21:30 — 시작

**사용자 명시**: PropertyInspector 작동 확인됨 (Tomato Timer 옵션 폼 정상 표시). autonomous cron 15분 진행, 내일 아침까지 단계별 완성.

**계획**: docs/M4-PLAN.md 참조.

**현재 v21** (PID 78912):
- ✅ Phase 1: 자산 추출 + cubeone 메타
- ✅ Phase 2: iframe + MockWebSocket + SDK 메시지 ~20종
- ✅ Phase 2: asset:// 프로토콜 작동 + PI iframe 검증됨
- ⏳ Phase 3: Action runtime (큐브 셀 실시간 갱신) 작동 미검증
- ⛔ Phase 4: Native (.exe) plugin

## 진행 기록

매 cron 다음 형식:
```
### YYYY-MM-DD HH:MM cron #N — Step X.Y
변경: <변경 사항>
검증: <빌드/시각/사용자 보고>
결과: ✅ / ⚠ blocked / ❌ retry
다음: <다음 sub-step>
```

### 2026-05-28 cron #3 — Step 3.1 (WebSocket 서버 골격)
변경:
- Cargo.toml: futures-util 0.3 의존성 추가 (stream split)
- src/plugin_server.rs 신규 (~180 줄):
  · PluginServer 구조체 (port, connections HashMap, emit_callback)
  · TcpListener 동적 포트 (127.0.0.1:0 = OS 할당)
  · accept loop → 연결마다 tokio::spawn(handle_connection)
  · handle_connection: WebSocket handshake → 첫 메시지 = registerPlugin → context UUID 매핑
  · plugin → frontend: emit_callback (Tauri AppHandle.emit) 호출
  · frontend → plugin: ConnectionMap 에서 sender 찾아 ws.send
  · send_to_plugin / drop_context 메서드
- src/lib.rs:
  · plugin_server 모듈 등록
  · PluginServerState (Arc<Mutex<Option<PluginServer>>>) 추가
  · setup() 에서 PluginServer::start() 비동기 시작 + emit_callback 등록
검증: cargo check 통과 (35s), cargo tauri build 1m, exe v24
결과: ✅ Step 3.1 완료 — WebSocket 서버 동적 포트로 백그라운드 작동
다음: Step 3.2 spawn_plugin_process Tauri 명령 + 3.3 표준 SDK 인자

### 2026-05-27 21:52 cron #2 — Step 2.1 + 2.2 + 2.3 + 2.4
변경:
- Cargo.toml: urlencoding "2" 의존성 추가
- src/lib.rs: LibraryDirState (Mutex<Option<String>>) 추가, register_uri_scheme_protocol("cubelist-plugin", ...) 등록
- src/commands.rs: cubelist_plugin_protocol_handler 신규 (URL → 파일 read + HTTP response)
  · URL: cubelist-plugin://<plugin_id>/<rest_of_path>
  · 보안 가드: canonicalize → library_dir 안 확인, .. 차단
  · MIME sniff 확장자 별 (html/js/css/png/svg/mp3/wav/mp4 등 17종)
  · 헤더: Content-Type + Access-Control-Allow-Origin: * + Cache-Control: no-cache
  · X-Frame-Options 미설정 → iframe 안 로드 가능 (WebView2 "콘텐츠 차단" 우회 백업)
- src/commands.rs: set_library_dir_state 신규 Tauri 명령 (frontend → Rust state 등록)
- frontend/src/lib/plugin-runtime.ts: buildPluginUrl() 신규 → iframe.src 1차 = cubelist-plugin://, 재시도 시 asset:// fallback
- frontend/src/App.tsx: library_dir 등록 시 invoke('set_library_dir_state') 자동 호출
- tauri.conf.json CSP: cubelist-plugin: 모든 directive 추가 (frame-src, connect-src, img-src, script-src 등)
검증: Cargo 빌드 통과 (urlencoding 다운로드), frontend build 1.04s, exe v23 시각 검증
결과: ✅ Step 2.1~2.4 완료. asset:// 1차 차단 시 cubelist-plugin:// 자동 대체 작동 기반 마련
다음: Step 2.5 — asset:// 폴백 유지 (이미 retryCount>0 시 asset 시도) + Step 3.1 (Rust WebSocket 서버 시작)

### 2026-05-27 21:37 cron #1 — Step 1.1 + 1.2 + 1.3 + 1.4
변경:
- plugin-runtime.ts: retryCount + connectTimer + doMount() 분리 → 5초 안 connected 안 되면 자동 재시도 (최대 3회, 1s/2s/3s 백오프)
- imageCallCount / lastImageAt 진단 필드 추가
- iframe error / load timeout 시 scheduleRetry()
- PluginRunnerHost.tsx: getCubeRuntimeStatus 에 imageCallCount + lastImageAgeMs 추가
- App.tsx Inspector: status 박스에 "setImage 호출 N회 · 마지막 Mms 전" 표시 → 실시간 갱신 작동 가시화
검증: frontend build 810ms · exe v22 빌드 통과
결과: ✅ Step 1.1~1.4 완료 (1.5 = 28 plugin 검증은 Step 6 으로 합침)
다음: Step 2.1 — Tauri custom URI scheme protocol (Rust register_asynchronous_uri_scheme_protocol)
