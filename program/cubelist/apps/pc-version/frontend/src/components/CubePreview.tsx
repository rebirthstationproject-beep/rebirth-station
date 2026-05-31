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

  return (
    <div className="cube-preview-card">
      <div className="cube-preview-label-top">{t('inspector.preview')}</div>
      <div
        className={`cube-cell cube-preview-cell ${isPlaceholder ? 'icon-placeholder' : 'has-icon'} ${isTinyIcon ? 'icon-tiny' : ''}`}
      >
        {displayIcon && !isPlaceholder ? (
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
