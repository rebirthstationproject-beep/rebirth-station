/**
 * Smoke 테스트 — PC 앱 frontend 핵심 화면 표시 검증.
 *
 * v0.1.3+: 데모 큐브팩 자동 로드 + TopBar + 사이드바 + 인스펙터 + 그리드 표시.
 */

import { test, expect } from '@playwright/test';

test.describe('큐브 리스트 PC 앱 — Smoke', () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화 (각 테스트 격리)
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('앱이 렌더링되고 데모 큐브팩이 자동 로드된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.main-tab-bar')).toBeVisible();
    // 데모 큐브팩의 첫 큐브 (Anthropic, GitHub 등) 라벨이 표시됨
    await expect(page.locator('.cube-cell .cube-label').first()).toBeVisible({ timeout: 10_000 });
  });

  test('TopBar 핵심 액션 버튼 표시', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=가져오기').first()).toBeVisible();
    await expect(page.locator('text=내보내기').first()).toBeVisible();
  });

  test('MainTab 3개 (큐브 만들기 / 큐브 리스트 만들기 / 마켓플레이스) 표시', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.main-tab').filter({ hasText: '큐브 만들기' })).toBeVisible();
    await expect(page.locator('.main-tab').filter({ hasText: '큐브 리스트 만들기' })).toBeVisible();
    await expect(page.locator('.main-tab').filter({ hasText: '마켓플레이스' })).toBeVisible();
  });

  test('마켓플레이스 탭 클릭 → 카탈로그 표시', async ({ page }) => {
    await page.goto('/');
    await page.locator('.main-tab').filter({ hasText: '마켓플레이스' }).click();
    await expect(page.locator('.marketplace-catalog')).toBeVisible();
    await expect(page.locator('.mp-pack-card').first()).toBeVisible();
    // 6 mock 큐브팩 카드 표시
    const cards = page.locator('.mp-pack-card');
    await expect(cards).toHaveCount(6);
  });

  test('카탈로그 큐브팩 카드 클릭 → 상세 페이지 전환', async ({ page }) => {
    await page.goto('/');
    await page.locator('.main-tab').filter({ hasText: '마켓플레이스' }).click();
    const firstCard = page.locator('.mp-pack-card').first();
    await firstCard.click();
    await expect(page.locator('.pack-detail')).toBeVisible();
    await expect(page.locator('.pack-detail-hero')).toBeVisible();
    // 디바이스 미리보기 그리드 표시
    await expect(page.locator('.device-preview')).toBeVisible();
    // 카탈로그로 돌아가기 버튼
    await page.locator('text=카탈로그로').click();
    await expect(page.locator('.marketplace-catalog')).toBeVisible();
  });

  test('카탈로그 검색 → 필터링 결과', async ({ page }) => {
    await page.goto('/');
    await page.locator('.main-tab').filter({ hasText: '마켓플레이스' }).click();
    await page.locator('.mp-catalog-search').fill('OBS');
    // OBS 큐브팩만 노출
    await expect(page.locator('.mp-pack-card')).toHaveCount(1);
    await expect(page.locator('.mp-pack-name')).toContainText('OBS');
  });

  test('전역 검색 Ctrl+F → 모달 표시', async ({ page }) => {
    await page.goto('/');
    // 큐브 셀 등이 렌더링된 후 검색
    await page.waitForSelector('.cube-cell', { timeout: 10_000 });
    await page.keyboard.press('Control+F');
    await expect(page.locator('.global-search-modal')).toBeVisible();
    // Esc 닫기
    await page.keyboard.press('Escape');
    await expect(page.locator('.global-search-modal')).toHaveCount(0);
  });

  test('큐브 셀 클릭 → 인스펙터에 큐브 정보 표시', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cube-cell.has-icon', { timeout: 10_000 });
    await page.locator('.cube-cell.has-icon').first().click();
    // 인스펙터 영역 표시
    await expect(page.locator('.inspector')).toBeVisible();
    // CubePreview 카드 (v0.1.2 신규)
    await expect(page.locator('.cube-preview-card')).toBeVisible();
  });
});
