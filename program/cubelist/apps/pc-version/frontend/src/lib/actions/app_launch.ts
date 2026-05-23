import type { ActionSpec } from './types';

export const appLaunchAction: ActionSpec = {
  id: 'app_launch',
  label: '앱 실행',
  description: '지정 경로의 앱·실행파일을 실행합니다 (경로 화이트리스트 검증).',
  tier: 2,
  defaultPayload: { path: '' },
  schema: [
    {
      key: 'path',
      type: 'text',
      label: '실행 경로',
      placeholder: 'C:\\Program Files\\App\\app.exe',
      required: true,
      hint: 'Tier 2: 1회 동의 prompt 필요',
    },
    {
      key: 'args',
      type: 'string-list',
      label: '인자 (선택)',
      placeholder: '--minimized, /silent',
      hint: '쉼표로 구분',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    const path = typeof p.path === 'string' ? p.path.trim() : '';
    if (path.length === 0) errors.push('실행 경로 필수');
    return errors;
  },
};
