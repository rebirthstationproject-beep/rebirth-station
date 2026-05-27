/**
 * 개발용 데모 큐브팩 — M2 셸 검증용.
 *
 * 실제 .cubepack 파일 I/O 는 M2 후반 cubepack-io 모듈에서 구현.
 * 본 시드는 빈 상태로 UI 검증이 어렵기 때문에 임시 제공.
 *
 * 향후 실 파일 로드 함수 추가 시 본 모듈은 폐기 또는 "샘플 큐브팩 만들기" 버튼으로 격하.
 */

import type { CubePack } from '../types/cube';

/** SVG data URL 생성 (글자 + 배경색 큐브 아이콘) */
function svgIcon(letter: string, bg: string, fg: string = 'white'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${bg}"/><text x="32" y="44" font-size="32" font-family="sans-serif" font-weight="700" fill="${fg}" text-anchor="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildDemoPack(): CubePack {
  return {
    id: 'demo-pack-1',
    name: '데모 큐브팩',
    category: '생산성',
    cubes: [
      { id: 'lib-1', sort_order: 0, label: 'Anthropic', icon_url: svgIcon('A', '#d97706'), action_type: 'link', action_payload: { url: 'https://www.anthropic.com' } },
      { id: 'lib-2', sort_order: 0, label: 'GitHub', icon_url: svgIcon('G', '#24292e'), action_type: 'link', action_payload: { url: 'https://github.com' } },
      { id: 'lib-3', sort_order: 0, label: 'YouTube', icon_url: svgIcon('Y', '#cc0000'), action_type: 'link', action_payload: { url: 'https://youtube.com' } },
      { id: 'lib-4', sort_order: 0, label: '복사', icon_url: svgIcon('C', '#3a7a3a'), action_type: 'shortcut', action_payload: { keys: ['Ctrl', 'C'] } },
      { id: 'lib-5', sort_order: 0, label: '붙여넣기', icon_url: svgIcon('V', '#3a5a7a'), action_type: 'shortcut', action_payload: { keys: ['Ctrl', 'V'] } },
      { id: 'lib-6', sort_order: 0, label: '재생/정지', icon_url: svgIcon('▶', '#5a3a7a'), action_type: 'shortcut', action_payload: { keys: ['MediaPlayPause'] } },
    ],
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
            icon_url: svgIcon('A', '#d97706'),
            action_type: 'link',
            action_payload: { url: 'https://www.anthropic.com' },
          },
          {
            id: 'cube-2',
            sort_order: 2,
            label: 'GitHub',
            icon_url: svgIcon('G', '#24292e'),
            action_type: 'link',
            action_payload: { url: 'https://github.com' },
          },
          {
            id: 'cube-3',
            sort_order: 3,
            label: '복사',
            icon_url: svgIcon('C', '#3a7a3a'),
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
            icon_url: svgIcon('▶', '#5a3a7a'),
            action_type: 'shortcut',
            action_payload: { keys: ['MediaPlayPause'] },
          },
        ],
      },
    ],
  };
}
