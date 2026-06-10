'use client';

import { useEffect } from 'react';
import { isPurchaseAvailable } from '@/lib/iap';

/**
 * Capacitor 네이티브 앱에서 IAP store 초기화 (1회).
 *
 * 정착본: memory/project_cubelist_iap.md
 * - PWA / Windows 앱에서는 no-op
 * - Android/iOS 네이티브 앱에서만 cordova-plugin-purchase store 초기화
 */
export function IapInitializer() {
  useEffect(() => {
    if (!isPurchaseAvailable()) return;

    let cancelled = false;
    (async () => {
      try {
        const dynamicImport = Function('m', 'return import(m)') as (m: string) => Promise<{ initializeIap: () => Promise<void> }>;
        const bridge = await dynamicImport('../../../mobile/src/iap-bridge');
        if (cancelled) return;
        await bridge.initializeIap();
      } catch (e) {
        console.warn('[cubelist] IAP 초기화 실패', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
