/**
 * ActionPayloadForm (M3) — action_type 스키마 기반 동적 폼.
 *
 * Inspector 가 본 컴포넌트를 호출하면, 선택된 큐브의 action_type 에 등록된
 * `FieldSchema[]` 를 따라 입력 필드를 렌더링한다.
 *
 * 변경 시 onChange(payload) 로 통째 새 payload 객체를 부모에 전달.
 */

import { useMemo } from 'react';
import { getAction, validatePayload, type FieldSchema } from '../lib/actions';
import type { CubeActionType } from '../types/cube';

interface ActionPayloadFormProps {
  actionType: CubeActionType;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function ActionPayloadForm({ actionType, value, onChange }: ActionPayloadFormProps) {
  const spec = getAction(actionType);
  const errors = useMemo(() => validatePayload(actionType, value), [actionType, value]);

  function patch(key: string, next: unknown): void {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="payload-form">
      <div className="payload-meta">
        <span className={`tier-badge tier-${spec.tier}`}>Tier {spec.tier}</span>
        <span className="payload-desc">{spec.description}</span>
      </div>
      {spec.schema.map((field) => (
        <FieldRow key={field.key} field={field} value={value[field.key]} onPatch={patch} />
      ))}
      {errors.length > 0 && (
        <ul className="payload-errors" aria-live="polite">
          {errors.map((e, i) => (
            <li key={i}>⚠ {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FieldRowProps {
  field: FieldSchema;
  value: unknown;
  onPatch: (key: string, next: unknown) => void;
}

function FieldRow({ field, value, onPatch }: FieldRowProps) {
  return (
    <div className="field-row">
      <label className="field-label" htmlFor={`field-${field.key}`}>
        {field.label}
        {'required' in field && field.required ? <span className="field-req"> *</span> : null}
      </label>
      <FieldInput field={field} value={value} onPatch={onPatch} />
      {field.hint && <div className="field-hint">{field.hint}</div>}
    </div>
  );
}

function FieldInput({ field, value, onPatch }: FieldRowProps) {
  const id = `field-${field.key}`;

  switch (field.type) {
    case 'text':
    case 'url': {
      const v = typeof value === 'string' ? value : '';
      return (
        <input
          id={id}
          type={field.type === 'url' ? 'url' : 'text'}
          value={v}
          placeholder={field.placeholder}
          onChange={(e) => onPatch(field.key, e.target.value)}
        />
      );
    }
    case 'textarea': {
      const v = typeof value === 'string' ? value : '';
      return (
        <textarea
          id={id}
          value={v}
          rows={3}
          placeholder={field.placeholder}
          onChange={(e) => onPatch(field.key, e.target.value)}
        />
      );
    }
    case 'number': {
      const v = typeof value === 'number' ? value : 0;
      return (
        <input
          id={id}
          type="number"
          value={v}
          onChange={(e) => onPatch(field.key, Number(e.target.value))}
        />
      );
    }
    case 'checkbox': {
      const v = Boolean(value);
      return (
        <input
          id={id}
          type="checkbox"
          checked={v}
          onChange={(e) => onPatch(field.key, e.target.checked)}
        />
      );
    }
    case 'select': {
      const v = typeof value === 'string' ? value : (field.options[0]?.value ?? '');
      return (
        <select id={id} value={v} onChange={(e) => onPatch(field.key, e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    case 'string-list': {
      const list = Array.isArray(value) ? (value.filter((v) => typeof v === 'string') as string[]) : [];
      const joined = list.join(', ');
      return (
        <input
          id={id}
          type="text"
          value={joined}
          placeholder={field.placeholder}
          onChange={(e) => {
            const next = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            onPatch(field.key, next);
          }}
        />
      );
    }
    case 'json': {
      const json = JSON.stringify(value ?? null, null, 2);
      return (
        <textarea
          id={id}
          className="json-input"
          value={json}
          rows={5}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onPatch(field.key, parsed);
            } catch {
              // invalid JSON — 사용자 타이핑 중일 수 있으므로 무시
            }
          }}
        />
      );
    }
  }
}
