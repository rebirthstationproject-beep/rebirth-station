/**
 * Supabase 클라이언트 (singleton)
 *
 * RLS 정책으로 보호됨 — anon key 노출 OK.
 * 서비스 역할 키는 절대 클라이언트 코드에 포함 금지.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // 거치 모드에서 만료된 세션이 조용히 끊기는 것 방지
      detectSessionInUrl: true,
    },
    realtime: {
      // 정착본 §5: 사용자별 단일 채널 전략
      params: { eventsPerSecond: 5 },
    },
  });

  return _client;
}
