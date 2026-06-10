/**
 * CubePalette — 2A-2 큐브 팔레트 (하단 패널)
 *
 * 소스 리스트(또는 "전체")의 큐브들을 소형 타일로 가로 스크롤 표시.
 * 각 타일은 useDraggable — id prefix "palette:<cubeId>" 로 외부 DndContext 에 등록됨.
 * ListMakerCenter 의 DndContext 가 이 드래그를 처리해 draft 에 복사 배치.
 */

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useEditor } from '../store/editor';
import { CubeCellVisual } from './CubeCell';
import { useTranslation } from '../lib/i18n/useTranslation';
import type { Cube, CubeList } from '../types/cube';

// ── 팔레트 타일 (단일 큐브) ───────────────────────────────────────────────────
function PaletteTile({ cube }: { cube: Cube }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${cube.id}`,
    data: { cube },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="palette-cell"
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
      title={`${cube.label} (${cube.action_type})`}
    >
      <CubeCellVisual cube={cube} />
    </div>
  );
}

// ── CubePalette 본체 ──────────────────────────────────────────────────────────
export function CubePalette() {
  const { t } = useTranslation();
  const pack = useEditor((s) => s.pack);
  const paletteListId = useEditor((s) => s.palette_list_id);
  const setPaletteList = useEditor((s) => s.setPaletteList);

  // 팔레트 소스 큐브 결정
  const sourceCubes: Cube[] = React.useMemo(() => {
    if (!pack) return [];
    if (paletteListId === null) {
      // 전체: 라이브러리 풀 + 모든 리스트 큐브 (중복 제거 — id 기준)
      const seen = new Set<string>();
      const all: Cube[] = [];
      for (const c of pack.cubes ?? []) {
        if (!seen.has(c.id)) { seen.add(c.id); all.push(c); }
      }
      for (const l of pack.lists) {
        for (const c of l.cubes) {
          if (!seen.has(c.id)) { seen.add(c.id); all.push(c); }
        }
      }
      return all;
    }
    const list = pack.lists.find((l) => l.id === paletteListId);
    return list?.cubes ?? [];
  }, [pack, paletteListId]);

  const sourceList: CubeList | null = React.useMemo(() => {
    if (!pack || paletteListId === null) return null;
    return pack.lists.find((l) => l.id === paletteListId) ?? null;
  }, [pack, paletteListId]);

  const sourceName = paletteListId === null
    ? t('palette.all_source')
    : (sourceList?.name ?? t('palette.all_source'));

  const cubeCountLabel = t('palette.cube_count').replace('{n}', String(sourceCubes.length));

  return (
    <div className="cube-palette">
      <div className="palette-header">
        <span className="palette-source-name">{sourceName}</span>
        <span className="palette-cube-count muted">{cubeCountLabel}</span>
        {/* "전체" 빠른 접근 버튼 */}
        {paletteListId !== null && (
          <button
            type="button"
            className="btn-ghost palette-all-btn"
            onClick={() => setPaletteList(null)}
            title={t('palette.all_source')}
          >
            {t('palette.all_source')}
          </button>
        )}
        <span className="palette-drag-hint muted small">{t('palette.drag_hint')}</span>
      </div>
      <div className="palette-tiles">
        {sourceCubes.length === 0 ? (
          <span className="muted small" style={{ padding: '0 12px', lineHeight: '40px' }}>
            {t('palette.all_source')} —
          </span>
        ) : (
          sourceCubes.map((cube) => <PaletteTile key={cube.id} cube={cube} />)
        )}
      </div>
    </div>
  );
}
