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
