'use client';

import { useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode } from '@/lib/storage/local-store';
import { useToast } from '@/lib/toast/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { RealtimeChannel } from '@supabase/supabase-js';

const REALTIME_MESSAGES = {
  ko: {
    unstable: '실시간 동기화 연결이 불안정합니다. 새로고침으로 복구할 수 있습니다.',
    persistent: '실시간 동기화가 5초 이상 끊겨 있습니다. 페이지 새로고침 또는 네트워크 점검을 권장합니다.',
    recovered: '실시간 동기화가 복구되었습니다',
  },
  en: {
    unstable: 'Realtime sync is unstable. Refresh the page to recover.',
    persistent:
      'Realtime sync has been down for 5+ seconds. Refresh the page or check your network.',
    recovered: 'Realtime sync recovered',
  },
  ja: {
    unstable: 'リアルタイム同期が不安定です。ページの再読み込みで復旧できます。',
    persistent:
      'リアルタイム同期が 5 秒以上途切れています。再読み込みまたはネットワーク確認を推奨します。',
    recovered: 'リアルタイム同期が復旧しました',
  },
} as const;

interface Options {
  userId: string | null;
  activeBoardId: string | null;
  /** boards 변경 감지 (INSERT/UPDATE/DELETE 어떤 것이든) */
  onBoardsChanged: () => void;
  /** 활성 board의 items 변경 감지 */
  onItemsChanged: () => void;
}

/**
 * Supabase Realtime 구독 — 다중 기기 동기화.
 *
 * 정착본 §5
 * - 사용자별 단일 채널 `realtime:user:{user_id}`
 * - boards는 user_id 필터로 본인 것만
 * - items는 활성 board_id로 좁힘 → 탭 전환 시 unsubscribe/resubscribe
 * - 활성 board 1개만 구독 (Free 100 / Pro 500 채널 한도 효율적 활용)
 *
 * 핸들러에서는 단순히 loadBoards() 트리거. 부분 패치는 향후.
 *
 * 관련 문서:
 * - `docs/realtime-guide.md` — TOAST_THROTTLE_MS / PERSISTENT_ERROR_MS 영구 동기화 룰 (PC)
 * - `docs/toast-guide.md` — Realtime 메시지가 Toast level/duration 분기 시 참조
 *
 * 영구 동기화 룰 (PD): 본 훅의 상수(TOAST_THROTTLE_MS / PERSISTENT_ERROR_MS) 변경 시
 * `docs/realtime-guide.md`도 함께 갱신. 한쪽만 변경하지 마세요.
 */
export function useRealtimeBoards({
  userId,
  activeBoardId,
  onBoardsChanged,
  onItemsChanged,
}: Options): void {
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const msg = REALTIME_MESSAGES[locale] ?? REALTIME_MESSAGES.ko;
  // 채널 구독은 마운트 시점 closure를 잡으므로 locale 변경 시 옛 msg를 쓰지 않도록 ref로 최신화
  const msgRef = useRef(msg);
  useEffect(() => {
    msgRef.current = msg;
  }, [msg]);
  // channelKey → 마지막 안내 시각 (epoch ms). 60초 burst window
  const lastNotifiedRef = useRef<Map<string, number>>(new Map());
  // channelKey → 직전에 끊김 경고를 노출했는지. 복귀 시 success Toast 표시 트리거
  const hadErrorRef = useRef<Set<string>>(new Set());
  // channelKey → 끊김 지속 5초 후 추가 경고 타이머
  const persistentTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // unmount 시 잔여 타이머 일괄 정리 (OK)
  useEffect(() => {
    const timers = persistentTimerRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);
  /**
   * 같은 channelKey에 대해 끊김 안내 Toast 재발화 차단 시간.
   * 60초 — 한 번 안내 후 1분 동안은 추가 끊김 신호가 들어와도 무음.
   * Stage 2 user_settings 진입 시 user 옵션으로 확장 검토 (KK/KS BLOCKED).
   * VZ 동기화: BLOCKED 활성화 트리거는 `docs/night-auto-log.md` "Stage 2 BLOCKED 활성화 트리거" 표 참조.
   */
  const TOAST_THROTTLE_MS = 60_000;
  /**
   * 끊김 → 복귀 안 되고 지속 시 추가 error Toast 발화 임계값.
   * 5초 — 일시적 네트워크 글리치를 넘어 명백한 문제임을 사용자에게 알림.
   * Stage 2 user 옵션 확장 BLOCKED (KS) — 사용자 보고로 5초 부족·과다 데이터 수집 시 active 전환.
   */
  const PERSISTENT_ERROR_MS = 5_000;

  function handleStatus(status: string, channelKey: string): void {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      const now = Date.now();
      const last = lastNotifiedRef.current.get(channelKey) ?? 0;
      if (now - last < TOAST_THROTTLE_MS) return; // 1분 윈도우 내 재안내 차단
      lastNotifiedRef.current.set(channelKey, now);
      hadErrorRef.current.add(channelKey);
      showToast({ level: 'warning', message: msgRef.current.unstable, duration: 5_000 });
      // 5초 이내에 복귀 안 되면 추가 error 경고 (1회)
      const prev = persistentTimerRef.current.get(channelKey);
      if (prev) clearTimeout(prev);
      const t = setTimeout(() => {
        if (hadErrorRef.current.has(channelKey)) {
          showToast({ level: 'error', message: msgRef.current.persistent, duration: 8_000 });
        }
        persistentTimerRef.current.delete(channelKey);
      }, PERSISTENT_ERROR_MS);
      persistentTimerRef.current.set(channelKey, t);
    } else if (status === 'SUBSCRIBED') {
      // 직전에 끊김 경고를 표시한 경우에만 복귀 안내 (초기 구독 성공은 무음)
      if (hadErrorRef.current.has(channelKey)) {
        hadErrorRef.current.delete(channelKey);
        showToast({ level: 'success', message: msgRef.current.recovered, duration: 3_000 });
      }
      // 지속 타이머도 해제
      const t = persistentTimerRef.current.get(channelKey);
      if (t) {
        clearTimeout(t);
        persistentTimerRef.current.delete(channelKey);
      }
      lastNotifiedRef.current.delete(channelKey);
    }
  }

  // boards 구독 — 사용자 로그인 동안 유지
  useEffect(() => {
    if (!userId) return;
    if (isLocalMode()) return; // LOCAL_MODE: Realtime 구독 X (단일 기기)
    const supabase = getSupabase();
    const key = `boards:${userId}`;
    const channel: RealtimeChannel = supabase
      .channel(`realtime:user:${userId}:boards`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mylist_boards',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onBoardsChanged();
        },
      )
      .subscribe((status) => handleStatus(status, key));

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, onBoardsChanged]);

  // items 구독 — 활성 board에 한정, 탭 전환 시 resubscribe
  useEffect(() => {
    if (!userId || !activeBoardId) return;
    if (isLocalMode()) return; // LOCAL_MODE: Realtime 구독 X
    const supabase = getSupabase();
    const key = `items:${activeBoardId}`;
    const channel: RealtimeChannel = supabase
      .channel(`realtime:user:${userId}:items:${activeBoardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mylist_items',
          filter: `board_id=eq.${activeBoardId}`,
        },
        () => {
          onItemsChanged();
        },
      )
      .subscribe((status) => handleStatus(status, key));

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeBoardId, onItemsChanged]);
}
