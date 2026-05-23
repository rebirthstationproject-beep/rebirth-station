/**
 * 파일 import 시 스키마 + 정적 분석 검증
 *
 * 정착본: docs/file-format-spec.md §검증
 *
 * 3중 방어
 * 1. 스키마 검증 (필수 필드 + kind 일치)
 * 2. action_type 화이트리스트
 * 3. payload 정적 분석 (위험 키워드 + 외부 URL)
 *
 * v3/v2/v1 모두 지원:
 * - v3: manifest.json + order 배열 (ref 참조)
 * - v2: cubes/lists 배열 직접 임베드
 * - v1: grid_x/grid_y 포함 + items 배열 (v2로 자동 정규화)
 */

import type {
  AnyCubeFile,
  CubeBodyDto,
  CubeFileKind,
  CubeListFile,
  CubeOneFile,
  CubePackFile,
} from './spec';

export class CubeFormatError extends Error {
  constructor(public readonly code: CubeFormatErrorCode, message: string) {
    super(message);
    this.name = 'CubeFormatError';
  }
}

export type CubeFormatErrorCode =
  | 'malformed_json'
  | 'unsupported_version'
  | 'invalid_kind'
  | 'missing_required'
  | 'unsupported_action_type'
  | 'dangerous_payload'
  | 'external_url';

const ALLOWED_ACTION_TYPES = new Set(['link', 'shortcut', 'macro']);

const DANGEROUS_KEYWORDS = [
  'exec',
  'shell',
  'eval',
  'system',
  'spawn',
  'cmd.exe',
  'powershell',
  '/bin/sh',
  '/bin/bash',
  'rm -rf',
  'registry',
  'regedit',
  'fs.write',
  'writebinaryfile',
];

export function parseAndValidate(raw: string, expectedKind?: CubeFileKind): AnyCubeFile {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new CubeFormatError('malformed_json', (e as Error).message);
  }

  if (typeof json !== 'object' || json === null) {
    throw new CubeFormatError('malformed_json', 'top-level must be an object');
  }

  const obj = json as Record<string, unknown>;

  const version = obj.rbs_format_version;
  if (version !== 1 && version !== 2 && version !== 3) {
    throw new CubeFormatError(
      'unsupported_version',
      `format version ${String(version)} not supported (expected 1, 2, or 3)`,
    );
  }

  const kind = obj.kind;
  if (kind !== 'cubeone' && kind !== 'cubelist' && kind !== 'cubepack') {
    throw new CubeFormatError('invalid_kind', `unknown kind: ${String(kind)}`);
  }
  if (expectedKind && kind !== expectedKind) {
    throw new CubeFormatError(
      'invalid_kind',
      `expected kind ${expectedKind}, got ${kind}`,
    );
  }

  requireFields(obj, ['id', 'license', 'created_at', 'updated_at', 'rbs_min_version']);

  switch (kind) {
    case 'cubeone': {
      const cube = (obj as Partial<CubeOneFile>).cube;
      if (!cube) throw new CubeFormatError('missing_required', 'cubeone.cube');
      validateCube(cube);
      return migrateToV3CubeOne(obj as unknown as CubeOneFile);
    }
    case 'cubelist': {
      const list = (obj as Partial<CubeListFile>).list;
      if (!list) throw new CubeFormatError('missing_required', 'cubelist.list');
      requireFields(list as unknown as Record<string, unknown>, ['name']);
      // v3: order 배열 / v2: cubes 배열 / v1: items 배열
      const listObj = list as unknown as Record<string, unknown>;
      const cubesArray = listObj.cubes ?? listObj.items;
      if (!Array.isArray(cubesArray) && !Array.isArray(listObj.order)) {
        throw new CubeFormatError('missing_required', 'list.cubes (or list.order) must be array');
      }
      if (Array.isArray(cubesArray)) {
        for (const cube of cubesArray) {
          validateCube(cube as CubeBodyDto);
        }
      }
      return migrateToV3CubeList(obj as unknown as CubeListFile);
    }
    case 'cubepack': {
      const pack = (obj as Partial<CubePackFile>).pack;
      if (!pack) throw new CubeFormatError('missing_required', 'cubepack.pack');
      // v3: order 배열 / v2: lists 배열
      const packObj = pack as unknown as Record<string, unknown>;
      if (!Array.isArray(packObj.lists) && !Array.isArray(packObj.order)) {
        throw new CubeFormatError('missing_required', 'pack.lists (or pack.order) must be array');
      }
      if (Array.isArray(packObj.lists)) {
        for (const list of packObj.lists as Array<Record<string, unknown>>) {
          for (const cube of (list.cubes ?? list.items ?? []) as CubeBodyDto[]) {
            validateCube(cube);
          }
        }
      }
      return migrateToV3CubePack(obj as unknown as CubePackFile);
    }
  }
}

