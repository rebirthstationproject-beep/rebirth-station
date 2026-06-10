/**
 * PlayMode — 작동 모드 전체화면 오버레이 (W1, 2026-06-10).
 *
 * 편집 chrome 없이 단일 클릭 = 즉시 실행.
 * - 폴더 진입/탈출, 페이지 내비게이션, plugin_action(fireCubeKey), 그 외 실행형(executeCube).
 * - live_* 큐브: 중앙 useDynamicCubes tick 으로 살아 움직임.
 * - 실행 오류: 비차단 토스트 (3초 자동 소멸).
 * - Esc 키 = 닫기.
 * - 비 Tauri(브라우저 dev): link 큐브만 window.open, 나머지는 "PC 앱 전용" 토스트.
 * - PlayMode 로컬 상태만 사용 (편집기 store 오염 없음).
 */

import { useEffect, useState, useCallback } from 'react';
import type { Cube, CubeList, CubePack } from '../types/cube';
import { CubeCellVisual } from './CubeCell';
import { useDynamicCubes } from '../lib/useDynamicCubes';
import { executeCube, isTauri } from '../lib/tauri-bridge';
import { fireCubeKey } from './PluginRunnerHost';
import { useTranslation } from '../lib/i18n/useTranslation';

// ── 토스트 ─────────────────────────────────────────────────────────────────

interface Toast {
  readonly id: number;
  readonly message: string;
}

let _toastSeq = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string) => {
    const id = ++_toastSeq;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, addToast };
}

// ── 로컬 내비게이션 상태 ────────────────────────────────────────────────────

interface NavState {
  readonly listId: string;
  readonly folderId: string | null;
  readonly folderStack: string[];
  readonly page: number;
}

function getPageSize(list: CubeList): number {
  if (list.cubes_per_page && list.cubes_per_page > 0) return list.cubes_per_page;
  const cols = list.cols ?? 4;
  return Math.max(28, cols * 7);
}

/** 루트/폴더 범위 큐브 (페이지 적용 전) */
function scopedCubes(list: CubeList, folderId: string | null): Cube[] {
  if (!folderId) {
    const inFolder = new Set<string>();
    for (const c of list.cubes) {
      if (c.action_type === 'folder') {
        const ids = (c.action_payload as { cube_ids?: string[] }).cube_ids ?? [];
        ids.forEach((id) => inFolder.add(id));
      }
    }
    return list.cubes.filter((c) => !inFolder.has(c.id));
  }
  const folder = list.cubes.find((c) => c.id === folderId);
  if (!folder || folder.action_type !== 'folder') return [];
  const ids = new Set((folder.action_payload as { cube_ids?: string[] }).cube_ids ?? []);
  return list.cubes.filter((c) => ids.has(c.id));
}

/** 페이지 슬라이스 큐브 */
function visibleCubes(list: CubeList, folderId: string | null, page: number): Cube[] {
  const scoped = scopedCubes(list, folderId);
  const size = getPageSize(list);
  const startSlot = page * size + 1;
  const endSlot = (page + 1) * size;
  return scoped.filter((c) => c.sort_order >= startSlot && c.sort_order <= endSlot);
}

function totalPages(list: CubeList, folderId: string | null): number {
  const scoped = scopedCubes(list, folderId);
  if (scoped.length === 0) return 1;
  const maxSlot = Math.max(...scoped.map((c) => c.sort_order));
  const size = getPageSize(list);
  return Math.max(1, Math.ceil(maxSlot / size));
}

// ── PlayModeGrid ──────────────────────────────────────────────────────────

interface PlayModeGridProps {
  readonly cubes: Cube[];
  readonly list: CubeList;
  readonly nowMs: number;
  readonly dynamicUpdates: Map<string, { label?: string; icon_url?: string | null }>;
  readonly onCubeClick: (cube: Cube) => void;
}

