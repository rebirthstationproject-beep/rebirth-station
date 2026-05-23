'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CubeListView } from '@/components/cube/CubeListView';
import { CubeTableView } from '@/components/cube/CubeTableView';
import { CubeInspector } from '@/components/cube/CubeInspector';
import { AdBanner } from '@/components/ads/AdBanner';
import { ShortcutHelp } from '@/components/ui/ShortcutHelp';
import { useCubeBoards } from '@/lib/hooks/useCubeBoards';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { parseActionPayload, type CubeItem } from '@/lib/types/cube';
import { useToast } from '@/lib/toast/useToast';
import { useMountMode } from '@/lib/hooks/useMountMode';
import { useHelperConnection } from '@/lib/hooks/useHelperConnection';
import { useSession } from '@/lib/hooks/useSession';
import { useShortcuts, type ShortcutBinding } from '@/lib/hooks/useShortcuts';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { BoardSidebar } from '@/components/layout/BoardSidebar';

export default function ListPage() {
  const [editMode, setEditMode] = useState(false);
  const searchParams = useSearchParams();
  const initialView = searchParams?.get('openLibrary') === '1' ? 'table' : 'grid';
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(initialView);
  const [helpOpen, setHelpOpen] = useState(false);
  // Stream Deck 인스펙터 — 편집 모드에서 선택된 큐브
  const [selectedCube, setSelectedCube] = useState<CubeItem | null>(null);
  const { activeBoardId, loadBoards, boards } = useCubeBoards();
  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;
  // 편집 모드 종료 시 선택 자동 해제
  useEffect(() => {
    if (!editMode) setSelectedCube(null);
  }, [editMode]);
  const mount = useMountMode();
  const helper = useHelperConnection();
  const { user } = useSession();
  const { showToast } = useToast();
  const nickname = (user?.user_metadata?.nickname as string | undefined) ?? null;
  const { locale } = useTranslation();
  // Mac 감지 — 단축키 기호 표기에 사용 (formatShortcut과 동일 로직)
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    type NavWithUAD = Navigator & { userAgentData?: { platform?: string } };
    const uad = (navigator as NavWithUAD).userAgentData?.platform;
    if (uad) {
      setIsMac(/mac/i.test(uad));
    } else {
      setIsMac(/Mac/i.test(navigator.platform) || /Mac OS X/i.test(navigator.userAgent));
    }
  }, []);
  const bindingLabels =
    locale === 'en'
      ? {
          edit: 'Toggle edit mode',
          mount: 'Toggle mount mode',
          search: 'Search cubes',
          searchAlt: 'Search cubes (alternate)',
          prev: 'Previous board',
          next: 'Next board',
          help: 'Shortcut help',
          esc: 'Close help · deselect cube · close sheet',
          duplicate: 'Duplicate selected cube',
        }
      : locale === 'ja'
        ? {
            edit: '編集モード切替',
            mount: '据え置きモード切替',
            search: 'キューブ検索',
            searchAlt: 'キューブ検索 (代替)',
            prev: '前のボードへ',
            next: '次のボードへ',
            help: 'ショートカット ヘルプ',
            esc: 'ヘルプ閉じる・キューブ選択解除・シート閉じる',
            duplicate: '選択キューブを複製',
          }
        : {
            edit: '편집 모드 전환',
            mount: '거치 모드 전환',
            search: '큐브 검색',
            searchAlt: '큐브 검색 (대체)',
            prev: '이전 보드로',
            next: '다음 보드로',
            help: '단축키 도움말',
            esc: '도움말 닫기 · 큐브 선택 해제 · 시트 닫기',
            duplicate: '선택 큐브 복제',
          };

  const bindings = useMemo<ShortcutBinding[]>(
    () => [
      { key: 'e', label: bindingLabels.edit, handler: () => setEditMode((v) => !v) },
      { key: 'm', label: bindingLabels.mount, handler: () => mount.toggle() },
      // 검색 단축키 — 시각 안내용 (실제 핸들러는 CubeListView에서 등록)
      { key: '/', label: bindingLabels.search, handler: () => undefined },
      { key: 'k', mod: true, label: bindingLabels.searchAlt, handler: () => undefined },
      // 보드 네비 — 시각 안내용 (실제 핸들러는 tablist onKeyDown에서 처리)
      { key: 'arrowleft', label: bindingLabels.prev, handler: () => undefined },
      { key: 'arrowright', label: bindingLabels.next, handler: () => undefined },
      { key: '?', shift: true, label: bindingLabels.help, handler: () => setHelpOpen(true), priority: 30 },
      // Ctrl/Cmd+D 큐브 복제 (TVA, 2026-05-23) — 편집 모드 + selectedCube 있을 때만
      {
        key: 'd',
        mod: true,
        label: bindingLabels.duplicate,
        priority: 20,
        handler: () => {
          if (!editMode || !selectedCube || !isLocalMode()) return;
          const newItem = localStore.duplicateItem(selectedCube.id);
          if (newItem) void loadBoards();
        },
      },
      // Esc 우선순위 (TST-T, 2026-05-23): 도움말 → 인스펙터 선택 해제 순. 둘 다 없으면 no-op.
      {
        key: 'escape',
        label: bindingLabels.esc,
        handler: () => {
          if (helpOpen) {
            setHelpOpen(false);
          } else if (selectedCube !== null) {
            setSelectedCube(null);
          }
        },
      },
      // 큐브 단축키 동적 등록 (TVK, 2026-05-23) — 활성 보드 큐브 중 metadata.hotkey 있는 큐브만.
      // Stage 1 LOCAL_MODE: link 큐브만 window.open 발화. shortcut/macro는 PC helper 필요 (후속).
      // 편집 모드일 때는 비활성 (사용자가 hotkey 편집 중일 수 있음).
      ...(activeBoard?.items ?? [])
        .filter((it) => typeof it.metadata?.hotkey === 'string' && (it.metadata.hotkey as string).length > 0)
        .map((it): ShortcutBinding => ({
          key: (it.metadata?.hotkey as string).toLowerCase(),
          label:
            locale === 'en'
              ? `Cube: ${it.label}`
              : locale === 'ja'
                ? `キューブ: ${it.label}`
                : `큐브: ${it.label}`,
          handler: () => {
            if (editMode) return;
            // TVK 1차: link 큐브는 window.open (helper 없어도 동작)
            if (it.action_type === 'link') {
              const url = (it.action_payload as { url?: string })?.url;
              if (url) window.open(url, '_blank', 'noopener,noreferrer');
              return;
            }
            // TVP 2차: shortcut/macro는 PC helper sendPressItem
            if (it.action_type === 'shortcut' || it.action_type === 'macro') {
              if (helper.status !== 'connected') {
                const msg =
                  locale === 'en'
                    ? 'PC helper not connected — pair first'
                    : locale === 'ja'
                      ? 'PC ヘルパーが未接続です — まずペアリング'
                      : 'PC 헬퍼가 연결되지 않음 — 먼저 페어링하세요';
                showToast({ level: 'warning', message: msg, duration: 2_500 });
                return;
              }
              const action = parseActionPayload(it);
              helper.sendPressItem(activeBoard?.id ?? '', it.id, 'tap', action);
            }
          },
          priority: 10,
        })),
    ],
    [mount, bindingLabels, helpOpen, selectedCube, editMode, loadBoards, activeBoard, locale, helper, showToast],
  );

  useShortcuts(bindings, { disabled: helpOpen });

  return (
    <main className={mount.active ? 'cubelist-mount-mode' : ''}>
      <a href="#cubelist-main" className="cubelist-skip-link">
        본문으로 건너뛰기
      </a>
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-rbs-accent-strong hidden sm:inline">리버스 스테이션</span>
          <span className="text-ink-muted hidden sm:inline">/</span>
          <span className="font-semibold truncate">큐브 리스트</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {nickname && (
            <Link
              href="/account"
              className="hidden sm:inline text-xs text-ink-muted hover:text-rbs-accent truncate max-w-[120px]"
              title={`${nickname} · 계정 이동`}
            >
              @{nickname}
            </Link>
          )}
          <ConnectionDotI18n status={helper.status} />
          <WorkspaceSwitcher />
          <button
            type="button"
            onClick={() => setViewMode((v) => (v === 'grid' ? 'table' : 'grid'))}
            className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-lg border border-border hover:bg-surface-2"
            aria-pressed={viewMode === 'table'}
            title="그리드 ↔ 표 전환"
          >
            {viewMode === 'grid' ? '표 보기' : '그리드'}
          </button>
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-lg border border-border hover:bg-surface-2"
            aria-pressed={editMode}
            title="E"
          >
            {editMode ? '완료' : '편집'}
          </button>
          <button
            type="button"
            onClick={mount.toggle}
            className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-lg border border-border hover:bg-surface-2"
            aria-pressed={mount.active}
            title="M"
          >
            <span className="sm:hidden">{mount.active ? '거치 해제' : '거치'}</span>
            <span className="hidden sm:inline">{mount.active ? '거치 해제' : '거치 모드'}</span>
          </button>
          <LocaleSwitcher size="compact" />
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-lg border border-border hover:bg-surface-2 inline-flex items-center gap-1"
            title="Shift+?"
            aria-label="단축키 도움말 (Shift+?)"
            aria-keyshortcuts="Shift+?"
          >
            <span>?</span>
            <kbd className="hidden sm:inline text-[9px] opacity-60">
              {isMac ? '⇧?' : 'Shift+?'}
            </kbd>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 — 그리드/표 모드 모두 노출. 표 모드는 DnD 드롭존 역할 */}
        <BoardSidebar />
        <div id="cubelist-main" tabIndex={-1} className="flex-1 min-w-0">
          {viewMode === 'grid' ? (
            <CubeListView
              editMode={editMode}
              onRequestEdit={() => setEditMode(true)}
              onOpenLibrary={() => setViewMode('table')}
              onSelectCube={setSelectedCube}
              selectedCubeId={selectedCube?.id ?? null}
            />
          ) : (
            <CubeTableView onImportDone={() => setViewMode('grid')} />
          )}
        </div>
        {/* Stream Deck 우측 인스펙터 — 편집 모드 + 그리드 + lg 이상에서만 노출 */}
        {editMode && viewMode === 'grid' && (
          <CubeInspector
            selectedCube={selectedCube}
            activeBoardId={activeBoardId}
            activeBoardName={activeBoard?.name ?? null}
            activeBoardItemCount={activeBoard?.items.length ?? 0}
            activeBoardItems={activeBoard?.items ?? []}
            onChange={() => void loadBoards()}
            onDeselect={() => setSelectedCube(null)}
          />
        )}
      </div>
      <AdBanner />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} bindings={bindings} />
    </main>
  );
}

