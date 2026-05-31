/**
 * 마켓플레이스 메타 타입 (v0.1.3 사전 작업, 2026-05-31).
 *
 * 영구 lock: CubePack.extensions.marketplace 에 보관.
 * spec: docs/specs/marketplace-preview-v1.md
 */

import type { DeviceHint } from './cube';

export type Platform =
  | 'figma'
  | 'obs'
  | 'vscode'
  | 'photoshop'
  | 'illustrator'
  | 'premiere'
  | 'after_effects'
  | 'davinci'
  | 'blender'
  | 'unity'
  | 'unreal'
  | 'twitch'
  | 'discord'
  | 'spotify'
  | 'youtube'
  | 'other';

export const PLATFORMS: ReadonlyArray<{ value: Platform; label: string }> = [
  { value: 'figma', label: 'Figma' },
  { value: 'obs', label: 'OBS Studio' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'photoshop', label: 'Adobe Photoshop' },
  { value: 'illustrator', label: 'Adobe Illustrator' },
  { value: 'premiere', label: 'Adobe Premiere' },
  { value: 'after_effects', label: 'Adobe After Effects' },
  { value: 'davinci', label: 'DaVinci Resolve' },
  { value: 'blender', label: 'Blender' },
  { value: 'unity', label: 'Unity' },
  { value: 'unreal', label: 'Unreal Engine' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'discord', label: 'Discord' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: '기타' },
];

export type PaymentType = 'one_time' | 'subscription_monthly' | 'subscription_yearly';

export interface MarketplaceAuthor {
  name: string;
  email?: string;
  website?: string;
  avatar_url?: string;
}

export interface MarketplaceRating {
  avg: number;
  count: number;
}

export interface MarketplaceMeta {
  platform: Platform;
  /** 가격 (USD 센트, 0 = 무료) */
  price_cents: number;
  author: MarketplaceAuthor;
  cover_url?: string;
  long_description?: string;
  tags?: string[];
  recommended_device_hint?: DeviceHint;
  version?: string;
  changelog?: string;
  license_terms?: string;
  payment_type?: PaymentType;
  screenshots?: string[];
  demo_video_url?: string;
  rating?: MarketplaceRating;
}

export function emptyMarketplaceMeta(): MarketplaceMeta {
  return {
    platform: 'other',
    price_cents: 0,
    author: { name: '' },
    version: '0.1.0',
    payment_type: 'one_time',
    tags: [],
    screenshots: [],
  };
}

/** 가격 포맷 (cents → USD 문자열) */
export function formatPrice(cents: number): string {
  if (cents <= 0) return '무료';
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/** 검증 — 게시 가능한가? */
export function validateMarketplaceMeta(meta: MarketplaceMeta): string[] {
  const errors: string[] = [];
  if (!meta.author.name || meta.author.name.trim().length === 0) {
    errors.push('작성자 이름 필수');
  }
  if (meta.price_cents < 0) {
    errors.push('가격은 0 이상이어야 함');
  }
  if (meta.price_cents > 100_000) {
    errors.push('가격은 $1000 이하 (10000000 cents)');
  }
  if (meta.long_description && meta.long_description.length > 10_000) {
    errors.push('설명은 10,000자 이하');
  }
  if (meta.tags && meta.tags.length > 20) {
    errors.push('태그는 20개 이하');
  }
  if (meta.screenshots && meta.screenshots.length > 10) {
    errors.push('스크린샷은 10개 이하');
  }
  return errors;
}
