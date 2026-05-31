#!/usr/bin/env node
/**
 * StreamDeck .streamDeckProfile 일괄 변환 스크립트.
 *
 * 사용자 영구 매핑 (2026-05-31):
 *   .streamDeckProfile (사용자 페이지+키 배치) → .cubepack (다중 리스트 묶음)
 *
 * 입력 폴더: 사용자 인자 또는 기본 'C:\\Program Files\\Elgato\\StreamDeck\\DefaultProfiles'
 * 출력 폴더: 입력 폴더\\CUBEPACK 또는 사용자 지정
 *
 * 변환 규칙:
 *   각 .streamDeckProfile (ZIP) → 1 .cubepack (ZIP)
 *     ├── manifest.json (kind: 'cubepack', device_hint, streamdeck_source)
 *     └── lists/
 *         └── <page-UUID>.cubelist  (각 Page = CubeList 1개)
 *               ├── manifest.json (kind: 'cubelist', controller_type, grid_layout)
 *               └── cubes/
 *                   └── <action-id>.cubeone  (각 Action {col,row} = Cube 1개)
 *
 * 매핑:
 *   - Profile.Device.Model → device_hint (13 StreamDeck 디바이스)
 *   - Profile.Pages.Pages[] → CubeList[]
 *   - Page.Controllers[].Actions{col,row} → cubes[].sort_order (row * cols + col)
 *   - Action.UUID → cube.action_payload.plugin_uuid + action_type 매핑
 *   - Action.States[] → cube.states (P0 영구 lock)
 *   - Action.States[0].Title 메타 → cube.title_style (P0 영구 lock)
 *   - Action.Settings → cube.action_payload.settings (또는 직접 매핑)
 *   - Images/<UUID>.png → cube.icon_url (base64 data URL)
 *
 * 의존: ../frontend/node_modules/jszip
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from '../frontend/node_modules/jszip/dist/jszip.min.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT_ROOT = process.argv[2] ?? 'C:\\Program Files\\Elgato\\StreamDeck\\DefaultProfiles';
const OUTPUT_ROOT = process.argv[3] ?? join(INPUT_ROOT, 'CUBEPACK');

const RBS_FORMAT_VERSION = 3;
const RBS_MIN_VERSION = '0.1.0';
const NOW = new Date().toISOString();

/** Device.Model → DeviceHint 매핑 (13 디바이스) */
const DEVICE_MODEL_MAP = {
  '20GAA9901': { hint: 'streamdeck_standard', cols: 5, rows: 3, label: 'StreamDeck (1st gen)' },
  '20GAA9902': { hint: 'streamdeck_mk2',      cols: 5, rows: 3, label: 'StreamDeck MK.2' },
  '20GAA9903': { hint: 'streamdeck_mini',     cols: 3, rows: 2, label: 'StreamDeckMini' },
  '20GAA9904': { hint: 'streamdeck_xl',       cols: 8, rows: 4, label: 'StreamDeckXL' },
  '20GAA9905': { hint: 'streamdeck_plus',     cols: 4, rows: 2, label: 'StreamDeckPlus' },
  '20GAA9906': { hint: 'streamdeck_neo',      cols: 4, rows: 2, label: 'StreamDeckNeo' },
  '20GAS9901': { hint: 'streamdeck_xl',       cols: 8, rows: 4, label: 'StreamDeckXL (2nd gen)' },
  // 추가 디바이스 (Corsair, Discord, Galleon, XLR Dock 등) — 폴백 'cubelist_unlimited'
};