interface ConnectionDotProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

const CONNECTION_LABELS: Record<'ko' | 'en' | 'ja', Record<ConnectionDotProps['status'], string>> = {
  ko: {
    connected: 'PC 연결됨',
    connecting: '연결 중',
    disconnected: 'PC 없음',
  },
  en: {
    connected: 'Connected to PC',
    connecting: 'Connecting…',
    disconnected: 'No PC',
  },
  ja: {
    connected: 'PC に接続',
    connecting: '接続中…',
    disconnected: 'PC なし',
  },
};

const CONNECTION_TOOLTIPS: Record<'ko' | 'en' | 'ja', Record<ConnectionDotProps['status'], string>> = {
  ko: {
    connected: 'LAN WebSocket으로 PC 헬퍼와 연결됨. 단축키·매크로 즉시 실행 가능.',
    connecting: 'PC 헬퍼를 찾는 중입니다…',
    disconnected: 'PC 헬퍼가 없습니다. 페어링 후 사용하세요.',
  },
  en: {
    connected: 'Linked to PC helper via LAN WebSocket. Shortcuts and macros run instantly.',
    connecting: 'Looking for the PC helper…',
    disconnected: 'No PC helper. Pair it first.',
  },
  ja: {
    connected: 'LAN WebSocket で PC ヘルパーに接続。ショートカット・マクロを即実行可能。',
    connecting: 'PC ヘルパーを検索中です…',
    disconnected: 'PC ヘルパーがありません。ペアリング後にご利用ください。',
  },
};

function ConnectionDotI18n({ status }: ConnectionDotProps) {
  const { locale } = useTranslation();
  const labels = CONNECTION_LABELS[locale] ?? CONNECTION_LABELS.ko;
  const tooltips = CONNECTION_TOOLTIPS[locale] ?? CONNECTION_TOOLTIPS.ko;
  const color =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'connecting'
        ? 'bg-yellow-500 animate-pulse'
        : 'bg-gray-400';
  return (
    <span
      className="flex items-center gap-1 text-xs text-ink-muted"
      title={tooltips[status]}
      role="status"
      aria-label={`${labels[status]} — ${tooltips[status]}`}
    >
      <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden />
      {labels[status]}
    </span>
  );
}
