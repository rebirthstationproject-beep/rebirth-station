/**
 * 큐브 리스트 PC 편집기 — 셸 (M2: store + DnD reorder)
 *
 * StreamDeck 동등 3-패널:
 * - 좌: 카테고리 + 시드 카탈로그 (M6)
 * - 중: 큐브 그리드 (@dnd-kit/sortable reorder)
 * - 우: 큐브 인스펙터 (M3 액션 스키마 동적 폼)
 *
 * 상단: 다중 리스트 탭 · 하단: 플러그인 라이브러리 (M4)
 */

import { useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor } from './store/editor';
import { buildDemoPack } from './lib/demo-pack';
import {
  CubepackFormatError,
  downloadCubepack,
  exportCubepack,
  importCubepack,
} from './lib/cubepack-io';
import type { Cube, CubeList } from './types/cube';

export function App() {
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);

  useEffect(() => {
    if (!pack) loadPack(buildDemoPack());
  }, [pack, loadPack]);

  return (
    <div className="app">
      <TopBar />
      <div className="workspace">
        <Sidebar />
        <GridArea />
        <Inspector />
      </div>
      <footer className="library">
        <span className="library-title">플러그인 라이브러리</span>
        <span className="library-hint">(M4 단계에서 채워집니다)</span>
      </footer>
    </div>
  );
}

function TopBar() {
  const pack = useEditor((s) => s.pack);
  const activeListId = useEditor((s) => s.list_id);
  const selectList = useEditor((s) => s.selectList);
  const loadPack = useEditor((s) => s.loadPack);

  async function handleExport(): Promise<void> {
    if (!pack) return;
    try {
      const blob = await exportCubepack(pack);
      downloadCubepack(blob, pack.name || pack.id);
    } catch (e) {
      const msg = e instanceof CubepackFormatError ? e.message : '내보내기 실패';
      window.alert(`큐브팩 내보내기 오류: ${msg}`);
    }
  }

  function handleImportClick(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cubepack,application/zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const next = await importCubepack(buf);
        loadPack(next);
      } catch (e) {
        const msg = e instanceof CubepackFormatError ? e.message : '가져오기 실패';
        window.alert(`큐브팩 가져오기 오류: ${msg}`);
      }
    };
    input.click();
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">큐브 리스트 — 편집기</span>
        <nav className="pack-tabs" aria-label="리스트">
          {pack?.lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`pack-tab ${activeListId === l.id ? 'is-active' : ''}`}
              onClick={() => selectList(l.id)}
              aria-pressed={activeListId === l.id}
            >
              {l.name}
            </button>
          ))}
          <button className="pack-tab is-add" type="button" title="리스트 추가 (M2 후반)">
            +
          </button>
        </nav>
      </div>
      <div className="topbar-right">
        <span className="pack-meta">{pack?.name ?? '(큐브팩 없음)'}</span>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleImportClick}
          title="큐브팩 가져오기 (.cubepack)"
        >
          가져오기
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleExport}
          disabled={!pack}
          title="현재 큐브팩 내보내기 (.cubepack)"
        >
          내보내기
        </button>
        <button className="icon-btn" title="설정" aria-label="설정">⚙</button>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="카테고리">
      <div className="sidebar-section">
        <h3 className="sidebar-title">카테고리</h3>
        <ul className="category-list">
          {['생산성', '미디어', '개발', '디자인', '게이밍', '시스템'].map((c) => (
            <li key={c} className="category-item">
              <button className="category-btn" type="button">{c}</button>
            </li>
          ))}
        </ul>
        <div className="sidebar-hint">(M6 단계에서 시드 카탈로그 연결)</div>
      </div>
    </aside>
  );
}

function GridArea() {
  const pack = useEditor((s) => s.pack);
  const listId = useEditor((s) => s.list_id);
  const list = pack?.lists.find((l) => l.id === listId) ?? null;

  if (!list) {
    return (
      <main className="grid-area">
        <div className="grid-empty">리스트를 선택하세요</div>
      </main>
    );
  }

  return (
    <main className="grid-area">
      <div className="grid-meta">
        <span>{list.name} · 큐브 {list.cubes.length}개</span>
        <div className="grid-meta-actions">
          <button className="btn-ghost" type="button">이전 페이지</button>
          <button className="btn-ghost" type="button">다음 페이지</button>
        </div>
      </div>
      <CubeGrid list={list} />
      <div className="grid-hint">M2: @dnd-kit reorder 활성 · M2 후반: .cubepack ZIP 로드/저장 · M7: 페이지(서브덱)</div>
    </main>
  );
}

