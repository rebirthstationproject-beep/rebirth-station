/**
 * 마켓플레이스 카탈로그 mockup (v0.1.3 사전, 2026-05-31).
 *
 * 실 서버 API 는 v0.1.3 진입 시 활성. 현재 mock 큐브팩 카드 + 필터 + 정렬.
 * 큐브팩 카드 클릭 → PackDetail 로 전환.
 */

import { useMemo, useState } from 'react';
import {
  PLATFORMS,
  formatPrice,
  type MarketplaceMeta,
  type Platform,
} from '../types/marketplace';
import type { DeviceHint } from '../types/cube';

interface MockPack {
  readonly id: string;
  readonly name: string;
  readonly meta: MarketplaceMeta;
  readonly cube_count: number;
  readonly list_count: number;
  readonly device_hint?: DeviceHint;
}

// v0.1.3 진입 시 실 서버 fetch. 현재 mock.
const MOCK_PACKS: ReadonlyArray<MockPack> = [
  {
    id: 'pack-obs-streamer',
    name: 'OBS Streamer Essentials',
    meta: {
      platform: 'obs',
      price_cents: 0,
      author: { name: 'Rebirth Station' },
      version: '1.0.0',
      tags: ['streaming', 'obs', 'productivity'],
      rating: { avg: 4.8, count: 142 },
      long_description: 'OBS Studio 스트리밍 필수 큐브 32개.',
    },
    cube_count: 32,
    list_count: 4,
    device_hint: 'streamdeck_xl',
  },
  {
    id: 'pack-vscode-dev',
    name: 'VS Code Power Dev',
    meta: {
      platform: 'vscode',
      price_cents: 999,
      author: { name: 'DevTools Inc.' },
      version: '0.3.2',
      tags: ['development', 'shortcuts', 'git'],
      rating: { avg: 4.6, count: 89 },
      payment_type: 'one_time',
      long_description: 'VS Code 단축키 + Git 명령 60+ 큐브.',
    },
    cube_count: 62,
    list_count: 6,
    device_hint: 'streamdeck_xl',
  },
  {
    id: 'pack-figma-design',
    name: 'Figma Designer Kit',
    meta: {
      platform: 'figma',
      price_cents: 1499,
      author: { name: 'DesignFlow' },
      version: '2.1.0',
      tags: ['design', 'figma', 'ui-ux'],
      rating: { avg: 4.9, count: 256 },
      payment_type: 'one_time',
      long_description: 'Figma 작업 가속화 큐브팩.',
    },
    cube_count: 48,
    list_count: 5,
    device_hint: 'streamdeck_plus',
  },
  {
    id: 'pack-discord-mod',
    name: 'Discord Moderator',
    meta: {
      platform: 'discord',
      price_cents: 0,
      author: { name: 'Community Mods' },
      version: '1.2.0',
      tags: ['discord', 'moderation', 'community'],
      rating: { avg: 4.4, count: 67 },
      long_description: 'Discord 서버 운영 단축키 모음.',
    },
    cube_count: 24,
    list_count: 3,
    device_hint: 'streamdeck_standard',
  },
  {
    id: 'pack-photoshop-retouch',
    name: 'Photoshop Retoucher Pro',
    meta: {
      platform: 'photoshop',
      price_cents: 2499,
      author: { name: 'RetouchMaster' },
      version: '3.0.1',
      tags: ['photoshop', 'retouch', 'adobe'],
      rating: { avg: 4.7, count: 178 },
      payment_type: 'one_time',
      long_description: '리터칭 전문가용 단축키 + 액션 큐브.',
    },
    cube_count: 80,
    list_count: 8,
    device_hint: 'streamdeck_xl',
  },
  {
    id: 'pack-twitch-streamer',
    name: 'Twitch Streamer All-in-One',
    meta: {
      platform: 'twitch',
      price_cents: 499,
      author: { name: 'StreamPro' },
      version: '1.5.0',
      tags: ['twitch', 'streaming', 'live'],
      rating: { avg: 4.5, count: 113 },
      payment_type: 'subscription_monthly',
      long_description: '트위치 스트리밍 통합 큐브팩 (월간 구독).',
    },
    cube_count: 56,
    list_count: 7,
    device_hint: 'streamdeck_plus',
  },
];

type SortBy = 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';

interface MarketplaceCatalogProps {
  readonly onPackClick?: (packId: string) => void;
}

export function MarketplaceCatalog({ onPackClick }: MarketplaceCatalogProps) {
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
          <h2>🏪 큐브팩 마켓플레이스</h2>
          <span className="muted small">v0.1.3 진입 시 활성 (현재 mock 데이터)</span>
        </div>
        <input
          type="search"
          className="mp-catalog-search"
          placeholder="🔍 큐브팩·작성자·태그 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="mp-catalog-filters">
        <div className="mp-filter-group">
          <label>플랫폼:</label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
          >
            <option value="all">전체</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mp-filter-group">
          <label>가격:</label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as 'all' | 'free' | 'paid')}
          >
            <option value="all">전체</option>
            <option value="free">무료만</option>
            <option value="paid">유료만</option>
          </select>
        </div>
        <div className="mp-filter-group">
          <label>정렬:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="popular">인기 (리뷰 수)</option>
            <option value="rating">평점 높은 순</option>
            <option value="price_low">가격 낮은 순</option>
            <option value="price_high">가격 높은 순</option>
            <option value="newest">최신</option>
          </select>
        </div>
        <div className="mp-filter-count">{filtered.length} 큐브팩</div>
      </div>

      <div className="mp-pack-grid">
        {filtered.length === 0 ? (
          <div className="mp-empty">검색 결과 없음</div>
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
