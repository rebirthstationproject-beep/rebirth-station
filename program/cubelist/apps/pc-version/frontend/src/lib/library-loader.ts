/**
 * 라이브러리 폴더 로더.
 *
 * 등록된 폴더 경로를 Tauri 명령(`read_library_files`)로 1회 스캔하고,
 * 폴더 구조를 큐브팩으로 매핑한다.
 *
 * 매핑 규약:
 *   <root>/
 *     <폴더1>/             ← 폴더명 = 큐브리스트 이름
 *       <폴더1>01.cubeone
 *       <폴더1>02.cubeone
 *       ...
 *     <폴더2>/
 *       ...
 *   - 폴더 안 .cubeone = 그 큐브리스트의 큐브들 (파일명 순)
 *   - 라이브러리 풀(pack.cubes) = 모든 큐브의 합집합 (새 ID 부여, 중복 라벨 허용)
 *   - 최상위 직속 .cubeone = "기타" 큐브리스트로 묶음
 *
 * 비-Tauri 환경 (vite preview 등) 에서는 invoke 실패 → 에러 전파.
 */

import JSZip from 'jszip';
import type { Cube, CubeActionType, CubeList, CubePack } from '../types/cube';
import { readCubeZip } from './cubepack-io';
import { remapPluginActionCube } from './heuristic-mapping';
import { registerCubes } from './icon-library';
import { markDuplicateIcons } from './icon-dedupe';

/**
 * 2026-06-01: 기존 plugin_action 큐브를 dynamic remap.
 * label / metadata.sd_uuid / metadata.sd_tooltip 기반 heuristic.
 * 사용자가 재변환 없이 즉시 효과.
 */
function applyDynamicRemap(cube: Cube): Cube {
  const result = remapPluginActionCube(cube);
  if (!result.changed) return cube;
  const meta = (cube.metadata ?? {}) as Record<string, unknown>;
  return {
    ...cube,
    action_type: result.type as CubeActionType,
    action_payload: (result.payload ?? {}) as Record<string, unknown>,
    metadata: {
      ...meta,
      mapping_kind: 'dynamic_heuristic',
      dynamic_mapped_at: new Date().toISOString(),
      original_action_type: 'plugin_action',
    },
  };
}

interface LibraryFile {
  relative_path: string;
  /** Tauri serde Vec<u8> → JS 에선 number[] 로 도착 */
  bytes: number[] | Uint8Array;
}

function toUint8(bytes: number[] | Uint8Array): Uint8Array {
  return bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
}

