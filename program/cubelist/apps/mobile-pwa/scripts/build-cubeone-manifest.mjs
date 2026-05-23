#!/usr/bin/env node
/**
 * cubeone/jusomoa 라이브러리를 정적 JSON manifest로 빌드.
 *
 * 사용 의도 (Tauri production build 대비):
 * - Tauri는 `output: 'export'` 정적 빌드 — server-side API routes 미작동
 * - 사전 빌드로 카테고리 목록 + 각 카테고리 아이템을 JSON으로 추출
 * - 아이콘 webp는 public/icons/cubeone/{category}/{slug}.webp로 복사
 * - CubeTableView가 fetch('/cubeone/jusomoa/categories.json') 같은 정적 자원 사용
 *
 * 실행:
 *   node scripts/build-cubeone-manifest.mjs
 *
 * 입력: <repo>/cubeone/jusomoa/{category}/{slug}.cubeone (ZIP)
 * 출력:
 *   apps/web/public/cubeone/jusomoa/categories.json
 *   apps/web/public/cubeone/jusomoa/{category}.json
 *   apps/web/public/cubeone/jusomoa/icons/{category}/{slug}.webp (ZIP 안 icon)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(WEB_ROOT, '..', '..');
const SRC_ROOT = path.join(REPO_ROOT, 'cubeone', 'jusomoa');
const OUT_ROOT = path.join(WEB_ROOT, 'public', 'cubeone', 'jusomoa');
const ICON_ROOT = path.join(OUT_ROOT, 'icons');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readCubeone(filePath) {
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('manifest.json missing in ' + filePath);
  const text = await manifestFile.async('text');
  const manifest = JSON.parse(text);

  // icon 추출 (있으면)
  const iconRef = manifest?.cube?.icon_ref;
  let iconBuf = null;
  if (iconRef) {
    const iconFile = zip.file(iconRef);
    if (iconFile) iconBuf = await iconFile.async('nodebuffer');
  }
  return { manifest, iconBuf, iconRef };
}

async function main() {
  console.log('Building cubeone manifest...');
  console.log('  source:', SRC_ROOT);
  console.log('  output:', OUT_ROOT);

  try {
    await fs.access(SRC_ROOT);
  } catch {
    console.error('Source not found:', SRC_ROOT);
    process.exit(1);
  }

  await ensureDir(OUT_ROOT);
  await ensureDir(ICON_ROOT);

  const categoryDirs = await fs.readdir(SRC_ROOT, { withFileTypes: true });
  const categories = [];
  let totalCubes = 0;
  let iconsCopied = 0;

  for (const ent of categoryDirs) {
    if (!ent.isDirectory()) continue;
    const cat = ent.name;
    const catDir = path.join(SRC_ROOT, cat);
    const files = await fs.readdir(catDir);
    const cubeones = files.filter((f) => f.endsWith('.cubeone'));
    if (cubeones.length === 0) continue;

    const categoryIconDir = path.join(ICON_ROOT, cat);
    await ensureDir(categoryIconDir);

    const items = [];

    for (const filename of cubeones) {
      const slugOnly = filename.replace(/\.cubeone$/, '');
      try {
        const { manifest, iconBuf, iconRef } = await readCubeone(path.join(catDir, filename));
        const cube = manifest.cube ?? {};
        const payload = cube.action_payload ?? {};

        // icon 저장 (있으면)
        let iconSrc = null;
        if (iconBuf && iconRef) {
          const ext = iconRef.endsWith('.png') ? 'png' : 'webp';
          const iconPath = path.join(categoryIconDir, `${slugOnly}.${ext}`);
          await fs.writeFile(iconPath, iconBuf);
          iconSrc = `/cubeone/jusomoa/icons/${cat}/${slugOnly}.${ext}`;
          iconsCopied++;
        } else if (cube.icon_url) {
          iconSrc = cube.icon_url;
        }

        items.push({
          slug: slugOnly,
          label: cube.label ?? slugOnly,
          icon_src: iconSrc,
          action_type: cube.action_type ?? 'link',
          url: typeof payload.url === 'string' ? payload.url : null,
          category: cat,
        });
        totalCubes++;
      } catch (e) {
        console.warn(`  skip ${cat}/${filename}:`, e.message);
      }
    }

    // 카테고리별 아이템 목록 저장
    const catJsonPath = path.join(OUT_ROOT, `${cat}.json`);
    await fs.writeFile(
      catJsonPath,
      JSON.stringify({ category: cat, count: items.length, items }, null, 2),
    );
    categories.push({ slug: cat, count: items.length });
  }

  // 카테고리 목록 저장 (count 내림차순)
  categories.sort((a, b) => b.count - a.count);
  await fs.writeFile(
    path.join(OUT_ROOT, 'categories.json'),
    JSON.stringify({ root: 'cubeone/jusomoa', total: totalCubes, categories }, null, 2),
  );

  console.log('Done.');
  console.log(`  categories: ${categories.length}`);
  console.log(`  total cubes: ${totalCubes}`);
  console.log(`  icons copied: ${iconsCopied}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
