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

  // === 2A 폴더 드래그 인 ===
  /**
   * 큐브를 폴더의 cube_ids 에 추가 (불변 갱신).
   * ① 대상이 folder 타입인지 확인
   * ② cubeId 가 다른 폴더의 cube_ids 에 있으면 제거
   * ③ 대상 폴더 cube_ids 에 추가 (중복 방지)
   * ④ folder 를 folder 에 넣으려는 경우 no-op (중첩 1단 금지)
   */
  addCubeToFolder(listId: string, folderId: string, cubeId: string): void;

  // === 자유 슬롯 배치 (수정 #2) ===
  /** 지정 슬롯(1-based) 에 빈 큐브 생성 + 선택 */
  addCubeAtSlot(listId: string, slotIndex: number): void;
  /** 큐브를 지정 슬롯으로 이동. 그 슬롯에 다른 큐브 있으면 swap */
  moveCubeToSlot(listId: string, cubeId: string, slotIndex: number): void;

  // === 리스트(페이지) 관리 (수정 #2 — UI 분할) ===
  /** 새 빈 리스트 추가 (페이지 = 리스트). 자동 선택 */
  addList(name?: string): void;
  /** 리스트 이름 변경 */
  renameList(listId: string, name: string): void;
  /** 리스트 라벨 표시 토글 (R2 보완 — show_labels 옵셔널, undefined=ON) */
  setListShowLabels(listId: string, show: boolean): void;
  /** 리스트 삭제 */
  removeList(listId: string): void;

  // === 큐브 라이브러리 (Phase 2b) ===
  library_selected_id: string | null;
  /** 라이브러리 큐브 선택 (Inspector 에 표시) */
  selectLibraryCube(cubeId: string | null): void;
  /** 라이브러리 큐브 추가 */
  addLibraryCube(partial?: Partial<Cube>): void;
  /** 라이브러리 큐브 수정 */
  updateLibraryCube(cubeId: string, partial: Partial<Cube>): void;
  /** 라이브러리 큐브 삭제 */
  removeLibraryCube(cubeId: string): void;
  /** 라이브러리 큐브를 리스트로 복사 (cube_ids 순서대로 빈 슬롯에 채움) */
  addListFromLibrary(name: string, cubeIds: string[]): void;

  // === 리스트 만들기 모드 (Phase 3) ===
  list_maker_active: boolean;
  list_maker_selection: string[]; // 선택 순서대로 라이브러리 cube id
  startListMaker(): void;
  toggleListMakerSelection(cubeId: string): void;
  finishListMaker(name: string): void;
  cancelListMaker(): void;

  // === Draft 리스트 (사용자가 편집 중, 라이브러리와 별개) ===
  draft_list: CubeList | null;
  /** draft 통째 교체 (null 이면 초기화) */
  setDraftList(list: CubeList | null): void;
  /** draft 의 메타 변경 (이름, cols, cubes_per_page) */
  updateDraftMeta(partial: Partial<Pick<CubeList, 'name' | 'cols' | 'cubes_per_page'>>): void;
  /** draft 에 빈 큐브 슬롯 추가 */
  addCubeToDraftSlot(slotIndex: number): void;
  /** draft 안 큐브 이동/swap */
  moveCubeInDraft(cubeId: string, toSlot: number): void;
  /** draft 안 큐브 삭제 */
  removeCubeFromDraft(cubeId: string): void;
  /** draft 안 큐브 수정 */
  updateCubeInDraft(cubeId: string, partial: Partial<Cube>): void;

  // === M4 Plugin SDK 연동 ===
  /** plugin setImage → 큐브 아이콘 실시간 갱신 (pack.lists / pack.cubes / draft_list 모두 검색) */
  updateCubeIconUrl(cubeId: string, iconUrl: string): void;
  /** PropertyInspector setSettings → 큐브 action_payload.settings 갱신 */
  updateCubeSettings(cubeId: string, settings: Record<string, unknown>): void;

  // === W2 리스트 스킨 ===
  /**
   * 리스트 내 특정 큐브들의 icon_url 을 아이콘팩 data URL 로 교체.
   * 원본은 metadata.pre_skin_icon 에 보존 (최초 원본 유지 — 이미 있으면 덮어쓰지 않음).
   * metadata.skin_source = 팩 이름 기록.
   */
  applySkinToList(
    listId: string,
    replacements: Array<{ cubeId: string; iconDataUrl: string; packName: string }>,
  ): void;
  /**
   * 리스트 내 모든 스킨 큐브를 원상복구.
   * pre_skin_icon 복원 + skin_source 제거.
   */
  removeSkinFromList(listId: string): void;
}

