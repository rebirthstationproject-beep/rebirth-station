/**
 * 전역 검색 모달 (Ctrl+F / Cmd+F, v0.1.3, 2026-05-31).
 *
 * 검색 대상:
 *  - 현재 활성 큐브팩 내 모든 큐브 (라벨/액션/태그)
 *  - 라이브러리 큐브 (pack.cubes)
 *  - 큐브 리스트명
 *
 * 결과 클릭 → 해당 큐브로 selectCube + 리스트 선택
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '../store/editor';
import { useTranslation } from '../lib/i18n/useTranslation';

interface SearchResult {
  readonly cubeId: string;
  readonly cubeLabel: string;
  readonly listId: string | null;
  readonly listName: string;
  readonly actionType: string;
  readonly matchedField: 'label' | 'action_type' | 'metadata';
}

interface GlobalSearchProps {
  readonly onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pack = useEditor((s) => s.pack);
  const selectList = useEditor((s) => s.selectList);
  const selectCube = useEditor((s) => s.selectCube);

  useEffect(() => {
    inputRef.current?.focus();
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const results: ReadonlyArray<SearchResult> = useMemo(() => {
    if (!pack) return [];
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    const out: SearchResult[] = [];
    for (const list of pack.lists) {
      const listMatch = list.name.toLowerCase().includes(q);
      for (const cube of list.cubes) {
        let matchedField: SearchResult['matchedField'] | null = null;
        if (cube.label.toLowerCase().includes(q)) matchedField = 'label';
        else if (cube.action_type.toLowerCase().includes(q)) matchedField = 'action_type';
        else if (
          cube.metadata &&
          JSON.stringify(cube.metadata).toLowerCase().includes(q)
        )
          matchedField = 'metadata';
        else if (listMatch) matchedField = 'label';
        if (matchedField) {
          out.push({
            cubeId: cube.id,
            cubeLabel: cube.label,
            listId: list.id,
            listName: list.name,
            actionType: cube.action_type,
            matchedField,
          });
        }
        if (out.length >= 200) break;
      }
      if (out.length >= 200) break;
    }
    // 라이브러리 풀 (sort_order 0) — 활성 list 에 매칭되지 않은 큐브들
    if (out.length < 200 && pack.cubes) {
      for (const cube of pack.cubes) {
        if (out.some((r) => r.cubeId === cube.id)) continue;
        let matched = false;
        if (cube.label.toLowerCase().includes(q)) matched = true;
        else if (cube.action_type.toLowerCase().includes(q)) matched = true;
        if (matched) {
          out.push({
            cubeId: cube.id,
            cubeLabel: cube.label,
            listId: null,
            listName: '(라이브러리)',
            actionType: cube.action_type,
            matchedField: 'label',
          });
        }
        if (out.length >= 200) break;
      }
    }
    return out;
  }, [query, pack]);

  function handleSelect(r: SearchResult): void {
    if (r.listId) selectList(r.listId);
    selectCube(r.cubeId);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="global-search-modal" role="dialog" aria-label="전역 검색">
        <input
          ref={inputRef}
          type="search"
          className="global-search-input"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="global-search-results">
          {query.trim().length === 0 ? (
            <div className="global-search-hint">{t('search.hint')}</div>
          ) : results.length === 0 ? (
            <div className="global-search-empty">{t('search.empty')}</div>
          ) : (
            <>
              <div className="global-search-count">{results.length} {t('search.count_suffix')}</div>
              {results.map((r) => (
                <button
                  key={`${r.listId ?? 'lib'}-${r.cubeId}`}
                  type="button"
                  className="global-search-result"
                  onClick={() => handleSelect(r)}
                >
                  <span className="result-cube-label">{r.cubeLabel}</span>
                  <span className="result-action-type">{r.actionType}</span>
                  <span className="result-list-name">{r.listName}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
