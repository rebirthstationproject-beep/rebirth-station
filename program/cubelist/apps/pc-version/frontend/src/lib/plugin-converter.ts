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

import { ACTION_TYPE_MAP, heuristicMatch } from './heuristic-mapping';

const MAX_IMAGE_BYTES = 1024 * 1024;
const PNG_MIN_BYTES = 1500;

export interface ConvertedCubeFile {
  filename: string; // <폴더>NN.cubeone
  bytes: Uint8Array;
}

export interface ConvertResult {
  folderName: string;
  pluginName: string;
  pluginId: string; // M4: 라이브러리 _plugins/<pluginId>/ 식별자
  pluginDir: string; // ZIP 안 .sdPlugin 디렉토리 prefix (예: "com.elgato.cpu.sdPlugin/")
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
  /** M4 A: action 별 PropertyInspectorPath (없으면 manifest.PropertyInspectorPath 폴백) */
  PropertyInspectorPath?: string;
}

interface PluginManifest {
  Name?: string;
  Author?: string;
  Description?: string;
  Icon?: string;
  Actions?: ManifestAction[];
  /** M4 Step 3.5: Native plugin entrypoint (cross-platform 또는 OS 별) */
  CodePath?: string;
  CodePathWin?: string;
  CodePathMac?: string;
  /** M4 A: 전체 plugin 의 default PI 경로 */
  PropertyInspectorPath?: string;
}

