import type { ActionSpec } from './types';

export const linkAction: ActionSpec = {
  id: 'link',
  label: '링크 열기',
  description: '기본 브라우저에서 URL 을 엽니다.',
  tier: 1,
  category: '웹',
  defaultPayload: { url: '' },
  schema: [
    {
      key: 'url',
      type: 'url',
      label: 'URL',
      placeholder: 'https://www.anthropic.com',
      required: true,
      hint: 'http(s)://, mailto:, tel: 가능',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    const url = typeof p.url === 'string' ? p.url.trim() : '';
    if (url.length === 0) errors.push('URL 필수');
    return errors;
  },
};
