/**
 * Playwright 설정 — 큐브 리스트 PC 트랙 (v0.1.3+).
 *
 * 환경:
 *  - Vite dev 서버 (npm run dev) 또는 build dist 정적 호스팅
 *  - Tauri WebDriver 통합은 별도 (v0.2 예정)
 *
 * 실행:
 *   npm run e2e            # 전체
 *   npm run e2e -- --ui    # UI 모드
 *   npm run e2e -- --debug # 디버거
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'cd ../frontend && npm run dev',
    url: 'http://127.0.0.1:3002',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
});
