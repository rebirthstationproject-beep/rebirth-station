/**
 * 햅틱 피드백 — 큐브 누름·매크로 실행 등 사용자 액션에 사용.
 *
 * 정착본 §7 — 버튼 누름 0.1초 진동
 *
 * 환경별 동작
 * - Capacitor 네이티브 앱: `@capacitor/haptics` 플러그인 동적 import (모바일 앱 빌드 시 활성)
 * - 웹/PWA: `navigator.vibrate` 폴백 (Android Chrome 등)
 * - 미지원 환경: silent no-op
 *
 * Capacitor `@capacitor/haptics` 패키지는 apps/mobile/package.json에 의존성으로 추가됨.
 * 본 모듈은 환경 감지 후 동적 로드 — 웹 번들에 포함 안 됨.
 */

import { isPurchaseAvailable } from '@/lib/iap';

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * 단일 햅틱 트리거. 호출 시 즉시 진동 발생.
 *
 * Stage 1에서는 web `navigator.vibrate`만 활성, Capacitor 네이티브 앱은 향후.
 */
export function trigger(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined') return;

  // 네이티브 앱(Capacitor) — 향후 모바일 빌드에서 활성
  if (isPurchaseAvailable()) {
    void triggerNative(style);
    return;
  }

  // 웹·PWA — navigator.vibrate 폴백
  if ('vibrate' in navigator) {
    navigator.vibrate(durationFor(style));
  }
}

async function triggerNative(style: HapticStyle): Promise<void> {
  try {
    // @ts-expect-error — 동적 import, 모바일 앱 번들에서만 존재
    const mod = await import('@capacitor/haptics');
    const { Haptics, ImpactStyle, NotificationType } = mod;
    switch (style) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
    }
  } catch {
    // 플러그인 미설치 환경 — 무시
  }
}

function durationFor(style: HapticStyle): number {
  switch (style) {
    case 'light':
      return 10;
    case 'medium':
      return 25;
    case 'heavy':
      return 50;
    case 'success':
      return 20;
    case 'warning':
      return 30;
    case 'error':
      return 60;
  }
}
