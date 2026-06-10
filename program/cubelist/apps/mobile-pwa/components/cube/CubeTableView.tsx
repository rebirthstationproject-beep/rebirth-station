'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/lib/toast/useToast';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { useCubeBoards } from '@/lib/hooks/useCubeBoards';
import { useWorkspace } from '@/lib/hooks/useWorkspace';

/**
 * CubeTableView — .cubeone 파일 라이브러리 표 모드
 *
 * 사용자 의도 (2026-05-22):
 * - /list에서 그리드 모드 ↔ 표 모드 토글
 * - 표 모드 = cubeone/jusomoa/{category}/{slug}.cubeone 파일 직접 표시·편집
 * - 엑셀 스타일: 이미지 · 라벨 · URL · 액션 · 메타 (인라인 편집)
 *
 * 데이터: /api/cubeone 통해 파일 시스템 직접 read/write
 */

interface CategorySummary {
  slug: string;
  count: number;
}

interface CubeListItem {
  slug: string;
  label: string;
  icon_src: string | null;
  has_icon_ref: boolean;
  action_type: string;
  url: string | null;
  keys: string[] | null;
  steps_count: number | null;
  category: string;
}

const COPY = {
  ko: {
    title: '큐브 라이브러리',
    subtitle: 'cubeone/jusomoa/ 파일 직접 편집',
    categoryAll: '전체',
    loading: '불러오는 중…',
    empty: '카테고리를 선택하세요',
    colImage: '이미지',
    colLabel: '라벨',
    colUrl: 'URL',
    colAction: '액션',
    colCategory: '카테고리',
    saving: '저장 중…',
    saved: '저장됨',
    saveError: '저장 실패',
    search: '검색',
    searchPlaceholder: '라벨·URL·slug...',
    countSummary: (n: number) => `${n.toLocaleString()}개`,
    importBtn: '이 카테고리 전체를 새 보드로',
    importBtnFiltered: (n: number) => `검색 결과 ${n}개를 새 보드로`,
    importBtnSelected: (n: number) => `선택한 ${n}개를 새 보드로`,
    importAsFolder: (n: number) => `선택한 ${n}개를 폴더 큐브로 (한 보드 안)`,
    folderPrompt: '폴더 큐브 이름',
    folderDefault: '새 폴더',
    importing: '가져오는 중…',
    importSuccess: (boardName: string, n: number) =>
      `"${boardName}" 보드에 ${n}개 큐브 추가됨. 그리드에서 확인.`,
    importEmpty: '큐브가 없어 가져올 수 없습니다',
    importDbWarn: 'LOCAL_MODE에서만 동작합니다 (DB 모드는 별도 구현)',
    selectAllAria: '전체 선택',
    rowSelectAria: '큐브 선택',
    selectionCount: (sel: number, total: number) => `${sel}/${total} 선택`,
    clearSelection: '선택 해제',
  },
  en: {
    title: 'Cube library',
    subtitle: 'Edit cubeone/jusomoa/ files directly',
    categoryAll: 'All',
    loading: 'Loading…',
    empty: 'Select a category',
    colImage: 'Image',
    colLabel: 'Label',
    colUrl: 'URL',
    colAction: 'Action',
    colCategory: 'Category',
    saving: 'Saving…',
    saved: 'Saved',
    saveError: 'Save failed',
    search: 'Search',
    searchPlaceholder: 'label, URL, slug...',
    countSummary: (n: number) => `${n.toLocaleString()} items`,
    importBtn: 'Import this category as a new board',
    importBtnFiltered: (n: number) => `Import ${n} search result(s) as new board`,
    importBtnSelected: (n: number) => `Import ${n} selected as new board`,
    importAsFolder: (n: number) => `Group ${n} selected into a folder cube`,
    folderPrompt: 'Folder cube name',
    folderDefault: 'New folder',
    importing: 'Importing…',
    importSuccess: (boardName: string, n: number) =>
      `Board "${boardName}" created with ${n} cubes. Check the grid.`,
    importEmpty: 'No cubes to import',
    importDbWarn: 'LOCAL_MODE only (DB mode not implemented)',
    selectAllAria: 'Select all',
    rowSelectAria: 'Select cube',
    selectionCount: (sel: number, total: number) => `${sel}/${total} selected`,
    clearSelection: 'Clear selection',
  },
  ja: {
    title: 'キューブ ライブラリ',
    subtitle: 'cubeone/jusomoa/ ファイル直接編集',
    categoryAll: 'すべて',
    loading: '読み込み中…',
    empty: 'カテゴリを選択',
    colImage: '画像',
    colLabel: 'ラベル',
    colUrl: 'URL',
    colAction: 'アクション',
    colCategory: 'カテゴリ',
    saving: '保存中…',
    saved: '保存しました',
    saveError: '保存失敗',
    search: '検索',
    searchPlaceholder: 'ラベル、URL、slug...',
    countSummary: (n: number) => `${n.toLocaleString()} 件`,
    importBtn: 'このカテゴリを新規ボードに取り込み',
    importBtnFiltered: (n: number) => `検索結果 ${n} 件を新規ボードに`,
    importBtnSelected: (n: number) => `選択した ${n} 件を新規ボードに`,
    importAsFolder: (n: number) => `選択した ${n} 件をフォルダ キューブに`,
    folderPrompt: 'フォルダ キューブ名',
    folderDefault: '新しいフォルダ',
    importing: '取り込み中…',
    importSuccess: (boardName: string, n: number) =>
      `ボード "${boardName}" に ${n} 個のキューブを追加。グリッドで確認。`,
    importEmpty: '取り込むキューブがありません',
    importDbWarn: 'LOCAL_MODE のみ (DB モードは別途実装)',
    selectAllAria: 'すべて選択',
    rowSelectAria: 'キューブを選択',
    selectionCount: (sel: number, total: number) => `${sel}/${total} 選択`,
    clearSelection: '選択解除',
  },
};

