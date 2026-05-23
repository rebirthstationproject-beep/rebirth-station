'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { CURRENT_STAGE, FEATURES, stageLabel } from '@/lib/stage';
import { isPurchaseAvailable } from '@/lib/iap';
import { useTranslation } from '@/lib/i18n/useTranslation';

const PRO_COPY = {
  ko: {
    title: '큐브 리스트 Pro',
    subtitle: '후원으로 큐브 리스트가 자랍니다',
    headlineFree: '지금은 모든 기능이 무료입니다',
    headlineBody:
      '큐브 리스트는 Stage 4 진입 시점에 모바일 앱스토어 IAP로 Pro 업그레이드를 제공합니다. 그때까지는 모든 사용자가 광고 없이 무료로 사용합니다.',
    diffTitle: 'Pro 차이 (Stage 4 예정)',
    diff1: '광고 제거 (Stage 4 광고 활성 시점)',
    diff2: '기능 제한 없음 — 모든 큐브·리스트·매크로 무제한 (무료와 동일)',
    diff3: '후원자 뱃지 (계정 화면 표시)',
    diff4: '정식 마켓플레이스 유료 큐브 구매',
    payTitle: '결제 방식',
    payBody:
      '큐브 리스트는 외부 결제 게이트웨이를 사용하지 않습니다. Pro 업그레이드는 다음 채널에서만 가능합니다:',
    payPlay: 'Google Play Billing (Android 앱)',
    payApple: 'Apple App Store IAP (iOS 앱)',
    payNote:
      'PWA·Windows 헬퍼에서는 구매 불가. 같은 계정으로 로그인하면 entitlement가 자동 동기화됩니다.',
    ctaActive: '큐브 리스트에서 Pro 업그레이드',
    ctaPending: (n: number) => `Stage 4 진입 후 활성화됩니다 (현재 Stage ${n})`,
    ctaNotAvailable: 'PWA·Windows 헬퍼는 Pro 구매 채널이 아닙니다. 모바일 앱이 출시되면 안내합니다.',
    relatedAbout: '브랜드 소개',
    relatedPolicy: '마켓플레이스 정책',
    relatedLabel: '관련',
  },
  en: {
    title: 'Cube List Pro',
    subtitle: 'Cube List grows through your support',
    headlineFree: 'Everything is free right now',
    headlineBody:
      'Pro upgrade ships when Stage 4 lands via mobile app stores (IAP). Until then every user gets the full experience for free, without ads.',
    diffTitle: "Pro perks (Stage 4)",
    diff1: 'Ad-free (once Stage 4 enables ads)',
    diff2: 'No feature limits — unlimited cubes / lists / macros (same as free)',
    diff3: 'Patron badge (shown on the account screen)',
    diff4: 'Buy paid cubes from the marketplace',
    payTitle: 'Payment',
    payBody:
      'Cube List does not use external payment gateways. Pro upgrades only come from:',
    payPlay: 'Google Play Billing (Android app)',
    payApple: 'Apple App Store IAP (iOS app)',
    payNote:
      'PWA and the Windows helper cannot purchase. Sign in with the same account and your entitlement auto-syncs.',
    ctaActive: 'Upgrade to Pro from Cube List',
    ctaPending: (n: number) => `Activates after Stage 4 (currently Stage ${n})`,
    ctaNotAvailable:
      'PWA and Windows helper are not purchase channels. We will announce when the mobile app launches.',
    relatedAbout: 'About',
    relatedPolicy: 'Marketplace policy',
    relatedLabel: 'See also',
  },
  ja: {
    title: 'キューブ・リスト Pro',
    subtitle: 'サポートでキューブ・リストが育ちます',
    headlineFree: '今はすべての機能が無料です',
    headlineBody:
      'Pro アップグレードは Stage 4 進入時にモバイルアプリストアの IAP で提供されます。それまでは全ユーザーが広告なしで無料利用できます。',
    diffTitle: 'Pro の違い (Stage 4 予定)',
    diff1: '広告除去 (Stage 4 の広告稼働時点)',
    diff2: '機能制限なし — 全てのキューブ・リスト・マクロが無制限 (無料と同じ)',
    diff3: 'サポーター バッジ (アカウント画面表示)',
    diff4: '正式マーケットプレイスの有料キューブ購入',
    payTitle: '決済方式',
    payBody:
      'キューブ・リストは外部決済ゲートウェイを使いません。Pro アップグレードは次のチャネルのみ:',
    payPlay: 'Google Play Billing (Android アプリ)',
    payApple: 'Apple App Store IAP (iOS アプリ)',
    payNote:
      'PWA · Windows ヘルパーでは購入不可。同じアカウントでサインインすると entitlement が自動同期されます。',
    ctaActive: 'キューブ・リストから Pro にアップグレード',
    ctaPending: (n: number) => `Stage 4 以降に有効化されます (現在 Stage ${n})`,
    ctaNotAvailable:
      'PWA · Windows ヘルパーは購入チャネルではありません。モバイルアプリ公開時に案内します。',
    relatedAbout: 'ブランド紹介',
    relatedPolicy: 'マーケットプレイス ポリシー',
    relatedLabel: '関連',
  },
} as const;

