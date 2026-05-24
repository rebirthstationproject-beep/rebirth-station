/**
 * 개발용 데모 큐브팩 — M2 셸 검증용.
 *
 * 실제 .cubepack 파일 I/O 는 M2 후반 cubepack-io 모듈에서 구현.
 * 본 시드는 빈 상태로 UI 검증이 어렵기 때문에 임시 제공.
 *
 * 향후 실 파일 로드 함수 추가 시 본 모듈은 폐기 또는 "샘플 큐브팩 만들기" 버튼으로 격하.
 */

import type { CubePack } from '../types/cube';

export function buildDemoPack(): CubePack {
  return {
    id: 'demo-pack-1',
    name: '데모 큐브팩',
    category: '생산성',
    lists: [
      {
        id: 'list-1',
        name: '기본',
        sort_order: 1,
        cols: 4,
        cubes_per_page: 28,
        cubes: [
          {
            id: 'cube-1',
            sort_order: 1,
            label: 'Anthropic',
            icon_url: null,
            action_type: 'link',
            action_payload: { url: 'https://www.anthropic.com' },
          },
          {
            id: 'cube-2',
            sort_order: 2,
            label: 'GitHub',
            icon_url: null,
            action_type: 'link',
            action_payload: { url: 'https://github.com' },
          },
          {
            id: 'cube-3',
            sort_order: 3,
            label: '복사',
            icon_url: null,
            action_type: 'shortcut',
            action_payload: { keys: ['Ctrl', 'C'] },
          },
        ],
      },
      {
        id: 'list-2',
        name: '미디어',
        sort_order: 2,
        cols: 4,
        cubes_per_page: 28,
        cubes: [
          {
            id: 'cube-4',
            sort_order: 1,
            label: '재생/정지',
            icon_url: null,
            action_type: 'shortcut',
            action_payload: { keys: ['MediaPlayPause'] },
          },
        ],
      },
    ],
  };
}
