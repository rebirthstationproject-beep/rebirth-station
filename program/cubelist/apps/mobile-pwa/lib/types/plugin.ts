/**
 * 플러그인 도메인 타입 — DB `mylist_plugins` 와 1:1
 */

export interface PluginRow {
  id: string;
  package_id: string;
  name: string;
  description: string | null;
  version: string;
  author: string | null;
  icon_url: string | null;
  manifest: PluginManifest;
  manifest_signature: string | null;
  published: boolean;
  install_count: number;
  created_at: string;
  updated_at: string;
}

export interface PluginManifest {
  package_id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  actions: PluginManifestAction[];
  requested_permissions: Array<'tier_1' | 'tier_2' | 'tier_3'>;
}

export interface PluginManifestAction {
  id: string;
  label: string;
  action_type: 'link' | 'shortcut' | 'macro';
  default_payload: Record<string, unknown>;
}
