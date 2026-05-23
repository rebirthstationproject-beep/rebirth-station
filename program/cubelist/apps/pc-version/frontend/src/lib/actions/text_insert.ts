import type { ActionSpec } from './types';

export const textInsertAction: ActionSpec = {
  id: 'text_insert',
  label: '텍스트 삽입',
  description: '현재 포커스된 입력 필드에 텍스트를 타이핑 입력합니다.',
  tier: 1,
  defaultPayload: { text: '' },
  schema: [
    {
      key: 'text',
      type: 'textarea',
      label: '삽입할 텍스트',
      placeholder: '서명·자주 쓰는 문구 등',
      required: true,
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.text !== 'string' || p.text.length === 0) errors.push('text 필수');
    return errors;
  },
};
