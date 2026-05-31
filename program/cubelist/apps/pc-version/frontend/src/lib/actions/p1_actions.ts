/**
 * P1 11 신규 액션 (Phase 3, 2026-05-31) — 스트림덱 100% 호환 보강.
 *
 * 매핑 (streamdeck-compat.md 참조):
 *  - media_key            → com.elgato.streamdeck.system.multimedia
 *  - page_navigate        → com.elgato.streamdeck.system.pagination
 *  - page_jump            → com.elgato.streamdeck.page (특정 페이지 점프)
 *  - folder_up            → com.elgato.streamdeck.profile.backtoparent
 *  - folder_open          → com.elgato.streamdeck.profile.openchild
 *  - window_close         → com.elgato.streamdeck.system.close
 *  - system_sleep         → com.elgato.streamdeck.system.sleep
 *  - system_actionbar_toggle → com.elgato.streamdeck.system.actionbar
 *  - hotkey_toggle        → com.elgato.streamdeck.system.hotkeyswitch
 *  - audio_play           → com.elgato.streamdeck.soundboard
 *  - profile_rotate       → com.elgato.streamdeck.profile.rotate
 */

import type { ActionSpec } from './types';

export const mediaKeyAction: ActionSpec = {
  id: 'media_key',
  label: '미디어 키',
  description: '미디어 키 (재생/정지/다음/이전/볼륨) 를 누릅니다.',
  tier: 1,
  category: '미디어',
  defaultPayload: { key: 'play_pause' },
  schema: [
    {
      key: 'key',
      type: 'select',
      label: '미디어 키',
      required: true,
      options: [
        { value: 'play_pause', label: '재생/일시정지' },
        { value: 'next', label: '다음 트랙' },
        { value: 'prev', label: '이전 트랙' },
        { value: 'stop', label: '정지' },
        { value: 'volume_up', label: '볼륨 올리기' },
        { value: 'volume_down', label: '볼륨 내리기' },
        { value: 'mute', label: '음소거 토글' },
      ],
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.key !== 'string' || p.key.length === 0) errors.push('미디어 키 필수');
    return errors;
  },
};

export const pageNavigateAction: ActionSpec = {
  id: 'page_navigate',
  label: '페이지 이동',
  description: '큐브 리스트의 이전/다음 페이지로 이동합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { direction: 'next' },
  schema: [
    {
      key: 'direction',
      type: 'select',
      label: '방향',
      required: true,
      options: [
        { value: 'next', label: '다음 페이지' },
        { value: 'prev', label: '이전 페이지' },
      ],
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (p.direction !== 'next' && p.direction !== 'prev') errors.push('next 또는 prev 필요');
    return errors;
  },
};

export const pageJumpAction: ActionSpec = {
  id: 'page_jump',
  label: '특정 페이지로 점프',
  description: '큐브 리스트의 지정 페이지로 바로 점프합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { page_index: 0 },
  schema: [
    {
      key: 'page_index',
      type: 'number',
      label: '페이지 번호 (0부터)',
      required: true,
      min: 0,
      max: 99,
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.page_index !== 'number' || p.page_index < 0) errors.push('0 이상 페이지 번호 필요');
    return errors;
  },
};

export const folderUpAction: ActionSpec = {
  id: 'folder_up',
  label: '상위 폴더로',
  description: '현재 폴더에서 상위 폴더로 나갑니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const folderOpenAction: ActionSpec = {
  id: 'folder_open',
  label: '폴더 진입',
  description: '지정 폴더로 진입합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { folder_id: '' },
  schema: [
    {
      key: 'folder_id',
      type: 'text',
      label: '폴더 ID',
      required: true,
      placeholder: 'UUID',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.folder_id !== 'string' || p.folder_id.length === 0) errors.push('폴더 ID 필수');
    return errors;
  },
};

export const windowCloseAction: ActionSpec = {
  id: 'window_close',
  label: '활성 창 닫기',
  description: '현재 활성 창을 닫습니다 (Alt+F4 매핑).',
  tier: 2,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const systemSleepAction: ActionSpec = {
  id: 'system_sleep',
  label: '시스템 절전',
  description: '시스템을 절전 모드로 전환합니다. 사용 시 주의.',
  tier: 3,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const systemActionbarToggleAction: ActionSpec = {
  id: 'system_actionbar_toggle',
  label: '시스템 액션바 토글',
  description: '시스템 액션바 (작업 표시줄) 표시를 토글합니다.',
  tier: 2,
  category: '시스템',
  defaultPayload: {},
  schema: [],
  validatePayload() {
    return [];
  },
};

export const hotkeyToggleAction: ActionSpec = {
  id: 'hotkey_toggle',
  label: '토글 단축키',
  description: 'on/off 두 상태가 있는 토글형 단축키 (states 의존).',
  tier: 2,
  category: '시스템',
  defaultPayload: { on_keys: [], off_keys: [] },
  schema: [
    {
      key: 'on_keys',
      type: 'string-list',
      label: 'ON 키 조합',
      placeholder: 'Ctrl+Shift+A',
      hint: 'state[0]=on 시 누를 키',
    },
    {
      key: 'off_keys',
      type: 'string-list',
      label: 'OFF 키 조합',
      placeholder: 'Ctrl+Shift+B',
      hint: 'state[1]=off 시 누를 키',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (!Array.isArray(p.on_keys) || p.on_keys.length === 0) errors.push('ON 키 1개 이상 필요');
    if (!Array.isArray(p.off_keys) || p.off_keys.length === 0) errors.push('OFF 키 1개 이상 필요');
    return errors;
  },
};

export const audioPlayAction: ActionSpec = {
  id: 'audio_play',
  label: '오디오 재생',
  description: '오디오 클립 (sound file) 을 재생합니다.',
  tier: 1,
  category: '미디어',
  defaultPayload: { audio_url: '', volume: 1.0, loop: false },
  schema: [
    {
      key: 'audio_url',
      type: 'text',
      label: '오디오 URL 또는 경로',
      required: true,
      placeholder: 'file:// 또는 data: URL',
    },
    {
      key: 'volume',
      type: 'number',
      label: '볼륨 (0.0 ~ 1.0)',
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      key: 'loop',
      type: 'checkbox',
      label: '반복 재생',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.audio_url !== 'string' || p.audio_url.length === 0) errors.push('오디오 URL 필수');
    return errors;
  },
};

export const profileRotateAction: ActionSpec = {
  id: 'profile_rotate',
  label: '큐브 리스트 회전',
  description: '다른 큐브 리스트(탭) 로 회전 전환합니다.',
  tier: 1,
  category: '시스템',
  defaultPayload: { direction: 'next' },
  schema: [
    {
      key: 'direction',
      type: 'select',
      label: '방향',
      required: true,
      options: [
        { value: 'next', label: '다음 리스트' },
        { value: 'prev', label: '이전 리스트' },
      ],
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (p.direction !== 'next' && p.direction !== 'prev') errors.push('next 또는 prev 필요');
    return errors;
  },
};

export const P1_ACTIONS: ReadonlyArray<ActionSpec> = [
  mediaKeyAction,
  pageNavigateAction,
  pageJumpAction,
  folderUpAction,
  folderOpenAction,
  windowCloseAction,
  systemSleepAction,
  systemActionbarToggleAction,
  hotkeyToggleAction,
  audioPlayAction,
  profileRotateAction,
];
