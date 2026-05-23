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

import { useEffect, useState } from 'react';
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
import {
  ACTIONS,
  ACTION_CATEGORIES,
  defaultPayloadFor,
  type ActionCategory,
  type ActionSpec,
} from './lib/actions';
import { ActionPayloadForm } from './components/ActionPayloadForm';
import { describeExecuteError, executeCube, isTauri } from './lib/tauri-bridge';
import {
  buildPluginActionPayload,
  parseQualifiedId,
  QUALIFIED_PREFIX,
  usePluginRegistry,
} from './lib/plugin-registry';
import type { Cube, CubeList } from './types/cube';

export function App() {
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);
  const refreshPlugins = usePluginRegistry((s) => s.refresh);

  useEffect(() => {
    if (!pack) loadPack(buildDemoPack());
  }, [pack, loadPack]);

  useEffect(() => {
    void refreshPlugins();
  }, [refreshPlugins]);

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
  const installedPlugins = usePluginRegistry((s) => s.installed);
  const installPlugin = usePluginRegistry((s) => s.install);

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

  function handleInstallPlugin(): void {
    if (!isTauri()) {
      window.alert('플러그인 설치는 Tauri 환경에서만 가능합니다.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cubeplugin,application/zip';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const buf = await file.arrayBuffer();
        const manifest = await installPlugin(new Uint8Array(buf));
        window.alert(`설치 완료: ${manifest.name} v${manifest.version} (${manifest.actions.length} 액션)`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        window.alert(`플러그인 설치 실패: ${msg}`);
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
        <button
          type="button"
          className="btn-ghost"
          onClick={handleInstallPlugin}
          title={`.cubeplugin 설치 (현재 ${installedPlugins.length}개 설치됨)`}
        >
          + 플러그인
        </button>
        <button className="icon-btn" title="설정" aria-label="설정">⚙</button>
      </div>
    </header>
  );
}

function Sidebar() {
  const pluginActions = usePluginRegistry((s) => s.allActions());
  const installedPlugins = usePluginRegistry((s) => s.installed);
  const upsertCube = useEditor((s) => s.upsertCube);
  const selectCube = useEditor((s) => s.selectCube);
  const listId = useEditor((s) => s.list_id);
  const list = useEditor((s) => s.activeList());
  const [filter, setFilter] = useState<ActionCategory | null>(null);

  function addCube(partial: Pick<Cube, 'label' | 'action_type' | 'action_payload'>): void {
    if (!listId || !list) return;
    const maxSort = list.cubes.length === 0
      ? 0
      : Math.max(...list.cubes.map((c) => c.sort_order));
    const newCube: Cube = {
      id: crypto.randomUUID(),
      sort_order: maxSort + 1,
      icon_url: null,
      ...partial,
    };
    upsertCube(listId, newCube);
    selectCube(newCube.id);
  }

  const builtinFiltered = ACTIONS.filter(
    (a) => filter === null || a.category === filter,
  );
  const pluginFiltered = pluginActions.filter(
    (p) => filter === null || p.category === filter,
  );

  return (
    <aside className="sidebar" aria-label="액션 카탈로그">
      <div className="sidebar-section">
        <h3 className="sidebar-title">카테고리</h3>
        <ul className="category-list">
          <li className="category-item">
            <button
              type="button"
              className={`category-btn ${filter === null ? 'is-active' : ''}`}
              onClick={() => setFilter(null)}
            >
              전체
            </button>
          </li>
          {ACTION_CATEGORIES.map((c) => (
            <li key={c} className="category-item">
              <button
                type="button"
                className={`category-btn ${filter === c ? 'is-active' : ''}`}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">빌트인 액션 ({builtinFiltered.length})</h3>
        {builtinFiltered.length === 0 ? (
          <div className="sidebar-hint">해당 카테고리에 빌트인 액션 없음</div>
        ) : (
          <ul className="plugin-list">
            {builtinFiltered.map((spec: ActionSpec) => (
              <li key={spec.id} className="plugin-item">
                <button
                  className="plugin-btn"
                  type="button"
                  onClick={() =>
                    addCube({
                      label: spec.label,
                      action_type: spec.id,
                      action_payload: defaultPayloadFor(spec.id),
                    })
                  }
                  disabled={!listId}
                  title={`${spec.description}\n클릭 → 현재 리스트에 큐브 추가`}
                >
                  <span className="plugin-label">{spec.label}</span>
                  <span className="plugin-meta">
                    {spec.id} · T{spec.tier}
                    {spec.category ? ` · ${spec.category}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">
          플러그인 ({installedPlugins.length})
        </h3>
        {installedPlugins.length === 0 ? (
          <div className="sidebar-hint">
            상단 "+ 플러그인" 버튼으로 .cubeplugin 설치
          </div>
        ) : (
          <ul className="plugin-list">
            {pluginFiltered.map((entry) => (
              <li key={entry.qualified_id} className="plugin-item">
                <button
                  className="plugin-btn"
                  type="button"
                  onClick={() =>
                    addCube({
                      label: entry.label,
                      action_type: 'plugin_action',
                      action_payload: {
                        plugin_uuid: entry.package_id,
                        action_id: entry.action_id,
                        payload: { ...entry.default_payload },
                      },
                    })
                  }
                  title={`${entry.description ?? entry.action_type}\n${entry.package_id}/${entry.action_id}`}
                  disabled={!listId}
                >
                  <span className="plugin-label">{entry.label}</span>
                  <span className="plugin-meta">
                    {entry.package_id.split('.').slice(-1)[0]}
                    {entry.tier ? ` · T${entry.tier}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function GridArea() {
  const pack = useEditor((s) => s.pack);
  const listId = useEditor((s) => s.list_id);
  const list = pack?.lists.find((l) => l.id === listId) ?? null;
  const currentFolder = useEditor((s) => s.currentFolder());
  const visibleCubes = useEditor((s) => s.visibleCubes());
  const exitFolder = useEditor((s) => s.exitFolder);

  if (!list) {
    return (
      <main className="grid-area">
        <div className="grid-empty">리스트를 선택하세요</div>
      </main>
    );
  }

  return (
    <main className="grid-area">
      {currentFolder && (
        <div className="breadcrumb">
          <button type="button" className="btn-ghost" onClick={exitFolder} title="상위로">
            ↩ 상위
          </button>
          <span className="breadcrumb-path">
            {list.name} <span className="breadcrumb-sep">›</span> <strong>{currentFolder.label}</strong>
          </span>
        </div>
      )}
      <div className="grid-meta">
        <span>
          {currentFolder ? `${currentFolder.label} (폴더)` : list.name} · 큐브 {visibleCubes.length}개
        </span>
        <div className="grid-meta-actions">
          <button className="btn-ghost" type="button">이전 페이지</button>
          <button className="btn-ghost" type="button">다음 페이지</button>
        </div>
      </div>
      <CubeGrid list={list} visibleCubes={visibleCubes} />
      <div className="grid-hint">
        M7: folder 큐브 더블클릭 → 진입 · cube_ids 부분집합 표시 · "↩ 상위" 로 탈출
      </div>
    </main>
  );
}

function CubeGrid({ list, visibleCubes }: { list: CubeList; visibleCubes: Cube[] }) {
  const reorderCubes = useEditor((s) => s.reorderCubes);
  const upsertCube = useEditor((s) => s.upsertCube);
  const selectCube = useEditor((s) => s.selectCube);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const cols = list.cols ?? 5;
  const sorted = [...visibleCubes].sort((a, b) => a.sort_order - b.sort_order);
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
  const enterFolder = useEditor((s) => s.enterFolder);
  const selected = cube_id === cube.id;
  const isFolder = cube.action_type === 'folder';

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
      className={`cube-cell ${selected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${isFolder ? 'is-folder' : ''}`}
      onClick={() => selectCube(selected ? null : cube.id)}
      onDoubleClick={() => {
        if (isFolder) enterFolder(cube.id);
      }}
      aria-pressed={selected}
      title={`${cube.label} (${cube.action_type})${isFolder ? '\n더블클릭 → 진입' : ''}`}
      {...restAttrs}
      {...listeners}
    >
      <span className="cube-label">
        {isFolder ? '📁 ' : ''}{cube.label}
      </span>
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
  const pluginActions = usePluginRegistry((s) => s.allActions());

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
            value={inferSelectValue(cube)}
            onChange={(e) => handleActionTypeChange(e.target.value, patch, pluginActions)}
          >
            <optgroup label="빌트인">
              {ACTIONS.map((a) => (
                <option key={a.id} value={a.id}>{a.id} · {a.label}</option>
              ))}
            </optgroup>
            {pluginActions.length > 0 && (
              <optgroup label={`플러그인 (${pluginActions.length})`}>
                {pluginActions.map((p) => (
                  <option key={p.qualified_id} value={p.qualified_id}>
                    {p.package_id}/{p.action_id} · {p.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </dd>
      </dl>
      <ActionPayloadForm
        actionType={cube.action_type}
        value={cube.action_payload}
        onChange={(next) => patch({ action_payload: next })}
      />
      <div className="inspector-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            try {
              const r = await executeCube(cube);
              const env = isTauri() ? 'Tauri' : 'browser-dev';
              window.alert(`실행 OK · ${env} · ${r.elapsed_ms} ms`);
            } catch (err) {
              window.alert(describeExecuteError(err));
            }
          }}
          title={isTauri() ? 'PC 헬퍼로 실행' : '브라우저 dev — link 만 즉시, 나머지는 mock'}
        >
          ▶ 테스트 실행
        </button>
        <button type="button" className="btn-ghost btn-danger" onClick={handleDelete}>
          큐브 삭제
        </button>
      </div>
    </aside>
  );
}

/**
 * 큐브가 플러그인 액션인 경우 → qualified_id ("plugin:<pkg>:<id>") 표시.
 * 일반 빌트인은 그대로 action_type.
 */
function inferSelectValue(cube: Cube): string {
  if (cube.action_type === 'plugin_action') {
    const p = cube.action_payload as { plugin_uuid?: string; action_id?: string };
    if (p.plugin_uuid && p.action_id) {
      return `${QUALIFIED_PREFIX}${p.plugin_uuid}:${p.action_id}`;
    }
  }
  return cube.action_type;
}

function handleActionTypeChange(
  selected: string,
  patch: (next: Partial<Cube>) => void,
  pluginActions: ReturnType<typeof usePluginRegistry.getState>['installed'] extends never
    ? never
    : ReturnType<ReturnType<typeof usePluginRegistry.getState>['allActions']>,
): void {
  const parsed = parseQualifiedId(selected);
  if (parsed) {
    // 플러그인 액션 → action_type = 'plugin_action', payload = { plugin_uuid, action_id, payload }
    const entry = pluginActions.find((a) => a.qualified_id === selected);
    if (!entry) return;
    patch({
      action_type: 'plugin_action',
      action_payload: buildPluginActionPayload(entry),
    });
    return;
  }
  // 빌트인 액션 타입
  const builtin = selected as Cube['action_type'];
  patch({
    action_type: builtin,
    action_payload: defaultPayloadFor(builtin),
  });
}
