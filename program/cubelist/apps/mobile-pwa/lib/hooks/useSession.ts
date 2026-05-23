'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode, LOCAL_USER_ID } from '@/lib/storage/local-store';
import type { Session, User } from '@supabase/supabase-js';

interface SessionState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * 로컬 모드용 fake user — Supabase User shape 최소 충족.
 * RLS 통과는 불필요 (LOCAL_MODE에서는 LocalStore만 사용).
 */
const LOCAL_USER: User = {
  id: LOCAL_USER_ID,
  app_metadata: { provider: 'local' },
  user_metadata: { name: 'Local Tester', email: 'local@cubelist.dev' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  email: 'local@cubelist.dev',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2026-01-01T00:00:00Z',
  last_sign_in_at: '2026-01-01T00:00:00Z',
  role: 'authenticated',
  updated_at: '2026-01-01T00:00:00Z',
  identities: [],
  factors: [],
  is_anonymous: false,
};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(() => {
    // LOCAL_MODE는 mount 즉시 로그인 상태로 (loading 단계 생략)
    if (isLocalMode()) {
      return { user: LOCAL_USER, session: null, loading: false };
    }
    return { user: null, session: null, loading: true };
  });

  useEffect(() => {
    if (isLocalMode()) return; // LOCAL_MODE는 Supabase 구독 X
    const supabase = getSupabase();
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
