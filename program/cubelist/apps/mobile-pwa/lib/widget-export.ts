/**
 * 위젯 데이터 인터페이스 v1.
 *
 * 정착본: docs/widget-spec.md
 *
 * 사용
 * - 네이티브 위젯(Capacitor Android/iOS)이 본 함수를 호출하여
 *   사용자의 위젯 큐브 목록을 받음
 * - 데이터 소스 우선순위: 위젯 보드 > 최근 28일 top N > 활성 보드 상위
 * - 액션 페이로드는 포함 X (앱 측 DB에서 별도 조회 — 위젯 표면적 최소화)
 */

import { getSupabase } from '@/lib/supabase';

export const WIDGET_PAYLOAD_VERSION = 1 as const;

export interface WidgetCubeEntry {
  id: string;
  label: string;
  icon_url: string | null;
  action_type: 'link' | 'shortcut' | 'macro';
  /** 위젯 탭 시 큐브 리스트 앱 열림 → 즉시 실행 */
  deep_link: string;
}

export interface WidgetCubePayload {
  version: typeof WIDGET_PAYLOAD_VERSION;
  fetched_at: string;
  cubes: WidgetCubeEntry[];
}

interface FetchOptions {
  /** 위젯 크기별 cap: 소(4) / 중(8) / 대(16) */
  limit?: number;
}

const DEFAULT_LIMIT = 8;

/**
 * 위젯 큐브 페이로드 fetch.
 *
 * 데이터 흐름
 * 1. 본인 로그인 세션 확인
 * 2. (예정) `user_widget_cubes` view 우선 — 사용자 지정 위젯 보드
 * 3. 폴백: `mylist_press_events` 최근 28일 top N item_id → mylist_items 조회
 * 4. 결과를 WidgetCubeEntry 배열로 변환 (action_payload 제외)
 */
export async function fetchWidgetPayload(options: FetchOptions = {}): Promise<WidgetCubePayload> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();

  const now = new Date().toISOString();

  if (!session?.session) {
    return { version: WIDGET_PAYLOAD_VERSION, fetched_at: now, cubes: [] };
  }

  const userId = session.session.user.id;

  // 최근 28일 누름 이벤트 집계 → top N item_id
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString();
  const { data: events } = await supabase
    .from('mylist_press_events')
    .select('item_id')
    .eq('user_id', userId)
    .gte('occurred_at', since)
    .not('item_id', 'is', null)
    .limit(5000);

  const counts = new Map<string, number>();
  for (const e of (events ?? []) as Array<{ item_id: string }>) {
    counts.set(e.item_id, (counts.get(e.item_id) ?? 0) + 1);
  }

  let topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // 폴백: 누름 기록 없으면 첫 보드의 상위 큐브
  if (topIds.length === 0) {
    const { data: board } = await supabase
      .from('mylist_boards')
      .select('id')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (board) {
      const { data: items } = await supabase
        .from('mylist_items')
        .select('id')
        .eq('board_id', board.id)
        .order('grid_y', { ascending: true })
        .order('grid_x', { ascending: true })
        .limit(limit);
      topIds = (items ?? []).map((i) => (i as { id: string }).id);
    }
  }

  if (topIds.length === 0) {
    return { version: WIDGET_PAYLOAD_VERSION, fetched_at: now, cubes: [] };
  }

  const { data: items } = await supabase
    .from('mylist_items')
    .select('id, label, icon_url, action_type')
    .in('id', topIds);

  // 원래 누름 빈도 순서 복원
  const itemMap = new Map<string, { label: string; icon_url: string | null; action_type: string }>();
  for (const it of (items ?? []) as Array<{
    id: string;
    label: string;
    icon_url: string | null;
    action_type: string;
  }>) {
    itemMap.set(it.id, {
      label: it.label,
      icon_url: it.icon_url,
      action_type: it.action_type,
    });
  }

  const cubes: WidgetCubeEntry[] = topIds
    .map((id): WidgetCubeEntry | null => {
      const m = itemMap.get(id);
      if (!m) return null;
      const type = m.action_type;
      if (type !== 'link' && type !== 'shortcut' && type !== 'macro') return null;
      return {
        id,
        label: m.label,
        icon_url: m.icon_url,
        action_type: type,
        deep_link: `cubelist://press/${id}`,
      };
    })
    .filter((c): c is WidgetCubeEntry => c !== null);

  return {
    version: WIDGET_PAYLOAD_VERSION,
    fetched_at: now,
    cubes,
  };
}

/**
 * 딥링크 파싱 — `cubelist://press/<uuid>` 형태만 허용.
 *
 * 정착본: docs/widget-spec.md §딥링크 규약
 */
export type DeepLinkAction =
  | { kind: 'press'; itemId: string }
  | { kind: 'board'; boardId: string }
  | { kind: 'list' }
  | { kind: 'pair' };

export function parseDeepLink(url: string): DeepLinkAction | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'cubelist:') return null;

  const host = parsed.host || parsed.pathname.replace(/^\/+/, '').split('/')[0];
  const rest = parsed.pathname.replace(/^\/+/, '').split('/').slice(host ? 1 : 0);

  switch (host) {
    case 'press': {
      const itemId = rest[0];
      if (!itemId || !isUuid(itemId)) return null;
      return { kind: 'press', itemId };
    }
    case 'board': {
      const boardId = rest[0];
      if (!boardId || !isUuid(boardId)) return null;
      return { kind: 'board', boardId };
    }
    case 'list':
      return { kind: 'list' };
    case 'pair':
      return { kind: 'pair' };
    default:
      return null;
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
