'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/hooks/useSession';
import { useEntitlement } from '@/lib/hooks/useEntitlement';
import { getSupabase } from '@/lib/supabase';
import { isPurchaseAvailable } from '@/lib/iap';
import { AppHeader } from '@/components/layout/AppHeader';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/lib/toast/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';

const ACCOUNT_LABELS = {
  ko: {
    title: '내 계정',
    email: '이메일',
    plan: '플랜',
    proName: '큐브 리스트 Pro',
    free: '무료',
    proPatronChip: '후원자',
    proUpgrade: 'Pro 업그레이드 →',
    mobileOnlyUpgrade: '모바일 앱에서 업그레이드',
    expires: '만료',
    devices: '연결된 기기',
    devicesEmpty: '아직 페어링된 기기가 없습니다.',
    pairLink: '페어링하기',
    insightsTitle: '내 사용량 보기',
    insightsSub: 'WAEL · 자주 누른 큐브 →',
    nickname: '닉네임',
    nicknamePlaceholder: '공유 큐브팩에 표시 (선택)',
    nicknameAnon: '현재 익명으로 표시됩니다. 큐브팩 export 시 author는 비워집니다.',
    nicknameWithName: '큐브팩 export 시 author 자동 채움에 사용됩니다.',
    saveBtn: '저장',
    savingBtn: '저장…',
    backupTitle: '데이터 백업',
    backupBtn: '모든 보드를 .cubepack으로 백업',
    backupBusy: '백업 생성 중…',
    backupNote: '모든 리스트와 큐브를 단일 파일로 다운로드. 새 기기에서 가져오기로 복원 가능합니다.',
    signOut: '로그아웃',
    deleteLink: '계정·데이터 영구 삭제 안내 →',
  },
  en: {
    title: 'My account',
    email: 'Email',
    plan: 'Plan',
    proName: 'Cube List Pro',
    free: 'Free',
    proPatronChip: 'Patron',
    proUpgrade: 'Upgrade to Pro →',
    mobileOnlyUpgrade: 'Upgrade from the mobile app',
    expires: 'Expires',
    devices: 'Paired devices',
    devicesEmpty: 'No paired devices yet.',
    pairLink: 'Pair a device',
    insightsTitle: 'View my usage',
    insightsSub: 'WAEL · top cubes →',
    nickname: 'Nickname',
    nicknamePlaceholder: 'Shown on shared cubepacks (optional)',
    nicknameAnon: "You'll appear as Anonymous. Cubepack author field stays blank on export.",
    nicknameWithName: 'Used to fill the author field when exporting cubepacks.',
    saveBtn: 'Save',
    savingBtn: 'Saving…',
    backupTitle: 'Data backup',
    backupBtn: 'Back up every board as a .cubepack',
    backupBusy: 'Creating backup…',
    backupNote: 'Download every list & cube as one file. Restore from another device via Import.',
    signOut: 'Sign out',
    deleteLink: 'About permanent account & data deletion →',
  },
  ja: {
    title: 'マイ アカウント',
    email: 'メール',
    plan: 'プラン',
    proName: 'キューブ・リスト Pro',
    free: '無料',
    proPatronChip: 'サポーター',
    proUpgrade: 'Pro にアップグレード →',
    mobileOnlyUpgrade: 'モバイル アプリでアップグレード',
    expires: '有効期限',
    devices: '接続済みデバイス',
    devicesEmpty: 'まだペアリングされたデバイスはありません。',
    pairLink: 'ペアリング',
    insightsTitle: '使用状況を見る',
    insightsSub: 'WAEL · よく押すキューブ →',
    nickname: 'ニックネーム',
    nicknamePlaceholder: '共有キューブパックに表示 (任意)',
    nicknameAnon: '現在は匿名で表示されます。キューブパック export 時に author は空になります。',
    nicknameWithName: 'キューブパック export 時に author に自動で入ります。',
    saveBtn: '保存',
    savingBtn: '保存中…',
    backupTitle: 'データ バックアップ',
    backupBtn: '全ボードを .cubepack でバックアップ',
    backupBusy: 'バックアップ作成中…',
    backupNote:
      '全リストとキューブを単一ファイルでダウンロード。新しい端末では取り込みから復元できます。',
    signOut: 'ログアウト',
    deleteLink: 'アカウント・データの完全削除について →',
  },
};

