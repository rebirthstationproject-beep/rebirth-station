'use client';

import { useInsights, type WeeklyRow } from '@/lib/hooks/useInsights';
import { AppHeader } from '@/components/layout/AppHeader';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/lib/i18n/useTranslation';

const INSIGHTS_COPY = {
  ko: {
    title: '내 사용량',
    subtitle: '큐브 리스트 사용 추이 (본인만 조회 가능)',
    loading: '불러오는 중…',
    errorTitle: '불러오지 못했습니다',
    stat28d: '28일 누름',
    statThisWeek: '이번 주',
    statBoards: '사용 리스트',
    statMount: '거치 모드',
    statMountHint: '이번 주 비율',
    statWowLabel: '전주 대비',
    weeklyTitle: '주간 추이 (최근 8주)',
    weeklyEmpty: '아직 누른 기록이 없습니다. 큐브를 한 번 눌러보세요.',
    weeklyChartAria: '주간 누름 횟수 막대 그래프',
    weeklySrCaption: '주간 누름 횟수 (최근 8주)',
    srWeek: '주 시작일',
    srCount: '누름 횟수',
    mountTitle: '거치 모드 사용 비율 (최근 8주)',
    mountBody: (total: number, mount: number) =>
      `전체 누름 ${total.toLocaleString()}회 중 거치 모드 누름 ${mount.toLocaleString()}회. PC 헬퍼와 짝 지어 모바일을 거치한 상태에서 동작했을 때 더 높습니다.`,
    actionTitle: '동작 종류 분포 (최근 8주)',
    actionAria: '동작 종류 비율',
    actionLink: '링크',
    actionShortcut: '단축키',
    actionMacro: '매크로',
    topTitle: '자주 누른 큐브 (최근 28일)',
    topEmpty: '아직 통계가 없습니다',
    privacy:
      '본 통계는 익명화된 누름 이벤트만 사용합니다. URL·label·매크로 내용은 일절 텔레메트리에 저장되지 않으며 (정착본 §5), 90일 후 자동 삭제됩니다.',
  },
  en: {
    title: 'My usage',
    subtitle: 'Cube List usage trends (visible to you only)',
    loading: 'Loading…',
    errorTitle: 'Failed to load',
    stat28d: '28-day presses',
    statThisWeek: 'This week',
    statBoards: 'Active lists',
    statMount: 'Mount mode',
    statMountHint: 'This week',
    statWowLabel: 'WoW',
    weeklyTitle: 'Weekly trend (last 8 weeks)',
    weeklyEmpty: 'No presses yet. Try tapping a cube.',
    weeklyChartAria: 'Weekly press count bar chart',
    weeklySrCaption: 'Weekly press count (last 8 weeks)',
    srWeek: 'Week start',
    srCount: 'Press count',
    mountTitle: 'Mount-mode share (last 8 weeks)',
    mountBody: (total: number, mount: number) =>
      `${mount.toLocaleString()} of ${total.toLocaleString()} presses were in mount mode — higher when your phone is docked with the PC helper.`,
    actionTitle: 'Action type mix (last 8 weeks)',
    actionAria: 'Action type ratio',
    actionLink: 'Link',
    actionShortcut: 'Shortcut',
    actionMacro: 'Macro',
    topTitle: 'Most pressed cubes (last 28 days)',
    topEmpty: 'No statistics yet',
    privacy:
      'Telemetry stores anonymized press events only — no URLs, labels, or macro content (settled spec §5). Auto-deleted after 90 days.',
  },
  ja: {
    title: '使用状況',
    subtitle: 'キューブ・リストの利用推移 (本人のみ閲覧可)',
    loading: '読み込み中…',
    errorTitle: '読み込みに失敗しました',
    stat28d: '28日の押下',
    statThisWeek: '今週',
    statBoards: '使用リスト',
    statMount: '据え置きモード',
    statMountHint: '今週の比率',
    statWowLabel: '前週比',
    weeklyTitle: '週次推移 (直近 8 週間)',
    weeklyEmpty: 'まだ押下記録がありません。キューブを 1 度押してみてください。',
    weeklyChartAria: '週次押下回数の棒グラフ',
    weeklySrCaption: '週次押下回数 (直近 8 週間)',
    srWeek: '週の開始日',
    srCount: '押下回数',
    mountTitle: '据え置きモード使用比率 (直近 8 週間)',
    mountBody: (total: number, mount: number) =>
      `全押下 ${total.toLocaleString()} 回中、据え置きモード ${mount.toLocaleString()} 回。PC ヘルパーと連携してモバイルを据え置きしているときに高くなります。`,
    actionTitle: 'アクション種別分布 (直近 8 週間)',
    actionAria: 'アクション種別比率',
    actionLink: 'リンク',
    actionShortcut: 'ショートカット',
    actionMacro: 'マクロ',
    topTitle: 'よく押すキューブ (直近 28 日)',
    topEmpty: 'まだ統計はありません',
    privacy:
      'テレメトリは匿名化された押下イベントのみ保存します。URL · ラベル · マクロ内容は一切保存されません (確定仕様 §5)。90 日後に自動削除されます。',
  },
};

