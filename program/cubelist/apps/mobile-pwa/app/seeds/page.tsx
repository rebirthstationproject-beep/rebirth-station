import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { SeedsList, type SeedEntry } from './SeedsList';

export const metadata = {
  title: '시드 카탈로그 — 리버스 스테이션',
};

interface SeedIndex {
  rbs_format_version: number;
  generated_at: string;
  entries: SeedEntry[];
}

function loadIndex(): SeedIndex | null {
  try {
    const path = join(process.cwd(), '..', '..', 'data', 'seeds', 'index.json');
    const text = readFileSync(path, 'utf8');
    return JSON.parse(text) as SeedIndex;
  } catch {
    return null;
  }
}

/**
 * 시드 카탈로그 안내 페이지.
 *
 * 정착본: data/seeds/index.json — 모든 시드 파일 메타
 * 사용자가 사전 제작된 시드 파일을 둘러보고 가져올 수 있는 진입점.
 */
export default function SeedsPage() {
  const index = loadIndex();

  if (!index) {
    return (
      <main className="min-h-screen bg-surface text-ink">
        <AppHeader
          backHref="/"
          title="시드 카탈로그"
          subtitle="사전 제작된 큐브 모음"
          right={<LocaleSwitcher size="compact" />}
        />
        <p className="px-4 py-8 text-sm text-ink-muted text-center">
          시드 인덱스를 불러올 수 없습니다.
        </p>
      </main>
    );
  }

  const totalCubes = index.entries.reduce((s, e) => s + e.cube_count, 0);

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/"
        title="시드 카탈로그"
        subtitle={`사전 제작된 큐브 ${totalCubes}개 · ${index.entries.length}개 파일`}
        right={<LocaleSwitcher size="compact" />}
      />

      <SeedsList entries={index.entries} totalCubes={totalCubes} />

      <footer className="px-4 py-6 text-[11px] text-ink-muted">
        파일 형식 명세:{' '}
        <Link href="/docs/file-format-spec.md" className="underline">
          file-format-spec.md
        </Link>{' '}
        · 라이선스 정책:{' '}
        <Link href="/marketplace/policy" className="underline">
          마켓플레이스 정책
        </Link>
      </footer>
    </main>
  );
}
