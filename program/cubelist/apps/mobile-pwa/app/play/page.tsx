'use client';

/**
 * /play — 작동 전용 페이지 (2026-06-12 사용자 스펙)
 *
 * 1. 작동하는 큐브만 존재 (편집 UI 없음)
 * 2. 큐브 = 아이콘만, 전부 동일 사이즈. 배치 모드에서 드래그로 위치 변환만 가능
 * 3. 첫 페이지 = 전체 메뉴(리스트 선택), 클릭 시 사이드로 슬라이드 → 해당 리스트 전면 큐브
 *    상단 = 배치 / 저장 / 불러오기 한 줄 (얇게)
 * 4. PC = 마우스 드래그&드랍 / 모바일 = 터치 드래그 (PointerSensor 공통)
 * 5. 이동·편집은 저장 버튼을 눌러야 localStore에 반영
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import type { CubeItem } from '@/lib/types/cube';
import { ImportSheet } from '@/components/cube/ImportSheet';

interface PlayBoard {
  id: string;
  name: string;
  items: CubeItem[];
}

// ── 큐브 셀 — 아이콘만, 동일 사이즈 ─────────────────────────────────────────
function PlayCube({
  item,
  arrange,
  onFire,
}: {
  item: CubeItem;
  arrange: boolean;
  onFire: (item: CubeItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !arrange,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={`aspect-square rounded-2xl overflow-hidden bg-surface-2 border border-border select-none ${
        arrange ? 'cursor-grab active:cursor-grabbing' : 'active:scale-95 transition-transform'
      }`}
      onClick={() => {
        if (!arrange) onFire(item);
      }}
      title={item.label}
      {...attributes}
      {...listeners}
    >
      {item.icon_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.icon_url} alt={item.label} className="w-full h-full object-cover" draggable={false} />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-lg text-ink-muted">
          {item.label.slice(0, 1)}
        </span>
      )}
    </button>
  );
}

// ── 보드 한 페이지 ──────────────────────────────────────────────────────────
function BoardPage({
  board,
  arrange,
  onReorder,
  onFire,
}: {
  board: PlayBoard;
  arrange: boolean;
  onReorder: (boardId: string, items: CubeItem[]) => void;
  onFire: (item: CubeItem) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent): void {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = board.items.findIndex((i) => i.id === String(active.id));
    const to = board.items.findIndex((i) => i.id === String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(board.id, arrayMove(board.items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={board.items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-4 gap-3 p-4">
          {board.items.map((item) => (
            <PlayCube key={item.id} item={item} arrange={arrange} onFire={onFire} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ── 메인 ────────────────────────────────────────────────────────────────────
export default function PlayPage() {
  const [boards, setBoards] = useState<PlayBoard[]>([]);
  const [page, setPage] = useState(0); // 0 = 전체 메뉴
  const [arrange, setArrange] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchX = useRef<number | null>(null);

  const reload = useCallback(() => {
    if (!isLocalMode()) return;
    setBoards(
      localStore.loadBoards().map((b) => ({ id: b.id, name: b.name, items: b.items ?? [] })),
    );
    setDirty(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function showToast(msg: string): void {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }

  // 드래그 결과는 화면 상태에만 반영 — 저장 버튼으로 확정 (스펙 5)
  function handleReorder(boardId: string, items: CubeItem[]): void {
    setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, items } : b)));
    setDirty(true);
  }

  function handleSave(): void {
    if (!dirty) return;
    for (const b of boards) localStore.reorderItems(b.id, b.items);
    setDirty(false);
    showToast('저장됨');
  }

  // 작동: link = 직접 발화, 그 외 = PC 페어링 안내 (작동 페이지 1차 — 로컬)
  function handleFire(item: CubeItem): void {
    if (item.action_type === 'link') {
      const url = (item.action_payload as { url?: string })?.url;
      if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    if (item.action_type === 'folder') {
      showToast('폴더는 리스트 화면에서 사용하세요');
      return;
    }
    showToast('PC 연결 후 실행 가능한 큐브입니다');
  }

  // 좌우 스와이프 페이지 전환 (스펙 3·4) — pointer 이벤트 = 마우스 드래그 + 터치 공통 (2026-06-12)
  function onSwipeDown(e: React.PointerEvent): void {
    if (arrange) return; // 배치 모드 중엔 큐브 드래그 우선
    touchX.current = e.clientX;
  }
  function onSwipeUp(e: React.PointerEvent): void {
    if (arrange || touchX.current === null) return;
    const dx = e.clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 60) return;
    if (dx < 0 && page < boards.length) setPage(page + 1);
    if (dx > 0 && page > 0) setPage(page - 1);
  }

  if (!isLocalMode()) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-ink-muted">
        작동 페이지는 로컬 모드에서 사용 가능합니다 (NEXT_PUBLIC_LOCAL_MODE=true)
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col overflow-hidden">
      {/* 상단 — 배치 / 저장 / 불러오기 한 줄 (얇게) */}
      <header className="flex items-center gap-2 px-3 h-11 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => setArrange((v) => !v)}
          className={`text-xs px-3 py-1 rounded-md border ${
            arrange
              ? 'border-rbs-accent text-rbs-accent bg-rbs-accent/10'
              : 'border-border text-ink-muted'
          }`}
        >
          배치
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className={`text-xs px-3 py-1 rounded-md border border-border ${
            dirty ? 'text-ink' : 'text-ink-muted opacity-50'
          }`}
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="text-xs px-3 py-1 rounded-md border border-border text-ink-muted"
        >
          불러오기
        </button>
        <span className="ml-auto flex gap-1.5">
          {Array.from({ length: boards.length + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={i === 0 ? '전체 메뉴' : boards[i - 1]?.name}
              onClick={() => setPage(i)}
              className={`w-1.5 h-1.5 rounded-full ${i === page ? 'bg-rbs-accent' : 'bg-border'}`}
            />
          ))}
        </span>
      </header>

      {/* 페이지 슬라이더 — 0 = 전체 메뉴, 1..N = 보드 */}
      <div
        className="flex-1 overflow-hidden"
        onPointerDown={onSwipeDown}
        onPointerUp={onSwipeUp}
        onPointerLeave={() => { touchX.current = null; }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {/* 페이지 0 — 전체 메뉴 */}
          <section className="min-w-full h-full overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 p-4">
              {boards.length === 0 && (
                <p className="col-span-2 text-center text-sm text-ink-muted py-16">
                  리스트가 없습니다 — 우상단 불러오기로 .cubepack을 추가하세요
                </p>
              )}
              {boards.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPage(i + 1)}
                  className="rounded-2xl border border-border bg-surface-2 p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="w-16 h-16 rounded-xl overflow-hidden bg-surface border border-border">
                    {b.items[0]?.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.items[0].icon_url} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </span>
                  <span className="text-sm text-ink">{b.name}</span>
                  <span className="text-[10px] text-ink-muted">{b.items.length} 큐브</span>
                </button>
              ))}
            </div>
          </section>

          {/* 페이지 1..N — 보드별 전면 큐브 */}
          {boards.map((b) => (
            <section key={b.id} className="min-w-full h-full overflow-y-auto">
              <BoardPage board={b} arrange={arrange} onReorder={handleReorder} onFire={handleFire} />
            </section>
          ))}
        </div>
      </div>

      {/* 미니 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full bg-surface-2 border border-border text-ink shadow-lg">
          {toast}
        </div>
      )}

      <ImportSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          reload();
          showToast('가져오기 완료');
        }}
      />
    </main>
  );
}
