/**
 * Tauri ↔ frontend 브리지 (M3 cron #8)
 *
 * Tauri WebView 환경에서는 `@tauri-apps/api/core` 의 `invoke` 를 사용하여 Rust commands.rs
 * 의 `execute_cube` 핸들러를 호출.
 *
 * 일반 브라우저(dev: `vite` only) 환경에서는 invoke 불가 — `executeCube` 는 mock 응답 반환.
 * 이를 통해 frontend 단독 dev 도 가능하면서 Tauri 빌드에서는 실제 동작.
 */

import type { Cube } from '../types/cube';

/** Tauri WebView 내부에서 동작 중인지 검출 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(w.__TAURI_INTERNALS__ ?? w.__TAURI__);
}

export interface ExecuteResult {
  elapsed_ms: number;
}

export interface ExecuteError {
  kind: 'deserialize' | 'unsafe_scheme' | 'os_command' | 'feature_disabled' | 'permission_required';
  message: string;
  tier?: number;
}

/**
 * 큐브 액션을 PC 헬퍼에 위임 실행.
 *
 * Tauri 환경: `invoke('execute_cube', { action: { action_type, ...payload } })`
 * 비 Tauri 환경: 콘솔 로그 + mock 결과 (개발용)
 */
// === Tier 2/3 동의 메모리 그랜트 (세션 한정, localStorage 영속 옵션) ===
const CONSENT_STORAGE_KEY = 'cubelist:tier_consents';

interface TierConsents {
  /** 액션 타입별 사용자 동의 (true = 영구 허용, undefined = 매번 prompt) */
  [actionType: string]: boolean;
}

function loadConsents(): TierConsents {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveConsents(consents: TierConsents): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consents));
  } catch {
    /* localStorage unavailable */
  }
}

/**
 * Tier 2/3 액션은 사용자 동의 prompt 후 실행.
 * v0.1.4 사전: ConsentDialog (이번만/영구/거부 3옵션).
 * 영구 허용 선택 시 localStorage 저장 → 이후 자동 통과.
 */
async function requireConsent(actionType: Cube['action_type']): Promise<boolean> {
  const tier2 = new Set([
    'window_close',
    'app_launch',
    'focus_window',
    'mouse_click',
    'system_actionbar_toggle',
    'hotkey_toggle',
  ]);
  const tier3 = new Set(['system_sleep', 'plugin_action']);
  if (!tier2.has(actionType) && !tier3.has(actionType)) return true;

  const consents = loadConsents();
  if (consents[actionType] === true) return true;

  const tier = tier3.has(actionType) ? 3 : 2;
  const { showConsentDialog } = await import('../components/ConsentDialog');
  const result = await showConsentDialog(actionType, tier);
  if (result === 'allow_always') {
    consents[actionType] = true;
    saveConsents(consents);
    return true;
  }
  return result === 'allow_once';
}

/**
 * 2026-06-01 A: plugin_action 큐브 → vendor URL fallback.
 * cube.metadata.sd_uuid 기반 SDK vendor 매핑.
 */
const SD_VENDOR_FALLBACK: ReadonlyArray<[RegExp, string]> = [
  [/com\.elgato\.discord/i, 'https://discord.com'],
  [/com\.elgato\.spotify|spotify/i, 'https://open.spotify.com'],
  [/com\.elgato\.streamlabs|streamlabs/i, 'https://streamlabs.com'],
  [/com\.elgato\.wavelink|wave.?link/i, 'https://www.elgato.com/wave-link'],
  [/com\.elgato\.controlcenter|control.?center/i, 'https://www.elgato.com/control-center'],
  [/com\.obsproject\.|obs.?studio|obs.?tools/i, 'https://obsproject.com'],
  [/com\.adobe\.photoshop|photoshop|adobe/i, 'https://www.adobe.com/products/photoshop.html'],
  [/com\.elgato\.twitch|twitch/i, 'https://www.twitch.tv'],
  [/com\.elgato\.youtube|youtube/i, 'https://www.youtube.com'],
  [/com\.elgato\.voicemod|voicemod/i, 'https://www.voicemod.net'],
  [/com\.elgato\.philipshue|philips.?hue|\bhue\b/i, 'https://www.meethue.com'],
  [/com\.elgato\.weather|weather/i, 'https://weather.com'],
  [/com\.elgato\.cpu|cpu/i, 'https://www.elgato.com'],
  [/com\.elgato\.advancedlauncher|launcher/i, 'https://www.elgato.com'],
  [/com\.barraider\.supermacro/i, 'https://github.com/BarRaider/streamdeck-supermacro'],
];

