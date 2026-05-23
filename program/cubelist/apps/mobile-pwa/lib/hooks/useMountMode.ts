'use client';

import { useCallback, useEffect, useState } from 'react';
import { disableNoSleep, enableNoSleep } from '@/components/pwa/NoSleepFallback';

/**
 * 거치 모드 훅 — Wake Lock + 풀스크린 + 밝기 조정.
 *
 * 정착본 §3, §7
 * - Wake Lock API 자동 획득 (iOS Safari < 16.4 → NoSleep.js 폴백)
 * - visibilitychange 시 재획득 (Android Chrome 제약 우회)
 * - 풀스크린 (display: standalone PWA 한정)
 */
export type MountDimLevel = 'day' | 'dusk' | 'night';

function timeBasedDimLevel(date: Date = new Date()): MountDimLevel {
  const h = date.getHours();
  if (h >= 22 || h < 6) return 'night';
  if (h >= 18 || h < 8) return 'dusk';
  return 'day';
}

export function useMountMode() {
  const [active, setActive] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [dimLevel, setDimLevel] = useState<MountDimLevel>(() => timeBasedDimLevel());

  // 활성 상태에서 30분마다 dim 레벨 재평가
  useEffect(() => {
    if (!active) return;
    setDimLevel(timeBasedDimLevel());
    const interval = setInterval(() => setDimLevel(timeBasedDimLevel()), 30 * 60 * 1_000);
    return () => clearInterval(interval);
  }, [active]);

  // html 요소에 거치 dim 클래스 부여 — globals.css에서 톤 조절
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('cubelist-mount-dim-day', 'cubelist-mount-dim-dusk', 'cubelist-mount-dim-night');
    if (active) {
      root.classList.add(`cubelist-mount-dim-${dimLevel}`);
    }
    return () => {
      root.classList.remove('cubelist-mount-dim-day', 'cubelist-mount-dim-dusk', 'cubelist-mount-dim-night');
    };
  }, [active, dimLevel]);

  const acquire = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      // iOS Safari < 16.4 → NoSleep.js 폴백
      await enableNoSleep();
      return null;
    }
    try {
      const lock = await (navigator as Navigator & { wakeLock: WakeLock }).wakeLock.request(
        'screen',
      );
      setWakeLock(lock);
      lock.addEventListener('release', () => setWakeLock(null));
      return lock;
    } catch (e) {
      console.warn('[cubelist] wake lock denied, falling back to NoSleep', e);
      await enableNoSleep();
      return null;
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release().catch(() => undefined);
      setWakeLock(null);
    }
    disableNoSleep();
  }, [wakeLock]);

  // visibilitychange 시 재획득 (배터리 세이버, 백그라운드 진입 후 복귀 등)
  useEffect(() => {
    if (!active) return;
    const onVis = () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [active, acquire, wakeLock]);

  const enable = useCallback(async () => {
    setActive(true);
    await acquire();
    // 풀스크린은 사용자 제스처 컨텍스트에서만 호출 가능 — 토글 버튼 onClick 안에서
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // 권한 거부 시 무시
    }
  }, [acquire]);

  const disable = useCallback(async () => {
    setActive(false);
    await release();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // 무시
    }
  }, [release]);

  const toggle = useCallback(() => {
    if (active) void disable();
    else void enable();
  }, [active, enable, disable]);

  return { active, toggle, enable, disable, dimLevel };
}
