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

  // === M7 페이지 (cron #20) ===
  /** 0-based 페이지 인덱스 (current_folder / list 전환 시 0 리셋) */
  current_page: number;

  // === 셀렉터 ===
  activeList(): CubeList | null;
  selectedCube(): Cube | null;
  /** 현재 뷰에서 보여야 할 큐브들 (루트 vs 폴더 안 + page slice) */
  visibleCubes(): Cube[];
  /** 페이지 슬라이스 전 = 루트/폴더 격리만 적용 (총 페이지 수 계산용) */
  scopedCubes(): Cube[];
  /** 현재 진입 중인 폴더 큐브 (있으면) */
  currentFolder(): Cube | null;
  /** 페이지 크기 — list.cubes_per_page 또는 cols*3 */
  pageSize(): number;
  /** 총 페이지 수 (최소 1) */
  totalPages(): number;

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

  // === M7 페이지 (cron #20) ===
  setPage(page: number): void;
  nextPage(): void;
  prevPage(): void;

  // === 그리드 배치 설정 (수정 #1) ===
  setListLayout(listId: string, layout: { cols: number; cubes_per_page: number }): void;
}

export const useEditor = create<EditorState>((set, get) => ({
  pack: null,
  pack_id: null,
  list_id: null,
  cube_id: null,
  current_folder_id: null,
  folder_stack: [],
  current_page: 0,

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
   * 페이지 적용 전 — 루트/폴더 격리만 적용 (총 페이지 수 계산용).
   */
  scopedCubes(): Cube[] {
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

  /**
   * 현재 뷰의 가시 큐브 집합 — scopedCubes() 결과를 sort_order 정렬 후 페이지 슬라이스.
   */
  visibleCubes(): Cube[] {
    const scoped = get().scopedCubes();
    const sorted = [...scoped].sort((a, b) => a.sort_order - b.sort_order);
    const size = get().pageSize();
    const page = get().current_page;
    return sorted.slice(page * size, (page + 1) * size);
  },

  pageSize(): number {
    const list = get().activeList();
    if (!list) return 15;
    const cols = list.cols ?? 5;
    return list.cubes_per_page ?? cols * 3;
  },

  totalPages(): number {
    const total = get().scopedCubes().length;
    const size = get().pageSize();
    return Math.max(1, Math.ceil(total / size));
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
      current_page: 0,
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
      current_page: 0,
    });
  },

  selectList(listId: string | null): void {
    // 리스트 전환 시 폴더 스택 + 페이지 초기화
    set({
      list_id: listId,
      cube_id: null,
      current_folder_id: null,
      folder_stack: [],
      current_page: 0,
    });
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
      current_page: 0,
    });
  },

  exitFolder(): void {
    const { folder_stack } = get();
    if (folder_stack.length === 0) {
      set({ current_folder_id: null, cube_id: null, current_page: 0 });
      return;
    }
    const next = [...folder_stack];
    const prev = next.pop() ?? null;
    set({ current_folder_id: prev, folder_stack: next, cube_id: null, current_page: 0 });
  },

  // === M7 페이지 ===

  setPage(page: number): void {
    const total = get().totalPages();
    const clamped = Math.max(0, Math.min(page, total - 1));
    set({ current_page: clamped });
  },

  nextPage(): void {
    const { current_page } = get();
    const total = get().totalPages();
    if (current_page + 1 < total) set({ current_page: current_page + 1 });
  },

  prevPage(): void {
    const { current_page } = get();
    if (current_page > 0) set({ current_page: current_page - 1 });
  },

  // === 그리드 배치 설정 ===

  setListLayout(listId: string, layout: { cols: number; cubes_per_page: number }): void {
    const { pack } = get();
    if (!pack) return;
    const nextLists = pack.lists.map((l) =>
      l.id === listId
        ? { ...l, cols: layout.cols, cubes_per_page: layout.cubes_per_page }
        : l,
    );
    set({ pack: { ...pack, lists: nextLists }, current_page: 0 });
  },
}));
