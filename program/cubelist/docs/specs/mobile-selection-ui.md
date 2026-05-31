# 모바일 PWA SelectionChange UI 강화 Specification (v0.1.4)

> 작성: 2026-06-01 Phase 18. v0.1.4 마일스톤 활성 예정.

## 1. 목적

PC selection 변경 시 모바일 PWA UI를 시각적으로 강화. 사용자가 PC에서 보는 페이지/폴더/큐브를 모바일에서도 즉시 인식.

v0.1.3 현재:
- 모바일 CubeGrid 에 amber ribbon (page_index > 0 시) 안내만
- 큐브 셀 강조 (effectiveHighlight) — PC selection.cube_id 적용

v0.1.4 추가:
- 페이지 dot indicator (Phase 17 PageDots 와 통합)
- 폴더 breadcrumb
- 큐브 라이브 데코 (PC가 마우스 hover 한 큐브에 ring 효과)
- 현재 큐브 부드러운 펄스 (cubelist-pulse 강화)

## 2. 컴포넌트 설계

### LiveSelectionHeader (신규)

`apps/mobile-pwa/components/cube/LiveSelectionHeader.tsx`:

```typescript
import { useLiveSync } from '@/lib/hooks/useLiveSync';
import { useHelperConnection } from '@/lib/hooks/useHelperConnection';
import { usePageStore } from '@/lib/stores/page-store';

interface LiveSelectionHeaderProps {
  boardId: string;
  boardName: string;
  totalPages: number;
}

export function LiveSelectionHeader({ boardId, boardName, totalPages }: LiveSelectionHeaderProps) {
  const { client } = useHelperConnection();
  const liveSync = useLiveSync(client);
  const syncMode = usePageStore((s) => s.syncMode);
  const currentPage = usePageStore((s) => s.pageByBoard[boardId] ?? 0);

  const pcSelection = liveSync.selection;
  const showFolderBreadcrumb = pcSelection?.current_folder_id;
  const showPagePosition = totalPages > 1 || (pcSelection?.page_index ?? 0) > 0;

  return (
    <header className="live-selection-header sticky top-0 z-10 backdrop-blur bg-surface/90 border-b border-border">
      {/* Board name + sync indicator */}
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-sm font-semibold">{boardName}</h2>
        {client?.isConnected && (
          <SyncIndicator mode={syncMode} pcAlive={!!pcSelection} />
        )}
      </div>

      {/* 폴더 breadcrumb (PC가 폴더 내부일 때) */}
      {showFolderBreadcrumb && (
        <FolderBreadcrumb folderId={pcSelection.current_folder_id!} />
      )}

      {/* 페이지 위치 */}
      {showPagePosition && (
        <PagePosition
          current={currentPage}
          total={totalPages}
          pcPage={pcSelection?.page_index}
          syncMode={syncMode}
        />
      )}
    </header>
  );
}
```

### SyncIndicator

```typescript
interface SyncIndicatorProps {
  mode: SyncMode;
  pcAlive: boolean;
}

function SyncIndicator({ mode, pcAlive }: SyncIndicatorProps) {
  if (mode === 'off') {
    return (
      <span className="text-[10px] text-ink-muted">📱 자체</span>
    );
  }
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded ${
        pcAlive
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}
      title={mode === 'mirror' ? '양방향 미러' : 'PC 따라가기'}
    >
      {pcAlive ? '🖥 ✓' : '🖥 ⌛'} {mode === 'mirror' ? 'mirror' : 'read-only'}
    </span>
  );
}
```

### FolderBreadcrumb

```typescript
function FolderBreadcrumb({ folderId }: { folderId: string }) {
  // 폴더 메타 조회 (board.items 에서 type === 'folder' 매칭)
  const folderName = useFolderName(folderId);
  return (
    <div className="flex items-center gap-1 px-4 py-1 text-[11px] text-ink-muted bg-surface-2">
      <span>🖥 PC 위치:</span>
      <span>홈 / {folderName ?? folderId}</span>
    </div>
  );
}
```

### PagePosition

```typescript
interface PagePositionProps {
  current: number;
  total: number;
  pcPage?: number;
  syncMode: SyncMode;
}

function PagePosition({ current, total, pcPage, syncMode }: PagePositionProps) {
  const mismatch = syncMode === 'off' && pcPage !== undefined && pcPage !== current;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-[11px]">
      <span className="text-ink-muted">페이지</span>
      <strong className="text-rbs-accent">{current + 1}</strong>
      <span className="text-ink-muted">/</span>
      <span>{total}</span>
      {mismatch && (
        <span
          className="ml-2 text-amber-600 dark:text-amber-400"
          title="PC와 페이지 불일치 (동기 OFF)"
        >
          🖥 {pcPage! + 1}
        </span>
      )}
    </div>
  );
}
```

## 3. 큐브 라이브 데코

### PC hover 강조 (v0.1.4 신규 wire 메시지)

PC가 큐브 hover 시 모바일에 broadcast:

```rust
// apps/pc-version/src/protocol/messages.rs (v0.1.4)
ServerEvent::CubeHover {
    cube_id: Option<String>,    // None = hover 해제
    timestamp_ms: u64,
}
```

PC frontend (`App.tsx` 큐브 셀 onMouseEnter / onMouseLeave):
```typescript
function handleCubeHover(cubeId: string | null) {
  // LiveSyncBridge 로 broadcast
  void invoke('broadcast_cube_hover', { cubeId });
}
```

