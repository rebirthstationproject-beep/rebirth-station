/**
 * 인스펙터 큐브 미리보기 카드 (v0.1.2).
 *
 * - 실 큐브 셀 모습 (LCD 톤) 그대로 표시
 * - live_* 동적 큐브는 1초 tick 실시간 반영
 * - hotkey_toggle 등 states 큐브는 현재 state 라벨/이미지 반영
 * - PNG_TINY / placeholder 가시화 동일 적용
 */

import { useEffect, useState } from 'react';
import type { Cube } from '../types/cube';
import { getDynamicTick, recommendedTickInterval } from '../lib/dynamic-cube';
import { applyCurrentState, listenStateChange } from '../lib/cube-states';
import { useTranslation } from '../lib/i18n/useTranslation';

interface CubePreviewProps {
  readonly cube: Cube;
}

export function CubePreview({ cube }: CubePreviewProps) {
  const { t } = useTranslation();
  // states 적용
  const [stateTick, setStateTick] = useState(0);
  useEffect(() => {
    if (!cube.states || cube.states.length <= 1) return;
    return listenStateChange((cubeId) => {
      if (cubeId === cube.id) setStateTick((t) => t + 1);
    });
  }, [cube.id, cube.states?.length]);
  const stateApplied = applyCurrentState(cube);
  void stateTick;

  // dynamic tick
  const dyn = getDynamicTick(stateApplied);
  const [dynUpdate, setDynUpdate] = useState<{ label?: string; icon_url?: string | null }>({});
  useEffect(() => {
    if (!dyn) {
      setDynUpdate({});
      return;
    }
    function applyTick(): void {
      const r = dyn!.tick(Date.now(), dyn!.payload);
      setDynUpdate({ label: r.label, icon_url: r.icon_url });
    }
    applyTick();
    const interval = setInterval(applyTick, recommendedTickInterval(stateApplied));
    return () => clearInterval(interval);
  }, [dyn?.tick, JSON.stringify(stateApplied.action_payload)]);

  // 최종 표시
  const displayLabel = dynUpdate.label ?? stateApplied.label;
  const displayIcon = dynUpdate.icon_url ?? stateApplied.icon_url;
  const iconMeta = (cube.metadata ?? {}) as Record<string, unknown>;
  const isTinyIcon = iconMeta.icon_is_tiny === true;
  const isPlaceholder = !displayIcon || iconMeta.icon_is_placeholder === true;
  const placeholderLetter = (displayLabel || '?').trim().charAt(0).toUpperCase();

  // 2026-06-01: live_clock format='analog' → SVG 시계 (바늘 1초마다 회전)
  const isAnalogClock =
    cube.action_type === 'live_clock' &&
    (cube.action_payload?.format as string | undefined) === 'analog';

  return (
    <div className="cube-preview-card">
      <div className="cube-preview-label-top">{t('inspector.preview')}</div>
      <div
        className={`cube-cell cube-preview-cell ${isPlaceholder && !isAnalogClock ? 'icon-placeholder' : 'has-icon'} ${isTinyIcon ? 'icon-tiny' : ''}`}
      >
        {isAnalogClock ? (
          <div className="cube-icon-bg" aria-hidden style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnalogClockSvg />
          </div>
        ) : displayIcon && !isPlaceholder ? (
          <div
            className="cube-icon-bg"
            style={{ backgroundImage: `url("${displayIcon}")` }}
            aria-hidden
          />
        ) : (
          <div className="cube-icon-bg" data-placeholder-letter={placeholderLetter} aria-hidden />
        )}
        <span className="cube-label">{displayLabel}</span>
      </div>
      {cube.states && cube.states.length > 1 && (
        <div className="cube-preview-state-info">
          {t('inspector.current_state')}: {applyCurrentState(cube).label || `state 0`}
        </div>
      )}
    </div>
  );
}

/**
 * 아날로그 시계 SVG — 1초마다 바늘 회전 (2026-06-01).
 * 큐브 미리보기 + (옵션) 큐브 셀에서 재사용.
 */
function AnalogClockSvg() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourAngle = (h + m / 60) * 30; // 360/12
  const minAngle = (m + s / 60) * 6;   // 360/60
  const secAngle = s * 6;
  return (
    <svg viewBox="0 0 100 100" width="70" height="70" aria-label="아날로그 시계">
      <circle cx="50" cy="50" r="48" fill="#0d0d0d" stroke="#444" strokeWidth="2" />
      {/* 시 마커 */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 50 + Math.sin(a) * 42;
        const y1 = 50 - Math.cos(a) * 42;
        const x2 = 50 + Math.sin(a) * (i % 3 === 0 ? 36 : 39);
        const y2 = 50 - Math.cos(a) * (i % 3 === 0 ? 36 : 39);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={i % 3 === 0 ? '#ccc' : '#666'}
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        );
      })}
      {/* 시 침 */}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((hourAngle * Math.PI) / 180) * 22}
        y2={50 - Math.cos((hourAngle * Math.PI) / 180) * 22}
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* 분 침 */}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((minAngle * Math.PI) / 180) * 32}
        y2={50 - Math.cos((minAngle * Math.PI) / 180) * 32}
        stroke="#eee"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* 초 침 */}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((secAngle * Math.PI) / 180) * 36}
        y2={50 - Math.cos((secAngle * Math.PI) / 180) * 36}
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* 중심 */}
      <circle cx="50" cy="50" r="2.5" fill="#fff" />
    </svg>
  );
}
