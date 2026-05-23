'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { installPlugin } from '@/lib/hooks/usePlugins';
import type { PluginRow } from '@/lib/types/plugin';

export default function PluginDetailPage() {
  const params = useParams<{ packageId: string }>();
  const router = useRouter();
  const packageId = decodeURIComponent(params.packageId);

  const [plugin, setPlugin] = useState<PluginRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error: err } = await supabase
        .from('mylist_plugins')
        .select('*')
        .eq('package_id', packageId)
        .eq('published', true)
        .maybeSingle();

      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else if (!data) {
        setError('플러그인을 찾을 수 없습니다');
      } else {
        setPlugin(data as PluginRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  async function handleInstall(): Promise<void> {
    if (!plugin || installing) return;
    setInstalling(true);
    setFeedback(null);
    const result = await installPlugin(plugin.id);
    setInstalling(false);
    if (result.success) {
      setFeedback('큐브 리스트 라이브러리에 추가되었습니다');
    } else {
      setFeedback(`설치 실패: ${result.reason}`);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink-muted">불러오는 중…</p>
      </main>
    );
  }

  if (error || !plugin) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-600">{error ?? '없습니다'}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm px-4 py-2 rounded-lg border"
        >
          돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <nav className="px-4 py-3 border-b text-sm">
        <Link href="/plugins" className="text-ink-muted hover:text-rbs-accent">
          ← 플러그인 목록
        </Link>
      </nav>

      <header className="px-4 py-6 flex items-start gap-4 border-b">
        {plugin.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plugin.icon_url}
            alt=""
            className="w-20 h-20 rounded-2xl object-contain bg-rbs-accent-soft"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-rbs-accent-soft" aria-hidden />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{plugin.name}</h1>
          <p className="text-sm text-ink-muted mt-1">
            {plugin.author ?? '익명'} · v{plugin.version}
          </p>
          <p className="text-xs text-ink-muted mt-1 font-mono">{plugin.package_id}</p>
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="mt-4 px-5 py-2 rounded-xl bg-rbs-accent text-white font-medium disabled:opacity-60"
          >
            {installing ? '설치 중…' : '큐브 리스트에 추가'}
          </button>
          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className="mt-2 text-xs text-ink"
            >
              {feedback}
            </p>
          )}
        </div>
      </header>

      {plugin.description && (
        <section className="px-4 py-6 border-b">
          <h2 className="text-sm font-semibold mb-2">설명</h2>
          <p className="text-sm text-ink whitespace-pre-line">{plugin.description}</p>
        </section>
      )}

      {plugin.manifest?.actions?.length > 0 && (
        <section className="px-4 py-6 border-b">
          <h2 className="text-sm font-semibold mb-3">포함된 동작</h2>
          <ul className="flex flex-col gap-2">
            {plugin.manifest.actions.map((a) => (
              <li key={a.id} className="border rounded-lg p-3 text-sm">
                <div className="font-medium">{a.label}</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  {a.action_type === 'link' ? '링크' : a.action_type === 'shortcut' ? '단축키' : '매크로'}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plugin.manifest?.requested_permissions?.length > 0 && (
        <section className="px-4 py-6 border-b">
          <h2 className="text-sm font-semibold mb-2">필요한 권한</h2>
          <ul className="flex flex-col gap-1 text-xs text-ink">
            {plugin.manifest.requested_permissions.map((p) => (
              <li key={p}>
                {p === 'tier_1' && '· 기본 권한 (텍스트 입력, 클릭)'}
                {p === 'tier_2' && '· 외부 앱 실행 (사용자 동의 후 활성)'}
                {p === 'tier_3' && '· 시스템 명령 (영구 토글 필요)'}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="px-4 py-6 text-xs text-ink-muted">
        <p>설치 수: {plugin.install_count.toLocaleString()}</p>
        <p>최종 업데이트: {new Date(plugin.updated_at).toLocaleDateString('ko-KR')}</p>
      </section>
    </main>
  );
}
