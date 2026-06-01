/**
 * 마켓플레이스 카탈로그 mockup (v0.1.3 사전, 2026-05-31).
 *
 * 실 서버 API 는 v0.1.4 진입 시 활성. 현재 lib/marketplace-mock.ts 데이터 사용.
 * 큐브팩 카드 클릭 → PackDetail 로 전환 (onPackClick 콜백).
 */

import { useMemo, useState } from 'react';
import { PLATFORMS, formatPrice, type Platform } from '../types/marketplace';
import { MOCK_PACKS } from '../lib/marketplace-mock';
import { useTranslation } from '../lib/i18n/useTranslation';

type SortBy = 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';

interface MarketplaceCatalogProps {
  readonly onPackClick?: (packId: string) => void;
}

export function MarketplaceCatalog({ onPackClick }: MarketplaceCatalogProps) {
  const { t } = useTranslation();
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return MOCK_PACKS.filter((pack) => {
      if (platformFilter !== 'all' && pack.meta.platform !== platformFilter) return false;
      if (priceFilter === 'free' && pack.meta.price_cents > 0) return false;
      if (priceFilter === 'paid' && pack.meta.price_cents === 0) return false;
      if (search.length > 0) {
        const haystack = [
          pack.name,
          pack.meta.author.name,
          ...(pack.meta.tags ?? []),
          pack.meta.long_description ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.meta.rating?.count ?? 0) - (a.meta.rating?.count ?? 0);
        case 'rating':
          return (b.meta.rating?.avg ?? 0) - (a.meta.rating?.avg ?? 0);
        case 'price_low':
          return a.meta.price_cents - b.meta.price_cents;
        case 'price_high':
          return b.meta.price_cents - a.meta.price_cents;
        case 'newest':
        default:
          return 0;
      }
    });
  }, [platformFilter, priceFilter, sortBy, searchText]);

  return (
    <div className="marketplace-catalog">
      <div className="mp-catalog-header">
        <div className="mp-catalog-title">
          <h2>{t('mp.title')}</h2>
          <span className="muted small">{t('mp.subtitle')}</span>
        </div>
        <input
          type="search"
          className="mp-catalog-search"
          placeholder={t('mp.search_placeholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* P1-B2 확장 (2026-06-01): Rebirth Station 공식 큐브리스트 테스트 섹션
          좌측 아이콘+설명 / 우측 Download 버튼. 1 카드만 시안 (사이트 셋업 후 활성). */}
      <OfficialCubelistSection />

      <div className="mp-catalog-filters">
        <div className="mp-filter-group">
          <label>{t('mp.filter_platform')}</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
          >
            <option value="all">{t('mp.all')}</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mp-filter-group">
          <label>{t('mp.filter_price')}</label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as 'all' | 'free' | 'paid')}
          >
            <option value="all">{t('mp.all')}</option>
            <option value="free">{t('mp.free_only')}</option>
            <option value="paid">{t('mp.paid_only')}</option>
          </select>
        </div>
        <div className="mp-filter-group">
          <label>{t('mp.filter_sort')}</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="popular">{t('mp.sort_popular')}</option>
            <option value="rating">{t('mp.sort_rating')}</option>
            <option value="price_low">{t('mp.sort_price_low')}</option>
            <option value="price_high">{t('mp.sort_price_high')}</option>
            <option value="newest">{t('mp.sort_newest')}</option>
          </select>
        </div>
        <div className="mp-filter-count">{filtered.length} {t('mp.count_suffix')}</div>
      </div>

      <div className="mp-pack-grid">
        {filtered.length === 0 ? (
          <div className="mp-empty">{t('mp.empty')}</div>
        ) : (
          filtered.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className="mp-pack-card"
              onClick={() => onPackClick?.(pack.id)}
            >
              {pack.meta.cover_url ? (
                <div
                  className="mp-pack-cover"
                  style={{ backgroundImage: `url("${pack.meta.cover_url}")` }}
                />
              ) : (
                <div className="mp-pack-cover mp-pack-cover-placeholder">
                  {PLATFORMS.find((p) => p.value === pack.meta.platform)?.label
                    .charAt(0)
                    .toUpperCase() ?? '?'}
                </div>
              )}
              <div className="mp-pack-info">
                <div className="mp-pack-name">{pack.name}</div>
                <div className="mp-pack-author">{pack.meta.author.name}</div>
                <div className="mp-pack-meta">
                  <span className="mp-pack-price">{formatPrice(pack.meta.price_cents)}</span>
                  {pack.meta.rating && (
                    <span className="mp-pack-rating">
                      ★ {pack.meta.rating.avg.toFixed(1)} ({pack.meta.rating.count})
                    </span>
                  )}
                </div>
                <div className="mp-pack-stats">
                  {pack.cube_count} 큐브 · {pack.list_count} 리스트
                </div>
                {pack.meta.tags && pack.meta.tags.length > 0 && (
                  <div className="mp-pack-tags">
                    {pack.meta.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="mp-pack-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* P1-B2 (2026-06-01): 카드 즉시 Download / Buy 버튼 — PackDetail 진입 없이 1클릭 */}
                {pack.download_url && (
                  <div className="mp-pack-cta" style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    {pack.meta.price_cents === 0 ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pack.download_url) {
                            window.open(pack.download_url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
                        title="다운로드 페이지로 이동"
                      >
                        📥 Download
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPackClick?.(pack.id);
                        }}
                        style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
                        title="결제 후 다운로드 (v0.1.4)"
                      >
                        🛒 Buy {formatPrice(pack.meta.price_cents)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Rebirth Station 공식 큐브리스트 섹션 (P1-B2 확장, 2026-06-01).
 *
 * 테스트 1 카드만 시안 — 좌측 아이콘 + 간략 설명 / 우측 Download 버튼.
 * 실제 카드 / 사이트 다운로드 페이지는 이후 정리 작업.
 *
 * 사용자 명시:
 * "왼쪽에 큐브리스트 아이콘 + 간략 설명 들어가고 오른쪽에 다운로드 버튼.
 *  실질적으로 아이콘 + 설명 + 다운로드 작동 URL 만 들어가도록 하면 되는 부분.
 *  구성만 만들어서 한개 테스트로만 만들어 놓으면 될거 같아."
 */
interface OfficialCubelistEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly iconUrl: string | null;
  readonly downloadUrl: string;
  readonly cubeCount: number;
  readonly listCount: number;
}

const OFFICIAL_CUBELISTS: ReadonlyArray<OfficialCubelistEntry> = [
  {
    id: 'rbs-demo-essentials',
    name: 'Rebirth Station Demo Essentials',
    description: '기본 큐브 + 자주 쓰는 단축키 + 링크 큐브 모음. 큐브 리스트 첫 사용자용 데모 큐브팩.',
    iconUrl: null, // placeholder — 추후 cover 이미지 URL
    downloadUrl: 'https://rebirthstation.com/cubelist/download/demo',
    cubeCount: 10,
    listCount: 2,
  },
];

function OfficialCubelistSection() {
  if (OFFICIAL_CUBELISTS.length === 0) return null;
  return (
    <section
      className="official-cubelist-section"
      style={{
        marginBottom: 24,
        padding: '16px 18px',
        border: '1px solid var(--color-border, #333)',
        borderRadius: 8,
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          margin: 0,
          marginBottom: 4,
          letterSpacing: '0.02em',
        }}
      >
        🌟 Rebirth Station 공식 큐브리스트
      </h3>
      <p
        style={{
          fontSize: 11,
          margin: 0,
          marginBottom: 12,
          opacity: 0.65,
        }}
      >
        직접 호스팅하는 다운로드 가능 큐브리스트. 사이트 셋업 후 활성.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OFFICIAL_CUBELISTS.map((entry) => (
          <DownloadRow key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

interface DownloadRowProps {
  readonly entry: OfficialCubelistEntry;
}

function DownloadRow({ entry }: DownloadRowProps) {
  function handleDownload(): void {
    window.open(entry.downloadUrl, '_blank', 'noopener,noreferrer');
  }

  const firstLetter = entry.name.trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--color-border, #333)',
        borderRadius: 6,
      }}
    >
      {/* 좌측 아이콘 */}
      <div
        style={{
          width: 56,
          height: 56,
          flexShrink: 0,
          background: entry.iconUrl
            ? `url("${entry.iconUrl}") center/cover`
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: '#fff',
        }}
        aria-hidden
      >
        {!entry.iconUrl && firstLetter}
      </div>

      {/* 가운데 이름 + 설명 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{entry.name}</div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.7,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {entry.description}
        </div>
        <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
          {entry.cubeCount} 큐브 · {entry.listCount} 리스트
        </div>
      </div>

      {/* 우측 다운로드 버튼 */}
      <button
        type="button"
        className="btn-primary"
        onClick={handleDownload}
        style={{
          flexShrink: 0,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        title={`다운로드: ${entry.downloadUrl}`}
      >
        📥 Download
      </button>
    </div>
  );
}