// ---------------------------------------------------------------------------
// v1/v2 → v3 자동 마이그레이션 (in-memory, DB 접근 X)
// ---------------------------------------------------------------------------

function migrateToV3CubeOne(file: CubeOneFile): CubeOneFile {
  if (file.rbs_format_version === 3) return file;
  return {
    ...file,
    rbs_format_version: 3,
    cube: {
      ...file.cube,
      icon_ref: undefined,
    },
  };
}

function migrateToV3CubeList(file: CubeListFile): CubeListFile {
  if (file.rbs_format_version === 3) return file;
  const listObj = file.list as unknown as Record<string, unknown>;
  // v1 items → v2 cubes 정규화
  const cubes = (listObj.cubes ?? listObj.items ?? []) as CubeBodyDto[];
  return {
    ...file,
    rbs_format_version: 3,
    list: {
      name: file.list.name,
      description: file.list.description,
      cubes,
    },
  };
}

function migrateToV3CubePack(file: CubePackFile): CubePackFile {
  if (file.rbs_format_version === 3) return file;
  const packObj = file.pack as unknown as Record<string, unknown>;
  const lists = (packObj.lists ?? []) as Array<Record<string, unknown>>;
  const migratedLists = lists.map((l) => ({
    name: l.name as string,
    description: l.description as string | undefined,
    cubes: ((l.cubes ?? l.items ?? []) as CubeBodyDto[]),
  }));
  return {
    ...file,
    rbs_format_version: 3,
    pack: {
      name: file.pack.name,
      description: file.pack.description,
      target_persona: file.pack.target_persona,
      lists: migratedLists,
    },
  };
}

// ---------------------------------------------------------------------------
// 검증 헬퍼
// ---------------------------------------------------------------------------

function validateCube(cube: CubeBodyDto): void {
  if (!cube.label || typeof cube.label !== 'string') {
    throw new CubeFormatError('missing_required', 'cube.label');
  }
  if (!ALLOWED_ACTION_TYPES.has(cube.action_type)) {
    throw new CubeFormatError(
      'unsupported_action_type',
      `unsupported action_type: ${cube.action_type}`,
    );
  }
  scanPayload(cube.action_payload);
}

function scanPayload(payload: Record<string, unknown>): void {
  const text = JSON.stringify(payload).toLowerCase();
  for (const kw of DANGEROUS_KEYWORDS) {
    if (text.includes(kw)) {
      throw new CubeFormatError(
        'dangerous_payload',
        `payload contains dangerous keyword: ${kw}`,
      );
    }
  }
  // URL 스킴 검사 — http(s)만 허용
  const url = payload['url'];
  if (typeof url === 'string') {
    const lower = url.toLowerCase();
    if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
      throw new CubeFormatError('external_url', `unsafe URL scheme: ${url}`);
    }
  }
}

function requireFields(obj: Record<string, unknown>, fields: string[]): void {
  for (const f of fields) {
    if (obj[f] === undefined) {
      throw new CubeFormatError('missing_required', `missing field: ${f}`);
    }
  }
}
