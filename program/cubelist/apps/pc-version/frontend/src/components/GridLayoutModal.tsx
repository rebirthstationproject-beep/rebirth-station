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

type Orientation = 'portrait' | 'landscape';

const ROWS_BY_ORIENT: Record<Orientation, number> = {
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
  // 초기 orientation 추정: pageSize/cols == 7 → portrait, == 4 → landscape, 그 외 portrait fallback
  const inferredOrient: Orientation =
    initialPageSize / initialCols >= 6 ? 'portrait' : 'landscape';

  const [orientation, setOrientation] = useState<Orientation>(inferredOrient);
  const [cols, setCols] = useState<number>(initialCols);

  const rows = ROWS_BY_ORIENT[orientation];
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
            max={10}
            value={cols}
            onChange={(e) => setCols(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
          />
          <div className="modal-hint">1 ~ 10 사이 정수</div>
        </div>

        <div className="modal-preview">
          <div className="modal-preview-label">미리보기 (한 페이지 슬롯 수)</div>
          <div className="modal-preview-value">
            {cols} × {rows} = <strong>{previewSize}</strong> 슬롯
          </div>
        </div>

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
