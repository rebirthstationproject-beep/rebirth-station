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

async function readPluginManifest(zip, zipFilename) {
  // .sdPlugin 디렉토리 안 manifest.json 탐색
  const files = Object.keys(zip.files);
  const manifestEntry = files.find((f) => /\.sdPlugin\/manifest\.json$/i.test(f));
  if (!manifestEntry) {
    // manifest.json 누락 ZIP — en.json 만으로 fallback 시도
    const enEntry = files.find((f) => /\.sdPlugin\/en\.json$/i.test(f));
    if (enEntry) {
      const pluginDir = enEntry.replace(/en\.json$/i, '');
      return buildFallbackManifest(zip, pluginDir, zipFilename);
    }
    throw new Error('manifest.json not found');
  }
  const buf = await zip.file(manifestEntry).async('uint8array');
  const pluginDir = manifestEntry.replace(/manifest\.json$/i, '');
  // ELGATO 매직(6 byte) → 1st-party 암호화 manifest. en.json 폴백 사용.
  if (
    buf.length >= 6 &&
    buf[0] === 0x45 && buf[1] === 0x4c && buf[2] === 0x47 &&
    buf[3] === 0x41 && buf[4] === 0x54 && buf[5] === 0x4f
  ) {
    return buildFallbackManifest(zip, pluginDir, zipFilename);
  }
  const text = new TextDecoder('utf-8').decode(buf);
  return {
    manifest: JSON.parse(text),
    pluginDir,
    fallback: false,
  };
}

/**
 * ZIP 파일명에서 plugin stem 추출 — 버전/플랫폼 suffix 제거
 * 예: "PowerPoint-3.0.2-mac_windows.streamDeckPlugin" → "PowerPoint"
 *     "Wave Link (Legacy)-2.3.0.120-mac_windows.streamDeckPlugin" → "Wave Link (Legacy)"
 */
function pluginStemFromFilename(filename) {
  let stem = filename.replace(/\.streamDeckPlugin$/i, '');
  // 첫 "-<숫자>" 이전까지
  const versionPos = stem.search(/-\d/);
  if (versionPos > 0) stem = stem.slice(0, versionPos);
  return stem.trim();
}

/**
 * 암호화 manifest 의 평문 fallback.
 *
 * en.json (i18n 평문) 에서 "com.<vendor>.<plugin>.<action>" 키 + Name 추출 →
 * 가상 Actions[] 재구성. Icon 은 imgs/ 하위에서 액션명/UUID 기반 best-match 탐색.
 */
