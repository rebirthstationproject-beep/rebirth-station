'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export interface WeeklyRow {
  week_start: string;
  press_count: number;
  boards_used: number;
  link_count: number;
  shortcut_count: number;
  macro_count: number;
  mount_mode_count: number;
  ok_count: number;
}

export interface TopItemRow {
  item_id: string;
  label: string;
  board_name: string;
  press_count: number;
}

export interface InsightsState {
  weekly: WeeklyRow[];
  topItems: TopItemRow[];
  totalPresses28d: number;
  loading: boolean;
  error: string | null;
}

const INITIAL: InsightsState = {
  weekly: [],
  topItems: [],
  totalPresses28d: 0,
  loading: true,
  error: null,
};

/**
 * 본인 사용량 통계 조회.
 *
 * 정착본
 * - 0003 마이그레이션: mylist_press_events (RLS owner) + user_wael_weekly view
 * - 본 훅은 본인 데이터만 — 글로벌 집계는 service role 영역
 *
 * 데이터 출처
 * - weekly: user_wael_weekly view (최근 8주)
 * - topItems: mylist_press_events JOIN mylist_items (최근 28일, 누름 횟수 desc)
 */
export function useInsights(): InsightsState {
  const [state, setState] = useState<InsightsState>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const supabase = getSupabase();
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          if (cancelled) return;
          setState({
            ...INITIAL,
            loading: false,
            error: '로그인이 필요합니다',
          });
          return;
        }
        const userId = session.session.user.id;

        const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 86_400_000).toISOString();

        const [weeklyResp, eventsResp] = await Promise.all([
          supabase
            .from('user_wael_weekly')
            .select('*')
            .eq('user_id', userId)
            .gte('week_start', eightWeeksAgo)
            .order('week_start', { ascending: true }),
          supabase
            .from('mylist_press_events')
            .select('item_id, board_id')
            .eq('user_id', userId)
            .gte('occurred_at', new Date(Date.now() - 28 * 86_400_000).toISOString())
            .not('item_id', 'is', null)
            .limit(5000),
        ]);

        if (cancelled) return;

        if (weeklyResp.error) throw weeklyResp.error;
        if (eventsResp.error) throw eventsResp.error;

        const weekly = (weeklyResp.data ?? []) as WeeklyRow[];
        const events = (eventsResp.data ?? []) as Array<{
          item_id: string;
          board_id: string | null;
        }>;

        // item별 카운트 집계
        const counts = new Map<string, number>();
        for (const e of events) {
          counts.set(e.item_id, (counts.get(e.item_id) ?? 0) + 1);
        }
        const topIds = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id]) => id);

        let topItems: TopItemRow[] = [];
        if (topIds.length > 0) {
          const { data: items } = await supabase
            .from('mylist_items')
            .select('id, label, board_id, mylist_boards(name)')
            .in('id', topIds);

          if (items) {
            topItems = (items as unknown as Array<{
              id: string;
              label: string;
              mylist_boards: { name: string } | null;
            }>)
              .map((it) => ({
                item_id: it.id,
                label: it.label,
                board_name: it.mylist_boards?.name ?? '(삭제됨)',
                press_count: counts.get(it.id) ?? 0,
              }))
              .sort((a, b) => b.press_count - a.press_count);
          }
        }

        const totalPresses28d = events.length;

        if (cancelled) return;
        setState({
          weekly,
          topItems,
          totalPresses28d,
          loading: false,
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          ...INITIAL,
          loading: false,
          error: (e as Error).message,
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
