/**
 * LocalStore — localStorage 기반 boards/items CRUD
 *
 * 사용 컨텍스트:
 * - LOCAL_MODE = true (NEXT_PUBLIC_LOCAL_MODE) 시 활성
 * - DB 없이 UI/UX 테스트 가능
 * - 로그인 우회 — fake user_id 사용
 * - 새로고침 후 데이터 유지 (localStorage)
 * - Realtime/다중기기 동기화 X (로컬만)
 *
 * 진실원: localStorage key `cubelist:local:state`
 * 데이터 구조: { boards: CubeBoard[] (items 포함, hydrated) }
 */

import type { CubeBoard, CubeItem, Workspace } from '@/lib/types/cube';

const STORAGE_KEY = 'cubelist:local:state';
const WORKSPACE_KEY = 'cubelist:local:workspaces';
const ACTIVE_WORKSPACE_KEY = 'cubelist:local:active-workspace';

/** LOCAL_MODE에서 모든 데이터의 user_id로 사용 — 고정 UUID v4 */
export const LOCAL_USER_ID = '00000000-0000-4000-8000-000000000001';

interface LocalState {
  boards: CubeBoard[];
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // 폴백 (구형 브라우저)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function read(): LocalState {
  if (typeof window === 'undefined') return { boards: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { boards: [] };
    const parsed = JSON.parse(raw) as LocalState;
    return { boards: Array.isArray(parsed.boards) ? parsed.boards : [] };
  } catch {
    return { boards: [] };
  }
}

