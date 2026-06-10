/**
 * 마켓플레이스 mock 데이터 (v0.1.3 사전, 2026-05-31).
 *
 * v0.1.4+ 진입 시 서버 fetch 로 대체. 현재 카탈로그 + 상세 페이지 공유.
 */

import type { MarketplaceMeta } from '../types/marketplace';
import type { DeviceHint } from '../types/cube';

export interface MockPackPreviewCube {
  readonly label: string;
  readonly icon_color: string; // 미리보기용 단색 (실 cube 변환 시 icon_url)
  readonly action_label?: string; // 예: 'shortcut', 'media_key'
}

export interface MockPack {
  readonly id: string;
  readonly name: string;
  readonly meta: MarketplaceMeta;
  readonly cube_count: number;
  readonly list_count: number;
  readonly device_hint?: DeviceHint;
  /** 디바이스 그리드 미리보기용 큐브들 (사용자가 보는 sample) */
  readonly preview_cubes: ReadonlyArray<MockPackPreviewCube>;
  /**
   * 다운로드 URL (P1-B2, 2026-06-01).
   * 무료 큐브팩: 즉시 다운로드 페이지로 이동
   * 유료 큐브팩: 결제 후 redirect URL (v0.1.4 결제 완료 후 활성)
   * 우리 사이트(rebirthstation.com) 의 다운로드 라우트로 연결 — 사이트 셋업 후 활성.
   */
  readonly download_url?: string;
}

/** P1-B2: 우리 사이트의 큐브팩 다운로드 베이스 URL (placeholder — 사이트 셋업 후 갱신) */
const DOWNLOAD_BASE_URL = 'https://rebirthstation.com/cubelist/download';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
function paletteColor(idx: number): string {
  return PALETTE[idx % PALETTE.length];
}

function genPreviewCubes(count: number, labels: string[]): MockPackPreviewCube[] {
  const out: MockPackPreviewCube[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      label: labels[i] ?? `Cube ${i + 1}`,
      icon_color: paletteColor(i),
      action_label: i % 3 === 0 ? 'shortcut' : i % 3 === 1 ? 'media_key' : 'app_launch',
    });
  }
  return out;
}

