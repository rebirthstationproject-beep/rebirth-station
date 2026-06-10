#!/usr/bin/env node
/** 클린 팩 shortcut 키 토큰을 Rust map_key 화이트리스트로 전수 검증 + (label, keys) 표 출력. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const JSZip = require(path.join(HERE, '..', 'apps', 'pc-version', 'frontend', 'node_modules', 'jszip'));

const WL = new Set(['ctrl','control','shift','alt','win','windows','meta','super','cmd','tab','enter','return','esc','escape','space','backspace','delete','del','home','end','pageup','pgup','pagedown','pgdn','up','down','left','right','f1','f2','f3','f4','f5','f6','f7','f8','f9','f10','f11','f12']);
const ok = (k) => { const l = k.toLowerCase(); return WL.has(l) || (l.length === 1 && l.charCodeAt(0) < 128); };

const packFile = process.argv[2] ?? path.join(HERE, '..', 'assets', 'cubepacks-clean', 'adobe-photoshop.cubepack');
const packZip = await JSZip.loadAsync(fs.readFileSync(packFile));
const pm = JSON.parse(await packZip.file('manifest.json').async('text'));
let bad = 0;
for (const lr of pm.pack.lists) {
  const lz = await JSZip.loadAsync(await packZip.file(lr.ref).async('uint8array'));
  const lm = JSON.parse(await lz.file('manifest.json').async('text'));
  for (const cr of lm.list.order) {
    const cz = await JSZip.loadAsync(await lz.file(cr.ref).async('uint8array'));
    const cm = JSON.parse(await cz.file('manifest.json').async('text'));
    const keys = cm.cube.action_payload.keys ?? [];
    const invalid = keys.filter((k) => !ok(k));
    if (invalid.length) bad += 1;
    console.log(`${String(cm.cube.sort_order).padStart(2)}  ${String(cm.cube.label).padEnd(30)} ${keys.join('+')}${invalid.length ? '  <- 무효: ' + invalid.join(',') : ''}`);
  }
}
console.log(bad === 0 ? '\n키 토큰 검증: 전부 유효 (Rust map_key 화이트리스트 통과)' : `\n키 토큰 검증: ${bad}개 큐브 무효`);
process.exit(bad === 0 ? 0 : 1);
