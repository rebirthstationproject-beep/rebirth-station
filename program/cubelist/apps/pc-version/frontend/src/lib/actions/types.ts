/**
 * 액션 스펙 타입 (M3) — 인스펙터 동적 폼 메타데이터.
 *
 * 각 action_type 마다 1 파일 (`./link.ts`, `./shortcut.ts`, ...) 이 본 인터페이스를 구현.
 * `./index.ts` 가 모두 모아 `ACTIONS` 레지스트리로 export.
 */

import type { CubeActionType } from '../../types/cube';

/**
 * 인스펙터가 렌더링할 단일 필드 메타.
 */
export type FieldSchema =
  | {
      key: string;
      type: 'text' | 'url' | 'textarea' | 'number';
      label: string;
      placeholder?: string;
      required?: boolean;
      hint?: string;
    }
  | {
      key: string;
      type: 'checkbox';
      label: string;
      hint?: string;
    }
  | {
      key: string;
      type: 'select';
      label: string;
      options: ReadonlyArray<{ value: string; label: string }>;
      hint?: string;
    }
  | {
      key: string;
      type: 'string-list';
      label: string;
      placeholder?: string;
      hint?: string;
    }
  | {
      key: string;
      type: 'json';
      label: string;
      hint?: string;
    };

/**
 * 액션 스펙 — 단일 action_type 의 자기 기술.
 */
export interface ActionSpec {
  id: CubeActionType;
  /** 사용자 표시명 (ko) */
  label: string;
  /** 짧은 설명 (인스펙터 hint) */
  description: string;
  /** 권한 등급 — Tier 1(안전) / 2(동의) / 3(영구토글) */
  tier: 1 | 2 | 3;
  /** 새 큐브 생성 시 기본 payload */
  defaultPayload: Record<string, unknown>;
  /** 인스펙터 폼 필드 메타 */
  schema: ReadonlyArray<FieldSchema>;
  /** payload 검증 — 빈 배열 = OK, 문자열 배열 = 에러 메시지들 */
  validatePayload(p: Record<string, unknown>): string[];
}
