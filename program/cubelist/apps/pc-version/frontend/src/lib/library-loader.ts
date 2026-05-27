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
import type { Cube, CubeList, CubePack } from '../types/cube';
import { readCubeZip } from './cubepack-io';

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

  const listsMap = new Map<string, Cube[]>(); // 폴더명 → 큐브 배열 (정렬 전)
  const looseCubes: Cube[] = []; // 최상위 직속 .cubeone
  const libraryCubes: Cube[] = []; // pack.cubes 풀

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
      cubes,
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

  const lastSegment = path.split(/[\\/]/).filter(Boolean).pop() || '내 라이브러리';
  return {
    id: `library-${Date.now()}`,
    name: lastSegment,
    category: '라이브러리',
    cubes: libraryCubes,
    lists,
  };
}

/** Phase 2: 큐브팩 / 큐브리스트 ZIP 파일을 폴더와 무관하게 1차 import (향후 확장) */
export async function _parseStandaloneArchive(buf: Uint8Array): Promise<JSZip> {
  return JSZip.loadAsync(buf);
}