function CubeGrid({ list }: { list: CubeList }) {
  const reorderCubes = useEditor((s) => s.reorderCubes);
  const upsertCube = useEditor((s) => s.upsertCube);
  const selectCube = useEditor((s) => s.selectCube);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const cols = list.cols ?? 5;
  const sorted = [...list.cubes].sort((a, b) => a.sort_order - b.sort_order);
  const minSlots = cols * 3;
  const emptySlots = Math.max(0, minSlots - sorted.length);

  function handleDragEnd(e: DragEndEvent): void {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    reorderCubes(list.id, String(active.id), String(over.id));
  }

  function handleAddCube(): void {
    const maxSort = sorted.length === 0 ? 0 : sorted[sorted.length - 1].sort_order;
    const newCube: Cube = {
      id: crypto.randomUUID(),
      sort_order: maxSort + 1,
      label: '새 큐브',
      icon_url: null,
      action_type: 'link',
      action_payload: { url: '' },
    };
    upsertCube(list.id, newCube);
    selectCube(newCube.id);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div
          className="cube-grid"
          role="grid"
          aria-label="큐브 그리드"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {sorted.map((cube) => (
            <SortableCubeCell key={cube.id} cube={cube} />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <button
              key={`empty-${i}`}
              type="button"
              role="gridcell"
              className="cube-cell is-empty"
              aria-label="새 큐브 추가"
              onClick={i === 0 ? handleAddCube : undefined}
              tabIndex={i === 0 ? 0 : -1}
              title={i === 0 ? '클릭하여 큐브 추가' : ''}
            >
              <span className="cube-empty">{i === 0 ? '＋' : ''}</span>
            </button>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCubeCell({ cube }: { cube: Cube }) {
  const cube_id = useEditor((s) => s.cube_id);
  const selectCube = useEditor((s) => s.selectCube);
  const selected = cube_id === cube.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cube.id,
  });

  // @dnd-kit attributes 중 role/aria-pressed 는 grid cell + 선택 상태 표기에 맞춰 자체 지정
  const { role: _dndRole, 'aria-pressed': _dndPressed, ...restAttrs } = attributes;
  void _dndRole;
  void _dndPressed;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      role="gridcell"
      className={`cube-cell ${selected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onClick={() => selectCube(selected ? null : cube.id)}
      aria-pressed={selected}
      title={`${cube.label} (${cube.action_type})`}
      {...restAttrs}
      {...listeners}
    >
      <span className="cube-label">{cube.label}</span>
      <span className="cube-action-badge">{cube.action_type}</span>
    </button>
  );
}

function Inspector() {
  const cube_id = useEditor((s) => s.cube_id);
  const pack = useEditor((s) => s.pack);
  const list_id = useEditor((s) => s.list_id);
  const upsertCube = useEditor((s) => s.upsertCube);
  const removeCube = useEditor((s) => s.removeCube);

  const cube =
    pack?.lists.find((l) => l.id === list_id)?.cubes.find((c) => c.id === cube_id) ?? null;

  if (!cube || !list_id) {
    return (
      <aside className="inspector" aria-label="큐브 인스펙터">
        <div className="inspector-empty">큐브를 선택하세요<br /><span className="muted">또는 빈 슬롯 ＋ 클릭으로 추가</span></div>
      </aside>
    );
  }

  function patch(next: Partial<Cube>): void {
    if (!cube || !list_id) return;
    upsertCube(list_id, { ...cube, ...next });
  }

  function handleDelete(): void {
    if (!cube || !list_id) return;
    if (!window.confirm(`"${cube.label}" 큐브를 삭제할까요?`)) return;
    removeCube(list_id, cube.id);
  }

  return (
    <aside className="inspector" aria-label="큐브 인스펙터">
      <h3 className="inspector-title">큐브 속성</h3>
      <dl className="inspector-fields">
        <dt>ID</dt>
        <dd className="muted">{cube.id}</dd>
        <dt>라벨</dt>
        <dd>
          <input
            type="text"
            value={cube.label}
            placeholder="(라벨)"
            onChange={(e) => patch({ label: e.target.value })}
          />
        </dd>
        <dt>액션 타입</dt>
        <dd>
          <select
            value={cube.action_type}
            onChange={(e) =>
              patch({
                action_type: e.target.value as Cube['action_type'],
                action_payload: defaultPayloadFor(e.target.value as Cube['action_type']),
              })
            }
          >
            <option value="link">link · 링크 열기</option>
            <option value="shortcut">shortcut · 단축키</option>
            <option value="macro">macro · 매크로</option>
            <option value="folder">folder · 폴더(서브덱)</option>
            <option value="text_insert">text_insert · 텍스트 삽입</option>
            <option value="clipboard_copy">clipboard_copy · 클립보드 복사</option>
            <option value="app_launch">app_launch · 앱 실행</option>
            <option value="focus_window">focus_window · 창 포커스</option>
            <option value="mouse_click">mouse_click · 마우스 클릭</option>
            <option value="plugin_action">plugin_action · 플러그인</option>
          </select>
        </dd>
        <dt>payload</dt>
        <dd className="muted">
          <code>{JSON.stringify(cube.action_payload)}</code>
        </dd>
      </dl>
      <div className="inspector-actions">
        <button type="button" className="btn-ghost btn-danger" onClick={handleDelete}>
          큐브 삭제
        </button>
      </div>
      <div className="inspector-hint">M3 단계: 액션 트레이트 + JSON Schema 동적 폼 (payload 편집)</div>
    </aside>
  );
}

/**
 * 액션 타입 변경 시 payload 기본값 — M3 에서 actions/ 폴더로 이전 예정.
 */
function defaultPayloadFor(type: Cube['action_type']): Record<string, unknown> {
  switch (type) {
    case 'link':
      return { url: '' };
    case 'shortcut':
      return { keys: [] };
    case 'macro':
      return { steps: [] };
    case 'folder':
      return { cube_ids: [] };
    case 'text_insert':
    case 'clipboard_copy':
      return { text: '' };
    case 'app_launch':
      return { path: '' };
    case 'focus_window':
      return { title_pattern: '' };
    case 'mouse_click':
      return { x: 0, y: 0, button: 'left', relative: false };
    case 'plugin_action':
      return { plugin_uuid: '', payload: {} };
  }
}