### 모바일 측 hover ring

```typescript
// apps/mobile-pwa/lib/hooks/useLiveSync.ts (v0.1.4 hoverCubeId 추가)
export interface LiveSyncState {
  cubeUpdates: Map<string, CubeLiveUpdate>;
  selection: LiveSelection | null;
  hoverCubeId: string | null;    // 신규
}
```

```typescript
// 큐브 셀 className 조건부
const isHovered = liveSync.hoverCubeId === cube.id;

<div className={`
  cube-cell
  ${highlighted ? 'cubelist-pulse' : ''}
  ${isHovered ? 'cubelist-hover-ring' : ''}
`}>
```

CSS:
```css
.cubelist-hover-ring {
  outline: 2px solid var(--rbs-accent);
  outline-offset: 2px;
  transition: outline-color 0.15s ease;
}
```

### 부드러운 펄스 (cubelist-pulse 강화)

v0.1.3 기존:
```css
.cubelist-pulse {
  animation: pulse 1s ease-in-out 2;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

v0.1.4 강화:
```css
.cubelist-pulse {
  animation: pulse-soft 2s ease-in-out infinite;
  position: relative;
}
.cubelist-pulse::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid var(--rbs-accent);
  opacity: 0;
  animation: ring-pulse 2s ease-in-out infinite;
}
@keyframes pulse-soft {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.03); filter: brightness(1.1); }
}
@keyframes ring-pulse {
  0% { opacity: 0; transform: scale(0.9); }
  50% { opacity: 0.6; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1.2); }
}
```

## 4. 폴더 진입 시각화

PC가 폴더 클릭 → 폴더 내부 진입 → SelectionChange.current_folder_id 변경.

모바일 측 처리:
```typescript
useEffect(() => {
  if (syncMode === 'off') return;
  const pcFolder = liveSync.selection?.current_folder_id;
  if (pcFolder !== currentFolder?.id) {
    // 자동 진입 (mirror / read_only)
    if (pcFolder) {
      const folderItem = board.items.find((i) => i.id === pcFolder && i.action_type === 'folder');
      if (folderItem) setCurrentFolder(folderItem);
    } else {
      setCurrentFolder(null);
    }
  }
}, [liveSync.selection, syncMode]);
```

폴더 진입 시 애니메이션:
```css
@keyframes folder-enter {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.folder-content {
  animation: folder-enter 0.25s ease-out;
}
```

## 5. 알림 / 토스트

PC selection 변경 시 모바일 짧은 토스트:

```typescript
useEffect(() => {
  if (syncMode === 'off') return;
  if (!liveSync.selection) return;
  // 첫 selection 은 토스트 X (앱 시작 직후 노이즈)
  if (selectionToastShown) return;
  showToast({
    level: 'info',
    message: `🖥 PC selection ↻`,
    duration: 800,
  });
  setSelectionToastShown(true);
}, [liveSync.selection?.timestamp_ms]);
```

토스트는 1초 내 다중 selection 변경 시 디바운스.

## 6. 접근성

### 스크린 리더

- LiveSelectionHeader 에 `role="status"` + `aria-live="polite"`
- PC 페이지 변경 시 "PC 페이지 N 진입" 음성 안내
- 폴더 진입 시 "PC가 폴더 X 진입" 안내

### 키보드 네비

- Tab으로 LiveSelectionHeader 진입 가능
- Enter / Space 로 sync 모드 토글
- ↑ ↓ 로 sync 모드 변경

## 7. 다크 모드

```css
.live-selection-header {
  --header-bg: rgb(255 255 255 / 0.9);
  --header-border: rgb(0 0 0 / 0.1);
}

@media (prefers-color-scheme: dark) {
  .live-selection-header {
    --header-bg: rgb(20 20 20 / 0.9);
    --header-border: rgb(255 255 255 / 0.1);
  }
}
```

## 8. 성능

- LiveSelectionHeader 메모화 (`React.memo` + `useMemo` for boardName / folderName)
- SyncIndicator pcAlive 판정은 5초 throttle (selection.timestamp_ms 기준)
- 큐브 셀 hover ring은 CSS class toggle만 (DOM 재렌더링 X)

## 9. v0.1.3 → v0.1.4 호환

- 기존 amber ribbon (`CubeGrid` 내부) → LiveSelectionHeader 로 이동
- syncMode = 'off' (기본) 사용자: 기존 동작 유지 + 페이지 dot 추가
- syncMode = 'mirror' / 'read_only' 활성 시 신규 UI 노출

## 10. v0.1.4 활성화 순서

```
T+35일: LiveSelectionHeader + SyncIndicator + PagePosition
T+42일: FolderBreadcrumb + 폴더 자동 진입
T+49일: PC CubeHover broadcast + 모바일 hover ring
T+56일: cubelist-pulse v2 (ring-pulse 강화)
T+63일: 접근성 검증 (스크린 리더)
T+70일: e2e 시나리오 (PC selection → 모바일 UI 반영)
```

## 11. 참고

- 모바일 PWA CubeGrid (v0.1.3 ribbon): `apps/mobile-pwa/components/cube/CubeGrid.tsx`
- 모바일 page state (Phase 17): `mobile-page-state.md`
- LiveSync wire spec: `live-sync-wire-v1.md`
- useLiveSync hook: `apps/mobile-pwa/lib/hooks/useLiveSync.ts`