export default function InsightsPage() {
  const { weekly, topItems, totalPresses28d, loading, error } = useInsights();
  const { locale } = useTranslation();
  const c = INSIGHTS_COPY[locale] ?? INSIGHTS_COPY.ko;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/account"
        title={c.title}
        subtitle={c.subtitle}
        right={<LocaleSwitcher size="compact" />}
      />

      {loading && (
        <section className="px-4 py-12 flex items-center justify-center gap-2">
          <Spinner />
          <span className="text-sm text-ink-muted">{c.loading}</span>
        </section>
      )}

      {error && (
        <section
          role="alert"
          className="mx-4 my-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200"
        >
          <p className="font-medium text-sm">{c.errorTitle}</p>
          <p className="text-xs mt-1">{error}</p>
        </section>
      )}

      {!loading && !error && (
        <>
          <SummarySection totalPresses28d={totalPresses28d} weekly={weekly} c={c} />
          <MountModeSection weekly={weekly} c={c} />
          <WeeklyChartSection weekly={weekly} c={c} />
          <ActionTypeSection weekly={weekly} c={c} />
          <TopItemsSection items={topItems} c={c} />
          <PrivacyNote text={c.privacy} />
        </>
      )}
    </main>
  );
}

type InsightsCopy = typeof INSIGHTS_COPY.ko;

interface SummarySectionProps {
  totalPresses28d: number;
  weekly: WeeklyRow[];
  c: InsightsCopy;
}

function SummarySection({ totalPresses28d, weekly, c }: SummarySectionProps) {
  const thisWeek = weekly[weekly.length - 1];
  const lastWeek = weekly[weekly.length - 2];
  const wow = thisWeek && lastWeek
    ? Math.round(((thisWeek.press_count - lastWeek.press_count) / Math.max(lastWeek.press_count, 1)) * 100)
    : 0;
  const mountRatio = thisWeek && thisWeek.press_count > 0
    ? Math.round((thisWeek.mount_mode_count / thisWeek.press_count) * 100)
    : 0;

  return (
    <section className="px-4 py-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-border">
      <Stat label={c.stat28d} value={totalPresses28d.toLocaleString()} />
      <Stat
        label={c.statThisWeek}
        value={(thisWeek?.press_count ?? 0).toLocaleString()}
        hint={`${c.statWowLabel} ${wow >= 0 ? '+' : ''}${wow}%`}
      />
      <Stat label={c.statBoards} value={String(thisWeek?.boards_used ?? 0)} />
      <Stat label={c.statMount} value={`${mountRatio}%`} hint={c.statMountHint} />
    </section>
  );
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-[10px] text-ink-muted mt-0.5">{hint}</p>}
    </div>
  );
}

interface WeeklyChartProps {
  weekly: WeeklyRow[];
  c: InsightsCopy;
}