interface CubeTableViewProps {
  /** import 성공 시 호출 — page.tsx의 setViewMode('grid') 트리거 */
  onImportDone?: () => void;
}

/**
 * fetch URL — static manifest 우선, 실패 시 dev API fallback.
 *
 * 정적 manifest (`scripts/build-cubeone-manifest.mjs` 실행):
 * - /cubeone/jusomoa/categories.json — 카테고리 목록 (read)
 * - /cubeone/jusomoa/{category}.json — 카테고리 아이템 (read)
 * - icon은 정적 webp /cubeone/jusomoa/icons/{cat}/{slug}.webp
 *
 * dev API (서버 가동 시):
 * - /api/cubeone (read·write 가능)
 *
 * Tauri production build = static manifest만 사용 가능. write는 별도 IPC.
 */
const STATIC_MANIFEST_BASE = '/cubeone/jusomoa';
const DEV_API_BASE = '/api/cubeone';

async function fetchCategories(): Promise<{ total: number; categories: CategorySummary[] } | null> {
  // 정적 우선
  try {
    const res = await fetch(`${STATIC_MANIFEST_BASE}/categories.json`);
    if (res.ok) {
      const data = (await res.json()) as { total: number; categories: CategorySummary[] };
      return data;
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch(DEV_API_BASE);
    if (!res.ok) return null;
    return (await res.json()) as { total: number; categories: CategorySummary[] };
  } catch {
    return null;
  }
}

async function fetchCategoryItems(category: string): Promise<{ items: CubeListItem[] } | null> {
  try {
    const res = await fetch(`${STATIC_MANIFEST_BASE}/${encodeURIComponent(category)}.json`);
    if (res.ok) {
      const data = (await res.json()) as { items: Omit<CubeListItem, 'has_icon_ref'>[] };
      // 정적 manifest는 has_icon_ref 필드가 없음 — icon_src 존재 여부로 추정
      const items = data.items.map((it) => ({
        ...it,
        has_icon_ref: typeof it.icon_src === 'string' && it.icon_src.startsWith('/cubeone'),
      }));
      return { items };
    }
  } catch {
    // fallback
  }
  try {
    const res = await fetch(`${DEV_API_BASE}?category=${encodeURIComponent(category)}`);
    if (!res.ok) return null;
    return (await res.json()) as { items: CubeListItem[] };
  } catch {
    return null;
  }
}

export function CubeTableView({ onImportDone }: CubeTableViewProps = {}) {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.ko;
  const { showToast } = useToast();
  const { loadBoards, setActiveBoard } = useCubeBoards();
  const { activeWorkspaceId } = useWorkspace();

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<CubeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [savingSlugs, setSavingSlugs] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  // 카테고리 전환 시 선택 초기화
  useEffect(() => {
    setSelectedSlugs(new Set());
  }, [selectedCategory]);

  const toggleRow = useCallback((slug: string): void => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const toggleAll = useCallback((slugs: string[], on: boolean): void => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (on) slugs.forEach((s) => next.add(s));
      else slugs.forEach((s) => next.delete(s));
      return next;
    });
  }, []);

  // 카테고리 목록 로드 (정적 manifest 우선, dev API fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchCategories();
      if (cancelled) return;
      if (!data) {
        showToast({ level: 'error', message: '라이브러리 로드 실패' });
        return;
      }
      setCategories(data.categories);
      setTotal(data.total);
      if (data.categories.length > 0 && !selectedCategory) {
        setSelectedCategory(data.categories[0].slug);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 선택된 카테고리의 아이템 로드 (정적 manifest 우선)
  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await fetchCategoryItems(selectedCategory);
      if (cancelled) return;
      if (!data) {
        showToast({ level: 'error', message: '카테고리 로드 실패' });
        setLoading(false);
        return;
      }
      setItems(data.items.sort((a, b) => a.label.localeCompare(b.label)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const saveCube = useCallback(
    async (slug: string, patch: { label?: string; url?: string }) => {
      if (!selectedCategory) return;
      setSavingSlugs((prev) => new Set(prev).add(slug));
      try {
        const cube: Record<string, unknown> = {};
        if (patch.label !== undefined) cube.label = patch.label;
        if (patch.url !== undefined) cube.action_payload = { url: patch.url };
        const res = await fetch(
          `/api/cubeone?category=${encodeURIComponent(selectedCategory)}&slug=${encodeURIComponent(slug)}`,
          {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ cube }),
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        showToast({ level: 'success', message: `${c.saved}: ${slug}`, duration: 1_500 });
      } catch (err) {
        showToast({ level: 'error', message: `${c.saveError}: ${(err as Error).message}` });
      } finally {
        setSavingSlugs((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      }
    },
    [selectedCategory, showToast, c.saved, c.saveError],
  );

  const handleImport = useCallback(
    async (sourceItems: CubeListItem[], boardName: string): Promise<void> => {
      if (sourceItems.length === 0) {
        showToast({ level: 'warning', message: c.importEmpty });
        return;
      }
      if (!isLocalMode()) {
        showToast({ level: 'warning', message: c.importDbWarn });
        return;
      }
      setImporting(true);
      try {
        const board = localStore.createBoardInWorkspace(boardName, activeWorkspaceId);
        for (const it of sourceItems) {
          const action_payload: Record<string, unknown> = {};
          if (it.url) action_payload.url = it.url;
          localStore.addItem(board.id, {
            label: it.label,
            icon_url: it.icon_src, // ZIP icon endpoint URL — 보드에서도 표시 가능
            action_type: (it.action_type as 'link' | 'shortcut' | 'macro') ?? 'link',
            action_payload,
            metadata: { source: 'jusomoa', category: it.category, source_slug: it.slug },
          });
        }
        await loadBoards();
        setActiveBoard(board.id);
        showToast({
          level: 'success',
          message: c.importSuccess(boardName, sourceItems.length),
          duration: 4_000,
        });
        // 그리드 모드 자동 전환 — 사용자가 import 후 결과를 바로 볼 수 있도록
        onImportDone?.();
      } catch (err) {
        showToast({ level: 'error', message: `import 실패: ${(err as Error).message}` });
      } finally {
        setImporting(false);
      }
    },
    [c, loadBoards, setActiveBoard, showToast, onImportDone, activeWorkspaceId],
  );

  /**
   * 선택한 큐브들을 폴더 큐브로 묶어 새 보드 생성 (Stream Deck Folder UX).
   * 1) 새 보드 생성 (활성 워크스페이스 귀속)
   * 2) 선택 큐브들을 보드에 추가 → addItem 반환값에서 신규 큐브 id 수집
   * 3) 폴더 큐브 1개 생성 — payload.cube_ids = [신규 큐브 id 배열]
   */
  const handleImportAsFolder = useCallback(
    async (sourceItems: CubeListItem[]): Promise<void> => {
      if (sourceItems.length === 0) {
        showToast({ level: 'warning', message: c.importEmpty });
        return;
      }
      if (!isLocalMode()) {
        showToast({ level: 'warning', message: c.importDbWarn });
        return;
      }
      const folderName = window.prompt(c.folderPrompt, selectedCategory ?? c.folderDefault);
      if (folderName === null) return;
      const finalFolderName = folderName.trim().length > 0 ? folderName.trim() : c.folderDefault;

      setImporting(true);
      try {
        const board = localStore.createBoardInWorkspace(finalFolderName, activeWorkspaceId);
        const addedIds: string[] = [];
        for (const it of sourceItems) {
          const action_payload: Record<string, unknown> = {};
          if (it.url) action_payload.url = it.url;
          const added = localStore.addItem(board.id, {
            label: it.label,
            icon_url: it.icon_src,
            action_type: (it.action_type as 'link' | 'shortcut' | 'macro') ?? 'link',
            action_payload,
            metadata: { source: 'jusomoa', category: it.category, source_slug: it.slug },
          });
          if (added) addedIds.push(added.id);
        }
        // 폴더 큐브 추가 — cube_ids = 방금 추가한 큐브 id 배열
        localStore.addItem(board.id, {
          label: finalFolderName,
          icon_url: null,
          action_type: 'folder',
          action_payload: { cube_ids: addedIds },
          metadata: { bg_color: 'midnight' },
        });
        await loadBoards();
        setActiveBoard(board.id);
        showToast({
          level: 'success',
          message: c.importSuccess(finalFolderName, sourceItems.length + 1),
          duration: 4_000,
        });
        onImportDone?.();
      } catch (err) {
        showToast({ level: 'error', message: `폴더 묶기 실패: ${(err as Error).message}` });
      } finally {
        setImporting(false);
      }
    },
    [c, loadBoards, setActiveBoard, showToast, onImportDone, activeWorkspaceId, selectedCategory],
  );

  const filtered = search.trim()
    ? items.filter((it) => {
        const q = search.toLowerCase();
        return (
          it.label.toLowerCase().includes(q) ||
          it.slug.toLowerCase().includes(q) ||
          (it.url?.toLowerCase().includes(q) ?? false)
        );
      })
    : items;

  return (
    <section className="px-4 py-4">
      <header className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold">{c.title}</h2>
          <p className="text-xs text-ink-muted">
            {c.subtitle} · {c.countSummary(total)}
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={c.searchPlaceholder}
          aria-label={c.search}
          className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-surface w-56"
        />
      </header>

      {/* 카테고리 칩 */}
      <div className="flex flex-wrap gap-1.5 mb-3" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={
              selectedCategory === cat.slug
                ? 'text-xs px-2.5 py-1 rounded-full bg-rbs-accent text-white'
                : 'text-xs px-2.5 py-1 rounded-full bg-surface-2 text-ink hover:bg-rbs-accent-soft'
            }
          >
            {cat.slug} <span className="opacity-70">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* import 버튼 + 선택 안내 — 카테고리 선택 시 */}
      {selectedCategory && items.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {selectedSlugs.size > 0 ? (
            <>
              <button
                type="button"
                disabled={importing}
                onClick={() => {
                  const target = filtered.filter((it) => selectedSlugs.has(it.slug));
                  const boardName = `${selectedCategory} (${target.length})`;
                  void handleImport(target, boardName);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-rbs-accent text-white hover:bg-rbs-accent/90 disabled:opacity-50"
              >
                {importing ? c.importing : c.importBtnSelected(selectedSlugs.size)}
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={() => {
                  const target = filtered.filter((it) => selectedSlugs.has(it.slug));
                  void handleImportAsFolder(target);
                }}
                className="text-xs px-3 py-1.5 rounded-md border border-rbs-accent text-rbs-accent hover:bg-rbs-accent-soft dark:hover:bg-rbs-accent/10 disabled:opacity-50"
              >
                ▶ {c.importAsFolder(selectedSlugs.size)}
              </button>
              <span className="text-xs text-ink-muted">
                {c.selectionCount(selectedSlugs.size, filtered.length)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlugs(new Set())}
                className="text-xs px-2 py-1 rounded-md border border-border hover:bg-surface-2 text-ink-muted"
              >
                {c.clearSelection}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={importing}
              onClick={() => {
                const target = search.trim() ? filtered : items;
                const boardName = search.trim()
                  ? `${selectedCategory} (${search.trim()})`
                  : selectedCategory;
                void handleImport(target, boardName);
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-rbs-accent text-white hover:bg-rbs-accent/90 disabled:opacity-50"
            >
              {importing
                ? c.importing
                : search.trim()
                  ? c.importBtnFiltered(filtered.length)
                  : c.importBtn}
            </button>
          )}
        </div>
      )}

      {/* 표 */}
      {loading ? (
        <p className="text-sm text-ink-muted py-12 text-center">{c.loading}</p>
      ) : selectedCategory === null ? (
        <p className="text-sm text-ink-muted py-12 text-center">{c.empty}</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    aria-label={c.selectAllAria}
                    checked={
                      filtered.length > 0 &&
                      filtered.every((it) => selectedSlugs.has(it.slug))
                    }
                    onChange={(e) => toggleAll(filtered.map((it) => it.slug), e.target.checked)}
                    className="accent-rbs-accent"
                  />
                </th>
                <th className="px-3 py-2 text-left w-16">{c.colImage}</th>
                <th className="px-3 py-2 text-left">{c.colLabel}</th>
                <th className="px-3 py-2 text-left">{c.colUrl}</th>
                <th className="px-3 py-2 text-left w-20">{c.colAction}</th>
                <th className="px-3 py-2 text-left w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <TableRow
                  key={it.slug}
                  item={it}
                  saving={savingSlugs.has(it.slug)}
                  selected={selectedSlugs.has(it.slug)}
                  onToggle={() => toggleRow(it.slug)}
                  selectAriaLabel={c.rowSelectAria}
                  onSave={(patch) => saveCube(it.slug, patch)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-ink-muted">
                    {search.trim() ? `"${search}" 결과 없음` : c.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface TableRowProps {
  item: CubeListItem;
  saving: boolean;
  selected: boolean;
  onToggle: () => void;
  selectAriaLabel: string;
  onSave: (patch: { label?: string; url?: string }) => void;
}

function TableRow({ item, saving, selected, onToggle, selectAriaLabel, onSave }: TableRowProps) {
  const [label, setLabel] = useState(item.label);
  const [url, setUrl] = useState(item.url ?? '');

  useEffect(() => {
    setLabel(item.label);
    setUrl(item.url ?? '');
  }, [item]);

  const labelChanged = label !== item.label;
  const urlChanged = url !== (item.url ?? '');
  const dirty = labelChanged || urlChanged;

  function handleSave(): void {
    if (!dirty || saving) return;
    const patch: { label?: string; url?: string } = {};
    if (labelChanged) patch.label = label.trim();
    if (urlChanged) patch.url = url.trim();
    onSave(patch);
  }

  return (
    <tr
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        // 사이드바 드롭존에서 fetch할 수 있도록 카테고리·slug·라벨 전달
        const dragData = {
          type: 'cubelist/cube',
          category: item.category,
          slug: item.slug,
          label: item.label,
          icon_src: item.icon_src,
          action_type: item.action_type,
          url: item.url,
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.setData('text/plain', `${item.category}/${item.slug}`);
      }}
      className={`border-t border-border cursor-grab active:cursor-grabbing ${
        selected
          ? 'bg-rbs-accent-soft/40 dark:bg-rbs-accent/10'
          : 'hover:bg-surface-2/50'
      }`}
    >
      <td className="px-3 py-2">
        <input
          type="checkbox"
          aria-label={`${selectAriaLabel}: ${item.label}`}
          checked={selected}
          onChange={onToggle}
          className="accent-rbs-accent"
        />
      </td>
      <td className="px-3 py-2">
        {item.icon_src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.icon_src}
            alt={label}
            width={32}
            height={32}
            className="w-8 h-8 object-contain rounded bg-rbs-accent-soft"
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')}
          />
        ) : (
          <div className="w-8 h-8 rounded bg-rbs-accent-soft" />
        )}
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full bg-transparent border-b border-transparent focus:border-rbs-accent outline-none text-sm"
          maxLength={32}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full bg-transparent border-b border-transparent focus:border-rbs-accent outline-none text-sm font-mono text-xs"
        />
      </td>
      <td className="px-3 py-2 text-xs text-ink-muted">{item.action_type}</td>
      <td className="px-3 py-2 text-right">
        {saving ? (
          <span className="text-xs text-ink-muted">…</span>
        ) : dirty ? (
          <button
            type="button"
            onClick={handleSave}
            className="text-xs px-2 py-0.5 rounded bg-rbs-accent text-white"
          >
            저장
          </button>
        ) : (
          <span className="text-xs text-ink-muted opacity-50">·</span>
        )}
      </td>
    </tr>
  );
}
