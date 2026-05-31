/**
 * Tauri WebDriver 설정 (v0.1.3 사전, 2026-06-01).
 *
 * Playwright 와 별도로 Tauri 네이티브 앱을 WebDriver 로 구동하기 위한 설정.
 * tauri-driver (v0.1.x) + WebdriverIO 조합.
 *
 * 실행 (사용자 환경):
 *   1. `cargo install tauri-driver --locked`   # 최초 1회
 *   2. `cargo tauri build --debug`              # 디버그 바이너리
 *   3. `npx wdio run tauri-driver.config.ts`    # E2E 실행
 *
 * 본 셋업은 v0.1.3 베타에서는 사용자 환경 검증용. CI 통합은 v0.1.4 마일스톤.
 */

import { join } from 'node:path';
import { platform } from 'node:os';

const PROJECT_ROOT = join(__dirname, '..');

// Tauri 디버그 바이너리 경로 (cargo tauri build --debug 산출물)
function tauriBinaryPath(): string {
  const target = join(PROJECT_ROOT, 'target', 'debug');
  if (platform() === 'win32') return join(target, 'cubelist.exe');
  if (platform() === 'darwin') return join(target, 'cubelist.app', 'Contents', 'MacOS', 'cubelist');
  return join(target, 'cubelist');
}

export const config = {
  // WebDriver hostname / port (tauri-driver 기본값)
  hostname: '127.0.0.1',
  port: 4444,
  path: '/',

  // tauri-driver 가 자동 구동하므로 wdio는 시작 안 함
  automationProtocol: 'webdriver' as const,

  specs: ['./tests/tauri/**/*.spec.ts'],
  maxInstances: 1,

  capabilities: [
    {
      'tauri:options': {
        application: tauriBinaryPath(),
      },
    },
  ],

  logLevel: 'info' as const,
  bail: 0,
  baseUrl: 'tauri://localhost',
  waitforTimeout: 10_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 3,

  framework: 'mocha' as const,
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd' as const,
    timeout: 60_000,
  },

  // tauri-driver 백그라운드 spawn
  onPrepare(): void {
    console.log('[tauri-e2e] tauri-driver 백그라운드 구동 — 사용자가 별도 터미널에서 실행:');
    console.log('  cargo install tauri-driver --locked  # 최초 1회');
    console.log('  tauri-driver');
  },
};
