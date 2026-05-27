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
 * 우선순위: .svg (벡터) → @2x.png (HiDPI) → .png → 확장자 없는 원본
 * 1MB 까지 허용 (vendor PNG 대부분 < 50KB · cubepack 전체 5~10MB 안전)
 */
async function loadIconAsDataUrl(zip, pluginDir, iconRef) {
  if (!iconRef) return null;
  const candidates = [
    `${iconRef}.svg`,
    `${iconRef}@2x.png`,
    `${iconRef}.png`,
    iconRef,
  ];
  const MAX_BYTES = 1024 * 1024; // 1 MB raw
  for (const c of candidates) {
    const full = `${pluginDir}${c}`;
    const entry = zip.file(full);
    if (!entry) continue;
    const buf = await entry.async('uint8array');
    if (buf.byteLength > MAX_BYTES) continue;
    const ext = c.split('.').pop().toLowerCase();
    const mime = ext === 'svg'
      ? 'image/svg+xml'
      : `image/${ext === 'jpg' ? 'jpeg' : ext === 'jpeg' ? 'jpeg' : ext === 'gif' ? 'gif' : 'png'}`;
    const b64 = Buffer.from(buf).toString('base64');
    return `data:${mime};base64,${b64}`;
  }
  return null;
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

async function buildCubeOneZip(zip, pluginDir, action, defaultIconUrl) {
  const id = safeId(action.UUID ?? action.Name ?? 'action');
  const label = action.Name ?? id;
  const mappedType = mapActionType(action.UUID);
  // 우선순위: 액션 별 States[0].Image (고유 시각) → Action.Icon (plugin 카탈로그용) → plugin Icon
  const stateImage = Array.isArray(action.States) && action.States[0]?.Image;
  const icon_url =
    (stateImage && await loadIconAsDataUrl(zip, pluginDir, stateImage)) ??
    (action.Icon && await loadIconAsDataUrl(zip, pluginDir, action.Icon)) ??
    defaultIconUrl;

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

async function buildCubelistFromPlugin(pluginZipPath) {
  const buf = await readFile(pluginZipPath);
  const zip = await JSZip.loadAsync(buf);
  const { manifest: pluginManifest, pluginDir } = await readPluginManifest(zip);

  const pluginName = pluginManifest.Name ?? basename(pluginZipPath, '.streamDeckPlugin');
  const pluginAuthor = pluginManifest.Author ?? 'StreamDeck Vendor';
  const pluginIconUrl = await loadIconAsDataUrl(zip, pluginDir, pluginManifest.Icon);

  const actions = Array.isArray(pluginManifest.Actions) ? pluginManifest.Actions : [];

  const cubelist = new JSZip();
  const order = [];
  let cubeCount = 0;
  const mapStats = { plugin_action: 0, builtin: 0 };

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    try {
      const built = await buildCubeOneZip(zip, pluginDir, action, pluginIconUrl);
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

async function main() {
  console.log(`입력: ${INPUT_ROOT}`);
  console.log(`출력: ${OUTPUT_ROOT}`);
  await mkdir(OUTPUT_ROOT, { recursive: true });

  const entries = await readdir(INPUT_ROOT);
  const pluginFiles = entries
    .filter((e) => e.toLowerCase().endsWith('.streamdeckplugin'))
    .map((e) => join(INPUT_ROOT, e));

  console.log(`\n.streamDeckPlugin 파일 ${pluginFiles.length}개 발견:`);

  const pack = new JSZip();
  const packOrder = [];
  const summary = [];
  let totalCubes = 0;
  let totalBuiltin = 0;
  let totalPluginAction = 0;

  for (let i = 0; i < pluginFiles.length; i++) {
    const file = pluginFiles[i];
    const name = basename(file);
    try {
      const { pluginName, cubelist, cubeCount, mapStats, listManifest } = await buildCubelistFromPlugin(file);
      const cubelistBlob = await cubelist.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
      });

      const safeFilename = `${safeId(pluginName)}.cubelist`;
      const outPath = join(OUTPUT_ROOT, safeFilename);
      await writeFile(outPath, cubelistBlob);

      // 큐브팩 에도 추가
      const ref = `lists/${safeFilename}`;
      pack.file(ref, cubelistBlob);
      packOrder.push({ ref, sort_order: i + 1 });

      summary.push({
        plugin: pluginName,
        file: safeFilename,
        cubes: cubeCount,
        mapped: mapStats.builtin,
        placeholder: mapStats.plugin_action,
        size_kb: Math.round(cubelistBlob.byteLength / 1024),
      });
      totalCubes += cubeCount;
      totalBuiltin += mapStats.builtin;
      totalPluginAction += mapStats.plugin_action;
      console.log(`  ✓ ${pluginName}: ${cubeCount} 큐브 (빌트인 ${mapStats.builtin}, plugin_action ${mapStats.plugin_action}) → ${safeFilename}`);
    } catch (e) {
      console.error(`  ✗ ${name}: ${e.message}`);
    }
  }

  // 전체 cubepack
  const packManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubepack',
    id: 'streamdeck-import',
    author: 'StreamDeck Import',
    description: '사용자 다운로드 폴더의 StreamDeck 플러그인 일괄 변환본',
    license: 'free',
    created_at: NOW,
    updated_at: NOW,
    rbs_min_version: RBS_MIN_VERSION,
    pack: { name: 'StreamDeck 임포트', order: packOrder },
  };
  pack.file('manifest.json', JSON.stringify(packManifest, null, 2));
  const packBlob = await pack.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const packPath = join(OUTPUT_ROOT, 'all.cubepack');
  await writeFile(packPath, packBlob);

  // 변환 보고서
  const report = {
    converted_at: NOW,
    input: INPUT_ROOT,
    output: OUTPUT_ROOT,
    plugins: pluginFiles.length,
    total_cubes: totalCubes,
    builtin_mapped: totalBuiltin,
    plugin_action_placeholder: totalPluginAction,
    cubepack: 'all.cubepack',
    cubepack_size_kb: Math.round(packBlob.byteLength / 1024),
    items: summary,
    note: 'plugin_action 큐브는 PC 헬퍼에 .cubeplugin SDK 가 구현되어야 실행됩니다. 현재는 아이콘+라벨만 표시.',
  };
  await writeFile(join(OUTPUT_ROOT, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`\n=== 완료 ===`);
  console.log(`총 큐브: ${totalCubes}`);
  console.log(`  빌트인 매핑: ${totalBuiltin}`);
  console.log(`  plugin_action placeholder: ${totalPluginAction}`);
  console.log(`산출:`);
  console.log(`  ${OUTPUT_ROOT}\\<plugin>.cubelist × ${pluginFiles.length}`);
  console.log(`  ${packPath} (${Math.round(packBlob.byteLength / 1024)} KB)`);
  console.log(`  ${join(OUTPUT_ROOT, 'report.json')}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
