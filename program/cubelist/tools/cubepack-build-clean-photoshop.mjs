#!/usr/bin/env node
/**
 * cubepack-build-clean-photoshop — 1호 클린 자산 빌더 (파이프라인 2~3단계).
 *
 * 입력: Downloads\플러그인\CUBE\Adobe Photoshop v2\*.cubeone (변환+1차 재작업본)
 * 처리:
 *   - shortcut 타입만 채택 (plugin_action 메뉴 스텁 = 작동 불가 → 제외)
 *   - 아이콘: Elgato 아이콘팩 PNG → 자체 SVG 카탈로그(icon-catalog-photoshop.ts) 임베드 교체
 *   - metadata: iconpack·sd 계열 잔여 전부 제거 → { source: 'rebirth-curated', icon_source: 'catalog:photoshop' }
 *   - 팩 아이콘: assets/program-icons/adobe/photoshop.png → icon.png
 * 출력: assets/cubepacks-clean/adobe-photoshop.cubepack  (검증: tools/cubepack-audit.mjs)
 *
 * 사용: node tools/cubepack-build-clean-photoshop.mjs [입력디렉토리]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.join(HERE, '..');
const FRONTEND_NM = path.join(ROOT, 'apps', 'pc-version', 'frontend', 'node_modules');
const JSZip = require(path.join(FRONTEND_NM, 'jszip'));
const esbuild = require(path.join(FRONTEND_NM, 'esbuild'));

const SRC_DIR = process.argv[2] ?? path.join(os.homedir(), 'Downloads', '플러그인', 'CUBE', 'Adobe Photoshop v2');
const OUT_DIR = path.join(ROOT, 'assets', 'cubepacks-clean');
const PACK_ICON = path.join(ROOT, 'assets', 'program-icons', 'adobe', 'photoshop.png');
const CATALOG_TS = path.join(ROOT, 'apps', 'pc-version', 'frontend', 'src', 'lib', 'icon-catalog-photoshop.ts');

const PACK_NAME = 'Adobe Photoshop';
const PACK_ID = 'rbs.pack.adobe-photoshop';

// ── 검토사항 1 (라벨=동작 일치) 정합 규칙 — 2026-06-11 자체 검증 결과 ──────
// 제외: 라벨이 약속하는 동작과 키가 불일치하거나 비결정적(툴 그룹 공유 키)인 큐브
const EXCLUDE_LABELS = new Set([
  'New Group',            // Ctrl+Shift+G = 실제 PS에선 Ungroup (오매핑)
  'Content Aware Fill',   // Shift+F5 = Fill 대화상자 (CC2019+ 전용 단축키 없음)
  'Black And White',      // Adj Black And White와 동일 키 중복 (Ctrl+Alt+Shift+B)
  'Perspective Crop',     // C = Crop 그룹 활성화 — 특정 툴 비결정
  'Path Selection',       // A = Direct Selection과 그룹 공유 — 비결정
  'Vertical Type',        // T = Horizontal Type과 그룹 공유 — 비결정
  'Burn',                 // O = Dodge와 그룹 공유 — 비결정
]);
// 라벨 정정: 실제 동작 명칭으로 (카탈로그 아이콘 키는 원 라벨 유지)
const RELABEL = new Map([
  ['Foreground', 'Default Colors'], // D = 기본색 리셋
  ['Background', 'Swap Colors'],    // X = 전경/배경 교체
]);

async function loadCatalog() {
  const ts = fs.readFileSync(CATALOG_TS, 'utf-8');
  const { code } = esbuild.transformSync(ts, { loader: 'ts', format: 'esm' });
  const tmp = path.join(os.tmpdir(), `ps-catalog-${process.pid}.mjs`);
  fs.writeFileSync(tmp, code, 'utf-8');
  const mod = await import(pathToFileURL(tmp).href);
  fs.unlinkSync(tmp);
  return mod;
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
}

async function readCubeone(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  return JSON.parse(await zip.file('manifest.json').async('text'));
}

async function buildCubeoneZip(manifest) {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(manifest, null, 1));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

async function main() {
  const { findPhotoshopIcon } = await loadCatalog();
  const now = new Date().toISOString();
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.cubeone')).sort();

  const adopted = [];
  const skipped = [];
  const noIcon = [];

  // 2026-06-11 사용자 지시: 아이콘 = v2 형태 100% 유지 + 컬러 스왑(recolor-v2-icons.py 산출).
  // 컬러 스왑 PNG 우선, 없으면 자체 SVG 카탈로그 폴백.
  const RECOLOR_DIR = path.join(ROOT, 'assets', 'cubepacks-clean', '_recolored');
  for (const f of files) {
    const src = await readCubeone(path.join(SRC_DIR, f));
    const cube = src.cube ?? {};
    if (cube.action_type !== 'shortcut') { skipped.push(`${cube.label} (${cube.action_type})`); continue; }
    if (EXCLUDE_LABELS.has(cube.label)) { skipped.push(`${cube.label} (라벨-동작 불일치/비결정 — 재설계 대상)`); continue; }

    const safe = String(cube.label ?? '').replace(/[\\/:*?"<>|]/g, '_');
    const recolorFile = path.join(RECOLOR_DIR, `${safe}.png`);
    let iconUrl = null;
    let iconSource = null;
    if (fs.existsSync(recolorFile)) {
      iconUrl = `data:image/png;base64,${fs.readFileSync(recolorFile).toString('base64')}`;
      iconSource = 'recolor:photoshop-v2';
    } else {
      const svg = findPhotoshopIcon(cube.label ?? '');
      if (svg) { iconUrl = svgToDataUrl(svg); iconSource = 'catalog:photoshop'; }
    }
    if (!iconUrl) { noIcon.push(cube.label); continue; }

    adopted.push({
      label: RELABEL.get(cube.label) ?? cube.label,
      action_type: 'shortcut',
      action_payload: { keys: cube.action_payload?.keys ?? [] },
      icon_url: iconUrl,
      metadata: {
        source: 'rebirth-curated',
        icon_source: iconSource,
        catalog_version: 'clean-v3-recolor',
      },
      // 기능명이 타일 안에 베이크됨 (2026-06-11 지시) — 셀 라벨 중복 표시 OFF
      title_style: { show: false },
    });
  }

  if (adopted.length === 0) { console.error('채택 0 — 중단'); process.exit(2); }

  // ── .cubeone → .cubelist → .cubepack 조립 ────────────────────────────────
  const listId = 'PHOTOSHOP-MAIN';
  const listZip = new JSZip();
  const order = [];
  for (const [i, c] of adopted.entries()) {
    const cubeId = `ps-${String(i + 1).padStart(2, '0')}`;
    const cubeManifest = {
      rbs_format_version: 3,
      kind: 'cubeone',
      id: cubeId,
      license: 'free',
      created_at: now,
      updated_at: now,
      rbs_min_version: '0.1.0',
      cube: { ...c, sort_order: i + 1 },
    };
    const ref = `cubes/${cubeId}.cubeone`;
    listZip.file(ref, await buildCubeoneZip(cubeManifest));
    order.push({ ref, sort_order: i + 1 });
  }
  listZip.file('manifest.json', JSON.stringify({
    rbs_format_version: 3,
    kind: 'cubelist',
    id: listId,
    license: 'free',
    created_at: now,
    updated_at: now,
    rbs_min_version: '0.1.0',
    list: {
      name: 'Photoshop',
      sort_order: 1,
      order,
      grid_layout: 'cubelist_unlimited',
      controller_type: 'main',
    },
  }, null, 1));
  const listBuf = await listZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const packZip = new JSZip();
  const listRef = `lists/${listId}.cubelist`;
  packZip.file(listRef, listBuf);
  packZip.file('icon.png', fs.readFileSync(PACK_ICON));
  packZip.file('manifest.json', JSON.stringify({
    rbs_format_version: 3,
    kind: 'cubepack',
    id: PACK_ID,
    name: PACK_NAME,
    license: 'free',
    created_at: now,
    updated_at: now,
    rbs_min_version: '0.1.0',
    pack: {
      name: PACK_NAME,
      device_hint: 'cubelist_unlimited',
      cubes_per_page_default: 28,
      icon: 'icon.png',
      lists: [{ ref: listRef, sort_order: 1, name: 'Photoshop', cube_count: adopted.length }],
    },
  }, null, 1));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'adobe-photoshop.cubepack');
  fs.writeFileSync(outFile, await packZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));

  console.log(`\n클린 팩 생성: ${outFile}`);
  console.log(`채택 ${adopted.length} (shortcut + 자체 SVG)`);
  console.log(`제외 ${skipped.length} (비 shortcut — 메뉴 스텁 등):`);
  for (const s of skipped) console.log(`  - ${s}`);
  if (noIcon.length) {
    console.log(`카탈로그 미매칭 ${noIcon.length}: ${noIcon.join(', ')}`);
  }
}

main().catch((e) => { console.error('오류:', e); process.exit(2); });
