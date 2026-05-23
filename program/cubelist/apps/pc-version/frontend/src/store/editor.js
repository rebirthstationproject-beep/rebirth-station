/**
 * 편집기 상태 스토어 (zustand) — M2
 *
 * 단일 진실원: 현재 로드된 큐브팩 + 활성 리스트 + 선택 큐브.
 * 영속화 (.cubepack 파일 ↔ store) 는 M2 후반 cubepack-io 모듈에서 처리.
 */
import { create } from 'zustand';
export const useEditor = create((set, get) => ({
    pack: null,
    pack_id: null,
    list_id: null,
    cube_id: null,
    activeList() {
        const { pack, list_id } = get();
        if (!pack || !list_id)
            return null;
        return pack.lists.find((l) => l.id === list_id) ?? null;
    },
    selectedCube() {
        const list = get().activeList();
        const { cube_id } = get();
        if (!list || !cube_id)
            return null;
        return list.cubes.find((c) => c.id === cube_id) ?? null;
    },
    loadPack(pack) {
        const firstListId = pack.lists[0]?.id ?? null;
        set({
            pack,
            pack_id: pack.id,
            list_id: firstListId,
            cube_id: null,
        });
    },
    closePack() {
        set({ pack: null, pack_id: null, list_id: null, cube_id: null });
    },
    selectList(listId) {
        set({ list_id: listId, cube_id: null });
    },
    selectCube(cubeId) {
        set({ cube_id: cubeId });
    },
    upsertCube(listId, cube) {
        const { pack } = get();
        if (!pack)
            return;
        const nextLists = pack.lists.map((l) => {
            if (l.id !== listId)
                return l;
            const idx = l.cubes.findIndex((c) => c.id === cube.id);
            const cubes = idx === -1
                ? [...l.cubes, cube]
                : l.cubes.map((c, i) => (i === idx ? cube : c));
            return { ...l, cubes };
        });
        set({ pack: { ...pack, lists: nextLists } });
    },
    removeCube(listId, cubeId) {
        const { pack, cube_id } = get();
        if (!pack)
            return;
        const nextLists = pack.lists.map((l) => l.id === listId ? { ...l, cubes: l.cubes.filter((c) => c.id !== cubeId) } : l);
        set({
            pack: { ...pack, lists: nextLists },
            cube_id: cube_id === cubeId ? null : cube_id,
        });
    },
    /**
     * 드래그&드롭 reorder — fromId 의 sort_order 를 toId 와 인접 큐브 사이값으로 변경.
     * SD-G 결정(모바일 PWA 동일): 1D real sort_order, 사이값 보간으로 row/col 변경 불필요.
     */
    reorderCubes(listId, fromId, toId) {
        const { pack } = get();
        if (!pack || fromId === toId)
            return;
        const nextLists = pack.lists.map((l) => {
            if (l.id !== listId)
                return l;
            const sorted = [...l.cubes].sort((a, b) => a.sort_order - b.sort_order);
            const fromIdx = sorted.findIndex((c) => c.id === fromId);
            const toIdx = sorted.findIndex((c) => c.id === toId);
            if (fromIdx === -1 || toIdx === -1)
                return l;
            const targetSort = sorted[toIdx].sort_order;
            const neighborIdx = fromIdx < toIdx ? toIdx + 1 : toIdx - 1;
            const neighborSort = neighborIdx >= 0 && neighborIdx < sorted.length
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
}));
