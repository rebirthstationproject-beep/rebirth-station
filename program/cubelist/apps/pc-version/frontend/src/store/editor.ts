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

  // === 자유 슬롯 배치 (수정 #2) ===
  /** 지정 슬롯(1-based) 에 빈 큐브 생성 + 선택 */
  addCubeAtSlot(listId: string, slotIndex: number): void;
  /** 큐브를 지정 슬롯으로 이동. 그 슬롯에 다른 큐브 있으면 swap */
  moveCubeToSlot(listId: string, cubeId: string, slotIndex: number): void;
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
   * 현재 뷰의 가시 큐브 집합 — 수정 #2: sort_order = 절대 슬롯 번호 (1-based).
   * 페이지 N (0-based)의 슬롯 범위 = [N*size+1, (N+1)*size]. 그 범위 안 큐브만 반환.
   * 빈 슬롯은 CubeGrid 컴포넌트에서 sort_order 누락 분기 직접 처리.
   */
  visibleCubes(): Cube[] {
    const scoped = get().scopedCubes();
    const size = get().pageSize();
    const page = get().current_page;
    const startSlot = page * size + 1;
    const endSlot = (page + 1) * size;
    return scoped.filter((c) => c.sort_order >= startSlot && c.sort_order <= endSlot);
  },

  pageSize(): number {
    const list = get().activeList();
    if (!list) return 15;
    const cols = list.cols ?? 5;
    return list.cubes_per_page ?? cols * 3;
  },

  totalPages(): number {
    // 수정 #2: sort_order = 절대 슬롯. 가장 큰 sort_order 기준으로 페이지 수 계산.
    // (큐브 개수가 아닌 슬롯 위치 — 1번 + 50번 큐브가 있으면 페이지 2개 필요)
    const scoped = get().scopedCubes();
    if (scoped.length === 0) return 1;
    const maxSlot = Math.max(...scoped.map((c) => c.sort_order));
    const size = get().pageSize();
    return Math.max(1, Math.ceil(maxSlot / size));
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
   * 드래그&드롭 reorder — fromId 의 sort_order 를 toId 와 인접 사이값으로 변경.
   * 코드리뷰 H2: 사이값 보간 후 인접 간격이 1e-6 이하로 좁아지면 전체 정수 재정규화 (1, 2, 3...).
   * SD-G 결정(모바일 PWA 동일): 1D real sort_order, 사이값 보간으로 row/col 변경 불필요.
   */
  reorderCubes(listId: string, fromId: string, toId: string): void {
    const { pack } = get();
    if (!pack || fromId === toId) return;

    const REORDER_EPSILON = 1e-6;

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

      // 1차: 사이값 보간 적용
      let updated = l.cubes.map((c) => (c.id === fromId ? { ...c, sort_order: newSort } : c));

      // 2차: 인접 간격 검사 — 1e-6 이하면 전체 정수 재정규화 (1, 2, 3...)
      const reSorted = [...updated].sort((a, b) => a.sort_order - b.sort_order);
      let needsRenorm = false;
      for (let i = 1; i < reSorted.length; i++) {
        if (reSorted[i].sort_order - reSorted[i - 1].sort_order < REORDER_EPSILON) {
          needsRenorm = true;
          break;
        }
      }
      if (needsRenorm) {
        const renormMap = new Map(reSorted.map((c, i) => [c.id, i + 1]));
        updated = updated.map((c) => ({ ...c, sort_order: renormMap.get(c.id) ?? c.sort_order }));
      }

      return { ...l, cubes: updated };
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

  // === 자유 슬롯 배치 (수정 #2) ===

  addCubeAtSlot(listId: string, slotIndex: number): void {
    const { pack } = get();
    if (!pack) return;
    const list = pack.lists.find((l) => l.id === listId);
    if (!list) return;
    // 해당 슬롯에 이미 큐브 있으면 무시 (사용자가 빈 슬롯만 클릭)
    if (list.cubes.some((c) => c.sort_order === slotIndex)) return;

    const newCube: Cube = {
      id: crypto.randomUUID(),
      sort_order: slotIndex,
      label: '새 큐브',
      icon_url: null,
      action_type: 'link',
      action_payload: { url: '' },
    };
    const nextLists = pack.lists.map((l) =>
      l.id === listId ? { ...l, cubes: [...l.cubes, newCube] } : l,
    );
    set({ pack: { ...pack, lists: nextLists }, cube_id: newCube.id });
  },

  moveCubeToSlot(listId: string, cubeId: string, slotIndex: number): void {
    const { pack } = get();
    if (!pack) return;
    const list = pack.lists.find((l) => l.id === listId);
    if (!list) return;
    const moving = list.cubes.find((c) => c.id === cubeId);
    if (!moving || moving.sort_order === slotIndex) return;

    const occupant = list.cubes.find(
      (c) => c.sort_order === slotIndex && c.id !== cubeId,
    );

    const nextCubes = list.cubes.map((c) => {
      if (c.id === cubeId) return { ...c, sort_order: slotIndex };
      if (occupant && c.id === occupant.id) return { ...c, sort_order: moving.sort_order };
      return c;
    });

    const nextLists = pack.lists.map((l) =>
      l.id === listId ? { ...l, cubes: nextCubes } : l,
    );
    set({ pack: { ...pack, lists: nextLists } });
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
