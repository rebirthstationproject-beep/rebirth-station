'use client';

import { useEffect, useRef, useState } from 'react';
import { createHelperClient, type HelperClient, type ConnectionStatus } from '@/lib/ws-client';
import type { ActionPayload, PressKind } from '@/types/protocol';

interface UseHelperConnectionResult {
  status: ConnectionStatus;
  sendPressItem: (boardId: string, itemId: string, kind: PressKind, action: ActionPayload) => void;
}

/**
 * PC 헬퍼 WS 연결 라이프사이클.
 * 한 페이지당 단일 인스턴스 — 마운트 시 자동 접속, 언마운트 시 정리.
 */
export function useHelperConnection(): UseHelperConnectionResult {
  const clientRef = useRef<HelperClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const client = createHelperClient();
    clientRef.current = client;

    setStatus(client.status());
    const off = client.on('status', (s) => setStatus(s as ConnectionStatus));

    return () => {
      off();
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  return {
    status,
    sendPressItem: (boardId, itemId, kind, action) => {
      clientRef.current?.pressItem(boardId, itemId, kind, action);
    },
  };
}
