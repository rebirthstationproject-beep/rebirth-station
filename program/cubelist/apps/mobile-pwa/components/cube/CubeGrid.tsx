'use client';

import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cube } from './Cube';
import type { CubeItem } from '@/lib/types/cube';
import { useHelperConnection } from '@/lib/hooks/useHelperConnection';
import { useLiveSync } from '@/lib/hooks/useLiveSync';

interface CubeGridProps {
  /** 현재 보드의 큐브 목록. sort_order 오름차순 정렬은 호출자가 보장 */
  items: CubeItem[];
  /** 한 줄당 큐브 개수 (디스플레이 설정, 3~8, 사용자 환경) */
  cols: number;
  /** 편집 모드 토글 — 드래그 핸들/+ 큐브추가 버튼 노출 */
  editMode: boolean;
  /** 보기 모드 탭 시 호출 — trackPress + action 발화 */
  onPress?: (item: CubeItem) => void;
  /** 편집 모드 long-press 또는 탭 — CubeEditSheet 진입 */
  onLongPress?: (item: CubeItem) => void;
  /** dnd-kit 정렬 변경 시 새 순서 배열 전달 (호출자가 sort_order 재계산 + DB 갱신) */
  onReorder?: (next: CubeItem[]) => void;
  /** 편집 모드 마지막 + 버튼 클릭 시 호출 (큐브 신규 추가) */
  onAddCube?: () => void;
  /** jiggle 모드에서 ✖ 클릭 시 호출 (큐브 삭제) */
  onDeleteCube?: (item: CubeItem) => void;
  /** 검색 결과에서 선택된 큐브 — 2초 펄스 효과 */
  highlightedItemId?: string | null;
  /** 빈 슬롯에 라이브러리 큐브 드롭 시 호출 (TUR, 2026-05-23) */
  onDropCube?: (data: {
    label: string;
    icon_src: string | null;
    action_type: 'link' | 'shortcut' | 'macro';
    url: string | null;
  }) => void;
  /** 큐브 우클릭 시 컨텍스트 메뉴 (TUS, 2026-05-23) */
  onContextMenuCube?: (item: CubeItem, x: number, y: number) => void;
  /** 키보드 네비로 focus 변경 시 호출 (TVI, 2026-05-23) — 편집 모드에서 인스펙터 자동 갱신 */
  onFocusChange?: (item: CubeItem) => void;
}

/** 모바일 세로 권장 페이지 크기 (4×7) — file-format-spec v3 정착본 */
const RECOMMENDED_PAGE_SIZE = 28;

