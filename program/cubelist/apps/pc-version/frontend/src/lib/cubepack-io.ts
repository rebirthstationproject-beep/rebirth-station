/**
 * .cubepack ZIP I/O — 모바일 PWA v3 포맷 호환 (M2)
 *
 * 권위 spec: `apps/mobile-pwa/lib/cube-format/spec.ts`
 *
 * v3 구조:
 *   .cubepack (ZIP)
 *     manifest.json   { rbs_format_version: 3, kind: 'cubepack', id, pack: { name, order[] } }
 *     lists/
 *       <list-id>.cubelist (ZIP)
 *         manifest.json   { kind: 'cubelist', id, list: { name, order[] } }
 *         cubes/
 *           <cube-id>.cubeone (ZIP)
 *             manifest.json   { kind: 'cubeone', id, cube: { label, action_type, action_payload, icon_ref? } }
 *             [icon.webp]     (선택)
 *
 * v1·v2 호환은 후속 (M2 후반 또는 M3) — 본 모듈은 v3 인코딩/디코딩만.
 */

import JSZip from 'jszip';
import type { Cube, CubeList, CubePack, CubeActionType } from '../types/cube';

const RBS_FORMAT_VERSION = 3 as const;
const RBS_MIN_VERSION = '0.1.0';

const ACTION_TYPES: ReadonlySet<CubeActionType> = new Set<CubeActionType>([
  // 10 코어
  'link',
  'shortcut',
  'macro',
  'folder',
  'text_insert',
  'clipboard_copy',
  'app_launch',
  'focus_window',
  'mouse_click',
  'plugin_action',
  // P1 11 신규 (Phase 3)
  'media_key',
  'page_navigate',
  'page_jump',
  'folder_up',
  'folder_open',
  'window_close',
  'system_sleep',
  'system_actionbar_toggle',
  'hotkey_toggle',
  'audio_play',
  'profile_rotate',
  // P2 동적 큐브 (Phase 5)
  'live_clock',
  'live_timer',
  'live_gauge',
  'live_battery',
  // P3 동적 큐브 (2026-06-01 통합 모델) — 2026-06-10 검증 누락 정정
  // (Live 데모 .cubeone 8개가 여기서 거부돼 라이브러리 로드 전체 실패했음)
  'live_weather',
  'live_monitor',
  'live_alarm',
  'live_stock',
  'live_calendar',
  'live_news',
  'live_network',
]);

export class CubepackFormatError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CubepackFormatError';
  }
}

// === Export ================================================================

/**
 * CubePack 을 v3 .cubepack ZIP Blob 으로 인코딩.
 * 모바일 PWA `import.ts` 가 이 출력을 읽을 수 있음.
 */
export async function exportCubepack(pack: CubePack): Promise<Blob> {
  const now = new Date().toISOString();
  const zip = new JSZip();

  const packManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubepack' as const,
    id: pack.id,
    license: 'free' as const,
    created_at: now,
    updated_at: now,
    rbs_min_version: RBS_MIN_VERSION,
    pack: {
      name: pack.name,
      ...(pack.category ? { target_persona: [pack.category] } : {}),
      order: pack.lists
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => ({
          ref: `lists/${l.id}.cubelist`,
          sort_order: l.sort_order,
        })),
    },
  };
  zip.file('manifest.json', JSON.stringify(packManifest, null, 2));

  for (const list of pack.lists) {
    const listZip = await buildListZip(list, now);
    const listBlob = await listZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    zip.file(`lists/${list.id}.cubelist`, listBlob);
  }

  // 라이브러리 큐브 (수정 #2 — pack.cubes) 도 보존
  if (pack.cubes && pack.cubes.length > 0) {
    for (const c of pack.cubes) {
      const cubeBlob = await buildCubeZip(c, now).generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
      });
      zip.file(`library/${c.id}.cubeone`, cubeBlob);
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

