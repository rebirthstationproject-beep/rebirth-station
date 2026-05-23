'use client';

import { useState } from 'react';
import { useEntitlement } from '@/lib/hooks/useEntitlement';
import { isPurchaseAvailable, purchaseAndVerify } from '@/lib/iap';
import { getSupabase } from '@/lib/supabase';
import { FEATURES, CURRENT_STAGE } from '@/lib/stage';

/**
 * 하단 배너 — Stage별 컨텐츠 분기
 *
 * Stage 1 (현재): 광고 SDK 미통합. 후원 의향 시그널만 (선택, 무압박).
 * Stage 4+: AdSense·AdMob iframe 통합. Pro = 광고 제거.
 *
 * 정착본
 * - memory/project_rebirth_station.md — Stage 4 이전 광고/IAP 이연
 * - tech-review §7 — 64px 단일, 인터스티셜·전면광고 금지
 */
export function AdBanner() {
  const { isProActive, loading } = useEntitlement();
  const canPurchase = isPurchaseAvailable();
  const [purchasing, setPurchasing] = useState(false);

  if (loading || isProActive) return null;

  // Stage 1 — 광고 SDK 자체 없음. 후원 안내 카드만, 거치 모드에서는 미표시
  if (!FEATURES.ads_active) {
    return <UpgradeSignal canPurchase={canPurchase} />;
  }

  async function handleUpgrade(): Promise<void> {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return;
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
      await purchaseAndVerify(
        'com.rebirthstation.cubelist.pro.monthly',
        supabaseUrl,
        session.session.access_token,
      );
    } finally {
      setPurchasing(false);
    }
  }

  // Stage 4+ — 실 광고 자리 (현재 코드는 placeholder, AdSense iframe은 별도 통합)
  return (
    <div
      role="region"
      aria-label="광고"
      className="fixed bottom-0 left-0 right-0 h-16 bg-surface-2 border-t border-border flex items-center justify-between px-4 z-30"
    >
      <span className="text-xs text-ink-muted absolute top-1 left-2">광고</span>
      <div className="flex-1 text-center text-sm text-ink-muted">
        {canPurchase ? '큐브 리스트 후원하고 광고 제거하기' : '거치 모드 무료 이용 중'}
      </div>
      {canPurchase && (
        <button
          type="button"
          disabled={purchasing}
          className="text-xs px-3 py-1.5 rounded-full bg-rbs-accent text-white disabled:opacity-60"
          onClick={handleUpgrade}
        >
          {purchasing ? '진행 중…' : '후원하기'}
        </button>
      )}
    </div>
  );
}

interface UpgradeSignalProps {
  canPurchase: boolean;
}

/**
 * Stage 1 후원 시그널 — 광고 없음. 자발적 관심 시그널만 수집용.
 * 매크로 실행 중에는 자동 hide.
 */
function UpgradeSignal({ canPurchase }: UpgradeSignalProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  // Stage 1에서는 사용자가 명시적으로 후원 메뉴를 찾아갈 수 있도록 노출. 압박 X.
  return (
    <div
      role="status"
      className="fixed bottom-3 right-3 max-w-[260px] bg-surface border border-border rounded-xl shadow-md px-3 py-2 z-30 text-xs"
    >
      <div className="flex items-start gap-2">
        <span className="text-rbs-accent">●</span>
        <div className="flex-1">
          <p className="font-medium text-ink">큐브 리스트는 무료입니다</p>
          <p className="text-ink-muted mt-0.5">
            <a href="/pro" className="hover:underline">
              {canPurchase
                ? '향후 모바일 앱에서 후원을 받습니다 (Stage 4) →'
                : `Stage ${CURRENT_STAGE} · 개발 중 →`}
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-ink-muted hover:text-ink text-sm leading-none"
          aria-label="안내 닫기"
        >
          ×
        </button>
      </div>
    </div>
  );
}
