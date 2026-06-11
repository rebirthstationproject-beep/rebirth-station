#!/usr/bin/env node
/**
 * build-pack-claude-code — Claude Code 큐브팩 (자체 설계 1호, 2026-06-11).
 *
 * 구성 (17큐브):
 *  - 세션 제어 단축키 4: Plan Mode(Shift+Tab) · Thinking(Alt+T) · Interrupt(Esc) · Stop(Ctrl+C)
 *  - 커맨드 삽입 9 (text_insert, Enter는 사용자가 — 오발사 방지): /clear /compact /model /resume /cost
 *    continue · git status · git diff · git log
 *  - 앱 실행 1: Windows Terminal
 *  - 링크 3: Claude Docs · Anthropic Console · claude.ai
 * 아이콘: tools/make-claude-pack-icons.py 산출 (_claude-icons/)
 * 팩 아이콘: brand-logos 라이브러리의 Claude 공식 로고
 * 출력: assets/cubepacks-clean/claude-code.cubepack
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.join(HERE, '..');
const JSZip = require(path.join(ROOT, 'apps', 'pc-version', 'frontend', 'node_modules', 'jszip'));

const ICON_DIR = path.join(ROOT, 'assets', 'cubepacks-clean', '_claude-icons');
const PACK_ICON = 'E:\\Claude-Workspace\\shared-assets\\brand-logos\\library\\claude\\app-icon.png';
const OUT = path.join(ROOT, 'assets', 'cubepacks-clean', 'claude-code.cubepack');

// /명령어 타이포 시리즈 (make-claude-pack-icons.py SLASH_SERIES 동기)
const SLASH_SERIES = [
  // 자주 쓰는 기본
  '/clear', '/compact', '/model', '/resume', '/cost', '/init', '/memory', '/agents',
  // 잘 모르는데 유용한 기본
  '/mcp', '/config', '/permissions', '/doctor', '/review', '/rewind', '/context', '/export',
  '/vim', '/hooks', '/statusline', '/add-dir', '/usage', '/todos', '/terminal-setup', '/bug',
  // 워크스페이스 커스텀
  '/plan', '/tdd', '/verify', '/code-review', '/security-review', '/e2e', '/loop', '/schedule', '/learn',
];

// 사고 강화/오케스트레이션 키워드 (프롬프트 텍스트)
const KEYWORDS = ['think', 'think hard', 'ultrathink', 'ultracode'];

const CUBES = [
  // 그림 아이콘 12
  { label: 'Plan Mode', type: 'shortcut', payload: { keys: ['Shift', 'Tab'] } },
  { label: 'Thinking', type: 'shortcut', payload: { keys: ['Alt', 'T'] } },
  { label: 'Interrupt', type: 'shortcut', payload: { keys: ['Esc'] } },
  { label: 'Stop', type: 'shortcut', payload: { keys: ['Ctrl', 'C'] } },
  { label: 'Continue', type: 'text_insert', payload: { text: 'continue' } },
  { label: 'Git Status', type: 'text_insert', payload: { text: 'git status' } },
  { label: 'Git Diff', type: 'text_insert', payload: { text: 'git diff' } },
  { label: 'Git Log', type: 'text_insert', payload: { text: 'git log --oneline -15' } },
  { label: 'Terminal', type: 'app_launch', payload: { path: 'wt.exe', args: [] } },
  { label: 'Claude Docs', type: 'link', payload: { url: 'https://code.claude.com/docs' } },
  { label: 'Console', type: 'link', payload: { url: 'https://console.anthropic.com' } },
  { label: 'Claude AI', type: 'link', payload: { url: 'https://claude.ai' } },
  // /명령어 타이포 (text_insert — Enter는 사용자)
  ...SLASH_SERIES.map((cmd) => ({
    label: cmd,
    type: 'text_insert',
    payload: { text: cmd },
    iconFile: `slash-${cmd.slice(1).replace(/[\\/:*?"<>| ]/g, '_')}.png`,
  })),
  // 사고 키워드 타이포
  ...KEYWORDS.map((kw) => ({
    label: kw,
    type: 'text_insert',
    payload: { text: kw },
    iconFile: `kw-${kw.replace(/[\\/:*?"<>| ]/g, '_')}.png`,
  })),
];

function iconDataUrl(cube) {
  const file = cube.iconFile ?? `${cube.label.replace(/[\\/:*?"<>|]/g, '_')}.png`;
  const f = path.join(ICON_DIR, file);
  if (!fs.existsSync(f)) throw new Error(`아이콘 없음: ${cube.label}`);
  return `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
}

async function buildCubeoneZip(manifest) {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest, null, 1));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const now = new Date().toISOString();
const listZip = new JSZip();
const order = [];
for (const [i, c] of CUBES.entries()) {
  const id = `cc-${String(i + 1).padStart(2, '0')}`;
  const ref = `cubes/${id}.cubeone`;
  listZip.file(ref, await buildCubeoneZip({
    rbs_format_version: 3,
    kind: 'cubeone',
    id,
    license: 'free',
    created_at: now,
    updated_at: now,
    rbs_min_version: '0.1.0',
    cube: {
      label: c.label,
      icon_url: iconDataUrl(c),
      action_type: c.type,
      action_payload: c.payload,
      metadata: { source: 'rebirth-original', icon_source: 'original:claude-code', catalog_version: 'v1' },
      title_style: { show: false },
      sort_order: i + 1,
    },
  }));
  order.push({ ref, sort_order: i + 1 });
}
listZip.file('manifest.json', JSON.stringify({
  rbs_format_version: 3,
  kind: 'cubelist',
  id: 'CLAUDE-CODE-MAIN',
  license: 'free',
  created_at: now,
  updated_at: now,
  rbs_min_version: '0.1.0',
  list: { name: 'Claude Code', sort_order: 1, order, grid_layout: 'cubelist_unlimited', controller_type: 'main' },
}, null, 1));

const packZip = new JSZip();
packZip.file('lists/CLAUDE-CODE-MAIN.cubelist', await listZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
packZip.file('icon.png', fs.readFileSync(PACK_ICON));
packZip.file('manifest.json', JSON.stringify({
  rbs_format_version: 3,
  kind: 'cubepack',
  id: 'rbs.pack.claude-code',
  name: 'Claude Code',
  license: 'free',
  created_at: now,
  updated_at: now,
  rbs_min_version: '0.1.0',
  pack: {
    name: 'Claude Code',
    device_hint: 'cubelist_unlimited',
    cubes_per_page_default: 28,
    icon: 'icon.png',
    lists: [{ ref: 'lists/CLAUDE-CODE-MAIN.cubelist', sort_order: 1, name: 'Claude Code', cube_count: CUBES.length }],
  },
}, null, 1));

fs.writeFileSync(OUT, await packZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`생성: ${OUT} (${CUBES.length}큐브)`);
