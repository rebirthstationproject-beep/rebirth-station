/**
 * ActionPayloadForm (M3) — action_type 스키마 기반 동적 폼.
 *
 * Inspector 가 본 컴포넌트를 호출하면, 선택된 큐브의 action_type 에 등록된
 * `FieldSchema[]` 를 따라 입력 필드를 렌더링한다.
 *
 * 변경 시 onChange(payload) 로 통째 새 payload 객체를 부모에 전달.
 */

import { useMemo, useState } from 'react';
import { getAction, validatePayload, type FieldSchema } from '../lib/actions';
import type { CubeActionType, MacroStep } from '../types/cube';
import { MacroStepEditor } from './MacroStepEditor';

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

  // M7 cron #21: macro 는 전용 step 에디터 사용 (schema 의 json fallback 대신)
  const isMacro = actionType === 'macro';

  return (
    <div className="payload-form">
      <div className="payload-meta">
        <span className={`tier-badge tier-${spec.tier}`}>Tier {spec.tier}</span>
        <span className="payload-desc">{spec.description}</span>
      </div>
      {isMacro ? (
        <MacroStepEditor
          steps={Array.isArray(value.steps) ? (value.steps as MacroStep[]) : []}
          onChange={(nextSteps) => onChange({ ...value, steps: nextSteps })}
        />
      ) : (
        spec.schema.map((field) => (
          <FieldRow key={field.key} field={field} value={value[field.key]} onPatch={patch} />
        ))
      )}
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
    case 'json':
      return <JsonField id={id} field={field} value={value} onPatch={onPatch} />;
  }
}

/**
 * 코드리뷰 M6: JSON 필드 = raw 문자열 상태 + 파싱 결과 분리.
 * - 유효 JSON 입력 시 onPatch 호출 + 에러 클리어
 * - 무효 JSON 도 raw 유지 (커서 사라짐/입력 사라짐 방지) + 인라인 에러 표시
 * - prop value 외부 변경 시 raw 동기 (큐브 전환 등)
 */
function JsonField({
  id,
  field,
  value,
  onPatch,
}: {
  id: string;
  field: Extract<FieldSchema, { type: 'json' }>;
  value: unknown;
  onPatch: (key: string, next: unknown) => void;
}) {
  const initial = useMemo(() => JSON.stringify(value ?? null, null, 2), [value]);
  const [raw, setRaw] = useState(initial);
  const [parseError, setParseError] = useState<string | null>(null);
  const [propSnapshot, setPropSnapshot] = useState(initial);

  // 외부 prop 값 변경 시 raw 재동기 (큐브 전환 등)
  if (initial !== propSnapshot) {
    setPropSnapshot(initial);
    setRaw(initial);
    setParseError(null);
  }

  return (
    <>
      <textarea
        id={id}
        className="json-input"
        value={raw}
        rows={5}
        onChange={(e) => {
          const text = e.target.value;
          setRaw(text);
          try {
            const parsed = JSON.parse(text);
            onPatch(field.key, parsed);
            setParseError(null);
          } catch (err) {
            setParseError(err instanceof Error ? err.message : 'JSON 형식 오류');
          }
        }}
        aria-invalid={parseError !== null}
      />
      {parseError && (
        <div className="field-error" role="alert">⚠ {parseError}</div>
      )}
    </>
  );
}
