#!/usr/bin/env node
/**
 * StreamDeck .streamDeckPlugin 일괄 변환 스크립트
 *
 * 입력 폴더: 사용자 인자 또는 기본 'C:\\Users\\PC\\Downloads\\플러그인'
 * 출력 폴더: 입력 폴더\\CUBE
 *
 * 변환 규칙:
 *   각 .streamDeckPlugin (ZIP) → 1 .cubelist (ZIP)
 *     - manifest.json 의 Actions[] → cubes/<safe-id>.cubeone (ZIP) per action
 *       · cube.label = Action.Name
 *       · cube.action_type = 매핑된 빌트인 또는 'plugin_action' (대부분)
 *       · cube.icon_url = data URL (PNG base64) — Action.Icon 또는 manifest.Icon 폴백
 *     - 모든 cubelist → all.cubepack (ZIP)
 *
 * 한계:
 *   - StreamDeck Plugin 의 JS/HTML 실행 환경은 큐브 리스트에 없음
 *   - 'plugin_action' 으로 마킹 — 실 OS 동작은 사용자가 직접 구현 또는 향후 SDK 호환층에서
 *   - 아이콘 표시 + 라벨 + 메타데이터만 정확
 *
 * 의존: ../frontend/node_modules/jszip
 */

import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from '../frontend/node_modules/jszip/dist/jszip.min.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_ROOT = process.argv[2] ?? 'C:\\Users\\PC\\Downloads\\플러그인';
const OUTPUT_ROOT = join(INPUT_ROOT, 'CUBE');

const RBS_FORMAT_VERSION = 3;
const RBS_MIN_VERSION = '0.1.0';
const NOW = new Date().toISOString();

/** StreamDeck action UUID → 우리 action_type 매핑 (가능한 경우만, 대부분 plugin_action) */
const ACTION_TYPE_MAP = {
  'com.elgato.streamdeck.system.website': 'link',
  'com.elgato.streamdeck.system.open': 'app_launch',
  'com.elgato.streamdeck.system.openapp': 'app_launch',
  'com.elgato.streamdeck.system.hotkey': 'shortcut',
  'com.elgato.streamdeck.system.text': 'text_insert',
};

function safeId(s) {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

async function readPluginManifest(zip) {
  // .sdPlugin 디렉토리 안 manifest.json 탐색
  const files = Object.keys(zip.files);
  const manifestEntry = files.find((f) => /\.sdPlugin\/manifest\.json$/i.test(f));
  if (!manifestEntry) throw new Error('manifest.json not found');
  const text = await zip.file(manifestEntry).async('text');
  return {
    manifest: JSON.parse(text),
    pluginDir: manifestEntry.replace(/manifest\.json$/i, ''),
  };
}

/**
 * StreamDeck 안 이미지 → data URL.
 *
 * 우선순위 (선명도 순):
 *   .svg (벡터) → @3x.png → @2x.png (HiDPI) → .png (1.5KB 이상) → 원본 (확장자 없음)
 *
 * 작은 1x.png (< 1500 byte) 는 placeholder 인 경우가 많아 우선 건너뜀.
 * 다른 candidate 가 전혀 없을 때만 1x.png 어떤 크기든 허용.
 */
async function loadIconAsDataUrl(zip, pluginDir, iconRef) {
  if (!iconRef) return { dataUrl: null, source: null };
  const MAX_BYTES = 1024 * 1024;
  const PNG_MIN_BYTES = 1500; // placeholder PNG (32x32 단색) 회피
  // 1차: 선명한 후보
  const sharp = [
    { suffix: '.svg', mime: 'image/svg+xml' },
    { suffix: '@3x.png', mime: 'image/png' },
    { suffix: '@2x.png', mime: 'image/png' },
  ];
  for (const { suffix, mime } of sharp) {
    const full = `${pluginDir}${iconRef}${suffix}`;
    const entry = zip.file(full);
    if (!entry) continue;
    const buf = await entry.async('uint8array');
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) continue;
    return { dataUrl: makeDataUrl(buf, mime), source: suffix };
  }
  // 2차: 1x.png — placeholder 회피 (작으면 skip)
  const oneX = `${pluginDir}${iconRef}.png`;
  const oneXEntry = zip.file(oneX);
  if (oneXEntry) {
    const buf = await oneXEntry.async('uint8array');
    if (buf.byteLength >= PNG_MIN_BYTES && buf.byteLength <= MAX_BYTES) {
      return { dataUrl: makeDataUrl(buf, 'image/png'), source: '.png' };
    }
  }
  // 3차: 원본 (확장자 없음) — manifest 에 확장자 명시 케이스
  const raw = `${pluginDir}${iconRef}`;
  const rawEntry = zip.file(raw);
  if (rawEntry) {
    const buf = await rawEntry.async('uint8array');
    if (buf.byteLength >= 200 && buf.byteLength <= MAX_BYTES) {
      const mime = sniffMime(buf);
      return { dataUrl: makeDataUrl(buf, mime), source: 'raw' };
    }
  }
  // 4차: 마지막 폴백 — 1x.png 가 작더라도 사용 (placeholder 라도 안 보이는 것보다 낫다)
  if (oneXEntry) {
    const buf = await oneXEntry.async('uint8array');
    if (buf.byteLength > 0 && buf.byteLength <= MAX_BYTES) {
      return { dataUrl: makeDataUrl(buf, 'image/png'), source: '.png(small)' };
    }
  }
  return { dataUrl: null, source: null };
}

