import type { ActionSpec } from './types';

/**
 * 매크로 = MacroStep 시퀀스.
 * M3 = json 필드로 raw 편집, M4 또는 후속에서 전용 MacroEditor (모바일 PWA 참고).
 */
export const macroAction: ActionSpec = {
  id: 'macro',
  label: '매크로',
  description: '여러 단계 (키/지연/마우스/앱 실행 등) 의 시퀀스를 실행합니다.',
  tier: 2,
  category: '시스템',
  defaultPayload: { steps: [] },
  schema: [
    {
      key: 'steps',
      type: 'json',
      label: 'steps (JSON)',
      hint: '[{"type":"key","keys":["Ctrl","C"]},{"type":"delay","ms":100}] — M4 에서 전용 에디터 도입',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (!Array.isArray(p.steps)) errors.push('steps 배열 필수');
    return errors;
  },
};