export default function AccountPage() {
  const { user, loading } = useSession();
  const entitlement = useEntitlement();
  const { showToast: showAccountToast } = useToast();
  const { locale } = useTranslation();
  const labels = ACCOUNT_LABELS[locale] ?? ACCOUNT_LABELS.ko;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (!user) {
    return <SignInPanel />;
  }

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader backHref="/" title={labels.title} right={<LocaleSwitcher size="compact" />} />

      <section className="px-4 py-5 border-b">
        <p className="text-xs text-ink-muted mb-1">{labels.email}</p>
        <p className="text-sm font-medium">{user.email ?? '—'}</p>
      </section>

      <NicknameSection
        initial={(user.user_metadata?.nickname as string | undefined) ?? ''}
        labels={labels}
      />

      <section className="px-4 py-5 border-b">
        <p className="text-xs text-ink-muted mb-1">{labels.plan}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {entitlement.isProActive ? labels.proName : labels.free}
          </span>
          {entitlement.isProActive ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rbs-accent-soft text-rbs-accent">
              {labels.proPatronChip}
            </span>
          ) : isPurchaseAvailable() ? (
            <Link
              href="/list"
              className="text-xs text-rbs-accent hover:underline"
            >
              {labels.proUpgrade}
            </Link>
          ) : (
            <span className="text-xs text-ink-muted">{labels.mobileOnlyUpgrade}</span>
          )}
        </div>
        {entitlement.expiresAt && (
          <p className="text-xs text-ink-muted mt-1">
            {labels.expires}: {new Date(entitlement.expiresAt).toLocaleDateString(
              locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'ko-KR',
            )}
          </p>
        )}
      </section>

      <DevicesSection labels={labels} />

      <section className="px-4 py-5 border-b">
        <Link
          href="/insights"
          className="flex items-center justify-between text-sm hover:text-rbs-accent"
        >
          <span>{labels.insightsTitle}</span>
          <span className="text-xs text-ink-muted">{labels.insightsSub}</span>
        </Link>
      </section>

      <BackupSection labels={labels} />

      <section className="px-4 py-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={async () => {
            await getSupabase().auth.signOut();
            const signOutMsg =
              locale === 'en'
                ? 'Signed out. Sign in again from /.'
                : locale === 'ja'
                  ? 'ログアウトしました。/ から再ログインしてください。'
                  : '로그아웃되었습니다. 다시 로그인하려면 / 페이지에서 로그인하세요.';
            showAccountToast({ level: 'info', message: signOutMsg, duration: 4_500 });
            setTimeout(() => {
              window.location.href = '/';
            }, 800);
          }}
          className="w-full px-4 py-2 rounded-lg border text-sm text-red-600 hover:bg-red-50"
        >
          {labels.signOut}
        </button>
        <Link
          href="/account/delete"
          className="text-center text-xs text-ink-muted hover:text-red-600 py-2"
        >
          {labels.deleteLink}
        </Link>
      </section>
    </main>
  );
}