/** Tauri 환경 여부 — window.__TAURI_INTERNALS__ 존재로 판별 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function loadLibraryFromDir(path: string): Promise<CubePack> {
  if (!isTauri()) {
    throw new Error('Tauri 환경에서만 라이브러리 폴더 스캔 가능');
  }
  const { invoke } = await import('@tauri-apps/api/core');
  const files = await invoke<LibraryFile[]>('read_library_files', { path });

  // 2026-06-01: .cubeone 없고 .cubepack 만 있는 폴더 (Profile 변환 결과) → 첫 .cubepack 자동 import
  const hasCubeOne = files.some((f) => f.relative_path.toLowerCase().endsWith('.cubeone'));
  const cubepackFiles = files.filter((f) => f.relative_path.toLowerCase().endsWith('.cubepack'));
  if (!hasCubeOne && cubepackFiles.length > 0) {
    // 가장 큰 .cubepack 자동 로드 (가장 풍부한 큐브팩)
    const biggest = cubepackFiles.reduce((a, b) =>
      (Array.isArray(b.bytes) ? b.bytes.length : b.bytes.length) > (Array.isArray(a.bytes) ? a.bytes.length : a.bytes.length) ? b : a,
    );
    const { importCubepack } = await import('./cubepack-io');
    const buf = toUint8(biggest.bytes);
    const imported = await importCubepack(buf);
    return imported;
  }

  const listsMap = new Map<string, Cube[]>(); // 폴더명 → 큐브 배열 (정렬 전)
  const looseCubes: Cube[] = []; // 최상위 직속 .cubeone
  const libraryCubes: Cube[] = []; // pack.cubes 풀

  // <폴더>/icon.png|webp|jpg = 그 큐브리스트의 대표 아이콘 (2026-06-12)
  const folderIcons = new Map<string, string>(); // 폴더명 → data URL
  let rootIcon: string | undefined; // 최상위 icon.png = 팩 아이콘
  for (const file of files) {
    const m = file.relative_path.match(/^(?:([^/]+)\/)?icon\.(png|webp|jpe?g)$/i);
    if (!m) continue;
    const mime = m[2].toLowerCase() === 'png' ? 'image/png'
      : m[2].toLowerCase() === 'webp' ? 'image/webp' : 'image/jpeg';
    const u8 = toUint8(file.bytes);
    let bin = '';
    for (let i = 0; i < u8.length; i += 8192) {
      bin += String.fromCharCode(...u8.subarray(i, i + 8192));
    }
    const dataUrl = `data:${mime};base64,${btoa(bin)}`;
    if (m[1]) folderIcons.set(m[1], dataUrl);
    else rootIcon = dataUrl;
  }

  // 폴더 순서 유지 (파일 도착 순) — Map insertion order
  for (const file of files) {
    if (!file.relative_path.toLowerCase().endsWith('.cubeone')) continue;
    const parts = file.relative_path.split('/');
    const u8 = toUint8(file.bytes);
    let cube: Cube;
    try {
      cube = await readCubeZip(u8, 0);
    } catch (e) {
      console.warn(`[library-loader] ${file.relative_path} 파싱 실패`, e);
      continue;
    }
    // 2026-06-01: plugin_action 큐브 dynamic remap (heuristic builtin 매핑)
    cube = applyDynamicRemap(cube);
    // W3: streamdeck-import 로 로드된 큐브 = 변환 산출물 → origin/license 강제 마킹
    {
      const meta = (cube.metadata ?? {}) as Record<string, unknown>;
      if (meta.source === 'streamdeck-import' && meta.origin !== 'streamdeck-conversion') {
        cube = {
          ...cube,
          metadata: { ...meta, origin: 'streamdeck-conversion' },
        };
      }
    }
    if (parts.length === 1) {
      looseCubes.push(cube);
    } else {
      const folderName = parts[0];
      if (!listsMap.has(folderName)) listsMap.set(folderName, []);
      listsMap.get(folderName)!.push(cube);
    }
    libraryCubes.push({ ...cube, id: crypto.randomUUID() as string });
  }

  // 파일명 안정 정렬 (Advanced Launcher01 < 02 < 10) 를 위해 호출자가 이미 정렬된 순서로 줬다고 가정
  // 추가 보강: relative_path 기준 사전순 → 변환 스크립트의 zero-pad 와 호환
  const lists: CubeList[] = [];
  let order = 1;
  for (const [folderName, cubes] of listsMap) {
    cubes.forEach((c, i) => (c.sort_order = i + 1));
    lists.push({
      id: crypto.randomUUID() as string,
      name: folderName,
      sort_order: order++,
      cols: 4,
      cubes_per_page: 28,
      icon_url: folderIcons.get(folderName),
      // 변환 폴백 중복 아이콘 → 렌더 플래그 마킹 (2026-06-10)
      cubes: markDuplicateIcons(cubes),
    });
  }
  if (looseCubes.length > 0) {
    looseCubes.forEach((c, i) => (c.sort_order = i + 1));
    lists.push({
      id: crypto.randomUUID() as string,
      name: '기타',
      sort_order: order++,
      cols: 4,
      cubes_per_page: 28,
      cubes: looseCubes,
    });
  }

  // 라이브러리 풀 추가: list 큐브 중 라이브러리에 없는 것 자동 충원 (중복 키 제거)
  const libKey = (c: Cube): string =>
    `${c.label}|${c.action_type}|${JSON.stringify(c.action_payload)}`;
  const seen = new Set<string>(libraryCubes.map(libKey));
  for (const list of lists) {
    for (const c of list.cubes) {
      const k = libKey(c);
      if (seen.has(k)) continue;
      seen.add(k);
      libraryCubes.push({ ...c, id: crypto.randomUUID() as string, sort_order: 0 });
    }
  }

  // 2026-06-01 C: Icon library 풀에 sd_uuid → icon_url 등록 (다음 .cubepack import 시 fallback)
  registerCubes(libraryCubes);

  const lastSegment = path.split(/[\\/]/).filter(Boolean).pop() || '내 라이브러리';
  return {
    id: `library-${Date.now()}`,
    name: lastSegment,
    category: '라이브러리',
    icon_url: rootIcon,
    cubes: libraryCubes,
    lists,
  };
}

/** Phase 2: 큐브팩 / 큐브리스트 ZIP 파일을 폴더와 무관하게 1차 import (향후 확장) */
export async function _parseStandaloneArchive(buf: Uint8Array): Promise<JSZip> {
  return JSZip.loadAsync(buf);
}
