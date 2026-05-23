'use client';

import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { useTranslation } from '@/lib/i18n/useTranslation';

type PolicyLocale = 'ko' | 'en' | 'ja';

const COPY: Record<
  PolicyLocale,
  {
    title: string;
    subtitle: string;
    feesHeading: string;
    colType: string;
    colDev: string;
    colPlatform: string;
    feeFree: string;
    feePaid: string;
    feeIndie: string;
    feeCollab: string;
    feesNote: string;
    formatsHeading: string;
    fmtCubeone: string;
    fmtCubelist: string;
    fmtCubepack: string;
    formatsSpecLink: string;
    licenseHeading: string;
    licenseFree: string;
    licensePersonal: string;
    licenseCommercial: string;
    licenseProprietary: string;
    reviewHeading: string;
    reviewBody1: string;
    reviewSpec: string;
    reviewBody2: string;
    footerNote: string;
  }
> = {
  ko: {
    title: '마켓플레이스 정책',
    subtitle: '큐브 리스트 마켓플레이스 — 수수료·라이선스',
    feesHeading: '수수료 (확정)',
    colType: '유형',
    colDev: '개발자 비율',
    colPlatform: '플랫폼 비율',
    feeFree: '무료 큐브 / 리스트',
    feePaid: '유료 큐브 / 리스트 (기본)',
    feeIndie: '인디 첫 1년 (가입 12개월 이내)',
    feeCollab: '자사 콜라보 (주소모아·케이링크·타이플 등)',
    feesNote:
      '앱스토어 IAP 수수료(15~30%)는 위 비율 적용 후 별도 차감됩니다. 본 정책은 Stage 4 결제 활성 시점부터 적용.',
    formatsHeading: '파일 형식',
    fmtCubeone: '단일 큐브 (PC 내부 관리·정리용, 외부 배포 X)',
    fmtCubelist: '리스트 한 장 (탭 1개). 마켓 기본 배포 단위',
    fmtCubepack: '리스트 묶음 (직군별·프리미엄 패키지)',
    formatsSpecLink: '파일 형식 명세',
    licenseHeading: '라이선스',
    licenseFree: '누구나 사용·재배포 가능. 출처 표시 권장',
    licensePersonal: '개인 사용만. 재배포·판매 금지',
    licenseCommercial: '개인·기업 사용 가능. 재배포 시 출처 표시 의무',
    licenseProprietary: '자사 콜라보 등 비공개. 외부 배포 금지',
    reviewHeading: '심사·삭제',
    reviewBody1: '마켓 등록 큐브는 자동 정적 분석을 통과해야 합니다 (',
    reviewSpec: '검증 절차',
    reviewBody2:
      '). 위험 키워드·외부 URL·서명 불일치 발견 시 자동 거부됩니다. 게재된 큐브가 사용자 신고로 이슈가 확인되면 즉시 비공개 처리 후 제작자에게 통지합니다.',
    footerNote: '본 정책은 Stage 진행에 따라 갱신될 수 있습니다. 최신본은 항상 본 페이지에서 확인.',
  },
  en: {
    title: 'Marketplace policy',
    subtitle: 'Cube List Marketplace — fees & licenses',
    feesHeading: 'Fees (fixed)',
    colType: 'Type',
    colDev: 'Developer share',
    colPlatform: 'Platform share',
    feeFree: 'Free cube / list',
    feePaid: 'Paid cube / list (default)',
    feeIndie: 'Indie · first year (within 12 months of signup)',
    feeCollab: 'In-house collab (Jusomoa · Keilink · ThaiPL …)',
    feesNote:
      'App store IAP fees (15–30%) are deducted separately after the split above. Policy applies from Stage 4 payment activation.',
    formatsHeading: 'File formats',
    fmtCubeone: 'A single cube (PC-side organization; not for redistribution)',
    fmtCubelist: 'One list (single tab). Default marketplace unit',
    fmtCubepack: 'Bundle of lists (persona / premium packs)',
    formatsSpecLink: 'File format spec',
    licenseHeading: 'Licenses',
    licenseFree: 'Anyone may use & redistribute. Attribution recommended.',
    licensePersonal: 'Personal use only. No redistribution or sale.',
    licenseCommercial: 'Individuals & companies may use. Attribution required on redistribution.',
    licenseProprietary: 'In-house collab and similar. No external redistribution.',
    reviewHeading: 'Review & removal',
    reviewBody1: 'Marketplace cubes must pass automatic static analysis (',
    reviewSpec: 'verification flow',
    reviewBody2:
      '). Dangerous keywords, external URLs, or signature mismatches are auto-rejected. Listed cubes are unpublished immediately upon a confirmed user report, and the author is notified.',
    footerNote: 'This policy may evolve with each Stage. The latest version always lives on this page.',
  },
  ja: {
    title: 'マーケットプレイス ポリシー',
    subtitle: 'キューブ・リスト マーケットプレイス — 手数料・ライセンス',
    feesHeading: '手数料 (確定)',
    colType: '区分',
    colDev: '開発者 比率',
    colPlatform: 'プラットフォーム 比率',
    feeFree: '無料キューブ / リスト',
    feePaid: '有料キューブ / リスト (基本)',
    feeIndie: 'インディー初年度 (登録 12 ヶ月以内)',
    feeCollab: '自社コラボ (Jusomoa · Keilink · ThaiPL ほか)',
    feesNote:
      'ストア IAP 手数料 (15–30%) は上記比率の適用後に別途差し引かれます。本ポリシーは Stage 4 決済稼働時から適用。',
    formatsHeading: 'ファイル形式',
    fmtCubeone: '単一キューブ (PC 内整理用、外部配布不可)',
    fmtCubelist: 'リスト 1 枚 (タブ 1 つ)。マーケット基本配布単位',
    fmtCubepack: 'リスト束 (職種別・プレミアム パッケージ)',
    formatsSpecLink: 'ファイル形式仕様',
    licenseHeading: 'ライセンス',
    licenseFree: '誰でも使用・再配布可能。出典表示推奨。',
    licensePersonal: '個人使用のみ。再配布・販売不可。',
    licenseCommercial: '個人・企業利用可能。再配布時は出典表示必須。',
    licenseProprietary: '自社コラボなど非公開。外部配布禁止。',
    reviewHeading: '審査・削除',
    reviewBody1: 'マーケット登録キューブは自動静的解析を通過する必要があります (',
    reviewSpec: '検証フロー',
    reviewBody2:
      ')。危険キーワード・外部 URL・署名不一致は自動拒否されます。掲載キューブはユーザー報告で問題が確認され次第、非公開処理し制作者へ通知します。',
    footerNote: '本ポリシーは Stage に応じて更新されます。最新版は常に本ページで確認できます。',
  },
};