export const MOCK_PACKS: ReadonlyArray<MockPack> = [
  {
    id: 'pack-obs-streamer',
    name: 'OBS Streamer Essentials',
    meta: {
      platform: 'obs',
      price_cents: 0,
      author: { name: 'Rebirth Station' },
      version: '1.0.0',
      tags: ['streaming', 'obs', 'productivity'],
      rating: { avg: 4.8, count: 142 },
      long_description: 'OBS Studio 스트리밍 필수 큐브 32개. Scene 전환, 마이크 토글, 녹화 시작/정지, Stream 시작/정지 등 자주 쓰는 단축키를 한 번에 설정합니다.',
      payment_type: 'one_time',
    },
    cube_count: 32,
    list_count: 4,
    device_hint: 'streamdeck_xl',
    preview_cubes: genPreviewCubes(32, [
      'Scene 1', 'Scene 2', 'Scene 3', 'Mic', 'REC', 'Pause', 'Stop', 'Stream',
      'BRB', 'Intro', 'Outro', 'Game', 'Cam', 'Chat', 'Alert', 'Donate',
      'Music', 'Volume+', 'Volume-', 'Mute', 'Replay', 'Highlight', 'Clip', 'Save',
      'TTS', 'Bot', 'Discord', 'Twitch', 'YouTube', 'Spotify', 'OBS', 'Stats',
    ]),
    download_url: `${DOWNLOAD_BASE_URL}/obs-streamer-essentials`,
  },
  {
    id: 'pack-vscode-dev',
    name: 'VS Code Power Dev',
    meta: {
      platform: 'vscode',
      price_cents: 999,
      author: { name: 'DevTools Inc.' },
      version: '0.3.2',
      tags: ['development', 'shortcuts', 'git'],
      rating: { avg: 4.6, count: 89 },
      long_description: 'VS Code 단축키 + Git 명령 60+ 큐브. Quick Open, Command Palette, Git Status, Push, Pull, Branch 등 개발자가 매일 쓰는 단축키 통합.',
      payment_type: 'one_time',
    },
    cube_count: 62,
    list_count: 6,
    device_hint: 'streamdeck_xl',
    preview_cubes: genPreviewCubes(32, [
      'Quick Open', 'Cmd Palette', 'Term', 'Files', 'Search', 'Git', 'Run', 'Debug',
      'Save', 'Save All', 'Format', 'Refactor', 'Rename', 'Find Ref', 'Go to Def', 'Go Back',
      'Push', 'Pull', 'Commit', 'Branch', 'Diff', 'Stash', 'Merge', 'Rebase',
      'Test', 'Build', 'Deploy', 'Lint', 'Type Check', 'Coverage', 'Profile', 'Logs',
    ]),
    download_url: `${DOWNLOAD_BASE_URL}/vscode-power-dev`,
  },
  {
    id: 'pack-figma-design',
    name: 'Figma Designer Kit',
    meta: {
      platform: 'figma',
      price_cents: 1499,
      author: { name: 'DesignFlow' },
      version: '2.1.0',
      tags: ['design', 'figma', 'ui-ux'],
      rating: { avg: 4.9, count: 256 },
      long_description: 'Figma 작업 가속화 큐브팩. Frame 생성, Component 변환, Auto Layout, Variants, Boolean 연산 등 디자이너 자주 쓰는 액션 모음.',
      payment_type: 'one_time',
    },
    cube_count: 48,
    list_count: 5,
    device_hint: 'streamdeck_plus',
    preview_cubes: genPreviewCubes(16, [
      'Frame', 'Group', 'Comp', 'Variant', 'A/L', 'Bool', 'Mask', 'Constraint',
      'Style', 'Effect', 'Export', 'Plugin', 'Comment', 'Share', 'Inspect', 'Prototype',
    ]),
    download_url: `${DOWNLOAD_BASE_URL}/figma-designer-kit`,
  },
  {
    id: 'pack-discord-mod',
    name: 'Discord Moderator',
    meta: {
      platform: 'discord',
      price_cents: 0,
      author: { name: 'Community Mods' },
      version: '1.2.0',
      tags: ['discord', 'moderation', 'community'],
      rating: { avg: 4.4, count: 67 },
      long_description: 'Discord 서버 운영 단축키 모음. Mute/Kick/Ban/Move/Timeout/Roles 등 모더레이터 필수 기능.',
    },
    cube_count: 24,
    list_count: 3,
    device_hint: 'streamdeck_standard',
    preview_cubes: genPreviewCubes(15, [
      'Mute', 'Deaf', 'Kick', 'Ban', 'Move', 'Timeout', 'Role', 'Warn',
      'Mod Log', 'Slow', 'Lock', 'Pin', 'Delete', 'Report', 'Help',
    ]),
    download_url: `${DOWNLOAD_BASE_URL}/discord-moderator`,
  },
  {
    id: 'pack-photoshop-retouch',
    name: 'Photoshop Retoucher Pro',
    meta: {
      platform: 'photoshop',
      price_cents: 2499,
      author: { name: 'RetouchMaster' },
      version: '3.0.1',
      tags: ['photoshop', 'retouch', 'adobe'],
      rating: { avg: 4.7, count: 178 },
      long_description: '리터칭 전문가용 단축키 + 액션 큐브. Frequency Separation, Dodge & Burn, Color Grading, Skin Retouch 등.',
      payment_type: 'one_time',
    },
    cube_count: 80,
    list_count: 8,
    device_hint: 'streamdeck_xl',
    preview_cubes: genPreviewCubes(32, [
      'Brush', 'Eraser', 'Heal', 'Patch', 'Clone', 'Spot', 'Dodge', 'Burn',
      'Sat+', 'Sat-', 'Curves', 'Levels', 'HSL', 'C/B', 'Sharpen', 'Blur',
      'Mask', 'Select', 'Lasso', 'Magic', 'Refine', 'Quick', 'Color Range', 'Subject',
      'FreqSep', 'D&B', 'Color Grade', 'Skin', 'Eyes', 'Teeth', 'Hair', 'Bg',
    ]),
    download_url: `${DOWNLOAD_BASE_URL}/photoshop-retoucher-pro`,
  },
  {
    id: 'pack-twitch-streamer',
    name: 'Twitch Streamer All-in-One',
    meta: {
      platform: 'twitch',
      price_cents: 499,
      author: { name: 'StreamPro' },
      version: '1.5.0',
      tags: ['twitch', 'streaming', 'live'],
      rating: { avg: 4.5, count: 113 },
      long_description: '트위치 스트리밍 통합 큐브팩 (월간 구독). Chat 명령, Alert, Highlight, Clip, Stream Title/Category 변경 등.',
      payment_type: 'subscription_monthly',
    },
    cube_count: 56,
    list_count: 7,
    device_hint: 'streamdeck_plus',
    preview_cubes: genPreviewCubes(16, [
      'Go Live', 'End', 'Title', 'Cat', 'Tags', 'Mods', 'Alerts', 'Bots',
      'Clip', 'Highlight', 'Marker', 'Pause', 'Music', 'Chat', 'Polls', 'Pred',
    ]),
    download_url: `${DOWNLOAD_BASE_URL}/twitch-streamer-all-in-one`,
  },
];

/** 디바이스별 기본 grid (cols × rows) */
export function deviceGrid(hint?: DeviceHint): { cols: number; rows: number; label: string } {
  switch (hint) {
    case 'streamdeck_mini':
      return { cols: 3, rows: 2, label: 'Stream Deck Mini (6 키)' };
    case 'streamdeck_standard':
    case 'streamdeck_mk2':
      return { cols: 5, rows: 3, label: 'Stream Deck (15 키)' };
    case 'streamdeck_xl':
      return { cols: 8, rows: 4, label: 'Stream Deck XL (32 키)' };
    case 'streamdeck_plus':
      return { cols: 4, rows: 2, label: 'Stream Deck + (8 키 + 4 인코더)' };
    case 'streamdeck_neo':
      return { cols: 4, rows: 2, label: 'Stream Deck Neo (8 키)' };
    case 'cubelist_unlimited':
      return { cols: 4, rows: 7, label: '큐브 무제한 (페이지·폴더 확장)' };
    default:
      return { cols: 4, rows: 4, label: '큐브 (기본 4×4)' };
  }
}