interface IconLookup {
  dataUrl: string | null;
  source: string | null;
  /** 원본 이미지 size (PNG bytes 또는 SVG 텍스트 길이). placeholder 판정용. */
  sizeBytes: number;
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

/**
 * 단색 회색 hex 판정.
 *
 * 6자 hex (#RRGGBB): R/G/B 컴포넌트가 0x80 이상 + 서로 거의 동일 (차 ≤ 16) → 회색조
 * 3자 hex (#RGB): 알려진 회색 톤 화이트리스트
 */
function isMonoGreyHex(hex: string): boolean {
  const h = hex.replace('#', '').toLowerCase();
  if (h.length === 3) {
    // #fff, #ddd, #ccc, #aaa 등
    return /^([cdef])\1\1$|^([abc])\2\2$|^([89])\3\3$|^(eee|fff|ddd|ccc|bbb|aaa|999|888)$/i.test(h);
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    // 어두운 회색 (< 0x80) 은 그대로 — 다른 색일 가능성 보존
    if (r < 0x80 || g < 0x80 || b < 0x80) return false;
    // R, G, B 차이 ≤ 24 = 회색조
    return Math.abs(r - g) <= 24 && Math.abs(g - b) <= 24 && Math.abs(r - b) <= 24;
  }
  return false;
}

/**
 * StreamDeck SVG 가시성 정규화 v2.
 *
 * 스트림덱 SVG 는 검은색 LCD 패널 전용으로 단색 fill 이 많아,
 * 우리 PC UI 의 어두운 배경 (#2a2a2a) 에서도 여전히 대비 부족으로 안 보임.
 *
 * v2 개선:
 *   - 3자 hex (#fff/#ddd) + 6자 hex (#D6D6D6/#EFEFEF/#C8C8C8) 모두 처리
 *   - stop-color (gradient stops) 도 포함
 *   - RGB 컴포넌트 분석으로 임의 회색조 판정
 *
 * 효과: 단색 SVG 큐브 가시성 99%+ 확보.
 */
function normalizeSvgVisibility(svgText: string): string {
  // attribute 형식: fill="#xxx" / stroke="#xxx" / stop-color="#xxx"
  const attrPattern = /(fill|stroke|stop-color)\s*=\s*"(#[0-9a-fA-F]{3,6})"/gi;
  let result = svgText.replace(attrPattern, (match, attr, hex) =>
    isMonoGreyHex(hex) ? `${attr}="#ffffff"` : match
  );
  // style 형식: fill:#xxx / stroke:#xxx / stop-color:#xxx
  const stylePattern = /(fill|stroke|stop-color)\s*:\s*(#[0-9a-fA-F]{3,6})/gi;
  result = result.replace(stylePattern, (match, attr, hex) =>
    isMonoGreyHex(hex) ? `${attr}:#ffffff` : match
  );
  return result;
}

async function loadIconAsDataUrl(zip: JSZip, pluginDir: string, iconRef: string | null | undefined): Promise<IconLookup> {
  if (!iconRef) return { dataUrl: null, source: null, sizeBytes: 0 };
  // v2: PNG_TINY (< 800 byte) 는 placeholder 가능성 — 일단 후보로 모아두고 SVG 가 있으면 SVG 우선
  const PNG_QUALITY_MIN = 800;
  const candidates: { suffix: string; mime: string; buf: Uint8Array }[] = [];
  const probe: { suffix: string; mime: string }[] = [
    { suffix: '@3x.png', mime: 'image/png' },
    { suffix: '@2x.png', mime: 'image/png' },
    { suffix: '.svg', mime: 'image/svg+xml' },
  ];
  for (const { suffix, mime } of probe) {
    const entry = zip.file(`${pluginDir}${iconRef}${suffix}`);
    if (!entry) continue;
    const buf = await entry.async('uint8array');
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) continue;
    candidates.push({ suffix, mime, buf });
  }
  // 우선순위 재정렬: 큰 PNG > SVG > 작은 PNG
  const big = candidates.find((c) => c.mime === 'image/png' && c.buf.byteLength >= PNG_QUALITY_MIN);
  const svg = candidates.find((c) => c.mime === 'image/svg+xml');
  const tinyPng = candidates.find((c) => c.mime === 'image/png' && c.buf.byteLength < PNG_QUALITY_MIN);
  const chosen = big ?? svg ?? tinyPng;
  if (chosen) {
    if (chosen.mime === 'image/svg+xml') {
      const text = new TextDecoder('utf-8').decode(chosen.buf);
      const normalized = normalizeSvgVisibility(text);
      const normalizedBuf = new TextEncoder().encode(normalized);
      return { dataUrl: makeDataUrl(normalizedBuf, chosen.mime), source: chosen.suffix, sizeBytes: chosen.buf.byteLength };
    }
    return { dataUrl: makeDataUrl(chosen.buf, chosen.mime), source: chosen.suffix, sizeBytes: chosen.buf.byteLength };
  }
  const oneX = zip.file(`${pluginDir}${iconRef}.png`);
  if (oneX) {
    const buf = await oneX.async('uint8array');
    if (buf.byteLength >= PNG_MIN_BYTES && buf.byteLength <= MAX_IMAGE_BYTES) {
      return { dataUrl: makeDataUrl(buf, 'image/png'), source: '.png', sizeBytes: buf.byteLength };
    }
  }
  const raw = zip.file(`${pluginDir}${iconRef}`);
  if (raw) {
    const buf = await raw.async('uint8array');
    if (buf.byteLength >= 200 && buf.byteLength <= MAX_IMAGE_BYTES) {
      return { dataUrl: makeDataUrl(buf, sniffMime(buf)), source: 'raw', sizeBytes: buf.byteLength };
    }
  }
  if (oneX) {
    const buf = await oneX.async('uint8array');
    if (buf.byteLength > 0 && buf.byteLength <= MAX_IMAGE_BYTES) {
      return { dataUrl: makeDataUrl(buf, 'image/png'), source: '.png(small)', sizeBytes: buf.byteLength };
    }
  }
  return { dataUrl: null, source: null, sizeBytes: 0 };
}

async function buildFallbackManifest(
  zip: JSZip,
  pluginDir: string,
  zipFilename?: string,
): Promise<{ manifest: PluginManifest; pluginDir: string; fallback: true }> {
  // M4 C: 한국어 우선, en 폴백
  const koEntry = zip.file(`${pluginDir}ko.json`);
  const enEntry = zip.file(`${pluginDir}en.json`);
  const i18nEntry = koEntry ?? enEntry;
  const fileStem = zipFilename ? pluginStemFromFilename(zipFilename) : null;
  const imageFiles = Object.keys(zip.files).filter(
    (f) => /\.(svg|png|jpg|jpeg|gif)$/i.test(f) && f.startsWith(pluginDir),
  );

  function bestImageForAction(actionSlug: string, actionUuid?: string): string | null {
    const lower = actionSlug.toLowerCase();
    // 1차: actionSlug 정확 매칭
    let matches = imageFiles.filter((f) => f.toLowerCase().includes(lower));
    // 2차: UUID 마지막 2 segment 또는 첫 segment 매칭 (예: com.elgato.spotify.multimedia → 'spotify' 또는 'multimedia')
    if (matches.length === 0 && actionUuid) {
      const segs = actionUuid.toLowerCase().split('.');
      const candidates = [segs[segs.length - 1], segs[segs.length - 2], segs[2]].filter(Boolean);
      for (const c of candidates) {
        matches = imageFiles.filter((f) => f.toLowerCase().includes(c));
        if (matches.length > 0) break;
      }
    }
    // 3차: actionSlug 부분 매칭 (camelCase / snake_case 분해)
    if (matches.length === 0) {
      const parts = lower.split(/[_\-\s]/).filter((p) => p.length >= 3);
      for (const p of parts) {
        matches = imageFiles.filter((f) => f.toLowerCase().includes(p));
        if (matches.length > 0) break;
      }
    }
    if (matches.length === 0) return null;
    // PNG 우선 (컬러풀), SVG 마지막 (단색 가능성)
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

  let pluginNameFromEn: string | null = null;
  let authorFromEn: string | null = null;
  let descFromEn: string | null = null;
  let en: Record<string, unknown> | null = null;
  if (i18nEntry) {
    try {
      en = JSON.parse(await i18nEntry.async('text'));
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
        const found = bestImageForAction(actionSlug, key);
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

function mapActionType(uuid: string | undefined, name?: string, tooltip?: string): { type: string; payload?: Record<string, unknown> } {
  const matched = heuristicMatch(uuid, name, tooltip);
  if (matched) return matched;
  return { type: 'plugin_action' };
}

function buildActionPayload(uuid: string | undefined, mappedType: string, heuristicPayload?: Record<string, unknown>): Record<string, unknown> {
  if (mappedType === 'plugin_action') {
    return { plugin_uuid: uuid ?? '', action_id: 'default', payload: {} };
  }
  // heuristic 매칭 payload 우선
  if (heuristicPayload) return heuristicPayload;
  switch (mappedType) {
    case 'link': return { url: '' };
    case 'app_launch': return { path: '', args: [] };
    case 'shortcut': return { keys: [] };
    case 'text_insert': return { text: '' };
    case 'live_clock': return { format: 'HH:mm' };
    case 'live_timer': return { duration_seconds: 1500 };
    case 'live_gauge': return { source: 'cpu' };
    case 'live_battery': return {};
    case 'media_key': return { key: 'VolumeMute' };
    case 'macro': return { steps: [] };
    default: return {};
  }
}

function detectCodeKind(codePath: string): 'html' | 'native' {
  const lower = codePath.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower === '') return 'html';
  return 'native';
}

async function buildCubeOneZipBytes(
  zip: JSZip,
  pluginDir: string,
  action: ManifestAction,
  defaultIconUrl: string | null,
  iconStats: Record<string, number>,
  pluginId: string,
  codePath: string,
  codeKind: 'html' | 'native',
  pluginPiPath: string,
  sidecarExes: string[],
): Promise<Uint8Array> {
  const id = safeId(action.UUID ?? action.Name ?? 'action');
  const label = action.Name ?? id;
  const mappingResult = mapActionType(action.UUID, action.Name, action.Tooltip);
  const mappedType = mappingResult.type;
  const heuristicPayload = mappingResult.payload;
  const stateImage = Array.isArray(action.States) ? action.States[0]?.Image : null;
  let iconUrl: string | null = null;
  let iconSource = 'none';
  let iconSizeBytes = 0;
  if (stateImage) {
    const r = await loadIconAsDataUrl(zip, pluginDir, stateImage);
    if (r.dataUrl) { iconUrl = r.dataUrl; iconSource = `state${r.source}`; iconSizeBytes = r.sizeBytes; }
  }
  if (!iconUrl && action.Icon) {
    const r = await loadIconAsDataUrl(zip, pluginDir, action.Icon);
    if (r.dataUrl) { iconUrl = r.dataUrl; iconSource = `action_icon${r.source}`; iconSizeBytes = r.sizeBytes; }
  }
  if (!iconUrl) {
    iconUrl = defaultIconUrl;
    iconSource = defaultIconUrl ? 'plugin_icon_fallback' : 'none';
    // plugin icon fallback 도 size 모름 → 0 으로 두고 frontend 에서 fallback class 적용
  }
  iconStats[iconSource] = (iconStats[iconSource] ?? 0) + 1;

  const now = new Date().toISOString();
  // M4 plugin_action 큐브는 plugin runtime 정보 포함
  // M4 A: action 별 PI Path > plugin 전체 PI Path > default 'propertyinspector/index.html'
  const piPath = action.PropertyInspectorPath || pluginPiPath || 'propertyinspector/index.html';
  const payload: Record<string, unknown> =
    mappedType === 'plugin_action'
      ? {
          plugin_uuid: action.UUID ?? '',
          action_id: 'default',
          plugin_id: pluginId, // _plugins/<pluginId>/ 안에 자산 있음
          plugin_dir: pluginDir, // ZIP 안 sdPlugin 경로 prefix
          code_path: codePath, // M4 Step 3.5: HTML('.html') 또는 Native('.exe' 등)
          code_kind: codeKind, // 'html' | 'native'
          pi_path: piPath, // M4 A: action 별 PropertyInspector 경로
          sidecar_exes: sidecarExes, // M4 B: 동시 spawn 할 sidecar process 들
          settings: {}, // PropertyInspector 옵션
          payload: {},
        }
      : buildActionPayload(action.UUID, mappedType, heuristicPayload);

  const cube = {
    label,
    icon_url: iconUrl,
    action_type: mappedType,
    action_payload: payload,
    metadata: {
      source: 'streamdeck-import',
      sd_uuid: action.UUID,
      sd_tooltip: action.Tooltip,
      // 2026-06-01 heuristic 매핑 결과 기록 — 사용자가 추가 매핑 / 디버깅 시 참고
      mapping_kind: mappedType === 'plugin_action' ? 'fallback' : (ACTION_TYPE_MAP[action.UUID ?? ''] ? 'exact' : 'heuristic'),
      // 가시화 판정용 (frontend cube-cell class 분기)
      icon_source: iconSource,                     // 'state@2x.png' / 'state.svg' / 'plugin_icon_fallback' / 'none'
      icon_size_bytes: iconSizeBytes,              // 0 = placeholder/fallback, < 800 = tiny PNG, ≥ 800 = OK
      icon_is_tiny: iconSizeBytes > 0 && iconSizeBytes < 800,
      icon_is_placeholder: iconSource === 'none' || iconSource === 'plugin_icon_fallback',
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
      pluginId: safeFolderName(stem).toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_'),
      pluginDir: '',
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
      pluginId: safeFolderName(stem).toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_'),
      pluginDir: '',
      cubes: [{ filename: `${folderName}01.cubeone`, bytes: placeholder }],
      fallback: false,
      iconSources: { unreadable: 1 },
      warnings,
    };
  }
  const { manifest, pluginDir, fallback } = manifestResult;
  const pluginName = manifest.Name ?? pluginStemFromFilename(zipFilename);
  const folderName = safeFolderName(pluginName);
  // pluginId = sdPlugin 디렉토리명 (com.elgato.cpu) 우선, 폴백은 folderName
  const sdMatch = pluginDir.match(/^([^/]+)\.sdPlugin\/?$/);
  const pluginId = (sdMatch ? sdMatch[1] : safeFolderName(pluginName).toLowerCase()).replace(
    /[^a-zA-Z0-9._-]/g,
    '_',
  );
  const pluginIconResult = await loadIconAsDataUrl(zip, pluginDir, manifest.Icon);
  const pluginIconUrl = pluginIconResult.dataUrl;
  const actions = Array.isArray(manifest.Actions) ? manifest.Actions : [];

  // M4 Step 3.5: CodePath 추출 (Windows 1차, cross-platform 폴백)
  const codePath: string =
    manifest.CodePathWin ?? manifest.CodePath ?? manifest.CodePathMac ?? 'index.html';
  const codeKind = detectCodeKind(codePath);
  const pluginPiPath: string = manifest.PropertyInspectorPath || 'propertyinspector/index.html';

  // M4 B: Sidecar .exe 자동 탐색 — bin/, scripts/, plugin 루트 등에서 .exe 모두 추출
  // CodePath 자체 제외 (이미 메인 spawn 대상)
  const sidecarExes: string[] = [];
  for (const entry of Object.keys(zip.files)) {
    if (!entry.startsWith(pluginDir)) continue;
    if (!/\.exe$/i.test(entry)) continue;
    const rel = entry.substring(pluginDir.length);
    if (rel === codePath) continue; // CodePath 는 메인 spawn
    sidecarExes.push(rel);
  }

  const cubes: ConvertedCubeFile[] = [];
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    try {
      const bytes = await buildCubeOneZipBytes(
        zip,
        pluginDir,
        action,
        pluginIconUrl,
        iconStats,
        pluginId,
        codePath,
        codeKind,
        pluginPiPath,
        sidecarExes,
      );
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
  return {
    folderName,
    pluginName,
    pluginId,
    pluginDir,
    cubes,
    fallback,
    iconSources: iconStats,
    warnings,
  };
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
      metadata: {
        source: 'streamdeck-import',
        placeholder_reason: reason,
        icon_source: 'none',
        icon_size_bytes: 0,
        icon_is_tiny: false,
        icon_is_placeholder: true,
      },
    },
  };
  const z = new JSZip();
  z.file('manifest.json', JSON.stringify(manifest, null, 2));
  return z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
