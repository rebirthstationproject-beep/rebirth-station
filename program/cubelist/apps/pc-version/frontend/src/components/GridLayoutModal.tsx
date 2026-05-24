/**
 * GridLayoutModal (수정 #1) — 큐브 그리드 배치 설정.
 *
 * 입력:
 * - orientation: portrait (세로 · rows 7) / landscape (가로 · rows 4)
 * - cols: 가로 개수 (1~10)
 *
 * 산출: pageSize = cols × rows (orientation 기준)
 *
 * 기본 (아이폰/갤럭시 max 기준): portrait 4×7=28, landscape 7×4=28.
 */

import { useState } from 'react';

type Orientation = 'portrait' | 'landscape' | 'custom';

const ROWS_BY_ORIENT: Record<Exclude<Orientation, 'custom'>, number> = {
  portrait: 7,
  landscape: 4,
};

interface GridLayoutModalProps {
  initialCols: number;
  initialPageSize: number;
  onApply: (layout: { cols: number; cubes_per_page: number }) => void;
  onCancel: () => void;
}

export function GridLayoutModal({
  initialCols,
  initialPageSize,
  onApply,
  onCancel,
}: GridLayoutModalProps) {
  // 초기 orientation 추정
  const inferredRows = initialPageSize / initialCols;
  const inferredOrient: Orientation =
    inferredRows === 7
      ? 'portrait'
      : inferredRows === 4
        ? 'landscape'
        : 'custom';

  const [orientation, setOrientation] = useState<Orientation>(inferredOrient);
  const [cols, setCols] = useState<number>(initialCols);
  const [customRows, setCustomRows] = useState<number>(
    inferredOrient === 'custom' ? inferredRows : initialCols, // 기본 = cols 와 동일 (정사각)
  );

  const rows = orientation === 'custom' ? customRows : ROWS_BY_ORIENT[orientation];
  const previewSize = cols * rows;

  function handleApply(): void {
    onApply({ cols, cubes_per_page: previewSize });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="배치 설정">
        <h2 className="modal-title">그리드 배치 설정</h2>

        <div className="modal-section">
          <div className="modal-label">화면 방향</div>
          <div className="modal-radio-row">
            <label className={orientation === 'portrait' ? 'is-active' : ''}>
              <input
                type="radio"
                name="orientation"
                value="portrait"
                checked={orientation === 'portrait'}
                onChange={() => setOrientation('portrait')}
              />
              <span>세로 (아이폰 · 갤럭시)</span>
              <span className="modal-hint">기본 4 × 7</span>
            </label>
            <label className={orientation === 'landscape' ? 'is-active' : ''}>
              <input
                type="radio"
                name="orientation"
                value="landscape"
                checked={orientation === 'landscape'}
                onChange={() => setOrientation('landscape')}
              />
              <span>가로 (태블릿 · 거치)</span>
              <span className="modal-hint">기본 7 × 4</span>
            </label>
            <label className={orientation === 'custom' ? 'is-active' : ''}>
              <input
                type="radio"
                name="orientation"
                value="custom"
                checked={orientation === 'custom'}
                onChange={() => setOrientation('custom')}
              />
              <span>커스텀</span>
              <span className="modal-hint">가로 × 세로 직접 입력</span>
            </label>
          </div>
        </div>

        <div className="modal-section">
          <label className="modal-label" htmlFor="cols-input">
            가로 개수 (cols)
          </label>
          <input
            id="cols-input"
            type="number"
            min={1}
            max={20}
            value={cols}
            onChange={(e) => setCols(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
        </div>

        {orientation === 'custom' && (
          <div className="modal-section">
            <label className="modal-label" htmlFor="rows-input">
              세로 개수 (rows)
            </label>
            <input
              id="rows-input"
              type="number"
              min={1}
              max={20}
              value={customRows}
              onChange={(e) =>
                setCustomRows(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
              }
            />
            <div className="modal-hint">총 {previewSize} 슬롯</div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn-ghost btn-primary" onClick={handleApply}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
