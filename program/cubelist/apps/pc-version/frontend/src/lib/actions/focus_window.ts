import type { ActionSpec } from './types';

export const focusWindowAction: ActionSpec = {
  id: 'focus_window',
  label: '창 포커스',
  description: '제목 패턴이 일치하는 창을 전경으로 가져옵니다.',
  tier: 2,
  defaultPayload: { title_pattern: '' },
  schema: [
    {
      key: 'title_pattern',
      type: 'text',
      label: '제목 패턴',
      placeholder: '* - Visual Studio Code',
      required: true,
      hint: '* 는 와일드카드',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    const pat = typeof p.title_pattern === 'string' ? p.title_pattern.trim() : '';
    if (pat.length === 0) errors.push('제목 패턴 필수');
    return errors;
  },
};
