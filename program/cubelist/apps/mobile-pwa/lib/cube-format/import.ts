/**
 * 파일 → 큐브 / 리스트 import (v3 ZIP 컨테이너)
 *
 * 정착본: docs/file-format-spec.md §검증
 *
 * 흐름
 * 1. 사용자가 파일 선택 (input[type=file] 또는 drop)
 * 2. v3 ZIP 파싱 → manifest.json 추출 / v1·v2 JSON 텍스트 자동 분기
 * 3. 스키마 검증 + 정적 분석 (`validate.ts`)
 * 4. user_id·새 id 매핑 후 Supabase insert
 */

import JSZip from 'jszip';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { parseAndValidate, CubeFormatError } from './validate';
import type {
  AnyCubeFile,
  CubeBodyDto,
  CubeListFile,
  CubeOneFile,
  CubePackFile,
} from './spec';

export interface ImportResult {
  success: boolean;
  insertedBoards: number;
  insertedItems: number;
  reason?: string;
  /** 새로 생성된 보드 ID 목록 — DoneStep에서 deep-link로 사용 */
  boardIds?: string[];
}

// ---------------------------------------------------------------------------
// 공개 진입점
// ---------------------------------------------------------------------------

/**
 * File (드롭·선택) → ImportResult.
 * v3 ZIP 우선 시도, 실패 시 v1/v2 JSON 텍스트 폴백.
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  const buf = await file.arrayBuffer();

  // v3 ZIP 시도
  try {
    const zip = await JSZip.loadAsync(buf);
    const manifestFile = zip.file('manifest.json');
    if (manifestFile) {
      const manifestText = await manifestFile.async('text');
      const parsed = parseAndValidateText(manifestText);
      if (!parsed.success) return parsed.result;
      const manifest = parsed.manifest;

      if (isLocalMode()) {
        return importLocalModeFromManifest(manifest, zip);
      }
      return importFromManifest(manifest, zip);
    }
  } catch {
    // ZIP 파싱 실패 → JSON 텍스트 폴백
  }

  // v1/v2 JSON 텍스트 폴백
  const text = new TextDecoder().decode(buf);
  return importFromText(text);
}

/**
 * 텍스트(JSON) → ImportResult.
 * v1/v2 파일 paste·seed 플로우에서 계속 사용됨.
 */
export async function importFromText(
  text: string,
  targetBoardId?: string,
): Promise<ImportResult> {
  let file: AnyCubeFile;
  try {
    file = parseAndValidate(text);
  } catch (e) {
    return {
      success: false,
      insertedBoards: 0,
      insertedItems: 0,
      reason:
        e instanceof CubeFormatError
          ? `${e.code}: ${e.message}`
          : (e as Error).message,
    };
  }

  if (isLocalMode()) {
    return importLocalMode(file, targetBoardId);
  }

  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    return {
      success: false,
      insertedBoards: 0,
      insertedItems: 0,
      reason: '로그인이 필요합니다',
    };
  }
  const userId = session.session.user.id;

  switch (file.kind) {
    case 'cubeone':
      return importCubeOne(file, userId, targetBoardId);
    case 'cubelist':
      return importCubeList(file, userId);
    case 'cubepack':
      return importCubePack(file, userId);
  }
}

// ---------------------------------------------------------------------------
// v3 ZIP 파싱 헬퍼
// ---------------------------------------------------------------------------

interface ParseResult {
  success: true;
  manifest: AnyCubeFile;
}
interface ParseFailure {
  success: false;
  result: ImportResult;
}

function parseAndValidateText(text: string): ParseResult | ParseFailure {
  try {
    const manifest = parseAndValidate(text);
    return { success: true, manifest };
  } catch (e) {
    return {
      success: false,
      result: {
        success: false,
        insertedBoards: 0,
        insertedItems: 0,
        reason:
          e instanceof CubeFormatError
            ? `${e.code}: ${e.message}`
            : (e as Error).message,
      },
    };
  }
}

