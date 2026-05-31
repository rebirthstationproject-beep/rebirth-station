'use client';

import { useEffect, useRef, useState } from 'react';
import { createHelperClient, type HelperClient, type ConnectionStatus } from '@/lib/ws-client';
import type { ActionPayload, PressKind } from '@/types/protocol';

interface UseHelperConnectionResult {
  status: ConnectionStatus;
  sendPressItem: (boardId: string, itemId: string, kind: PressKind, action: ActionPayload) => void;
  /** v0.1.3: 외부 hook (useLiveSync 등) 이 ServerEvent 구독에 사용 */
  client: HelperClient | null;
}

/**
 * PC 헬퍼 WS 연결 라이프사이클.
 * 한 페이지당 단일 인스턴스 — 마운트 시 자동 접속, 언마운트 시 정리.
 */
export function useHelperConnection(): UseHelperConnectionResult {
  const clientRef = useRef<HelperClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  // v0.1.3: 외부 hook 이 클라이언트 인스턴스에 reactive 하게 접근하도록 state 추가
  const [client, setClient] = useState<HelperClient | null>(null);

  useEffect(() => {
    const instance = createHelperClient();
    clientRef.current = instance;
    setClient(instance);

    setStatus(instance.status());
    const off = instance.on('status', (s) => setStatus(s as ConnectionStatus));

    return () => {
      off();
      instance.disconnect();
      clientRef.current = null;
      setClient(null);
    };
  }, []);

  return {
    status,
    sendPressItem: (boardId, itemId, kind, action) => {
      clientRef.current?.pressItem(boardId, itemId, kind, action);
    },
    client,
  };
}
