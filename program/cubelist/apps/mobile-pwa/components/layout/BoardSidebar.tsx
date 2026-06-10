'use client';

import { useCubeBoards } from '@/lib/hooks/useCubeBoards';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/lib/toast/useToast';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { useMemo, useState, type DragEvent } from 'react';

/**
 * 좌측 보드 사이드바 — Stream Deck 좌측 패널 대응.
 *
 * sm 이상에서만 표시 (모바일은 헤더 탭 칩 유지).
 * 활성 워크스페이스의 보드를 그룹화 + 보드 클릭 시 전환.
 *
 * 정착본 v3 (2026-05-23 Stream Deck UI 반영):
 * - 좌측 230px 고정 패널
 * - 워크스페이스 헤더 + 보드 목록
 * - 활성 보드 핑크 강조
 * - 큐브 수 우측 카운트
 */

interface BoardSidebarProps {
  /** 보드 클릭 시 emblaApi.scrollTo + setActiveBoard 콜백 */
  onSelectBoard?: (boardId: string) => void;
  /** 새 보드 생성 트리거 */
  onCreateBoard?: () => void;
}

export function BoardSidebar({ onSelectBoard, onCreateBoard }: BoardSidebarProps) {
  const { boards: allBoards, activeBoardId, setActiveBoard, loadBoards } = useCubeBoards();
  const { activeWorkspaceId, workspaces } = useWorkspace();
  const { locale } = useTranslation();
  const { showToast } = useToast();
  const [dropOverBoardId, setDropOverBoardId] = useState<string | null>(null);

  const localOnlyMsg =
    locale === 'en' ? 'LOCAL_MODE only' : locale === 'ja' ? 'LOCAL_MODE のみ' : 'LOCAL_MODE에서만 동작';
  const cubeAdded = (label: string): string =>
    locale === 'en'
      ? `Added "${label}"`
      : locale === 'ja'
        ? `"${label}" を追加しました`
        : `"${label}" 큐브 추가됨`;

  /**
   * 우클릭 메뉴 (이름 변경 / ws 이동 / 삭제).
   *
   * **TUO 영구 결정 (2026-05-23)**: 현재 `window.prompt`/`window.confirm` 사용.
   * 장점: 의존성 0, 모바일 호환, 즉시 동작.
   * 단점: 브라우저별 스타일 비일관, UI 톤 차이, 정수 외 입력 검증 X.
   *
   * 교체 시점: Stage 2 prep — 사용자 보고가 발생하거나 `CubeContextMenu` 패턴을
   * BoardSidebar에 재사용하는 결정 후. 현재는 안정성/속도 우선으로 유지.
   * 변경 시: 본 주석 + night-auto-log TUO 인용 동시 갱신 필수.
   */
  function handleContextMenu(e: React.MouseEvent, boardId: string, boardName: string): void {
    e.preventDefault();
    if (!isLocalMode()) {
      showToast({ level: 'warning', message: localOnlyMsg });
      return;
    }
    const choice = window.prompt(
      locale === 'en'
        ? `Action for "${boardName}"?\n1=rename, 2=move workspace, 3=delete`
        : locale === 'ja'
          ? `"${boardName}" の操作?\n1=名前変更, 2=ワークスペース移動, 3=削除`
          : `"${boardName}" 작업?\n1=이름 변경, 2=워크스페이스 이동, 3=삭제`,
      '1',
    );
    if (choice === null) return;

    if (choice === '1') {
      const newName = window.prompt(
        locale === 'en' ? 'New name' : locale === 'ja' ? '新しい名前' : '새 이름',
        boardName,
      );
      if (!newName || newName.trim().length === 0) return;
      localStore.updateBoard(boardId, { name: newName.trim() });
      void loadBoards();
    } else if (choice === '2') {
      const options = [
        { id: null as string | null, name: locale === 'en' ? 'Default' : locale === 'ja' ? 'デフォルト' : '기본' },
        ...workspaces.map((w) => ({ id: w.id, name: w.name })),
      ];
      const list = options.map((o, i) => `${i + 1}. ${o.name}`).join('\n');
      const idxStr = window.prompt(
        (locale === 'en' ? 'Target workspace:' : locale === 'ja' ? '移動先ワークスペース:' : '이동할 워크스페이스:') + '\n' + list,
        '1',
      );
      if (idxStr === null) return;
      const idx = Number.parseInt(idxStr, 10) - 1;
      if (Number.isNaN(idx) || idx < 0 || idx >= options.length) return;
      localStore.moveBoardToWorkspace(boardId, options[idx].id);
      void loadBoards();
      showToast({
        level: 'success',
        message: `${boardName} → ${options[idx].name}`,
        duration: 2_500,
      });
    } else if (choice === '3') {
      const confirm = window.confirm(
        locale === 'en'
          ? `Delete "${boardName}"? All its cubes will be removed.`
          : locale === 'ja'
            ? `"${boardName}" を削除? すべてのキューブが削除されます。`
            : `"${boardName}" 삭제? 모든 큐브가 함께 삭제됩니다.`,
      );
      if (!confirm) return;
      localStore.deleteBoard(boardId);
      void loadBoards();
    }
  }

  // DnD: 표 모드 큐브 드롭 시 해당 보드에 추가
  function handleDrop(e: DragEvent<HTMLButtonElement>, boardId: string): void {
    e.preventDefault();
    setDropOverBoardId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        type?: string;
        label?: string;
        icon_src?: string | null;
        action_type?: 'link' | 'shortcut' | 'macro';
        url?: string | null;
      };
      if (data.type !== 'cubelist/cube' || !data.label) return;
      if (!isLocalMode()) {
        showToast({ level: 'warning', message: localOnlyMsg });
        return;
      }
      const action_payload: Record<string, unknown> = {};
      if (data.url) action_payload.url = data.url;
      localStore.addItem(boardId, {
        label: data.label,
        icon_url: data.icon_src ?? null,
        action_type: data.action_type ?? 'link',
        action_payload,
        // SD-E (2026-05-23): DnD 자동 라벨 → linked_title=true (사용자 수정 시 자동 해제)
        metadata: { source: 'jusomoa', via: 'dnd', linked_title: true },
      });
      void loadBoards();
      showToast({
        level: 'success',
        message: cubeAdded(data.label),
        duration: 2_000,
      });
    } catch {
      // 무시
    }
  }

  // 활성 워크스페이스 보드만 필터
  const boards = useMemo(
    () => allBoards.filter((b) => (b.workspace_id ?? null) === activeWorkspaceId),
    [allBoards, activeWorkspaceId],
  );

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const wsName =
    activeWs?.name ?? (locale === 'en' ? 'Default' : locale === 'ja' ? 'デフォルト' : '기본');

  const headerLabel =
    locale === 'en' ? 'Boards' : locale === 'ja' ? 'ボード' : '보드';
  const newLabel =
    locale === 'en' ? '+ New board' : locale === 'ja' ? '+ 新規ボード' : '+ 새 리스트';
  const empty =
    locale === 'en'
      ? 'No boards yet'
      : locale === 'ja'
        ? 'まだボードがありません'
        : '아직 보드가 없습니다';

  function handleClick(boardId: string): void {
    setActiveBoard(boardId);
    onSelectBoard?.(boardId);
  }

  return (
    <aside
      className="hidden sm:flex flex-col w-[220px] flex-shrink-0 border-r border-border bg-surface-2/60 backdrop-blur"
      aria-label={headerLabel}
    >
      <header className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-ink-muted truncate">▶ {wsName}</span>
          <span className="text-xs font-semibold text-ink">{headerLabel}</span>
        </div>
        <span className="text-[10px] text-ink-muted font-mono">{boards.length}</span>
      </header>

      <nav className="flex-1 overflow-y-auto py-1" role="list">
        {boards.length === 0 ? (
          <p className="px-3 py-4 text-xs text-ink-muted text-center">{empty}</p>
        ) : (
          boards.map((board) => {
            const isActive = board.id === activeBoardId;
            const isDropOver = dropOverBoardId === board.id;
            return (
              <button
                key={board.id}
                type="button"
                role="listitem"
                onClick={() => handleClick(board.id)}
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes('application/json')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    setDropOverBoardId(board.id);
                  }
                }}
                onDragLeave={() => setDropOverBoardId(null)}
                onDrop={(e) => handleDrop(e, board.id)}
                onContextMenu={(e) => handleContextMenu(e, board.id, board.name)}
                title={
                  locale === 'en'
                    ? 'Right-click: rename/move/delete'
                    : locale === 'ja'
                      ? '右クリック: 名前変更/移動/削除'
                      : '우클릭: 이름 변경/이동/삭제'
                }
                aria-current={isActive}
                className={
                  isDropOver
                    ? 'w-full text-left px-3 py-2 text-xs font-medium bg-rbs-accent-soft text-rbs-accent-strong ring-2 ring-rbs-accent flex items-center justify-between gap-2 dark:bg-rbs-accent/20 dark:text-rbs-accent'
                    : isActive
                      ? 'w-full text-left px-3 py-2 text-xs font-medium bg-rbs-accent text-white flex items-center justify-between gap-2'
                      : 'w-full text-left px-3 py-2 text-xs text-ink hover:bg-surface-2 flex items-center justify-between gap-2'
                }
              >
                <span className="truncate flex-1">{board.name}</span>
                <span
                  className={
                    isActive
                      ? 'text-[10px] font-mono opacity-90'
                      : 'text-[10px] font-mono text-ink-muted'
                  }
                >
                  {board.items.length}
                </span>
              </button>
            );
          })
        )}
      </nav>

      {onCreateBoard && (
        <button
          type="button"
          onClick={onCreateBoard}
          className="border-t border-border px-3 py-2.5 text-xs text-rbs-accent hover:bg-rbs-accent-soft dark:hover:bg-rbs-accent/10 font-medium text-left"
        >
          {newLabel}
        </button>
      )}
    </aside>
  );
}
