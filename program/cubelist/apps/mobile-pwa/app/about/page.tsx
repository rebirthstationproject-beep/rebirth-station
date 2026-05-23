'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { CURRENT_STAGE, stageLabel } from '@/lib/stage';

type AboutLocale = 'ko' | 'en' | 'ja';

const COPY: Record<
  AboutLocale,
  {
    title: string;
    subtitle: string;
    brandLayers: string;
    layer1Desc: string;
    layer2Desc: string;
    layer3Desc: string;
    layer4Desc: string;
    currentStageHeading: string;
    currentStageNote: string;
    moreHeading: string;
    moreList: string;
    morePlugins: string;
    morePolicy: string;
    stageLabels: string[];
  }
> = {
  ko: {
    title: '브랜드 소개',
    subtitle: '리버스 스테이션 · 큐브 리스트',
    brandLayers: '브랜드 구조 (4-Layer)',
    layer1Desc: '유휴 디바이스(폰·노트북·태블릿) 재활용 전체 생태계',
    layer2Desc: 'Stream Deck 호환 제품 1호. 큐브(단일 액션) + 리스트(그리드 한 장)',
    layer3Desc:
      'rebirthstation.com/marketplace. 단일 큐브 + 리스트 + 직군별 묶음 (.cubeone / .cubelist / .cubepack)',
    layer4Desc: '주소모아·케이링크·타이플·AIKLINK × 큐브 리스트',
    currentStageHeading: '현재 단계',
    currentStageNote: '수익 0 상태에서 법무·세무·상표·등록 비용을 지출하지 않는 부트스트랩 운영.',
    moreHeading: '자세히 알아보기',
    moreList: '큐브 리스트 열기',
    morePlugins: '플러그인 마켓플레이스',
    morePolicy: '마켓플레이스 수수료 정책',
    stageLabels: [
      '시스템 개발 + 브랜딩',
      '시스템 완성',
      '업데이트·개선 반복',
      '광고·결제 모듈 추가',
      '수익 발생',
      '사업자 등록 + 상표권 출원',
      '글로벌·B2B·하드웨어 확장',
    ],
  },
  en: {
    title: 'About',
    subtitle: 'Rebirth Station · Cube List',
    brandLayers: 'Brand structure (4 layers)',
    layer1Desc: 'A whole ecosystem for repurposing idle devices (phones / laptops / tablets).',
    layer2Desc: 'First Stream Deck-compatible product. Cube (single action) + List (one grid).',
    layer3Desc:
      'rebirthstation.com/marketplace. Single cube + list + persona bundles (.cubeone / .cubelist / .cubepack).',
    layer4Desc: 'Jusomoa · Keilink · ThaiPL · AIKLINK × Cube List',
    currentStageHeading: 'Current stage',
    currentStageNote:
      'Bootstrap operation: no legal / tax / trademark / registration spend while revenue is zero.',
    moreHeading: 'Learn more',
    moreList: 'Open Cube List',
    morePlugins: 'Plugin marketplace',
    morePolicy: 'Marketplace fee policy',
    stageLabels: [
      'System dev + branding',
      'System complete',
      'Iterate updates & improvements',
      'Ads & payment modules',
      'Revenue starts',
      'Business registration + trademark',
      'Global · B2B · hardware expansion',
    ],
  },
  ja: {
    title: 'ブランド紹介',
    subtitle: 'リバース・ステーション · キューブ・リスト',
    brandLayers: 'ブランド構造 (4-Layer)',
    layer1Desc: '使われていないデバイス(スマホ・PC・タブレット) を再活用する全体エコシステム。',
    layer2Desc: 'Stream Deck 互換製品の第1号。キューブ(単一アクション) + リスト(グリッド1枚)。',
    layer3Desc:
      'rebirthstation.com/marketplace。単一キューブ + リスト + 職種別バンドル (.cubeone / .cubelist / .cubepack)。',
    layer4Desc: 'Jusomoa · Keilink · ThaiPL · AIKLINK × キューブ・リスト',
    currentStageHeading: '現在のステージ',
    currentStageNote: '収益ゼロのうちは法務・税務・商標・登録費用をかけないブートストラップ運営。',
    moreHeading: '詳しく見る',
    moreList: 'キューブ・リストを開く',
    morePlugins: 'プラグインマーケットプレイス',
    morePolicy: 'マーケットプレイス手数料ポリシー',
    stageLabels: [
      'システム開発 + ブランディング',
      'システム完成',
      'アップデート・改善のループ',
      '広告・決済モジュール追加',
      '収益発生',
      '事業者登録 + 商標出願',
      'グローバル・B2B・ハードウェア拡張',
    ],
  },
};

export default function AboutPage() {
  const { t, locale } = useTranslation();
  const c = COPY[locale as AboutLocale] ?? COPY.ko;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/"
        title={c.title}
        subtitle={c.subtitle}
        right={<LocaleSwitcher size="compact" />}
      />

      <section className="px-6 py-8 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">{c.brandLayers}</h2>
        <ol className="flex flex-col gap-3">
          <LayerCard label={t('brand.layer1')} desc={c.layer1Desc} />
          <LayerCard label={t('brand.layer2')} desc={c.layer2Desc} />
          <LayerCard label={t('brand.layer3')} desc={c.layer3Desc} />
          <LayerCard label={t('brand.layer4')} desc={c.layer4Desc} />
        </ol>
      </section>

      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-border">
        <h2 className="text-lg font-semibold mb-4">{c.currentStageHeading}</h2>
        <div className="rounded-xl border border-rbs-accent-soft bg-rbs-accent-soft/30 p-4">
          <p className="text-sm font-medium">{stageLabel()}</p>
          <p className="text-xs text-ink-muted mt-1">{c.currentStageNote}</p>
        </div>
        <ol className="mt-4 text-xs text-ink-muted leading-relaxed flex flex-col gap-1">
          {c.stageLabels.map((label, idx) => {
            const n = idx + 1;
            return (
              <li
                key={n}
                className={n === CURRENT_STAGE ? 'text-rbs-accent font-medium' : ''}
              >
                {n === CURRENT_STAGE ? '▶ ' : '· '}Stage {n} — {label}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-border">
        <h2 className="text-lg font-semibold mb-4">{c.moreHeading}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/list" className="text-rbs-accent hover:underline">
              → {c.moreList}
            </Link>
          </li>
          <li>
            <Link href="/plugins" className="text-rbs-accent hover:underline">
              → {c.morePlugins}
            </Link>
          </li>
          <li>
            <Link href="/marketplace/policy" className="text-rbs-accent hover:underline">
              → {c.morePolicy}
            </Link>
          </li>
        </ul>
      </section>

      <footer className="px-6 py-6 text-xs text-ink-muted text-center border-t border-border">
        © 2026 Rebirth Station · rebirthstation.com
      </footer>
    </main>
  );
}

interface LayerCardProps {
  label: string;
  desc: string;
}

function LayerCard({ label, desc }: LayerCardProps) {
  return (
    <li className="border border-border rounded-xl p-4 hover:shadow-sm transition bg-surface">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-ink-muted mt-1">{desc}</p>
    </li>
  );
}
