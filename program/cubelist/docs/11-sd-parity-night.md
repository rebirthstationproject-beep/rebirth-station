# 11 — Stream Deck 동급화 야간 라운드 (2026-06-11)

> 근거: 실 UI 캡처 분석 (편집기 메인 + PlayMode, Playwright) + docs/08 R1~R3 완료 이후 잔여 격차.
> 원칙: 외과수술적 / 무채색 토큰 / 빌드 통과 단위 커밋.

## 실측 격차 (캡처 기준)

| # | 격차 | SD 대비 | 우선순위 |
|---|---|---|---|
| G1 | **편집 Undo/Redo 없음** — 배치 실수·삭제 복구 불가 | SD는 모든 편집 즉시 복구 가능 | **P1** |
| G2 | **키보드 그리드 네비게이션 없음** — 화살표 이동/Enter 불가 | 데스크톱 앱 기본기 | **P1** |
| G3 | **큐브 복사/붙여넣기 없음** (Ctrl+C/V) | SD 키 복제 = 핵심 워크플로우 | **P1** |
| G4 | PlayMode 누름 피드백 약함 (press 애니메이션/실패 셰이크 없음) | SD 키 누름 = 물리 피드백 | P2 |
| G5 | 라이브러리 그리드 placeholder 글리프 반복 (같은 모양 6~8개 연속) — 식별 불가 | SD 전 키 고유 아이콘 | P2 |
| G6 | TopBar 8버튼 평면 나열 — 위계/그룹 없음 | SD는 미니멀 + 컨텍스트 | P3 |
| G7 | 인스펙터 빈 상태 = 죽은 공간 | — | P3 |
| G8 | 페이지 권장 footer 항시 노출 = 소음 | — | P3 |

## 야간 실행 계획

1. **N1 (G1)**: editor store에 undo/redo 히스토리 — pack/draft 스냅샷 기반, 한도 50, Ctrl+Z / Ctrl+Shift+Z(또는 Ctrl+Y). 변이 액션 진입점에서 스냅샷 push.
2. **N2 (G3)**: 큐브 복사/붙여넣기 — 선택 큐브 직렬화(메모리 클립보드), Ctrl+C/V + 컨텍스트 메뉴 항목. 새 id 발급 + sort_order=max+1.
3. **N3 (G2)**: 그리드 키보드 네비게이션 — 선택 셀 기준 화살표 이동, Enter=인스펙터 라벨 포커스. 입력 필드 포커스 중엔 무시.
4. **N4 (G4)**: PlayMode 누름 애니메이션(scale 0.94 + 글로우) / 실패 셰이크 CSS.
5. **N5 (G5)**: 라이브러리/메이커 그리드에 icon-dedupe 적용 (변환 화면 외 일반 그리드).
6. **N6 (G6~G8)**: TopBar 그룹 구분 강화 + 인스펙터 빈 상태 단축키 치트 카드 + footer 소음 축소.

검증: 각 N 완료 시 `npm run build` → commit. GUI 시각 확인은 Playwright 캡처.

## 실행 결과 (2026-06-11 야간)

| 항목 | 상태 | 검증 |
|---|---|---|
| N1 Undo/Redo | ✅ (75dc8ee) | Playwright: 추가 20→undo 19→redo 20 |
| N2 복사/붙여넣기 | ✅ (06e5364) | Playwright: 20→21→undo 20 |
| N3 키보드 네비게이션 | ✅ (4d35bd9+c1a34f7) | Playwright: 슬롯 1→2→6→5 (cols=4) |
| N4 누름 피드백 | ✅ | CSS :active scale 0.93 + brightness (PlayMode+편집 그리드) |
| N5 글리프 dedupe | ⏸ 보류 | 데이터 품질 문제 = 자산화 파이프라인(클린 팩)에서 해결이 정도 — 표시단 가공은 회피 |
| N6 인스펙터 치트 카드 + footer 감쇠 | ✅ | 캡처 확인. 단축키 치트 = 신기능 광고 겸용 (i18n 3언어) |

dev 전용 `window.__editor` 노출 추가 (E2E/디버그용, 프로덕션 제외).

## 이번 범위 제외 (후속)
- ~~전역 핫키 PlayMode 토글 (Rust hotkeys.rs 연동 — Tauri 빌드 필요)~~ → **완료 (2026-07-06)**: 기본 ctrl+alt+p (hotkeys.json `playmode_toggle`로 변경, ""=비활성). Rust 등록+창 표시+이벤트 emit / frontend listen 토글. 부수 수정: get_webview_window("main")→"editor" 잠재 결함
- 멀티 상태 큐브 셀 시각 강화 / 사운드 피드백 (정책 결정 필요)
- 라이브러리 144큐브 데이터 자체의 아이콘 품질 (= 자산화 파이프라인 영역)
