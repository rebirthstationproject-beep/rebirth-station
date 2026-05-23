'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useToast } from '@/lib/toast/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';

type CopyKey =
  | 'title'
  | 'subtitle'
  | 'deletionTargets'
  | 'retainedItems'
  | 'paymentRefund'
  | 'paymentBody'
  | 'acknowledge'
  | 'requestButton'
  | 'requestedStatus'
  | 'logoutHint'
  | 'stageNote'
  | 'item_boards'
  | 'item_plugins'
  | 'item_devices'
  | 'item_telemetry'
  | 'retain_packs'
  | 'retain_receipts'
  | 'retain_legal'
  | 'storeApple'
  | 'storeGoogle';

const COPY: Record<'ko' | 'en' | 'ja', Record<CopyKey, string>> = {
  ko: {
    title: '계정·데이터 영구 삭제',
    subtitle: '데이터는 즉시 복구할 수 없습니다.',
    deletionTargets: '삭제 대상',
    retainedItems: '유지되는 항목',
    paymentRefund: '결제·환불',
    paymentBody:
      '큐브 리스트 Pro는 IAP(Apple App Store · Google Play)로만 결제됩니다. 환불은 각 스토어 정책을 따르며, 본 페이지에서 직접 처리되지 않습니다.',
    acknowledge: '위 내용을 모두 확인했으며, 삭제 후 복구가 불가능함을 이해합니다.',
    requestButton: '영구 삭제 요청 보내기',
    requestedStatus: '요청이 접수되었습니다. 영업일 7일 이내 안내 메일을 보내드립니다.',
    logoutHint: '계정 잠금이 필요하면 계정 페이지에서 즉시 로그아웃하세요.',
    stageNote:
      'Stage 1 운영 기간 동안 실 cascade 삭제는 운영팀이 직접 수동 검토 후 일괄 처리합니다. Stage 4 진입 이후 셀프 서비스로 즉시 처리될 예정입니다.',
    item_boards: '큐브 리스트 보드·큐브·매크로 전체 (mylist_boards / mylist_items)',
    item_plugins: '플러그인 설치 이력 (mylist_plugin_installs)',
    item_devices: '페어링된 기기 (user_devices)',
    item_telemetry: '사용량 텔레메트리 (90일 자동 삭제와 별개)',
    retain_packs: '이미 발행한 큐브팩 (.cubepack) 파일 — 본인 기기 또는 외부에 보관된 사본',
    retain_receipts: '스토어 결제 영수증 — Apple App Store / Google Play 정책에 따름',
    retain_legal: '법적 의무에 의한 회계 기록 (해당 시)',
    storeApple: 'Apple',
    storeGoogle: 'Google Play',
  },
  en: {
    title: 'Permanent account & data deletion',
    subtitle: 'Data cannot be recovered.',
    deletionTargets: 'What gets deleted',
    retainedItems: 'What is retained',
    paymentRefund: 'Payments & refunds',
    paymentBody:
      'Cube List Pro is purchased only via IAP (Apple App Store · Google Play). Refunds follow each store policy and are not processed here.',
    acknowledge: 'I have read everything above and understand recovery is not possible.',
    requestButton: 'Submit permanent deletion request',
    requestedStatus: 'Request received. Our team will follow up within 7 business days.',
    logoutHint: 'To lock the account immediately, sign out from the account page.',
    stageNote:
      'During Stage 1, the cascade deletion is processed manually by ops after review. Self-serve immediate deletion lands after Stage 4.',
    item_boards: 'All Cube List boards · cubes · macros (mylist_boards / mylist_items)',
    item_plugins: 'Plugin install history (mylist_plugin_installs)',
    item_devices: 'Paired devices (user_devices)',
    item_telemetry: 'Usage telemetry (separate from 90-day auto-deletion)',
    retain_packs: 'Already-exported .cubepack files held on your device or shared elsewhere',
    retain_receipts: 'Store receipts — follow Apple App Store / Google Play policy',
    retain_legal: 'Accounting records required by law (where applicable)',
    storeApple: 'Apple',
    storeGoogle: 'Google Play',
  },
  ja: {
    title: 'アカウント・データの完全削除',
    subtitle: 'データはすぐに復元できません。',
    deletionTargets: '削除される項目',
    retainedItems: '保持される項目',
    paymentRefund: '支払い・返金',
    paymentBody:
      'キューブ・リスト Pro は IAP (Apple App Store · Google Play) でのみ購入されます。返金は各ストアのポリシーに従い、本ページでは直接処理されません。',
    acknowledge: '上記内容を確認し、削除後の復元ができないことを理解しました。',
    requestButton: '完全削除をリクエスト',
    requestedStatus: 'リクエストを受け付けました。営業日7日以内にご案内メールをお送りします。',
    logoutHint: 'アカウントを即時ロックするには、アカウントページからログアウトしてください。',
    stageNote:
      'Stage 1 運営期間中は、cascade 削除は運営チームによる手動レビュー後に一括処理されます。Stage 4 以降はセルフサービスで即時処理されます。',
    item_boards: 'キューブ・リスト ボード・キューブ・マクロ全体 (mylist_boards / mylist_items)',
    item_plugins: 'プラグイン インストール履歴 (mylist_plugin_installs)',
    item_devices: 'ペアリング済みデバイス (user_devices)',
    item_telemetry: '使用量テレメトリ (90日自動削除とは別)',
    retain_packs: '既に発行されたキューブパック (.cubepack) — お手元のデバイスまたは外部の控え',
    retain_receipts: 'ストア決済の領収書 — Apple App Store / Google Play のポリシーに従う',
    retain_legal: '法的義務に基づく会計記録 (該当する場合)',
    storeApple: 'Apple',
    storeGoogle: 'Google Play',
  },
};

