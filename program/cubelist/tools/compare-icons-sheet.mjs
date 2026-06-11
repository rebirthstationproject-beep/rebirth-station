#!/usr/bin/env node
/** v2 원본(Elgato 아이콘팩 PNG) vs 자체 SVG 카탈로그 — 같은 라벨 나란히 비교 시트. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.join(HERE, '..');
const NM = path.join(ROOT, 'apps', 'pc-version', 'frontend', 'node_modules');
const JSZip = require(path.join(NM, 'jszip'));
const esbuild = require(path.join(NM, 'esbuild'));

const SRC_DIR = path.join(os.homedir(), 'Downloads', '플러그인', 'CUBE', 'Adobe Photoshop v2');
const OUT = path.join(ROOT, 'assets', 'cubepacks-clean', '_compare-v2-vs-catalog.html');

const ts = fs.readFileSync(path.join(ROOT, 'apps', 'pc-version', 'frontend', 'src', 'lib', 'icon-catalog-photoshop.ts'), 'utf-8');
const { code } = esbuild.transformSync(ts, { loader: 'ts', format: 'esm' });
const tmp = path.join(os.tmpdir(), `ps-cat-${process.pid}.mjs`);
fs.writeFileSync(tmp, code);
const { findPhotoshopIcon } = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

const rows = [];
for (const f of fs.readdirSync(SRC_DIR).filter((x) => x.endsWith('.cubeone')).sort()) {
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(SRC_DIR, f)));
  const m = JSON.parse(await zip.file('manifest.json').async('text'));
  const cube = m.cube ?? {};
  if (cube.action_type !== 'shortcut') continue;
  const svg = findPhotoshopIcon(cube.label ?? '');
  rows.push({
    label: cube.label,
    v2: cube.icon_url,
    mine: svg ? `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` : null,
  });
}

const cells = rows.map((r) =>
  `<div class="pair"><div class="icons">` +
  `<div class="icon" style="background-image:url('${r.v2}')"></div>` +
  (r.mine ? `<div class="icon" style="background-image:url('${r.mine}')"></div>` : '<div class="icon miss">없음</div>') +
  `</div><div class="lbl">${r.label}</div></div>`,
).join('');

fs.writeFileSync(OUT, `<!doctype html><meta charset="utf-8"><style>
body{background:#111;color:#ddd;font:11px Consolas,monospace;margin:16px}
h3{font-size:13px} .note{color:#888;margin-bottom:12px}
.grid{display:grid;grid-template-columns:repeat(2,300px);gap:14px}
.pair{width:300px}
.icons{display:flex;gap:4px}
.icon{width:140px;height:140px;border-radius:10px;background-color:#0d0d0d;background-size:100% 100%;background-position:center;background-repeat:no-repeat;border:1px solid #2a2a2a}
.miss{display:flex;align-items:center;justify-content:center;color:#666}
.lbl{margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;color:#31a8ff;font-family:Bahnschrift,sans-serif}
</style><h3>Photoshop 아이콘 비교 — 좌: v2 원본(Elgato 팩) / 우: 자체 SVG 카탈로그</h3><div class="note">${rows.length} 쌍</div><div class="grid">${cells}</div>`, 'utf-8');
console.log('생성:', OUT, `(${rows.length}쌍)`);
