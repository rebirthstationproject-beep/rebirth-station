# 야간 루프 20 페이즈 plan (2026-06-01 시작)

본 plan은 사용자 명시 "야간 작업으로 20 페이즈 세밀하게 준비해서 루프로 진행" 에 따라 작성.

모든 페이즈는 큐브 리스트 v0.1.3 베타 출시 마무리 + v0.1.4 사전 spec 으로 사용자 목표에 직결 (무한페이즈 금지 규칙 준수).

**완료 기준 (각 페이즈 공통)**:
1. 코드 또는 산출물 작성
2. (해당 시) Vite/cargo 빌드 통과
3. CHANGELOG 또는 spec 문서 갱신
4. commit + push (rebirth-station main)
5. 진행 보고 + 다음 페이즈 명시

---

## v0.1.3 베타 출시 마무리 (Phase 1~10)

### Phase 1 — Tauri WebDriver E2E 통합 셋업
- `e2e/tauri-driver.config.ts` + `e2e/tests/tauri-smoke.spec.ts`
- 시나리오: 앱 기동 → 빈 pack → cube 추가 → 라벨 입력 → 저장
- README 갱신 (WebDriver 실행 방법)

### Phase 2 — 모바일 PWA 큐브 우클릭 컨텍스트 메뉴
- PC 5 액션 모바일 long-press 대응 (`CubeContextMenu.tsx`)
- 모바일은 cover 사용 / 복제 / 삭제 (편집·이미지 변경은 sheet 활용)

### Phase 3 — 인스펙터 state_index 빠른 사이클 UI
- states 배열 있을 때 인스펙터에 ← → 버튼 추가
- 클릭 시 state_index 사이클 + Rust broadcast

### Phase 4 — 자동 cover 캡처 인스펙터 silent 적용
- MarketplaceMetaEditor 의 confirm prompt 제거
- 인스펙터 닫을 때 silent 자동 캡처 (handleExport 와 동일 정책)

### Phase 5 — 인스펙터 큐브 검증 (validateCube) 인라인 에러 UI 강화
- empty label / invalid URL / 누락 action 등 인라인 표시
- 모든 검증 키 i18n 적용

### Phase 6 — e2e smoke 추가 시나리오
- 마켓플레이스 catalog → detail → install prompt (무료 / 유료)
- 라이센스 키 형식 sentinel 체크

### Phase 7 — Rust commands.rs 응답 타입 보강
- RequestExecute ack 응답 + 에러 코드
- TypeScript 측 wire spec 동기

### Phase 8 — SettingsPanel 단축키 커스터마이즈 UI 사전
- 단축키 매핑 viewer (편집은 v0.1.4)
- localStorage 영속 + reset 버튼

### Phase 9 — 사용자 가이드 v0.1.3 보강
- 스크린샷 placeholder + 신규 기능 (cover 4 경로, 라이센스 mock)
- ko/en/ja 동기

### Phase 10 — 베타 출시 가이드 사용자 액션 체크리스트 보강
- `cargo tauri build` 단계별 안내
- D-06 (GitHub Releases) / D-07 (EV 사이닝) 결정 흐름도

## v0.1.4 사전 spec (Phase 11~20)

### Phase 11 — CHANGELOG v0.1.4 첫 항목 + 마일스톤 선언
- v0.1.4 마일스톤 목표 명시
- Phase 12~20 산출물 인덱스

### Phase 12 — 마켓플레이스 서버 API spec (OpenAPI 3.1)
- `docs/specs/marketplace-api.yaml`
- 엔드포인트: catalog / pack / install / payment-init / payment-callback / license-issue / license-verify

### Phase 13 — 라이센스 키 spec (Ed25519 서명 포맷)
- `docs/specs/license-key.md`
- 키 포맷: `CL-<base64url-payload>-<base64url-sig>` (CL = CubeList)
- payload: {pack_id, buyer_id, issued_at, expires_at?, scope}

### Phase 14 — PayPal/Binance Pay 결제 콜백 spec
- `docs/specs/payment-callback.md`
- IPN/Webhook 처리, 라이센스 발급 트리거

### Phase 15 — 큐브팩 게시 워크플로우 spec
- `docs/specs/pack-publish-flow.md`
- 인스펙터 → 검증 → 서버 업로드 → 검토 → 카탈로그 노출

### Phase 16 — LiveSync 모바일 → PC RequestExecute 강화 spec
- `docs/specs/livesync-request-execute.md`
- ack/nack + 에러 코드 + 재시도 정책

### Phase 17 — 모바일 PWA 자체 page state 도입 spec
- `docs/specs/mobile-page-state.md`
- localStorage 영속 + PC selection 동기 모드 토글

### Phase 18 — 모바일 PWA selection_change UI 시각 강화 spec
- 페이지 dot indicator + 폴더 breadcrumb
- 현재 PC 큐브 강조 (existing) + 페이지 안내 (Phase 17 이후)

### Phase 19 — 서버 인프라 spec (Cloudflare Workers + R2 + D1)
- `docs/specs/server-infra.md`
- 정적 자산 R2, 메타 D1, API Workers
- 결제 콜백 IPN 수신

### Phase 20 — v0.1.4 마일스톤 보고서 + 산출물 인덱스
- 모든 spec 파일 링크
- v0.1.4 작업 일정 (T-0 ~ T-90일)
- 위험 요소 + 완화 전략

---

**루프 정책**:
- 각 페이즈 완료 즉시 commit + push + 진행 보고
- 다음 페이즈 즉시 시작 (사용자 확인 없이)
- 컨텍스트 한도 도달 시 PHASE_PLAN.md 갱신 후 종료