export default function MarketplacePolicyPage() {
  const { locale } = useTranslation();
  const c = COPY[locale as PolicyLocale] ?? COPY.ko;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <AppHeader backHref="/" title={c.title} subtitle={c.subtitle} />

      <section className="px-6 py-8 max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">{c.feesHeading}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-ink-muted">
              <th className="text-left py-2 font-medium">{c.colType}</th>
              <th className="text-right py-2 font-medium">{c.colDev}</th>
              <th className="text-right py-2 font-medium">{c.colPlatform}</th>
            </tr>
          </thead>
          <tbody>
            <Row label={c.feeFree} dev="—" platform="0%" />
            <Row label={c.feePaid} dev="70%" platform="30%" />
            <Row label={c.feeIndie} dev="85%" platform="15%" highlight />
            <Row label={c.feeCollab} dev="100%" platform="—" />
          </tbody>
        </table>
        <p className="text-xs text-ink-muted mt-3">{c.feesNote}</p>
      </section>

      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-border">
        <h2 className="text-lg font-semibold mb-4">{c.formatsHeading}</h2>
        <ul className="text-sm flex flex-col gap-2">
          <li>
            <code className="font-mono text-rbs-accent-strong">.cubeone</code> — {c.fmtCubeone}
          </li>
          <li>
            <code className="font-mono text-rbs-accent-strong">.cubelist</code> — {c.fmtCubelist}
          </li>
          <li>
            <code className="font-mono text-rbs-accent-strong">.cubepack</code> — {c.fmtCubepack}
          </li>
        </ul>
        <p className="text-xs text-ink-muted mt-3">
          <Link href="/docs/file-format-spec.md" className="text-rbs-accent underline">
            {c.formatsSpecLink}
          </Link>
        </p>
      </section>

      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-border">
        <h2 className="text-lg font-semibold mb-4">{c.licenseHeading}</h2>
        <dl className="text-sm flex flex-col gap-3">
          <Item dt="free" dd={c.licenseFree} />
          <Item dt="personal" dd={c.licensePersonal} />
          <Item dt="commercial" dd={c.licenseCommercial} />
          <Item dt="proprietary" dd={c.licenseProprietary} />
        </dl>
      </section>

      <section className="px-6 py-8 max-w-3xl mx-auto border-t border-border">
        <h2 className="text-lg font-semibold mb-4">{c.reviewHeading}</h2>
        <p className="text-sm text-ink leading-relaxed">
          {c.reviewBody1}
          <Link href="/docs/file-format-spec.md" className="text-rbs-accent underline">
            {c.reviewSpec}
          </Link>
          {c.reviewBody2}
        </p>
      </section>

      <footer className="px-6 py-6 text-xs text-ink-muted text-center border-t border-border">
        {c.footerNote}
      </footer>
    </main>
  );
}

interface RowProps {
  label: string;
  dev: string;
  platform: string;
  highlight?: boolean;
}

function Row({ label, dev, platform, highlight }: RowProps) {
  return (
    <tr className={highlight ? 'bg-rbs-accent-soft/40' : ''}>
      <td className="py-2">{label}</td>
      <td className="py-2 text-right font-mono">{dev}</td>
      <td className="py-2 text-right font-mono">{platform}</td>
    </tr>
  );
}

interface ItemProps {
  dt: string;
  dd: string;
}

function Item({ dt, dd }: ItemProps) {
  return (
    <div className="flex flex-col">
      <dt className="font-mono text-rbs-accent-strong">{dt}</dt>
      <dd className="text-ink-muted">{dd}</dd>
    </div>
  );
}
