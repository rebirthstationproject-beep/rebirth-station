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

const HEURISTIC_RULES: ReadonlyArray<HeuristicRule> = [
  // Live 동적 큐브
  { pattern: /tomato|pomodoro|timer\b/i, type: 'live_timer', payload: { duration_seconds: 1500 } },
  { pattern: /\bclock\b|world.?clock|digital.?clock/i, type: 'live_clock', payload: { format: 'HH:mm' } },
  { pattern: /analog.?clock/i, type: 'live_clock', payload: { format: 'analog' } },
  { pattern: /battery/i, type: 'live_battery' },
  { pattern: /\bcpu\b|memory|disk|network.?speed|hardware/i, type: 'live_gauge', payload: { source: 'cpu' } },
  { pattern: /speedtest|speed.?test/i, type: 'live_gauge', payload: { source: 'network' } },
  // 외부 사이트 링크
  { pattern: /spotify/i, type: 'link', payload: { url: 'https://open.spotify.com' } },
  { pattern: /youtube/i, type: 'link', payload: { url: 'https://www.youtube.com' } },
  { pattern: /twitch/i, type: 'link', payload: { url: 'https://www.twitch.tv' } },
  { pattern: /discord/i, type: 'link', payload: { url: 'https://discord.com/channels/@me' } },
  { pattern: /github/i, type: 'link', payload: { url: 'https://github.com' } },
  { pattern: /weather/i, type: 'link', payload: { url: 'https://weather.com' } },
  { pattern: /streamlabs/i, type: 'link', payload: { url: 'https://streamlabs.com' } },
  { pattern: /philips.?hue|hue\b/i, type: 'link', payload: { url: 'https://www.meethue.com' } },
  // 미디어 키
  { pattern: /\bmute\b|volume.?mute/i, type: 'media_key', payload: { key: 'VolumeMute' } },
  { pattern: /volume.?up|vol.?up/i, type: 'media_key', payload: { key: 'VolumeUp' } },
  { pattern: /volume.?down|vol.?down/i, type: 'media_key', payload: { key: 'VolumeDown' } },
  { pattern: /\bplay\b|\bpause\b|playpause/i, type: 'media_key', payload: { key: 'MediaPlayPause' } },
  { pattern: /\bnext\b.*track|track.*next/i, type: 'media_key', payload: { key: 'MediaNextTrack' } },
  { pattern: /\bprev|previous.*track|track.*prev/i, type: 'media_key', payload: { key: 'MediaPrevTrack' } },
  // OBS / Photoshop / 앱 액션 → shortcut (사용자 직접 매핑)
  { pattern: /obs.?studio|obs.?tools/i, type: 'shortcut', payload: { keys: [] } },
  { pattern: /photoshop|adobe/i, type: 'shortcut', payload: { keys: [] } },
  { pattern: /powerpoint/i, type: 'shortcut', payload: { keys: [] } },
  { pattern: /voicemod|wave.?link|sound.?deck/i, type: 'shortcut', payload: { keys: [] } },
  { pattern: /super.?macro|macro/i, type: 'macro', payload: { steps: [] } },
  { pattern: /launcher|launch\b/i, type: 'app_launch', payload: { path: '', args: [] } },
];

/** 정확한 Elgato 공식 UUID → builtin */
export const ACTION_TYPE_MAP: Record<string, string> = {
  'com.elgato.streamdeck.system.website': 'link',
  'com.elgato.streamdeck.system.open': 'app_launch',
  'com.elgato.streamdeck.system.openapp': 'app_launch',
  'com.elgato.streamdeck.system.hotkey': 'shortcut',
  'com.elgato.streamdeck.system.text': 'text_insert',
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
