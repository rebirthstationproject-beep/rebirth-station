import type { ActionSpec } from './types';

/**
 * 플러그인 액션 — 외부 .cubeplugin 이 등록한 액션.
 * M4 (플러그인 SDK) 도입 후 plugin_uuid 셀렉터 + 플러그인 PropertyInspector 임베드.
 */
export const pluginAction: ActionSpec = {
  id: 'plugin_action',
  label: '플러그인 액션',
  description: '외부 플러그인이 등록한 액션을 호출합니다 (M4 SDK).',
  tier: 3,
  // category 생략 — 플러그인 자체 카테고리는 manifest 측에서 정의
  defaultPayload: { plugin_uuid: '', payload: {} },
  schema: [
    {
      key: 'plugin_uuid',
      type: 'text',
      label: '플러그인 UUID',
      placeholder: 'com.example.myplugin',
      required: true,
      hint: 'M4 에서 플러그인 카탈로그 셀렉터로 대체',
    },
    {
      key: 'payload',
      type: 'json',
      label: 'payload (JSON)',
      hint: '플러그인이 정의하는 payload — M4 에서 PropertyInspector 임베드',
    },
  ],
  validatePayload(p) {
    const errors: string[] = [];
    const uuid = typeof p.plugin_uuid === 'string' ? p.plugin_uuid.trim() : '';
    if (uuid.length === 0) errors.push('plugin_uuid 필수');
    if (p.payload !== null && typeof p.payload !== 'object') {
      errors.push('payload 는 객체');
    }
    return errors;
  },
};
