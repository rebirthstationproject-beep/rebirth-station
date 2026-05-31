# LiveSyncBridge wire spec v1 (2026-05-31)

> 모바일 PWA ↔ PC 헬퍼 실시간 상태 동기화 (M5+ 강화, v0.1.4 진입 예정).
> 기존 wire 호환 (`docs/06-wire-compat.md`) 위에 다음 메시지 추가.

## 1. 목적

PC 트랙의 동적/상태 정보를 모바일 PWA 가 실시간 미러링 — 사용자가 모바일을 PC 큐브 리스트 보조 디스플레이로 사용.

대상:
- `live_clock` / `live_timer` 라벨 (1초 tick)
- `hotkey_toggle` / `audio_play` states 의 current_index 변경
- 큐브 선택 변경 (PC ↔ 모바일 양방향)
- 페이지/폴더 진입 변경

## 2. 메시지 (PROTOCOL_VERSION = 2 — v0.1.4)

기존 v1 wire 와 호환. 신규 메시지 type 만 추가.

### 2.1 PC → 모바일 (CubeUpdate)
```typescript
{
  event: 'cube_update',
  cube_id: string,
  /** label 변경 (live_* tick / states 전환) */
  label?: string,
  /** icon_url 변경 (gauge/battery SVG 재생성) */
  icon_url?: string | null,
  /** state index 변경 (hotkey_toggle 등) */
  state_index?: number,
  timestamp_ms: number,
}
```

### 2.2 PC → 모바일 (SelectionChange)
```typescript
{
  event: 'selection_change',
  list_id: string | null,
  cube_id: string | null,
  page_index?: number,
  current_folder_id?: string,
  timestamp_ms: number,
}
```

### 2.3 모바일 → PC (RequestExecute)
```typescript
{
  event: 'request_execute',
  cube_id: string,
  /** 모바일에서 강제로 active state override */
  force_state_index?: number,
  timestamp_ms: number,
  nonce: string,
  hmac: string,
}
```

### 2.4 모바일 → PC (Subscribe)
```typescript
{
  event: 'subscribe',
  /** 어느 큐브들의 업데이트를 받을지 */
  cube_ids: string[],
  /** 전체 list 의 큐브 모두 = true 면 cube_ids 무시 */
  all_in_active_list?: boolean,
  timestamp_ms: number,
}
```

## 3. 보안

- 기존 HMAC + nonce + ±30s + Origin 화이트리스트 유지
- `request_execute` 는 Tier 분류대로 PC 측 동의 prompt 통과 필요 (Tier 2/3 는 사용자 PC 측 confirm)
- `cube_update` 는 unilateral (PC → 모바일 push) — 인증 불필요 (구독 후)

## 4. 클라이언트 구현

### 4.1 PC frontend
- `lib/LiveSyncBridge.ts` 신규 (이번 turn 작성)
- useDynamicCubes + useCubeStates tick 결과를 WebSocket broadcast
- selectCube / selectList 변경 시 SelectionChange 전송

### 4.2 모바일 PWA
- 기존 wire WebSocket 클라이언트에 새 message handler 추가 (v0.1.4)
- 큐브 셀에서 cube_update.label/icon_url override (PC 표시와 동일)

## 5. 진행 단계

| 단계 | 작업 | 예상 |
|---|---|---|
| 1 | wire spec 영구 정착 (본 문서) | 0.5일 |
| 2 | LiveSyncBridge frontend 클래스 (broadcast API) | 1일 |
| 3 | useDynamicCubes + useCubeStates → LiveSyncBridge 통합 | 0.5일 |
| 4 | 모바일 PWA WebSocket 핸들러 (v0.1.4) | 1~2일 |
| 5 | E2E 테스트 (다중 클라이언트 시뮬레이션) | 1일 |

**합산 4~5일** (v0.1.4 영역)

## 6. 영구 lock 약속

본 v1 wire spec 은 이후 확장 시 신규 event type 만 추가 (기존 변경 0).
PROTOCOL_VERSION 증가 시 호환층 (`docs/06-wire-compat.md`) 갱신.
