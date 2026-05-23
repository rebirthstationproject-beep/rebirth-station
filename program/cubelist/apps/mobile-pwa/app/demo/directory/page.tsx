'use client';

import Link from 'next/link';
import { AddToCubeButton } from '@/components/integration/AddToCubeButton';
import { AppHeader } from '@/components/layout/AppHeader';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * 디렉토리 통합 mock 페이지.
 *
 * 정착본 §7 — 디렉토리 페이지 ★ 옆 "내 큐브에 추가" 버튼 정착.
 * jusomoa 본체 이식 전 dry-run 확인용.
 *
 * 실제 사용 시 jusomoa-main/app/[category]/[slug]/page.tsx 에서
 * AddToCubeButton을 이 페이지처럼 배치.
 */

const MOCK_ITEMS = [
  {
    slug: 'naver',
    title: '네이버',
    url: 'https://www.naver.com',
    icon_url: 'https://www.naver.com/favicon.ico',
    category: '포털',
    description: '한국 1위 포털. 검색·뉴스·블로그·카페·쇼핑·지도까지 통합.',
  },
  {
    slug: 'kakao',
    title: '카카오',
    url: 'https://www.kakaocorp.com',
    icon_url: 'https://www.kakaocorp.com/favicon.ico',
    category: '플랫폼',
    description: '메신저·결제·모빌리티 한국 대표 플랫폼.',
  },
  {
    slug: 'github',
    title: 'GitHub',
    url: 'https://github.com',
    icon_url: 'https://github.com/favicon.ico',
    category: '개발',
    description: '코드 호스팅·이슈·PR·Actions. 개발자 필수.',
  },
  {
    slug: 'figma',
    title: 'Figma',
    url: 'https://www.figma.com',
    icon_url: 'https://static.figma.com/app/icon/1/favicon.png',
    category: '디자인',
    description: '브라우저 협업 디자인 도구.',
  },
];

export default function DirectoryDemoPage() {
  const { locale } = useTranslation();
  const lang = pickLang(locale);
  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/"
        title={lang.title}
        subtitle={lang.subtitle}
      />

      <ul className="divide-y">
        {MOCK_ITEMS.map((item) => (
          <li key={item.slug} className="px-4 py-4 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.icon_url}
              alt=""
              className="w-12 h-12 rounded-xl object-contain bg-gray-50"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-ink-muted">{item.category}</span>
              </div>
              <h2 className="font-semibold text-base">{item.title}</h2>
              <p className="text-sm text-ink-muted mt-0.5 line-clamp-2">{item.description}</p>
              <p className="text-xs text-ink-muted mt-1 truncate">{item.url}</p>

              {/* 즐겨찾기 ★ + AddToCubeButton — 정착본 §7 */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-sm font-medium"
                  aria-label={`${item.title} 즐겨찾기`}
                >
                  ★ 즐겨찾기
                </button>
                <AddToCubeButton
                  link={{ url: item.url, title: item.title, icon_url: item.icon_url }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="px-4 py-6 text-xs text-ink-muted border-t border-border">
        <p>
          {lang.footerPrefix}{' '}
          <Link href="/docs/integration-guide.md" className="text-rbs-accent underline">
            integration-guide.md
          </Link>
          {lang.footerSuffix}
        </p>
      </footer>
    </main>
  );
}

function pickLang(locale: 'ko' | 'en' | 'ja') {
  if (locale === 'en') {
    return {
      title: 'Directory mock',
      subtitle: 'Demo for the "Add to Cube" button to be ported into jusomoa main',
      footerPrefix: 'This page is an integration mock. See',
      footerSuffix: ' for actual porting.',
    };
  }
  if (locale === 'ja') {
    return {
      title: 'ディレクトリ モック',
      subtitle: 'jusomoa 本体に移植する「キューブに追加」ボタンのデモページ',
      footerPrefix: 'このページは統合検証用のモックです。実際の移植は',
      footerSuffix: ' を参照。',
    };
  }
  return {
    title: '디렉토리 mock',
    subtitle: 'jusomoa 본체에 이식할 "내 큐브에" 버튼 시연 페이지',
    footerPrefix: '이 페이지는 통합 검증용 mock입니다. 실제 이식은',
    footerSuffix: ' 참조.',
  };
}
