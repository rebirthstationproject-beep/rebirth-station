'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AppHeaderProps {
  /** 뒤로 가기 링크 (예: `/account`). 미지정 시 홈으로. */
  backHref?: string;
  /** 뒤로 가기 라벨 (기본: 자동 — backHref에서 추론) */
  backLabel?: string;
  /** 페이지 제목 (필수) */
  title: string;
  /** 부제·설명 (선택) */
  subtitle?: string;
  /** 우측 영역 (액션 버튼 등) */
  right?: ReactNode;
  /** 브랜드 prefix 숨김 (기본 false — `리버스 스테이션 ·` 표시) */
  hideBrand?: boolean;
}

/**
 * 표준 페이지 헤더.
 *
 * 정착본
 * - 정착본 §7: 첫 줄 12자 이하 (제목 길이 제한 권고)
 * - 브랜드 표기 영구 규칙: "리버스 스테이션 (Rebirth Station)"
 *
 * 사용 페이지: about / account / insights / plugins / marketplace/policy / pair / demo 등
 * 제외: home (special hero) / list (편집·거치 컨트롤 포함)
 */
export function AppHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  right,
  hideBrand = false,
}: AppHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="px-4 py-4 border-b border-border bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="text-xs text-ink-muted hover:text-rbs-accent"
            >
              ← {backLabel ?? autoBackLabel(backHref)}
            </Link>
          )}
          {!hideBrand && (
            <p className="text-xs text-rbs-accent-strong font-medium mt-1">
              {t('brand.company')}
            </p>
          )}
          <h1 className="text-xl font-bold mt-1">{title}</h1>
          {subtitle && (
            <p className="text-sm text-ink-muted mt-1">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}

function autoBackLabel(href: string): string {
  switch (href) {
    case '/':
      return '홈';
    case '/account':
      return '계정';
    case '/list':
      return '큐브 리스트';
    case '/plugins':
      return '플러그인';
    case '/about':
      return '브랜드 소개';
    default:
      return '뒤로';
  }
}
