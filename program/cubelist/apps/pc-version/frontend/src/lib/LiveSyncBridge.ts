/**
 * LiveSyncBridge (v0.1.4 사전, 2026-05-31).
 *
 * 모바일 PWA ↔ PC 큐브 라벨/이미지/상태 실시간 동기화.
 * 본 클래스는 PC frontend 측 broadcaster — 동적 큐브 tick 결과와 selection 변경을
 * 구독 중인 외부 클라이언트(모바일 PWA)에 송신.
 *
 * spec: docs/specs/live-sync-wire-v1.md
 *
 * 현재는 frontend-only stub. v0.1.4 진입 시 Rust 측 WebSocket 서버와
 * 통합되어 모바일 PWA 가 실 message 수신.
 */

type CubeUpdateEvent = {
  readonly event: 'cube_update';
  readonly cube_id: string;
  readonly label?: string;
  readonly icon_url?: string | null;
  readonly state_index?: number;
  readonly timestamp_ms: number;
};

type SelectionChangeEvent = {
  readonly event: 'selection_change';
  readonly list_id: string | null;
  readonly cube_id: string | null;
  readonly page_index?: number;
  readonly current_folder_id?: string;
  readonly timestamp_ms: number;
};

type WireMessage = CubeUpdateEvent | SelectionChangeEvent;

type Subscriber = (msg: WireMessage) => void;

class LiveSyncBridge {
  private subscribers = new Set<Subscriber>();
  private lastSentByCube = new Map<string, { label?: string; icon_url?: string | null; state_index?: number }>();

  /** 구독 등록 — Tauri WebSocket bridge 또는 dev 콘솔 사용. */
  subscribe(handler: Subscriber): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  /**
   * cube_update 송신 — 변경된 부분만 (delta).
   * useDynamicCubes / useCubeStates 가 호출.
   */
  emitCubeUpdate(
    cubeId: string,
    update: { label?: string; icon_url?: string | null; state_index?: number },
  ): void {
    const last = this.lastSentByCube.get(cubeId) ?? {};
    const delta: { label?: string; icon_url?: string | null; state_index?: number } = {};
    let changed = false;
    if (update.label !== undefined && update.label !== last.label) {
      delta.label = update.label;
      changed = true;
    }
    if (update.icon_url !== undefined && update.icon_url !== last.icon_url) {
      delta.icon_url = update.icon_url;
      changed = true;
    }
    if (update.state_index !== undefined && update.state_index !== last.state_index) {
      delta.state_index = update.state_index;
      changed = true;
    }
    if (!changed) return;
    this.lastSentByCube.set(cubeId, { ...last, ...delta });
    this.broadcast({
      event: 'cube_update',
      cube_id: cubeId,
      ...delta,
      timestamp_ms: Date.now(),
    });
  }

  /** selection_change 송신 — selectCube/selectList 변경 시. */
  emitSelectionChange(payload: {
    list_id: string | null;
    cube_id: string | null;
    page_index?: number;
    current_folder_id?: string;
  }): void {
    this.broadcast({
      event: 'selection_change',
      ...payload,
      timestamp_ms: Date.now(),
    });
  }

  /** 큐브 라이브러리 변경 시 캐시 클리어 (예: 큐브팩 로드). */
  resetCache(): void {
    this.lastSentByCube.clear();
  }

  private broadcast(msg: WireMessage): void {
    for (const handler of this.subscribers) {
      try {
        handler(msg);
      } catch {
        // 단일 구독자 오류는 다른 구독자에 영향 X
      }
    }
  }
}

// Singleton — 앱 전역 1개 인스턴스
export const liveSync = new LiveSyncBridge();

// 개발용 dev console expose (Tauri 비활성 환경에서 확인 가능)
if (typeof window !== 'undefined') {
  (window as unknown as { __cubelistLiveSync?: LiveSyncBridge }).__cubelistLiveSync = liveSync;
}