/**
 * v3 ZIP manifest + zip 컨텍스트로부터 import.
 * cubeone/cubelist/cubepack 분기.
 */
async function importFromManifest(manifest: AnyCubeFile, zip: JSZip): Promise<ImportResult> {
  const supabase = getSupabase();
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    return {
      success: false,
      insertedBoards: 0,
      insertedItems: 0,
      reason: '로그인이 필요합니다',
    };
  }
  const userId = session.session.user.id;

  switch (manifest.kind) {
    case 'cubeone':
      return importCubeOneV3(manifest as CubeOneFile, zip, userId);
    case 'cubelist':
      return importCubeListV3(manifest as CubeListFile, zip, userId);
    case 'cubepack':
      return importCubePackV3(manifest as CubePackFile, zip, userId);
  }
}

/**
 * v3 .cubeone ZIP에서 CubeBodyDto 추출.
 * ZIP 안의 manifest.json을 파싱해서 반환.
 */
async function extractCubeBodyFromZip(zipEntry: JSZip.JSZipObject): Promise<CubeBodyDto | null> {
  try {
    const innerBuf = await zipEntry.async('arraybuffer');
    const innerZip = await JSZip.loadAsync(innerBuf);
    const innerManifest = innerZip.file('manifest.json');
    if (!innerManifest) return null;
    const text = await innerManifest.async('text');
    const parsed = parseAndValidate(text, 'cubeone') as CubeOneFile;
    return parsed.cube;
  } catch {
    return null;
  }
}

async function importCubeOneV3(
  manifest: CubeOneFile,
  _zip: JSZip,
  userId: string,
): Promise<ImportResult> {
  return importCubeOne(manifest, userId);
}

async function importCubeListV3(
  manifest: CubeListFile,
  zip: JSZip,
  userId: string,
): Promise<ImportResult> {
  const list = manifest.list;

  // v3: order 배열 → cubes/*.cubeone ZIP 추출
  if (Array.isArray(list.order) && list.order.length > 0) {
    const cubes: CubeBodyDto[] = [];
    for (const entry of list.order.sort((a, b) => a.sort_order - b.sort_order)) {
      const zipEntry = zip.file(entry.ref);
      if (zipEntry) {
        const cube = await extractCubeBodyFromZip(zipEntry);
        if (cube) cubes.push(cube);
      }
    }
    // cubes를 채운 synthetic file로 import
    const synthetic: CubeListFile = { ...manifest, list: { ...list, cubes } };
    return importCubeList(synthetic, userId);
  }

  // v2 호환: cubes 배열 직접
  return importCubeList(manifest, userId);
}

async function importCubePackV3(
  manifest: CubePackFile,
  zip: JSZip,
  userId: string,
): Promise<ImportResult> {
  const pack = manifest.pack;
  let boards = 0;
  let items = 0;
  const boardIds: string[] = [];

  // v3: order 배열 → lists/*.cubelist ZIP 추출
  if (Array.isArray(pack.order) && pack.order.length > 0) {
    for (const entry of pack.order.sort((a, b) => a.sort_order - b.sort_order)) {
      const zipEntry = zip.file(entry.ref);
      if (!zipEntry) continue;
      try {
        const innerBuf = await zipEntry.async('arraybuffer');
        const innerZip = await JSZip.loadAsync(innerBuf);
        const innerManifest = innerZip.file('manifest.json');
        if (!innerManifest) continue;
        const text = await innerManifest.async('text');
        const parsed = parseAndValidate(text, 'cubelist') as CubeListFile;
        const r = await importCubeListV3(parsed, innerZip, userId);
        boards += r.insertedBoards;
        items += r.insertedItems;
        if (r.boardIds) boardIds.push(...r.boardIds);
      } catch {
        // 개별 list 실패 시 skip — 나머지 계속
      }
    }
    return { success: true, insertedBoards: boards, insertedItems: items, boardIds };
  }

  // v2 호환: lists 배열 직접
  return importCubePack(manifest, userId);
}

