/**
 * runCube — 큐브 즉시 실행 공용 헬퍼 (PlayMode & CubeMakerCenter 더블클릭 공유).
 *
 * PlayMode 의 handleCubeClick 에서 nav/folder/page 분기를 제외한
 * "실행형" 부분만 추출.  PlayMode 동작은 변경 없음.
 *
 * 비 Tauri 환경: link 만 window.open, 나머지 console.warn (편집 흐름 방해 금지).
 * 실행 오류: console.warn (alert 금지).
 */

import type { Cube } from '../types/cube';
import { useEditor } from '../store/editor';

/** nav_listId: live_timer/live_alarm 의 upsertCube 에 필요한 listId */
export async function runCube(cube: Cube, listId: string): Promise<void> {
  const at = cube.action_type;

  // 비실행형 — 편집기에서 더블클릭 대상이 아닌 타입은 무시
  if (at === 'folder' || at === 'folder_up' || at === 'page_navigate' || at === 'page_jump') {
    return;
  }

  // live_timer / live_alarm: 클릭 = 시작/재시작 (PlayMode 로직 동일)
  if (at === 'live_timer' || at === 'live_alarm') {
    const durationSec =
      Number(cube.action_payload.duration_seconds) || (at === 'live_timer' ? 1500 : 300);
    const target = Date.now() + durationSec * 1000;
    useEditor.getState().upsertCube(listId, {
      ...cube,
      action_payload: { ...cube.action_payload, target_ms: target },
    });
    return;
  }

  const { isTauri } = await import('./tauri-bridge');

  // 비 Tauri: link 만 처리
  if (!isTauri()) {
    if (at === 'link') {
      const url = typeof cube.action_payload.url === 'string' ? cube.action_payload.url : '';
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('[run-cube] PC app only:', at);
    }
    return;
  }

  // plugin_action → fireCubeKey
  if (at === 'plugin_action') {
    const { fireCubeKey } = await import('../components/PluginRunnerHost');
    const fired = fireCubeKey(cube.id);
    if (!fired) {
      try {
        const { executeCube } = await import('./tauri-bridge');
        await executeCube(cube);
      } catch (e) {
        console.warn('[run-cube] plugin_action fallback failed:', e);
      }
    }
    return;
  }

  // 그 외 실행형 (link, shortcut, macro, app_launch, ...)
  try {
    const { executeCube } = await import('./tauri-bridge');
    await executeCube(cube);
  } catch (e) {
    console.warn('[run-cube] executeCube failed:', e);
  }
}
