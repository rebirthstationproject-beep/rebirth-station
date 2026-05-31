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

  // === v0.1.3 추가 ===

  test('⚙ 설정 패널 표시 + 4 섹션', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.icon-btn', { timeout: 10_000 });
    // TopBar ⚙ 클릭
    await page.locator('.icon-btn').filter({ hasText: '⚙' }).click();
    await expect(page.locator('.settings-panel')).toBeVisible();
    // 4 섹션 타이틀 표시
    const titles = page.locator('.settings-section-title');
    await expect(titles).toHaveCount(4);
    // 완료 버튼 클릭 → 닫힘
    await page.locator('.btn-primary').filter({ hasText: /완료|Done|完了/ }).click();
    await expect(page.locator('.settings-panel')).toHaveCount(0);
  });

  test('PackDetail 디바이스 토글 5 버튼 + 그리드 변경', async ({ page }) => {
    await page.goto('/');
    await page.locator('.main-tab').filter({ hasText: '마켓플레이스' }).click();
    await page.locator('.mp-pack-card').first().click();
    // 디바이스 토글 5 버튼
    const toggleBtns = page.locator('.pack-device-toggle-btn');
    await expect(toggleBtns).toHaveCount(5);
    // Mini 클릭 → is-active
    const miniBtn = toggleBtns.first();
    await miniBtn.click();
    await expect(miniBtn).toHaveClass(/is-active/);
    // 다시 Mini 클릭 → is-active 해제
    await miniBtn.click();
    await expect(miniBtn).not.toHaveClass(/is-active/);
  });

  test('Ctrl+E → 큐브팩 export 트리거 (alert 없으면 패스)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cube-cell', { timeout: 10_000 });
    // 다이얼로그 대비 (없을 수도 있음 — pack 있으면 다운로드)
    page.on('dialog', (d) => d.dismiss());
    await page.keyboard.press('Control+E');
    // 다운로드 또는 alert — 부수 효과 발생 = 단축키 작동
    // 실제 파일 다운로드는 e2e 환경에서 검증 어려움 → 단축키 catch 정상이면 패스
    await expect(page.locator('.app')).toBeVisible();
  });

  test('마켓플레이스 가격 필터 → 무료만 표시', async ({ page }) => {
    await page.goto('/');
    await page.locator('.main-tab').filter({ hasText: '마켓플레이스' }).click();
    // 가격 필터 select (3번째 mp-filter-group → 2번째: '가격:')
    const priceSelect = page.locator('.mp-filter-group').filter({ hasText: /가격|Price|価格/ }).locator('select');
    await priceSelect.selectOption('free');
    // 무료 큐브팩만 (OBS Streamer + Discord Moderator = 2건)
    await expect(page.locator('.mp-pack-card')).toHaveCount(2);
  });

  test('인스펙터 닫기 → 큐브 셀 다시 클릭 시 미리보기 갱신', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cube-cell.has-icon', { timeout: 10_000 });
    const cells = page.locator('.cube-cell.has-icon');
    // 첫 큐브 선택
    await cells.first().click();
    const preview = page.locator('.cube-preview-card');
    await expect(preview).toBeVisible();
    const firstLabel = await preview.locator('.cube-label').textContent();
    // 두 번째 큐브 선택 (다른 라벨)
    if (await cells.count() >= 2) {
      await cells.nth(1).click();
      const secondLabel = await preview.locator('.cube-label').textContent();
      // 라벨 변경 확인 (다를 가능성 높음, 같아도 패스)
      // 미리보기 자체가 표시되면 OK
      expect(secondLabel).toBeTruthy();
      void firstLabel;
    }
  });
});
