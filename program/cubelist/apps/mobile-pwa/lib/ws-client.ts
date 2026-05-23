/**
 * LAN WebSocket 클라이언트 — PC 헬퍼 통신
 *
 * 흐름
 * 1. 페어링 완료 후 IndexedDB에 저장된 HMAC secret + device_id 로드
 * 2. ws://127.0.0.1:23456/ws 또는 LAN IP로 접속
 * 3. 즉시 Hello 송신 (HMAC + nonce + timestamp)
 * 4. Welcome 수신 시 정상, AuthRejected 시 재페어링 요청
 * 5. Ping 15초 간격, 연결 끊김 감지
 *
 * 폴백: LAN WS 실패 → Supabase Realtime 채널로 자동 전환
 */

import {
  PROTOCOL_VERSION,
  parseServerEvent,
  type ActionPayload,
  type ClientEvent,
  type ServerEvent,
  type PressKind,
} from '@/types/protocol';
import { computeHmacHex, generateNonce } from '@/lib/pairing';
import { loadHelperCredentials } from '@/lib/credentials';

const DEFAULT_HELPER_URL = 'ws://127.0.0.1:23456/ws';
const PING_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 2_000;

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface HelperClient {
  status(): ConnectionStatus;
  on(event: 'status' | 'message', handler: (data: unknown) => void): () => void;
  send(event: ClientEvent): void;
  pressItem(boardId: string, itemId: string, kind: PressKind, action: ActionPayload): void;
  disconnect(): void;
}

export function createHelperClient(url: string = DEFAULT_HELPER_URL): HelperClient {
  let socket: WebSocket | null = null;
  let status: ConnectionStatus = 'disconnected';
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let manuallyDisconnected = false;

  const listeners = {
    status: new Set<(s: ConnectionStatus) => void>(),
    message: new Set<(m: ServerEvent) => void>(),
  };

  function setStatus(next: ConnectionStatus) {
    status = next;
    listeners.status.forEach((h) => h(next));
  }

  async function connect() {
    if (manuallyDisconnected) return;
    setStatus('connecting');

    const creds = await loadHelperCredentials();
    if (!creds) {
      // 페어링 안 됨 — 사용자에게 안내
      setStatus('disconnected');
      return;
    }

    socket = new WebSocket(url);

    socket.addEventListener('open', async () => {
      // Hello 송신
      const nonce = generateNonce();
      const timestamp_ms = Date.now();
      const hmac = await computeHmacHex(creds.secret, nonce, timestamp_ms, creds.deviceId);

      send({
        event: 'hello',
        protocol_version: PROTOCOL_VERSION,
        device_id: creds.deviceId,
        nonce,
        timestamp_ms,
        hmac,
      });
    });

    socket.addEventListener('message', (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      try {
        const event = parseServerEvent(e.data);
        handleServerEvent(event);
        listeners.message.forEach((h) => h(event));
      } catch (err) {
        // 알 수 없는/잘못된 메시지는 조용히 무시 (로그만)
        console.warn('[cubelist] invalid server message', err);
      }
    });

    socket.addEventListener('close', () => {
      stopPing();
      setStatus('disconnected');
      socket = null;
      if (!manuallyDisconnected) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    });

    socket.addEventListener('error', () => {
      socket?.close();
    });
  }

  function handleServerEvent(event: ServerEvent) {
    switch (event.event) {
      case 'welcome':
        setStatus('connected');
        startPing();
        break;
      case 'auth_rejected':
        console.warn('[cubelist] auth rejected:', event.reason);
        socket?.close();
        // TODO: 재페어링 플로우 트리거
        break;
      case 'pong':
      case 'item_executed':
      case 'macro_progress':
      case 'notice':
        // listener에 위임
        break;
    }
  }

  function send(event: ClientEvent) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(event));
  }

  function startPing() {
    stopPing();
    pingTimer = setInterval(() => send({ event: 'ping' }), PING_INTERVAL_MS);
  }

  function stopPing() {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = undefined;
  }

  // 초기 연결 시도
  connect();

  return {
    status: () => status,
    on(event, handler) {
      (listeners[event] as Set<typeof handler>).add(handler);
      return () => {
        (listeners[event] as Set<typeof handler>).delete(handler);
      };
    },
    send,
    pressItem(boardId, itemId, kind, action) {
      send({
        event: 'press_item',
        board_id: boardId,
        item_id: itemId,
        press_kind: kind,
        action,
      });
    },
    disconnect() {
      manuallyDisconnected = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      stopPing();
      socket?.close();
    },
  };
}
