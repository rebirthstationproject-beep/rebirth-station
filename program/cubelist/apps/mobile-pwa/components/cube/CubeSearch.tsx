'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CubeBoard, CubeItem } from '@/lib/types/cube';
import { useTranslation } from '@/lib/i18n/useTranslation';

const SEARCH_COPY = {
  ko: {
    ariaDialog: '큐브 검색',
    closeAria: '검색 닫기',
    placeholder: '큐브 이름 검색…',
    initialHint: '모든 리스트에 있는 큐브를 검색합니다',
    noMatch: '일치하는 큐브가 없습니다',
    recentLabel: '최근 검색어',
    recentClear: '지우기',
    recentClearAria: '최근 검색어 모두 지우기',
    recentSearchAria: (q: string) => `"${q}"로 검색`,
    recentDeleteAria: (q: string) => `"${q}" 검색어 삭제`,
    recentDeleteTitle: '이 검색어 삭제',
    footerNavLeft: '이동',
    footerNavSelect: '선택',
    footerNavClose: '닫기',
    actionLink: '링크',
    actionShortcut: '단축키',
    actionMacro: '매크로',
    sortMatch: '매치순',
    sortName: '이름순',
    sortAria: '검색 결과 정렬',
    singleResultHint: '단일 결과 — Enter로 즉시 이동',
  },
  en: {
    ariaDialog: 'Cube search',
    closeAria: 'Close search',
    placeholder: 'Search cubes…',
    initialHint: 'Searches across every list',
    noMatch: 'No matching cubes',
    recentLabel: 'Recent searches',
    recentClear: 'Clear',
    recentClearAria: 'Clear all recent searches',
    recentSearchAria: (q: string) => `Search for "${q}"`,
    recentDeleteAria: (q: string) => `Remove "${q}" from history`,
    recentDeleteTitle: 'Remove this entry',
    footerNavLeft: 'navigate',
    footerNavSelect: 'select',
    footerNavClose: 'close',
    actionLink: 'Link',
    actionShortcut: 'Shortcut',
    actionMacro: 'Macro',
    sortMatch: 'Best match',
    sortName: 'Name',
    sortAria: 'Sort search results',
    singleResultHint: 'Single match — press Enter to jump',
  },
  ja: {
    ariaDialog: 'キューブ検索',
    closeAria: '検索を閉じる',
    placeholder: 'キューブ名で検索…',
    initialHint: 'すべてのリストからキューブを検索します',
    noMatch: '一致するキューブはありません',
    recentLabel: '最近の検索',
    recentClear: 'クリア',
    recentClearAria: '最近の検索をすべてクリア',
    recentSearchAria: (q: string) => `"${q}" で検索`,
    recentDeleteAria: (q: string) => `"${q}" を履歴から削除`,
    recentDeleteTitle: 'この履歴を削除',
    footerNavLeft: '移動',
    footerNavSelect: '選択',
    footerNavClose: '閉じる',
    actionLink: 'リンク',
    actionShortcut: 'ショートカット',
    actionMacro: 'マクロ',
    sortMatch: 'マッチ順',
    sortName: '名前順',
    sortAria: '検索結果の並び替え',
    singleResultHint: '結果 1 件 — Enter で即移動',
  },
} as const;

interface SearchResult {
  board: CubeBoard;
  item: CubeItem;
  /** label에서 매칭된 위치 (시각 강조용) */
  matchStart: number;
  matchEnd: number;
}

interface CubeSearchProps {
  open: boolean;
  onClose: () => void;
  boards: CubeBoard[];
  /** 결과 선택 시 호출 — 부모가 해당 board로 이동 + 큐브 강조 */
  onSelect: (boardId: string, itemId: string) => void;
}

/**
 * 전 보드 횡단 큐브 검색 모달.
 *
 * 정착본 §7
 * - 단축키 `/` 로 열림 (useShortcuts에 등록)
 * - 클라이언트 측 in-memory 검색 (빠른 응답)
 * - 결과 클릭 시 해당 board로 이동 + 큐브 위치 강조 펄스
 *
 * 한국어·영어 모두 부분 일치 (대소문자 무시).
 */