function PlayModeGrid({
  cubes,
  list,
  nowMs,
  dynamicUpdates,
  onCubeClick,
}: PlayModeGridProps) {
  const cols = list.cols ?? 4;
  const size = getPageSize(list);

  // 그리드 슬롯 (빈 슬롯 포함)
  // PlayModeGrid 는 이미 page 슬라이스된 큐브만 받음 — 페이지 0-base 오프셋 계산
  const firstSlot = cubes.length > 0 ? Math.min(...cubes.map((c) => c.sort_order)) : 1;
  const pageBase = Math.floor((firstSlot - 1) / size) * size;
  const slots: (Cube | null)[] = [];
  for (let i = 0; i < size; i++) {
    const slotIdx = pageBase + i + 1;
    slots.push(cubes.find((c) => c.sort_order === slotIdx) ?? null);
  }

  return (
    <div
      className="play-mode-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'var(--cube-gap, 10px)',
        padding: '16px',
        flex: 1,
        overflow: 'auto',
      }}
    >
      {slots.map((cube, idx) => {
        if (!cube) {
          return (
            <div
              key={`empty-${idx}`}
              className="play-mode-empty-slot"
              style={{
                width: 'var(--cube-size, 96px)',
                height: 'var(--cube-size, 96px)',
                background: 'var(--bg-tertiary, #1a1a1a)',
                borderRadius: 'var(--cube-radius, 12px)',
              }}
            />
          );
        }
        const dyn = dynamicUpdates.get(cube.id);
        const displayCube: Cube = dyn
          ? {
              ...cube,
              label: dyn.label ?? cube.label,
              icon_url: dyn.icon_url !== undefined ? dyn.icon_url : cube.icon_url,
            }
          : cube;
        return (
          <button
            key={cube.id}
            type="button"
            className="play-mode-cell-btn"
            onClick={() => onCubeClick(cube)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: 'var(--cube-size, 96px)',
              height: 'var(--cube-size, 96px)',
              display: 'block',
            }}
            title={cube.label}
          >
            <CubeCellVisual
              cube={displayCube}
              nowMs={nowMs}
              showLabels={list.show_labels !== false}
            />
          </button>
        );
      })}
    </div>
  );
}

// ── PlayMode ──────────────────────────────────────────────────────────────

export interface PlayModeProps {
  readonly pack: CubePack;
  readonly initialListId?: string | null;
  readonly onClose: () => void;
}