function write(state: LocalState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const localStore = {
  /** 전체 boards (items 포함, sort_order asc) */
  loadBoards(): CubeBoard[] {
    const { boards } = read();
    return boards
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => ({
        ...b,
        items: (b.items ?? []).slice().sort((x, y) => x.sort_order - y.sort_order),
      }));
  },

  createBoard(name: string): CubeBoard {
    const state = read();
    const nextSort = state.boards.length === 0 ? 0 : Math.max(...state.boards.map((b) => b.sort_order)) + 1;
    const board: CubeBoard = {
      id: uuid(),
      user_id: LOCAL_USER_ID,
      name: name.trim().slice(0, 64),
      sort_order: nextSort,
      metadata: {},
      created_at: now(),
      updated_at: now(),
      items: [],
    };
    state.boards.push(board);
    write(state);
    return board;
  },

  updateBoard(id: string, patch: Partial<Pick<CubeBoard, 'name' | 'metadata'>>): void {
    const state = read();
    const board = state.boards.find((b) => b.id === id);
    if (!board) return;
    if (patch.name !== undefined) board.name = patch.name.trim().slice(0, 64);
    if (patch.metadata !== undefined) board.metadata = patch.metadata;
    board.updated_at = now();
    write(state);
  },

  deleteBoard(id: string): void {
    const state = read();
    state.boards = state.boards.filter((b) => b.id !== id);
    write(state);
  },

  /** 보드 순서 swap (a ↔ b) */
  swapBoards(idA: string, idB: string): void {
    const state = read();
    const a = state.boards.find((b) => b.id === idA);
    const b = state.boards.find((b) => b.id === idB);
    if (!a || !b) return;
    const tmp = a.sort_order;
    a.sort_order = b.sort_order;
    b.sort_order = tmp;
    a.updated_at = now();
    b.updated_at = now();
    write(state);
  },

  addItem(
    boardId: string,
    input: { label: string; icon_url?: string | null; action_type: CubeItem['action_type']; action_payload: Record<string, unknown>; metadata?: Record<string, unknown> },
  ): CubeItem | null {
    const state = read();
    const board = state.boards.find((b) => b.id === boardId);
    if (!board) return null;
    const items = board.items ?? [];
    const nextSort = items.length === 0 ? 0 : Math.max(...items.map((i) => i.sort_order)) + 1;
    // SD-CD (2026-05-23): metadata.action_uuid 자동 채움 (없을 때만)
    // 외부 import 또는 사용자 명시 시 보존, 일반 생성 시 com.cubelist.{action_type} 기본값
    const meta: Record<string, unknown> = { ...(input.metadata ?? {}) };
    if (typeof meta.action_uuid !== 'string' || meta.action_uuid.length === 0) {
      meta.action_uuid = `com.cubelist.${input.action_type}`;
    }
    const item: CubeItem = {
      id: uuid(),
      board_id: boardId,
      sort_order: nextSort,
      label: input.label.trim().slice(0, 32),
      icon_url: input.icon_url ?? null,
      action_type: input.action_type,
      action_payload: input.action_payload,
      metadata: meta,
      created_at: now(),
      updated_at: now(),
    };
    board.items = [...items, item];
    board.updated_at = now();
    write(state);
    return item;
  },

  updateItem(itemId: string, patch: Partial<Omit<CubeItem, 'id' | 'board_id' | 'created_at'>>): void {
    const state = read();
    for (const board of state.boards) {
      const item = (board.items ?? []).find((i) => i.id === itemId);
      if (item) {
        Object.assign(item, patch);
        item.updated_at = now();
        board.updated_at = now();
        write(state);
        return;
      }
    }
  },

  /**
   * 큐브 복제 (TUT, 2026-05-23) — 원본 큐브의 모든 필드를 복사한 후 새 id 부여,
   * 라벨 끝에 " (복사)" 접미사 추가 (16자 안전 truncation), sort_order는 원본 바로 뒤.
   * @returns 새 큐브 또는 원본 미발견 시 null
   */
  duplicateItem(itemId: string): CubeItem | null {
    const state = read();
    for (const board of state.boards) {
      const items = board.items ?? [];
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx === -1) continue;
      const src = items[idx];
      const newLabel = (src.label + ' (복사)').slice(0, 32);
      // TVT (2026-05-23): metadata deep clone 후 hotkey 자동 제거 — 보드 내 충돌 방지.
      // 복제본은 사용자가 새 hotkey를 의도적으로 설정해야 함.
      const clonedMeta = src.metadata
        ? (JSON.parse(JSON.stringify(src.metadata)) as Record<string, unknown>)
        : {};
      delete clonedMeta.hotkey;
      const newItem: CubeItem = {
        id: uuid(),
        board_id: src.board_id,
        sort_order: src.sort_order + 0.5, // 사이값 → reorder 후 정수화
        label: newLabel,
        icon_url: src.icon_url,
        action_type: src.action_type,
        action_payload: JSON.parse(JSON.stringify(src.action_payload)) as Record<string, unknown>,
        metadata: clonedMeta,
        created_at: now(),
        updated_at: now(),
      };
      // 사이값 sort_order 정리 — 전체 재인덱싱
      const newItems = [...items.slice(0, idx + 1), newItem, ...items.slice(idx + 1)].map(
        (it, i) => ({ ...it, sort_order: i }),
      );
      board.items = newItems;
      board.updated_at = now();
      write(state);
      return newItem;
    }
    return null;
  },

  deleteItem(itemId: string): void {
    const state = read();
    for (const board of state.boards) {
      const before = board.items?.length ?? 0;
      board.items = (board.items ?? []).filter((i) => i.id !== itemId);
      if ((board.items.length ?? 0) !== before) {
        board.updated_at = now();
        write(state);
        return;
      }
    }
  },

  /** 큐브 순서 일괄 재배치 (배열 인덱스를 sort_order로 사용) */
  reorderItems(boardId: string, ordered: CubeItem[]): void {
    const state = read();
    const board = state.boards.find((b) => b.id === boardId);
    if (!board) return;
    const byId = new Map((board.items ?? []).map((i) => [i.id, i] as const));
    board.items = ordered.map((it, idx) => {
      const existing = byId.get(it.id);
      if (!existing) return { ...it, sort_order: idx * 1.0 };
      return { ...existing, sort_order: idx * 1.0, updated_at: now() };
    });
    board.updated_at = now();
    write(state);
  },

  /** 전체 초기화 (디버그/리셋 용) */
  reset(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(WORKSPACE_KEY);
    window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  },

  // ============================================================================
  // 워크스페이스 (Stream Deck Profile 대응)
  // ============================================================================

  loadWorkspaces(): Workspace[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(WORKSPACE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Workspace[];
      return Array.isArray(parsed)
        ? parsed.slice().sort((a, b) => a.sort_order - b.sort_order)
        : [];
    } catch {
      return [];
    }
  },

  saveWorkspaces(workspaces: Workspace[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspaces));
  },

  createWorkspace(name: string): Workspace {
    const list = this.loadWorkspaces();
    const nextSort = list.length === 0 ? 0 : Math.max(...list.map((w) => w.sort_order)) + 1;
    const ws: Workspace = {
      id: uuid(),
      name: name.trim().slice(0, 64),
      sort_order: nextSort,
      created_at: now(),
      updated_at: now(),
      metadata: {},
    };
    list.push(ws);
    this.saveWorkspaces(list);
    return ws;
  },

  updateWorkspace(id: string, patch: Partial<Pick<Workspace, 'name' | 'metadata'>>): void {
    const list = this.loadWorkspaces();
    const ws = list.find((w) => w.id === id);
    if (!ws) return;
    if (patch.name !== undefined) ws.name = patch.name.trim().slice(0, 64);
    if (patch.metadata !== undefined) ws.metadata = patch.metadata;
    ws.updated_at = now();
    this.saveWorkspaces(list);
  },

  deleteWorkspace(id: string): void {
    // 워크스페이스 삭제 시 소속 보드도 함께 삭제 (CASCADE 패턴)
    const list = this.loadWorkspaces().filter((w) => w.id !== id);
    this.saveWorkspaces(list);
    const state = read();
    state.boards = state.boards.filter((b) => b.workspace_id !== id);
    write(state);
  },

  getActiveWorkspaceId(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  },

  setActiveWorkspaceId(id: string | null): void {
    if (typeof window === 'undefined') return;
    if (id === null) window.localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    else window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  },

  /** createBoard 확장 — workspace_id 인자 추가 */
  createBoardInWorkspace(name: string, workspaceId: string | null): CubeBoard {
    const state = read();
    // 같은 워크스페이스의 보드들 중 최대 sort_order + 1
    const wsBoards = state.boards.filter((b) => (b.workspace_id ?? null) === workspaceId);
    const nextSort = wsBoards.length === 0 ? 0 : Math.max(...wsBoards.map((b) => b.sort_order)) + 1;
    const board: CubeBoard = {
      id: uuid(),
      user_id: LOCAL_USER_ID,
      name: name.trim().slice(0, 64),
      sort_order: nextSort,
      workspace_id: workspaceId,
      metadata: {},
      created_at: now(),
      updated_at: now(),
      items: [],
    };
    state.boards.push(board);
    write(state);
    return board;
  },

  /** 보드를 다른 워크스페이스로 이동 */
  moveBoardToWorkspace(boardId: string, workspaceId: string | null): void {
    const state = read();
    const board = state.boards.find((b) => b.id === boardId);
    if (!board) return;
    board.workspace_id = workspaceId;
    board.updated_at = now();
    write(state);
  },
};

export function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';
}