async function buildListZip(list: CubeList, now: string): Promise<JSZip> {
  const zip = new JSZip();
  const listManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubelist' as const,
    id: list.id,
    license: 'free' as const,
    created_at: now,
    updated_at: now,
    rbs_min_version: RBS_MIN_VERSION,
    list: {
      name: list.name,
      order: list.cubes
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({
          ref: `cubes/${c.id}.cubeone`,
          sort_order: c.sort_order,
        })),
    },
  };
  zip.file('manifest.json', JSON.stringify(listManifest, null, 2));

  for (const cube of list.cubes) {
    const cubeBlob = await buildCubeZip(cube, now).generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
    });
    zip.file(`cubes/${cube.id}.cubeone`, cubeBlob);
  }

  return zip;
}

function buildCubeZip(cube: Cube, now: string): JSZip {
  const zip = new JSZip();
  const cubeManifest = {
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubeone' as const,
    id: cube.id,
    license: 'free' as const,
    created_at: now,
    updated_at: now,
    rbs_min_version: RBS_MIN_VERSION,
    cube: {
      label: cube.label,
      ...(cube.icon_url ? { icon_url: cube.icon_url } : {}),
      action_type: cube.action_type,
      action_payload: cube.action_payload,
      ...(cube.metadata ? { metadata: cube.metadata } : {}),
      ...(cube.title_style ? { title_style: cube.title_style } : {}), // 2026-06-11 라운드트립 보존
    },
  };
  zip.file('manifest.json', JSON.stringify(cubeManifest, null, 2));
  return zip;
}

// === Import ================================================================

/**
 * .cubepack Blob 을 CubePack 으로 디코딩 (v3 only).
 * 모바일 PWA 가 export 한 .cubepack 을 그대로 읽을 수 있음.
 */