/** StreamDeck Action UUID → 우리 action_type 매핑 (위 plugin-converter 와 동일) */
const ACTION_TYPE_MAP = {
  'com.elgato.streamdeck.system.website': 'link',
  'com.elgato.streamdeck.system.open': 'app_launch',
  'com.elgato.streamdeck.system.openapp': 'app_launch',
  'com.elgato.streamdeck.system.hotkey': 'shortcut',
  'com.elgato.streamdeck.system.text': 'text_insert',
  'com.elgato.streamdeck.system.mouse': 'mouse_click',
  // P1 신규 액션 매핑
  'com.elgato.streamdeck.system.multimedia': 'media_key',
  'com.elgato.streamdeck.system.pagination': 'page_navigate',
  'com.elgato.streamdeck.page': 'page_jump',
  'com.elgato.streamdeck.profile.backtoparent': 'folder_up',
  'com.elgato.streamdeck.profile.openchild': 'folder_open',
  'com.elgato.streamdeck.system.close': 'window_close',
  'com.elgato.streamdeck.system.sleep': 'system_sleep',
  'com.elgato.streamdeck.system.actionbar': 'system_actionbar_toggle',
  'com.elgato.streamdeck.system.hotkeyswitch': 'hotkey_toggle',
  'com.elgato.streamdeck.soundboard': 'audio_play',
  'com.elgato.streamdeck.profile.rotate': 'profile_rotate',
  // 동적
  'com.elgato.streamdeck.system.digitaltime': 'live_clock',
  'com.elgato.streamdeck.timer': 'live_timer',
};

