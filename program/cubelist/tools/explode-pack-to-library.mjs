/**
 * .cubepack → 라이브러리 폴더 전개기
 *
 * PC 앱은 부팅/포커스 시 라이브러리 폴더(C:\Users\PC\Downloads\플러그인\CUBE)를
 * 스캔해 "<폴더명>/<폴더명>NN.cubeone" 구조를 큐브리스트로 매핑한다.
 * 완성 .cubepack 을 그 구조로 풀어 넣어 앱에서 항상 보이게 한다.
 *
 * 사용: node tools/explode-pack-to-library.mjs <pack.cubepack> [라이브러리루트]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSZip = require('../apps/pc-version/frontend/node_modules/jszip');

const DEFAULT_LIBRARY_DIR = 'C:\\Users\\PC\\Downloads\\플러그인\\CUBE';

const packPath = process.argv[2];
const libraryRoot = process.argv[3] ?? DEFAULT_LIBRARY_DIR;
if (!packPath || !fs.existsSync(packPath)) {
  console.error('사용법: node tools/explode-pack-to-library.mjs <pack.cubepack> [라이브러리루트]');
  process.exit(1);
}
if (!fs.existsSync(libraryRoot)) {
  console.error(`라이브러리 폴더 없음: ${libraryRoot}`);
  process.exit(1);
}

const outer = await JSZip.loadAsync(fs.readFileSync(packPath));
// 팩 대표 아이콘 — 각 리스트 폴더에 icon.png 로 복사 (편집기 리스트 아이콘으로 매핑됨)
const packIconEntry = outer.file('icon.png');
const packIconBytes = packIconEntry ? await packIconEntry.async('uint8array') : null;
const listFiles = Object.keys(outer.files).filter((k) => k.toLowerCase().endsWith('.cubelist'));
if (listFiles.length === 0) {
  console.error('팩 안에 .cubelist 가 없습니다');
  process.exit(1);
}

for (const lf of listFiles) {
  const inner = await JSZip.loadAsync(await outer.file(lf).async('uint8array'));
  const manifest = JSON.parse(await inner.file('manifest.json').async('string'));
  const listName = manifest.list?.name ?? path.basename(lf, '.cubelist');
  const order = manifest.list?.order ?? [];
  if (order.length === 0) {
    console.warn(`[skip] ${listName}: order 비어 있음`);
    continue;
  }

  const dir = path.join(libraryRoot, listName);
  // 동일 폴더 재전개 시 잔존 파일이 순서를 흐리지 않도록 비우고 다시 채움
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const sorted = [...order].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const pad = String(sorted.length).length >= 2 ? String(sorted.length).length : 2;
  let written = 0;
  for (let i = 0; i < sorted.length; i++) {
    const ref = sorted[i].ref;
    // ref 가 전체 경로(cubes/ps-01.cubeone)인 방언과 ID-only 방언 모두 지원
    const entry = inner.file(ref) ?? inner.file(`cubes/${ref}.cubeone`) ?? inner.file(`cubes/${ref}`);
    if (!entry) {
      console.warn(`[miss] ${listName}: cubes/${ref}.cubeone 없음`);
      continue;
    }
    const bytes = await entry.async('uint8array');
    const fileName = `${listName}${String(i + 1).padStart(pad, '0')}.cubeone`;
    fs.writeFileSync(path.join(dir, fileName), bytes);
    written++;
  }
  if (packIconBytes) {
    fs.writeFileSync(path.join(dir, 'icon.png'), packIconBytes);
  }
  console.log(`[ok] ${listName}: ${written}/${sorted.length} 큐브${packIconBytes ? ' + icon.png' : ''} → ${dir}`);
}
