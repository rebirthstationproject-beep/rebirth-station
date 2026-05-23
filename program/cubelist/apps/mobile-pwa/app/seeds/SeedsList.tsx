'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/lib/toast/useToast';

const FAV_KEY = 'cubelist:seeds:fav';

function loadFavs(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveFavs(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* quota·private mode 등 무시 */
  }
}

export interface SeedEntry {
  file: string;
  kind: 'cubelist' | 'cubepack' | 'config' | 'plugin';
  name: string;
  name_en?: string;
  name_ja?: string;
  category: string;
  category_en?: string;
  category_ja?: string;
  cube_count: number;
  license: string;
  summary: string;
  summary_en?: string;
  summary_ja?: string;
}

interface SeedsListProps {
  entries: SeedEntry[];
  totalCubes: number;
}

export function SeedsList({ entries, totalCubes }: SeedsListProps) {
  const { locale } = useTranslation();
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [favSort, setFavSort] = useState<'added' | 'name' | 'category'>('added');
  const { showToast } = useToast();

  useEffect(() => {
    setFavs(loadFavs());
  }, []);

  function toggleFav(file: string): void {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      saveFavs(next);
      return next;
    });
  }

  const localized = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        displayName: pickLocale(e, locale, 'name'),
        displayCategory: pickLocale(e, locale, 'category'),
        displaySummary: pickLocale(e, locale, 'summary'),
      })),
    [entries, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return localized;
    return localized.filter((e) => {
      const haystack = [
        e.displayName,
        e.displayCategory,
        e.displaySummary,
        e.file,
        e.license,
        e.name,
        e.name_en,
        e.name_ja,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [localized, query]);

  const byCategory = new Map<string, typeof filtered>();
  for (const e of filtered) {
    const arr = byCategory.get(e.displayCategory) ?? [];
    arr.push(e);
    byCategory.set(e.displayCategory, arr);
  }

  const searchPlaceholder =
    locale === 'en'
      ? 'Search by name, category, or file'
      : locale === 'ja'
        ? '名前·カテゴリ·ファイルで検索'
        : '이름·카테고리·파일명 검색';

  return (
    <>
      <div className="px-4 py-3 border-b border-border">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full border border-border bg-surface rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <p className="px-4 py-3 text-xs text-ink-muted border-b border-border">
        {locale === 'en' ? (
          <>
            Download a file and import via{' '}
            <Link href="/list" className="text-rbs-accent underline">
              Cube List
            </Link>
            , or grab from the marketplace later. {entries.length} files · {totalCubes} cubes.
          </>
        ) : locale === 'ja' ? (
          <>
            ファイルをダウンロードして{' '}
            <Link href="/list" className="text-rbs-accent underline">
              キューブ・リスト
            </Link>
            の取り込みからインポート。{entries.length} ファイル · {totalCubes} キューブ。
          </>
        ) : (
          <>
            파일을 다운로드해 큐브 리스트의{' '}
            <Link href="/list" className="text-rbs-accent underline">
              가져오기
            </Link>
            로 import하세요. 총 {entries.length}개 파일 · {totalCubes} 큐브.
          </>
        )}
      </p>

      {/* 1,431개 jusomoa 큐브 라이브러리 안내 카드 — 시드 13개 외 큰 카탈로그 발견성 */}
      <Link
        href="/list?openLibrary=1"
        className="mx-4 my-3 block rounded-xl border-2 border-rbs-accent bg-rbs-accent-soft/30 dark:bg-rbs-accent/10 p-4 hover:bg-rbs-accent-soft/50 dark:hover:bg-rbs-accent/20 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗂</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-ink">
              {locale === 'en'
                ? '1,431 ready-made jusomoa cubes'
                : locale === 'ja'
                  ? '1,431 個の jusomoa キューブ'
                  : '1,431개 jusomoa 큐브 라이브러리'}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {locale === 'en'
                ? 'Table view → pick a category (food, ai, shopping…) → search · select · import to your board.'
                : locale === 'ja'
                  ? '表ビュー → カテゴリ選択 (food, ai, shopping…) → 検索・選択・取り込み。'
                  : '표 보기 → 카테고리 선택 (food, ai, shopping…) → 검색·선택·가져오기.'}
            </p>
          </div>
          <span className="text-rbs-accent text-xs font-medium hidden sm:inline">→</span>
        </div>
      </Link>

      {query.trim().length > 0 && (
        <p className="px-4 py-2 text-xs text-ink-muted border-b border-border">
          {filtered.length === 0 ? (
            locale === 'en' ? (
              `No results for "${query}"`
            ) : locale === 'ja' ? (
              `"${query}" の結果はありません`
            ) : (
              `"${query}" 검색 결과가 없습니다`
            )
          ) : locale === 'en' ? (
            <>
              <span className="text-ink">"{query}"</span> — {filtered.length} seeds ·{' '}
              {sumCubes(filtered)} cubes
            </>
          ) : locale === 'ja' ? (
            <>
              <span className="text-ink">"{query}"</span> — {filtered.length} ファイル ·{' '}
              {sumCubes(filtered)} キューブ
            </>
          ) : (
            <>
              <span className="text-ink">"{query}"</span> — {filtered.length}개 시드 ·{' '}
              {sumCubes(filtered)}개 큐브
            </>
          )}
        </p>
      )}

      {query.trim().length === 0 && favs.size === 0 && (
        <p className="px-4 py-3 text-[11px] text-ink-muted border-b border-border bg-surface-2/50">
          <span className="text-rbs-accent mr-1">☆</span>
          {locale === 'en'
            ? "Tap a star on any seed card to keep your go-to seeds at the top."
            : locale === 'ja'
              ? '★ をタップしてよく使うシードを上部に固定できます。'
              : '★ 별표를 눌러 자주 쓰는 시드를 상단에 고정할 수 있습니다.'}
        </p>
      )}

      {query.trim().length === 0 && favs.size > 0 && (
        <section className="py-5 border-b border-border bg-rbs-accent-soft/30 dark:bg-rbs-accent/10">
          <div className="px-4 flex flex-wrap items-center justify-between mb-3 gap-2">
            <h2 className="text-sm font-semibold text-ink-muted flex items-center gap-2">
              <span>
                {locale === 'en'
                  ? '★ Favorites'
                  : locale === 'ja'
                    ? '★ お気に入り'
                    : '★ 즐겨찾기'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-ink-muted">
                {Array.from(favs).filter((f) => localized.some((e) => e.file === f)).length}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const files = Array.from(favs).filter((f) =>
                    localized.some((e) => e.file === f),
                  );
                  if (files.length === 0) return;
                  const startMsg =
                    locale === 'en'
                      ? `Starting download of ${files.length} seed file(s)…`
                      : locale === 'ja'
                        ? `${files.length} 個のシードのダウンロードを開始します…`
                        : `${files.length}개 시드 다운로드를 시작합니다…`;
                  showToast({ level: 'info', message: startMsg, duration: 3_000 });
                  // 순차 다운로드 — 브라우저가 "여러 파일 다운로드 허용" 1회 prompt
                  files.forEach((file, idx) => {
                    setTimeout(() => {
                      const a = document.createElement('a');
                      a.href = `/api/seeds/${encodeURIComponent(file)}`;
                      a.download = file;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      // 마지막 항목 진행 시 완료 안내
                      if (idx === files.length - 1) {
                        const doneMsg =
                          locale === 'en'
                            ? `Downloaded ${files.length} seed file(s)`
                            : locale === 'ja'
                              ? `${files.length} 個のシードをダウンロードしました`
                              : `${files.length}개 시드 다운로드를 완료했습니다`;
                        showToast({ level: 'success', message: doneMsg, duration: 3_000 });
                      }
                    }, idx * 220);
                  });
                }}
                className="text-[11px] px-2 py-1 rounded-md border border-border hover:border-rbs-accent hover:text-rbs-accent"
                aria-label={
                  locale === 'en'
                    ? 'Download all favorites'
                    : locale === 'ja'
                      ? 'お気に入りをすべてダウンロード'
                      : '즐겨찾기 모두 내려받기'
                }
                title={
                  locale === 'en'
                    ? 'Each file is downloaded sequentially. The browser may ask once to allow multiple downloads.'
                    : locale === 'ja'
                      ? '各ファイルを順次ダウンロード。ブラウザが多重ダウンロード許可を 1 度尋ねる場合があります。'
                      : '각 파일을 순차 다운로드합니다. 브라우저가 다중 다운로드 허용을 1회 묻습니다.'
                }
              >
                ⬇{' '}
                {locale === 'en' ? 'All' : locale === 'ja' ? '一括' : '전체'}
              </button>
              <select
                value={favSort}
                onChange={(e) => setFavSort(e.target.value as 'added' | 'name' | 'category')}
                className="text-[11px] border border-border bg-surface rounded-md px-2 py-1 text-ink-muted"
                aria-label={
                  locale === 'en' ? 'Sort favorites' : locale === 'ja' ? 'お気に入りの並び替え' : '즐겨찾기 정렬'
                }
              >
                <option value="added">
                  {locale === 'en' ? 'Recently added' : locale === 'ja' ? '追加順' : '추가순'}
                </option>
                <option value="name">
                  {locale === 'en' ? 'Name' : locale === 'ja' ? '名前' : '이름순'}
                </option>
                <option value="category">
                  {locale === 'en' ? 'Category' : locale === 'ja' ? 'カテゴリ' : '카테고리순'}
                </option>
              </select>
            </div>
          </div>
          {/* 모바일: 가로 스크롤 carousel / sm 이상: 그리드 */}
          <ul className="flex sm:grid sm:grid-cols-2 sm:gap-3 sm:px-4 gap-3 overflow-x-auto snap-x snap-mandatory px-4 cubelist-fav-scroll">
            {sortFavorites(
              localized.filter((e) => favs.has(e.file)),
              favSort,
              Array.from(favs),
            ).map((e) => (
                <li
                  key={`fav-${e.file}`}
                  title={licenseHint(e.license, locale)}
                  className="snap-start flex-shrink-0 w-[75%] sm:w-auto border border-border rounded-xl p-3 hover:shadow-sm transition bg-surface relative"
                >
                  <button
                    type="button"
                    onClick={() => toggleFav(e.file)}
                    className="absolute top-2 right-2 text-rbs-accent text-lg leading-none"
                    aria-label="즐겨찾기 해제"
                  >
                    ★
                  </button>
                  <h3 className="text-sm font-semibold truncate pr-6">{e.displayName}</h3>
                  <p className="text-xs text-ink-muted mt-1 line-clamp-1">{e.displaySummary}</p>
                </li>
              ))}
          </ul>
        </section>
      )}

      {query.trim().length === 0 && byCategory.size > 1 && (
        <nav
          className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border px-3 py-2 flex gap-1.5 overflow-x-auto cubelist-fav-scroll"
          aria-label={
            locale === 'en' ? 'Category jump' : locale === 'ja' ? 'カテゴリ移動' : '카테고리 이동'
          }
        >
          {Array.from(byCategory.entries()).map(([category, items]) => (
            <a
              key={`jump-${category}`}
              href={`#seedcat-${slugifyCategory(category)}`}
              className="text-[11px] px-2 py-1 rounded-full border border-border bg-surface hover:border-rbs-accent hover:text-rbs-accent whitespace-nowrap flex-shrink-0"
            >
              {category}
              <span className="ml-1 font-mono text-ink-muted">{items.length}</span>
            </a>
          ))}
        </nav>
      )}

      {Array.from(byCategory.entries()).map(([category, items]) => (
        <section
          key={category}
          id={`seedcat-${slugifyCategory(category)}`}
          className="px-4 py-5 border-b border-border scroll-mt-16"
        >
          <h2 className="text-sm font-semibold text-ink-muted mb-3 flex items-center gap-2">
            <span>{category}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border text-ink-muted">
              {items.length}
            </span>
            <span className="text-[10px] text-ink-muted ml-auto font-normal">
              {locale === 'en'
                ? `${sumCubes(items)} cubes`
                : locale === 'ja'
                  ? `${sumCubes(items)} キューブ`
                  : `${sumCubes(items)} 큐브`}
            </span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((e) => (
              <li
                key={e.file}
                title={licenseHint(e.license, locale)}
                className="border border-border rounded-xl p-3 hover:shadow-sm hover:border-rbs-accent/40 focus-within:border-rbs-accent focus-within:shadow-md transition bg-surface relative group"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-rbs-accent/0 group-hover:bg-rbs-accent/60 dark:group-hover:bg-rbs-accent/80 dark:group-hover:shadow-[0_0_8px_rgba(248,113,175,0.5)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => toggleFav(e.file)}
                  className={`absolute top-2 right-2 text-lg leading-none ${
                    favs.has(e.file) ? 'text-rbs-accent' : 'text-ink-muted hover:text-rbs-accent'
                  }`}
                  aria-label={favs.has(e.file) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  title={favs.has(e.file) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                >
                  {favs.has(e.file) ? '★' : '☆'}
                </button>
                <div className="flex items-start justify-between gap-2 mb-1 pr-7">
                  <h3 className="text-sm font-semibold truncate">{e.displayName}</h3>
                  {/* SD-AA (2026-05-23): plugin kind 시각 분기 — 핑크 배지로 Stream Deck 호환 구별 */}
                  <span
                    className={
                      e.kind === 'plugin'
                        ? 'text-[10px] font-mono text-white bg-rbs-accent-strong px-1.5 py-0.5 rounded'
                        : 'text-[10px] font-mono text-ink-muted bg-surface-2 px-1.5 py-0.5 rounded'
                    }
                    title={e.kind === 'plugin' ? 'Stream Deck 호환 액션 카탈로그' : e.kind}
                  >
                    {e.kind}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mb-2 line-clamp-2">{e.displaySummary}</p>
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>
                    {locale === 'en' ? 'Cubes' : locale === 'ja' ? 'キューブ' : '큐브'}{' '}
                    {e.cube_count}
                  </span>
                  <span className="font-mono" title={licenseHint(e.license, locale)}>
                    {licenseShort(e.license, locale)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <a
                    href={`/api/seeds/${encodeURIComponent(e.file)}`}
                    download={e.file}
                    className="flex-1 text-center text-[11px] px-2 py-1.5 rounded-md border border-border hover:border-rbs-accent hover:text-rbs-accent"
                  >
                    {locale === 'en' ? 'Download' : locale === 'ja' ? 'ダウンロード' : '내려받기'}
                  </a>
                  <Link
                    href={`/list?seed=${encodeURIComponent(e.file)}`}
                    className="flex-1 text-center text-[11px] px-2 py-1.5 rounded-md bg-rbs-accent text-white"
                  >
                    {locale === 'en'
                      ? 'Open in Cube List'
                      : locale === 'ja'
                        ? 'キューブ・リストで開く'
                        : '큐브 리스트에서 열기'}
                  </Link>
                </div>
                <p className="text-[10px] text-ink-muted font-mono mt-2 truncate">{e.file}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function slugifyCategory(category: string): string {
  // URL hash 안전 slug — 한국어/일본어 카테고리도 #anchor로 동작하지만 일관성 위해 변환
  return category
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ぁ-んァ-ヶー一-龯]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sumCubes(items: Array<{ cube_count: number }>): number {
  return items.reduce((sum, it) => sum + it.cube_count, 0);
}

function sortFavorites<T extends { file: string; displayName: string; displayCategory: string }>(
  items: T[],
  mode: 'added' | 'name' | 'category',
  favOrder: string[],
): T[] {
  if (mode === 'name') return [...items].sort((a, b) => a.displayName.localeCompare(b.displayName));
  if (mode === 'category')
    return [...items].sort((a, b) => a.displayCategory.localeCompare(b.displayCategory));
  // added — localStorage Set 입력 순서 보존, 최신 추가가 앞에 오도록 reverse
  const order = new Map(favOrder.map((f, i) => [f, i]));
  return [...items].sort((a, b) => (order.get(a.file) ?? 0) - (order.get(b.file) ?? 0));
}

function licenseShort(license: string, locale: 'ko' | 'en' | 'ja'): string {
  const ko: Record<string, string> = {
    free: '무료',
    personal: '개인',
    commercial: '상업',
    proprietary: '비공개',
  };
  const en: Record<string, string> = {
    free: 'Free',
    personal: 'Personal',
    commercial: 'Commercial',
    proprietary: 'Proprietary',
  };
  const ja: Record<string, string> = {
    free: '無料',
    personal: '個人',
    commercial: '商業',
    proprietary: '非公開',
  };
  const table = locale === 'en' ? en : locale === 'ja' ? ja : ko;
  return table[license] ?? license;
}

function licenseHint(license: string, locale: 'ko' | 'en' | 'ja'): string {
  const ko: Record<string, string> = {
    free: '무료 — 누구나 자유롭게 사용·재배포 가능합니다.',
    personal: '개인 사용 한정 — 재배포·판매 금지.',
    commercial: '상업 사용 가능 — 재배포 시 제작자 출처 표기 의무.',
    proprietary: '비공개 라이선스 — 외부 공유·재배포·업로드 금지.',
  };
  const en: Record<string, string> = {
    free: 'Free — anyone may use & redistribute.',
    personal: 'Personal use only — no redistribution or sale.',
    commercial: 'Commercial use OK — attribution required on redistribution.',
    proprietary: 'Proprietary — no external sharing or upload.',
  };
  const ja: Record<string, string> = {
    free: '無料 — 誰でも自由に使用・再配布可。',
    personal: '個人使用のみ — 再配布・販売不可。',
    commercial: '商業利用可 — 再配布時は出典表示必須。',
    proprietary: '非公開 — 外部共有・再配布・アップロード禁止。',
  };
  const table = locale === 'en' ? en : locale === 'ja' ? ja : ko;
  return table[license] ?? `${license} — (라이선스 안내 없음)`;
}

function pickLocale(
  entry: SeedEntry,
  locale: 'ko' | 'en' | 'ja',
  field: 'name' | 'category' | 'summary',
): string {
  if (locale === 'en') {
    return (entry as unknown as Record<string, string | undefined>)[`${field}_en`] ?? entry[field];
  }
  if (locale === 'ja') {
    return (entry as unknown as Record<string, string | undefined>)[`${field}_ja`] ?? entry[field];
  }
  return entry[field];
}