export async function importCubepack(input: Blob | ArrayBuffer | Uint8Array): Promise<CubePack> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(input);
  } catch (e) {
    throw new CubepackFormatError('ZIP 컨테이너 파싱 실패 — 손상된 파일 가능', e);
  }

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new CubepackFormatError('manifest.json 누락');

  const manifestText = await manifestFile.async('text');
  const manifest = safeParseJson(manifestText, 'manifest.json');

  if (manifest.rbs_format_version !== 3) {
    throw new CubepackFormatError(
      `v3만 지원 (수신: v${manifest.rbs_format_version}). v1/v2 호환은 후속 업데이트 예정`,
    );
  }
  if (manifest.kind !== 'cubepack') {
    throw new CubepackFormatError(`kind 불일치: 기대 cubepack, 수신 ${manifest.kind}`);
  }

  const packId = requireString(manifest.id, 'manifest.id');
  const packBody = manifest.pack as Record<string, unknown> | undefined;
  if (!packBody) throw new CubepackFormatError('manifest.pack 누락');

  // 2026-06-01: plugin_action 큐브 → builtin 자동 매핑 (importCubepack 도 적용) + icon library fallback
  const { remapPluginActionCube } = await import('./heuristic-mapping');
  const { applyIconFallback, registerCubeIcon } = await import('./icon-library');
  /** StreamDeck 표준 액션 payload → 우리 builtin payload 키 정규화 */
  function normalizeStreamDeckPayload(cube: Cube): Cube {
    if (cube.action_type !== 'link') return cube;
    const p = (cube.action_payload ?? {}) as Record<string, unknown>;
    // StreamDeck system.website: { path: "Discord.com" } 또는 "https://..."
    if (!p.url && typeof p.path === 'string') {
      let url = p.path.trim();
      if (url.length > 0 && !/^https?:\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
        url = `https://${url}`;
      }
      return { ...cube, action_payload: { ...p, url } };
    }
    return cube;
  }
  function applyRemap(cube: Cube): Cube {
    // 1) Icon library 풀에서 icon_url fallback (.cubepack 큐브가 icon=null일 때)
    let result = applyIconFallback(cube);
    // 2) 동시에 풀에도 등록 (icon 있는 큐브)
    registerCubeIcon(result);
    // 3) heuristic remap
    const r = remapPluginActionCube(result);
    if (r.changed) {
      const meta = (result.metadata ?? {}) as Record<string, unknown>;
      return normalizeStreamDeckPayload({
        ...result,
        action_type: r.type as Cube['action_type'],
        action_payload: (r.payload ?? {}) as Record<string, unknown>,
        metadata: {
          ...meta,
          mapping_kind: 'import_heuristic',
          dynamic_mapped_at: new Date().toISOString(),
          original_action_type: 'plugin_action',
        },
      });
    }
    return normalizeStreamDeckPayload(result);
  }

  const lists: CubeList[] = [];
  // 2026-06-01 버그 수정: Profile 변환기는 `pack.lists` 키 사용, 우리 export 는 `pack.order` 사용.
  // 두 키 모두 인식 (backward compat).
  const order = Array.isArray(packBody.order)
    ? packBody.order
    : Array.isArray(packBody.lists)
      ? packBody.lists
      : [];

  for (const entry of order as Array<Record<string, unknown>>) {
    const ref = typeof entry.ref === 'string' ? entry.ref : null;
    const sortOrder = typeof entry.sort_order === 'number' ? entry.sort_order : lists.length + 1;
    if (!ref) continue;

    const listEntry = zip.file(ref);
    if (!listEntry) continue;

    const listBlob = await listEntry.async('uint8array');
    const list = await readListZip(listBlob, sortOrder);
    // 2026-06-01: 각 큐브에 heuristic remap 적용
    // 2026-06-10: 변환 폴백 중복 아이콘 마킹 (동일 icon_url 3회+ → 2번째부터 생성 글리프)
    const { markDuplicateIcons } = await import('./icon-dedupe');
    lists.push({ ...list, cubes: markDuplicateIcons(list.cubes.map(applyRemap)) });
  }

  // === 라이브러리 큐브 복원 (수정 #2) ===
  // 1) ZIP 안 library/ 폴더 명시 큐브 우선
  // 2) 추가로 list.cubes 의 모든 큐브를 라이브러리에도 자동 충원 (중복 제거: label+action_type+payload 기준)
  const libraryCubes: Cube[] = [];
  const libSeen = new Set<string>();
  function libKey(c: Cube): string {
    return `${c.label}|${c.action_type}|${JSON.stringify(c.action_payload)}`;
  }

  for (const fileName of Object.keys(zip.files)) {
    if (!fileName.startsWith('library/') || !fileName.endsWith('.cubeone')) continue;
    const entry = zip.file(fileName);
    if (!entry) continue;
    try {
      const buf = await entry.async('uint8array');
      const c = await readCubeZip(buf, 0);
      // sort_order 0 = 라이브러리
      const libCube: Cube = { ...c, sort_order: 0 };
      libraryCubes.push(libCube);
      libSeen.add(libKey(libCube));
    } catch {
      /* 손상된 라이브러리 큐브는 스킵 */
    }
  }

  // 자동 충원: list.cubes 중 라이브러리에 없는 것 추가 (sort_order 0 + 새 id)
  for (const list of lists) {
    for (const c of list.cubes) {
      const k = libKey(c);
      if (libSeen.has(k)) continue;
      libSeen.add(k);
      libraryCubes.push({
        ...c,
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? (crypto.randomUUID() as string)
            : `lib-${Date.now()}-${libraryCubes.length}`,
        sort_order: 0,
      });
    }
  }

  return {
    id: packId,
    name: typeof packBody.name === 'string' ? packBody.name : '(이름 없음)',
    category: extractCategory(packBody),
    cubes: libraryCubes,
    lists,
  };
}

/**
 * .cubelist (단일 파일) → CubeList 디코딩 (v0.1.2 신규).
 *
 * 사용: 사용자가 .cubelist 단일 파일을 드래그드롭 시 호출.
 */
export async function importCubelist(input: Blob | ArrayBuffer | Uint8Array): Promise<CubeList> {
  let bytes: Uint8Array;
  if (input instanceof Uint8Array) {
    bytes = input;
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    bytes = new Uint8Array(await input.arrayBuffer());
  }
  return readListZip(bytes, 0);
}