export function CubeGrid({
  items,
  cols,
  editMode,
  onPress,
  onLongPress,
  onReorder,
  onAddCube,
  onDeleteCube,
  highlightedItemId,
  onDropCube,
  onContextMenuCube,
  onFocusChange,
}: CubeGridProps) {
  // v0.1.3: PC LiveSyncBridge 의 실시간 라벨/이미지/상태 변경 반영
  const { client: helperClient } = useHelperConnection();
  const liveSync = useLiveSync(helperClient);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder?.(arrayMove(items, oldIndex, newIndex));
  };

  // flow 레이아웃 키보드 탐색 (cols 기반 좌/우/상/하)
  // TVI (2026-05-23): 편집 모드에서도 활성 — focus 변경 시 onFocusChange로 인스펙터 동기화
  const gridRef = useRef<HTMLDivElement | null>(null);
  function handleArrowNav(e: KeyboardEvent<HTMLDivElement>): void {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (!keys.includes(e.key)) return;
    const root = gridRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLButtonElement>('button[aria-label$="큐브"]'),
    );
    if (focusables.length === 0) return;
    const activeIdx = focusables.findIndex((b) => b === document.activeElement);
    if (activeIdx === -1) {
      focusables[0]?.focus();
      if (onFocusChange && items[0]) onFocusChange(items[0]);
      e.preventDefault();
      return;
    }
    let nextIdx = activeIdx;
    switch (e.key) {
      case 'ArrowLeft':
        nextIdx = Math.max(0, activeIdx - 1);
        break;
      case 'ArrowRight':
        nextIdx = Math.min(focusables.length - 1, activeIdx + 1);
        break;
      case 'ArrowUp':
        nextIdx = Math.max(0, activeIdx - cols);
        break;
      case 'ArrowDown':
        nextIdx = Math.min(focusables.length - 1, activeIdx + cols);
        break;
    }
    if (nextIdx !== activeIdx) {
      focusables[nextIdx]?.focus();
      if (onFocusChange && items[nextIdx]) onFocusChange(items[nextIdx]);
      e.preventDefault();
    }
  }

  const overRecommended = items.length > RECOMMENDED_PAGE_SIZE;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={rectSortingStrategy}
        disabled={!editMode}
      >
        {overRecommended && (
          <div
            role="note"
            className="mx-4 mt-2 mb-1 px-3 py-2 rounded-lg bg-rbs-accent-soft border border-rbs-accent/20 text-xs text-rbs-accent-strong dark:bg-rbs-accent/10 dark:text-rbs-accent"
          >
            큐브 {items.length}개 — 권장 페이지 크기({RECOMMENDED_PAGE_SIZE}개, 모바일 4×7 기준) 초과.
            가독성을 위해 리스트 분할을 고려하세요.
          </div>
        )}
        <div
          ref={gridRef}
          role="grid"
          aria-label={`${cols}열 큐브 리스트 (${items.length}개)`}
          aria-colcount={cols}
          onKeyDown={handleArrowNav}
          className="grid gap-2 cubelist-safe-area"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {items.map((item) => {
            // v0.1.3: 이 큐브에 대한 PC LiveSyncBridge 업데이트 lookup
            const live = liveSync.cubeUpdates.get(item.id);
            const liveOverride = live
              ? { label: live.label, icon_url: live.icon_url }
              : undefined;
            return (
            <div key={item.id} role="gridcell" className="relative">
              <div className={editMode ? 'cubelist-jiggle' : ''}>
                <SortableCube
                  item={item}
                  editMode={editMode}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  onContextMenu={onContextMenuCube}
                  highlighted={highlightedItemId === item.id}
                  liveOverride={liveOverride}
                />
              </div>
              {editMode && onDeleteCube && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCube(item);
                  }}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow z-10 hover:bg-red-600"
                  aria-label={`${item.label} 삭제`}
                  title="삭제"
                >
                  ✕
                </button>
              )}
            </div>
            );
          })}
          {editMode && onAddCube && (
            <div role="gridcell">
              <AddCubeButton onAdd={onAddCube} />
            </div>
          )}
          {/* Stream Deck 톤: 편집 모드 시 빈 슬롯을 cols 행에 맞춰 채워 보드 크기 시각화 */}
          {editMode &&
            (() => {
              const totalCells = items.length + (onAddCube ? 1 : 0);
              const remainder = totalCells % cols;
              const emptyCount = remainder === 0 ? 0 : cols - remainder;
              return Array.from({ length: emptyCount }).map((_, idx) => (
                <div role="gridcell" key={`empty-${idx}`} aria-hidden>
                  <EmptySlot onAdd={onAddCube} onDropCube={onDropCube} />
                </div>
              ));
            })()}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface EmptySlotProps {
  onAdd?: () => void;
  /** 라이브러리에서 큐브 드롭 시 보드에 추가 (TUR, 2026-05-23) */
  onDropCube?: (data: {
    label: string;
    icon_src: string | null;
    action_type: 'link' | 'shortcut' | 'macro';
    url: string | null;
  }) => void;
}

function EmptySlot({ onAdd, onDropCube }: EmptySlotProps) {
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(e: DragEvent<HTMLButtonElement>): void {
    if (!onDropCube) return;
    if (!e.dataTransfer.types.includes('application/json')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function handleDrop(e: DragEvent<HTMLButtonElement>): void {
    e.preventDefault();
    setDragOver(false);
    if (!onDropCube) return;
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        type?: string;
        label?: string;
        icon_src?: string | null;
        action_type?: 'link' | 'shortcut' | 'macro';
        url?: string | null;
      };
      if (data.type !== 'cubelist/cube' || !data.label) return;
      onDropCube({
        label: data.label,
        icon_src: data.icon_src ?? null,
        action_type: data.action_type ?? 'link',
        url: data.url ?? null,
      });
    } catch {
      // 무시
    }
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      tabIndex={-1}
      className={`aspect-square rounded-2xl border-2 border-dashed transition cursor-pointer ${
        dragOver
          ? 'border-rbs-accent bg-rbs-accent-soft dark:bg-rbs-accent/20 scale-105'
          : 'cubelist-empty-slot border-border/50 hover:border-rbs-accent/30'
      }`}
      aria-label="빈 슬롯"
    />
  );
}

interface SortableCubeProps {
  item: CubeItem;
  editMode: boolean;
  onPress?: (item: CubeItem) => void;
  onLongPress?: (item: CubeItem) => void;
  onContextMenu?: (item: CubeItem, x: number, y: number) => void;
  highlighted?: boolean;
  liveOverride?: { label?: string; icon_url?: string | null };
}

function SortableCube({ item, editMode, onPress, onLongPress, onContextMenu, highlighted, liveOverride }: SortableCubeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={highlighted ? 'cubelist-pulse rounded-2xl' : ''}
      {...attributes}
      {...(editMode ? listeners : {})}
    >
      <Cube
        item={item}
        editMode={editMode}
        onPress={onPress}
        onLongPress={onLongPress}
        onContextMenu={onContextMenu}
        liveOverride={liveOverride}
      />
    </div>
  );
}

interface AddCubeButtonProps {
  onAdd: () => void;
}

function AddCubeButton({ onAdd }: AddCubeButtonProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="aspect-square rounded-2xl border-2 border-dashed border-border text-ink-muted hover:border-rbs-accent hover:text-rbs-accent transition flex items-center justify-center text-2xl"
      aria-label="큐브 추가 (마지막에)"
    >
      +
    </button>
  );
}
