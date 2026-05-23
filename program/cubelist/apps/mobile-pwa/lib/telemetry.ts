/**
 * 텔레메트리 — WAEL 측정용 익명 누름 이벤트 기록
 *
 * 회사: 리버스 스테이션 (Rebirth Station)
 * NSM: WAEL (Weekly Active Executed Lists) — docs/business-report.md Part 2-4
 *
 * 프라이버시 원칙 (영구)
 * - URL·label·payload 절대 송신 X
 * - action_type / press_kind / status / elapsed_ms / mount_mode만
 * - 비로그인 사용자는 텔레메트리 송신 안 함 (로그인 후 가입 동의 = 송신 동의)
 *
 * 배치 큐 — 빈번한 fetch 방지를 위해 5초 또는 10건마다 flush.
 */

import { getSupabase } from '@/lib/supabase';
import type { PressKind, ExecutionStatus } from '@/types/protocol';

interface PressEvent {
  board_id: string | null;
  item_id: string | null;
  // SD-AQ~AV (2026-05-23): 10 enum
  action_type:
    | 'link'
    | 'shortcut'
    | 'macro'
    | 'folder'
    | 'text_insert'
    | 'clipboard_copy'
    | 'app_launch'
    | 'focus_window'
    | 'mouse_click'
    | 'plugin_action';
  press_kind: PressKind;
  status: 'ok' | 'failed' | 'permission_required';
  elapsed_ms: number | null;
  mount_mode: boolean;
  /** Stage 2 이후 활성 — 더블탭 보호 활성 큐브에서 실행된 누름 여부 (Stage 1에서는 전송 시 drop) */
  double_press_guard?: boolean;
  occurred_at: string;
}

const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_BATCH_SIZE = 10;

const queue: PressEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 큐브 누름 이벤트 기록.
 *
 * 호출 위치: CubeListView.handlePress() — 사용자 의도 시점.
 */
export function trackPress(args: {
  boardId: string | null;
  itemId: string | null;
  // SD-AQ~AV (2026-05-23): 4 enum → 10 enum 확장
  actionType:
    | 'link'
    | 'shortcut'
    | 'macro'
    | 'folder'
    | 'text_insert'
    | 'clipboard_copy'
    | 'app_launch'
    | 'focus_window'
    | 'mouse_click'
    | 'plugin_action';
  pressKind: PressKind;
  status: ExecutionStatus | { kind: 'ok' };
  elapsedMs: number | null;
  mountMode: boolean;
  /** confirm_double_press 큐브에서 실제 더블탭으로 발화된 누름 여부. Stage 2 진입 시 서버 컬럼 추가 후 활성 */
  doublePressGuard?: boolean;
}) {
  queue.push({
    board_id: args.boardId,
    item_id: args.itemId,
    action_type: args.actionType,
    press_kind: args.pressKind,
    status: normalizeStatus(args.status),
    elapsed_ms: args.elapsedMs,
    mount_mode: args.mountMode,
    double_press_guard: args.doublePressGuard ?? false,
    occurred_at: new Date().toISOString(),
  });

  if (queue.length >= FLUSH_BATCH_SIZE) {
    void flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => void flush(), FLUSH_INTERVAL_MS);
  }
}

function normalizeStatus(s: ExecutionStatus | { kind: 'ok' }): 'ok' | 'failed' | 'permission_required' {
  if ('kind' in s) {
    if (s.kind === 'ok') return 'ok';
    if (s.kind === 'permission_required') return 'permission_required';
    return 'failed';
  }
  return 'ok';
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;

  const batch = queue.splice(0, queue.length);

  try {
    const supabase = getSupabase();
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      // 비로그인 사용자 — drop
      return;
    }

    // Stage 1: 서버에 double_press_guard 컬럼 미존재 → drop. Stage 2 마이그레이션 후 제거.
    const rows = batch.map((e) => {
      const { double_press_guard: _dropped, ...rest } = e;
      void _dropped;
      return { ...rest, user_id: session.session.user.id };
    });

    const { error } = await supabase.from('mylist_press_events').insert(rows);
    if (error) {
      console.warn('[cubelist] telemetry flush failed', error.message);
      // 재시도 큐로 복귀 (선두에 다시 push)
      queue.unshift(...batch);
    }
  } catch (e) {
    console.warn('[cubelist] telemetry exception', e);
  }
}

// 페이지 unload 시 잔여 flush
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void flush();
  });
  // 모바일에서는 pagehide가 더 안정적
  window.addEventListener('pagehide', () => {
    void flush();
  });
}
