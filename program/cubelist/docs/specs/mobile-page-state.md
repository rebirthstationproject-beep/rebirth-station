# 모바일 PWA Page State Specification (v0.1.4)

> 작성: 2026-06-01 Phase 17. v0.1.4 마일스톤 활성 예정.

## 1. 목적

모바일 PWA 가 PC selection 의 `page_index` 와 동기 가능한 자체 page state 도입.

v0.1.3 현재: 모바일은 page 개념 없음 (board 단위, 전체 큐브 한 화면).
v0.1.4 추가: 모바일도 PC와 동일 페이지 분할 + PC selection 동기 토글.

## 2. 정책

### 페이지 크기 (사용자 명시 2026-06-01)

| 디바이스 | 세로 | 가로 |
|---|---|---|
| **일반 모바일** (iPhone 일반/Pro, 갤럭시 일반) | 4×6 (24) | 6×4 (24) |
| **Pro Max / 울트라** (iPhone Pro Max, 갤럭시 울트라) | 4×7 (28) | 7×4 (28) |
| **태블릿** (iPad, 갤럭시 탭 — 잠정) | 6×12 (72) ~ 8×14 (112) | 12×6 (72) ~ 14×8 (112) |
| **PC 데스크톱** | 사용자 cols × 4 행 (디폴트) | - |

**중요**:
- 태블릿은 잠정값. 사용자 실측 후 확정.
- 화면 구성은 유저가 자유롭게 설정 가능. 본 디폴트는 빈 슬롯 표시 + 권장 페이지 경계 가이드용.
- 상수 파일: `apps/pc-version/frontend/src/lib/device-defaults.ts`

자동 감지: `detectDefaultPageSize(innerWidth, innerHeight)` 함수.

### 동기 모드 (3 옵션)

1. **off** (기본) — 모바일이 자체 페이지 관리, PC 변경 무시
2. **mirror** — PC selection.page_index 그대로 적용, 모바일 페이지 전환 시 PC에도 알림
3. **read_only** — PC 변경만 반영, 모바일 자체 페이지 전환 X (kiosk 모드)

## 3. 데이터 모델

### Zustand store (apps/mobile-pwa/lib/stores/page-store.ts)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SyncMode = 'off' | 'mirror' | 'read_only';

interface PageState {
  /** board id → 현재 페이지 (0-indexed) */
  pageByBoard: Record<string, number>;
  /** 동기 모드 */
  syncMode: SyncMode;
  /** 페이지 크기 (큐브 수) — 0이면 자동 감지 */
  pageSize: number;

  setPage: (boardId: string, page: number) => void;
  setSyncMode: (mode: SyncMode) => void;
  setPageSize: (size: number) => void;
  resetPages: () => void;
}

export const usePageStore = create<PageState>()(
  persist(
    (set) => ({
      pageByBoard: {},
      syncMode: 'off',
      pageSize: 0,

      setPage: (boardId, page) =>
        set((s) => ({
          pageByBoard: { ...s.pageByBoard, [boardId]: Math.max(0, page) },
        })),

      setSyncMode: (mode) => set({ syncMode: mode }),

      setPageSize: (size) => set({ pageSize: Math.max(0, size) }),

      resetPages: () => set({ pageByBoard: {} }),
    }),
    {
      name: 'cubelist:mobile_page_state',
      version: 1,
    },
  ),
);
```

## 4. 페이지 크기 자동 감지

```typescript
// apps/mobile-pwa/lib/hooks/usePageSize.ts
import { useEffect, useState } from 'react';

const DEFAULT_PAGE_SIZE = 28;     // 4×7
const TABLET_PAGE_SIZE = 40;      // 5×8
const TABLET_BREAKPOINT_PX = 768;

export function usePageSize(): number {
  const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    function update() {
      const isTablet = window.innerWidth >= TABLET_BREAKPOINT_PX;
      setSize(isTablet ? TABLET_PAGE_SIZE : DEFAULT_PAGE_SIZE);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}
```

사용자 설정 우선 적용:
```typescript
const userSize = usePageStore((s) => s.pageSize);
const autoSize = usePageSize();
const effective = userSize > 0 ? userSize : autoSize;
```

## 5. CubeListView 통합

### 페이징 적용

```typescript
// apps/mobile-pwa/components/cube/CubeListView.tsx
import { usePageStore } from '@/lib/stores/page-store';
import { usePageSize } from '@/lib/hooks/usePageSize';

function CubeListView({ board }: { board: Board }) {
  const pageSize = usePageSize();
  const currentPage = usePageStore((s) => s.pageByBoard[board.id] ?? 0);
  const setPage = usePageStore((s) => s.setPage);

  const totalPages = Math.max(1, Math.ceil(board.items.length / pageSize));
  const start = currentPage * pageSize;
  const items = board.items.slice(start, start + pageSize);

  return (
    <>
      <CubeGrid items={items} cols={cols} ... />
      {totalPages > 1 && (
        <PageDots
          current={currentPage}
          total={totalPages}
          onChange={(p) => setPage(board.id, p)}
        />
      )}
    </>
  );
}
```

### PageDots 컴포넌트

```typescript
// apps/mobile-pwa/components/cube/PageDots.tsx
interface PageDotsProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export function PageDots({ current, total, onChange }: PageDotsProps) {
  return (
    <nav
      className="flex justify-center gap-2 py-3"
      role="navigation"
      aria-label="페이지"
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`페이지 ${i + 1}`}
          aria-current={i === current ? 'page' : undefined}
          className={`w-2 h-2 rounded-full transition ${
            i === current
              ? 'bg-rbs-accent scale-125'
              : 'bg-ink-muted/40 hover:bg-ink-muted/60'
          }`}
        />
      ))}
    </nav>
  );
}
```

## 6. PC selection 동기 (mirror / read_only)

### useLiveSync 통합

```typescript
// apps/mobile-pwa/components/cube/CubeListView.tsx
const liveSync = useLiveSync(helperClient);
const syncMode = usePageStore((s) => s.syncMode);
const setPage = usePageStore((s) => s.setPage);