function safeId(s) {
  return String(s).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

function safeFolderName(s) {
  return String(s).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim().slice(0, 100);
}

function mapActionType(uuid) {
  return ACTION_TYPE_MAP[uuid] ?? 'plugin_action';
}

/**
 * StreamDeck Action.States[0].Title 메타 → Cube.title_style (P0 영구 lock).
 */
function extractTitleStyle(stateZero, linkedTitle) {
  if (!stateZero) return undefined;
  const style = {};
  if (typeof stateZero.FontFamily === 'string') style.font_family = stateZero.FontFamily;
  if (typeof stateZero.FontSize === 'number') style.font_size = stateZero.FontSize;
  if (typeof stateZero.FontStyle === 'string') {
    const fs = stateZero.FontStyle.toLowerCase();
    if (fs.includes('bold') && fs.includes('italic')) style.font_style = 'bold_italic';
    else if (fs.includes('bold')) style.font_style = 'bold';
    else if (fs.includes('italic')) style.font_style = 'italic';
    else style.font_style = 'normal';
  }
  if (typeof stateZero.FontUnderline === 'boolean') style.font_underline = stateZero.FontUnderline;
  if (typeof stateZero.OutlineThickness === 'number') style.outline_thickness = stateZero.OutlineThickness;
  if (typeof stateZero.ShowTitle === 'boolean') style.show = stateZero.ShowTitle;
  if (typeof linkedTitle === 'boolean') style.linked = linkedTitle;
  if (typeof stateZero.Title === 'string') style.title = stateZero.Title;
  if (typeof stateZero.TitleAlignment === 'string') {
    const al = stateZero.TitleAlignment.toLowerCase();
    if (al === 'top' || al === 'middle' || al === 'bottom') style.alignment = al;
  }
  if (typeof stateZero.TitleColor === 'string') style.color = stateZero.TitleColor;
  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * StreamDeck Action.States[] → Cube.states (P0 영구 lock).
 */
function extractStates(states) {
  if (!Array.isArray(states) || states.length <= 1) return undefined;
  return states.map((s) => {
    const out = {};
    if (typeof s.Title === 'string') out.label = s.Title;
    // Image 는 별도 zip Images/ 폴더 의 경로 — 변환기 sweep 에서 base64 인라인 처리
    if (typeof s.Image === 'string') out.image = s.Image;
    return out;
  });
}

/**
 * Action 의 이미지 (Images/<id>.png) 를 ZIP 에서 추출 → data URL.
 */
async function loadActionImageDataUrl(zip, sdProfileDir, pagePath, actionId) {
  const candidates = [
    `${pagePath}Images/${actionId}.png`,
    `${pagePath}Images/${actionId}@2x.png`,
    `${sdProfileDir}Images/${actionId}.png`,
    `${sdProfileDir}Images/${actionId}@2x.png`,
  ];
  for (const c of candidates) {
    const entry = zip.file(c);
    if (!entry) continue;
    const buf = await entry.async('uint8array');
    if (buf.byteLength === 0 || buf.byteLength > 1024 * 1024) continue;
    return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
  }
  return null;
}

/**
 * Page 1개 → CubeList ZIP 빌드.
 */
async function buildCubeListFromPage(zip, sdProfileDir, pageUUID, pageManifest, deviceInfo, deviceHint) {
  const controllers = Array.isArray(pageManifest.Controllers) ? pageManifest.Controllers : [];
  const cubes = [];
  const cubeOrder = [];

  for (let cIdx = 0; cIdx < controllers.length; cIdx++) {
    const controller = controllers[cIdx];
    const actions = controller && controller.Actions ? controller.Actions : {};
    const controllerType =
      cIdx === 0 ? 'main' :
      controller && typeof controller.ControllerType === 'string' ?
        (controller.ControllerType.toLowerCase().includes('dial') ? 'dial' :
         controller.ControllerType.toLowerCase().includes('touch') ? 'touchpad' : 'main') :
      'main';

    for (const [coord, action] of Object.entries(actions)) {
      const [col, row] = coord.split(',').map(Number);
      if (Number.isNaN(col) || Number.isNaN(row)) continue;

      const actionId = action.ActionID || safeId(`${coord}-${action.UUID}`);
      const mappedType = mapActionType(action.UUID);
      const stateZero = Array.isArray(action.States) && action.States[0];

      // 라벨: stateZero.Title > action.Name > UUID 끝부분
      const label =
        (stateZero && typeof stateZero.Title === 'string' && stateZero.Title.length > 0)
          ? stateZero.Title
          : (typeof action.Name === 'string' ? action.Name : (action.UUID || '액션').split('.').pop());

      // 이미지: stateZero.Image > Images/<actionId>.png 폴더
      let icon_url = null;
      if (stateZero && typeof stateZero.Image === 'string' && stateZero.Image.length > 0) {
        // Image 가 절대 경로 (data: 또는 path) 면 그대로, 상대 경로면 zip 에서 추출
        if (stateZero.Image.startsWith('data:')) {
          icon_url = stateZero.Image;
        } else {
          icon_url = await loadActionImageDataUrl(zip, sdProfileDir, `${sdProfileDir}Profiles/${pageUUID}/`, actionId);
        }
      }
      if (!icon_url) {
        icon_url = await loadActionImageDataUrl(zip, sdProfileDir, `${sdProfileDir}Profiles/${pageUUID}/`, actionId);
      }

      // P0 영구 lock 필드
      const title_style = extractTitleStyle(stateZero, action.LinkedTitle);
      const states = extractStates(action.States);

      // sort_order = row * cols + col (그리드 1D 정렬)
      const cols = deviceInfo ? deviceInfo.cols : 5;
      const sort_order = row * cols + col + 1;

      const cubeId = safeId(`${pageUUID.slice(0, 8)}-${col}-${row}`);
      const action_payload = mappedType === 'plugin_action'
        ? {
            plugin_uuid: action.UUID || '',
            action_id: 'default',
            plugin_id: '',
            plugin_dir: '',
            code_path: 'index.html',
            code_kind: 'html',
            pi_path: 'propertyinspector/index.html',
            sidecar_exes: [],
            settings: action.Settings || {},
            payload: {},
          }
        : (action.Settings || {});

      const cube = {
        label,
        icon_url,
        action_type: mappedType,
        action_payload,
        metadata: {
          source: 'streamdeck-profile-import',
          sd_uuid: action.UUID,
          sd_action_id: action.ActionID,
          sd_coord: coord,
          icon_source: icon_url ? 'profile_images' : 'none',
          icon_size_bytes: icon_url ? Math.floor(icon_url.length * 0.75) : 0,
          icon_is_tiny: false,
          icon_is_placeholder: !icon_url,
        },
      };
      if (states) cube.states = states;
      if (title_style) cube.title_style = title_style;
      cube.controller_type = controllerType;

      // streamdeck_meta 원본 보존 (P0 영구 forward-compat)
      cube.streamdeck_meta = {
        UUID: action.UUID,
        ActionID: action.ActionID,
        Controllers: action.Controllers,
        coord,
      };

      cubes.push({ id: cubeId, cube, sort_order });
    }
  }

  // sort_order 정렬
  cubes.sort((a, b) => a.sort_order - b.sort_order);

  // CubeList ZIP 빌드
  const cubelistZip = new JSZip();
  for (let i = 0; i < cubes.length; i++) {
    const c = cubes[i];
    const cubeManifest = {
      rbs_format_version: RBS_FORMAT_VERSION,
      kind: 'cubeone',
      id: c.id,
      license: 'free',
      created_at: NOW,
      updated_at: NOW,
      rbs_min_version: RBS_MIN_VERSION,
      cube: { ...c.cube, sort_order: i + 1 },
    };
    const cubeZip = new JSZip();
    cubeZip.file('manifest.json', JSON.stringify(cubeManifest, null, 2));
    const bytes = await cubeZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    cubelistZip.file(`cubes/${c.id}.cubeone`, bytes);
    cubeOrder.push({ ref: `cubes/${c.id}.cubeone`, sort_order: i + 1 });
  }

  const listManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubelist',
    id: safeId(pageUUID),
    license: 'free',
    created_at: NOW,
    updated_at: NOW,
    rbs_min_version: RBS_MIN_VERSION,
    list: {
      name: pageManifest.Name || `Page ${pageUUID.slice(0, 8)}`,
      sort_order: 1,
      order: cubeOrder,
      grid_layout: deviceHint,
      controller_type: 'main',
      // streamdeck_source forward-compat (원본 Page manifest 일부)
      streamdeck_source: {
        Version: pageManifest.Version,
        Pages: pageManifest.Pages,
      },
    },
  };
  cubelistZip.file('manifest.json', JSON.stringify(listManifest, null, 2));

  return { cubelistZip, cubeCount: cubes.length, listManifest };
}

async function convertProfile(profileZipPath) {
  const buf = await readFile(profileZipPath);
  const zip = await JSZip.loadAsync(buf);

  // sdProfile/ 디렉토리 + 외부 manifest.json 찾기
  const files = Object.keys(zip.files);
  const outerManifestEntry = files.find((f) => /\.sdProfile\/manifest\.json$/i.test(f));
  if (!outerManifestEntry) {
    throw new Error('외부 manifest.json 누락 (sdProfile 구조 아님)');
  }
  const sdProfileDir = outerManifestEntry.replace(/manifest\.json$/i, '');
  const outerManifestBuf = await zip.file(outerManifestEntry).async('uint8array');
  const outerManifest = JSON.parse(new TextDecoder('utf-8').decode(outerManifestBuf));

  const deviceModel = outerManifest.Device?.Model || 'unknown';
  const deviceInfo = DEVICE_MODEL_MAP[deviceModel];
  const deviceHint = deviceInfo ? deviceInfo.hint : 'cubelist_unlimited';
  const profileName = outerManifest.Name || basename(profileZipPath, '.streamDeckProfile');

  // ZIP 내부 Profiles/<id>/manifest.json 모두 스캔 — 외부 Pages.Pages 는 디스플레이 순서일 뿐
  // 실제 페이지 데이터는 모든 하위 폴더에 존재 (각 폴더 = 1 페이지)
  const allPageManifests = files
    .filter((f) => f.startsWith(`${sdProfileDir}Profiles/`) && f.endsWith('manifest.json'))
    .filter((f) => {
      // Profiles/<id>/manifest.json 만 (더 깊은 중첩 X)
      const rel = f.replace(`${sdProfileDir}Profiles/`, '');
      return rel.split('/').length === 2;
    });

  // CubePack ZIP 빌드
  const packZip = new JSZip();
  const lists = [];
  let totalCubes = 0;

  for (let pIdx = 0; pIdx < allPageManifests.length; pIdx++) {
    const pmEntry = allPageManifests[pIdx];
    const pageFolderId = pmEntry
      .replace(`${sdProfileDir}Profiles/`, '')
      .replace('/manifest.json', '');
    const pmFile = zip.file(pmEntry);
    if (!pmFile) continue;
    const pageManifest = JSON.parse(await pmFile.async('text'));
    const pageUUID = pageFolderId;
    const { cubelistZip, cubeCount, listManifest } = await buildCubeListFromPage(
      zip, sdProfileDir, pageUUID, pageManifest, deviceInfo, deviceHint
    );
    const cubelistBytes = await cubelistZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const listRef = `lists/${safeId(pageUUID)}.cubelist`;
    packZip.file(listRef, cubelistBytes);
    lists.push({ ref: listRef, sort_order: pIdx + 1, name: listManifest.list.name, cubeCount });
    totalCubes += cubeCount;
  }

  // Pack manifest
  const packManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubepack',
    id: safeId(outerManifest.Device?.UUID || profileName),
    name: profileName,
    license: 'free',
    created_at: NOW,
    updated_at: NOW,
    rbs_min_version: RBS_MIN_VERSION,
    pack: {
      name: profileName,
      device_hint: deviceHint,
      cubes_per_page_default: deviceInfo ? deviceInfo.cols * deviceInfo.rows : 28,
      lists: lists.map((l, i) => ({
        ref: l.ref,
        sort_order: i + 1,
        name: l.name,
        cube_count: l.cubeCount,
      })),
      streamdeck_source: {
        Device: outerManifest.Device,
        Version: outerManifest.Version,
      },
    },
  };
  packZip.file('manifest.json', JSON.stringify(packManifest, null, 2));

  const packBytes = await packZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

  return {
    profileName,
    deviceHint,
    deviceLabel: deviceInfo?.label || deviceModel,
    pageCount: lists.length,
    totalCubes,
    packBytes,
  };
}