function SignInPanel() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function sendMagicLink(): Promise<void> {
    if (!email.includes('@')) {
      setError('이메일 형식이 아닙니다');
      return;
    }
    setSending(true);
    setError(null);
    const supabase = getSupabase();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined,
      },
    });
    setSending(false);
    if (err) {
      setError(err.message);
      showToast({ level: 'error', message: `매직링크 전송 실패: ${err.message}` });
    } else {
      setSent(true);
      showToast({ level: 'success', message: `${email}로 매직링크를 전송했습니다` });
    }
  }

  async function signInWithGoogle(): Promise<void> {
    if (oauthBusy) return;
    setOauthBusy(true);
    const supabase = getSupabase();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined,
      },
    });
    if (err) {
      setOauthBusy(false);
      showToast({ level: 'error', message: `Google 로그인 실패: ${err.message}` });
    }
    // 성공 시 페이지 리디렉트로 자연 처리 — busy 유지
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rbs-accent-soft to-white">
      <div className="bg-surface rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <p className="text-xs text-rbs-accent-strong text-center">리버스 스테이션</p>
        <h1 className="text-2xl font-bold text-center mt-1 mb-6">로그인</h1>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={oauthBusy}
          className="w-full px-4 py-3 rounded-xl border bg-surface hover:bg-surface-2 flex items-center justify-center gap-2 text-sm font-medium mb-4 disabled:opacity-60"
        >
          {oauthBusy ? <Spinner size="sm" /> : null}
          {oauthBusy ? 'Google로 이동 중…' : 'Google로 계속하기'}
        </button>

        <div className="flex items-center gap-2 my-4 text-xs text-ink-muted">
          <hr className="flex-1" />
          <span>또는</span>
          <hr className="flex-1" />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border rounded-lg px-3 py-2 text-sm"
            disabled={sent}
          />
        </label>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={sending || sent}
          className="w-full mt-4 px-4 py-3 rounded-xl bg-rbs-accent text-white font-medium disabled:opacity-60"
        >
          {sent ? '메일을 확인해주세요' : sending ? '전송 중…' : '매직 링크 받기'}
        </button>

        {error && (
          <p role="alert" className="text-xs text-red-600 mt-2">
            {error}
          </p>
        )}

        <p className="text-xs text-ink-muted text-center mt-6">
          큐브 리스트 데이터는 같은 계정으로 PC·모바일에서 동기화됩니다
        </p>
      </div>
    </main>
  );
}

type AccountLabels = typeof ACCOUNT_LABELS.ko;

function DevicesSection({ labels }: { labels: AccountLabels }) {
  return (
    <section className="px-4 py-5 border-b">
      <p className="text-xs text-ink-muted mb-2">{labels.devices}</p>
      <DevicesList labels={labels} />
    </section>
  );
}

interface DeviceRow {
  id: string;
  device_type: string;
  nickname: string | null;
  paired_at: string;
}

