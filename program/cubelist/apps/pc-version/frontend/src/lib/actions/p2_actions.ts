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
  label: '시계 (디지털/아날로그)',
  description: '현재 시각을 라이브로 표시합니다. 디지털 시:분:초 또는 아날로그 SVG 시계.',
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
        { value: 'analog', label: '아날로그 시계 (SVG 1초 갱신)' },
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
  description: '값/최소/최대 로 정의된 게이지를 색상 바와 함께 표시합니다. source=cpu|ram|disk 시 실측값 자동 사용.',
  tier: 1,
  category: '시스템',
  defaultPayload: { source: 'cpu', value: 0, min: 0, max: 100, unit: '%', label_prefix: '' },
  schema: [
    {
      key: 'source',
      type: 'select',
      label: '데이터 소스',
      options: [
        { value: 'cpu', label: 'CPU 사용률 (실측)' },
        { value: 'ram', label: 'RAM 사용률 (실측)' },
        { value: 'disk', label: 'Disk 사용률 (실측)' },
        { value: 'manual', label: '수동 (직접 입력)' },
      ],
    },
    { key: 'value', type: 'number', label: '현재 값 (manual 시)', min: 0, max: 100 },
    { key: 'min', type: 'number', label: '최소 (manual 시)' },
    { key: 'max', type: 'number', label: '최대 (manual 시)' },
    { key: 'unit', type: 'text', label: '단위', placeholder: '%, °C, MB' },
    { key: 'label_prefix', type: 'text', label: '라벨 prefix', placeholder: 'CPU' },
  ],
  validatePayload(_p) {
    return [];
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

export const liveWeatherAction: ActionSpec = {
  id: 'live_weather',
  label: '날씨 (Open-Meteo)',
  description: '좌표 기반 실시간 날씨를 표시합니다 (무료·키 불필요). 10분 캐시.',
  tier: 1,
  category: '시스템',
  defaultPayload: { latitude: 37.5665, longitude: 126.978, location_label: '서울' },
  schema: [
    { key: 'latitude', type: 'number', label: '위도 (latitude)', required: true },
    { key: 'longitude', type: 'number', label: '경도 (longitude)', required: true },
    { key: 'location_label', type: 'text', label: '위치 이름 (표시용)', placeholder: '서울' },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.latitude !== 'number') errors.push('위도 필요');
    if (typeof p.longitude !== 'number') errors.push('경도 필요');
    return errors;
  },
};

export const liveMonitorAction: ActionSpec = {
  id: 'live_monitor',
  label: '시스템 모니터',
  description: 'CPU / RAM / Disk / Network 실측값을 바 게이지로 표시합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { source: 'cpu' },
  schema: [
    {
      key: 'source',
      type: 'select',
      label: '소스',
      required: true,
      options: [
        { value: 'cpu', label: 'CPU 사용률' },
        { value: 'ram', label: 'RAM 사용률' },
        { value: 'disk', label: 'Disk 사용률' },
        { value: 'network', label: '네트워크 수신 속도' },
      ],
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (!['cpu', 'ram', 'disk', 'network'].includes(p.source as string)) errors.push('소스 필요');
    return errors;
  },
};

export const liveNetworkAction: ActionSpec = {
  id: 'live_network',
  label: '네트워크 속도',
  description: '네트워크 수신 속도를 Wi-Fi 신호 강도 형태로 표시합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const liveStockAction: ActionSpec = {
  id: 'live_stock',
  label: '주가 / 환율 (수동)',
  description: '주가·환율·코인 수치를 표시합니다. 데이터 소스 미정 — 수동 입력만 지원.',
  tier: 1,
  category: '시스템',
  defaultPayload: { symbol: '', price: 0, change_pct: 0 },
  schema: [
    { key: 'symbol', type: 'text', label: '티커 / 심볼', placeholder: 'BTC, AAPL, USD' },
    { key: 'price', type: 'number', label: '현재가 (수동)' },
    { key: 'change_pct', type: 'number', label: '변동률 % (수동)' },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.symbol !== 'string' || (p.symbol as string).length === 0) errors.push('심볼 필요');
    return errors;
  },
};

export const liveCalendarAction: ActionSpec = {
  id: 'live_calendar',
  label: '캘린더 일정',
  description: '다음 일정을 표시합니다. 데이터 소스 미결정 — 인스펙터에서 설정 필요.',
  tier: 1,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const liveNewsAction: ActionSpec = {
  id: 'live_news',
  label: '뉴스 헤드라인',
  description: 'RSS/API 뉴스 헤드라인을 표시합니다. 데이터 소스 미결정 — 인스펙터에서 설정 필요.',
  tier: 1,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const P2_ACTIONS: ReadonlyArray<ActionSpec> = [
  liveClockAction,
  liveTimerAction,
  liveGaugeAction,
  liveBatteryAction,
  liveWeatherAction,
  liveMonitorAction,
  liveNetworkAction,
  liveStockAction,
  liveCalendarAction,
  liveNewsAction,
];