async function main() {
  console.log(`입력: ${INPUT_ROOT}`);
  console.log(`출력: ${OUTPUT_ROOT}`);
  await mkdir(OUTPUT_ROOT, { recursive: true });

  const entries = await readdir(INPUT_ROOT);
  const profileFiles = entries
    .filter((e) => e.toLowerCase().endsWith('.streamdeckprofile'))
    .map((e) => join(INPUT_ROOT, e));

  console.log(`\n.streamDeckProfile 파일 ${profileFiles.length}개 발견:\n`);

  const summary = [];
  let totalCubesAll = 0;

  for (const file of profileFiles) {
    const name = basename(file);
    try {
      const result = await convertProfile(file);
      const outName = `${safeFolderName(result.profileName)}.cubepack`;
      await writeFile(join(OUTPUT_ROOT, outName), result.packBytes);
      summary.push({
        profile: result.profileName,
        device: result.deviceLabel,
        device_hint: result.deviceHint,
        pages: result.pageCount,
        cubes: result.totalCubes,
        output: outName,
      });
      totalCubesAll += result.totalCubes;
      console.log(`  ✓ ${result.profileName} [${result.deviceLabel}]: ${result.pageCount} 페이지 / ${result.totalCubes} 큐브 → ${outName}`);
    } catch (e) {
      console.warn(`  ✗ ${name}: ${e.message}`);
      summary.push({ profile: name, error: e.message });
    }
  }

  const report = {
    converted_at: NOW,
    input: INPUT_ROOT,
    output: OUTPUT_ROOT,
    total_profiles: profileFiles.length,
    total_cubes: totalCubesAll,
    items: summary,
  };
  await writeFile(join(OUTPUT_ROOT, 'profile-report.json'), JSON.stringify(report, null, 2));

  console.log(`\n=== 완료 ===`);
  console.log(`총 .cubepack 파일: ${summary.filter((s) => !s.error).length}`);
  console.log(`총 큐브: ${totalCubesAll}`);
  console.log(`산출: ${OUTPUT_ROOT}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