function WeeklyChartSection({ weekly, c }: WeeklyChartProps) {
  if (weekly.length === 0) {
    return (
      <section className="px-4 py-5 border-b border-border">
        <h2 className="text-sm font-semibold mb-3">{c.weeklyTitle}</h2>
        <p className="text-xs text-ink-muted text-center py-6">{c.weeklyEmpty}</p>
      </section>
    );
  }

  const max = Math.max(...weekly.map((w) => w.press_count), 1);

  return (
    <section className="px-4 py-5 border-b border-border">
      <h2 className="text-sm font-semibold mb-3">{c.weeklyTitle}</h2>
      <div
        className="flex items-end gap-1 h-32"
        role="img"
        aria-label={c.weeklyChartAria}
      >
        {weekly.map((w) => {
          const pct = (w.press_count / max) * 100;
          return (
            <div
              key={w.week_start}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${formatWeek(w.week_start)} · ${w.press_count}`}
            >
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-rbs-accent rounded-t-md transition-all"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-ink-muted">{formatWeekShort(w.week_start)}</span>
            </div>
          );
        })}
      </div>

      {/* 스크린리더용 fallback — 차트와 동일 데이터 */}
      <table className="cubelist-sr-only">
        <caption>{c.weeklySrCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{c.srWeek}</th>
            <th scope="col">{c.srCount}</th>
          </tr>
        </thead>
        <tbody>
          {weekly.map((w) => (
            <tr key={`sr-${w.week_start}`}>
              <th scope="row">{formatWeek(w.week_start)}</th>
              <td>{w.press_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MountModeSection({ weekly, c }: { weekly: WeeklyRow[]; c: InsightsCopy }) {
  const totals = weekly.reduce(
    (acc, w) => ({
      mount: acc.mount + w.mount_mode_count,
      total: acc.total + w.press_count,
    }),
    { mount: 0, total: 0 },
  );
  if (totals.total === 0) return null;

  const ratio = totals.mount / totals.total;
  const pct = Math.round(ratio * 100);

  // SVG ring — r=24, stroke=6, circumference=2πr ≈ 150.8
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <section className="px-4 py-5 border-b border-border flex items-center gap-4">
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          className="stroke-border dark:stroke-ink-muted/30"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          className="stroke-rbs-accent"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 32 32)"
        />
        <text
          x="32"
          y="36"
          textAnchor="middle"
          className="fill-ink text-[12px] font-mono"
        >
          {pct}%
        </text>
      </svg>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold mb-1">{c.mountTitle}</h2>
        <p className="text-xs text-ink-muted leading-relaxed">{c.mountBody(totals.total, totals.mount)}</p>
      </div>
    </section>
  );
}

function ActionTypeSection({ weekly, c }: { weekly: WeeklyRow[]; c: InsightsCopy }) {
  const totals = weekly.reduce(
    (acc, w) => ({
      link: acc.link + w.link_count,
      shortcut: acc.shortcut + w.shortcut_count,
      macro: acc.macro + w.macro_count,
    }),
    { link: 0, shortcut: 0, macro: 0 },
  );
  const total = totals.link + totals.shortcut + totals.macro;
  if (total === 0) return null;

  const bars = [
    { label: c.actionLink, count: totals.link, color: 'bg-rbs-accent' },
    { label: c.actionShortcut, count: totals.shortcut, color: 'bg-rbs-accent-strong' },
    { label: c.actionMacro, count: totals.macro, color: 'bg-yellow-500' },
  ];

  return (
    <section className="px-4 py-5 border-b border-border">
      <h2 className="text-sm font-semibold mb-3">{c.actionTitle}</h2>
      <div
        className="flex h-3 rounded-full overflow-hidden bg-surface-2"
        role="img"
        aria-label={c.actionAria}
      >
        {bars.map((b) => (
          <div
            key={b.label}
            className={`${b.color} h-full transition-all`}
            style={{ width: `${(b.count / total) * 100}%` }}
            title={`${b.label}: ${b.count} (${Math.round((b.count / total) * 100)}%)`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2 mt-3 text-xs">
        {bars.map((b) => (
          <li key={b.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${b.color}`} aria-hidden />
            <span className="text-ink-muted">{b.label}</span>
            <span className="ml-auto font-mono">{b.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface TopItemsSectionProps {
  items: Array<{ item_id: string; label: string; board_name: string; press_count: number }>;
  c: InsightsCopy;
}

function TopItemsSection({ items, c }: TopItemsSectionProps) {
  if (items.length === 0) {
    return (
      <section className="px-4 py-5 border-b border-border">
        <h2 className="text-sm font-semibold mb-3">{c.topTitle}</h2>
        <p className="text-xs text-ink-muted text-center py-6">{c.topEmpty}</p>
      </section>
    );
  }

  const max = Math.max(...items.map((i) => i.press_count), 1);

  return (
    <section className="px-4 py-5 border-b border-border">
      <h2 className="text-sm font-semibold mb-3">{c.topTitle}</h2>
      <ol className="flex flex-col gap-1.5">
        {items.map((it, idx) => (
          <li key={it.item_id} className="text-sm">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium truncate">
                <span className="text-xs text-ink-muted font-mono mr-2">#{idx + 1}</span>
                {it.label}
              </span>
              <span className="text-xs text-ink-muted font-mono">{it.press_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rbs-accent"
                  style={{ width: `${(it.press_count / max) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-ink-muted w-20 truncate">{it.board_name}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PrivacyNote({ text }: { text: string }) {
  return (
    <section className="px-4 py-6 text-[11px] text-ink-muted">
      <p>{text}</p>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────────────────────────────────────
function formatWeek(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function formatWeekShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