const RECENT_KEY = 'cubelist:search-recent';
const RECENT_MAX = 5;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* quota·private mode 등 무시 */
  }
}

type SortMode = 'match' | 'name';

export function CubeSearch({ open, onClose, boards, onSelect }: CubeSearchProps) {
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('match');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { locale } = useTranslation();
  const c = SEARCH_COPY[locale] ?? SEARCH_COPY.ko;

  // 150ms 디바운스 — 큰 보드에서 키 입력마다 results 재계산 부담 완화
  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(rawQuery);
      setActiveIdx(0);
    }, 150);
    return () => clearTimeout(handle);
  }, [rawQuery]);

  // 열릴 때 자동 포커스 + 초기화 + 최근 검색어 로드
  useEffect(() => {
    if (open) {
      setRawQuery('');
      setQuery('');
      setActiveIdx(0);
      setRecent(loadRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function pushRecent(q: string): void {
    const trimmed = q.trim();
    if (trimmed.length === 0) return;
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, RECENT_MAX);
    setRecent(next);
    saveRecent(next);
  }

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const out: SearchResult[] = [];
    for (const board of boards) {
      for (const item of board.items) {
        const label = item.label.toLowerCase();
        const idx = label.indexOf(q);
        if (idx !== -1) {
          out.push({ board, item, matchStart: idx, matchEnd: idx + q.length });
        }
      }
    }
    // 정렬 — match: 매치 시작 위치(앞일수록 우선) + label 짧을수록 우선 / name: 알파벳순
    if (sortMode === 'name') {
      out.sort((a, b) => a.item.label.localeCompare(b.item.label));
    } else {
      out.sort((a, b) => {
        if (a.matchStart !== b.matchStart) return a.matchStart - b.matchStart;
        return a.item.label.length - b.item.label.length;
      });
    }
    return out.slice(0, 50);
  }, [query, boards, sortMode]);

  // 보드별 그룹 (flat index 매핑 유지 — 키보드 ↑↓ 네비 동작 보존)
  const groups = useMemo(() => {
    const map = new Map<string, { board: SearchResult['board']; items: Array<{ result: SearchResult; flatIdx: number }> }>();
    results.forEach((r, idx) => {
      const existing = map.get(r.board.id);
      if (existing) {
        existing.items.push({ result: r, flatIdx: idx });
      } else {
        map.set(r.board.id, {
          board: r.board,
          items: [{ result: r, flatIdx: idx }],
        });
      }
    });
    return Array.from(map.values());
  }, [results]);

  // 활성 항목 자동 스크롤 + 닫힌 그룹 자동 펼침 (키보드 ↑↓ 이동 시)
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-cubesearch-idx="${activeIdx}"]`,
      );
      if (!el) return;
      // 부모 details가 닫혀있으면 강제 open
      const parentDetails = el.closest('details');
      if (parentDetails && !parentDetails.open) {
        parentDetails.open = true;
      }
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [open, activeIdx]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = results[activeIdx];
        if (r) {
          const trimmed = query.trim();
          if (trimmed.length > 0) {
            const next = [trimmed, ...recent.filter((rr) => rr !== trimmed)].slice(0, RECENT_MAX);
            setRecent(next);
            saveRecent(next);
          }
          onSelect(r.board.id, r.item.id);
          onClose();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, results, activeIdx, onSelect, onClose, query, recent]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={c.ariaDialog}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
    >
      <button
        type="button"
        aria-label={c.closeAria}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className="relative bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        <header className="border-b">
          <input
            ref={inputRef}
            type="search"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder={c.placeholder}
            className="w-full px-4 py-3 text-sm focus:outline-none"
            autoComplete="off"
          />
          {query.trim().length > 0 && results.length > 1 && (
            <div className="px-4 pb-2 flex items-center gap-1.5">
              <span className="text-[10px] text-ink-muted">{c.sortAria}:</span>
              {(['match', 'name'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSortMode(m)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    sortMode === m
                      ? 'bg-rbs-accent text-white border-rbs-accent'
                      : 'border-border text-ink-muted hover:border-rbs-accent'
                  }`}
                  aria-pressed={sortMode === m}
                >
                  {m === 'match' ? c.sortMatch : c.sortName}
                </button>
              ))}
            </div>
          )}
        </header>

        <div role="listbox" className="max-h-[60vh] overflow-y-auto">
          {query.trim().length === 0 && recent.length === 0 && (
            <p className="px-4 py-8 text-xs text-ink-muted text-center">{c.initialHint}</p>
          )}

          {query.trim().length === 0 && recent.length > 0 && (
            <div className="px-3 py-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-ink-muted font-medium">{c.recentLabel}</p>
                <button
                  type="button"
                  onClick={() => {
                    setRecent([]);
                    saveRecent([]);
                  }}
                  className="text-[10px] text-ink-muted hover:text-rbs-accent"
                  aria-label={c.recentClearAria}
                >
                  {c.recentClear}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center text-xs rounded-full border border-border bg-surface-2 overflow-hidden group hover:border-rbs-accent"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setRawQuery(r);
                        setQuery(r); // 즉시 결과 표시 — 디바운스 우회
                        setActiveIdx(0);
                        inputRef.current?.focus();
                      }}
                      className="pl-2.5 py-1 group-hover:text-rbs-accent"
                      aria-label={c.recentSearchAria(r)}
                    >
                      {r}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = recent.filter((rr) => rr !== r);
                        setRecent(next);
                        saveRecent(next);
                      }}
                      className="px-1.5 py-1 text-ink-muted hover:text-red-500"
                      aria-label={c.recentDeleteAria(r)}
                      title={c.recentDeleteTitle}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {query.trim().length > 0 && results.length === 0 && (
            <p className="px-4 py-8 text-sm text-ink-muted text-center">{c.noMatch}</p>
          )}

          {groups.map((group, gIdx) => (
            <details
              key={group.board.id}
              open={gIdx < 3}
              className="border-b border-border last:border-b-0"
            >
              <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-ink-muted hover:bg-surface-2 flex items-center justify-between">
                <span>{group.board.name}</span>
                <span className="font-mono">{group.items.length}</span>
              </summary>
              <ul>
                {group.items.map(({ result: r, flatIdx }) => (
                  <li
                    key={`${r.board.id}-${r.item.id}`}
                    role="option"
                    aria-selected={flatIdx === activeIdx}
                    data-cubesearch-idx={flatIdx}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(flatIdx)}
                      onClick={() => {
                        onSelect(r.board.id, r.item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                        flatIdx === activeIdx
                          ? 'bg-rbs-accent-soft/50'
                          : 'hover:bg-surface-2'
                      }`}
                    >
                      {r.item.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.item.icon_url}
                          alt=""
                          className="w-8 h-8 rounded-md object-contain bg-surface-2"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-md bg-rbs-accent-soft"
                          aria-hidden
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          <Highlight
                            text={r.item.label}
                            start={r.matchStart}
                            end={r.matchEnd}
                          />
                        </p>
                        <p className="text-xs text-ink-muted truncate">
                          <span className="font-mono">
                            {r.item.action_type === 'link'
                              ? c.actionLink
                              : r.item.action_type === 'shortcut'
                                ? c.actionShortcut
                                : c.actionMacro}
                          </span>
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        {query.trim().length > 0 && results.length === 1 && (
          <p className="border-t px-4 py-1.5 text-[11px] text-rbs-accent bg-rbs-accent-soft/40 dark:bg-rbs-accent/10">
            ⏎ {c.singleResultHint}
          </p>
        )}
        <footer className="border-t px-4 py-2 text-[11px] text-ink-muted flex flex-wrap gap-x-2 gap-y-1 justify-between">
          <span>
            <kbd className="font-mono">↑↓</kbd> {c.footerNavLeft} ·{' '}
            <kbd className="font-mono">⏎</kbd> {c.footerNavSelect}
          </span>
          <span>
            <kbd className="font-mono">Esc</kbd> {c.footerNavClose}
          </span>
        </footer>
      </div>
    </div>
  );
}

interface HighlightProps {
  text: string;
  start: number;
  end: number;
}

function Highlight({ text, start, end }: HighlightProps) {
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-rbs-accent-soft text-rbs-accent rounded px-0.5">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}
