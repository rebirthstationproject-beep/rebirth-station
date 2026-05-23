'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export interface Entitlement {
  isProActive: boolean;
  plan: 'free' | 'pro';
  expiresAt: string | null;
  loading: boolean;
}

/**
 * 사용자 Pro 활성 여부 조회.
 *
 * 결제 모델 (memory/project_cubelist_iap.md):
 * - 외부 결제 X — 모바일 앱 IAP만
 * - PWA·Windows 헬퍼는 IAP 구매 불가, 같은 계정 로그인 시 entitlement 조회로 광고 제거
 *
 * 데이터 소스: `user_entitlements` view (0002 마이그레이션)
 */
export function useEntitlement(): Entitlement {
  const [state, setState] = useState<Entitlement>({
    isProActive: false,
    plan: 'free',
    expiresAt: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session) {
        if (!cancelled) {
          setState({ isProActive: false, plan: 'free', expiresAt: null, loading: false });
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_entitlements')
        .select('plan, current_period_end, is_pro_active')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        // 구독 row 없음 = free 사용자
        setState({ isProActive: false, plan: 'free', expiresAt: null, loading: false });
        return;
      }

      setState({
        isProActive: Boolean(data.is_pro_active),
        plan: (data.plan as 'free' | 'pro') ?? 'free',
        expiresAt: (data.current_period_end as string | null) ?? null,
        loading: false,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