async function readListZip(buf: Uint8Array, sortOrder: number): Promise<CubeList> {
  const zip = await JSZip.loadAsync(buf);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new CubepackFormatError('list manifest.json 누락');
  const manifest = safeParseJson(await manifestFile.async('text'), 'list manifest.json');
  if (manifest.kind !== 'cubelist') {
    throw new CubepackFormatError(`list kind 불일치: ${manifest.kind}`);
  }

  const listId = requireString(manifest.id, 'list.id');
  const body = manifest.list as Record<string, unknown> | undefined;
  if (!body) throw new CubepackFormatError('list.body 누락');

  const cubes: Cube[] = [];
  const order = Array.isArray(body.order) ? body.order : [];

  for (const entry of order as Array<Record<string, unknown>>) {
    const ref = typeof entry.ref === 'string' ? entry.ref : null;
    const cubeSort = typeof entry.sort_order === 'number' ? entry.sort_order : cubes.length + 1;
    if (!ref) continue;
    const cubeEntry = zip.file(ref);
    if (!cubeEntry) continue;
    const cubeBlob = await cubeEntry.async('uint8array');
    const cube = await readCubeZip(cubeBlob, cubeSort);
    cubes.push(cube);
  }

  return {
    id: listId,
    name: typeof body.name === 'string' ? body.name : '(이름 없음)',
    sort_order: sortOrder,
    cubes,
  };
}

export async function readCubeZip(buf: Uint8Array, sortOrder: number): Promise<Cube> {
  const zip = await JSZip.loadAsync(buf);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new CubepackFormatError('cube manifest.json 누락');
  const manifest = safeParseJson(await manifestFile.async('text'), 'cube manifest.json');
  if (manifest.kind !== 'cubeone') {
    throw new CubepackFormatError(`cube kind 불일치: ${manifest.kind}`);
  }

  const cubeId = requireString(manifest.id, 'cube.id');
  const cubeBody = manifest.cube as Record<string, unknown> | undefined;
  if (!cubeBody) throw new CubepackFormatError('cube.body 누락');

  const actionTypeRaw = cubeBody.action_type;
  if (typeof actionTypeRaw !== 'string' || actionTypeRaw.length === 0) {
    throw new CubepackFormatError(`action_type 무효: ${actionTypeRaw}`);
  }
  // 2026-06-10 forward-compat: 미지 action_type 은 throw 대신 plugin_action 강등
  // (신규 타입 추가 때마다 구 빌드에서 라이브러리 전체 로드가 깨지는 구조 방지.
  //  원본 타입은 metadata.original_unknown_type 에 보존 — 상위 빌드에서 복원 가능)
  const isKnown = ACTION_TYPES.has(actionTypeRaw as CubeActionType);
  const actionType = isKnown ? (actionTypeRaw as CubeActionType) : 'plugin_action';
  const baseMetadata =
    cubeBody.metadata && typeof cubeBody.metadata === 'object'
      ? (cubeBody.metadata as Record<string, unknown>)
      : undefined;
  const metadataWithCompat = isKnown
    ? baseMetadata
    : { ...(baseMetadata ?? {}), original_unknown_type: actionTypeRaw };

  return {
    id: cubeId,
    sort_order: sortOrder,
    label: typeof cubeBody.label === 'string' ? cubeBody.label : '(이름 없음)',
    icon_url: typeof cubeBody.icon_url === 'string' ? cubeBody.icon_url : null,
    action_type: actionType as CubeActionType,
    action_payload: (cubeBody.action_payload ?? {}) as Record<string, unknown>,
    ...(metadataWithCompat ? { metadata: metadataWithCompat } : {}),
    // 2026-06-11: title_style 보존 — 기능명 베이크 팩(show:false)이 import 후 라벨 중복 표시되는 결함 수정
    ...(cubeBody.title_style && typeof cubeBody.title_style === 'object'
      ? { title_style: cubeBody.title_style as Cube['title_style'] }
      : {}),
  };
}

// === Browser helpers =======================================================

