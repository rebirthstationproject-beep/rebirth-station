/**
 * StreamDeck .streamDeckPlugin → 큐브 (.cubeone × N) 변환기.
 *
 * frontend TS 포팅 — scripts/import-streamdeck-plugins.mjs 의 핵심 로직과 동일.
 * - vendor 원본 이미지 그대로 추출 (base64 data URL 인라인)
 * - 매칭 우선순위: .svg > @3x.png > @2x.png > .png(≥1.5KB) > 원본 > 작은 .png
 * - 이미지 소스 우선순위: States[0].Image > Action.Icon > plugin Icon
 * - 암호화 manifest (ELGATO 매직) 는 en.json 평문 fallback
 *
 * 반환 결과를 Tauri write_library_file 로 라이브러리 폴더에 저장.
 */

import JSZip from 'jszip';

const RBS_FORMAT_VERSION = 3;
const RBS_MIN_VERSION = '0.1.0';

const ACTION_TYPE_MAP: Record<string, string> = {
  'com.elgato.streamdeck.system.website': 'link',
  'com.elgato.streamdeck.system.open': 'app_launch',
  'com.elgato.streamdeck.system.openapp': 'app_launch',
  'com.elgato.streamdeck.system.hotkey': 'shortcut',
  'com.elgato.streamdeck.system.text': 'text_insert',
};

const MAX_IMAGE_BYTES = 1024 * 1024;
const PNG_MIN_BYTES = 1500;

export interface ConvertedCubeFile {
  filename: string; // <폴더>NN.cubeone
  bytes: Uint8Array;
}

export interface ConvertResult {
  folderName: string;
  pluginName: string;
  cubes: ConvertedCubeFile[];
  fallback: boolean;
  iconSources: Record<string, number>;
  warnings: string[];
}

export class PluginConvertError extends Error {}

interface ManifestAction {
  UUID?: string;
  Name?: string;
  Tooltip?: string;
  Icon?: string;
  States?: { Image?: string }[];
}

interface PluginManifest {
  Name?: string;
  Author?: string;
  Description?: string;
  Icon?: string;
  Actions?: ManifestAction[];
}

interface IconLookup {
  dataUrl: string | null;
  source: string | null;
}

function safeFolderName(s: string): string {
  return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim().slice(0, 100);
}

function safeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pluginStemFromFilename(filename: string): string {
  let stem = filename.replace(/\.streamDeckPlugin$/i, '');
  const versionPos = stem.search(/-\d/);
  if (versionPos > 0) stem = stem.slice(0, versionPos);
  return stem.trim();
}

function sniffMime(buf: Uint8Array): string {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf.length >= 5 && buf[0] === 0x3c) return 'image/svg+xml';
  return 'image/png';
}

function bytesToBase64(buf: Uint8Array): string {
  // 브라우저 환경: btoa(String.fromCharCode(...)) — 큰 배열은 청크
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(binary);
}

function makeDataUrl(buf: Uint8Array, mime: string): string {
  return `data:${mime};base64,${bytesToBase64(buf)}`;
}

async function loadIconAsDataUrl(zip: JSZip, pluginDir: string, iconRef: string | null | undefined): Promise<IconLookup> {
  if (!iconRef) return { dataUrl: null, source: null };
  const sharp: { suffix: string; mime: string }[] = [
    { suffix: '.svg', mime: 'image/svg+xml' },
    { suffix: '@3x.png', mime: 'image/png' },
    { suffix: '@2x.png', mime: 'image/png' },
  ];
  for (const { suffix, mime } of sharp) {
    const entry = zip.file(`${pluginDir}${iconRef}${suffix}`);
    if (!entry) continue;
    const buf = await entry.async('uint8array');
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) continue;
    return { dataUrl: makeDataUrl(buf, mime), source: suffix };
  }
  const oneX = zip.file(`${pluginDir}${iconRef}.png`);
  if (oneX) {
    const buf = await oneX.async('uint8array');
    if (buf.byteLength >= PNG_MIN_BYTES && buf.byteLength <= MAX_IMAGE_BYTES) {
      return { dataUrl: makeDataUrl(buf, 'image/png'), source: '.png' };
    }
  }
  const raw = zip.file(`${pluginDir}${iconRef}`);
  if (raw) {
    const buf = await raw.async('uint8array');
    if (buf.byteLength >= 200 && buf.byteLength <= MAX_IMAGE_BYTES) {
      return { dataUrl: makeDataUrl(buf, sniffMime(buf)), source: 'raw' };
    }
  }
  if (oneX) {
    const buf = await oneX.async('uint8array');
    if (buf.byteLength > 0 && buf.byteLength <= MAX_IMAGE_BYTES) {
      return { dataUrl: makeDataUrl(buf, 'image/png'), source: '.png(small)' };
    }
  }
  return { dataUrl: null, source: null };
}

