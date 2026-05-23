'use client';

import { useCallback, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { useToast } from '@/lib/toast/useToast';

interface AddToCubeButtonProps {
  /** 디렉토리 항목 정보 — favicon, og:title, URL */
  link: {
    url: string;
    title: string;
    icon_url?: string | null;
  };
  /** 추가 후 토스트 콜백 (옵션) */
  onAdded?: (boardName: string) => void;
}

const LOCAL_KEY = 'cubelist:pending_items';

/**
 * "내 큐브에 추가" 버튼.
 *
 * 정착본 §7 (UX)
 * - 디렉토리 페이지 ★ 즐겨찾기 옆 정착
 * - 비로그인: localStorage 임시 저장, 가입 시 자동 이관
 * - 로그인: 사용자의 활성 board에 즉시 insert
 * - 원탭 + 하단 토스트
 *
 * jusomoa 본체에 이식할 때 본 컴포넌트만 import해서 사용:
 *
 *   import { AddToCubeButton } from '@cubelist/web/components/integration/AddToCubeButton';
 *   <AddToCubeButton link={{ url, title, icon_url }} />
 */
export function AddToCubeButton({ link, onAdded }: AddToCubeButtonProps) {
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const handleAdd = useCallback(async () => {
    if (busy) return;
    setBusy(true);

    try {
      if (isLocalMode()) {
        const boards = localStore.loadBoards();
        let targetBoard = boards[0] ?? null;
        if (!targetBoard) {
          targetBoard = localStore.createBoard('기본');
        }
        localStore.addItem(targetBoard.id, {
          label: trimLabel(link.title),
          icon_url: link.icon_url ?? null,
          action_type: 'link',
          action_payload: { url: link.url },
        });
        showToast({ level: 'success', message: `${targetBoard.name} 리스트에 추가됨` });
        onAdded?.(targetBoard.name);
        return;
      }

      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session) {
        // 비로그인 → localStorage 임시 저장
        savePending(link);
        showToast({
          level: 'info',
          message: '기본 리스트에 임시 저장됨 · 가입 시 자동 이관',
        });
        onAdded?.('기본');
        return;
      }

      // 로그인 → 활성 board 조회 후 insert
      const userId = session.session.user.id;
      const { data: board, error: boardErr } = await supabase
        .from('mylist_boards')
        .select('id, name, grid_cols, grid_rows')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (boardErr) {
        throw boardErr;
      }

      const targetBoard =
        board ??
        (await createDefaultBoard(supabase, userId).then((d) => {
          if (!d) throw new Error('default board 생성 실패');
          return d;
        }));

      if (!targetBoard) return;

      // 빈 셀 찾기 (간단: 가장 큰 grid_y, grid_x + 1)
      const { data: nextCoord } = await supabase
        .from('mylist_items')
        .select('grid_x, grid_y')
        .eq('board_id', targetBoard.id)
        .order('grid_y', { ascending: false })
        .order('grid_x', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { x, y } = computeNextCell(nextCoord, targetBoard.grid_cols);

      const { error: insertErr } = await supabase.from('mylist_items').insert({
        board_id: targetBoard.id,
        grid_x: x,
        grid_y: y,
        label: trimLabel(link.title),
        icon_url: link.icon_url ?? null,
        action_type: 'link',
        action_payload: { url: link.url },
      });

      if (insertErr) {
        throw insertErr;
      }

      showToast({
        level: 'success',
        message: `${targetBoard.name} 리스트에 추가됨`,
      });
      onAdded?.(targetBoard.name);
    } catch (e) {
      showToast({
        level: 'error',
        message: `추가 실패: ${(e as Error).message}`,
      });
    } finally {
      setBusy(false);
    }
  }, [busy, link, onAdded, showToast]);

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rbs-accent-soft text-rbs-accent hover:bg-rbs-accent hover:text-white transition text-sm font-medium disabled:opacity-50"
        aria-label="내 큐브에 추가"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <line x1="14" y1="17.5" x2="21" y2="17.5" />
          <line x1="17.5" y1="14" x2="17.5" y2="21" />
        </svg>
        내 큐브에
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

function trimLabel(title: string): string {
  // 정착본 §7: og:title 16자
  return title.length > 16 ? `${title.slice(0, 15)}…` : title;
}

interface PendingItem {
  url: string;
  title: string;
  icon_url?: string | null;
  added_at: string;
}

function savePending(link: AddToCubeButtonProps['link']) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const list: PendingItem[] = raw ? JSON.parse(raw) : [];
    list.push({ ...link, added_at: new Date().toISOString() });
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    // 무시
  }
}

/**
 * 로그인 직후 호출 — 비로그인 시 모은 항목을 신규 user의 기본 board에 이관.
 */
export async function migratePendingItems(userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (isLocalMode()) return 0;
  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return 0;

  let pending: PendingItem[];
  try {
    pending = JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(LOCAL_KEY);
    return 0;
  }
  if (pending.length === 0) return 0;

  const supabase = getSupabase();
  const board = await createDefaultBoard(supabase, userId);
  if (!board) return 0;

  const rows = pending.map((p, idx) => ({
    board_id: board.id,
    grid_x: idx % board.grid_cols,
    grid_y: Math.floor(idx / board.grid_cols),
    label: trimLabel(p.title),
    icon_url: p.icon_url ?? null,
    action_type: 'link' as const,
    action_payload: { url: p.url },
  }));

  const { error } = await supabase.from('mylist_items').insert(rows);
  if (error) {
    console.error('[cubelist] migration failed', error);
    return 0;
  }

  window.localStorage.removeItem(LOCAL_KEY);
  return rows.length;
}

async function createDefaultBoard(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
): Promise<{ id: string; name: string; grid_cols: number; grid_rows: number } | null> {
  const { data, error } = await supabase
    .from('mylist_boards')
    .insert({ user_id: userId, name: '기본', sort_order: 0 })
    .select('id, name, grid_cols, grid_rows')
    .single();
  if (error || !data) {
    console.error('[cubelist] default board create failed', error);
    return null;
  }
  return data;
}

function computeNextCell(
  last: { grid_x: number; grid_y: number } | null | undefined,
  cols: number,
): { x: number; y: number } {
  if (!last) return { x: 0, y: 0 };
  const nextIdx = last.grid_y * cols + last.grid_x + 1;
  return { x: nextIdx % cols, y: Math.floor(nextIdx / cols) };
}
