'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlugins } from '@/lib/hooks/usePlugins';
import { AppHeader } from '@/components/layout/AppHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';

const PLUGINS_COPY = {
  ko: {
    title: '플러그인',
    subtitle: '큐브 리스트에 새 동작을 추가해보세요',
    searchPlaceholder: '플러그인 검색',
    sortPopular: '인기순',
    sortRecent: '최신순',
    sortName: '이름순',
    loading: '불러오는 중…',
    errorPrefix: '플러그인 목록을 불러오지 못했습니다',
    emptySearch: '검색 결과가 없습니다',
    emptyNone: '아직 등록된 플러그인이 없습니다',
    stageHint: '플러그인 마켓플레이스는 Stage 2 진입 시 본격 가동됩니다. 그동안',
    seedsLink: '시드 카탈로그',
    stageHintTail: '에서 사전 제작된 큐브를 받아 사용할 수 있습니다.',
    installs: '설치',
    detail: '자세히 보기 →',
    anonymousAuthor: '익명',
  },
  en: {
    title: 'Plugins',
    subtitle: 'Add new actions to Cube List.',
    searchPlaceholder: 'Search plugins',
    sortPopular: 'Popular',
    sortRecent: 'Recent',
    sortName: 'Name',
    loading: 'Loading…',
    errorPrefix: 'Failed to load plugins',
    emptySearch: 'No matches',
    emptyNone: 'No plugins yet',
    stageHint: 'The plugin marketplace fully opens with Stage 2. Until then, grab pre-built cubes from the',
    seedsLink: 'seed catalog',
    stageHintTail: '.',
    installs: 'Installs',
    detail: 'Details →',
    anonymousAuthor: 'Anonymous',
  },
  ja: {
    title: 'プラグイン',
    subtitle: 'キューブ・リストに新しいアクションを追加できます。',
    searchPlaceholder: 'プラグイン検索',
    sortPopular: '人気順',
    sortRecent: '新着順',
    sortName: '名前順',
    loading: '読み込み中…',
    errorPrefix: 'プラグインを読み込めませんでした',
    emptySearch: '結果がありません',
    emptyNone: 'まだ登録されたプラグインはありません',
    stageHint: 'プラグイン マーケットは Stage 2 から本格稼働します。それまでは',
    seedsLink: 'シード カタログ',
    stageHintTail: 'から事前ビルドのキューブを利用できます。',
    installs: 'インストール',
    detail: '詳細 →',
    anonymousAuthor: '匿名',
  },
} as const;

type Sort = 'install_count' | 'updated_at' | 'name';

export default function PluginsPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('install_count');
  const { plugins, loading, error } = usePlugins({ search, sort });
  const { locale } = useTranslation();
  const c = PLUGINS_COPY[locale] ?? PLUGINS_COPY.ko;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/"
        title={c.title}
        subtitle={c.subtitle}
        right={<LocaleSwitcher size="compact" />}
      />

      <section className="px-4 py-3 flex flex-col sm:flex-row gap-2 border-b">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={c.searchPlaceholder}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="install_count">{c.sortPopular}</option>
          <option value="updated_at">{c.sortRecent}</option>
          <option value="name">{c.sortName}</option>
        </select>
      </section>

      <section className="px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12">
            <Spinner />
            <span className="text-sm text-ink-muted">{c.loading}</span>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-lg p-3 bg-red-50 text-red-900 border border-red-200 text-sm"
          >
            {c.errorPrefix}: {error}
          </div>
        )}
        {!loading && !error && plugins.length === 0 && (
          <div className="py-12 px-4 text-center flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-rbs-accent-soft" aria-hidden />
            <p className="text-sm font-medium">
              {search ? c.emptySearch : c.emptyNone}
            </p>
            <p className="text-xs text-ink-muted max-w-sm leading-relaxed">
              {c.stageHint}{' '}
              <Link href="/seeds" className="text-rbs-accent underline">
                {c.seedsLink}
              </Link>
              {c.stageHintTail}
            </p>
          </div>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plugins.map((p) => (
            <li
              key={p.id}
              className="border rounded-xl p-4 hover:shadow-md transition bg-surface flex flex-col gap-2"
            >
              <header className="flex items-start gap-3">
                {p.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.icon_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-contain bg-rbs-accent-soft"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rbs-accent-soft" aria-hidden />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/plugins/${encodeURIComponent(p.package_id)}`}
                    className="font-semibold hover:text-rbs-accent"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-muted truncate">
                    {p.author ?? c.anonymousAuthor} · v{p.version}
                  </p>
                </div>
              </header>
              {p.description && (
                <p className="text-sm text-ink line-clamp-2">{p.description}</p>
              )}
              <footer className="flex items-center justify-between mt-1">
                <span className="text-xs text-ink-muted">
                  {c.installs} {formatCount(p.install_count)}
                </span>
                <Link
                  href={`/plugins/${encodeURIComponent(p.package_id)}`}
                  className="text-xs text-rbs-accent hover:underline"
                >
                  {c.detail}
                </Link>
              </footer>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toString();
}
