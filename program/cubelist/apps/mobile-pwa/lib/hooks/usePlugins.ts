'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { PluginRow } from '@/lib/types/plugin';

interface UsePluginsResult {
  plugins: PluginRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

type SortKey = 'install_count' | 'updated_at' | 'name';

export function usePlugins(options?: {
  search?: string;
  sort?: SortKey;
}): UsePluginsResult {
  const [plugins, setPlugins] = useState<PluginRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      let query = supabase.from('mylist_plugins').select('*').eq('published', true);

      if (options?.search) {
        query = query.or(
          `name.ilike.%${options.search}%,description.ilike.%${options.search}%,package_id.ilike.%${options.search}%`,
        );
      }

      const sort = options?.sort ?? 'install_count';
      query = query.order(sort, { ascending: sort === 'name' });

      const { data, error: err } = await query;
      if (err) throw err;
      setPlugins((data ?? []) as PluginRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [options?.search, options?.sort]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { plugins, loading, error, reload };
}

/**
 * 플러그인 설치 — `mylist_install_plugin` RPC 호출 (SECURITY DEFINER).
 * 같은 plugin_id 재설치 시 board_id만 갱신 (UNIQUE 충돌 시 ON CONFLICT update).
 */
export async function installPlugin(
  pluginId: string,
  boardId: string | null = null,
): Promise<{ success: boolean; installId?: string; reason?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('mylist_install_plugin', {
    p_plugin_id: pluginId,
    p_board_id: boardId,
  });
  if (error) {
    return { success: false, reason: error.message };
  }
  return { success: true, installId: data as string };
}
