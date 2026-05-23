import type { ActionSpec } from './types';

export const shortcutAction: ActionSpec = {
  id: 'shortcut',
  label: '단축키',
  description: '키 조합을 PC 에 입력합니다 (Ctrl+C 등).',
  tier: 2,
  defaultPayload: { keys: [] },
  schema: [
    {
      key: 'keys',
      type: 'string-list',
      label: '키 시퀀스',
      placeholder: 'Ctrl, Shift, C',
      hint: '쉼표로 구분. 예: Ctrl, C / Alt, Tab / MediaPlayPause',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (!Array.isArray(p.keys) || p.keys.length === 0) {
      errors.push('키 1개 이상 필수');
    }
    return errors;
  },
};
