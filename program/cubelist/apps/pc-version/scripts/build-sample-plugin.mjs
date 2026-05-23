#!/usr/bin/env node
/**
 * .cubeplugin 샘플 ZIP 빌드 스크립트 (M4 cron #14)
 *
 * 입력 디렉토리: ../plugins-examples/<package_id>/
 *   - manifest.json (필수)
 *   - icon.png, icons/, inspector/, runtime/ (선택)
 *
 * 출력: ../plugins-examples/<package_id>.cubeplugin (ZIP)
 *
 * 실행:
 *   cd apps/pc-version
 *   node scripts/build-sample-plugin.mjs com.rebirthstation.system.openapp
 *
 * 의존: jszip (frontend 가 이미 사용 중 — 별도 install 필요 없음)
 */

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from '../frontend/node_modules/jszip/dist/jszip.min.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EXAMPLES = resolve(ROOT, 'plugins-examples');

const packageId = process.argv[2];
if (!packageId) {
  console.error('Usage: node build-sample-plugin.mjs <package_id>');
  console.error(`예: node build-sample-plugin.mjs com.rebirthstation.system.openapp`);
  process.exit(1);
}

const srcDir = resolve(EXAMPLES, packageId);
const outFile = resolve(EXAMPLES, `${packageId}.cubeplugin`);

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(srcDir))) {
  console.error(`디렉토리 없음: ${srcDir}`);
  process.exit(1);
}

const manifestPath = join(srcDir, 'manifest.json');
if (!(await exists(manifestPath))) {
  console.error(`manifest.json 없음: ${manifestPath}`);
  process.exit(1);
}

const zip = new JSZip();
let count = 0;

async function addRecursive(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) {
      await addRecursive(abs);
    } else {
      const rel = relative(srcDir, abs).replace(/\\/g, '/');
      const buf = await readFile(abs);
      zip.file(rel, buf);
      count++;
    }
  }
}

await addRecursive(srcDir);

const blob = await zip.generateAsync({
  type: 'uint8array',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
});

await writeFile(outFile, blob);

console.log(`✓ ${count} files → ${relative(ROOT, outFile)} (${blob.byteLength} bytes)`);
