/**
 * iOS Safari < 16.4 Wake Lock 미지원 환경용 NoSleep.js 폴백.
 *
 * 정착본 §3 (TypeScript / PWA)
 * - 무음 video loop으로 화면 절전 차단
 * - useMountMode에서 navigator.wakeLock 없을 때 자동 사용
 */

let nosleep: { enable: () => void; disable: () => void } | null = null;

export async function enableNoSleep(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (nosleep) {
    nosleep.enable();
    return;
  }
  try {
    // 동적 로드 (Wake Lock 지원 기기에서는 번들 절약)
    const { default: NoSleep } = await import('nosleep.js');
    nosleep = new NoSleep();
    nosleep.enable();
  } catch (e) {
    console.warn('[cubelist] NoSleep.js 로드 실패', e);
  }
}

export function disableNoSleep(): void {
  nosleep?.disable();
}
