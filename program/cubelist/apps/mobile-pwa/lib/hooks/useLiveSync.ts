/**
 * 모바일 PWA — LiveSyncBridge 수신 hook (v0.1.3 사전, 2026-05-31).
 *
 * PC frontend 의 동적 큐브 (live_clock/timer/gauge/battery), states (hotkey_toggle),
 * selection 변경을 PC 앱 WebSocket 으로 받아 모바일 UI 에 반영.
 *
 * 사용:
 *   const { cubeUpdates, selection } = useLiveSync(helperClient);
 *   const cubeUpdate = cubeUpdates.get(cube.id);
 *   const displayLabel = cubeUpdate?.label ?? cube.label;
 *   const displayIcon = cubeUpdate?.icon_url ?? cube.icon_url;
 */

import { useEffect, useState } from 'react';
import type { HelperClient } from '../ws-client';
import type { ServerEvent } from '@/types/protocol';

export interface CubeLiveUpdate {
  readonly label?: string;
  readonly icon_url?: string | null;
  readonly state_index?: number;
  readonly timestamp_ms: number;
}

export interface LiveSelection {
  readonly list_id: string | null;
  readonly cube_id: string | null;
  readonly page_index: number;
  readonly current_folder_id?: string;
  readonly timestamp_ms: number;
}

export interface LiveSyncState {
  /** cube_id → 최신 업데이트 */
  readonly cubeUpdates: Map<string, CubeLiveUpdate>;
  /** PC 측 현재 선택 */
  readonly selection: LiveSelection | null;
}

export function useLiveSync(client: HelperClient | null): LiveSyncState {
  const [cubeUpdates, setCubeUpdates] = useState<Map<string, CubeLiveUpdate>>(() => new Map());
  const [selection, setSelection] = useState<LiveSelection | null>(null);

  useEffect(() => {
    if (!client) return;

    const off = client.on('message', (raw) => {
      const event = raw as ServerEvent;
      if (event.event === 'cube_update') {
        setCubeUpdates((prev) => {
          const next = new Map(prev);
          const existing = next.get(event.cube_id);
          // 더 오래된 메시지 무시 (out-of-order 보호)
          if (existing && existing.timestamp_ms > event.timestamp_ms) return prev;
          next.set(event.cube_id, {
            label: event.label ?? existing?.label,
            icon_url: event.icon_url !== undefined ? event.icon_url : existing?.icon_url,
            state_index: event.state_index ?? existing?.state_index,
            timestamp_ms: event.timestamp_ms,
          });
          return next;
        });
      } else if (event.event === 'selection_change') {
        setSelection((prev) => {
          if (prev && prev.timestamp_ms > event.timestamp_ms) return prev;
          return {
            list_id: event.list_id ?? null,
            cube_id: event.cube_id ?? null,
            page_index: event.page_index ?? 0,
            current_folder_id: event.current_folder_id,
            timestamp_ms: event.timestamp_ms,
          };
        });
      }
    });

    return off;
  }, [client]);

  return { cubeUpdates, selection };
}

/** 단일 큐브의 라이브 업데이트 가져오기 (label/icon_url override). */
export function getCubeLiveDisplay(
  cube: { id: string; label: string; icon_url: string | null },
  liveSync: LiveSyncState,
): { label: string; icon_url: string | null } {
  const update = liveSync.cubeUpdates.get(cube.id);
  return {
    label: update?.label ?? cube.label,
    icon_url: update?.icon_url !== undefined ? update.icon_url : cube.icon_url,
  };
}
