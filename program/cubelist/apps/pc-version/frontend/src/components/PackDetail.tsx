/**
 * 큐브팩 상세 페이지 (v0.1.3 사전, 2026-05-31).
 *
 * MarketplaceCatalog 에서 큐브팩 카드 클릭 → 본 컴포넌트.
 * - 큐브팩 메타 (이름/작성자/가격/평점/태그/설명/변경 이력)
 * - 디바이스 그리드 mockup (device_hint 기반 자동)
 * - 설치 / 구매 버튼 (v0.1.4+ 활성)
 * - 카탈로그로 돌아가기
 */

import { useState } from 'react';
import { PLATFORMS, formatPrice } from '../types/marketplace';
import { MOCK_PACKS, deviceGrid, type MockPackPreviewCube } from '../lib/marketplace-mock';
import type { DeviceHint } from '../types/cube';
import { useTranslation } from '../lib/i18n/useTranslation';

interface PackDetailProps {
  readonly packId: string;
  readonly onBack: () => void;
}

export function PackDetail({ packId, onBack }: PackDetailProps) {
  const { t } = useTranslation();
  const pack = MOCK_PACKS.find((p) => p.id === packId);
  // v0.1.3: 디바이스 사이즈 토글 (Mini/Std/XL/Plus/Unlimited)
  const [deviceOverride, setDeviceOverride] = useState<DeviceHint | undefined>(undefined);

  if (!pack) {
    return (
      <div className="pack-detail">
        <button type="button" className="btn-ghost pack-back-btn" onClick={onBack}>
          {t('mp.back_to_catalog')}
        </button>
        <div className="muted" style={{ marginTop: 30, textAlign: 'center' }}>
          {t('mp.empty')}
        </div>
      </div>
    );
  }

  const effectiveHint = deviceOverride ?? pack.device_hint;
  const grid = deviceGrid(effectiveHint);
  const platformLabel = PLATFORMS.find((p) => p.value === pack.meta.platform)?.label ?? pack.meta.platform;
  const isFree = pack.meta.price_cents === 0;
  const isSubscription =
    pack.meta.payment_type === 'subscription_monthly' ||
    pack.meta.payment_type === 'subscription_yearly';

  function handleInstall(): void {
    // P1-B2 (2026-06-01): 무료 큐브팩 — download_url 있으면 즉시 외부 다운로드
    if (isFree) {
      if (pack && pack.download_url) {
        window.open(pack.download_url, '_blank', 'noopener,noreferrer');
        return;
      }
      window.alert(t('mp.install_free'));
      return;
    }
    // 유료 — 라이센스 키 prompt (v0.1.4 ed25519 검증) + 결제 후 download_url
    window.alert(t('mp.install_paid'));
    const key = window.prompt(t('mp.license_prompt'), '');
    if (key === null) return; // cancel
    // v0.1.3: 모든 키 무효 처리 (서버 검증 v0.1.4 활성)
    if (!key.startsWith('CL-') || key.length < 16) {
      window.alert(t('mp.license_invalid'));
      return;
    }
    window.alert(t('mp.license_invalid'));
  }

  return (
    <div className="pack-detail">
      <button type="button" className="btn-ghost pack-back-btn" onClick={onBack}>
        {t('mp.back_to_catalog')}
      </button>

      <div className="pack-detail-hero">
        <div className="pack-detail-cover pack-detail-cover-placeholder">
          {platformLabel.charAt(0).toUpperCase()}
        </div>
        <div className="pack-detail-info">
          <div className="pack-detail-platform">{platformLabel}</div>
          <h1 className="pack-detail-name">{pack.name}</h1>
          <div className="pack-detail-author">
            by <strong>{pack.meta.author.name}</strong>
            {pack.meta.version && <span className="muted"> · v{pack.meta.version}</span>}
          </div>
          {pack.meta.rating && (
            <div className="pack-detail-rating">
              {pack.meta.rating.avg.toFixed(1)}{' '}
              <span className="muted">({pack.meta.rating.count} {t('mp.reviews_suffix')})</span>
            </div>
          )}
          <div className="pack-detail-stats-row">
            <span className="pack-detail-stat">{pack.cube_count} {t('mp.cubes_suffix')}</span>
            <span className="pack-detail-stat">{pack.list_count} {t('mp.lists_suffix')}</span>
            <span className="pack-detail-stat">{grid.label}</span>
          </div>
          {pack.meta.tags && pack.meta.tags.length > 0 && (
            <div className="pack-detail-tags">
              {pack.meta.tags.map((tag) => (
                <span key={tag} className="mp-pack-tag">#{tag}</span>
              ))}
            </div>
          )}
          <div className="pack-detail-cta">
            <div className="pack-detail-price">
              {isFree ? (
                <span className="pack-detail-price-free">{t('mp.free')}</span>
              ) : (
                <>
                  <span className="pack-detail-price-num">{formatPrice(pack.meta.price_cents)}</span>
                  {isSubscription && (
                    <span className="pack-detail-price-period">
                      {pack.meta.payment_type === 'subscription_monthly' ? t('mp.per_month') : t('mp.per_year')}
                    </span>
                  )}
                </>
              )}
            </div>
            <button type="button" className="btn-primary pack-detail-install-btn" onClick={handleInstall}>
              {isFree ? t('mp.install') : `${t('mp.buy')} ${formatPrice(pack.meta.price_cents)}`}
            </button>
          </div>
        </div>
      </div>

      <section className="pack-detail-section">
        <h2 className="pack-detail-section-title">{t('mp.device_preview')}</h2>
        <div className="pack-device-toggle">
          <span className="pack-device-toggle-label">{t('mp.device_toggle')}</span>
          <DeviceToggleButton
            hint="streamdeck_mini"
            label={t('mp.device_mini')}
            current={effectiveHint}
            onSelect={setDeviceOverride}
          />
          <DeviceToggleButton
            hint="streamdeck_standard"
            label={t('mp.device_standard')}
            current={effectiveHint}
            onSelect={setDeviceOverride}
          />
          <DeviceToggleButton
            hint="streamdeck_xl"
            label={t('mp.device_xl')}
            current={effectiveHint}
            onSelect={setDeviceOverride}
          />
          <DeviceToggleButton
            hint="streamdeck_plus"
            label={t('mp.device_plus')}
            current={effectiveHint}
            onSelect={setDeviceOverride}
          />
          <DeviceToggleButton
            hint="cubelist_unlimited"
            label={t('mp.device_unlimited')}
            current={effectiveHint}
            onSelect={setDeviceOverride}
          />
        </div>
        <DevicePreview grid={grid} cubes={pack.preview_cubes} />
      </section>

      {pack.meta.long_description && (
        <section className="pack-detail-section">
          <h2 className="pack-detail-section-title">{t('mp.description')}</h2>
          <p className="pack-detail-description">{pack.meta.long_description}</p>
        </section>
      )}

      {pack.meta.changelog && (
        <section className="pack-detail-section">
          <h2 className="pack-detail-section-title">{t('mp.changelog')}</h2>
          <pre className="pack-detail-changelog">{pack.meta.changelog}</pre>
        </section>
      )}

      <section className="pack-detail-section">
        <h2 className="pack-detail-section-title">{t('mp.notice_title')}</h2>
        <div className="pack-detail-info-box">
          <p>
            <strong>현재는 mock 데이터입니다.</strong> v0.1.4 진입 시 실제 마켓플레이스 서버 + PayPal/Binance Pay 결제가 활성화됩니다.
          </p>
          <p>
            큐브팩 게시는 큐브 만들기 → 팩 정보 버튼에서 메타 입력 후 v0.1.4 진입 시 서버 업로드 가능합니다.
          </p>
        </div>
      </section>
    </div>
  );
}