export default function AccountDeletePage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const t = COPY[locale] ?? COPY.ko;

  function handleRequest(): void {
    if (!acknowledged) return;
    setSubmitted(true);
    showToast({ level: 'info', message: t.requestedStatus, duration: 6_000 });
  }

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader
        backHref="/account"
        title={t.title}
        subtitle={t.subtitle}
        right={<LocaleSwitcher size="compact" />}
      />

      <section className="px-4 py-5 border-b border-border">
        <h2 className="text-sm font-semibold mb-2">{t.deletionTargets}</h2>
        <ul className="text-xs text-ink-muted list-disc pl-5 flex flex-col gap-1">
          <li>{t.item_boards}</li>
          <li>{t.item_plugins}</li>
          <li>{t.item_devices}</li>
          <li>{t.item_telemetry}</li>
        </ul>
      </section>

      <section className="px-4 py-5 border-b border-border">
        <h2 className="text-sm font-semibold mb-2">{t.retainedItems}</h2>
        <ul className="text-xs text-ink-muted list-disc pl-5 flex flex-col gap-1">
          <li>{t.retain_packs}</li>
          <li>{t.retain_receipts}</li>
          <li>{t.retain_legal}</li>
        </ul>
      </section>

      <section className="px-4 py-5 border-b border-border">
        <h2 className="text-sm font-semibold mb-2">{t.paymentRefund}</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {t.paymentBody}{' '}
          <a
            href="https://support.apple.com/HT204084"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rbs-accent underline inline-flex items-center gap-0.5"
            aria-label={`${t.storeApple} (새 탭에서 열림)`}
          >
            {t.storeApple}
            <span aria-hidden className="text-[9px]">↗</span>
          </a>
          {' · '}
          <a
            href="https://support.google.com/googleplay/answer/2479637"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rbs-accent underline inline-flex items-center gap-0.5"
            aria-label={`${t.storeGoogle} (새 탭에서 열림)`}
          >
            {t.storeGoogle}
            <span aria-hidden className="text-[9px]">↗</span>
          </a>
        </p>
      </section>

      <section className="px-4 py-5 border-b border-border">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            disabled={submitted}
            className="mt-0.5"
          />
          <span className="text-xs text-ink">{t.acknowledge}</span>
        </label>
      </section>

      <section className="px-4 py-5">
        {submitted ? (
          <div
            role="status"
            className="rounded-lg p-3 text-sm bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200 border border-green-200 dark:border-green-800"
          >
            {t.requestedStatus}{' '}
            <Link href="/account" className="underline">
              {t.logoutHint}
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRequest}
            disabled={!acknowledged}
            className="w-full px-4 py-3 rounded-xl bg-red-600 text-white font-medium disabled:opacity-40"
          >
            {t.requestButton}
          </button>
        )}
        <p className="text-[10px] text-ink-muted mt-3">{t.stageNote}</p>
      </section>
    </main>
  );
}
