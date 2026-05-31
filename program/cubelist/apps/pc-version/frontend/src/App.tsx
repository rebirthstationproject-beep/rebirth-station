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

import { useEffect, useRef, useState } from 'react';
import * as React from 'react';
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
import { loadLibraryFromDir } from './lib/library-loader';
import { useDynamicCubes } from './lib/useDynamicCubes';
import {
  PluginActionsBackground,
  PluginPropertyInspector,
  fireCubeKey,
  getCubeRuntimeStatus,
} from './components/PluginRunnerHost';
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

type MainTab = 'cube-maker' | 'list-maker';

const PACK_STORAGE_KEY = 'cubelist:last_pack';
const LIBRARY_DIR_KEY = 'cubelist:library_dir';
/** 최초 부팅 시 사용할 기본 라이브러리 경로 — 폴더 존재 시 자동 등록 */
const DEFAULT_LIBRARY_DIR = 'C:\\Users\\PC\\Downloads\\플러그인\\CUBE';

export function App() {
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);
  const draftList = useEditor((s) => s.draft_list);
  const refreshPlugins = usePluginRegistry((s) => s.refresh);
  const [mainTab, setMainTab] = useState<MainTab>('cube-maker');

  // draft 가 새로 생성되면 큐브 리스트 만들기 탭으로 자동 전환 (워크플로우 자동화)
  useEffect(() => {
    if (draftList) setMainTab('list-maker');
  }, [draftList?.id]);

  // M4 E: 윈도우 focus 시 라이브러리 자동 reload (plugin 추가/삭제 감지)
  useEffect(() => {
    if (!isTauri()) return;
    function onFocus(): void {
      const libDir = window.localStorage.getItem(LIBRARY_DIR_KEY);
      if (!libDir) return;
      void (async () => {
        try {
          const refreshed = await loadLibraryFromDir(libDir);
          useEditor.getState().loadPack(refreshed);
        } catch {
          /* focus 마다 silent — 첫 부팅 시 이미 로드됨 */
        }
      })();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // 부팅 시 우선순위: 라이브러리 폴더 → localStorage cubepack → 데모
  useEffect(() => {
    if (pack) return;
    let cancelled = false;
    (async () => {
      // 1. 등록된 라이브러리 폴더 (Tauri 환경 한정)
      let libDir = window.localStorage.getItem(LIBRARY_DIR_KEY);
      // 최초 부팅 시 DEFAULT 경로 자동 시도 — 존재하면 자동 등록
      if (!libDir && isTauri()) {
        libDir = DEFAULT_LIBRARY_DIR;
      }
      if (libDir && isTauri()) {
        try {
          // M4 Step 2.2: Rust state 에 library_dir 등록 (cubelist-plugin:// 핸들러 사용)
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('set_library_dir_state', { libraryDir: libDir });
          } catch (e) {
            console.warn('[boot] set_library_dir_state 실패', e);
          }
          const libPack = await loadLibraryFromDir(libDir);
          // 성공 시 자동 등록 (사용자 명시 등록과 동일하게 영구 저장)
          window.localStorage.setItem(LIBRARY_DIR_KEY, libDir);
          if (!cancelled) loadPack(libPack);
          return;
        } catch (e) {
          console.warn('[boot] 라이브러리 폴더 로드 실패 — last_pack 폴백', e);
        }
      }
      // 2. 마지막 큐브팩 (가져오기 캐시 또는 직접 편집)
      try {
        const stored = window.localStorage.getItem(PACK_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && Array.isArray(parsed.lists)) {
            if (!cancelled) loadPack(parsed);
            return;
          }
        }
      } catch {
        /* 손상된 localStorage 는 무시 */
      }
      // 3. 데모 큐브팩
      if (!cancelled) loadPack(buildDemoPack());
    })();
    return () => {
      cancelled = true;
    };
  }, [pack, loadPack]);

  // pack 변경 시 localStorage 동기 (200 ms debounce — 빈번한 큐브 편집 대비)
  useEffect(() => {
    if (!pack) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(PACK_STORAGE_KEY, JSON.stringify(pack));
      } catch (e) {
        // QuotaExceededError 등 — 무시
        console.warn('[cubelist] localStorage 저장 실패', e);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [pack]);

  useEffect(() => {
    void refreshPlugins();
  }, [refreshPlugins]);

  return (
    <div className="app">
      <TopBar />
      <div className="workspace">
        <Sidebar />
        <main className="center-area">
          <MainTabBar activeTab={mainTab} onChange={setMainTab} />
          {mainTab === 'list-maker' ? <ListMakerCenter /> : <CubeMakerCenter />}
        </main>
        <Inspector />
      </div>
      {/* M4: plugin_action 큐브들 백그라운드 runtime (보이지 않는 iframe + JS 실행) */}
      <PluginActionsBackground />
    </div>
  );
}

function MainTabBar({ activeTab, onChange }: { activeTab: MainTab; onChange: (t: MainTab) => void }) {
  const activeList = useEditor(useShallow((s) => s.activeList()));
  const startListMaker = useEditor((s) => s.startListMaker);
  const cancelListMaker = useEditor((s) => s.cancelListMaker);
  const listMakerActive = useEditor((s) => s.list_maker_active);
  const listMakerSelection = useEditor(useShallow((s) => s.list_maker_selection));
  const finishListMaker = useEditor((s) => s.finishListMaker);
  const addLibraryCube = useEditor((s) => s.addLibraryCube);

  function handleFolderImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    (input as HTMLInputElement & { webkitdirectory?: boolean }).webkitdirectory = true;
    input.multiple = true;
    input.onchange = () => {
      const files = input.files;
      if (!files || files.length === 0) return;
      const folderSet = new Set<string>();
      Array.from(files).forEach((f) => {
        const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath ?? f.name;
        const label = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? f.name;
        addLibraryCube({
          label,
          action_type: 'app_launch',
          action_payload: { path, args: [] },
          metadata: { source: 'folder-import', original_path: path },
        });
        const folderPath = path.split('/').slice(0, -1).join('/');
        if (folderPath) folderSet.add(folderPath);
      });
      window.alert(`${files.length}개 파일을 라이브러리에 추가했습니다.`);
    };
    input.click();
  }

  async function handleSaveActiveList(): Promise<void> {
    if (!activeList) {
      window.alert('저장할 리스트가 선택되지 않았습니다.');
      return;
    }
    const libraryDir = window.localStorage.getItem('cubelist:library_dir') ?? '';
    try {
      const { saveCubelistToLibrary, computePageCount } = await import('./lib/cubepack-io');
      const pages = computePageCount(activeList);
      if (libraryDir) {
        const { path, ext } = await saveCubelistToLibrary(activeList, libraryDir);
        window.alert(
          `저장 완료 (${pages}페이지 → .${ext})\n경로: ${path}\n좌측 사이드바에서 자동 갱신됩니다.`,
        );
        // 라이브러리 폴더에서 다시 로드 → 새 파일 반영 + draft clear
        const { loadLibraryFromDir } = await import('./lib/library-loader');
        const refreshed = await loadLibraryFromDir(libraryDir);
        useEditor.getState().loadPack(refreshed);
        useEditor.getState().setDraftList(null);
      } else {
        const { downloadCubelist } = await import('./lib/cubepack-io');
        await downloadCubelist(activeList);
        window.alert(
          `라이브러리 폴더 미등록 — 다운로드 폴더에 ${pages >= 2 ? '.cubedeck' : '.cubelist'} 파일 저장됨. 우상단 📁 폴더 등록 후 다음 부팅 시 자동 로드.`,
        );
      }
    } catch (e) {
      window.alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleFinishListMaker(): void {
    if (listMakerSelection.length === 0) {
      window.alert('큐브를 1개 이상 선택하세요.');
      return;
    }
    const name = window.prompt('새 리스트 이름:', '새 리스트');
    if (name && name.trim()) finishListMaker(name.trim());
  }

  return (
    <nav className="main-tab-bar" aria-label="메인 탭">
      <button
        type="button"
        className={`main-tab ${activeTab === 'cube-maker' ? 'is-active' : ''}`}
        onClick={() => onChange('cube-maker')}
        aria-pressed={activeTab === 'cube-maker'}
      >
        큐브 만들기
      </button>
      <button
        type="button"
        className={`main-tab ${activeTab === 'list-maker' ? 'is-active' : ''}`}
        onClick={() => onChange('list-maker')}
        aria-pressed={activeTab === 'list-maker'}
      >
        큐브 리스트 만들기
      </button>
      <div className="main-tab-spacer" />
      {activeTab === 'cube-maker' && !listMakerActive && (
        <>
          <button type="button" className="btn-ghost" onClick={handleFolderImport}>
            폴더 불러오기
          </button>
          <button type="button" className="btn-ghost" onClick={() => startListMaker()}>
            리스트 만들기
          </button>
        </>
      )}
      {activeTab === 'cube-maker' && listMakerActive && (
        <>
          <span className="list-maker-status">선택 {listMakerSelection.length}개</span>
          <button type="button" className="btn-ghost" onClick={cancelListMaker}>
            취소
          </button>
          <button type="button" className="btn-ghost btn-primary" onClick={handleFinishListMaker}>
            완료
          </button>
        </>
      )}
      {activeTab === 'list-maker' && (
        <button
          type="button"
          className="btn-ghost btn-primary"
          onClick={handleSaveActiveList}
          disabled={!activeList || activeList.cubes.length === 0}
          title={!activeList ? '먼저 큐브 만들기에서 리스트 생성' : ''}
        >
          저장
        </button>
      )}
    </nav>
  );
}

/**
 * 큐브 리스트 만들기 가운데 영역 — 페이지 탭 + GridArea (기존).
 */
/**
 * 큐브 리스트 만들기 = draft_list 만 표시.
 * draft 가 없으면 빈 안내. draft 가 있으면 PageTabs (draft 페이지 1, 2, 3...) + GridArea.
 */
function ListMakerCenter() {
  const draftList = useEditor((s) => s.draft_list);
  const selectList = useEditor((s) => s.selectList);
  const list_id = useEditor((s) => s.list_id);

  // draft 가 있는데 list_id 가 draft.id 아니면 강제 활성 (페이지 전환 동기)
  useEffect(() => {
    if (draftList && list_id !== draftList.id) {
      selectList(draftList.id);
    }
  }, [draftList?.id, list_id, selectList]);

  if (!draftList) {
    return (
      <div className="list-maker-empty">
        <h3>큐브 리스트 비어 있음</h3>
        <p className="muted">
          큐브 만들기 탭 → 라이브러리 큐브 선택 → 우상단 <strong>리스트 만들기</strong> 클릭
        </p>
        <p className="muted small">완료 시 자동으로 이 페이지로 이동하여 배치 + 저장합니다.</p>
      </div>
    );
  }

  return (
    <>
      <DraftPageTabs />
      <GridArea />
    </>
  );
}

/** draft 의 페이지 탭 — sort_order 기준 페이지 수 자동 계산 */
function DraftPageTabs() {
  const draft = useEditor((s) => s.draft_list);
  const currentPage = useEditor((s) => s.current_page);
  const setPage = useEditor((s) => s.setPage);
  if (!draft) return null;
  const pageSize = draft.cubes_per_page ?? 28;
  const maxSort = draft.cubes.length === 0 ? 0 : Math.max(...draft.cubes.map((c) => c.sort_order));
  const totalPages = Math.max(1, Math.ceil(maxSort / pageSize));
  return (
    <nav className="page-tabs" aria-label="draft 페이지">
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`page-tab ${currentPage === i ? 'is-active' : ''}`}
          onClick={() => setPage(i)}
        >
          {i + 1}페이지
        </button>
      ))}
      <button
        type="button"
        className="page-tab is-add"
        title="다음 페이지 (큐브 추가 시 자동 확장)"
        onClick={() => setPage(totalPages)}
      >
        +
      </button>
    </nav>
  );
}