async function buildFallbackManifest(zip, pluginDir, zipFilename) {
  const enEntry = zip.file(`${pluginDir}en.json`);
  const fileStem = zipFilename ? pluginStemFromFilename(zipFilename) : null;

  // ZIP 전체 이미지 인덱스 — fallback action 이미지 탐색 시 사용
  const imageFiles = Object.keys(zip.files).filter((f) =>
    /\.(svg|png|jpg|jpeg|gif)$/i.test(f) && f.startsWith(pluginDir)
  );

  function bestImageForAction(actionSlug, actionUuid) {
    // 우선순위: @2x.png > @3x.png > .png > .svg (PNG 컬러 우선, SVG 마지막)
    const slugLower = actionSlug.toLowerCase();
    // 1차: actionSlug 정확 매칭
    let matches = imageFiles.filter((f) => f.toLowerCase().includes(slugLower));
    // 2차: UUID 마지막/첫 segment 매칭
    if (matches.length === 0 && actionUuid) {
      const segs = actionUuid.toLowerCase().split('.');
      const candidates = [segs[segs.length - 1], segs[segs.length - 2], segs[2]].filter(Boolean);
      for (const c of candidates) {
        matches = imageFiles.filter((f) => f.toLowerCase().includes(c));
        if (matches.length > 0) break;
      }
    }
    // 3차: actionSlug 분해 후 매칭
    if (matches.length === 0) {
      const parts = slugLower.split(/[_\-\s]/).filter((p) => p.length >= 3);
      for (const p of parts) {
        matches = imageFiles.filter((f) => f.toLowerCase().includes(p));
        if (matches.length > 0) break;
      }
    }
    if (matches.length === 0) return null;
    const at2x = matches.find((f) => /@2x\.png$/i.test(f));
    if (at2x) return at2x;
    const at3x = matches.find((f) => /@3x\.png$/i.test(f));
    if (at3x) return at3x;
    const png = matches.find((f) => /\.png$/i.test(f) && !/@\dx/.test(f));
    if (png) return png;
    const svg = matches.find((f) => /\.svg$/i.test(f));
    if (svg) return svg;
    return matches[0];
  }

  // plugin name fallback chain
  let pluginNameFromEn = null;
  let pluginAuthorFromEn = null;
  let pluginDescFromEn = null;
  let en = null;
  if (enEntry) {
    try {
      en = JSON.parse(await enEntry.async('text'));
      if (typeof en.Name === 'string' && en.Name.length > 0) pluginNameFromEn = en.Name;
      if (typeof en.Author === 'string') pluginAuthorFromEn = en.Author;
      if (typeof en.Description === 'string') pluginDescFromEn = en.Description;
    } catch {
      /* en.json 파싱 실패 — 파일명 stem 으로 폴백 */
    }
  }
  const name = pluginNameFromEn || fileStem || pluginDir.replace(/\.sdPlugin\/$/i, '').split('/').pop() || 'Plugin';

  const actions = [];
  if (en) {
    for (const [key, val] of Object.entries(en)) {
      if (typeof key !== 'string' || !key.startsWith('com.') || key.split('.').length < 3) continue;
      if (!val || typeof val !== 'object') continue;
      if (typeof val.Name !== 'string') continue;
      // 액션 imgs 탐색: 정확 candidate → ZIP 전체 글로벌 검색
      const actionSlug = key.split('.').pop();
      const candidates = [
        `imgs/${actionSlug}/icon`,
        `imgs/actions/${actionSlug}/icon`,
        `imgs/${actionSlug}`,
        `imgs/plugin/${actionSlug}`,
      ];
      let iconRef = null;
      for (const c of candidates) {
        const probe = zip.file(`${pluginDir}${c}@2x.png`) ||
                      zip.file(`${pluginDir}${c}.png`) ||
                      zip.file(`${pluginDir}${c}.svg`);
        if (probe) { iconRef = c; break; }
      }
      // 글로벌 검색 폴백 — actionSlug + UUID 다단계 매칭
      if (!iconRef) {
        const found = bestImageForAction(actionSlug, key);
        if (found) {
          // pluginDir 와 확장자 제거 — loadIconAsDataUrl 가 .svg/@2x.png/.png 모두 시도
          const stripped = found.replace(pluginDir, '').replace(/\.(svg|png|jpg|jpeg|gif)$/i, '').replace(/@\dx$/i, '');
          iconRef = stripped;
        }
      }
      actions.push({
        UUID: key,
        Name: val.Name,
        Tooltip: val.Tooltip,
        Icon: iconRef,
        States: iconRef ? [{ Image: iconRef }] : [],
      });
    }
  }

  // plugin 전체 fallback icon — imgs/plugin/category 또는 첫 이미지
  let pluginIcon = 'imgs/plugin/category';
  if (!zip.file(`${pluginDir}${pluginIcon}@2x.png`) && !zip.file(`${pluginDir}${pluginIcon}.png`)) {
    const first = imageFiles[0];
    if (first) {
      pluginIcon = first.replace(pluginDir, '').replace(/\.(svg|png|jpg|jpeg|gif)$/i, '').replace(/@\dx$/i, '');
    }
  }

  return {
    manifest: {
      Name: name,
      Author: pluginAuthorFromEn || 'StreamDeck',
      Description: pluginDescFromEn || '',
      Icon: pluginIcon,
      Actions: actions,
    },
    pluginDir,
    fallback: true,
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
/**
 * SVG 가시성 정규화: StreamDeck 단색 회색 fill → 흰색 (어두운 배경 가시성).
 * plugin-converter.ts 의 normalizeSvgVisibility 와 동일 로직.
 */
function normalizeSvgVisibility(svgText) {
  const monoFills = /(fill|stroke)\s*=\s*"#([cdef][cdef][cdef]|[abc][abc][abc]|[89][89][89]|fff|ddd|ccc|bbb|aaa|999|888|eee)"/gi;
  let result = svgText.replace(monoFills, '$1="#ffffff"');
  const styleFills = /(fill|stroke)\s*:\s*#([cdef][cdef][cdef]|[abc][abc][abc]|[89][89][89]|fff|ddd|ccc|bbb|aaa|999|888|eee)/gi;
  result = result.replace(styleFills, '$1:#ffffff');
  return result;
}

async function loadIconAsDataUrl(zip, pluginDir, iconRef) {
  if (!iconRef) return { dataUrl: null, source: null };
  const MAX_BYTES = 1024 * 1024;
  const PNG_MIN_BYTES = 1500; // placeholder PNG (32x32 단색) 회피
  // 우선순위: PNG (@3x/@2x) 컬러풀세트 > SVG 단색 (정규화 후)
  const sharp = [
    { suffix: '@3x.png', mime: 'image/png' },
    { suffix: '@2x.png', mime: 'image/png' },
    { suffix: '.svg', mime: 'image/svg+xml' },
  ];
  for (const { suffix, mime } of sharp) {
    const full = `${pluginDir}${iconRef}${suffix}`;
    const entry = zip.file(full);
    if (!entry) continue;
    const buf = await entry.async('uint8array');
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) continue;
    if (mime === 'image/svg+xml') {
      const text = new TextDecoder('utf-8').decode(buf);
      const normalized = normalizeSvgVisibility(text);
      const normalizedBuf = new TextEncoder().encode(normalized);
      return { dataUrl: makeDataUrl(normalizedBuf, mime), source: suffix };
    }
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
  const { manifest: pluginManifest, pluginDir, fallback } = await readPluginManifest(zip, basename(pluginZipPath));

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

  return { pluginName, cubelist, cubeCount, mapStats, listManifest, fallback: !!fallback };
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
      const fallback = built.fallback;
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

      // 액션 0개 폴백 — 폴더는 생성하되 plugin icon 으로 placeholder 큐브 1개
      if (folderCubeCount === 0) {
        const placeholder = {
          rbs_format_version: RBS_FORMAT_VERSION,
          kind: 'cubeone',
          id: safeId(`${built.pluginName}-placeholder`),
          license: 'free',
          created_at: NOW,
          updated_at: NOW,
          rbs_min_version: RBS_MIN_VERSION,
          cube: {
            label: built.pluginName,
            icon_url: null,
            action_type: 'plugin_action',
            action_payload: { plugin_uuid: '', action_id: 'placeholder', payload: {} },
            metadata: { source: 'streamdeck-import', encrypted_manifest: true },
          },
        };
        const z = new JSZip();
        z.file('manifest.json', JSON.stringify(placeholder, null, 2));
        const bytes = await z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
        await writeFile(join(folderPath, `${folderName}01.cubeone`), bytes);
        folderCubeCount = 1;
        totalCubeoneFiles++;
        iconStats['placeholder_empty'] = (iconStats['placeholder_empty'] ?? 0) + 1;
      }

      summary.push({
        plugin: built.pluginName,
        folder: folderName,
        cubes: folderCubeCount,
        mapped: built.mapStats.builtin,
        placeholder: built.mapStats.plugin_action,
        fallback_used: !!fallback,
      });
      totalCubes += folderCubeCount;
      totalBuiltin += built.mapStats.builtin;
      totalPluginAction += built.mapStats.plugin_action;
      console.log(`  ${fallback ? '⚡' : '✓'} ${built.pluginName}: ${folderCubeCount} 큐브 → ${folderName}\\${folderName}01.cubeone .. ${pad2(folderCubeCount)}.cubeone${fallback ? ' (en.json fallback)' : ''}`);
    } catch (e) {
      // ZIP 자체 파싱도 실패한 경우 — plugin 이름만으로 폴더 + 빈 placeholder
      const stem = basename(name, '.streamDeckPlugin').replace(/[-_.\d]+$/, '');
      const folderName = safeFolderName(stem || basename(name));
      const folderPath = join(OUTPUT_ROOT, folderName);
      try {
        await mkdir(folderPath, { recursive: true });
        const placeholder = {
          rbs_format_version: RBS_FORMAT_VERSION,
          kind: 'cubeone',
          id: safeId(`${stem}-unreadable`),
          license: 'free',
          created_at: NOW,
          updated_at: NOW,
          rbs_min_version: RBS_MIN_VERSION,
          cube: {
            label: stem,
            icon_url: null,
            action_type: 'plugin_action',
            action_payload: { plugin_uuid: '', action_id: 'unreadable', payload: {} },
            metadata: { source: 'streamdeck-import', read_error: e.message },
          },
        };
        const z = new JSZip();
        z.file('manifest.json', JSON.stringify(placeholder, null, 2));
        const bytes = await z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
        await writeFile(join(folderPath, `${folderName}01.cubeone`), bytes);
        totalCubeoneFiles++;
        totalCubes++;
        summary.push({
          plugin: stem,
          folder: folderName,
          cubes: 1,
          mapped: 0,
          placeholder: 1,
          read_error: e.message,
        });
        iconStats['unreadable'] = (iconStats['unreadable'] ?? 0) + 1;
        console.log(`  ⚠ ${stem}: 변환 실패 (${e.message}) — placeholder 1개 → ${folderName}\\${folderName}01.cubeone`);
      } catch (e2) {
        console.error(`  ✗ ${name}: 폴더 생성도 실패: ${e2.message}`);
      }
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