function pluginActionFallbackUrl(cube: Cube): string | null {
  const meta = (cube.metadata ?? {}) as Record<string, unknown>;
  const sdUuid = (meta.sd_uuid as string | undefined) ?? '';
  const label = cube.label ?? '';
  const haystack = `${sdUuid} ${label}`;
  for (const [pattern, url] of SD_VENDOR_FALLBACK) {
    if (pattern.test(haystack)) return url;
  }
  return null;
}

export async function executeCube(cube: Cube): Promise<ExecuteResult> {
  // 2026-06-01 A: plugin_action 큐브 → vendor URL fallback (작동 X 큐브를 사이트로)
  if (cube.action_type === 'plugin_action') {
    const fallback = pluginActionFallbackUrl(cube);
    if (fallback) {
      if (isTauri()) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke<ExecuteResult>('execute_cube', { action: { action_type: 'link', url: fallback } }).catch(() => {});
      } else {
        window.open(fallback, '_blank', 'noopener,noreferrer');
      }
      return { elapsed_ms: 1 };
    }
  }

  // v0.1.2: hotkey_toggle 등 multi-state 큐브는 states[current_index] 의 payload 사용 후 advance
  const { resolveActionForExecution } = await import('./cube-states');
  const { payload: resolvedPayload } = resolveActionForExecution(cube);

  // hotkey_toggle 은 state 의 keys 를 shortcut 으로 변환해서 송신 (Rust 측은 shortcut 만 처리)
  let action: { action_type: string } & Record<string, unknown>;
  if (cube.action_type === 'hotkey_toggle') {
    const keys = Array.isArray((resolvedPayload as { keys?: unknown }).keys)
      ? ((resolvedPayload as { keys: string[] }).keys)
      : [];
    if (keys.length === 0) {
      return { elapsed_ms: 0 };
    }
    action = { action_type: 'shortcut', keys };
  } else {
    action = {
      action_type: cube.action_type,
      ...resolvedPayload,
    };
  }

  // Tier 2/3 사용자 동의 확인 (v0.1.4 사전: ConsentDialog)
  const granted = await requireConsent(cube.action_type);
  if (!granted) {
    return { elapsed_ms: 0 };
  }

  if (!isTauri()) {
    // 브라우저 dev — link 큐브만 즉시 처리, 나머지는 mock
    if (cube.action_type === 'link') {
      const url = typeof cube.action_payload.url === 'string' ? cube.action_payload.url : '';
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // eslint-disable-next-line no-console
      console.info('[tauri-bridge] dev mock executeCube', action);
    }
    return { elapsed_ms: 0 };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<ExecuteResult>('execute_cube', { action });
}

/** 사용자가 모든 Tier 동의를 초기화하고 싶을 때 (설정 UI에서 호출). */
export function clearAllTierConsents(): void {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 사용자 표시용 에러 메시지 — Rust 측 ExecuteErrorDto 를 한글 문구로.
 */
export function describeExecuteError(e: unknown): string {
  if (e && typeof e === 'object' && 'kind' in e) {
    const err = e as ExecuteError;
    switch (err.kind) {
      case 'unsafe_scheme':
        return `안전하지 않은 URL: ${err.message}`;
      case 'os_command':
        return `OS 명령 실패: ${err.message}`;
      case 'feature_disabled':
        return `이 액션은 아직 구현 대기: ${err.message}`;
      case 'permission_required':
        return `Tier ${err.tier ?? '?'} 권한이 필요합니다 — 설정에서 활성화하세요`;
      case 'deserialize':
        return `payload 형식 오류: ${err.message}`;
    }
  }
  if (e instanceof Error) return e.message;
  return String(e);
}
