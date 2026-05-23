'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { useTranslation } from '@/lib/i18n/useTranslation';

const COPY = {
  ko: {
    defaultWs: '기본',
    select: '워크스페이스 선택',
    newWs: '+ 새 워크스페이스',
    newPrompt: '워크스페이스 이름',
    deleteConfirm: (n: string) => `"${n}" 워크스페이스 삭제? 소속 보드도 함께 삭제됩니다.`,
    rename: '이름 변경',
    delete: '삭제',
  },
  en: {
    defaultWs: 'Default',
    select: 'Select workspace',
    newWs: '+ New workspace',
    newPrompt: 'Workspace name',
    deleteConfirm: (n: string) => `Delete "${n}" workspace? All its boards will also be deleted.`,
    rename: 'Rename',
    delete: 'Delete',
  },
  ja: {
    defaultWs: 'デフォルト',
    select: 'ワークスペース選択',
    newWs: '+ 新規ワークスペース',
    newPrompt: 'ワークスペース名',
    deleteConfirm: (n: string) => `"${n}" ワークスペースを削除? 所属ボードも一緒に削除されます。`,
    rename: '名前変更',
    delete: '削除',
  },
};

export function WorkspaceSwitcher() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.ko;
  const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace, updateWorkspace, deleteWorkspace } =
    useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeName = activeWs?.name ?? c.defaultWs;

  function handleCreate(): void {
    const name = window.prompt(c.newPrompt);
    if (!name || name.trim().length === 0) return;
    const ws = createWorkspace(name);
    if (ws) {
      setActiveWorkspace(ws.id);
      setOpen(false);
    }
  }

  function handleRename(wsId: string, currentName: string): void {
    const name = window.prompt(c.rename, currentName);
    if (!name || name.trim().length === 0) return;
    updateWorkspace(wsId, { name });
  }

  function handleDelete(wsId: string, name: string): void {
    if (!window.confirm(c.deleteConfirm(name))) return;
    deleteWorkspace(wsId);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-lg border border-border hover:bg-surface-2 flex items-center gap-1.5"
        aria-haspopup="menu"
        aria-expanded={open}
        title={c.select}
      >
        <span className="truncate max-w-[120px]">📁 {activeName}</span>
        <span className="text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 z-40 min-w-[200px] rounded-lg border border-border bg-surface shadow-lg overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setActiveWorkspace(null);
              setOpen(false);
            }}
            className={`w-full text-left text-xs px-3 py-2 hover:bg-surface-2 ${
              activeWorkspaceId === null ? 'bg-rbs-accent-soft text-rbs-accent-strong font-medium' : 'text-ink'
            }`}
          >
            📂 {c.defaultWs}
          </button>
          {workspaces.map((ws) => (
            <div key={ws.id} className="flex items-stretch border-t border-border">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setOpen(false);
                }}
                className={`flex-1 text-left text-xs px-3 py-2 hover:bg-surface-2 truncate ${
                  activeWorkspaceId === ws.id
                    ? 'bg-rbs-accent-soft text-rbs-accent-strong font-medium'
                    : 'text-ink'
                }`}
              >
                📁 {ws.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename(ws.id, ws.name);
                }}
                className="px-2 text-ink-muted hover:text-rbs-accent text-xs"
                title={c.rename}
                aria-label={c.rename}
              >
                ✎
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(ws.id, ws.name);
                }}
                className="px-2 text-ink-muted hover:text-red-500 text-xs"
                title={c.delete}
                aria-label={c.delete}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={handleCreate}
            className="w-full text-left text-xs px-3 py-2 border-t border-border bg-surface-2 text-rbs-accent hover:bg-rbs-accent-soft font-medium"
          >
            {c.newWs}
          </button>
        </div>
      )}
    </div>
  );
}
