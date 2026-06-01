/**
 * StreamDeck plugin → 큐브 builtin action 자동 매핑 (heuristic).
 * 2026-06-01 — plugin_action 큐브를 즉시 작동하는 builtin 으로 변환.
 *
 * 사용처:
 * - plugin-converter.ts: 변환 시점에 적용
 * - library-loader.ts: 기존 변환 큐브 로드 시점에 동적 remap (사용자가 재변환 없이 효과)
 */

export interface HeuristicMatchResult {
  readonly type: string;
  readonly payload?: Record<string, unknown>;
}

interface HeuristicRule {
  readonly pattern: RegExp;
  readonly type: string;
  readonly payload?: Record<string, unknown>;
}

/**
 * 2026-06-01 정밀화: 패턴은 UUID 도메인 기반 (com.<vendor>.<plugin>.<action>) 만 매칭.
 * label/tooltip 의 일반 단어 (memory, timer, play 등) 가 정상 큐브를 잘못 매핑하는 회귀 방지.
 *
 * 일반 라이브러리 큐브의 아이콘이 그대로 유지되도록 매우 보수적.
 */
const HEURISTIC_RULES: ReadonlyArray<HeuristicRule> = [
  // Live 동적 큐브 — UUID 기반 명확 매칭만
  { pattern: /com\.gallowaylabs\.tomato/i, type: 'live_timer', payload: { duration_seconds: 1500 } },
  { pattern: /com\.[^.]+\.(analog.?clock|analogclock)/i, type: 'live_clock', payload: { format: 'analog' } },
  { pattern: /com\.[^.]+\.(world.?clock|worldclock|digital.?clock|digitalclock|clock)$/i, type: 'live_clock', payload: { format: 'HH:mm' } },
  { pattern: /com\.[^.]+\.(battery|batterylevel)/i, type: 'live_battery' },
  { pattern: /com\.[^.]+\.(cpu|cpumonitor|cpugauge)$/i, type: 'live_monitor', payload: { source: 'cpu' } },
  { pattern: /com\.[^.]+\.(speedtest|speed_test|networkmonitor)/i, type: 'live_network' },
  // 2026-06-01 P3 신규 — 통합 모델 (시계/모니터/알람/날씨)
  { pattern: /com\.[^.]+\.(weather|forecast)/i, type: 'live_weather', payload: { condition: 'sunny', temp_c: 22 } },
  { pattern: /com\.[^.]+\.(alarm|alert)/i, type: 'live_alarm', payload: { target_ms: Date.now() + 300_000 } },
  { pattern: /com\.[^.]+\.(stock|crypto|coin|btc|exchange)/i, type: 'live_stock', payload: { symbol: 'BTC', price: 0, change_pct: 0 } },
  { pattern: /com\.[^.]+\.(calendar|event|schedule)/i, type: 'live_calendar' },
  { pattern: /com\.[^.]+\.(news|rss|headline)/i, type: 'live_news' },
  { pattern: /com\.[^.]+\.(memory|ram|disk)/i, type: 'live_monitor', payload: { source: 'ram' } },
];

/** 정확한 Elgato 공식 UUID → builtin */
export const ACTION_TYPE_MAP: Record<string, string> = {
  'com.elgato.streamdeck.system.website': 'link',
  'com.elgato.streamdeck.system.open': 'app_launch',
  'com.elgato.streamdeck.system.openapp': 'app_launch',
  'com.elgato.streamdeck.system.hotkey': 'shortcut',
  'com.elgato.streamdeck.system.text': 'text_insert',
  // 2026-06-01 B: Sub-action StreamDeck 표준 UUID 추가
  'com.elgato.streamdeck.profile.rotate': 'profile_rotate',
  'com.elgato.streamdeck.profile.previous': 'page_navigate',
  'com.elgato.streamdeck.profile.openchild': 'folder_open',
  'com.elgato.streamdeck.profile.backtoparent': 'folder_up',
  'com.elgato.streamdeck.page.previous': 'page_navigate',
  'com.elgato.streamdeck.page.next': 'page_navigate',
  'com.elgato.streamdeck.system.multimedia': 'media_key',
  'com.elgato.streamdeck.system.volume': 'media_key',
};

/**
 * UUID / Name / Tooltip 키워드 매칭.
 * 우선순위: exact UUID > heuristic regex
 */
export function heuristicMatch(
  uuid: string | undefined | null,
  name?: string | null,
  tooltip?: string | null,
): HeuristicMatchResult | null {
  if (uuid && ACTION_TYPE_MAP[uuid]) {
    return { type: ACTION_TYPE_MAP[uuid] };
  }
  const haystack = [uuid, name, tooltip].filter(Boolean).join(' ');
  for (const rule of HEURISTIC_RULES) {
    if (rule.pattern.test(haystack)) {
      return { type: rule.type, payload: rule.payload };
    }
  }
  return null;
}

/** 기존 plugin_action 큐브를 dynamic remap (라이브러리 로드 시점) */
export function remapPluginActionCube(cube: {
  action_type?: string;
  label?: string;
  metadata?: Record<string, unknown> | null;
  action_payload?: Record<string, unknown>;
}): {
  changed: boolean;
  type?: string;
  payload?: Record<string, unknown>;
} {
  if (cube.action_type !== 'plugin_action') return { changed: false };
  const meta = (cube.metadata ?? {}) as Record<string, unknown>;
  const sdUuid = (meta.sd_uuid as string | undefined) ?? null;
  const tooltip = (meta.sd_tooltip as string | undefined) ?? null;
  const label = cube.label ?? null;
  const matched = heuristicMatch(sdUuid, label, tooltip);
  if (!matched) return { changed: false };
  return {
    changed: true,
    type: matched.type,
    payload: matched.payload,
  };
}
