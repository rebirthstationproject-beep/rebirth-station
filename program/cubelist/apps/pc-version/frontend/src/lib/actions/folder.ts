import type { ActionSpec } from './types';

/**
 * 폴더(서브덱) — 클릭 시 다른 큐브 모음 표시.
 * M7 에서 전용 큐브 선택기 UI 도입 예정. 본 M3 단계는 string-list 로 ID 입력.
 */
export const folderAction: ActionSpec = {
  id: 'folder',
  label: '폴더 (서브덱)',
  description: '클릭 시 하위 큐브들을 표시 (Stream Deck 폴더 등가).',
  tier: 1,
  defaultPayload: { cube_ids: [] },
  schema: [
    {
      key: 'cube_ids',
      type: 'string-list',
      label: '큐브 ID 목록',
      hint: 'M7 에서 비주얼 큐브 선택기로 대체. 현재는 ID 쉼표 구분 입력',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    if (!Array.isArray(p.cube_ids)) errors.push('cube_ids 배열 필수');
    return errors;
  },
};
