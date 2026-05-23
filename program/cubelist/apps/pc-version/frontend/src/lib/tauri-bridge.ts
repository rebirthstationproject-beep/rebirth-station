/**
 * Tauri ↔ frontend 브리지 (M3 cron #8)
 *
 * Tauri WebView 환경에서는 `@tauri-apps/api/core` 의 `invoke` 를 사용하여 Rust commands.rs
 * 의 `execute_cube` 핸들러를 호출.
 *
 * 일반 브라우저(dev: `vite` only) 환경에서는 invoke 불가 — `executeCube` 는 mock 응답 반환.
 * 이를 통해 frontend 단독 dev 도 가능하면서 Tauri 빌드에서는 실제 동작.
 */

import type { Cube } from '../types/cube';

/** Tauri WebView 내부에서 동작 중인지 검출 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown };
  return Boolean(w.__TAURI_INTERNALS__ ?? w.__TAURI__);
}

export interface ExecuteResult {
  elapsed_ms: number;
}

export interface ExecuteError {
  kind: 'deserialize' | 'unsafe_scheme' | 'os_command' | 'feature_disabled' | 'permission_required';
  message: string;
  tier?: number;
}

/**
 * 큐브 액션을 PC 헬퍼에 위임 실행.
 *
 * Tauri 환경: `invoke('execute_cube', { action: { action_type, ...payload } })`
 * 비 Tauri 환경: 콘솔 로그 + mock 결과 (개발용)
 */
export async function executeCube(cube: Cube): Promise<ExecuteResult> {
  const action = {
    action_type: cube.action_type,
    ...cube.action_payload,
  };

  if (!isTauri()) {
    // 브라우저 dev — link 큐브만 즉시 처리, 나머지는 mock
    if (cube.action_type === 'link') {
      const url = typeof cube.action_payload.url === 'string' ? cube.action_payload.url : '';
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // eslint-disable-next-line no-console
      console.info('[tauri-bridge] dev mock executeCube', action);
    }
    return { elapsed_ms: 0 };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<ExecuteResult>('execute_cube', { action });
}

/**
 * 사용자 표시용 에러 메시지 — Rust 측 ExecuteErrorDto 를 한글 문구로.
 */
export function describeExecuteError(e: unknown): string {
  if (e && typeof e === 'object' && 'kind' in e) {
    const err = e as ExecuteError;
    switch (err.kind) {
      case 'unsafe_scheme':
        return `안전하지 않은 URL: ${err.message}`;
      case 'os_command':
        return `OS 명령 실패: ${err.message}`;
      case 'feature_disabled':
        return `이 액션은 아직 구현 대기: ${err.message}`;
      case 'permission_required':
        return `Tier ${err.tier ?? '?'} 권한이 필요합니다 — 설정에서 활성화하세요`;
      case 'deserialize':
        return `payload 형식 오류: ${err.message}`;
    }
  }
  if (e instanceof Error) return e.message;
  return String(e);
}