async function buildFallbackManifest(
  zip: JSZip,
  pluginDir: string,
  zipFilename?: string,
): Promise<{ manifest: PluginManifest; pluginDir: string; fallback: true }> {
  const enEntry = zip.file(`${pluginDir}en.json`);
  const fileStem = zipFilename ? pluginStemFromFilename(zipFilename) : null;
  const imageFiles = Object.keys(zip.files).filter(
    (f) => /\.(svg|png|jpg|jpeg|gif)$/i.test(f) && f.startsWith(pluginDir),
  );

  function bestImageForAction(actionSlug: string): string | null {
    const lower = actionSlug.toLowerCase();
    const matches = imageFiles.filter((f) => f.toLowerCase().includes(lower));
    if (matches.length === 0) return null;
    const at2x = matches.find((f) => /@2x\.png$/i.test(f));
    if (at2x) return at2x;
    const svg = matches.find((f) => /\.svg$/i.test(f));
    if (svg) return svg;
    const png = matches.find((f) => /\.png$/i.test(f) && !/@2x/.test(f));
    if (png) return png;
    return matches[0];
  }

  let pluginNameFromEn: string | null = null;
  let authorFromEn: string | null = null;
  let descFromEn: string | null = null;
  let en: Record<string, unknown> | null = null;
  if (enEntry) {
    try {
      en = JSON.parse(await enEntry.async('text'));
      if (typeof en?.Name === 'string' && en.Name.length > 0) pluginNameFromEn = en.Name;
      if (typeof en?.Author === 'string') authorFromEn = en.Author;
      if (typeof en?.Description === 'string') descFromEn = en.Description;
    } catch {
      /* ignore */
    }
  }
  const name = pluginNameFromEn || fileStem || pluginDir.replace(/\.sdPlugin\/$/i, '').split('/').pop() || 'Plugin';

  const actions: ManifestAction[] = [];
  if (en) {
    for (const [key, val] of Object.entries(en)) {
      if (typeof key !== 'string' || !key.startsWith('com.') || key.split('.').length < 3) continue;
      if (!val || typeof val !== 'object') continue;
      const actionObj = val as { Name?: unknown; Tooltip?: unknown };
      if (typeof actionObj.Name !== 'string') continue;
      const actionSlug = key.split('.').pop()!;
      const candidates = [
        `imgs/${actionSlug}/icon`,
        `imgs/actions/${actionSlug}/icon`,
        `imgs/${actionSlug}`,
        `imgs/plugin/${actionSlug}`,
      ];
      let iconRef: string | null = null;
      for (const c of candidates) {
        const probe = zip.file(`${pluginDir}${c}@2x.png`) ||
                      zip.file(`${pluginDir}${c}.png`) ||
                      zip.file(`${pluginDir}${c}.svg`);
        if (probe) { iconRef = c; break; }
      }
      if (!iconRef) {
        const found = bestImageForAction(actionSlug);
        if (found) {
          iconRef = found.replace(pluginDir, '').replace(/\.(svg|png|jpg|jpeg|gif)$/i, '').replace(/@\dx$/i, '');
        }
      }
      actions.push({
        UUID: key,
        Name: actionObj.Name,
        Tooltip: typeof actionObj.Tooltip === 'string' ? actionObj.Tooltip : undefined,
        Icon: iconRef ?? undefined,
        States: iconRef ? [{ Image: iconRef }] : [],
      });
    }
  }

  let pluginIcon = 'imgs/plugin/category';
  if (!zip.file(`${pluginDir}${pluginIcon}@2x.png`) && !zip.file(`${pluginDir}${pluginIcon}.png`)) {
    const first = imageFiles[0];
    if (first) pluginIcon = first.replace(pluginDir, '').replace(/\.(svg|png|jpg|jpeg|gif)$/i, '').replace(/@\dx$/i, '');
  }

  return {
    manifest: {
      Name: name,
      Author: authorFromEn ?? 'StreamDeck',
      Description: descFromEn ?? '',
      Icon: pluginIcon,
      Actions: actions,
    },
    pluginDir,
    fallback: true,
  };
}

