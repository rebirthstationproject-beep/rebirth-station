/**
 * P2 동적 큐브 액션 (Phase 5 P2, 2026-05-31).
 *
 * tick 시스템 (lib/dynamic-cube.ts) 의 라이브 업데이트 큐브.
 * 매핑:
 *  - live_clock   → com.elgato.streamdeck.system.digitaltime
 *  - live_timer   → com.elgato.streamdeck.timer
 *  - live_gauge   → 자체 확장 (StreamDeck 등가 X)
 *  - live_battery → 자체 확장 (StreamDeck 등가 X)
 */

import type { ActionSpec } from './types';

export const liveClockAction: ActionSpec = {
  id: 'live_clock',
  label: '디지털 시계',
  description: '현재 시각을 라이브로 표시합니다 (1초 또는 30초 간격).',
  tier: 1,
  category: '시스템',
  defaultPayload: { format: 'HH:MM:SS' },
  schema: [
    {
      key: 'format',
      type: 'select',
      label: '표시 형식',
      required: true,
      options: [
        { value: 'HH:MM:SS', label: '시:분:초 (1초 갱신)' },
        { value: 'HH:MM', label: '시:분 (30초 갱신)' },
        { value: 'h:MM AM/PM', label: '12시간 (1분 갱신)' },
      ],
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.format !== 'string' || p.format.length === 0) errors.push('형식 필수');
    return errors;
  },
};

export const liveTimerAction: ActionSpec = {
  id: 'live_timer',
  label: '카운트다운 타이머',
  description: '목표 시각까지 남은 시간을 라이브로 표시합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { target_ms: 0, label_format: 'MM:SS' },
  schema: [
    {
      key: 'target_ms',
      type: 'number',
      label: '목표 epoch ms',
      required: true,
      hint: '예: 새 Date(2026,11,31,23,59,59).getTime()',
    },
    {
      key: 'label_format',
      type: 'select',
      label: '표시 형식',
      options: [
        { value: 'MM:SS', label: '분:초' },
        { value: 'HH:MM:SS', label: '시:분:초' },
      ],
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.target_ms !== 'number' || p.target_ms <= 0) errors.push('목표 시각 필수');
    return errors;
  },
};

export const liveGaugeAction: ActionSpec = {
  id: 'live_gauge',
  label: '게이지 (수치 표시)',
  description: '값/최소/최대 로 정의된 게이지를 색상 바와 함께 표시합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { value: 0, min: 0, max: 100, unit: '%', label_prefix: '' },
  schema: [
    { key: 'value', type: 'number', label: '현재 값', required: true },
    { key: 'min', type: 'number', label: '최소', required: true },
    { key: 'max', type: 'number', label: '최대', required: true },
    { key: 'unit', type: 'text', label: '단위', placeholder: '%, °C, MB' },
    { key: 'label_prefix', type: 'text', label: '라벨 prefix', placeholder: 'CPU' },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.value !== 'number') errors.push('값 필요');
    if (typeof p.min !== 'number' || typeof p.max !== 'number') errors.push('min/max 필요');
    if (typeof p.min === 'number' && typeof p.max === 'number' && p.min >= p.max) {
      errors.push('min < max 필수');
    }
    return errors;
  },
};

export const liveBatteryAction: ActionSpec = {
  id: 'live_battery',
  label: '배터리 잔량',
  description: '시스템 또는 수동 배터리 잔량을 라이브로 표시합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { source: 'system' },
  schema: [
    {
      key: 'source',
      type: 'select',
      label: '소스',
      required: true,
      options: [
        { value: 'system', label: '시스템 (navigator.getBattery)' },
        { value: 'manual', label: '수동 (직접 입력)' },
      ],
    },
    {
      key: 'manual_level',
      type: 'number',
      label: '수동 값 (0.0 ~ 1.0)',
      min: 0,
      max: 1,
      step: 0.01,
      hint: 'source = manual 일 때만 사용',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (p.source !== 'system' && p.source !== 'manual') errors.push('source 필요');
    return errors;
  },
};

export const P2_ACTIONS: ReadonlyArray<ActionSpec> = [
  liveClockAction,
  liveTimerAction,
  liveGaugeAction,
  liveBatteryAction,
];
