# 큐브 리스트 — 에이전트 구성안

기준: `~/.claude/agents/` + `~/.claude/rules/common/agents.md`. 단계별 책임 + 트리거.

---

## 상시 트랙 (마일스톤 무관)

| 에이전트 | 역할 | 트리거 |
|---|---|---|
| **architect** | 시스템 설계 결정 (파일 포맷, 플러그인 SDK, 액션 추상) | M1·M3·M4 진입 시 |
| **planner** | 마일스톤 → 일일 태스크 분해 | 각 M 진입 시 |
| **code-reviewer** | 모든 코드 변경 후 즉시 | PostToolUse (코드 작성/수정 직후) |
| **security-reviewer** | HMAC·페어링·플러그인 샌드박스·Tier 권한 | M3·M4·M5 + commit 직전 |
| **build-error-resolver** | cargo/Tauri/Next 빌드 실패 | 빌드 fail 시 |
| **doc-updater** | docs/ + README 갱신 | 각 M 종료 시 |
| **refactor-cleaner** | 죽은 코드 정리 | 각 M 종료 후 |

---

## 마일스톤별 투입 매트릭스

| M | architect | planner | rust-reviewer | typescript-reviewer | tdd-guide | security-reviewer | e2e-runner | doc-updater |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| M0 | – | ● | – | – | – | – | – | ● |
| M1 | ● | ● | ● | ● | ● | – | – | ● |
| M2 | ● | ● | ● | ● | ● | – | ● | ● |
| M3 | ● | ● | ● | ● | ● | ● | ● | ● |
| M4 | ● | ● | ● | ● | ● | ● | ● | ● |
| M5 | – | ● | ● | ● | ● | ● | ● | ● |
| M6 | – | ● | – | ● | ● | – | – | ● |
| M7 | ● | ● | ● | ● | ● | – | ● | ● |
| M8 | – | ● | – | ● | – | ● | ● | ● |
| M9 | – | ● | ● | ● | – | ● | ● | ● |

---

## 병렬 트랙 (Karpathy 원칙 4 — 검증 가능한 목표 + agents.md 병렬 실행)

다음 단계는 **3-트랙 병렬**로 굴리면 약 32일 → 약 18일로 단축 가능.

### Track A — Rust 백엔드 (pc-version)
M1 Rust I/O → M3 액션 트레이트 → M4 플러그인 로더 → M7 폴더/페이지

리더: **rust-reviewer** + **tdd-guide** (Rust)

### Track B — 편집기 프론트엔드 (web-version)
M1 TS I/O → M2 편집기 셸 → M3 인스펙터 → M6 카테고리 뷰 → M7 페이지/멀티액션 UI

리더: **typescript-reviewer** + **tdd-guide** (TS)

### Track C — 모바일 컴패니언 (mobile-version)
M5 PWA 동기화 → M5 햅틱 + nosleep → M9 베타

리더: **typescript-reviewer** (Capacitor)

각 트랙마다 매 commit 직전 **code-reviewer** + **security-reviewer**. e2e는 Track A/B 통합 지점(M5, M9)에 집중.

---

## 세션 진행 규약

1. 새 마일스톤 진입 시 **planner** 호출 → 당일 태스크 3~5개 도출
2. 태스크별 **tdd-guide** → 테스트 먼저 작성
3. 구현 후 즉시 **code-reviewer**
4. 보안 관련(`auth/`, `actions/permissions.rs`, `plugins/signature.rs`) 변경 시 추가 **security-reviewer**
5. 빌드 실패 시 **build-error-resolver**
6. 마일스톤 종료 → **doc-updater** + **refactor-cleaner**

---

## 비표준 에이전트 (필요 시 신설 제안)

- `cubelist-format-validator` — `.cubeone/list/pack` 스키마 라운드트립 검증 전담 (cargo + node 양쪽)
- `streamdeck-plugin-bridge` — StreamDeck SDK 호환 변환 검토 (M4)

위 둘은 **M1·M4 진입 시 필요성 재평가 후 생성**. 사전 생성 금지 (원칙 2 단순함).