// ---------------------------------------------------------------------------
// Supabase insert 로직 (기존 유지)
// ---------------------------------------------------------------------------

async function importCubeOne(
  file: CubeOneFile,
  userId: string,
  targetBoardId?: string,
): Promise<ImportResult> {
  const supabase = getSupabase();

  let boardId = targetBoardId;
  if (!boardId) {
    const { data: board } = await supabase
      .from('mylist_boards')
      .select('id')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (board) {
      boardId = board.id;
    } else {
      const { data: newBoard, error } = await supabase
        .from('mylist_boards')
        .insert({ user_id: userId, name: '기본', sort_order: 0 })
        .select('id')
        .single();
      if (error || !newBoard) {
        return { success: false, insertedBoards: 0, insertedItems: 0, reason: error?.message };
      }
      boardId = newBoard.id;
    }
  }

  const { data: last } = await supabase
    .from('mylist_items')
    .select('sort_order')
    .eq('board_id', boardId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from('mylist_items').insert({
    board_id: boardId,
    sort_order: nextSortOrder,
    label: file.cube.label.slice(0, 32),
    icon_url: file.cube.icon_url ?? null,
    action_type: file.cube.action_type,
    action_payload: file.cube.action_payload,
  });

  if (error) {
    return { success: false, insertedBoards: 0, insertedItems: 0, reason: error.message };
  }
  return { success: true, insertedBoards: 0, insertedItems: 1 };
}

async function importCubeList(file: CubeListFile, userId: string): Promise<ImportResult> {
  const supabase = getSupabase();
  const { list } = file;

  const { data: board, error: boardErr } = await supabase
    .from('mylist_boards')
    .insert({
      user_id: userId,
      name: list.name.slice(0, 64),
      sort_order: 999,
      metadata: list.description ? { description: list.description } : {},
    })
    .select('id')
    .single();

  if (boardErr || !board) {
    return { success: false, insertedBoards: 0, insertedItems: 0, reason: boardErr?.message };
  }

  const cubes = list.cubes ?? [];
  if (cubes.length === 0) {
    return { success: true, insertedBoards: 1, insertedItems: 0, boardIds: [board.id] };
  }

  const rows = cubes.map((c, idx) => ({
    board_id: board.id,
    sort_order: idx * 1.0,
    label: c.label.slice(0, 32),
    icon_url: c.icon_url ?? null,
    action_type: c.action_type,
    action_payload: c.action_payload,
  }));

  const { error: itemsErr } = await supabase.from('mylist_items').insert(rows);
  if (itemsErr) {
    return {
      success: true,
      insertedBoards: 1,
      insertedItems: 0,
      reason: `보드는 생성됐으나 큐브 일부 실패: ${itemsErr.message}`,
      boardIds: [board.id],
    };
  }
  return { success: true, insertedBoards: 1, insertedItems: rows.length, boardIds: [board.id] };
}

async function importCubePack(file: CubePackFile, userId: string): Promise<ImportResult> {
  let boards = 0;
  let items = 0;
  const boardIds: string[] = [];
  for (const list of file.pack.lists ?? []) {
    const synthetic: CubeListFile = {
      $schema: file.$schema,
      rbs_format_version: file.rbs_format_version,
      kind: 'cubelist',
      id: file.id + '-' + boards,
      author: file.author,
      license: file.license,
      created_at: file.created_at,
      updated_at: file.updated_at,
      rbs_min_version: file.rbs_min_version,
      list,
    };
    const r = await importCubeList(synthetic, userId);
    boards += r.insertedBoards;
    items += r.insertedItems;
    if (r.boardIds) boardIds.push(...r.boardIds);
  }
  return { success: true, insertedBoards: boards, insertedItems: items, boardIds };
}

// ---------------------------------------------------------------------------
// LOCAL_MODE 전용 import
// ---------------------------------------------------------------------------

async function importLocalModeFromManifest(
  manifest: AnyCubeFile,
  zip: JSZip,
): Promise<ImportResult> {
  switch (manifest.kind) {
    case 'cubeone':
      return importLocalMode(manifest);
    case 'cubelist': {
      const list = manifest.list;
      // v3: order 배열 → cubes 추출
      if (Array.isArray(list.order) && list.order.length > 0) {
        const cubes: CubeBodyDto[] = [];
        for (const entry of list.order.sort((a, b) => a.sort_order - b.sort_order)) {
          const zipEntry = zip.file(entry.ref);
          if (zipEntry) {
            const cube = await extractCubeBodyFromZip(zipEntry);
            if (cube) cubes.push(cube);
          }
        }
        return importLocalMode({ ...manifest, list: { ...list, cubes } });
      }
      return importLocalMode(manifest);
    }
    case 'cubepack': {
      const pack = manifest.pack;
      // v3: order 배열 → lists 추출
      if (Array.isArray(pack.order) && pack.order.length > 0) {
        let totalBoards = 0;
        let totalItems = 0;
        const boardIds: string[] = [];
        for (const entry of pack.order.sort((a, b) => a.sort_order - b.sort_order)) {
          const zipEntry = zip.file(entry.ref);
          if (!zipEntry) continue;
          try {
            const innerBuf = await zipEntry.async('arraybuffer');
            const innerZip = await JSZip.loadAsync(innerBuf);
            const innerManifest = innerZip.file('manifest.json');
            if (!innerManifest) continue;
            const text = await innerManifest.async('text');
            const parsed = parseAndValidate(text, 'cubelist') as CubeListFile;
            const r = await importLocalModeFromManifest(parsed, innerZip);
            totalBoards += r.insertedBoards;
            totalItems += r.insertedItems;
            if (r.boardIds) boardIds.push(...r.boardIds);
          } catch {
            // skip
          }
        }
        return { success: true, insertedBoards: totalBoards, insertedItems: totalItems, boardIds };
      }
      return importLocalMode(manifest);
    }
  }
}

function importLocalMode(file: AnyCubeFile, targetBoardId?: string): ImportResult {
  switch (file.kind) {
    case 'cubeone': {
      const boards = localStore.loadBoards();
      let boardId = targetBoardId ?? boards[0]?.id;
      let insertedBoards = 0;
      if (!boardId) {
        const created = localStore.createBoard('기본');
        boardId = created.id;
        insertedBoards = 1;
      }
      const cube = file.cube;
      localStore.addItem(boardId, {
        label: cube.label.slice(0, 32),
        icon_url: cube.icon_url ?? null,
        action_type: cube.action_type,
        action_payload: cube.action_payload as Record<string, unknown>,
      });
      return { success: true, insertedBoards, insertedItems: 1 };
    }
    case 'cubelist': {
      const board = localStore.createBoard(file.list.name.slice(0, 64));
      let insertedItems = 0;
      for (const c of file.list.cubes ?? []) {
        localStore.addItem(board.id, {
          label: c.label.slice(0, 32),
          icon_url: c.icon_url ?? null,
          action_type: c.action_type,
          action_payload: c.action_payload as Record<string, unknown>,
        });
        insertedItems++;
      }
      return { success: true, insertedBoards: 1, insertedItems, boardIds: [board.id] };
    }
    case 'cubepack': {
      let totalBoards = 0;
      let totalItems = 0;
      const boardIds: string[] = [];
      for (const list of file.pack.lists ?? []) {
        const synthetic: CubeListFile = {
          $schema: file.$schema,
          rbs_format_version: file.rbs_format_version,
          kind: 'cubelist',
          id: file.id + '-' + totalBoards,
          author: file.author,
          license: file.license,
          created_at: file.created_at,
          updated_at: file.updated_at,
          rbs_min_version: file.rbs_min_version,
          list,
        };
        const r = importLocalMode(synthetic);
        totalBoards += r.insertedBoards;
        totalItems += r.insertedItems;
        if (r.boardIds) boardIds.push(...r.boardIds);
      }
      return { success: true, insertedBoards: totalBoards, insertedItems: totalItems, boardIds };
    }
  }
}
