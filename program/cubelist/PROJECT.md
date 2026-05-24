# 큐브 리스트 (Cube List) — 프로젝트 마스터

> 리버스 스테이션 (Rebirth Station) 산하 · Stream Deck 동등 + 자유도 확장 + 유휴 모바일 컴패니언.

**이 파일은 단일 진입점.** 새 세션은 여기부터 읽고 → `STATE.md` 로 진행.

**현재 진척률 (2026-05-24, cron #24 시점): ≈ 90%** — M0~M8 핵심 완료, M9 베타 출시 준비 단계.
릴리즈 체크리스트: `docs/07-release-checklist.md`.

---

## 1. 한 줄 정의

- **큐브 (Cube)** = 1개의 기능 버튼 (링크 · 단축키 · 매크로 · 플러그인 액션)
- **큐브 리스트 (Cube List)** = 큐브 묶음 = 그리드 1탭
- **큐브 팩 (Cube Pack)** = 리스트(탭) 묶음 = 앱 1개 분량

파일 포맷: `.cubeone` (단일 큐브) / `.cubelist` (탭 1개) / `.cubepack` (앱 전체).

---

## 2. 현재 위치

```
E:\Claude-Workspace\rebirth-station\program\cubelist\
├── PROJECT.md          ← 너 지금 여기
├── STATE.md            ← 현재 진행 상태 + 결정 대기 + 다음 액션
├── docs/
│   ├── 01-status-gap.md       (현황 + StreamDeck GAP)
│   ├── 02-roadmap.md          (M0~M9 마일스톤)
│   ├── 03-agents.md           (에이전트 구성 매트릭스)
│   └── 04-user-assets-todo.md (사용자 직접 제작 자산)
├── apps/
│   └── pc-version/    ← Rust/Tauri PC 헬퍼 (현 25%)
├── index.html         (SEO 랜딩 — 보존)
└── og/, blog/, dashboard/, ... (마케팅 / 기존 페이지)
```

**같은 시스템의 잔류물 (모노레포 통합 대상, 미이동):**
```
E:\Claude-Workspace\jusomoa-list\apps\
├── web\               (Next.js 편집기/러너 UI 14 페이지)
└── mobile\            (Capacitor 모바일 컴패니언)
```

---

## 3. 진행 방식

1. **새 세션 시작** → `STATE.md` 의 "다음 액션" 섹션 읽기.
2. **다음 액션이 사용자 결정 대기** → 결정 후 `STATE.md` 의 해당 결정 줄 업데이트 + M 진행.
3. **다음 액션이 마일스톤 실행** → `docs/02-roadmap.md` 의 해당 M 섹션 읽기 + `docs/03-agents.md` 의 매트릭스 따라 에이전트 호출.
4. **M 완료** → `STATE.md` 업데이트 + 다음 M의 자산 의존성(`docs/04-user-assets-todo.md`) 점검.

---

## 4. 운영 규약

- 모든 코드 변경 직후 → **code-reviewer** (rules/common/agents.md)
- 보안 관련 변경 → 추가 **security-reviewer**
- 빌드 실패 → **build-error-resolver**
- 마일스톤 종료 → **doc-updater** + **refactor-cleaner**
- 새 마일스톤 진입 → **planner** 로 당일 태스크 도출
- 모든 파트 완료 즉시 → **commit + push** ([memory: feedback_auto_deploy])

---

## 5. 외부 참조

- 기준 비교 대상: `C:\Program Files\Elgato\StreamDeck\` (2026-05-11 빌드)
- 상위 정책: `E:\Claude-Workspace\CLAUDE.md` (Karpathy 4원칙)
- 브랜드 정책: [memory: feedback_rebirth_station_color_policy] — 코어 무채색, 콜라보만 컬러
- 자산 정책: [memory: feedback_image_production_rules_v3] — fal.ai + 영어 프롬프트
- 외주 제작: [memory: feedback_fal_ai_external_info_only] — 기획 시리즈/아이콘은 자체 디자인
