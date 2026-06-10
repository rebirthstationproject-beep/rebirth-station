# cubepacks-clean — 자산화 완료 큐브팩 보관소

> 2026-06-11 사용자 확정 파이프라인. **이 디렉토리에는 4개 검토사항을 전부 통과한
> "완전히 수정 끝난" 큐브팩만 들어온다.** 변환 직후/작업 중 파일 반입 금지.

## 파이프라인 (3단계)

| 단계 | 내용 | 위치 |
|---|---|---|
| 1. 변환 → 테스트 | 플러그인(SD 등) 변환 후 우리 쪽에서 작동 테스트 | `apps/pc-version/frontend/public/` 등 작업 영역 |
| 2. 수정 + 아이콘 제작 | 테스트 통과분만 큐브 리스트에 맞춰 수정, 아이콘 제작 (v1 Flat Minimal 기준) | 작업 영역 |
| 3. 분리 보관 자산화 | 검토 4종 통과본만 **여기로** 이동 | `assets/cubepacks-clean/` |

## 검토사항 (자산 등록 게이트) — `tools/cubepack-audit.mjs`로 자동 검사

```
node tools/cubepack-audit.mjs <pack.cubepack> [--json report.json]
# exit 0 = 게이트 통과 (4번 디자인 통일감은 통과 후 수동 최종 판정)
```

1. **모든 큐브가 정상 작동하는가?** — 정적: link url/macro steps/shortcut keys/plugin 스텁/states 깨진 참조. 실행: PC 앱에서 전 큐브 더블클릭 테스트.
2. **라이선스·잔여 기록이 없는가?** — `streamdeck_source`·`streamdeck_meta`·`sd_uuid`·`sd_action_id`·`sd_coord`·`metadata.source=streamdeck-*`·문자열 `elgato/streamdeck` 전수 스캔 0건.
3. **큐브 리스트 아이콘이 정확한가?** — 팩 아이콘(icon/cover) 존재 + 해당 프로그램 공식성 수동 확인.
4. **큐브 아이콘 통일감** — 전 큐브 아이콘 임베드(placeholder/tiny/없음 = 0) + 디자인·색상 통일 수동 판정 ([feedback_cubelist_design_preferences] v1 Flat Minimal + 앱별 예외).

## 현재 상태 (2026-06-11)

| 팩 | 단계 | 감사 결과 |
|---|---|---|
| **adobe-photoshop.cubepack** | **게이트 통과 — 1호 자산** | 52큐브 (shortcut + 자체 SVG 카탈로그 72종 중 52 매칭). 정적 4종 PASS — `adobe-photoshop.audit.json`. 잔여 단계: PC 앱 실행 테스트(검토 1) + 디자인 통일감 수동 최종 판정(검토 4) |
| discord.cubepack | 1단계 미통과 | 18큐브 전부 plugin_action 스텁(작동 불가) + 잔여 기록 162건 + 아이콘 0 — `public/discord.audit.json` |

- 빌더: `tools/cubepack-build-clean-photoshop.mjs` — v2 변환본에서 shortcut만 채택, Elgato 아이콘팩 PNG → 자체 SVG(icon-catalog-photoshop.ts) 교체, 메타 클린.
- PS 제외 20큐브 = 단축키 없는 메뉴 액션(plugin_action) — 후속 재설계 대상 (`_inventory.json` 참조).
- 라이브러리 전수 현황: `tools/cubelib-inventory.mjs` → `_inventory.json` (31폴더 316큐브, PS v2 제외 전부 스텁 단계).
- discord 류 SD 플러그인 큐브는 Elgato 런타임 의존이라 스크럽만으로 살릴 수 없음 —
  **큐브별 액션 재설계**(shortcut/link/macro 등 자체 액션으로 치환)가 2단계의 본질.