function makeDataUrl(buf, mime) {
  return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
}

/** PNG/JPEG/GIF/SVG 시그니처 sniff */
function sniffMime(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  // SVG = 텍스트 시작
  if (buf.length >= 5 && buf[0] === 0x3c) return 'image/svg+xml'; // '<'
  return 'image/png';
}

function mapActionType(uuid) {
  return ACTION_TYPE_MAP[uuid] ?? 'plugin_action';
}

function buildActionPayload(uuid, mappedType, action) {
  if (mappedType === 'plugin_action') {
    return {
      plugin_uuid: uuid,
      action_id: 'default',
      payload: {},
    };
  }
  // 매핑된 빌트인은 기본값만 (사용자가 인스펙터에서 채움)
  switch (mappedType) {
    case 'link': return { url: '' };
    case 'app_launch': return { path: '', args: [] };
    case 'shortcut': return { keys: [] };
    case 'text_insert': return { text: '' };
    default: return {};
  }
}

async function buildCubeOneZip(zip, pluginDir, action, defaultIconUrl, iconStats) {
  const id = safeId(action.UUID ?? action.Name ?? 'action');
  const label = action.Name ?? id;
  const mappedType = mapActionType(action.UUID);
  // 우선순위: 액션 별 States[0].Image (고유 시각) → Action.Icon (plugin 카탈로그용) → plugin Icon
  const stateImage = Array.isArray(action.States) && action.States[0]?.Image;
  let icon_url = null;
  let iconSource = 'none';
  if (stateImage) {
    const r = await loadIconAsDataUrl(zip, pluginDir, stateImage);
    if (r.dataUrl) { icon_url = r.dataUrl; iconSource = `state${r.source}`; }
  }
  if (!icon_url && action.Icon) {
    const r = await loadIconAsDataUrl(zip, pluginDir, action.Icon);
    if (r.dataUrl) { icon_url = r.dataUrl; iconSource = `action_icon${r.source}`; }
  }
  if (!icon_url) {
    icon_url = defaultIconUrl;
    iconSource = defaultIconUrl ? 'plugin_icon_fallback' : 'none';
  }
  if (iconStats) iconStats[iconSource] = (iconStats[iconSource] ?? 0) + 1;

  const cube = {
    label,
    icon_url,
    action_type: mappedType,
    action_payload: buildActionPayload(action.UUID, mappedType, action),
    metadata: {
      source: 'streamdeck-import',
      sd_uuid: action.UUID,
      sd_tooltip: action.Tooltip,
    },
  };

  const manifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubeone',
    id,
    license: 'free',
    created_at: NOW,
    updated_at: NOW,
    rbs_min_version: RBS_MIN_VERSION,
    cube,
  };

  const out = new JSZip();
  out.file('manifest.json', JSON.stringify(manifest, null, 2));
  return { id, label, mappedType, manifestObj: manifest, zip: out };
}

async function buildCubelistFromPlugin(pluginZipPath, globalIconStats) {
  const buf = await readFile(pluginZipPath);
  const zip = await JSZip.loadAsync(buf);
  const { manifest: pluginManifest, pluginDir } = await readPluginManifest(zip);

  const pluginName = pluginManifest.Name ?? basename(pluginZipPath, '.streamDeckPlugin');
  const pluginAuthor = pluginManifest.Author ?? 'StreamDeck Vendor';
  const pluginIconResult = await loadIconAsDataUrl(zip, pluginDir, pluginManifest.Icon);
  const pluginIconUrl = pluginIconResult.dataUrl;

  const actions = Array.isArray(pluginManifest.Actions) ? pluginManifest.Actions : [];

  const cubelist = new JSZip();
  const order = [];
  let cubeCount = 0;
  const mapStats = { plugin_action: 0, builtin: 0 };

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    try {
      const built = await buildCubeOneZip(zip, pluginDir, action, pluginIconUrl, globalIconStats);
      const cubeBlob = await built.zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
      });
      const ref = `cubes/${built.id}.cubeone`;
      cubelist.file(ref, cubeBlob);
      order.push({ ref, sort_order: i + 1 });
      cubeCount++;
      if (built.mappedType === 'plugin_action') mapStats.plugin_action++;
      else mapStats.builtin++;
    } catch (e) {
      console.warn(`  ! action ${action.UUID ?? '?'} 변환 실패: ${e.message}`);
    }
  }

  const listManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubelist',
    id: safeId(pluginManifest.UUID ?? pluginName),
    author: pluginAuthor,
    description: pluginManifest.Description,
    license: 'free',
    created_at: NOW,
    updated_at: NOW,
    rbs_min_version: RBS_MIN_VERSION,
    list: { name: pluginName, order },
  };
  cubelist.file('manifest.json', JSON.stringify(listManifest, null, 2));

  return { pluginName, cubelist, cubeCount, mapStats, listManifest };
}

