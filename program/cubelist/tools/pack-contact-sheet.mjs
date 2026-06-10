#!/usr/bin/env node
/** 클린 팩 전 큐브 아이콘 콘택트 시트 HTML 생성 (시각 검증용). */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const JSZip = require(path.join(HERE, '..', 'apps', 'pc-version', 'frontend', 'node_modules', 'jszip'));

const packFile = process.argv[2] ?? path.join(HERE, '..', 'assets', 'cubepacks-clean', 'adobe-photoshop.cubepack');
const outFile = process.argv[3] ?? path.join(HERE, '..', 'assets', 'cubepacks-clean', '_contact-sheet.html');

const packZip = await JSZip.loadAsync(fs.readFileSync(packFile));
const pm = JSON.parse(await packZip.file('manifest.json').async('text'));
const cells = [];
for (const lr of pm.pack.lists) {
  const lz = await JSZip.loadAsync(await packZip.file(lr.ref).async('uint8array'));
  const lm = JSON.parse(await lz.file('manifest.json').async('text'));
  for (const cr of lm.list.order) {
    const cz = await JSZip.loadAsync(await lz.file(cr.ref).async('uint8array'));
    const cm = JSON.parse(await cz.file('manifest.json').async('text'));
    const c = cm.cube;
    cells.push(
      `<div class="cell"><div class="icon" style="background-image:url('${c.icon_url}')"></div>` +
      `<div class="lbl">${c.sort_order}. ${c.label}</div><div class="keys">${(c.action_payload.keys ?? []).join('+')}</div></div>`,
    );
  }
}
const html = `<!doctype html><meta charset="utf-8"><style>
body{background:#111;color:#ddd;font:11px Consolas,monospace;margin:16px}
.grid{display:grid;grid-template-columns:repeat(8,96px);gap:10px}
.cell{width:96px}
.icon{width:96px;height:96px;border-radius:12px;background-color:#0d0d0d;background-size:62% 62%;background-position:center;background-repeat:no-repeat;border:1px solid #2a2a2a}
.lbl{margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.keys{color:#888}
</style><h3>${pm.name} — ${cells.length} cubes</h3><div class="grid">${cells.join('')}</div>`;
fs.writeFileSync(outFile, html, 'utf-8');
console.log('생성:', outFile);
