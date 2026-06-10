/**
 * R3-1: 시스템 메트릭 zustand store — 5초 폴링 (Tauri 환경 전용).
 *
 * 브라우저 dev 환경에서는 metrics = null 유지 (가짜 값 생성 금지).
 * Tauri 환경에서만 get_system_metrics invoke 폴링.
 */

import { create } from 'zustand';
import { isTauri } from './tauri-bridge';

export interface SystemMetrics {
  readonly cpu_percent: number;
  readonly ram_used_mb: number;
  readonly ram_total_mb: number;
  readonly disk_used_gb: number;
  readonly disk_total_gb: number;
  readonly network_rx_kbps: number;
  readonly network_tx_kbps: number;
}

interface SystemMetricsStore {
  metrics: SystemMetrics | null;
  _stopPolling: (() => void) | null;
  startPolling: () => void;
  stopPolling: () => void;
}

const POLL_INTERVAL_MS = 5_000;

export const useSystemMetrics = create<SystemMetricsStore>((set, get) => ({
  metrics: null,
  _stopPolling: null,

  startPolling() {
    if (!isTauri()) return;          // 브라우저 dev: 폴링 안 함
    if (get()._stopPolling) return;  // 이미 가동 중

    async function fetchOnce() {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const m = await invoke<SystemMetrics>('get_system_metrics');
        set({ metrics: m });
      } catch {
        // 첫 호출 실패 or Tauri 아직 준비 안 됨 — 무시
      }
    }

    fetchOnce();
    const id = setInterval(fetchOnce, POLL_INTERVAL_MS);
    set({ _stopPolling: () => clearInterval(id) });
  },

  stopPolling() {
    const stop = get()._stopPolling;
    if (stop) {
      stop();
      set({ _stopPolling: null });
    }
  },
}));