/**
 * 큐브 만들기 가운데 영역 (Phase 2b).
 * - 라이브러리 큐브 그리드 (어플 아이콘 모양)
 * - "+ 새 큐브" 버튼 (Inspector 에서 편집)
 * - "📁 폴더 불러오기" — 폴더 + 하위 폴더 재귀 → 각 파일을 라이브러리 큐브로 자동 생성
 * - "📋 리스트 만들기" — 큐브 순차 선택 모드 (Phase 3) → 완료 시 모달 → 새 페이지(리스트)
 */
function CubeMakerCenter() {
  const pack = useEditor((s) => s.pack);
  const activeList = useEditor(useShallow((s) => s.activeList()));
  const libraryCubes = pack?.cubes ?? [];
  const librarySelectedId = useEditor((s) => s.library_selected_id);
  const selectLibraryCube = useEditor((s) => s.selectLibraryCube);
  const addLibraryCube = useEditor((s) => s.addLibraryCube);
  const addCubeAtSlot = useEditor((s) => s.addCubeAtSlot);
  const selectCube = useEditor((s) => s.selectCube);

  const listMakerActive = useEditor((s) => s.list_maker_active);
  const listMakerSelection = useEditor(useShallow((s) => s.list_maker_selection));
  const toggleListMakerSelection = useEditor((s) => s.toggleListMakerSelection);
  const finishListMaker = useEditor((s) => s.finishListMaker);

  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // 다중 선택 완료 후 모달 트리거는 MainTabBar 의 prompt 로 대체. saveModal 은 추후 풀-기능 시.
  void saveModalOpen;
  void setSaveModalOpen;
  void finishListMaker;

  function handleClickCube(cubeId: string): void {
    if (listMakerActive) {
      toggleListMakerSelection(cubeId);
    } else {
      selectLibraryCube(librarySelectedId === cubeId ? null : cubeId);
      selectCube(cubeId);
    }
  }

  function handleAddNewCube(): void {
    if (activeList) {
      const usedSlots = new Set(activeList.cubes.map((c) => c.sort_order));
      let slot = 1;
      while (usedSlots.has(slot)) slot++;
      addCubeAtSlot(activeList.id, slot);
    } else {
      addLibraryCube();
    }
  }

  const selectList = useEditor((s) => s.selectList);
  const draftList = useEditor((s) => s.draft_list);
  // 큐브 만들기 그리드 표시 큐브 = 현재 활성 리스트의 cubes (sort_order 순)
  const listCubes = activeList?.cubes ?? [];
  const cubesToShow = listCubes.length > 0 ? listCubes : libraryCubes;
  const cols = activeList?.cols ?? 4;
  // draft 가 활성이면 큐브 만들기 페이지는 "전체" 폴더 그리드로 폴백 (draft 는 큐브 리스트 만들기 페이지 전용)
  const isAllMode = activeList === null || (!!draftList && activeList?.id === draftList.id);
  const lists = pack?.lists ?? [];

  // "전체" 모드: 각 리스트(폴더)를 큐브 셀처럼 표시
  if (isAllMode) {
    return (
      <>
        <PageTabs />
        {lists.length === 0 ? (
          <div className="cube-maker-empty">
            <p>큐브 리스트가 없습니다.</p>
            <p className="muted small">우상단 📁 폴더 등록하거나 + 로 새 리스트 추가</p>
          </div>
        ) : (
          <div
            className="cube-grid"
            style={{ gridTemplateColumns: `repeat(auto-fill, 112px)`, padding: '16px' }}
          >
            {lists.map((list) => {
              const folderIcon = list.cubes[0]?.icon_url ?? null;
              return (
                <button
                  key={list.id}
                  type="button"
                  className={`cube-cell folder-cell ${folderIcon ? 'has-icon' : ''}`}
                  onClick={() => selectList(list.id)}
                  title={`${list.name} · ${list.cubes.length} 큐브`}
                >
                  <div
                    className="cube-icon-bg"
                    style={folderIcon ? { backgroundImage: `url("${folderIcon}")` } : undefined}
                    aria-hidden
                  >
                    {!folderIcon && <span className="folder-cell-emoji">📁</span>}
                  </div>
                  <span className="cube-label">{list.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <PageTabs />

      {cubesToShow.length === 0 ? (
        <div className="cube-maker-empty">
          <p>큐브가 없습니다.</p>
          <p className="muted small">＋ 새 큐브 또는 📁 폴더 불러오기로 큐브 추가</p>
          <button type="button" className="btn-ghost" onClick={handleAddNewCube}>
            ＋ 첫 큐브 추가
          </button>
        </div>
      ) : (
        <div
          className="cube-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 112px))`, padding: '16px' }}
        >
          {/* 첫 셀: + 새 큐브 추가 */}
          <button
            type="button"
            className="cube-cell cube-cell-add"
            onClick={handleAddNewCube}
            title="＋ 새 큐브 추가"
            aria-label="새 큐브 추가"
          >
            <div className="cube-icon-bg">
              <span className="cube-cell-add-plus">＋</span>
            </div>
            <span className="cube-label">새 큐브</span>
          </button>
          {cubesToShow.map((cube) => {
            const selectionIdx = listMakerSelection.indexOf(cube.id);
            const isSelected = librarySelectedId === cube.id;
            const inSelection = selectionIdx !== -1;
            const hasIcon = !!cube.icon_url;
            const iconMeta = (cube.metadata ?? {}) as Record<string, unknown>;
            const isTinyIcon = iconMeta.icon_is_tiny === true;
            const isPlaceholderIcon = !hasIcon || iconMeta.icon_is_placeholder === true;
            const placeholderLetter = (cube.label || '?').trim().charAt(0).toUpperCase();
            return (
              <button
                key={cube.id}
                type="button"
                className={`cube-cell ${hasIcon ? 'has-icon' : ''} ${isSelected ? 'is-selected' : ''} ${inSelection ? 'is-in-selection' : ''} ${isTinyIcon ? 'icon-tiny' : ''} ${isPlaceholderIcon ? 'icon-placeholder' : ''}`}
                onClick={() => handleClickCube(cube.id)}
                title={`${cube.label} (${cube.action_type})`}
              >
                {hasIcon && !isPlaceholderIcon ? (
                  <div
                    className="cube-icon-bg"
                    style={{ backgroundImage: `url("${cube.icon_url}")` }}
                    aria-hidden
                  />
                ) : (
                  <div
                    className="cube-icon-bg"
                    data-placeholder-letter={placeholderLetter}
                    aria-hidden
                  />
                )}
                <span className="cube-label">{cube.label}</span>
                <span className="cube-action-badge">{cube.action_type}</span>
                {inSelection && <span className="library-cube-order">{selectionIdx + 1}</span>}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * 페이지 탭 (큐브 리스트 페이지 = pack.lists).
 * 첫 탭 = "전체" (selectList(null) — 폴더 그리드 모드)
 * 가로 스크롤 + 마우스 드래그 + 휠 ↔ 변환 지원.
 */
function PageTabs() {
  const pack = useEditor((s) => s.pack);
  const activeListId = useEditor((s) => s.list_id);
  const selectList = useEditor((s) => s.selectList);
  const addList = useEditor((s) => s.addList);
  const renameList = useEditor((s) => s.renameList);
  const scrollRef = useRef<HTMLElement>(null);

  function handleRename(listId: string, current: string): void {
    const next = window.prompt('페이지(리스트) 이름:', current);
    if (next && next.trim().length > 0) renameList(listId, next.trim());
  }

  // 세로 휠 → 가로 스크롤 변환 (드래그 핸들러 제거, click 보장)
  function onWheel(e: React.WheelEvent<HTMLElement>): void {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }

  return (
    <nav
      ref={scrollRef}
      className="page-tabs"
      aria-label="페이지 (리스트)"
      onWheel={onWheel}
    >
      <button
        type="button"
        className={`page-tab page-tab-all ${activeListId === null ? 'is-active' : ''}`}
        onClick={() => selectList(null)}
        aria-pressed={activeListId === null}
        title="전체 폴더 그리드"
      >
        전체
      </button>
      {pack?.lists.map((l) => (
        <button
          key={l.id}
          type="button"
          className={`page-tab ${activeListId === l.id ? 'is-active' : ''}`}
          onClick={() => selectList(l.id)}
          onDoubleClick={() => handleRename(l.id, l.name)}
          aria-pressed={activeListId === l.id}
          title={`${l.name} (더블클릭하여 이름 수정)`}
        >
          {l.name}
        </button>
      ))}
      <button
        className="page-tab is-add"
        type="button"
        title="페이지(리스트) 추가"
        onClick={() => addList()}
      >
        +
      </button>
    </nav>
  );
}

function TopBar() {
  const { t } = useTranslation();
  const pack = useEditor((s) => s.pack);
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

  async function handleSetLibraryDir(): Promise<void> {
    const current = window.localStorage.getItem(LIBRARY_DIR_KEY) ?? '';
    const next = window.prompt(
      '라이브러리 폴더 경로 (모든 .cubeone / .cubelist / .cubepack 자동 로드)',
      current,
    );
    if (next === null) return; // 취소
    const trimmed = next.trim();
    if (trimmed.length === 0) {
      window.localStorage.removeItem(LIBRARY_DIR_KEY);
      window.alert('라이브러리 폴더 해제됨. 다음 시작 시 데모로 복귀합니다.');
      return;
    }
    if (!isTauri()) {
      window.alert('라이브러리 폴더 자동 로드는 PC 앱 (Tauri) 에서만 동작합니다.');
      return;
    }
    try {
      // M4: Rust state 등록
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_library_dir_state', { libraryDir: trimmed });
      } catch (e) {
        console.warn('[handleSetLibraryDir] set_library_dir_state 실패', e);
      }
      const libPack = await loadLibraryFromDir(trimmed);
      window.localStorage.setItem(LIBRARY_DIR_KEY, trimmed);
      loadPack(libPack);
      const cubeCount = libPack.lists.reduce((a, l) => a + l.cubes.length, 0);
      window.alert(`라이브러리 로드 완료: ${libPack.lists.length} 큐브리스트 · ${cubeCount} 큐브`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      window.alert(`라이브러리 폴더 로드 실패: ${msg}`);
    }
  }

  async function handleAddPlugin(): Promise<void> {
    const libraryDir = window.localStorage.getItem('cubelist:library_dir') ?? '';
    if (!libraryDir) {
      window.alert('먼저 우상단 📁 폴더로 라이브러리 폴더를 등록하세요.');
      return;
    }
    if (!isTauri()) {
      window.alert('PC 앱 (Tauri) 환경에서만 변환 가능합니다.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    // WebView2 file dialog 가 사용자 정의 확장자 (.streamDeckPlugin) 인식 안 함 → 모든 파일 표시
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) return;
      // .streamDeckPlugin 만 처리 (다른 파일은 경고)
      const plugins = Array.from(files).filter((f) => /\.streamDeckPlugin$/i.test(f.name));
      const skipped = Array.from(files).filter((f) => !/\.streamDeckPlugin$/i.test(f.name));
      if (plugins.length === 0) {
        window.alert(
          `.streamDeckPlugin 파일이 선택되지 않았습니다.\n선택된 파일:\n${Array.from(files).map((f) => f.name).join('\n')}`,
        );
        return;
      }
      const { convertPlugin } = await import('./lib/plugin-converter');
      const { invoke } = await import('@tauri-apps/api/core');
      const results: string[] = [];
      const errors: string[] = [];
      if (skipped.length > 0) {
        for (const f of skipped) errors.push(`${f.name}: .streamDeckPlugin 아님 — 건너뜀`);
      }
      for (const file of plugins) {
        try {
          const buf = await file.arrayBuffer();
          const result = await convertPlugin(buf, file.name);
          // 1) .cubeone 큐브 파일들
          for (const cube of result.cubes) {
            await invoke('write_library_file', {
              libraryDir,
              folder: result.folderName,
              filename: cube.filename,
              bytes: Array.from(cube.bytes),
            });
          }
          // 2) M4: plugin 자산 ZIP 통째 _plugins/<plugin_id>/ 안에 풀기 (HTML/JS/이미지/사운드)
          try {
            await invoke('write_plugin_zip', {
              libraryDir,
              pluginId: result.pluginId,
              zipBytes: Array.from(new Uint8Array(buf)),
            });
          } catch (e) {
            errors.push(`${result.pluginName}: plugin 자산 풀기 실패 — ${e instanceof Error ? e.message : String(e)}`);
          }
          const tag = result.fallback ? '(en.json fallback)' : '';
          results.push(
            `✓ ${result.pluginName}: ${result.cubes.length} 큐브 + 자산 _plugins/${result.pluginId}/ ${tag}`,
          );
          if (result.warnings.length > 0) {
            for (const w of result.warnings) errors.push(`${result.pluginName}: ${w}`);
          }
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      const summary =
        `${plugins.length}개 플러그인 변환 완료\n\n` +
        `[성공]\n${results.join('\n') || '없음'}\n\n` +
        (errors.length > 0 ? `[경고/오류]\n${errors.join('\n')}\n\n` : '') +
        `확인 클릭 시 앱을 새로고침해서 새 폴더가 반영됩니다.`;
      window.alert(summary);
      // 새 폴더 반영 위해 frontend 전체 reload (부팅 시 자동 라이브러리 로드 활용)
      window.location.reload();
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
        <button
          type="button"
          className="btn-ghost"
          onClick={handleAddPlugin}
          title="StreamDeck 플러그인(.streamDeckPlugin) → 폴더 + .cubeone 자동 변환 후 라이브러리에 추가"
        >
          📥 플러그인 변환
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={handleSetLibraryDir}
          title="라이브러리 폴더 자동 로드 (등록 1회, 다음 부팅부터 자동 불러오기)"
        >
          📁 폴더
        </button>
        <LocaleSwitcher />
        <button className="icon-btn" title={t('app.settings')} aria-label={t('app.settings')}>⚙</button>
      </div>
    </header>
  );
}

function Sidebar() {
  const pack = useEditor((s) => s.pack);
  const activeListId = useEditor((s) => s.list_id);
  const selectedCubeId = useEditor((s) => s.cube_id);
  const selectList = useEditor((s) => s.selectList);
  const selectCubeFn = useEditor((s) => s.selectCube);
  const lists = pack?.lists ?? [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const libDir = typeof window !== 'undefined'
    ? window.localStorage.getItem('cubelist:library_dir') ?? ''
    : '';
  const libDirShort = libDir
    ? (libDir.split(/[\\/]/).filter(Boolean).slice(-2).join('/') || libDir)
    : '(폴더 미등록)';

  // activeListId 변경 시 recent 갱신을 따라가기
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('cubelist:recent_lists') ?? '[]';
      setRecentIds(JSON.parse(raw));
    } catch {
      setRecentIds([]);
    }
  }, [activeListId]);

  function toggleExpand(id: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const recentLists = recentIds
    .map((id) => lists.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => l != null)
    .slice(0, 6);

  // 라이브러리 검색 필터 (v0.1.1 신규)
  const [filterText, setFilterText] = useState('');
  const filterLower = filterText.trim().toLowerCase();
  const filteredLists = filterLower.length === 0
    ? lists
    : lists.filter((list) =>
        list.name.toLowerCase().includes(filterLower) ||
        list.cubes.some((c) => c.label.toLowerCase().includes(filterLower))
      );
  // 검색 시 자동 펼치기 (큐브 매칭 결과 보이게)
  const autoExpand = filterLower.length > 0
    ? new Set(filteredLists.map((l) => l.id))
    : expanded;

  return (
    <aside className="sidebar sidebar-tree" aria-label="라이브러리 트리">
      <div className="sidebar-path" title={libDir}>
        <span className="path-icon">📁</span>
        <span className="path-text">{libDirShort}</span>
      </div>
      <div className="sidebar-filter">
        <input
          type="search"
          className="sidebar-filter-input"
          placeholder="🔍 큐브 리스트·큐브 검색"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          aria-label="라이브러리 검색"
        />
        {filterText.length > 0 && (
          <button
            type="button"
            className="sidebar-filter-clear"
            onClick={() => setFilterText('')}
            aria-label="검색 초기화"
            title="초기화"
          >
            ×
          </button>
        )}
      </div>
      {/* 상단: 폴더 트리 */}
      <div className="sidebar-tree-body sidebar-section-top">
        <button
          type="button"
          className={`tree-folder tree-folder-root ${activeListId === null ? 'is-active' : ''}`}
          onClick={() => selectList(null)}
        >
          <span className="tree-icon">📂</span>
          <span className="tree-label">전체</span>
          <span className="tree-count">({lists.length})</span>
        </button>
        {filteredLists.map((list) => {
          const isExpanded = autoExpand.has(list.id);
          return (
            <div key={list.id} className="tree-folder-group">
              <button
                type="button"
                className={`tree-folder ${activeListId === list.id ? 'is-active' : ''}`}
                onClick={() => selectList(list.id)}
              >
                <span
                  className="tree-arrow"
                  onClick={(e) => { e.stopPropagation(); toggleExpand(list.id); }}
                  role="button"
                  aria-label="펼치기"
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="tree-icon">📁</span>
                <span className="tree-label">{list.name}</span>
                <span className="tree-count">({list.cubes.length})</span>
              </button>
              {isExpanded && (
                <ul className="tree-cube-list">
                  {list.cubes
                    .filter((c) =>
                      filterLower.length === 0
                        ? true
                        : c.label.toLowerCase().includes(filterLower) ||
                          list.name.toLowerCase().includes(filterLower)
                    )
                    .map((cube) => (
                      <li key={cube.id}>
                        <button
                          type="button"
                          className={`tree-cube ${selectedCubeId === cube.id ? 'is-active' : ''}`}
                          onClick={() => {
                            selectList(list.id);
                            selectCubeFn(cube.id);
                          }}
                          title={`${cube.label} (${cube.action_type})`}
                        >
                          <span className="tree-icon-cube">▫</span>
                          <span className="tree-label">{cube.label}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {/* 하단: 최근 리스트 */}
      <div className="sidebar-section-bottom">
        <div className="sidebar-section-title">최근 리스트</div>
        {recentLists.length === 0 ? (
          <div className="sidebar-recent-empty">아직 작업한 리스트가 없습니다</div>
        ) : (
          <ul className="recent-list">
            {recentLists.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  className={`recent-item ${activeListId === list.id ? 'is-active' : ''}`}
                  onClick={() => selectList(list.id)}
                  title={`${list.name} · ${list.cubes.length} 큐브`}
                >
                  <span className="recent-icon">📋</span>
                  <span className="recent-label">{list.name}</span>
                  <span className="recent-count">{list.cubes.length}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

// @ts-expect-error: 구 카탈로그 Sidebar — 라이브러리 트리로 대체, 향후 인스펙터 통합 시 부활 가능
function _LegacySidebar() {
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
  // 동적 큐브 (live_clock/timer/gauge/battery) 1초 tick
  const dynamicUpdates = useDynamicCubes(visibleCubes);
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
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 112px))` }}
        >
          {slotIds.map((id, idx) => {
            const globalSlot = startSlot + idx;
            const cube = cubeBySlot.get(globalSlot);
            if (cube) {
              const dyn = dynamicUpdates.get(cube.id);
              const displayCube = dyn
                ? { ...cube, label: dyn.label ?? cube.label, icon_url: dyn.icon_url ?? cube.icon_url }
                : cube;
              return <SortableCubeCell key={id} cube={displayCube} />;
            }
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
  // StreamDeck 아이콘 가시화 분기
  const iconMeta = (cube.metadata ?? {}) as Record<string, unknown>;
  const isTinyIcon = iconMeta.icon_is_tiny === true;
  const isPlaceholderIcon = !cube.icon_url || iconMeta.icon_is_placeholder === true;
  const placeholderLetter = (cube.label || '?').trim().charAt(0).toUpperCase();

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
      className={`cube-cell ${selected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${isFolder ? 'is-folder' : ''} ${cube.icon_url ? 'has-icon' : ''} ${isTinyIcon ? 'icon-tiny' : ''} ${isPlaceholderIcon ? 'icon-placeholder' : ''}`}
      onClick={() => {
        // M4: plugin_action 큐브 더블클릭 → fireCubeKey, 단일클릭 → select
        selectCube(selected ? null : cube.id);
      }}
      onDoubleClick={() => {
        if (isFolder) {
          enterFolder(cube.id);
          return;
        }
        // plugin_action 큐브 더블클릭 = key 실행
        if (cube.action_type === 'plugin_action') {
          fireCubeKey(cube.id);
        }
      }}
      onWheel={(e) => {
        // M4 D: plugin_action 큐브에 마우스 휠 = StreamDeck+ dialRotate 매핑
        if (cube.action_type === 'plugin_action') {
          e.preventDefault();
          const ticks = e.deltaY > 0 ? 1 : -1;
          import('./components/PluginRunnerHost').then(({ fireCubeDialRotate }) => {
            fireCubeDialRotate(cube.id, ticks);
          });
        }
      }}
      aria-pressed={selected}
      title={`${cube.label} (${cube.action_type})${isFolder ? '\n더블클릭 → 진입' : ''}`}
      {...restAttrs}
      {...listeners}
    >
      {cube.icon_url && !isPlaceholderIcon ? (
        <div
          className="cube-icon-bg"
          style={{ backgroundImage: `url("${cube.icon_url}")` }}
          aria-hidden
        />
      ) : !isFolder ? (
        <div
          className="cube-icon-bg"
          data-placeholder-letter={placeholderLetter}
          aria-hidden
        />
      ) : null}
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
  const librarySelectedId = useEditor((s) => s.library_selected_id);
  const updateLibraryCube = useEditor((s) => s.updateLibraryCube);
  const removeLibraryCube = useEditor((s) => s.removeLibraryCube);
  const pluginActions = usePluginRegistry(useShallow((s) => s.allActions()));

  // 리스트 큐브 (현재 페이지 선택) 우선, 없으면 라이브러리 큐브
  const listCube =
    pack?.lists.find((l) => l.id === list_id)?.cubes.find((c) => c.id === cube_id) ?? null;
  const libraryCube = librarySelectedId
    ? (pack?.cubes ?? []).find((c) => c.id === librarySelectedId) ?? null
    : null;

  const cube = listCube ?? libraryCube;
  const isLibrary = !listCube && !!libraryCube;

  if (!cube) {
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
    if (!cube) return;
    if (isLibrary) {
      updateLibraryCube(cube.id, next);
    } else if (list_id) {
      upsertCube(list_id, { ...cube, ...next });
    }
  }

  function handleDelete(): void {
    if (!cube) return;
    if (!window.confirm(`"${cube.label}" — ${t('inspector.delete_confirm')}`)) return;
    if (isLibrary) {
      removeLibraryCube(cube.id);
    } else if (list_id) {
      removeCube(list_id, cube.id);
    }
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
      {/* M4: plugin_action 큐브 시 runtime 상태 + PropertyInspector iframe 임베드 */}
      {cube.action_type === 'plugin_action' && (() => {
        const p = cube.action_payload as { plugin_id?: string; plugin_dir?: string; plugin_uuid?: string };
        if (!p.plugin_id || !p.plugin_dir || !p.plugin_uuid) {
          return (
            <div className="plugin-pi-wrap">
              <h4 className="inspector-subtitle">Plugin Runtime</h4>
              <div className="plugin-runtime-status err">
                plugin 메타데이터 누락 — 다시 변환 필요 (plugin_id/plugin_dir/plugin_uuid)
              </div>
            </div>
          );
        }
        const status = getCubeRuntimeStatus(cube.id);
        return (
          <div className="plugin-pi-wrap">
            <h4 className="inspector-subtitle">Plugin Runtime</h4>
            <div className={`plugin-runtime-status ${status?.connected ? 'ok' : status?.lastError ? 'err' : 'warn'}`}>
              {status?.connected
                ? `● 작동 중 · ${p.plugin_uuid}`
                : status?.lastError
                  ? `⚠ ${status.lastError}`
                  : `⏳ 마운트 중 또는 SDK 미초기화...`}
              {status && (
                <div className="muted small" style={{ marginTop: 4 }}>
                  setImage 호출 {status.imageCallCount}회
                  {status.lastImageAgeMs >= 0 && ` · 마지막 ${status.lastImageAgeMs}ms 전`}
                </div>
              )}
              <div className="muted small" style={{ marginTop: 4 }}>
                _plugins/{p.plugin_id}/{p.plugin_dir}index.html
              </div>
            </div>
            <h4 className="inspector-subtitle" style={{ marginTop: 12 }}>PropertyInspector</h4>
            <PluginPropertyInspector cube={cube} />
            <div className="muted small" style={{ marginTop: 8 }}>
              💡 같은 큐브를 큐브 리스트 만들기 페이지에 N번 배치하면 N개 독립 instance 작동
            </div>
          </div>
        );
      })()}
      <div className="inspector-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={async () => {
            // M4: plugin_action 큐브 시 fireCubeKey (keyDown/Up 발송 — plugin JS 가 처리)
            if (cube.action_type === 'plugin_action') {
              const ok = fireCubeKey(cube.id);
              if (ok) {
                // alert 없이 즉시 — plugin 이 화면 갱신
                return;
              }
              window.alert('Plugin runtime 미마운트 (라이브러리 폴더 등록 + 자산 추출 확인 필요)');
              return;
            }
            try {
              const r = await executeCube(cube);
              const env = isTauri() ? 'Tauri' : 'browser-dev';
              window.alert(`실행 OK · ${env} · ${r.elapsed_ms} ms`);
            } catch (err) {
              window.alert(describeExecuteError(err));
            }
          }}
          title={cube.action_type === 'plugin_action' ? 'Plugin keyDown 발송' : (isTauri() ? 'PC 헬퍼로 실행' : '브라우저 dev')}
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
