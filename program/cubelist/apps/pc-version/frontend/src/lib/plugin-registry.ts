/**
 * 플러그인 레지스트리 (M4 cron #13)
 *
 * Rust `commands.rs`:
 * - `list_plugins() -> Vec<PluginManifest>`
 * - `install_plugin(bytes: Vec<u8>) -> Result<PluginManifest, String>`
 *
 * Tauri WebView 환경: 실제 invoke 호출.
 * 일반 브라우저 dev: 빈 배열 (mock).
 *
 * Inspector / TopBar 는 본 store 를 사용하여:
 * - action_type select 에 플러그인 액션 옵션 동적 추가
 * - "플러그인 설치" 버튼으로 .cubeplugin 파일 적재
 */

import { create } from 'zustand';
import type { ActionCategory, FieldSchema } from './actions';
import { isTauri } from './tauri-bridge';

/** Rust `PluginManifest` 의 TS 미러 — `apps/pc-version/src/plugins/manifest.rs` 와 1:1 */
export interface PluginManifest {
  package_id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  actions: ManifestAction[];
  requested_permissions: Array<'tier_1' | 'tier_2' | 'tier_3'>;
}

export interface ManifestAction {
  id: string;
  label: string;
  action_type: string;
  default_payload: Record<string, unknown>;
  schema?: FieldSchema[];
  description?: string;
  tier?: 1 | 2 | 3;
  icon_ref?: string;
  /** 사이드바 카테고리 — M6 cron #18, frontend ActionCategory enum 과 동기 */
  category?: ActionCategory;
}

/** 인스펙터에서 사용하는 flat 형태 — plugin × action 조합 */
export interface PluginActionEntry {
  /** `plugin:<package_id>:<action_id>` */
  qualified_id: string;
  package_id: string;
  action_id: string;
  label: string;
  action_type: string;
  default_payload: Record<string, unknown>;
  schema?: FieldSchema[];
  description?: string;
  tier?: 1 | 2 | 3;
  /** 카테고리 — Sidebar 필터링 (M6 cron #18) */
  category?: ActionCategory;
}

interface RegistryState {
  installed: PluginManifest[];
  loading: boolean;
  error: string | null;

  refresh(): Promise<void>;
  install(bytes: Uint8Array): Promise<PluginManifest>;

  /** 모든 플러그인 × 액션 평면화 — Inspector select 에 사용 */
  allActions(): PluginActionEntry[];

  /** qualified_id 로 단일 액션 조회 */
  getAction(qualifiedId: string): PluginActionEntry | null;
}

export const QUALIFIED_PREFIX = 'plugin:' as const;

function buildQualifiedId(pkg: string, actionId: string): string {
  return `${QUALIFIED_PREFIX}${pkg}:${actionId}`;
}

export function parseQualifiedId(
  qualifiedId: string,
): { package_id: string; action_id: string } | null {
  if (!qualifiedId.startsWith(QUALIFIED_PREFIX)) return null;
  const rest = qualifiedId.slice(QUALIFIED_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon === -1) return null;
  return {
    package_id: rest.slice(0, colon),
    action_id: rest.slice(colon + 1),
  };
}

export const usePluginRegistry = create<RegistryState>((set, get) => ({
  installed: [],
  loading: false,
  error: null,

  async refresh(): Promise<void> {
    set({ loading: true, error: null });
    try {
      if (!isTauri()) {
        set({ installed: [], loading: false });
        return;
      }
      const { invoke } = await import('@tauri-apps/api/core');
      const installed = await invoke<PluginManifest[]>('list_plugins');
      set({ installed, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ error: msg, loading: false });
    }
  },

  async install(bytes: Uint8Array): Promise<PluginManifest> {
    if (!isTauri()) {
      throw new Error('플러그인 설치는 Tauri 환경에서만 가능');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    // Tauri 2 는 Vec<u8> 를 number[] 로 받음
    const manifest = await invoke<PluginManifest>('install_plugin', {
      bytes: Array.from(bytes),
    });
    // 설치 직후 목록 갱신
    await get().refresh();
    return manifest;
  },

  allActions(): PluginActionEntry[] {
    const out: PluginActionEntry[] = [];
    for (const plugin of get().installed) {
      for (const action of plugin.actions) {
        out.push({
          qualified_id: buildQualifiedId(plugin.package_id, action.id),
          package_id: plugin.package_id,
          action_id: action.id,
          label: action.label,
          action_type: action.action_type,
          default_payload: action.default_payload,
          schema: action.schema,
          description: action.description,
          tier: action.tier,
          category: action.category,
        });
      }
    }
    return out;
  },

  getAction(qualifiedId: string): PluginActionEntry | null {
    return get().allActions().find((a) => a.qualified_id === qualifiedId) ?? null;
  },
}));

/**
 * 플러그인 액션이 큐브에 적용될 때 cube.action_payload 형식.
 * 인덱스 시그니처 = `Cube['action_payload']` (`Record<string, unknown>`) 와 구조 호환.
 */
export interface PluginActionPayload {
  plugin_uuid: string; // package_id
  action_id: string;
  payload: Record<string, unknown>; // 액션 manifest 의 default_payload 또는 사용자 편집
  [key: string]: unknown;
}

export function buildPluginActionPayload(entry: PluginActionEntry): PluginActionPayload {
  return {
    plugin_uuid: entry.package_id,
    action_id: entry.action_id,
    payload: { ...entry.default_payload },
  };
}
