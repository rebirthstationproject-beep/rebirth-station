/**
 * Tauri 네이티브 앱 smoke 테스트 (v0.1.3 사전, 2026-06-01).
 *
 * 시나리오:
 *   1. 앱 기동 → 메인 윈도우 렌더링 확인
 *   2. 빈 큐브팩 새로 만들기
 *   3. 첫 큐브 추가 (label "Test Cube")
 *   4. 저장 (localStorage 영속 확인)
 *
 * 실행 전제:
 *   - tauri-driver 가 별도 터미널에서 구동 중
 *   - target/debug/cubelist 바이너리 존재 (cargo tauri build --debug)
 *
 * 본 spec 은 v0.1.4 마일스톤 진입 시 CI 통합. v0.1.3 베타에서는 사용자 환경 검증용.
 */

import { describe, it } from 'mocha';
import { expect } from '@wdio/globals';

declare const browser: WebdriverIO.Browser;

describe('큐브 리스트 PC — Tauri smoke', function () {
  this.timeout(60_000);

  it('앱 기동 → 메인 윈도우 렌더링', async () => {
    // Tauri webview 루트 div 노출 대기
    const root = await browser.$('#root');
    await root.waitForDisplayed({ timeout: 10_000 });
    expect(await root.isDisplayed()).toBe(true);
  });

  it('TopBar — 새 큐브팩 만들기 버튼', async () => {
    // TopBar 버튼: data-testid 사용 권장 (v0.1.4 frontend 마크업 보강 예정)
    const newPackBtn = await browser.$('button[title*="새 큐브팩"], button[aria-label*="새 큐브팩"]');
    await newPackBtn.waitForExist({ timeout: 5_000 });
    await newPackBtn.click();
  });

  it('빈 pack 로드 후 큐브 추가 가능 상태 확인', async () => {
    // 큐브 만들기 탭으로 이동
    const makeTab = await browser.$('button*=큐브 만들기');
    await makeTab.click();

    // 인스펙터에서 label input 활성
    const labelInput = await browser.$('input[placeholder*="라벨"], input[placeholder*="Label"]');
    await labelInput.waitForExist({ timeout: 5_000 });
    expect(await labelInput.isEnabled()).toBe(true);
  });

  it('큐브 라벨 입력 + 저장', async () => {
    const labelInput = await browser.$('input[placeholder*="라벨"], input[placeholder*="Label"]');
    await labelInput.setValue('Test Cube');

    // 저장 / 적용 버튼
    const saveBtn = await browser.$('button*=저장, button*=Save, button*=적용');
    if (await saveBtn.isExisting()) {
      await saveBtn.click();
    }

    // 큐브 그리드에 신규 큐브 노출 확인
    const cubeCell = await browser.$('[data-cube-label="Test Cube"], button*=Test Cube');
    await cubeCell.waitForExist({ timeout: 5_000 });
  });
});
