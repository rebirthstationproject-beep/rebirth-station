/**
 * 큐브팩 상세 페이지 (v0.1.3 사전, 2026-05-31).
 *
 * MarketplaceCatalog 에서 큐브팩 카드 클릭 → 본 컴포넌트.
 * - 큐브팩 메타 (이름/작성자/가격/평점/태그/설명/변경 이력)
 * - 디바이스 그리드 mockup (device_hint 기반 자동)
 * - 설치 / 구매 버튼 (v0.1.4+ 활성)
 * - 카탈로그로 돌아가기
 */

import { PLATFORMS, formatPrice } from '../types/marketplace';
import { MOCK_PACKS, deviceGrid, type MockPackPreviewCube } from '../lib/marketplace-mock';

interface PackDetailProps {
  readonly packId: string;
  readonly onBack: () => void;
}

export function PackDetail({ packId, onBack }: PackDetailProps) {
  const pack = MOCK_PACKS.find((p) => p.id === packId);

  if (!pack) {
    return (
      <div className="pack-detail">
        <button type="button" className="btn-ghost pack-back-btn" onClick={onBack}>
          ← 카탈로그로
        </button>
        <div className="muted" style={{ marginTop: 30, textAlign: 'center' }}>
          큐브팩을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const grid = deviceGrid(pack.device_hint);
  const platformLabel = PLATFORMS.find((p) => p.value === pack.meta.platform)?.label ?? pack.meta.platform;
  const isFree = pack.meta.price_cents === 0;
  const isSubscription =
    pack.meta.payment_type === 'subscription_monthly' ||
    pack.meta.payment_type === 'subscription_yearly';

  function handleInstall(): void {
    window.alert(
      `v0.1.4 에서 활성 — 현재는 mock.\n\n${isFree ? '설치' : `${formatPrice(pack!.meta.price_cents)} 결제 (PayPal / Binance Pay)`} 후 라이브러리에 추가됩니다.`,
    );
  }

  return (
    <div className="pack-detail">
      <button type="button" className="btn-ghost pack-back-btn" onClick={onBack}>
        ← 카탈로그로
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
              ★ {pack.meta.rating.avg.toFixed(1)}{' '}
              <span className="muted">({pack.meta.rating.count} 리뷰)</span>
            </div>
          )}
          <div className="pack-detail-stats-row">
            <span className="pack-detail-stat">{pack.cube_count} 큐브</span>
            <span className="pack-detail-stat">{pack.list_count} 리스트</span>
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
                <span className="pack-detail-price-free">무료</span>
              ) : (
                <>
                  <span className="pack-detail-price-num">{formatPrice(pack.meta.price_cents)}</span>
                  {isSubscription && (
                    <span className="pack-detail-price-period">
                      {pack.meta.payment_type === 'subscription_monthly' ? ' / 월' : ' / 년'}
                    </span>
                  )}
                </>
              )}
            </div>
            <button type="button" className="btn-primary pack-detail-install-btn" onClick={handleInstall}>
              {isFree ? '⬇ 설치' : `💳 ${formatPrice(pack.meta.price_cents)} 구매`}
            </button>
          </div>
        </div>
      </div>

      <section className="pack-detail-section">
        <h2 className="pack-detail-section-title">📱 디바이스 미리보기</h2>
        <DevicePreview grid={grid} cubes={pack.preview_cubes} />
      </section>

      {pack.meta.long_description && (
        <section className="pack-detail-section">
          <h2 className="pack-detail-section-title">📄 설명</h2>
          <p className="pack-detail-description">{pack.meta.long_description}</p>
        </section>
      )}

      {pack.meta.changelog && (
        <section className="pack-detail-section">
          <h2 className="pack-detail-section-title">📋 변경 이력</h2>
          <pre className="pack-detail-changelog">{pack.meta.changelog}</pre>
        </section>
      )}

      <section className="pack-detail-section">
        <h2 className="pack-detail-section-title">⚠ v0.1.3 사전 안내</h2>
        <div className="pack-detail-info-box">
          <p>
            <strong>현재는 mock 데이터입니다.</strong> v0.1.4 진입 시 실제 마켓플레이스 서버 + PayPal/Binance Pay 결제가 활성화됩니다.
          </p>
          <p>
            큐브팩 게시는 큐브 만들기 → 🏪 팩 정보 버튼에서 메타 입력 후 v0.1.4 진입 시 서버 업로드 가능합니다.
          </p>
        </div>
      </section>
    </div>
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