/** 브라우저에서 .cubepack 다운로드 트리거 */
export function downloadCubepack(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.cubepack') ? filename : `${filename}.cubepack`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CubeList → ZIP Blob 생성 (cubes/*.cubeone + manifest.json). 확장자 분기는 호출자 책임. */
export async function buildCubelistBlob(list: import('../types/cube').CubeList): Promise<Blob> {
  const zip = new JSZip();
  const order: { ref: string; sort_order: number }[] = [];
  for (const cube of list.cubes) {
    const cubeManifest = {
      rbs_format_version: 3,
      kind: 'cubeone',
      id: cube.id,
      license: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rbs_min_version: '0.1.0',
      cube: {
        label: cube.label,
        icon_url: cube.icon_url,
        action_type: cube.action_type,
        action_payload: cube.action_payload,
        ...(cube.metadata ? { metadata: cube.metadata } : {}),
      },
    };
    const cubeZip = new JSZip();
    cubeZip.file('manifest.json', JSON.stringify(cubeManifest, null, 2));
    const cubeBytes = await cubeZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const ref = `cubes/${cube.id}.cubeone`;
    zip.file(ref, cubeBytes);
    order.push({ ref, sort_order: cube.sort_order });
  }
  const listManifest = {
    rbs_format_version: 3,
    kind: 'cubelist',
    id: list.id,
    license: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rbs_min_version: '0.1.0',
    list: { name: list.name, order, cols: list.cols, cubes_per_page: list.cubes_per_page },
  };
  zip.file('manifest.json', JSON.stringify(listManifest, null, 2));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** 페이지 수 계산: cubes 의 max sort_order / cubes_per_page */
export function computePageCount(list: import('../types/cube').CubeList): number {
  const pageSize = list.cubes_per_page ?? 28;
  const maxSort = list.cubes.length === 0 ? 0 : Math.max(...list.cubes.map((c) => c.sort_order));
  return Math.max(1, Math.ceil(maxSort / pageSize));
}

/** 단일 CubeList → .cubelist (1페이지) 또는 .cubedeck (2+페이지) ZIP 다운로드 */
export async function downloadCubelist(list: import('../types/cube').CubeList): Promise<void> {
  const blob = await buildCubelistBlob(list);
  const pages = computePageCount(list);
  const ext = pages >= 2 ? 'cubedeck' : 'cubelist';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${list.name}.${ext}`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Tauri 환경: 라이브러리 폴더 안에 직접 저장 (즉시 반영, 다음 부팅 안 기다림).
 * 비-Tauri: download 로 폴백.
 */
export async function saveCubelistToLibrary(
  list: import('../types/cube').CubeList,
  libraryDir: string,
): Promise<{ path: string; ext: string }> {
  const blob = await buildCubelistBlob(list);
  const pages = computePageCount(list);
  const ext = pages >= 2 ? 'cubedeck' : 'cubelist';
  const folderName = list.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim().slice(0, 100) || 'untitled';
  const fileName = `${folderName}.${ext}`;
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (!isTauri) {
    // 폴백: download
    await downloadCubelist(list);
    return { path: `(download) ${fileName}`, ext };
  }
  const { invoke } = await import('@tauri-apps/api/core');
  const buf = await blob.arrayBuffer();
  const bytes = Array.from(new Uint8Array(buf));
  const path = await invoke<string>('write_library_file', {
    libraryDir,
    folder: folderName,
    filename: fileName,
    bytes,
  });
  return { path, ext };
}

// === Helpers ===============================================================

function safeParseJson(text: string, context: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new CubepackFormatError(`${context}: 객체가 아님`);
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    if (e instanceof CubepackFormatError) throw e;
    throw new CubepackFormatError(`${context} JSON 파싱 실패`, e);
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new CubepackFormatError(`${field} 필수 (문자열)`);
  }
  return value;
}

function extractCategory(packBody: Record<string, unknown>): string | undefined {
  const persona = packBody.target_persona;
  if (Array.isArray(persona) && typeof persona[0] === 'string') return persona[0];
  return undefined;
}
