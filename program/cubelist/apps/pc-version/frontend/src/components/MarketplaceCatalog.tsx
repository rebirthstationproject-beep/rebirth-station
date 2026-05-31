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
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