export default function ProPage() {
  const canPurchase = isPurchaseAvailable();
  const iapActive = FEATURES.iap_active;
  const { locale } = useTranslation();
  const c = PRO_COPY[locale] ?? PRO_COPY.ko;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/"
        title={c.title}
        subtitle={c.subtitle}
        right={<LocaleSwitcher size="compact" />}
      />

      <section className="px-4 py-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-surface-2 p-6">
          <p className="text-xs text-ink-muted mb-2">{stageLabel()}</p>
          <h2 className="text-xl font-bold mb-4">{c.headlineFree}</h2>
          <p className="text-sm text-ink-muted leading-relaxed">{c.headlineBody}</p>
        </div>
      </section>

      <section className="px-4 py-6 max-w-2xl mx-auto border-t border-border">
        <h3 className="text-sm font-semibold mb-3">{c.diffTitle}</h3>
        <ul className="text-sm text-ink-muted flex flex-col gap-2">
          <li>· {c.diff1}</li>
          <li>· {c.diff2}</li>
          <li>· {c.diff3}</li>
          <li>· {c.diff4}</li>
        </ul>
      </section>

      <section className="px-4 py-6 max-w-2xl mx-auto border-t border-border">
        <h3 className="text-sm font-semibold mb-3">{c.payTitle}</h3>
        <p className="text-sm text-ink-muted leading-relaxed">{c.payBody}</p>
        <ul className="text-sm text-ink-muted mt-2 flex flex-col gap-1">
          <li>· {c.payPlay}</li>
          <li>· {c.payApple}</li>
        </ul>
        <p className="text-xs text-ink-muted mt-3">{c.payNote}</p>
      </section>

      <section className="px-4 py-6 max-w-2xl mx-auto border-t border-border">
        {iapActive ? (
          <Link
            href="/list"
            className="block w-full px-5 py-3 rounded-xl bg-rbs-accent text-white text-center font-medium"
          >
            {c.ctaActive}
          </Link>
        ) : canPurchase ? (
          <button
            type="button"
            disabled
            className="w-full px-5 py-3 rounded-xl border border-border text-ink-muted text-center font-medium cursor-not-allowed"
          >
            {c.ctaPending(CURRENT_STAGE)}
          </button>
        ) : (
          <p className="text-xs text-ink-muted text-center">{c.ctaNotAvailable}</p>
        )}
      </section>

      <footer className="px-4 py-6 max-w-2xl mx-auto border-t border-border text-[11px] text-ink-muted">
        <p>
          {c.relatedLabel}:{' '}
          <Link href="/about" className="underline">
            {c.relatedAbout}
          </Link>{' '}
          ·{' '}
          <Link href="/marketplace/policy" className="underline">
            {c.relatedPolicy}
          </Link>
        </p>
      </footer>
    </main>
  );
}
