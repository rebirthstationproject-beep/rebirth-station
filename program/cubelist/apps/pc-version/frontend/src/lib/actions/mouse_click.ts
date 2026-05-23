import type { ActionSpec } from './types';

export const mouseClickAction: ActionSpec = {
  id: 'mouse_click',
  label: '마우스 클릭',
  description: '지정 좌표에서 마우스 버튼을 클릭합니다.',
  tier: 2,
  defaultPayload: { x: 0, y: 0, button: 'left', relative: false },
  schema: [
    {
      key: 'x',
      type: 'number',
      label: 'X 좌표',
      required: true,
    },
    {
      key: 'y',
      type: 'number',
      label: 'Y 좌표',
      required: true,
    },
    {
      key: 'button',
      type: 'select',
      label: '버튼',
      options: [
        { value: 'left', label: '왼쪽' },
        { value: 'right', label: '오른쪽' },
        { value: 'middle', label: '가운데' },
      ],
    },
    {
      key: 'relative',
      type: 'checkbox',
      label: '현재 마우스 위치 기준 (상대)',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (typeof p.x !== 'number') errors.push('X 좌표 숫자 필수');
    if (typeof p.y !== 'number') errors.push('Y 좌표 숫자 필수');
    const btn = typeof p.button === 'string' ? p.button : '';
    if (!['left', 'right', 'middle'].includes(btn)) errors.push('button = left/right/middle');
    return errors;
  },
};