useEffect(() => {
  if (syncMode === 'off') return;
  if (!liveSync.selection) return;
  if (liveSync.selection.list_id !== board.id) return;
  const pcPage = liveSync.selection.page_index;
  if (pcPage === undefined) return;
  setPage(board.id, pcPage);
}, [liveSync.selection, syncMode, board.id, setPage]);
```

### 모바일 → PC 전파 (mirror 모드)

```typescript
useEffect(() => {
  if (syncMode !== 'mirror') return;
  if (!helperClient || !helperClient.isConnected) return;
  helperClient.send({
    event: 'mobile_page_change',
    board_id: board.id,
    page_index: currentPage,
    timestamp_ms: Date.now(),
  });
}, [currentPage, syncMode, board.id, helperClient]);
```

PC 측 `mobile_page_change` 처리 (`ws_server.rs`):
```rust
Ok(ClientEvent::MobilePageChange { board_id, page_index, .. }) => {
    // PC 측 selection 상태 갱신 + LiveSyncBridge broadcast
    live_sync::set_selection(SelectionState {
        list_id: Some(board_id),
        page_index: Some(page_index),
        ..Default::default()
    });
}
```

## 7. 설정 UI (모바일)

```typescript
// apps/mobile-pwa/components/settings/PageSyncSettings.tsx
import { usePageStore, type SyncMode } from '@/lib/stores/page-store';

const SYNC_OPTIONS: { value: SyncMode; label: string; description: string }[] = [
  { value: 'off', label: 'OFF', description: '모바일 자체 페이지 (기본)' },
  { value: 'mirror', label: '양방향 미러', description: 'PC와 양방향 동기 (mirror)' },
  { value: 'read_only', label: 'PC 따라가기', description: 'PC 페이지만 반영 (read-only)' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 0, label: '자동 (4×7 / 5×8)' },
  { value: 12, label: '12 (3×4)' },
  { value: 16, label: '16 (4×4)' },
  { value: 20, label: '20 (4×5)' },
  { value: 28, label: '28 (4×7)' },
  { value: 40, label: '40 (5×8)' },
];

export function PageSyncSettings() {
  const syncMode = usePageStore((s) => s.syncMode);
  const setSyncMode = usePageStore((s) => s.setSyncMode);
  const pageSize = usePageStore((s) => s.pageSize);
  const setPageSize = usePageStore((s) => s.setPageSize);
  const resetPages = usePageStore((s) => s.resetPages);

  return (
    <section>
      <h3>페이지 분할</h3>
      <label>크기</label>
      <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
        {PAGE_SIZE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <h3>PC 동기</h3>
      {SYNC_OPTIONS.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name="syncMode"
            value={o.value}
            checked={syncMode === o.value}
            onChange={() => setSyncMode(o.value)}
          />
          <strong>{o.label}</strong>
          <span>{o.description}</span>
        </label>
      ))}

      <button type="button" onClick={resetPages}>
        🔄 모든 페이지 초기화 (현재 board)
      </button>
    </section>
  );
}
```

## 8. 키보드 / 터치 네비

- ← → arrow: 페이지 prev / next
- swipe left/right (mobile): 페이지 전환
- swipe up/down: 큐브 그리드 스크롤 (페이지 전환 X)

```typescript
// 큐브 그리드 wrapper
const handlers = useSwipeable({
  onSwipedLeft: () => setPage(board.id, Math.min(totalPages - 1, currentPage + 1)),
  onSwipedRight: () => setPage(board.id, Math.max(0, currentPage - 1)),
  trackMouse: false,
  delta: 50,
});
```

## 9. 호환성 / 이주

### v0.1.3 → v0.1.4

- 기존 모바일 사용자: `syncMode = 'off'` 기본값으로 자동 마이그레이션 (영향 X)
- 페이지 분할은 board.items.length > pageSize 일 때만 활성
- 28개 이하 보드는 페이지 1개 (현재와 동일 UI)

### v0.1.3 amber ribbon (CubeGrid)

```typescript
// 현재 (v0.1.3): PC page_index > 0 일 때 "PC 다른 페이지" 안내
// v0.1.4: syncMode = 'off' 일 때만 표시 (mirror/read_only 시 자동 따라가므로 안내 불필요)
{liveSync.selection && liveSync.selection.page_index > 0 && syncMode === 'off' && (
  <div>🖥 PC에서 페이지 {liveSync.selection.page_index + 1} 표시 중 — 동기 OFF</div>
)}
```

## 10. v0.1.4 활성화 순서

```
T+14일: usePageStore + usePageSize hook + PageDots 컴포넌트
T+21일: CubeListView 통합 + 스와이프 네비
T+28일: PageSyncSettings UI + 설정 페이지 통합
T+35일: PC ws_server.rs MobilePageChange 처리
T+42일: e2e 시나리오 (모바일 페이지 전환 → PC 동기)
```

## 11. 참고

- 모바일 PWA CubeGrid (v0.1.3 ribbon): `apps/mobile-pwa/components/cube/CubeGrid.tsx`
- LiveSync wire spec: `live-sync-wire-v1.md`
- LiveSync RequestExecute: `livesync-request-execute.md` (Phase 16)
- 모바일 selection UI 강화: `mobile-selection-ui.md` (Phase 18)