async function readPluginManifest(
  zip: JSZip,
  zipFilename?: string,
): Promise<{ manifest: PluginManifest; pluginDir: string; fallback: boolean }> {
  const files = Object.keys(zip.files);
  const manifestEntry = files.find((f) => /\.sdPlugin\/manifest\.json$/i.test(f));
  if (!manifestEntry) {
    const enEntry = files.find((f) => /\.sdPlugin\/en\.json$/i.test(f));
    if (enEntry) {
      const pluginDir = enEntry.replace(/en\.json$/i, '');
      return buildFallbackManifest(zip, pluginDir, zipFilename);
    }
    throw new PluginConvertError('manifest.json 또는 en.json 둘 다 누락');
  }
  const buf = await zip.file(manifestEntry)!.async('uint8array');
  const pluginDir = manifestEntry.replace(/manifest\.json$/i, '');
  // ELGATO 매직 6 바이트
  if (
    buf.length >= 6 &&
    buf[0] === 0x45 && buf[1] === 0x4c && buf[2] === 0x47 &&
    buf[3] === 0x41 && buf[4] === 0x54 && buf[5] === 0x4f
  ) {
    return buildFallbackManifest(zip, pluginDir, zipFilename);
  }
  const text = new TextDecoder('utf-8').decode(buf);
  return { manifest: JSON.parse(text) as PluginManifest, pluginDir, fallback: false };
}

function mapActionType(uuid: string | undefined): string {
  return (uuid && ACTION_TYPE_MAP[uuid]) ?? 'plugin_action';
}

function buildActionPayload(uuid: string | undefined, mappedType: string): Record<string, unknown> {
  if (mappedType === 'plugin_action') {
    return { plugin_uuid: uuid ?? '', action_id: 'default', payload: {} };
  }
  switch (mappedType) {
    case 'link': return { url: '' };
    case 'app_launch': return { path: '', args: [] };
    case 'shortcut': return { keys: [] };
    case 'text_insert': return { text: '' };
    default: return {};
  }
}

