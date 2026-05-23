'use client';

import Link from 'next/link';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function HomePage() {
  const { t, locale } = useTranslation();
  const seedsLabel =
    locale === 'en' ? 'Seed catalog' : locale === 'ja' ? 'シード カタログ' : '시드 카탈로그';
  const aboutLabel =
    locale === 'en' ? 'About' : locale === 'ja' ? 'ブランド紹介' : '브랜드 소개';
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-rbs-accent-soft to-surface dark:from-surface-2 dark:to-surface">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher size="compact" />
      </div>

      <div className="text-center max-w-md">
        <p className="text-sm text-rbs-accent-strong font-medium mb-2">{t('brand.company')}</p>
        <h1 className="text-4xl font-bold text-rbs-accent mb-4">{t('brand.product')}</h1>
        <p className="text-ink leading-relaxed">{t('brand.tagline')}</p>
        <p className="text-xs text-ink-muted mb-8 mt-1">{t('brand.sub_tagline')}</p>

        <nav className="flex flex-col gap-3">
          <Link
            href="/list"
            className="bg-rbs-accent text-white px-6 py-3 rounded-xl font-medium hover:bg-rbs-accent-strong transition"
          >
            {t('home.openList')}
          </Link>
          <Link
            href="/pair"
            className="bg-surface text-rbs-accent-strong dark:text-rbs-accent px-6 py-3 rounded-xl font-medium border border-border hover:border-rbs-accent-strong transition"
          >
            {t('home.pair')}
          </Link>
          <Link
            href="/plugins"
            className="bg-surface text-rbs-accent-strong dark:text-rbs-accent px-6 py-3 rounded-xl font-medium border border-border hover:border-rbs-accent-strong transition"
          >
            {t('home.plugins')}
          </Link>
          <Link
            href="/account"
            className="text-rbs-accent-strong px-6 py-2 text-sm hover:underline"
          >
            {t('home.account')}
          </Link>
          <Link
            href="/seeds"
            className="text-rbs-accent-strong px-6 py-2 text-sm hover:underline"
          >
            {seedsLabel}
          </Link>
          <Link
            href="/about"
            className="text-rbs-accent-strong px-6 py-2 text-sm hover:underline"
          >
            {aboutLabel}
          </Link>
          <Link
            href="/pro"
            className="text-rbs-accent-strong px-6 py-2 text-sm hover:underline"
          >
            Pro 안내
          </Link>
        </nav>

        <p className="mt-8 text-xs text-ink-muted">{t('home.trustSignal')}</p>
      </div>
    </main>
  );
}
