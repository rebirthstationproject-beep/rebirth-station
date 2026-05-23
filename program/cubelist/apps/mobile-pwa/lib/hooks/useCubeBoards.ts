'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import type { CubeItem, CubeBoard } from '@/lib/types/cube';

interface CubeBoardsState {
  boards: CubeBoard[];
  activeBoardId: string | null;
  loading: boolean;
  /** 마지막 sync 오류 — 컴포넌트가 watch해서 Toast로 노출 */
  lastError: { code: string; message: string; at: number } | null;
  setActiveBoard: (boardId: string) => void;
  loadBoards: () => Promise<void>;
  reorderItems: (boardId: string, next: CubeItem[]) => Promise<void>;
  moveBoard: (boardId: string, direction: -1 | 1) => Promise<void>;
  clearLastError: () => void;
}

const useCubeBoardsStore = create<CubeBoardsState>((set, get) => ({
  boards: [],
  activeBoardId: null,
  loading: false,
  lastError: null,

  clearLastError: () => set({ lastError: null }),

  setActiveBoard: (boardId) => set({ activeBoardId: boardId }),

  loadBoards: async () => {
    if (get().loading) return;
    set({ loading: true });

    // LOCAL_MODE 분기 — localStorage에서 즉시 동기 로드
    if (isLocalMode()) {
      const hydrated = localStore.loadBoards();
      const prevActive = get().activeBoardId;
      const stillExists = prevActive ? hydrated.some((b) => b.id === prevActive) : false;
      set({
        boards: hydrated,
        activeBoardId: stillExists ? prevActive : (hydrated[0]?.id ?? null),
        loading: false,
      });
      return;
    }

    const supabase = getSupabase();
    const { data: boards, error: boardsErr } = await supabase
      .from('mylist_boards')
      .select('*')
      .order('sort_order', { ascending: true });

    if (boardsErr || !boards) {
      console.error('[cubelist] boards load failed', boardsErr);
      set({ loading: false });
      return;
    }

    const boardIds = boards.map((b) => b.id);
    const { data: items, error: itemsErr } = await supabase
      .from('mylist_items')
      .select('*')
      .in('board_id', boardIds);

    if (itemsErr) {
      console.error('[cubelist] items load failed', itemsErr);
    }

    const itemsByBoard: Record<string, CubeItem[]> = {};
    for (const item of items ?? []) {
      const list = itemsByBoard[item.board_id] ?? [];
      list.push(item as CubeItem);
      itemsByBoard[item.board_id] = list;
    }

    const hydrated: CubeBoard[] = boards.map((b) => ({
      ...(b as Omit<CubeBoard, 'items'>),
      items: (itemsByBoard[b.id] ?? []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    // 기존 활성 보드가 여전히 존재하면 유지 — Realtime reload 시 사용자 컨텍스트 보존
    const prevActive = get().activeBoardId;
    const stillExists = prevActive ? hydrated.some((b) => b.id === prevActive) : false;
    const nextActive = stillExists ? prevActive : (hydrated[0]?.id ?? null);

    set({
      boards: hydrated,
      activeBoardId: nextActive,
      loading: false,
    });
  },

  reorderItems: async (boardId, next) => {
    // optimistic local update
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? { ...b, items: next.map((item, idx) => ({ ...item, sort_order: idx * 1.0 })) }
          : b,
      ),
    }));

    // LOCAL_MODE 분기
    if (isLocalMode()) {
      localStore.reorderItems(boardId, next);
      return;
    }

    // 서버 동기화: RPC로 sort_order 일괄 갱신
    const supabase = getSupabase();

    const payload = next.map((item, idx) => ({
      id: item.id,
      sort_order: idx * 1.0,
    }));

    const { error } = await supabase.rpc('mylist_reorder_items', {
      p_board_id: boardId,
      p_items: payload,
    });

    if (error) {
      console.warn('[cubelist] reorder sync failed', error.message);
      set({
        lastError: {
          code: 'reorder_failed',
          message: `큐브 순서 변경 동기화 실패: ${error.message}`,
          at: Date.now(),
        },
      });
      // 실패 시 reload로 진실원 다시 가져오기
      await get().loadBoards();
    }
  },

  moveBoard: async (boardId, direction) => {
    const state = get();
    const idx = state.boards.findIndex((b) => b.id === boardId);
    if (idx === -1) return;
    const target = idx + direction;
    if (target < 0 || target >= state.boards.length) return;

    const a = state.boards[idx];
    const b = state.boards[target];

    // 로컬 swap (optimistic)
    const next = [...state.boards];
    [next[idx], next[target]] = [next[target], next[idx]];
    set({ boards: next });

    // LOCAL_MODE 분기
    if (isLocalMode()) {
      localStore.swapBoards(a.id, b.id);
      return;
    }

    // 서버 sort_order swap
    const supabase = getSupabase();
    const aOrder = a.sort_order;
    const bOrder = b.sort_order;
    const errors: string[] = [];
    const { error: e1 } = await supabase
      .from('mylist_boards')
      .update({ sort_order: bOrder })
      .eq('id', a.id);
    if (e1) errors.push(e1.message);
    const { error: e2 } = await supabase
      .from('mylist_boards')
      .update({ sort_order: aOrder })
      .eq('id', b.id);
    if (e2) errors.push(e2.message);

    if (errors.length > 0) {
      console.warn('[cubelist] moveBoard sync failed', errors);
      set({
        lastError: {
          code: 'move_board_failed',
          message: `보드 순서 변경 동기화 실패: ${errors.join(', ')}`,
          at: Date.now(),
        },
      });
      await get().loadBoards();
    }
  },
}));

export function useCubeBoards() {
  const state = useCubeBoardsStore();
  useEffect(() => {
    void state.loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