export function PlayMode({ pack, initialListId, onClose }: PlayModeProps) {
  const { t } = useTranslation();
  const { toasts, addToast } = useToasts();

  // 로컬 내비게이션 상태 (편집기 store 오염 없음)
  const [nav, setNav] = useState<NavState>(() => {
    const firstListId = initialListId ?? pack.lists[0]?.id ?? '';
    return { listId: firstListId, folderId: null, folderStack: [], page: 0 };
  });

  const currentList = pack.lists.find((l) => l.id === nav.listId) ?? pack.lists[0] ?? null;
  const cubes = currentList ? visibleCubes(currentList, nav.folderId, nav.page) : [];
  const allListCubes = currentList ? currentList.cubes : [];

  // live_* 중앙 tick
  const { updates: dynamicUpdates, nowMs } = useDynamicCubes(allListCubes);

  // 현재 폴더 큐브
  const currentFolder = nav.folderId
    ? allListCubes.find((c) => c.id === nav.folderId) ?? null
    : null;

  // 페이지 계산
  const totalPagesCount = currentList ? totalPages(currentList, nav.folderId) : 1;
  const hasPrev = nav.page > 0;
  const hasNext = nav.page + 1 < totalPagesCount;

  // Esc 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 큐브 클릭 핸들러
  const handleCubeClick = useCallback(
    async (cube: Cube): Promise<void> => {
      const at = cube.action_type;

      // folder 진입
      if (at === 'folder') {
        setNav((prev) => ({
          ...prev,
          folderId: cube.id,
          folderStack: prev.folderId ? [...prev.folderStack, prev.folderId] : prev.folderStack,
          page: 0,
        }));
        return;
      }

      // 폴더 탈출
      if (at === 'folder_up') {
        setNav((prev) => {
          if (prev.folderStack.length === 0) {
            return { ...prev, folderId: null, page: 0 };
          }
          const next = [...prev.folderStack];
          const parent = next.pop() ?? null;
          return { ...prev, folderId: parent, folderStack: next, page: 0 };
        });
        return;
      }

      // 페이지 내비게이션
      if (at === 'page_navigate') {
        const delta = (cube.action_payload as { delta?: number }).delta ?? 1;
        setNav((prev) => {
          const next = Math.max(0, Math.min(prev.page + delta, totalPagesCount - 1));
          return { ...prev, page: next };
        });
        return;
      }

      if (at === 'page_jump') {
        const idx = (cube.action_payload as { page_index?: number }).page_index ?? 0;
        setNav((prev) => ({
          ...prev,
          page: Math.max(0, Math.min(idx, totalPagesCount - 1)),
        }));
        return;
      }

      // 비 Tauri: link 만 처리
      if (!isTauri()) {
        if (at === 'link') {
          const url =
            typeof cube.action_payload.url === 'string' ? cube.action_payload.url : '';
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          addToast(t('playmode.pc_only_toast'));
        }
        return;
      }

      // plugin_action → fireCubeKey (PluginRunnerHost 등록된 runtime)
      if (at === 'plugin_action') {
        const fired = fireCubeKey(cube.id);
        if (!fired) {
          // runtime 미등록 — fallback: executeCube 경유 (vendor URL 등)
          try {
            await executeCube(cube);
          } catch (e) {
            const { describeExecuteError } = await import('../lib/tauri-bridge');
            addToast(describeExecuteError(e));
          }
        }
        return;
      }

      // 그 외 실행형
      try {
        await executeCube(cube);
      } catch (e) {
        const { describeExecuteError } = await import('../lib/tauri-bridge');
        addToast(describeExecuteError(e));
      }
    },
    [addToast, t, totalPagesCount],
  );

  if (!currentList) {
    return (
      <div className="play-mode-overlay">
        <div style={{ color: 'var(--text-secondary)', padding: 24 }}>
          {t('playmode.no_list')}
        </div>
        <button type="button" className="play-mode-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      className="play-mode-overlay"
      role="dialog"
      aria-label={t('playmode.title')}
    >
      {/* 미니 상단 바 */}
      <div className="play-mode-topbar">
        {/* 리스트 탭 전환 */}
        <div className="play-mode-list-tabs">
          {pack.lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`play-mode-tab-btn${nav.listId === l.id ? ' is-active' : ''}`}
              onClick={() =>
                setNav({ listId: l.id, folderId: null, folderStack: [], page: 0 })
              }
            >
              {l.name}
            </button>
          ))}
        </div>

        {/* 브레드크럼 + 페이지 내비 */}
        <div className="play-mode-nav">
          {nav.folderId && currentFolder && (
            <button
              type="button"
              className="play-mode-nav-btn"
              onClick={() => {
                setNav((prev) => {
                  if (prev.folderStack.length === 0) {
                    return { ...prev, folderId: null, page: 0 };
                  }
                  const next = [...prev.folderStack];
                  const parent = next.pop() ?? null;
                  return { ...prev, folderId: parent, folderStack: next, page: 0 };
                });
              }}
              title={t('grid.exit_folder')}
            >
              ↩
            </button>
          )}
          <button
            type="button"
            className="play-mode-nav-btn"
            onClick={() => setNav((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
            disabled={!hasPrev}
          >
            ◀
          </button>
          <span className="play-mode-page-indicator">
            {nav.page + 1}/{totalPagesCount}
          </span>
          <button
            type="button"
            className="play-mode-nav-btn"
            onClick={() =>
              setNav((prev) => ({ ...prev, page: Math.min(prev.page + 1, totalPagesCount - 1) }))
            }
            disabled={!hasNext}
          >
            ▶
          </button>
        </div>

        {/* 닫기 */}
        <button
          type="button"
          className="play-mode-close-btn"
          onClick={onClose}
          aria-label={t('playmode.close')}
        >
          ✕
        </button>
      </div>

      {/* 큐브 그리드 */}
      <PlayModeGrid
        cubes={cubes}
        list={currentList}
        nowMs={nowMs}
        dynamicUpdates={dynamicUpdates}
        onCubeClick={handleCubeClick}
      />

      {/* 토스트 */}
      <div className="play-mode-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="play-mode-toast">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
