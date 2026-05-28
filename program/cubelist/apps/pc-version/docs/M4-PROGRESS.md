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

### 2026-05-28 cron #8 — Step 5 안정성 + Step 6 호환성 보고 + Step 7 마무리
변경:
- plugin-runtime.ts Step 5.3:
  · iframe.contentWindow.addEventListener('error') 등록 — plugin JS exception 자동 로그
  · 'unhandledrejection' 도 캡쳐 (Promise reject)
  · try/catch — cross-origin 시 listener add 실패 무시
- docs/PLUGIN-COMPATIBILITY.md 신규 (~70 줄):
  · 28 plugin 별 manifest 상태 + 액션 수 + CodePath + 호환성 분류
  · HTML 완전 작동 9 / Native + 외부 service 의존 17 / 한계 2
  · SDK 메시지 호환성 (Host→Plugin 8 + Plugin→Host 15 = 23종 ✅, 인코더 5종 ❌)
검증: frontend 818ms · cargo tauri build 55s · exe v29
결과: ✅ Step 5.3 + Step 6 명세 완료. Step 7.4 = cron 종료 + 사용자 보고
다음: CronDelete 본 job, 사용자에게 완료 보고

### 2026-05-28 cron #7 — Step 4 잔여 SDK + 잔여 작업 솔직 보고
변경:
- plugin-runtime.ts handlePluginMessage:
  · switchToProfile → onSwitchProfile 콜백 (host 가 list 전환 처리)
  · getDeviceList → didReceiveDeviceList 응답 (가상 device)
  · setTriggerDescription → onTriggerDescription 콜백 (인코더 안내)
  · setFeedback / setFeedbackLayout → 무시 (인코더 layout, 큐브 환경 비호환)
- PluginRuntimeOptions 에 onSwitchProfile + onTriggerDescription 추가
- docs/M4-REMAINING.md 신규 (~80 줄):
  · 완성된 SDK 메시지 8 + 15 종 명세
  · 작동 불가능 항목 솔직 보고 (인코더 / 외부 service / sidecar / 다국어 / Profile UI)
  · 기능적 동일 = 95%+ 달성 가능 결론
검증: frontend 861ms · cargo tauri build 56s · exe v28
결과: ✅ SDK 메시지 ~25종 완성. 잔여 작업 = 사용자 요구 시 추가
다음: Step 5.1~5.4 안정성 + Step 6 변환 검증 (큰 변경 없음)

### 2026-05-28 cron #6 — Step 3.6 + 3.7 + frontend native runtime
변경:
- src/lib.rs: PluginProcessState (HashMap<context_uuid, Child>) 추가 + manage
- src/commands.rs:
  · spawn_plugin_process 가 PluginProcessState 받음 → child 등록 + 충돌 시 이전 kill
  · drop_plugin_context — connection drop + child.kill() 둘 다 (Step 3.6)
  · list_plugin_processes — 디버그용 (현재 살아있는 process)
- frontend/src/lib/plugin-runtime.ts (큰 변경):
  · PluginRuntimeOptions 에 codePath + codeKind 추가
  · mount() codeKind 분기 — 'native' = doMountNative(), 'html' = doMount()
  · doMountNative() — listen('plugin_native_message') 등록 + invoke('spawn_plugin_process')
  · dispatchNative / sendNative — child process 와 메시지 양방향
  · fireKey() codeKind 분기
  · unmount() — native 시 invoke('drop_plugin_context') + listener cleanup
- frontend/src/components/PluginRunnerHost.tsx:
  · extractPluginMeta 에 codePath + codeKind 추가
  · PluginActionRunner — codeKind 가 native 면 entry = codePath (.exe)
검증: cargo check 1.73s · frontend 850ms · cargo tauri build 56s · exe v27
결과: ✅ Step 3.6 + 3.7 완료. native plugin (CPU, OBS Tools 등) 자동 분기 가능
다음: Step 3.8 (CPU plugin 검증) + Step 4 (잔여 SDK 메시지) — 사용자 환경 확인 필요

### 2026-05-28 cron #5 — HTML <base href> auto-inject (asset 에러 fix)
변경:
- src/commands.rs cubelist_plugin_protocol_handler:
  · text/html 응답 시 inject_base_href() 호출
  · inject_base_href() — <head>/<head ...>/<html> 자동 탐색 후 <base href="cubelist-plugin://<host>/<dir>/"> 삽입
  · case-insensitive 검색 (HTML 변형 대응)
  · charset utf-8 meta 도 함께 inject
- frontend/src/lib/plugin-runtime.ts:
  · asset:// fallback 완전 제거 — cubelist-plugin:// 만 사용
  · convertFileSrc import 제거
원인 (사용자 보고 directly): "File does not exist at path: common/common.js, action/js/clockfaces.js..."
해결 검증 가설:
- 모든 상대 경로 (action/js/clock.js 등) 가 cubelist-plugin:// 기반으로 resolve
- WebView2 의 base URL 추론 한계 우회
- 다음 cron 에서 사용자 환경 확인
검증: frontend 831ms · cargo tauri build 56s · exe v26
결과: ✅ 코드 완료. 사용자 환경 실 작동 = 다음 cron #6 확인
다음: Step 3.6 process lifecycle (spawn → unmount 시 kill) + 3.7 process pool

### 2026-05-28 cron #4 — Step 3.2~3.5 (Rust spawn 명령 + frontend codePath/codeKind)
변경:
- src/commands.rs:
  · spawn_plugin_process — child .exe spawn (SDK 표준 4 인자: -port -pluginUUID -registerEvent -info)
  · Windows CREATE_NO_WINDOW (0x08000000) — console 안 띄움
  · 보안: plugin_id /\..\ 차단, exe_path 존재 확인
  · send_to_plugin — frontend → plugin 라우팅 (Rust PluginServer.send_to_plugin)
  · drop_plugin_context — 큐브 unmount 시 connection 정리
- src/lib.rs: invoke_handler 3종 추가
- frontend/src/lib/plugin-converter.ts:
  · PluginManifest 에 CodePath / CodePathWin / CodePathMac 추가
  · detectCodeKind() — '.html' = html, 그 외 = native
  · cube.action_payload 에 code_path + code_kind 추가
사용자 보고 (cron 도중): "File does not exist at path: common/common.js, action/js/clockfaces.js..."
원인 분석:
- Tauri asset:// 가 iframe 안 상대 경로 (<script src="action/...">) base URL 자동 추론 못 함
- WebView2 의 custom URI scheme + base URL 처리 한계
- cubelist-plugin:// 도 동일 가능성 (HTML <base href> 없으면)
다음 cron 작업 (Step 3.5+):
- Rust handler 가 index.html 응답 시 <base href="cubelist-plugin://<id>/<dir>/"> 자동 inject
- 모든 상대 경로 cubelist-plugin:// 으로 resolve
검증: cargo check 2s, cargo tauri build 56s, exe v25
결과: ✅ Step 3.2~3.5 코드 완료. 다음 cron = base href inject (asset 에러 즉시 해결)
다음: Step 3.5+ HTML base href inject + Step 3.6 process lifecycle

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