interface DeviceToggleButtonProps {
  readonly hint: DeviceHint;
  readonly label: string;
  readonly current: DeviceHint | undefined;
  readonly onSelect: (hint: DeviceHint | undefined) => void;
}

function DeviceToggleButton({ hint, label, current, onSelect }: DeviceToggleButtonProps) {
  const isActive = current === hint;
  return (
    <button
      type="button"
      className={`pack-device-toggle-btn ${isActive ? 'is-active' : ''}`}
      onClick={() => onSelect(isActive ? undefined : hint)}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}

interface DevicePreviewProps {
  readonly grid: { cols: number; rows: number; label: string };
  readonly cubes: ReadonlyArray<MockPackPreviewCube>;
}

function DevicePreview({ grid, cubes }: DevicePreviewProps) {
  const totalSlots = grid.cols * grid.rows;
  return (
    <div
      className="device-preview"
      style={{ gridTemplateColumns: `repeat(${grid.cols}, 88px)` }}
    >
      {Array.from({ length: totalSlots }, (_, i) => {
        const cube = cubes[i];
        if (!cube) {
          return <div key={i} className="device-preview-slot device-preview-slot-empty" />;
        }
        const letter = cube.label.trim().charAt(0).toUpperCase();
        return (
          <div key={i} className="device-preview-slot" title={`${cube.label} (${cube.action_label ?? ''})`}>
            <div
              className="device-preview-icon"
              style={{ backgroundColor: cube.icon_color, color: '#fff' }}
            >
              {letter}
            </div>
            <div className="device-preview-label">{cube.label}</div>
          </div>
        );
      })}
    </div>
  );
}
