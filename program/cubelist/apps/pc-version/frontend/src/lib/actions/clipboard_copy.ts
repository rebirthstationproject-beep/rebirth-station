import type { ActionSpec } from './types';

export const clipboardCopyAction: ActionSpec = {
  id: 'clipboard_copy',
  label: '클립보드 복사',
  description: '지정 텍스트를 클립보드에 복사합니다 (입력 X).',
  tier: 1,
  defaultPayload: { text: '' },
  schema: [
    {
      key: 'text',
      type: 'textarea',
      label: '복사할 텍스트',
      required: true,
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.text !== 'string') errors.push('text 문자열 필수');
    return errors;
  },
};
