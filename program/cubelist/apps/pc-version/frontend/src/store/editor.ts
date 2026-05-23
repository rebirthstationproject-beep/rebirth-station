/**
 * 편집기 상태 스토어 (zustand) — M2
 *
 * 단일 진실원: 현재 로드된 큐브팩 + 활성 리스트 + 선택 큐브.
 * 영속화 (.cubepack 파일 ↔ store) 는 M2 후반 cubepack-io 모듈에서 처리.
 */

import { create } from 'zustand';
import type { Cube, CubeList, CubePack, EditorSelection } from '../types/cube';

interface EditorState extends EditorSelection {
  pack: CubePack | null;

  // === M7 폴더 스택 ===
  /** 현재 진입한 폴더 큐브 ID. null = 루트 */
  current_folder_id: string | null;
  /** 뒤로 가기 스택 (다중 깊이 폴더 지원) */
  folder_stack: string[];

  // === 셀렉터 ===
  activeList(): CubeList | null;
  selectedCube(): Cube | null;
  /** 현재 뷰에서 보여야 할 큐브들 (루트 = folder 안 큐브 제외, 폴더 안 = cube_ids 매칭) */
  visibleCubes(): Cube[];
  /** 현재 진입 중인 폴더 큐브 (있으면) */
  currentFolder(): Cube | null;

  // === 액션 (큐브팩 수준) ===
  loadPack(pack: CubePack): void;
  closePack(): void;

  // === 액션 (선택) ===
  selectList(listId: string | null): void;
  selectCube(cubeId: string | null): void;

  // === 액션 (편집) ===
  upsertCube(listId: string, cube: Cube): void;
  removeCube(listId: string, cubeId: string): void;
  reorderCubes(listId: string, fromId: string, toId: string): void;

  // === M7 폴더 진입/탈출 ===
  enterFolder(folderCubeId: string): void;
  exitFolder(): void;
}

export const useEditor = create<EditorState>((set, get) => ({
  pack: null,
  pack_id: null,
  list_id: null,
  cube_id: null,
  current_folder_id: null,
  folder_stack: [],

  activeList(): CubeList | null {
    const { pack, list_id } = get();
    if (!pack || !list_id) return null;
    return pack.lists.find((l) => l.id === list_id) ?? null;
  },

  selectedCube(): Cube | null {
    const list = get().activeList();
    const { cube_id } = get();
    if (!list || !cube_id) return null;
    return list.cubes.find((c) => c.id === cube_id) ?? null;
  },

  /**
   * 현재 뷰의 가시 큐브 집합.
   * 루트: 다른 folder 큐브의 `cube_ids` 에 포함된 큐브는 숨김 (서브덱 격리).
   * 폴더 안: 현재 폴더의 `cube_ids` 와 매칭되는 큐브만.
   */
  visibleCubes(): Cube[] {
    const list = get().activeList();
    if (!list) return [];
    const { current_folder_id } = get();

    if (!current_folder_id) {
      const inAnyFolder = new Set<string>();
      for (const c of list.cubes) {
        if (c.action_type === 'folder') {
          const ids = (c.action_payload as { cube_ids?: string[] }).cube_ids ?? [];
          ids.forEach((id) => inAnyFolder.add(id));
        }
      }
      return list.cubes.filter((c) => !inAnyFolder.has(c.id));
    }

    const folder = list.cubes.find((c) => c.id === current_folder_id);
    if (!folder || folder.action_type !== 'folder') return [];
    const ids = new Set((folder.action_payload as { cube_ids?: string[] }).cube_ids ?? []);
    return list.cubes.filter((c) => ids.has(c.id));
  },

  currentFolder(): Cube | null {
    const { current_folder_id } = get();
    if (!current_folder_id) return null;
    const list = get().activeList();
    return list?.cubes.find((c) => c.id === current_folder_id) ?? null;
  },

  loadPack(pack: CubePack): void {
    const firstListId = pack.lists[0]?.id ?? null;
    set({
      pack,
      pack_id: pack.id,
      list_id: firstListId,
      cube_id: null,
      current_folder_id: null,
      folder_stack: [],
    });
  },

  closePack(): void {
    set({
      pack: null,
      pack_id: null,
      list_id: null,
      cube_id: null,
      current_folder_id: null,
      folder_stack: [],
    });
  },

  selectList(listId: string | null): void {
    // 리스트 전환 시 폴더 스택 초기화
    set({ list_id: listId, cube_id: null, current_folder_id: null, folder_stack: [] });
  },

  selectCube(cubeId: string | null): void {
    set({ cube_id: cubeId });
  },

  upsertCube(listId: string, cube: Cube): void {
    const { pack } = get();
    if (!pack) return;
    const nextLists = pack.lists.map((l) => {
      if (l.id !== listId) return l;
      const idx = l.cubes.findIndex((c) => c.id === cube.id);
      const cubes = idx === -1
        ? [...l.cubes, cube]
        : l.cubes.map((c, i) => (i === idx ? cube : c));
      return { ...l, cubes };
    });
    set({ pack: { ...pack, lists: nextLists } });
  },

  removeCube(listId: string, cubeId: string): void {
    const { pack, cube_id } = get();
    if (!pack) return;
    const nextLists = pack.lists.map((l) =>
      l.id === listId ? { ...l, cubes: l.cubes.filter((c) => c.id !== cubeId) } : l,
    );
    set({
      pack: { ...pack, lists: nextLists },
      cube_id: cube_id === cubeId ? null : cube_id,
    });
  },

  /**
   * 드래그&드롭 reorder — fromId 의 sort_order 를 toId 와 인접 큐브 사이값으로 변경.
   * SD-G 결정(모바일 PWA 동일): 1D real sort_order, 사이값 보간으로 row/col 변경 불필요.
   */
  reorderCubes(listId: string, fromId: string, toId: string): void {
    const { pack } = get();
    if (!pack || fromId === toId) return;

    const nextLists = pack.lists.map((l) => {
      if (l.id !== listId) return l;
      const sorted = [...l.cubes].sort((a, b) => a.sort_order - b.sort_order);
      const fromIdx = sorted.findIndex((c) => c.id === fromId);
      const toIdx = sorted.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1) return l;

      const targetSort = sorted[toIdx].sort_order;
      const neighborIdx = fromIdx < toIdx ? toIdx + 1 : toIdx - 1;
      const neighborSort =
        neighborIdx >= 0 && neighborIdx < sorted.length
          ? sorted[neighborIdx].sort_order
          : fromIdx < toIdx
            ? targetSort + 1
            : targetSort - 1;

      const newSort = (targetSort + neighborSort) / 2;
      return {
        ...l,
        cubes: l.cubes.map((c) => (c.id === fromId ? { ...c, sort_order: newSort } : c)),
      };
    });

    set({ pack: { ...pack, lists: nextLists } });
  },

  // === M7 폴더 진입/탈출 ===

  enterFolder(folderCubeId: string): void {
    const list = get().activeList();
    const target = list?.cubes.find((c) => c.id === folderCubeId);
    if (!target || target.action_type !== 'folder') return;
    const { current_folder_id, folder_stack } = get();
    set({
      current_folder_id: folderCubeId,
      folder_stack: current_folder_id ? [...folder_stack, current_folder_id] : folder_stack,
      cube_id: null,
    });
  },

  exitFolder(): void {
    const { folder_stack } = get();
    if (folder_stack.length === 0) {
      set({ current_folder_id: null, cube_id: null });
      return;
    }
    const next = [...folder_stack];
    const prev = next.pop() ?? null;
    set({ current_folder_id: prev, folder_stack: next, cube_id: null });
  },
}));