async function buildCubeOneZipBytes(
  zip: JSZip,
  pluginDir: string,
  action: ManifestAction,
  defaultIconUrl: string | null,
  iconStats: Record<string, number>,
): Promise<Uint8Array> {
  const id = safeId(action.UUID ?? action.Name ?? 'action');
  const label = action.Name ?? id;
  const mappedType = mapActionType(action.UUID);
  const stateImage = Array.isArray(action.States) ? action.States[0]?.Image : null;
  let iconUrl: string | null = null;
  let iconSource = 'none';
  if (stateImage) {
    const r = await loadIconAsDataUrl(zip, pluginDir, stateImage);
    if (r.dataUrl) { iconUrl = r.dataUrl; iconSource = `state${r.source}`; }
  }
  if (!iconUrl && action.Icon) {
    const r = await loadIconAsDataUrl(zip, pluginDir, action.Icon);
    if (r.dataUrl) { iconUrl = r.dataUrl; iconSource = `action_icon${r.source}`; }
  }
  if (!iconUrl) {
    iconUrl = defaultIconUrl;
    iconSource = defaultIconUrl ? 'plugin_icon_fallback' : 'none';
  }
  iconStats[iconSource] = (iconStats[iconSource] ?? 0) + 1;

  const now = new Date().toISOString();
  const cube = {
    label,
    icon_url: iconUrl,
    action_type: mappedType,
    action_payload: buildActionPayload(action.UUID, mappedType),
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
    created_at: now,
    updated_at: now,
    rbs_min_version: RBS_MIN_VERSION,
    cube,
  };
  const out = new JSZip();
  out.file('manifest.json', JSON.stringify(manifest, null, 2));
  return out.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

/**
 * .streamDeckPlugin (ArrayBuffer) → 변환 결과.
 *
 * 폴더명 = manifest.Name (또는 파일명 stem 폴백) 의 safeFolderName.
 * 각 액션 → <폴더>NN.cubeone.
 * 액션 0개 또는 ZIP 깨짐 → placeholder 큐브 1개.
 */
export async function convertPlugin(
  pluginBuffer: ArrayBuffer,
  zipFilename: string,
): Promise<ConvertResult> {
  const warnings: string[] = [];
  const iconStats: Record<string, number> = {};
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(pluginBuffer);
  } catch (e) {
    // ZIP 자체 파싱 실패 → placeholder
    const stem = pluginStemFromFilename(zipFilename).replace(/[-_.\d]+$/, '');
    const folderName = safeFolderName(stem || zipFilename);
    const placeholder = await buildPlaceholderCubeOne(folderName, `ZIP 깨짐: ${(e as Error).message}`);
    warnings.push(`ZIP 파싱 실패: ${(e as Error).message}`);
    return {
      folderName,
      pluginName: stem,
      cubes: [{ filename: `${folderName}01.cubeone`, bytes: placeholder }],
      fallback: false,
      iconSources: { unreadable: 1 },
      warnings,
    };
  }
  let manifestResult;
  try {
    manifestResult = await readPluginManifest(zip, zipFilename);
  } catch (e) {
    const stem = pluginStemFromFilename(zipFilename).replace(/[-_.\d]+$/, '');
    const folderName = safeFolderName(stem || zipFilename);
    const placeholder = await buildPlaceholderCubeOne(folderName, `manifest 누락: ${(e as Error).message}`);
    warnings.push((e as Error).message);
    return {
      folderName,
      pluginName: stem,
      cubes: [{ filename: `${folderName}01.cubeone`, bytes: placeholder }],
      fallback: false,
      iconSources: { unreadable: 1 },
      warnings,
    };
  }
  const { manifest, pluginDir, fallback } = manifestResult;
  const pluginName = manifest.Name ?? pluginStemFromFilename(zipFilename);
  const folderName = safeFolderName(pluginName);
  const pluginIconResult = await loadIconAsDataUrl(zip, pluginDir, manifest.Icon);
  const pluginIconUrl = pluginIconResult.dataUrl;
  const actions = Array.isArray(manifest.Actions) ? manifest.Actions : [];

  const cubes: ConvertedCubeFile[] = [];
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    try {
      const bytes = await buildCubeOneZipBytes(zip, pluginDir, action, pluginIconUrl, iconStats);
      cubes.push({ filename: `${folderName}${pad2(i + 1)}.cubeone`, bytes });
    } catch (e) {
      warnings.push(`action ${action.UUID ?? '?'} 변환 실패: ${(e as Error).message}`);
    }
  }
  if (cubes.length === 0) {
    const placeholder = await buildPlaceholderCubeOne(folderName, '액션 0개');
    cubes.push({ filename: `${folderName}01.cubeone`, bytes: placeholder });
    iconStats['placeholder_empty'] = (iconStats['placeholder_empty'] ?? 0) + 1;
    warnings.push('actions[] 비어있음 — placeholder 큐브 1개 생성');
  }
  return { folderName, pluginName, cubes, fallback, iconSources: iconStats, warnings };
}

async function buildPlaceholderCubeOne(folderName: string, reason: string): Promise<Uint8Array> {
  const now = new Date().toISOString();
  const manifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubeone',
    id: safeId(`${folderName}-placeholder`),
    license: 'free',
    created_at: now,
    updated_at: now,
    rbs_min_version: RBS_MIN_VERSION,
    cube: {
      label: folderName,
      icon_url: null,
      action_type: 'plugin_action',
      action_payload: { plugin_uuid: '', action_id: 'placeholder', payload: {} },
      metadata: { source: 'streamdeck-import', placeholder_reason: reason },
    },
  };
  const z = new JSZip();
  z.file('manifest.json', JSON.stringify(manifest, null, 2));
  return z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