export const useEditor = create<EditorState>((set, get) => ({
  pack: null,
  pack_id: null,
  list_id: null,
  cube_id: null,
  current_folder_id: null,
  folder_stack: [],
  current_page: 0,
  library_selected_id: null,
  list_maker_active: false,
  list_maker_selection: [],
  draft_list: null,

  activeList(): CubeList | null {
    const { pack, list_id, draft_list } = get();
    // draft 가 활성이면 우선 반환
    if (draft_list && list_id === draft_list.id) return draft_list;
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
    if (!list) return 28;
    // 명시값 우선, 미설정 시 cols * 7 (= 4 × 7 = 28 기본)
    if (list.cubes_per_page && list.cubes_per_page > 0) return list.cubes_per_page;
    const cols = list.cols ?? 4;
    return Math.max(28, cols * 7);
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
    // 부팅 시 list_id = null (빈 상태로 시작) — 사용자가 직접 폴더 선택
    set({
      pack,
      pack_id: pack.id,
      list_id: null,
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
    // 최근 리스트 갱신 (localStorage cubelist:recent_lists, 최대 8개)
    if (listId) {
      try {
        const raw = window.localStorage.getItem('cubelist:recent_lists') ?? '[]';
        const recent: string[] = JSON.parse(raw);
        const next = [listId, ...recent.filter((x) => x !== listId)].slice(0, 8);
        window.localStorage.setItem('cubelist:recent_lists', JSON.stringify(next));
      } catch {
        /* localStorage 손상은 무시 */
      }
    }
    // 리스트 전환 시 폴더 스택 + 페이지 초기화
    set({
      list_id: listId,
      cube_id: null,
      current_folder_id: null,
      folder_stack: [],
      current_page: 0,
    });
    // v0.1.4 사전: 모바일 PWA 등 외부 구독자에 selection_change 송신
    void import('../lib/LiveSyncBridge').then(({ liveSync }) => {
      liveSync.emitSelectionChange({ list_id: listId, cube_id: null, page_index: 0 });
    });
  },

  selectCube(cubeId: string | null): void {
    set({ cube_id: cubeId });
    // v0.1.4 사전: 모바일 PWA 등 외부 구독자에 selection_change 송신
    void import('../lib/LiveSyncBridge').then(({ liveSync }) => {
      const { list_id, current_folder_id, current_page } = get();
      liveSync.emitSelectionChange({
        list_id,
        cube_id: cubeId,
        page_index: current_page,
        current_folder_id: current_folder_id ?? undefined,
      });
    });
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

  // === 2A 폴더 드래그 인 ===

  addCubeToFolder(listId: string, folderId: string, cubeId: string): void {
    const { pack } = get();
    if (!pack) return;
    const list = pack.lists.find((l) => l.id === listId);
    if (!list) return;

    const folderCube = list.cubes.find((c) => c.id === folderId);
    // ① folder 타입인지 확인
    if (!folderCube || folderCube.action_type !== 'folder') return;
    // ④ folder 를 folder 에 넣는 것 금지 (중첩 1단)
    const movingCube = list.cubes.find((c) => c.id === cubeId);
    if (!movingCube || movingCube.action_type === 'folder') return;

    const nextCubes = list.cubes.map((c) => {
      if (c.action_type !== 'folder') return c;
      const payload = c.action_payload as { cube_ids?: string[] };
      const existingIds: string[] = payload.cube_ids ?? [];

      if (c.id === folderId) {
        // ③ 대상 폴더에 추가 (중복 방지)
        if (existingIds.includes(cubeId)) return c;
        return {
          ...c,
          action_payload: { ...payload, cube_ids: [...existingIds, cubeId] },
        };
      }
      // ② 다른 폴더에 있으면 제거
      if (existingIds.includes(cubeId)) {
        return {
          ...c,
          action_payload: { ...payload, cube_ids: existingIds.filter((id) => id !== cubeId) },
        };
      }
      return c;
    });

    const nextLists = pack.lists.map((l) =>
      l.id === listId ? { ...l, cubes: nextCubes } : l,
    );
    set({ pack: { ...pack, lists: nextLists } });
  },

  // === 자유 슬롯 배치 (수정 #2) ===

  addCubeAtSlot(listId: string, slotIndex: number): void {
    const { pack, draft_list } = get();
    // Draft 분기
    if (draft_list && listId === draft_list.id) {
      get().addCubeToDraftSlot(slotIndex);
      return;
    }
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
    const { pack, draft_list } = get();
    // Draft 분기
    if (draft_list && listId === draft_list.id) {
      get().moveCubeInDraft(cubeId, slotIndex);
      return;
    }
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

  // === 리스트(페이지) 관리 ===

  addList(name?: string): void {
    const { pack } = get();
    if (!pack) return;
    const maxSort = pack.lists.length === 0
      ? 0
      : Math.max(...pack.lists.map((l) => l.sort_order));
    const idx = pack.lists.length + 1;
    const newList: CubeList = {
      id: crypto.randomUUID(),
      name: name ?? `page ${idx}`,
      sort_order: maxSort + 1,
      cols: 4,
      cubes_per_page: 28,
      cubes: [],
    };
    set({
      pack: { ...pack, lists: [...pack.lists, newList] },
      list_id: newList.id,
      cube_id: null,
      current_folder_id: null,
      folder_stack: [],
      current_page: 0,
    });
  },

  renameList(listId: string, name: string): void {
    const { pack } = get();
    if (!pack) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    const nextLists = pack.lists.map((l) =>
      l.id === listId ? { ...l, name: trimmed } : l,
    );
    set({ pack: { ...pack, lists: nextLists } });
  },

  setListShowLabels(listId: string, show: boolean): void {
    const { pack } = get();
    if (!pack) return;
    const nextLists = pack.lists.map((l) =>
      l.id === listId ? { ...l, show_labels: show } : l,
    );
    set({ pack: { ...pack, lists: nextLists } });
  },

  removeList(listId: string): void {
    const { pack, list_id } = get();
    if (!pack || pack.lists.length <= 1) return; // 최소 1개 유지
    const nextLists = pack.lists.filter((l) => l.id !== listId);
    set({
      pack: { ...pack, lists: nextLists },
      list_id: list_id === listId ? (nextLists[0]?.id ?? null) : list_id,
      cube_id: null,
      current_folder_id: null,
      folder_stack: [],
      current_page: 0,
    });
  },

  // === 큐브 라이브러리 (Phase 2b) ===

  selectLibraryCube(cubeId: string | null): void {
    set({ library_selected_id: cubeId });
  },

  addLibraryCube(partial?: Partial<Cube>): void {
    const { pack } = get();
    if (!pack) return;
    const newCube: Cube = {
      id: crypto.randomUUID(),
      sort_order: 0,
      label: partial?.label ?? '새 큐브',
      icon_url: partial?.icon_url ?? null,
      action_type: partial?.action_type ?? 'link',
      action_payload: partial?.action_payload ?? { url: '' },
      ...(partial?.metadata ? { metadata: partial.metadata } : {}),
    };
    const cubes = [...(pack.cubes ?? []), newCube];
    set({ pack: { ...pack, cubes }, library_selected_id: newCube.id });
  },

  updateLibraryCube(cubeId: string, partial: Partial<Cube>): void {
    const { pack } = get();
    if (!pack) return;
    const cubes = (pack.cubes ?? []).map((c) =>
      c.id === cubeId ? { ...c, ...partial, id: c.id, sort_order: 0 } : c,
    );
    set({ pack: { ...pack, cubes } });
  },

  removeLibraryCube(cubeId: string): void {
    const { pack, library_selected_id } = get();
    if (!pack) return;
    const cubes = (pack.cubes ?? []).filter((c) => c.id !== cubeId);
    set({
      pack: { ...pack, cubes },
      library_selected_id: library_selected_id === cubeId ? null : library_selected_id,
    });
  },

  addListFromLibrary(name: string, cubeIds: string[]): void {
    const { pack } = get();
    if (!pack) return;
    const lib = pack.cubes ?? [];
    const maxSort = pack.lists.length === 0
      ? 0
      : Math.max(...pack.lists.map((l) => l.sort_order));
    // 라이브러리 큐브 복사 + sort_order = 1..N (순서대로)
    const cubesForList: Cube[] = [];
    cubeIds.forEach((id, idx) => {
      const lib_cube = lib.find((c) => c.id === id);
      if (!lib_cube) return;
      cubesForList.push({
        ...lib_cube,
        id: crypto.randomUUID() as string, // 새 ID (리스트 인스턴스)
        sort_order: idx + 1,
      });
    });

    const newList: CubeList = {
      id: crypto.randomUUID(),
      name: name.trim() || `page ${pack.lists.length + 1}`,
      sort_order: maxSort + 1,
      cols: 4,
      cubes_per_page: 28,
      cubes: cubesForList,
    };
    set({
      pack: { ...pack, lists: [...pack.lists, newList] },
      list_id: newList.id,
      current_page: 0,
      list_maker_active: false,
      list_maker_selection: [],
    });
  },

  // === 리스트 만들기 모드 (Phase 3) ===

  startListMaker(): void {
    set({ list_maker_active: true, list_maker_selection: [] });
  },

  toggleListMakerSelection(cubeId: string): void {
    const { list_maker_selection } = get();
    const idx = list_maker_selection.indexOf(cubeId);
    if (idx === -1) {
      set({ list_maker_selection: [...list_maker_selection, cubeId] });
    } else {
      // 이미 선택 시 제거 (재클릭 = 해제)
      set({ list_maker_selection: list_maker_selection.filter((id) => id !== cubeId) });
    }
  },

  finishListMaker(name: string): void {
    const { list_maker_selection, pack } = get();
    if (list_maker_selection.length === 0 || !pack) {
      set({ list_maker_active: false });
      return;
    }
    // draft_list 생성 (pack.lists 에 추가하지 X — 사용자 명시 "비어 있는 상태로 시작 > 저장하면 파일 생성")
    const libAll = pack.lists.flatMap((l) => l.cubes).concat(pack.cubes ?? []);
    const draftCubes: Cube[] = [];
    list_maker_selection.forEach((id, idx) => {
      const src = libAll.find((c) => c.id === id);
      if (!src) return;
      draftCubes.push({
        ...src,
        id: crypto.randomUUID() as string,
        sort_order: idx + 1,
      });
    });
    const draft: CubeList = {
      id: crypto.randomUUID() as string,
      name: name.trim() || '새 리스트',
      sort_order: 1,
      cols: 4,
      cubes_per_page: 28,
      cubes: draftCubes,
    };
    set({
      draft_list: draft,
      list_id: draft.id,
      list_maker_active: false,
      list_maker_selection: [],
      current_page: 0,
    });
  },

  // === Draft 액션 ===

  setDraftList(list: CubeList | null): void {
    if (list) {
      set({ draft_list: list, list_id: list.id, current_page: 0 });
    } else {
      const cur = get();
      const wasDraft = cur.draft_list && cur.list_id === cur.draft_list.id;
      set({ draft_list: null, list_id: wasDraft ? null : cur.list_id });
    }
  },

  updateDraftMeta(partial): void {
    const cur = get().draft_list;
    if (!cur) return;
    set({ draft_list: { ...cur, ...partial } });
  },

  addCubeToDraftSlot(slotIndex: number): void {
    const cur = get().draft_list;
    if (!cur) return;
    if (cur.cubes.some((c) => c.sort_order === slotIndex)) return; // 이미 있음
    const newCube: Cube = {
      id: crypto.randomUUID() as string,
      sort_order: slotIndex,
      label: '새 큐브',
      icon_url: null,
      action_type: 'link',
      action_payload: { url: '' },
    };
    set({
      draft_list: { ...cur, cubes: [...cur.cubes, newCube] },
      cube_id: newCube.id,
    });
  },

  moveCubeInDraft(cubeId: string, toSlot: number): void {
    const cur = get().draft_list;
    if (!cur) return;
    const moving = cur.cubes.find((c) => c.id === cubeId);
    if (!moving) return;
    const occupant = cur.cubes.find((c) => c.sort_order === toSlot && c.id !== cubeId);
    const next = cur.cubes.map((c) => {
      if (c.id === cubeId) return { ...c, sort_order: toSlot };
      if (occupant && c.id === occupant.id) return { ...c, sort_order: moving.sort_order };
      return c;
    });
    set({ draft_list: { ...cur, cubes: next } });
  },

  removeCubeFromDraft(cubeId: string): void {
    const cur = get().draft_list;
    if (!cur) return;
    set({ draft_list: { ...cur, cubes: cur.cubes.filter((c) => c.id !== cubeId) } });
  },

  updateCubeInDraft(cubeId: string, partial: Partial<Cube>): void {
    const cur = get().draft_list;
    if (!cur) return;
    set({
      draft_list: {
        ...cur,
        cubes: cur.cubes.map((c) => (c.id === cubeId ? { ...c, ...partial } : c)),
      },
    });
  },

  updateCubeIconUrl(cubeId: string, iconUrl: string): void {
    const { pack, draft_list } = get();
    let changed = false;
    let nextPack = pack;
    if (pack) {
      const newLists = pack.lists.map((l) => {
        const cubes = l.cubes.map((c) => {
          if (c.id === cubeId) {
            changed = true;
            return { ...c, icon_url: iconUrl };
          }
          return c;
        });
        return changed ? { ...l, cubes } : l;
      });
      const newCubes = pack.cubes?.map((c) => {
        if (c.id === cubeId) {
          changed = true;
          return { ...c, icon_url: iconUrl };
        }
        return c;
      });
      nextPack = { ...pack, lists: newLists, ...(newCubes ? { cubes: newCubes } : {}) };
    }
    let nextDraft = draft_list;
    if (draft_list) {
      const dcubes = draft_list.cubes.map((c) => {
        if (c.id === cubeId) {
          changed = true;
          return { ...c, icon_url: iconUrl };
        }
        return c;
      });
      nextDraft = { ...draft_list, cubes: dcubes };
    }
    if (changed) {
      set({ pack: nextPack, draft_list: nextDraft });
    }
  },

  updateCubeSettings(cubeId: string, settings: Record<string, unknown>): void {
    const updater = (c: Cube): Cube => {
      if (c.id !== cubeId) return c;
      const existing = (c.action_payload ?? {}) as Record<string, unknown>;
      return {
        ...c,
        action_payload: { ...existing, settings },
      };
    };
    const { pack, draft_list } = get();
    let nextPack = pack;
    if (pack) {
      nextPack = {
        ...pack,
        lists: pack.lists.map((l) => ({ ...l, cubes: l.cubes.map(updater) })),
        cubes: pack.cubes ? pack.cubes.map(updater) : pack.cubes,
      };
    }
    const nextDraft = draft_list
      ? { ...draft_list, cubes: draft_list.cubes.map(updater) }
      : draft_list;
    set({ pack: nextPack, draft_list: nextDraft });
  },

  cancelListMaker(): void {
    set({ list_maker_active: false, list_maker_selection: [] });
  },

  // === W2 리스트 스킨 ===

  applySkinToList(listId, replacements) {
    const { pack } = get();
    if (!pack) return;
    const replacementMap = new Map(replacements.map((r) => [r.cubeId, r]));
    const nextLists = pack.lists.map((l) => {
      if (l.id !== listId) return l;
      const cubes = l.cubes.map((c) => {
        const rep = replacementMap.get(c.id);
        if (!rep) return c;
        const meta = (c.metadata ?? {}) as Record<string, unknown>;
        // 최초 원본만 보존 (이미 pre_skin_icon 있으면 덮어쓰지 않음)
        const preSkinIcon = meta.pre_skin_icon !== undefined ? meta.pre_skin_icon : c.icon_url;
        return {
          ...c,
          icon_url: rep.iconDataUrl,
          metadata: {
            ...meta,
            pre_skin_icon: preSkinIcon,
            skin_source: rep.packName,
          },
        };
      });
      return { ...l, cubes };
    });
    set({ pack: { ...pack, lists: nextLists } });
  },

  removeSkinFromList(listId) {
    const { pack } = get();
    if (!pack) return;
    const nextLists = pack.lists.map((l) => {
      if (l.id !== listId) return l;
      const cubes = l.cubes.map((c) => {
        const meta = (c.metadata ?? {}) as Record<string, unknown>;
        if (!('skin_source' in meta)) return c;
        const { pre_skin_icon, skin_source: _removed, ...restMeta } = meta;
        return {
          ...c,
          icon_url: (pre_skin_icon as string | null | undefined) ?? null,
          metadata: restMeta,
        };
      });
      return { ...l, cubes };
    });
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
