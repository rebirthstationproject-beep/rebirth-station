/**
 * 액션 레지스트리 (M3) — 10 개 코어 action_type 통합 export.
 *
 * 추가 시: 1) 새 파일 작성 (예: `./screenshot.ts`) 2) ACTIONS 배열에 등록
 *         3) `types/cube.ts` 의 `CubeActionType` union 확장 4) M4 면 .cubeplugin 으로 외부화.
 */

import type { CubeActionType } from '../../types/cube';
import type { ActionSpec } from './types';
import { linkAction } from './link';
import { shortcutAction } from './shortcut';
import { macroAction } from './macro';
import { folderAction } from './folder';
import { textInsertAction } from './text_insert';
import { clipboardCopyAction } from './clipboard_copy';
import { appLaunchAction } from './app_launch';
import { focusWindowAction } from './focus_window';
import { mouseClickAction } from './mouse_click';
import { pluginAction } from './plugin_action';

export type { ActionSpec, ActionCategory, FieldSchema } from './types';
export { ACTION_CATEGORIES } from './types';

export const ACTIONS: ReadonlyArray<ActionSpec> = [
  linkAction,
  shortcutAction,
  macroAction,
  folderAction,
  textInsertAction,
  clipboardCopyAction,
  appLaunchAction,
  focusWindowAction,
  mouseClickAction,
  pluginAction,
];

const ACTION_INDEX: ReadonlyMap<CubeActionType, ActionSpec> = new Map(
  ACTIONS.map((a) => [a.id, a]),
);

export function getAction(type: CubeActionType): ActionSpec {
  const spec = ACTION_INDEX.get(type);
  if (!spec) throw new Error(`Unknown action_type: ${type}`);
  return spec;
}

/** 새 액션 타입으로 큐브가 바뀔 때 사용할 빈 payload. */
export function defaultPayloadFor(type: CubeActionType): Record<string, unknown> {
  return { ...getAction(type).defaultPayload };
}

/** payload 검증 — 에러 메시지 배열 (빈 배열 = OK). */
export function validatePayload(
  type: CubeActionType,
  payload: Record<string, unknown>,
): string[] {
  return getAction(type).validatePayload(payload);
}