function DevicesList({ labels }: { labels: AccountLabels }) {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('user_devices')
        .select('id, device_type, nickname, paired_at')
        .order('paired_at', { ascending: false });
      if (cancelled) return;
      setDevices((data ?? []) as DeviceRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner size="sm" />;
  if (devices.length === 0) {
    return (
      <p className="text-xs text-ink-muted">
        {labels.devicesEmpty}{' '}
        <Link href="/pair" className="text-rbs-accent hover:underline">
          {labels.pairLink}
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {devices.map((d) => (
        <li key={d.id} className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{d.nickname ?? deviceLabel(d.device_type)}</p>
            <p className="text-xs text-ink-muted">
              {deviceLabel(d.device_type)} · {new Date(d.paired_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function deviceLabel(type: string): string {
  switch (type) {
    case 'pc_helper':
      return 'PC 앱';
    case 'mobile_pwa':
      return '모바일';
    default:
      return type;
  }
}

interface NicknameSectionProps {
  initial: string;
  labels: AccountLabels;
}

function NicknameSection({ initial, labels }: NicknameSectionProps) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const saveToastSuccess =
    locale === 'en'
      ? 'Nickname saved'
      : locale === 'ja'
        ? 'ニックネームを保存しました'
        : '닉네임이 저장되었습니다';
  const saveToastFailPrefix =
    locale === 'en' ? 'Save failed' : locale === 'ja' ? '保存に失敗しました' : '저장 실패';

  async function save(): Promise<void> {
    const trimmed = value.trim().slice(0, 24);
    if (trimmed === initial.trim()) return;
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { error: err } = await supabase.auth.updateUser({
        data: { nickname: trimmed.length > 0 ? trimmed : null },
      });
      if (err) throw err;
      showToast({ level: 'success', message: saveToastSuccess });
      setFlash(true);
      setTimeout(() => setFlash(false), 900);
    } catch (e) {
      showToast({ level: 'error', message: `${saveToastFailPrefix}: ${(e as Error).message}` });
    } finally {
      setSaving(false);
    }
  }

  const charCount = value.length;
  const charLimit = 24;
  const near = charCount >= charLimit - 4;

  return (
    <section className="px-4 py-5 border-b">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-ink-muted">{labels.nickname}</p>
        <span
          className={`text-[10px] font-mono ${
            near ? 'text-rbs-accent' : 'text-ink-muted'
          }`}
          aria-live="polite"
        >
          {charCount}/{charLimit}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={charLimit}
          placeholder={labels.nicknamePlaceholder}
          className={`flex-1 border border-border bg-surface rounded-lg px-3 py-2 text-sm ${
            flash ? 'cubelist-save-flash' : ''
          }`}
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || value.trim() === initial.trim()}
          className="px-3 py-2 rounded-lg bg-rbs-accent text-white text-sm disabled:opacity-50"
        >
          {saving ? labels.savingBtn : labels.saveBtn}
        </button>
      </div>
      <p className="text-[10px] text-ink-muted mt-1.5">
        {value.trim().length === 0 ? labels.nicknameAnon : labels.nicknameWithName}
      </p>
    </section>
  );
}

function BackupSection({ labels }: { labels: AccountLabels }) {
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const loginNeeded =
    locale === 'en'
      ? 'Sign-in required'
      : locale === 'ja'
        ? 'ログインが必要です'
        : '로그인이 필요합니다';
  const boardLoadFail =
    locale === 'en' ? 'Failed to load boards' : locale === 'ja' ? 'ボードの取得に失敗' : '보드 조회 실패';
  const nothingToBackup =
    locale === 'en'
      ? 'No boards to back up'
      : locale === 'ja'
        ? 'バックアップするボードがありません'
        : '백업할 보드가 없습니다';
  const backupNameLabel =
    locale === 'en' ? 'Cube List backup' : locale === 'ja' ? 'キューブ・リスト バックアップ' : '내 큐브 백업';
  const backupDesc =
    locale === 'en'
      ? 'Cube List · all boards backup'
      : locale === 'ja'
        ? 'キューブ・リスト · 全ボード バックアップ'
        : '큐브 리스트 전체 보드 백업';
  const successMsg = (n: number) =>
    locale === 'en'
      ? `${n} boards backed up`
      : locale === 'ja'
        ? `${n} 個のボードをバックアップしました`
        : `${n}개 보드 백업 완료`;
  const failPrefix =
    locale === 'en' ? 'Backup failed' : locale === 'ja' ? 'バックアップ失敗' : '백업 실패';

  async function handleBackup(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        showToast({ level: 'warning', message: loginNeeded });
        return;
      }
      const userId = session.session.user.id;

      const { data: boards, error: boardsErr } = await supabase
        .from('mylist_boards')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });
      if (boardsErr || !boards) throw boardsErr ?? new Error(boardLoadFail);

      if (boards.length === 0) {
        showToast({ level: 'info', message: nothingToBackup });
        return;
      }

      const boardIds = boards.map((b) => b.id);
      const { data: items, error: itemsErr } = await supabase
        .from('mylist_items')
        .select('*')
        .in('board_id', boardIds);
      if (itemsErr) throw itemsErr;

      const itemsByBoard: Record<string, unknown[]> = {};
      for (const it of items ?? []) {
        const list = itemsByBoard[(it as { board_id: string }).board_id] ?? [];
        list.push(it);
        itemsByBoard[(it as { board_id: string }).board_id] = list;
      }

      const { exportCubePack, downloadAsFile } = await import('@/lib/cube-format/export');

      const hydratedBoards = boards.map((b) => ({
        ...(b as Record<string, unknown>),
        items: itemsByBoard[(b as { id: string }).id] ?? [],
      }));

      const localeDate =
        locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'ko-KR';
      const blob = await exportCubePack(hydratedBoards as never, {
        name: `${backupNameLabel} ${new Date().toLocaleDateString(localeDate)}`,
        description: backupDesc,
        license: 'personal',
        target_persona: ['backup'],
      });
      downloadAsFile(
        `cubelist-backup-${new Date().toISOString().slice(0, 10)}.cubepack`,
        blob,
      );
      showToast({ level: 'success', message: successMsg(boards.length) });
    } catch (e) {
      showToast({ level: 'error', message: `${failPrefix}: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-4 py-5 border-b">
      <p className="text-xs text-ink-muted mb-2">{labels.backupTitle}</p>
      <button
        type="button"
        onClick={handleBackup}
        disabled={busy}
        className="w-full px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface-2 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy && <Spinner size="sm" />}
        {busy ? labels.backupBusy : labels.backupBtn}
      </button>
      <p className="text-[10px] text-ink-muted mt-2">{labels.backupNote}</p>
    </section>
  );
}
