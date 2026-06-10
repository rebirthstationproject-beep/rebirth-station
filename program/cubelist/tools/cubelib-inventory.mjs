#!/usr/bin/env node
/**
 * cubelib-inventory — 변환 라이브러리(CUBE) 전수 감사.
 * 폴더별(.cubeone 묶음) 상태를 집계해 1단계(테스트) 우선순위 산출.
 *
 * 사용: node tools/cubelib-inventory.mjs [라이브러리경로] [--json out.json]
 * 기본 경로: %USERPROFILE%\Downloads\플러그인\CUBE
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSZip = require(path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..', 'apps', 'pc-version', 'frontend', 'node_modules', 'jszip',
));

const NATIVE_TYPES = new Set([
  'link', 'shortcut', 'macro', 'folder', 'text_insert', 'clipboard_copy',
  'app_launch', 'focus_window', 'mouse_click',
]);

async function auditCubeone(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const mEntry = zip.file('manifest.json');
  if (!mEntry) return { error: 'manifest 없음' };
  const manifest = JSON.parse(await mEntry.async('text'));
  const cube = manifest.cube ?? {};
  const meta = cube.metadata ?? {};
  const raw = JSON.stringify(manifest).toLowerCase();
  return {
    label: cube.label ?? '(무명)',
    action_type: cube.action_type ?? '(없음)',
    native: NATIVE_TYPES.has(cube.action_type) || String(cube.action_type).startsWith('live_'),
    stub: cube.action_type === 'plugin_action' && !(cube.action_payload?.plugin_dir || cube.action_payload?.plugin_id),
    hasIcon: typeof cube.icon_url === 'string' && cube.icon_url.length > 0
      && meta.icon_is_placeholder !== true && meta.icon_is_tiny !== true,
    residue: (raw.includes('elgato') ? 1 : 0) + (raw.includes('streamdeck') ? 1 : 0)
      + ('streamdeck_meta' in cube ? 1 : 0) + ('sd_uuid' in meta ? 1 : 0),
  };
}

async function main() {
  const argPath = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
  const libDir = argPath ?? path.join(os.homedir(), 'Downloads', '플러그인', 'CUBE');
  const jsonOutIdx = process.argv.indexOf('--json');
  const jsonOut = jsonOutIdx > 0 ? process.argv[jsonOutIdx + 1] : null;

  if (!fs.existsSync(libDir)) { console.error('라이브러리 없음:', libDir); process.exit(2); }

  const folders = fs.readdirSync(libDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);

  const rows = [];
  for (const folder of folders) {
    const dir = path.join(libDir, folder);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.cubeone'));
    if (files.length === 0) continue;
    const stat = { folder, cubes: files.length, native: 0, stub: 0, icon: 0, residue: 0, types: {} };
    for (const f of files) {
      try {
        const a = await auditCubeone(path.join(dir, f));
        if (a.error) continue;
        if (a.native) stat.native += 1;
        if (a.stub) stat.stub += 1;
        if (a.hasIcon) stat.icon += 1;
        stat.residue += a.residue;
        stat.types[a.action_type] = (stat.types[a.action_type] ?? 0) + 1;
      } catch { /* 개별 실패 건너뜀 */ }
    }
    // 준비도: native 비율 60% + 아이콘 비율 40% (스텁은 native에서 이미 제외)
    stat.readiness = Math.round(((stat.native / stat.cubes) * 0.6 + (stat.icon / stat.cubes) * 0.4) * 100);
    rows.push(stat);
  }

  rows.sort((a, b) => b.readiness - a.readiness);
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n변환 라이브러리 전수 감사 — ${libDir}`);
  console.log(pad('폴더', 26) + pad('큐브', 5) + pad('네이티브', 9) + pad('스텁', 5) + pad('아이콘', 7) + pad('잔여', 5) + '준비도');
  for (const r of rows) {
    console.log(pad(r.folder, 26) + pad(r.cubes, 5) + pad(r.native, 9) + pad(r.stub, 5) + pad(r.icon, 7) + pad(r.residue, 5) + r.readiness + '%');
  }
  console.log(`\n총 ${rows.length}개 폴더 / ${rows.reduce((s, r) => s + r.cubes, 0)}개 큐브`);
  console.log('준비도 = 네이티브 액션 60% + 아이콘 임베드 40% (잔여 기록은 별도 클린 단계)');

  if (jsonOut) { fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1), 'utf-8'); console.log('상세:', jsonOut); }
}

main().catch((e) => { console.error('오류:', e.message); process.exit(2); });
