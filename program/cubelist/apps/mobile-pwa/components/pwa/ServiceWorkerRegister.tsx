'use client';

import { useEffect, useState } from 'react';

/**
 * 서비스 워커 등록.
 *
 * 정착본 §3 — jusomoa 본체의 SW silent-fail 패턴 회피.
 * 등록 실패 시 콘솔 + 사용자 토스트로 알림.
 */
export function ServiceWorkerRegister() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      setError('이 브라우저는 거치 모드 캐싱을 지원하지 않습니다');
      return;
    }
    // Tauri 환경에서는 SW 무의미
    if (process.env.NEXT_PUBLIC_RUNTIME === 'tauri') return;

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[cubelist] SW 등록 실패', err);
      setError(`서비스 워커 등록 실패: ${err.message ?? '알 수 없는 오류'}`);
    });
  }, []);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-900 z-50"
    >
      {error}
    </div>
  );
}
