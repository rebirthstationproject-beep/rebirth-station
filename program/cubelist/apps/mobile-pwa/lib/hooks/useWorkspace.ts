'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import type { Workspace } from '@/lib/types/cube';

/**
 * 워크스페이스 (Stream Deck Profile 대응) zustand store.
 *
 * 정착본 v3 (2026-05-22 Stream Deck 반영):
 * - 보드 묶음 = 작업 컨텍스트 (예: "주소모아 라이브러리", "개인", "업무")
 * - 활성 워크스페이스의 boards만 그리드/탭에 노출
 * - workspace_id = null 보드는 "기본" 워크스페이스에 자동 귀속
 *
 * LOCAL_MODE: localStorage 기반
 * DB 모드: Stage 2 (Supabase `mylist_workspaces` 신규 마이그레이션 필요)
 */

interface WorkspaceState {
  workspaces: Workspace[];
  /** null = 기본 워크스페이스 (workspace_id 미지정 보드) */
  activeWorkspaceId: string | null;
  loading: boolean;
  loadWorkspaces: () => void;
  createWorkspace: (name: string) => Workspace | null;
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, 'name' | 'metadata'>>) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string | null) => void;
}

const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  loading: false,

  loadWorkspaces: () => {
    if (!isLocalMode()) {
      // DB 모드 — Stage 2 BLOCKED
      set({ workspaces: [], activeWorkspaceId: null, loading: false });
      return;
    }
    const list = localStore.loadWorkspaces();
    const activeId = localStore.getActiveWorkspaceId();
    // activeWorkspaceId가 존재 검증 — 삭제된 ws id면 null로
    const stillExists = activeId && list.some((w) => w.id === activeId);
    set({
      workspaces: list,
      activeWorkspaceId: stillExists ? activeId : null,
      loading: false,
    });
  },

  createWorkspace: (name) => {
    if (!isLocalMode()) return null;
    const ws = localStore.createWorkspace(name);
    set({ workspaces: localStore.loadWorkspaces() });
    return ws;
  },

  updateWorkspace: (id, patch) => {
    if (!isLocalMode()) return;
    localStore.updateWorkspace(id, patch);
    set({ workspaces: localStore.loadWorkspaces() });
  },

  deleteWorkspace: (id) => {
    if (!isLocalMode()) return;
    localStore.deleteWorkspace(id);
    set({ workspaces: localStore.loadWorkspaces() });
    if (get().activeWorkspaceId === id) {
      localStore.setActiveWorkspaceId(null);
      set({ activeWorkspaceId: null });
    }
  },

  setActiveWorkspace: (id) => {
    if (isLocalMode()) localStore.setActiveWorkspaceId(id);
    set({ activeWorkspaceId: id });
  },
}));

export function useWorkspace(): WorkspaceState {
  const state = useWorkspaceStore();
  useEffect(() => {
    state.loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
