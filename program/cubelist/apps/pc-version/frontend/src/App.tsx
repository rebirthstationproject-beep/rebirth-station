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
import { useShallow } from 'zustand/react/shallow';
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
import { CubeIconUpload } from './components/CubeIconUpload';
import { GridLayoutModal } from './components/GridLayoutModal';
import { LocaleSwitcher } from './components/LocaleSwitcher';
import { useTranslation } from './lib/i18n/useTranslation';
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
      </footer>
    </div>
  );
}

function TopBar() {
  const { t } = useTranslation();
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
        <span className="brand">{t('app.title')}</span>
        <nav className="pack-tabs" aria-label={t('topbar.add_list')}>
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
          <button
            className="pack-tab is-add"
            type="button"
            title="곧 지원 예정 (수정 #2 단계)"
            disabled
            aria-disabled="true"
          >
            +
          </button>
        </nav>
      </div>
      <div className="topbar-right">
        <span className="pack-meta">{pack?.name ?? t('app.no_pack')}</span>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleImportClick}
          title=".cubepack"
        >
          {t('topbar.import')}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleExport}
          disabled={!pack}
          title=".cubepack"
        >
          {t('topbar.export')}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleInstallPlugin}
          title={`.cubeplugin (${installedPlugins.length})`}
        >
          {t('topbar.add_plugin')}
        </button>
        <LocaleSwitcher />
        <button className="icon-btn" title={t('app.settings')} aria-label={t('app.settings')}>⚙</button>
      </div>
    </header>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  const pluginActions = usePluginRegistry(useShallow((s) => s.allActions()));
  const installedPlugins = usePluginRegistry((s) => s.installed);
  const upsertCube = useEditor((s) => s.upsertCube);
  const selectCube = useEditor((s) => s.selectCube);
  const listId = useEditor((s) => s.list_id);
  const list = useEditor(useShallow((s) => s.activeList()));
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
    <aside className="sidebar" aria-label={t('sidebar.categories')}>
      <div className="sidebar-section">
        <h3 className="sidebar-title">{t('sidebar.categories')}</h3>
        <ul className="category-list">
          <li className="category-item">
            <button
              type="button"
              className={`category-btn ${filter === null ? 'is-active' : ''}`}
              onClick={() => setFilter(null)}
            >
              {t('sidebar.all')}
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
        <h3 className="sidebar-title">{t('sidebar.builtin')} ({builtinFiltered.length})</h3>
        {builtinFiltered.length === 0 ? (
          <div className="sidebar-hint">{t('sidebar.no_category_match')}</div>
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
          {t('sidebar.plugins')} ({installedPlugins.length})
        </h3>
        {installedPlugins.length === 0 ? (
          <div className="sidebar-hint">
            {t('sidebar.no_plugins')}
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
  const { t } = useTranslation();
  const pack = useEditor((s) => s.pack);
  const listId = useEditor((s) => s.list_id);
  const list = pack?.lists.find((l) => l.id === listId) ?? null;
  const currentFolder = useEditor(useShallow((s) => s.currentFolder()));
  const visibleCubes = useEditor(useShallow((s) => s.visibleCubes()));
  const scopedTotal = useEditor((s) => s.scopedCubes().length) // .length = 숫자, 안정;
  const totalPages = useEditor((s) => s.totalPages());
  const currentPage = useEditor((s) => s.current_page);
  const nextPage = useEditor((s) => s.nextPage);
  const prevPage = useEditor((s) => s.prevPage);
  const exitFolder = useEditor((s) => s.exitFolder);
  const setListLayout = useEditor((s) => s.setListLayout);
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);

  if (!list) {
    return (
      <main className="grid-area">
        <div className="grid-empty">{t('grid.select_list')}</div>
      </main>
    );
  }

  const hasPrev = currentPage > 0;
  const hasNext = currentPage + 1 < totalPages;

  return (
    <main className="grid-area">
      {currentFolder && (
        <div className="breadcrumb">
          <button type="button" className="btn-ghost" onClick={exitFolder} title={t('grid.exit_folder')}>
            {t('grid.exit_folder')}
          </button>
          <span className="breadcrumb-path">
            {list.name} <span className="breadcrumb-sep">›</span> <strong>{currentFolder.label}</strong>
          </span>
        </div>
      )}
      <div className="grid-meta">
        <span>
          {currentFolder ? `${currentFolder.label} (폴더)` : list.name} · 큐브 {scopedTotal}개
          {totalPages > 1 && (
            <span className="page-indicator"> · 페이지 {currentPage + 1}/{totalPages}</span>
          )}
        </span>
        <div className="grid-meta-actions">
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setLayoutModalOpen(true)}
            title="가로/세로 + cols 지정"
          >
            ⊞ 배치 설정
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={prevPage}
            disabled={!hasPrev}
            title="Page Up"
          >
            {t('grid.prev_page')}
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={nextPage}
            disabled={!hasNext}
            title="Page Down"
          >
            {t('grid.next_page')}
          </button>
        </div>
      </div>
      {layoutModalOpen && (
        <GridLayoutModal
          initialCols={list.cols ?? 4}
          initialPageSize={list.cubes_per_page ?? (list.cols ?? 4) * 7}
          onApply={(layout) => {
            setListLayout(list.id, layout);
            setLayoutModalOpen(false);
          }}
          onCancel={() => setLayoutModalOpen(false)}
        />
      )}
      <CubeGrid list={list} visibleCubes={visibleCubes} />
      <div className="grid-hint">
        M7: 폴더 진입 · 페이지네이션 (cubes_per_page 초과 자동 페이지) · 멀티액션 대기
      </div>
    </main>
  );
}

function CubeGrid({ list, visibleCubes }: { list: CubeList; visibleCubes: Cube[] }) {
  const addCubeAtSlot = useEditor((s) => s.addCubeAtSlot);
  const moveCubeToSlot = useEditor((s) => s.moveCubeToSlot);
  const currentPage = useEditor((s) => s.current_page);
  const pageSize = useEditor((s) => s.pageSize());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const cols = list.cols ?? 4;
  const startSlot = currentPage * pageSize + 1; // 1-based
  // 슬롯 N (페이지 안 1..pageSize) → 글로벌 sort_order (startSlot..endSlot)
  // 각 슬롯의 큐브 (있으면) lookup
  const cubeBySlot = new Map(visibleCubes.map((c) => [c.sort_order, c]));

  // 모든 슬롯 (글로벌 sort_order) — Sortable items 등록 (큐브 ID 또는 'empty-${slot}')
  const slotIds: string[] = [];
  for (let i = 0; i < pageSize; i++) {
    const globalSlot = startSlot + i;
    const cube = cubeBySlot.get(globalSlot);
    slotIds.push(cube ? cube.id : `empty-${globalSlot}`);
  }

  function handleDragEnd(e: DragEndEvent): void {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    // active 는 항상 큐브 (빈 슬롯은 드래그 불가)
    if (activeId.startsWith('empty-')) return;
    // over 가 빈 슬롯 → 큐브 이동
    if (overId.startsWith('empty-')) {
      const targetSlot = Number(overId.slice('empty-'.length));
      if (!Number.isFinite(targetSlot)) return;
      moveCubeToSlot(list.id, activeId, targetSlot);
      return;
    }
    // over 가 다른 큐브 → swap (moveCubeToSlot 가 swap 도 처리)
    const overCube = visibleCubes.find((c) => c.id === overId);
    if (overCube) {
      moveCubeToSlot(list.id, activeId, overCube.sort_order);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slotIds} strategy={rectSortingStrategy}>
        <div
          className="cube-grid"
          role="grid"
          aria-label="큐브 그리드"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {slotIds.map((id, idx) => {
            const globalSlot = startSlot + idx;
            const cube = cubeBySlot.get(globalSlot);
            if (cube) return <SortableCubeCell key={id} cube={cube} />;
            return (
              <EmptySlot
                key={id}
                slotId={id}
                slotIndex={globalSlot}
                onClick={() => addCubeAtSlot(list.id, globalSlot)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * 빈 슬롯 — Sortable droppable + 클릭 시 해당 슬롯에 큐브 즉시 생성 (수정 #2).
 */
function EmptySlot({
  slotId,
  slotIndex,
  onClick,
}: {
  slotId: string;
  slotIndex: number;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: slotId });
  return (
    <button
      ref={setNodeRef}
      type="button"
      role="gridcell"
      className={`cube-cell is-empty ${isOver ? 'is-drop-target' : ''}`}
      onClick={onClick}
      title={`슬롯 ${slotIndex} 에 큐브 추가 · 드래그로 큐브 이동 가능`}
      aria-label={`슬롯 ${slotIndex} (빈 슬롯)`}
    >
      <span className="cube-empty">＋</span>
      <span className="cube-slot-num">{slotIndex}</span>
    </button>
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
      className={`cube-cell ${selected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${isFolder ? 'is-folder' : ''} ${cube.icon_url ? 'has-icon' : ''}`}
      onClick={() => selectCube(selected ? null : cube.id)}
      onDoubleClick={() => {
        if (isFolder) enterFolder(cube.id);
      }}
      aria-pressed={selected}
      title={`${cube.label} (${cube.action_type})${isFolder ? '\n더블클릭 → 진입' : ''}`}
      {...restAttrs}
      {...listeners}
    >
      {cube.icon_url && (
        <div
          className="cube-icon-bg"
          style={{ backgroundImage: `url("${cube.icon_url}")` }}
          aria-hidden
        />
      )}
      <span className="cube-label">
        {isFolder ? '📁 ' : ''}{cube.label}
      </span>
      <span className="cube-action-badge">{cube.action_type}</span>
    </button>
  );
}

function Inspector() {
  const { t } = useTranslation();
  const cube_id = useEditor((s) => s.cube_id);
  const pack = useEditor((s) => s.pack);
  const list_id = useEditor((s) => s.list_id);
  const upsertCube = useEditor((s) => s.upsertCube);
  const removeCube = useEditor((s) => s.removeCube);
  const pluginActions = usePluginRegistry(useShallow((s) => s.allActions()));

  const cube =
    pack?.lists.find((l) => l.id === list_id)?.cubes.find((c) => c.id === cube_id) ?? null;

  if (!cube || !list_id) {
    return (
      <aside className="inspector">
        <div className="inspector-empty">
          {t('inspector.empty')}
          <br /><span className="muted">{t('inspector.empty_hint')}</span>
        </div>
      </aside>
    );
  }

  function patch(next: Partial<Cube>): void {
    if (!cube || !list_id) return;
    upsertCube(list_id, { ...cube, ...next });
  }

  function handleDelete(): void {
    if (!cube || !list_id) return;
    if (!window.confirm(`"${cube.label}" — ${t('inspector.delete_confirm')}`)) return;
    removeCube(list_id, cube.id);
  }

  return (
    <aside className="inspector" aria-label="큐브 인스펙터">
      <CubeIconUpload
        iconUrl={cube.icon_url}
        label={cube.label}
        onChange={(next) => patch({ icon_url: next })}
      />
      <h3 className="inspector-title">{t('inspector.label')}</h3>
      <dl className="inspector-fields">
        <dt>ID</dt>
        <dd className="muted">{cube.id}</dd>
        <dt>{t('inspector.label')}</dt>
        <dd>
          <input
            type="text"
            value={cube.label}
            placeholder={t('inspector.label')}
            onChange={(e) => patch({ label: e.target.value })}
          />
        </dd>
        <dt>{t('inspector.action_type')}</dt>
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
          {t('inspector.test_run')}
        </button>
        <button type="button" className="btn-ghost btn-danger" onClick={handleDelete}>
          {t('inspector.delete')}
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