/** Windows 호환 폴더명으로 정규화 (한글/공백 OK, 금지 문자만 _ 로) */
function safeFolderName(s) {
  return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim().slice(0, 100);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

async function main() {
  console.log(`입력: ${INPUT_ROOT}`);
  console.log(`출력: ${OUTPUT_ROOT}`);
  await mkdir(OUTPUT_ROOT, { recursive: true });

  const entries = await readdir(INPUT_ROOT);
  const pluginFiles = entries
    .filter((e) => e.toLowerCase().endsWith('.streamdeckplugin'))
    .map((e) => join(INPUT_ROOT, e));

  console.log(`\n.streamDeckPlugin 파일 ${pluginFiles.length}개 발견:`);

  const summary = [];
  let totalCubes = 0;
  let totalBuiltin = 0;
  let totalPluginAction = 0;
  let totalCubeoneFiles = 0;
  const iconStats = {}; // 매칭 소스 통계

  for (let i = 0; i < pluginFiles.length; i++) {
    const file = pluginFiles[i];
    const name = basename(file);
    try {
      // buildCubelistFromPlugin 의 결과 cubelist (ZIP) 안에서 cubes/* 를 꺼내 폴더로 풀기
      const built = await buildCubelistFromPlugin(file, iconStats);
      const folderName = safeFolderName(built.pluginName);
      const folderPath = join(OUTPUT_ROOT, folderName);
      await mkdir(folderPath, { recursive: true });

      // cubelist ZIP 안의 cubes/*.cubeone 을 폴더에 개별 파일로 풀기
      const order = built.listManifest.list.order;
      let folderCubeCount = 0;
      for (let j = 0; j < order.length; j++) {
        const ref = order[j].ref; // "cubes/<id>.cubeone"
        const entry = built.cubelist.file(ref);
        if (!entry) continue;
        const cubeBytes = await entry.async('uint8array');
        const outName = `${folderName}${pad2(j + 1)}.cubeone`;
        await writeFile(join(folderPath, outName), cubeBytes);
        folderCubeCount++;
        totalCubeoneFiles++;
      }

      summary.push({
        plugin: built.pluginName,
        folder: folderName,
        cubes: folderCubeCount,
        mapped: built.mapStats.builtin,
        placeholder: built.mapStats.plugin_action,
      });
      totalCubes += folderCubeCount;
      totalBuiltin += built.mapStats.builtin;
      totalPluginAction += built.mapStats.plugin_action;
      console.log(`  ✓ ${built.pluginName}: ${folderCubeCount} 큐브 → ${folderName}\\${folderName}01.cubeone .. ${pad2(folderCubeCount)}.cubeone`);
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  }

  // 변환 보고서
  const report = {
    converted_at: NOW,
    input: INPUT_ROOT,
    output: OUTPUT_ROOT,
    plugins: pluginFiles.length,
    total_cubes: totalCubes,
    total_cubeone_files: totalCubeoneFiles,
    builtin_mapped: totalBuiltin,
    plugin_action_placeholder: totalPluginAction,
    icon_source_stats: iconStats,
    items: summary,
    note: 'plugin_action 큐브는 PC 헬퍼에 .cubeplugin SDK 가 구현되어야 실행됩니다. 현재는 아이콘+라벨만 표시.',
    library_structure: 'CUBE/<폴더(=큐브리스트)>/<폴더명>NN.cubeone',
  };
  await writeFile(join(OUTPUT_ROOT, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`\n=== 완료 ===`);
  console.log(`총 .cubeone 파일: ${totalCubeoneFiles}`);
  console.log(`  빌트인 매핑: ${totalBuiltin}`);
  console.log(`  plugin_action placeholder: ${totalPluginAction}`);
  console.log(`아이콘 매칭 소스:`);
  for (const [source, count] of Object.entries(iconStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count}`);
  }
  console.log(`산출:`);
  console.log(`  ${OUTPUT_ROOT}\\<폴더(=큐브리스트)>\\<폴더명>NN.cubeone × ${totalCubeoneFiles}`);
  console.log(`  ${join(OUTPUT_ROOT, 'report.json')}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
