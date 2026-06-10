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

import { useEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
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
import { useCubeStates } from './lib/useCubeStates';
import { CubeContextMenu } from './components/CubeContextMenu';
import { DropZone } from './components/DropZone';
import { CubePreview } from './components/CubePreview';
import { CubeCellVisual } from './components/CubeCell';
import { useSystemMetrics } from './lib/system-metrics';
import { CubeStatesEditor } from './components/CubeStatesEditor';
import { MarketplaceMetaEditor } from './components/MarketplaceMetaEditor';
import { MarketplaceCatalog } from './components/MarketplaceCatalog';
import { PackDetail } from './components/PackDetail';
import { GlobalSearch } from './components/GlobalSearch';
import { SettingsPanel } from './components/SettingsPanel';
import { CubePalette } from './components/CubePalette';
import {
  PluginActionsBackground,
  PluginPropertyInspector,
  fireCubeKey,
  getCubeRuntimeStatus,
} from './components/PluginRunnerHost';
import {
  ACTIONS,
  defaultPayloadFor,
  validatePayload,
} from './lib/actions';
import { ActionPayloadForm } from './components/ActionPayloadForm';
import { CubeIconUpload } from './components/CubeIconUpload';
import { GridLayoutModal } from './components/GridLayoutModal';
import { LocaleSwitcher } from './components/LocaleSwitcher';
import { useTranslation } from './lib/i18n/useTranslation';
import {
  PHONE_PORTRAIT,
  PHONE_MAX_PORTRAIT,
  TABLET_PORTRAIT,
  PC_DEFAULT_ROWS,
} from './lib/device-defaults';

// R1-1/R1-4: labelToGradient + generateIconDataUrl 이전됨 → CubeCell.tsx 내부 사용 (App.tsx 에서 제거)
import { describeExecuteError, executeCube, isTauri } from './lib/tauri-bridge';
import {
  buildPluginActionPayload,
  parseQualifiedId,
  QUALIFIED_PREFIX,
  usePluginRegistry,
} from './lib/plugin-registry';
import type { Cube, CubeList, CubePack } from './types/cube';
import { PlayMode } from './components/PlayMode';
import { SkinDialog } from './components/SkinDialog';


const PACK_STORAGE_KEY = 'cubelist:last_pack';
const LIBRARY_DIR_KEY = 'cubelist:library_dir';
// 2026-06-10 사용자 지시: 미등록 시 기본 라이브러리 경로 자동 시도 (성공하면 영구 등록).
const DEFAULT_LIBRARY_DIR = 'C:\\Users\\PC\\Downloads\\플러그인\\CUBE';

export function App() {
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);
  const draftList = useEditor((s) => s.draft_list);
  const refreshPlugins = usePluginRegistry((s) => s.refresh);
  // 2A-2: mainTab/setMainTab → store 승격
  const mainTab = useEditor((s) => s.main_tab);
  const setMainTab = useEditor((s) => s.setMainTab);
  // v0.1.3 사전: 마켓플레이스 메타 편집 모달 + 전역 검색 + 마켓플레이스 상세 라우팅 + 설정 패널
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  // W1: 작동 모드
  const [playModeOpen, setPlayModeOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  // R3: 시스템 메트릭 폴링 시작 (Tauri 환경에서만 동작 — store 내부에서 분기)
  useEffect(() => {
    const metrics = useSystemMetrics.getState();
    metrics.startPolling();
    return () => metrics.stopPolling();
  }, []);

  // v0.1.3: Ctrl+F / Cmd+F 전역 검색
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        const target = e.target as HTMLElement | null;
        // input/textarea 포커스 시 무시 (브라우저 기본 검색 또는 입력 필드 동작)
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // draft 가 새로 생성되면 큐브 리스트 만들기 탭으로 자동 전환 (워크플로우 자동화)
  useEffect(() => {
    if (draftList) setMainTab('list-maker');
  }, [draftList?.id]);

  // P0-A1 (2026-06-01): pack 로드 시 첫 list 자동 선택 (cube-maker 유지)
  // StreamDeck 첫 인상 — 폴더 진입 없이 즉시 큐브 그리드 노출
  const [autoFlatDone, setAutoFlatDone] = useState(false);
  useEffect(() => {
    if (autoFlatDone) return;
    if (!pack) return;
    if (pack.lists.length === 0) return;
    const editor = useEditor.getState();
    if (!editor.activeList()) {
      editor.selectList(pack.lists[0].id);
    }
    setAutoFlatDone(true);
  }, [pack?.id, autoFlatDone]);

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
      // 1. 등록된 라이브러리 폴더 (Tauri 환경 한정) — 미등록 시 기본 경로 자동 시도
      const libDir = window.localStorage.getItem(LIBRARY_DIR_KEY) ?? DEFAULT_LIBRARY_DIR;
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

  // v0.1.2: 드래그드롭 zone — plugin/profile/cubeone/cubelist/cubepack 자동 분류
  async function handlePluginsDropped(files: File[]): Promise<void> {
    if (!isTauri()) {
      window.alert('드래그드롭 플러그인 변환은 Tauri 환경에서만 가능합니다.');
      return;
    }
    const { convertPlugin } = await import('./lib/plugin-converter');
    const { invoke } = await import('@tauri-apps/api/core');
    const libraryDir = window.localStorage.getItem(LIBRARY_DIR_KEY) ?? '';
    if (!libraryDir) {
      window.alert('라이브러리 폴더를 먼저 등록하세요 (우상단 폴더 버튼).');
      return;
    }
    for (const file of files) {
      try {
        const buf = await file.arrayBuffer();
        const result = await convertPlugin(buf, file.name);
        for (const cube of result.cubes) {
          await invoke('write_library_file', {
            libraryDir,
            folder: result.folderName,
            filename: cube.filename,
            bytes: Array.from(cube.bytes),
          });
        }
        try {
          await invoke('write_plugin_zip', {
            libraryDir,
            pluginId: result.pluginId,
            zipBytes: Array.from(new Uint8Array(buf)),
          });
        } catch {
          /* 자산 풀기 실패 — 메타만 등록 */
        }
      } catch (err) {
        console.error(`[drop] ${file.name} 변환 실패:`, err);
      }
    }
    window.location.reload();
  }

  async function handleCubeFilesDropped(files: File[]): Promise<void> {
    const { importCubepack, importCubelist, readCubeZip } = await import('./lib/cubepack-io');
    for (const file of files) {
      try {
        const buf = new Uint8Array(await file.arrayBuffer());
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.cubepack')) {
          const pack = await importCubepack(buf);
          useEditor.getState().loadPack(pack);
        } else if (lower.endsWith('.cubelist') || lower.endsWith('.cubedeck')) {
          // .cubelist → 활성 cubepack 에 추가 (또는 신규 pack 생성)
          const list = await importCubelist(buf);
          const state = useEditor.getState();
          if (state.pack) {
            // 기존 pack 에 추가
            const newList = {
              ...list,
              id: crypto.randomUUID() as string,
              sort_order: state.pack.lists.length + 1,
            };
            state.loadPack({
              ...state.pack,
              lists: [...state.pack.lists, newList],
            });
            state.selectList(newList.id);
          } else {
            // 신규 pack 생성
            state.loadPack({
              id: crypto.randomUUID() as string,
              name: file.name.replace(/\.cube(list|deck)$/i, ''),
              cubes: [],
              lists: [list],
            });
            state.selectList(list.id);
          }
        } else if (lower.endsWith('.cubeone')) {
          // 라이브러리 풀에 단일 큐브 추가 (현재 활성 list 가 있으면 거기 끝에)
          const cube = await readCubeZip(buf, 0);
          const state = useEditor.getState();
          if (state.list_id && state.pack) {
            const targetList = state.pack.lists.find((l) => l.id === state.list_id);
            if (targetList) {
              state.upsertCube(state.list_id, {
                ...cube,
                id: crypto.randomUUID(),
                sort_order: targetList.cubes.length + 1,
              });
            }
          }
        }
      } catch (err) {
        console.error(`[drop] ${file.name} 가져오기 실패:`, err);
      }
    }
  }

  // v0.1.2: Ctrl+E (또는 Cmd+E) → 활성 cubepack export
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        const target = e.target as HTMLElement | null;
        // input/textarea 포커스 시 무시 (일반 단축키 충돌 방지)
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        const state = useEditor.getState();
        if (!state.pack) {
          window.alert('Export 할 큐브팩이 없습니다.');
          return;
        }
        e.preventDefault();
        import('./lib/cubepack-io').then(async ({ exportCubepack, downloadCubepack }) => {
          const blob = await exportCubepack(state.pack!);
          downloadCubepack(blob, state.pack!.name || state.pack!.id);
        });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="app">
      <TopBar
        onOpenMarketplace={() => setMarketplaceOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPlayMode={() => setPlayModeOpen(true)}
      />
      <div className="workspace">
        <Sidebar />
        <main className="center-area">
          <MainTabBar />
          {mainTab === 'list-maker' ? (
            <ListMakerCenter />
          ) : mainTab === 'marketplace' ? (
            selectedPackId ? (
              <PackDetail packId={selectedPackId} onBack={() => setSelectedPackId(null)} />
            ) : (
              <MarketplaceCatalog onPackClick={(id) => setSelectedPackId(id)} />
            )
          ) : (
            <CubeMakerCenter />
          )}
        </main>
        <Inspector />
      </div>
      {/* M4: plugin_action 큐브들 백그라운드 runtime (보이지 않는 iframe + JS 실행) */}
      <PluginActionsBackground />
      {/* v0.1.2: App 루트 드래그드롭 zone */}
      <DropZone
        onPluginsDropped={handlePluginsDropped}
        onCubeFilesDropped={handleCubeFilesDropped}
      />
      {/* v0.1.3 사전: 마켓플레이스 메타 편집 모달 */}
      {marketplaceOpen && <MarketplaceMetaEditor onClose={() => setMarketplaceOpen(false)} />}
      {/* v0.1.3: Ctrl+F 전역 검색 */}
      {globalSearchOpen && <GlobalSearch onClose={() => setGlobalSearchOpen(false)} />}
      {/* v0.1.3: 설정 패널 (TopBar 설정 버튼) */}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {/* W1: 작동 모드 전체화면 오버레이 */}
      {playModeOpen && pack && (
        <PlayModeWrapper pack={pack} onClose={() => setPlayModeOpen(false)} />
      )}
    </div>
  );
}

/** W1: PlayMode 를 위한 thin wrapper — initialListId 를 store 에서 읽기 */
function PlayModeWrapper({ pack, onClose }: { pack: CubePack; onClose: () => void }) {
  const listId = useEditor((s) => s.list_id);
  return <PlayMode pack={pack} initialListId={listId} onClose={onClose} />;
}

function MainTabBar() {
  const { t } = useTranslation();
  // 2A-2: store에서 mainTab/setMainTab 직접 구독
  const activeTab = useEditor((s) => s.main_tab);
  const onChange = useEditor((s) => s.setMainTab);
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
          `라이브러리 폴더 미등록 — 다운로드 폴더에 ${pages >= 2 ? '.cubedeck' : '.cubelist'} 파일 저장됨. 우상단 폴더 버튼 등록 후 다음 부팅 시 자동 로드.`,
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
        {t('maintab.cube_maker')}
      </button>
      <button
        type="button"
        className={`main-tab ${activeTab === 'list-maker' ? 'is-active' : ''}`}
        onClick={() => onChange('list-maker')}
        aria-pressed={activeTab === 'list-maker'}
      >
        {t('maintab.list_maker')}
      </button>
      <button
        type="button"
        className={`main-tab ${activeTab === 'marketplace' ? 'is-active' : ''}`}
        onClick={() => onChange('marketplace')}
        aria-pressed={activeTab === 'marketplace'}
        title="마켓플레이스 (v0.1.3 사전 mockup)"
      >
        {t('maintab.marketplace')}
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
 * 큐브 리스트 만들기 가운데 영역 — 2A-2 재설계.
 *
 * 구조:
 *  - 위: DraftPageTabs + GridArea (flex:1, 내부 스크롤)
 *  - 아래: CubePalette 패널 (고정 ~220px)
 *
 * draft 없으면 자동 생성(빈 안내 화면 제거).
 * 외부 DndContext 가 GridArea(CubeGrid externalDnd) + CubePalette 를 통합.
 */
function ListMakerCenter() {
  const { t } = useTranslation();
  const draftList = useEditor((s) => s.draft_list);
  const setDraftList = useEditor((s) => s.setDraftList);
  const selectList = useEditor((s) => s.selectList);
  const list_id = useEditor((s) => s.list_id);
  const moveCubeInDraft = useEditor((s) => s.moveCubeInDraft);
  const pack = useEditor((s) => s.pack);

  // #3: DragOverlay 상태 — 드래그 중인 큐브 + 타입(palette|grid)
  const [activeDragCube, setActiveDragCube] = useState<{ cube: Cube; size: 64 | 96 } | null>(null);

  // 2A-2: 탭 진입 시 draft 없으면 빈 draft 자동 생성
  useEffect(() => {
    if (!draftList) {
      const newDraft = {
        id: crypto.randomUUID() as string,
        name: t('list_maker.auto_draft_name'),
        sort_order: 0,
        cols: 4,
        cubes_per_page: 28,
        cubes: [],
      };
      setDraftList(newDraft);
      selectList(newDraft.id);
    }
  // list_maker 탭 진입 시 1회만 — draftList 의존 없이 (null 판별은 내부에서)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // draft 가 있는데 list_id 가 draft.id 아니면 강제 활성 (페이지 전환 동기)
  useEffect(() => {
    if (draftList && list_id !== draftList.id) {
      selectList(draftList.id);
    }
  }, [draftList?.id, list_id, selectList]);

  // ── 외부 DndContext — GridArea(externalDnd) + CubePalette 통합 ──────────────
  const extSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleExternalDragStart(e: DragStartEvent): void {
    const activeId = String(e.active.id);
    if (activeId.startsWith('palette:')) {
      // 팔레트 타일 — 소스 큐브 찾기
      const srcCubeId = activeId.slice('palette:'.length);
      let srcCube: Cube | undefined;
      if (pack) {
        srcCube =
          (pack.cubes ?? []).find((c) => c.id === srcCubeId) ??
          pack.lists.flatMap((l) => l.cubes).find((c) => c.id === srcCubeId);
      }
      if (srcCube) setActiveDragCube({ cube: srcCube, size: 64 });
    } else if (!activeId.startsWith('empty-')) {
      // 그리드 큐브
      const cube = draftList?.cubes.find((c) => c.id === activeId);
      if (cube) setActiveDragCube({ cube, size: 96 });
    }
  }

  function handleExternalDragEnd(e: DragEndEvent): void {
    setActiveDragCube(null);
    const { active, over } = e;
    if (!over || !draftList) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── 팔레트 → 그리드: 복사 배치 ─────────────────────────────────────
    if (activeId.startsWith('palette:')) {
      const srcCubeId = activeId.slice('palette:'.length);
      // 소스 큐브 검색 (pack.cubes + pack.lists 전체)
      let srcCube: typeof draftList.cubes[0] | undefined;
      if (pack) {
        srcCube =
          (pack.cubes ?? []).find((c) => c.id === srcCubeId) ??
          pack.lists.flatMap((l) => l.cubes).find((c) => c.id === srcCubeId);
      }
      if (!srcCube) return;

      // 드롭 위치 결정
      let targetSlot: number;
      if (overId.startsWith('empty-')) {
        // 빈 슬롯 — 그 슬롯 번호
        targetSlot = Number(overId.slice('empty-'.length));
        if (!Number.isFinite(targetSlot)) return;
      } else {
        // 큐브 위 → 마지막+1
        const maxSlot =
          draftList.cubes.length > 0
            ? Math.max(...draftList.cubes.map((c) => c.sort_order))
            : 0;
        targetSlot = maxSlot + 1;
      }

      // 복사본 생성 (새 id, 딥카피)
      const copy = {
        ...srcCube,
        id: crypto.randomUUID() as string,
        sort_order: targetSlot,
        metadata: srcCube.metadata ? { ...(srcCube.metadata as Record<string, unknown>) } : undefined,
        action_payload: srcCube.action_payload
          ? { ...(srcCube.action_payload as Record<string, unknown>) }
          : srcCube.action_payload,
      };

      // draft에 추가 (슬롯에 이미 큐브 있으면 다음 빈 슬롯으로)
      const occupiedSlots = new Set(draftList.cubes.map((c) => c.sort_order));
      let slot = targetSlot;
      while (occupiedSlots.has(slot)) slot++;
      const finalCopy = { ...copy, sort_order: slot };

      useEditor.getState().setDraftList({
        ...draftList,
        cubes: [...draftList.cubes, finalCopy],
      });
      return;
    }

    // ── 그리드 내부 정렬 (기존 로직 위임) ───────────────────────────────
    if (activeId.startsWith('empty-')) return;

    if (overId.startsWith('empty-')) {
      const targetSlot = Number(overId.slice('empty-'.length));
      if (Number.isFinite(targetSlot)) moveCubeInDraft(activeId, targetSlot);
      return;
    }

    const overCube = draftList.cubes.find((c) => c.id === overId);
    if (overCube) {
      const activeCube = draftList.cubes.find((c) => c.id === activeId);
      // folder 드롭은 draft 에서 미지원 — swap 만 처리
      if (overCube.action_type === 'folder' && activeCube?.action_type !== 'folder') {
        // draft 팔레트에서는 폴더-인 미지원, 일반 swap
      }
      moveCubeInDraft(activeId, overCube.sort_order);
    }
  }

  return (
    <DndContext
      sensors={extSensors}
      collisionDetection={closestCenter}
      onDragStart={handleExternalDragStart}
      onDragEnd={handleExternalDragEnd}
      onDragCancel={() => setActiveDragCube(null)}
    >
      <div className="list-builder-split">
        <div className="list-builder-top">
          <DraftPageTabs />
          <GridArea externalDnd />
        </div>
        <CubePalette />
      </div>
      {/* #3: DragOverlay — 드래그 중 고스트 */}
      <DragOverlay>
        {activeDragCube && (
          <div
            style={{
              width: activeDragCube.size,
              height: activeDragCube.size,
              transform: 'scale(1.05)',
              transformOrigin: 'top left',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              borderRadius: 12,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <CubeCellVisual cube={activeDragCube.cube} isDragging={false} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
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

// ── MakerSortableCell — CubeMakerCenter DnD 래퍼 (소형, CubeCellVisual 재사용) ──────────────
function MakerSortableCell({
  cube,
  isSelected,
  selectionIndex,
  isInMultiSelection,
  isDropTarget,
  nowMs,
  onClick,
  onDoubleClick,
}: {
  cube: Cube;
  isSelected: boolean;
  selectionIndex: number;
  /** 2A: Ctrl 다중 선택 포함 여부 */
  isInMultiSelection?: boolean;
  /** 2A: 폴더 드롭 타겟 강조 */
  isDropTarget?: boolean;
  nowMs: number;
  onClick: (ctrlOrMeta: boolean) => void;
  onDoubleClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: cube.id,
  });
  const { role: _r, 'aria-pressed': _ap, ...restAttrs } = attributes;
  void _r; void _ap;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  // 2A: 폴더 위에 드래그 중일 때 is-drop-target
  const dropTargetClass = (isDropTarget || (cube.action_type === 'folder' && isOver)) ? 'is-drop-target' : '';
  // 2A: Ctrl 다중 선택은 is-in-selection 클래스 (CubeCellVisual 내부 selectionIndex 로직과 별도)
  const multiSelClass = isInMultiSelection ? 'is-in-selection' : '';
  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={`cube-cell${dropTargetClass ? ` ${dropTargetClass}` : ''}${multiSelClass ? ` ${multiSelClass}` : ''}`}
      onClick={(e) => onClick(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
      title={`${cube.label} (${cube.action_type})`}
      {...restAttrs}
      {...listeners}
    >
      <CubeCellVisual
        cube={cube}
        selected={isSelected}
        selectionIndex={selectionIndex}
        nowMs={nowMs}
        isDragging={isDragging}
      />
    </button>
  );
}

/**
 * 큐브 만들기 가운데 영역 (Phase 2b).
 * - 라이브러리 큐브 그리드 (어플 아이콘 모양)
 * - "+ 새 큐브" 버튼 (Inspector 에서 편집)
 * - "폴더 불러오기" — 폴더 + 하위 폴더 재귀 → 각 파일을 라이브러리 큐브로 자동 생성
 * - "리스트 만들기" — 큐브 순차 선택 모드 (Phase 3) → 완료 시 모달 → 새 페이지(리스트)
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
  const removeCube = useEditor((s) => s.removeCube);
  const moveCubeToSlot = useEditor((s) => s.moveCubeToSlot);
  const addCubeToFolder = useEditor((s) => s.addCubeToFolder);

  const listMakerActive = useEditor((s) => s.list_maker_active);
  const listMakerSelection = useEditor(useShallow((s) => s.list_maker_selection));
  const toggleListMakerSelection = useEditor((s) => s.toggleListMakerSelection);
  const finishListMaker = useEditor((s) => s.finishListMaker);

  // R1-3: 라이브러리 큐브에도 중앙 tick 전달 (live_* 큐브가 라이브러리에 있을 때)
  const { nowMs: libLiveNowMs } = useDynamicCubes(libraryCubes);

  // 2026-06-10: 클린 스킨 — 라이브러리 리스트에서 스킨 다이얼로그 접근
  const { t } = useTranslation();
  const applySkin = useEditor((s) => s.applySkinToList);
  const removeSkin = useEditor((s) => s.removeSkinFromList);
  const [makerSkinOpen, setMakerSkinOpen] = useState(false);

  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // 2A: Ctrl 다중 선택 Set (CubeMakerCenter 한정)
  const [multiSelection, setMultiSelection] = useState<Set<string>>(new Set());

  // 다중 선택 완료 후 모달 트리거는 MainTabBar 의 prompt 로 대체. saveModal 은 추후 풀-기능 시.
  void saveModalOpen;
  void setSaveModalOpen;
  void finishListMaker;

  function handleClickCube(cubeId: string, ctrlOrMeta: boolean): void {
    if (listMakerActive) {
      toggleListMakerSelection(cubeId);
      return;
    }
    if (ctrlOrMeta) {
      // Ctrl/Meta 클릭 = 다중 선택 토글
      setMultiSelection((prev) => {
        const next = new Set(prev);
        if (next.has(cubeId)) {
          next.delete(cubeId);
        } else {
          next.add(cubeId);
        }
        return next;
      });
      return;
    }
    // 일반 클릭 = 다중 선택 해제 + 기존 단일 선택
    setMultiSelection(new Set());
    selectLibraryCube(librarySelectedId === cubeId ? null : cubeId);
    selectCube(cubeId);
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

  // #3: DragOverlay 상태 (CubeMakerCenter 전용)
  const [makerDragCube, setMakerDragCube] = useState<Cube | null>(null);

  // ── DnD sensors (CubeGrid 동일 패턴) ──────────────────────────────────────
  const makerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleMakerDragStart(e: DragStartEvent): void {
    const id = String(e.active.id);
    const cube = listCubes.find((c) => c.id === id);
    if (cube) setMakerDragCube(cube);
  }

  function handleMakerDragEnd(e: DragEndEvent): void {
    setMakerDragCube(null);
    const { active, over } = e;
    if (!over || active.id === over.id || !activeList) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const overCube = listCubes.find((c) => c.id === overId);
    const activeCube = listCubes.find((c) => c.id === activeId);
    if (overCube) {
      // 2A: folder 위 + 드래그 큐브가 folder 아닌 경우 → 폴더에 추가
      if (overCube.action_type === 'folder' && activeCube?.action_type !== 'folder') {
        addCubeToFolder(activeList.id, overCube.id, activeId);
        return;
      }
      // 일반 큐브 위 → swap
      moveCubeToSlot(activeList.id, activeId, overCube.sort_order);
    } else {
      // 빈 영역/trail → 마지막+1 슬롯
      const maxSlot = listCubes.length > 0 ? Math.max(...listCubes.map((c) => c.sort_order)) : 0;
      moveCubeToSlot(activeList.id, activeId, maxSlot + 1);
    }
  }

  // 2A: 리스트 전환 시 multiSelection 초기화
  useEffect(() => {
    setMultiSelection(new Set());
  }, [activeList?.id]);

  // ── Delete 키 — 단일/다중 삭제 ─────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Delete') return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (!activeList) return;

      // 2A: 다중 선택 삭제
      const currentMulti = useEditor.getState(); // multiSelection 은 로컬 state
      void currentMulti; // 클로저에서 multiSelection 직접 접근

      if (multiSelection.size > 0) {
        const n = multiSelection.size;
        const msg = t('maker.multi_delete_confirm').replace('{n}', String(n));
        if (!window.confirm(msg)) return;
        for (const id of multiSelection) {
          removeCube(activeList.id, id);
        }
        setMultiSelection(new Set());
        return;
      }

      // 단일 선택 삭제 (기존 동작)
      const state = useEditor.getState();
      const selectedId = state.cube_id;
      if (!selectedId) return;
      const cube = activeList.cubes.find((c) => c.id === selectedId);
      if (!cube) return;
      if (!window.confirm(`"${cube.label}" — ${t('inspector.delete_confirm')}`)) return;
      removeCube(activeList.id, selectedId);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeList, removeCube, t, multiSelection]);

  // "전체" 모드: 각 리스트(폴더)를 큐브 셀처럼 표시
  if (isAllMode) {
    return (
      <>
        <PageTabs />
        {lists.length === 0 ? (
          <div className="cube-maker-empty">
            <p>큐브 리스트가 없습니다.</p>
            <p className="muted small">우상단 폴더 버튼으로 등록하거나 + 로 새 리스트 추가</p>
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
                    {!folderIcon && <span className="folder-cell-emoji">▶</span>}
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

      {/* 2026-06-10: 라이브러리 리스트에서도 스킨 접근 (기존엔 draft GridArea 전용 = 도달 불가) */}
      {activeList && (
        <div className="cube-maker-toolbar" style={{ paddingTop: 8 }}>
          <span className="muted small">{activeList.name} · {activeList.cubes.length} 큐브</span>
          <span className="cube-maker-spacer" />
          <button type="button" className="btn-ghost" onClick={() => setMakerSkinOpen(true)}>
            {t('skin.btn_label')}
          </button>
        </div>
      )}
      {makerSkinOpen && activeList && (
        <SkinDialog
          list={activeList}
          hasSkin={activeList.cubes.some((c) => ((c.metadata ?? {}) as Record<string, unknown>).skin_source !== undefined)}
          onApply={(matches) => applySkin(activeList.id, matches)}
          onRemove={() => removeSkin(activeList.id)}
          onClose={() => setMakerSkinOpen(false)}
        />
      )}

      {cubesToShow.length === 0 ? (
        <div className="cube-maker-empty">
          <p>큐브가 없습니다.</p>
          <p className="muted small">＋ 새 큐브 또는 폴더 불러오기로 큐브 추가</p>
          <button type="button" className="btn-ghost" onClick={handleAddNewCube}>
            ＋ 첫 큐브 추가
          </button>
        </div>
      ) : (
        // activeList DnD 모드: SortableContext 래핑. 라이브러리 풀 모드(activeList 없음) = 비 DnD.
        activeList ? (
          <DndContext
              sensors={makerSensors}
              collisionDetection={closestCenter}
              onDragStart={handleMakerDragStart}
              onDragEnd={handleMakerDragEnd}
              onDragCancel={() => setMakerDragCube(null)}
            >
            <SortableContext items={listCubes.map((c) => c.id)} strategy={rectSortingStrategy}>
              <div
                className="cube-grid"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 112px))`, padding: '16px' }}
              >
                {/* 첫 셀: + 새 큐브 추가 (DnD 제외) */}
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
                {listCubes.map((cube) => {
                  const selectionIdx = listMakerSelection.indexOf(cube.id);
                  const isSelected = librarySelectedId === cube.id;
                  const isInMulti = multiSelection.has(cube.id);
                  return (
                    <MakerSortableCell
                      key={cube.id}
                      cube={cube}
                      isSelected={isSelected}
                      selectionIndex={selectionIdx}
                      isInMultiSelection={isInMulti}
                      nowMs={libLiveNowMs}
                      onClick={(ctrlOrMeta) => handleClickCube(cube.id, ctrlOrMeta)}
                      onDoubleClick={() => {
                        if (cube.action_type === 'folder') return;
                        import('./lib/run-cube').then(({ runCube }) => {
                          runCube(cube, activeList.id).catch((e) => console.warn('[maker dblclick]', e));
                        });
                      }}
                    />
                  );
                })}
                {/* trail 빈 슬롯 (DnD 제외) */}
                <button
                  type="button"
                  className="cube-cell cube-cell-add cube-cell-trail-empty"
                  onClick={handleAddNewCube}
                  title={`다음 슬롯에 큐브 추가`}
                  aria-label="다음 빈 슬롯"
                >
                  <div className="cube-icon-bg">
                    <span className="cube-cell-add-plus">＋</span>
                  </div>
                  <span className="cube-label">새 큐브</span>
                </button>
              </div>
            </SortableContext>
            {/* #3: DragOverlay */}
            <DragOverlay>
              {makerDragCube && (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    transform: 'scale(1.05)',
                    transformOrigin: 'top left',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                >
                  <CubeCellVisual cube={makerDragCube} isDragging={false} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          // 라이브러리 풀 모드 — DnD 없음
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
              return (
                <button
                  key={cube.id}
                  type="button"
                  className="cube-cell"
                  onClick={(e) => handleClickCube(cube.id, e.ctrlKey || e.metaKey)}
                  title={`${cube.label} (${cube.action_type})`}
                >
                  <CubeCellVisual
                    cube={cube}
                    selected={isSelected}
                    selectionIndex={selectionIdx}
                    nowMs={libLiveNowMs}
                  />
                </button>
              );
            })}
            {/* P1-B1 갱신 (2026-06-01): trail 빈 슬롯 */}
            <button
              type="button"
              className="cube-cell cube-cell-add cube-cell-trail-empty"
              onClick={handleAddNewCube}
              title={`다음 슬롯에 큐브 추가`}
              aria-label="다음 빈 슬롯"
            >
              <div className="cube-icon-bg">
                <span className="cube-cell-add-plus">＋</span>
              </div>
              <span className="cube-label">새 큐브</span>
            </button>
          </div>
        )
      )}
      {/* 디바이스 권장 페이지 가이드 (2026-06-01) — 사용자 명시 디폴트 + 현재 큐브 수 */}
      {cubesToShow.length > 0 && <PageSizeGuide currentCubeCount={cubesToShow.length} cols={cols} />}
    </>
  );
}

/**
 * 디바이스 권장 페이지 가이드 (2026-06-01) — cube-maker 그리드 하단.
 * 사용자 명시: 일반 모바일 4×6, Pro Max 4×7, PC 사용자 정의 + 권장 4행.
 */
function PageSizeGuide({ currentCubeCount, cols }: { currentCubeCount: number; cols: number }) {
  const pcRecommended = cols * PC_DEFAULT_ROWS;
  const ratio = (currentCubeCount / pcRecommended) * 100;
  return (
    <div
      role="note"
      style={{
        margin: '20px 16px 8px',
        padding: '8px 12px',
        fontSize: 10,
        opacity: 0.55,
        border: '1px solid var(--color-border, #333)',
        borderRadius: 6,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span style={{ fontWeight: 600 }}>
        현재 {currentCubeCount} 큐브
      </span>
      <span>
        PC 권장 페이지: <strong>{cols}×{PC_DEFAULT_ROWS}={pcRecommended}</strong>
        ({Math.round(ratio)}%)
      </span>
      <span title="iPhone 일반/Pro, 갤럭시 일반">
        모바일 권장: <strong>{PHONE_PORTRAIT.cols}×{PHONE_PORTRAIT.rows}={PHONE_PORTRAIT.cols * PHONE_PORTRAIT.rows}</strong>
      </span>
      <span title="iPhone Pro Max, 갤럭시 울트라">
        Pro Max: <strong>{PHONE_MAX_PORTRAIT.cols}×{PHONE_MAX_PORTRAIT.rows}={PHONE_MAX_PORTRAIT.cols * PHONE_MAX_PORTRAIT.rows}</strong>
      </span>
      <span title="iPad / 갤럭시 탭 (잠정 — 사용자 실측 후 확정)">
        태블릿: <strong>{TABLET_PORTRAIT.cols}×{TABLET_PORTRAIT.rows}={TABLET_PORTRAIT.cols * TABLET_PORTRAIT.rows}+</strong>
      </span>
    </div>
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

/**
 * PackSwitcher (P0-A2, 2026-06-01) — TopBar 좌상단 큐브팩 전환 드롭다운.
 * StreamDeck 프로필 드롭다운 패턴 채용. 1클릭으로 큐브팩 전환/관리.
 */
function PackSwitcher({
  pack,
  loadPack,
  onImportClick,
  onExportClick,
}: {
  pack: CubePack | null;
  loadPack: (next: CubePack) => void;
  onImportClick: () => void;
  onExportClick: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function handleLoadDemo(): void {
    loadPack(buildDemoPack());
    setOpen(false);
  }

  function handleNewPack(): void {
    const name = window.prompt('새 큐브팩 이름:', '새 큐브팩');
    if (!name) return;
    const now = new Date().toISOString();
    loadPack({
      id: crypto.randomUUID(),
      name: name.trim(),
      rbs_format_version: 3,
      lists: [],
      cubes: [],
      created_at: now,
      updated_at: now,
    } as CubePack);
    setOpen(false);
  }

  function handleImport(): void {
    onImportClick();
    setOpen(false);
  }

  async function handleExport(): Promise<void> {
    await onExportClick();
    setOpen(false);
  }

  const packName = pack?.name ?? '큐브팩 없음';
  const cubeCount = pack ? (pack.cubes?.length ?? 0) + pack.lists.reduce((a, l) => a + l.cubes.length, 0) : 0;
  const listCount = pack?.lists.length ?? 0;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', marginLeft: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="큐브팩 전환"
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border, #333)',
          borderRadius: 6,
          color: 'inherit',
          padding: '4px 10px',
          fontSize: 12,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontWeight: 600 }}>{packName}</span>
        <span style={{ opacity: 0.6, fontSize: 10 }}>
          {cubeCount}큐브 · {listCount}리스트
        </span>
        <span style={{ opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            minWidth: 220,
            background: 'var(--color-surface, #1a1a1a)',
            border: '1px solid var(--color-border, #333)',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            zIndex: 100,
            padding: '4px 0',
          }}
        >
          <PackMenuItem icon="" label="데모 큐브팩 로드" onClick={handleLoadDemo} />
          <PackMenuItem icon="" label="새 큐브팩 만들기" onClick={handleNewPack} />
          <div style={{ height: 1, background: 'var(--color-border, #333)', margin: '4px 0' }} />
          <PackMenuItem icon="" label="가져오기 (.cubepack)" onClick={handleImport} />
          <PackMenuItem
            icon=""
            label="내보내기 (.cubepack)"
            onClick={handleExport}
            disabled={!pack}
          />
        </div>
      )}
    </div>
  );
}

function PackMenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 12px',
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        fontSize: 12,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span aria-hidden style={{ width: 18, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function TopBar({
  onOpenMarketplace,
  onOpenSettings,
  onOpenPlayMode,
}: {
  onOpenMarketplace?: () => void;
  onOpenSettings?: () => void;
  onOpenPlayMode?: () => void;
}) {
  const { t } = useTranslation();
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);
  const installedPlugins = usePluginRegistry((s) => s.installed);
  const installPlugin = usePluginRegistry((s) => s.install);

  async function handleExport(): Promise<void> {
    if (!pack) return;
    try {
      // v0.1.3: cover_url 없고 lists 있으면 자동 캡처해서 메타에 포함
      let packToExport = pack;
      const ext = (pack.extensions ?? {}) as { marketplace?: { cover_url?: string } };
      const hasCover = !!ext.marketplace?.cover_url;
      if (!hasCover && pack.lists.length > 0) {
        try {
          const { captureCubeListThumbnail } = await import('./lib/pack-thumbnail');
          const dataUrl = await captureCubeListThumbnail(pack.lists[0], {
            packName: pack.name,
          });
          if (dataUrl) {
            packToExport = {
              ...pack,
              extensions: {
                ...(pack.extensions ?? {}),
                marketplace: { ...(ext.marketplace ?? {}), cover_url: dataUrl },
              },
            };
          }
        } catch {
          /* 캡처 실패해도 export 는 계속 */
        }
      }
      const blob = await exportCubepack(packToExport);
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
        // 2026-06-01 D: 가져오기 후 통계 + icon pool 매칭률 alert
        const totalCubes = next.lists.reduce((a, l) => a + l.cubes.length, 0);
        const fromPool = next.lists.reduce(
          (a, l) => a + l.cubes.filter((c) => (c.metadata as Record<string, unknown> | undefined)?.icon_from_pool).length,
          0,
        );
        const heuristic = next.lists.reduce(
          (a, l) => a + l.cubes.filter((c) => (c.metadata as Record<string, unknown> | undefined)?.mapping_kind === 'import_heuristic').length,
          0,
        );
        const matchPct = totalCubes > 0 ? Math.round((fromPool / totalCubes) * 100) : 0;
        window.alert(
          `큐브팩 가져오기 완료\n\n` +
          `이름: ${next.name}\n` +
          `페이지: ${next.lists.length}\n` +
          `큐브: ${totalCubes}\n\n` +
          `Icon Pool 매칭: ${fromPool}/${totalCubes} (${matchPct}%)\n` +
          `Heuristic 매핑: ${heuristic} 큐브\n\n` +
          (matchPct < 50 ? '라이브러리 폴더 등록 후 다시 가져오면 매칭률 ↑' : ''),
        );
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
      window.alert('먼저 우상단 폴더 버튼으로 라이브러리 폴더를 등록하세요.');
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
            `${result.pluginName}: ${result.cubes.length} 큐브 + 자산 _plugins/${result.pluginId}/ ${tag}`,
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
        <PackSwitcher
          pack={pack}
          loadPack={loadPack}
          onImportClick={handleImportClick}
          onExportClick={handleExport}
        />
      </div>
      <div className="topbar-right">
        <span className="pack-meta" style={{ display: 'none' }}>{pack?.name ?? t('app.no_pack')}</span>
        {/* 그룹 1: 가져오기·내보내기 */}
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
        {/* 구분선 1 */}
        <span className="topbar-sep" aria-hidden />
        {/* 그룹 2: + 플러그인·플러그인 변환 */}
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
          플러그인 변환
        </button>
        {/* 구분선 2 */}
        <span className="topbar-sep" aria-hidden />
        {/* 그룹 3: 폴더·팩 정보 */}
        <button
          type="button"
          className="btn-ghost"
          onClick={handleSetLibraryDir}
          title="라이브러리 폴더 자동 로드 (등록 1회, 다음 부팅부터 자동 불러오기)"
        >
          폴더
        </button>
        {onOpenMarketplace && (
          <button
            type="button"
            className="btn-ghost"
            onClick={onOpenMarketplace}
            title="마켓플레이스 메타 편집 (v0.1.3 사전)"
            disabled={!pack}
          >
            팩 정보
          </button>
        )}
        {/* 구분선 3 */}
        <span className="topbar-sep" aria-hidden />
        {/* 그룹 4: ▶ 작동 */}
        {onOpenPlayMode && (
          <button
            type="button"
            className="btn-ghost"
            onClick={onOpenPlayMode}
            disabled={!pack}
            title={t('playmode.title')}
          >
            {t('topbar.play')}
          </button>
        )}
        {/* 구분선 4 */}
        <span className="topbar-sep" aria-hidden />
        {/* 그룹 5: LocaleSwitcher·설정 */}
        <LocaleSwitcher />
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title={t('app.settings')}
          aria-label={t('app.settings')}
        >
          {t('app.settings')}
        </button>
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
  // 2A-2: main_tab에 따라 사이드바 클릭 동작 분기
  const mainTab = useEditor((s) => s.main_tab);
  const paletteListId = useEditor((s) => s.palette_list_id);
  const setPaletteList = useEditor((s) => s.setPaletteList);
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
        <span className="path-icon">▶</span>
        <span className="path-text">{libDirShort}</span>
      </div>
      <div className="sidebar-filter">
        <input
          type="search"
          className="sidebar-filter-input"
          placeholder="큐브 리스트·큐브 검색"
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
          className={`tree-folder tree-folder-root ${
            mainTab === 'list-maker'
              ? (paletteListId === null ? 'is-active' : '')
              : (activeListId === null ? 'is-active' : '')
          }`}
          onClick={() => {
            if (mainTab === 'list-maker') {
              // 2A-2: 리스트 만들기 탭 — "전체" = setPaletteList(null)
              setPaletteList(null);
            } else {
              selectList(null);
            }
          }}
        >
          <span className="tree-icon">●</span>
          <span className="tree-label">전체</span>
          <span className="tree-count">({lists.length})</span>
        </button>
        {filteredLists.map((list) => {
          const isExpanded = autoExpand.has(list.id);
          return (
            <div key={list.id} className="tree-folder-group">
              <button
                type="button"
                className={`tree-folder ${
                  mainTab === 'list-maker'
                    ? (paletteListId === list.id ? 'is-active' : '')
                    : (activeListId === list.id ? 'is-active' : '')
                }`}
                onClick={() => {
                  if (mainTab === 'list-maker') {
                    // 2A-2: 팔레트 소스 변경 (draft는 activeList 유지)
                    setPaletteList(list.id);
                  } else {
                    selectList(list.id);
                  }
                }}
              >
                <span
                  className="tree-arrow"
                  onClick={(e) => { e.stopPropagation(); toggleExpand(list.id); }}
                  role="button"
                  aria-label="펼치기"
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="tree-icon">▶</span>
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
                            if (mainTab === 'list-maker') {
                              // 2A-2: 팔레트 소스 변경만 (draft activeList 유지)
                              setPaletteList(list.id);
                            } else {
                              selectList(list.id);
                              selectCubeFn(cube.id);
                            }
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
                  className={`recent-item ${
                    mainTab === 'list-maker'
                      ? (paletteListId === list.id ? 'is-active' : '')
                      : (activeListId === list.id ? 'is-active' : '')
                  }`}
                  onClick={() => {
                    if (mainTab === 'list-maker') {
                      setPaletteList(list.id);
                    } else {
                      selectList(list.id);
                    }
                  }}
                  title={`${list.name} · ${list.cubes.length} 큐브`}
                >
                  <span className="recent-icon">●</span>
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

// R1-4: _LegacySidebar 삭제 (사용처 0 확인 후)

/** 2A-2: externalDnd = true 면 CubeGrid 내부 DndContext 래핑 생략 */
function GridArea({ externalDnd = false }: { externalDnd?: boolean }) {
  const { t } = useTranslation();
  const pack = useEditor((s) => s.pack);
  const listId = useEditor((s) => s.list_id);
  // 2A-2: draft_list 도 같이 확인 (list_id === draft.id 일 때 draft 반환)
  const draftList = useEditor((s) => s.draft_list);
  const list = (draftList && listId === draftList.id)
    ? draftList
    : (pack?.lists.find((l) => l.id === listId) ?? null);
  const currentFolder = useEditor(useShallow((s) => s.currentFolder()));
  const visibleCubes = useEditor(useShallow((s) => s.visibleCubes()));
  const scopedTotal = useEditor((s) => s.scopedCubes().length) // .length = 숫자, 안정;
  const totalPages = useEditor((s) => s.totalPages());
  const currentPage = useEditor((s) => s.current_page);
  const nextPage = useEditor((s) => s.nextPage);
  const prevPage = useEditor((s) => s.prevPage);
  const exitFolder = useEditor((s) => s.exitFolder);
  const setListLayout = useEditor((s) => s.setListLayout);
  const setListShowLabels = useEditor((s) => s.setListShowLabels);
  const applySkinToList = useEditor((s) => s.applySkinToList);
  const removeSkinFromList = useEditor((s) => s.removeSkinFromList);
  const removeCubeInGrid = useEditor((s) => s.removeCube);
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);

  // 2026-06-10: Delete 키 — 리스트 만들기(draft) 화면에서도 선택 큐브 삭제
  // (기존 핸들러는 CubeMakerCenter 마운트 중에만 동작 → list-maker 탭 미동작 버그)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Delete') return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      const state = useEditor.getState();
      const currentList = state.activeList();
      const selectedId = state.cube_id;
      if (!currentList || !selectedId) return;
      const cube = currentList.cubes.find((c) => c.id === selectedId);
      if (!cube) return;
      if (!window.confirm(`"${cube.label}" — ${t('inspector.delete_confirm')}`)) return;
      removeCubeInGrid(currentList.id, selectedId);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeCubeInGrid, t]);
  // W2: 스킨 다이얼로그
  const [skinDialogOpen, setSkinDialogOpen] = useState(false);

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
            onClick={() => setListShowLabels(list.id, list.show_labels === false)}
            aria-pressed={list.show_labels !== false}
            title={t('grid.show_labels')}
          >
            {list.show_labels !== false ? '라벨 ON' : '라벨 OFF'}
          </button>
          {/* W2: 스킨 버튼 */}
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setSkinDialogOpen(true)}
            title={t('skin.btn_label')}
          >
            {t('skin.btn_label')}
          </button>
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
      {/* W2: 스킨 다이얼로그 */}
      {skinDialogOpen && (
        <SkinDialog
          list={list}
          hasSkin={list.cubes.some(
            (c) => ((c.metadata ?? {}) as Record<string, unknown>).skin_source !== undefined,
          )}
          onApply={(matches) => applySkinToList(list.id, matches)}
          onRemove={() => removeSkinFromList(list.id)}
          onClose={() => setSkinDialogOpen(false)}
        />
      )}
      <CubeGrid list={list} visibleCubes={visibleCubes} externalDnd={externalDnd} />
    </main>
  );
}

/**
 * CubeGrid — 2A-2: externalDnd=true 일 때 내부 DndContext 래핑 생략.
 * SortableContext + 셀은 그대로, 외부 컨텍스트(ListMakerCenter)가 DnD 담당.
 */
function CubeGrid({
  list,
  visibleCubes,
  externalDnd = false,
}: {
  list: CubeList;
  visibleCubes: Cube[];
  externalDnd?: boolean;
}) {
  const addCubeAtSlot = useEditor((s) => s.addCubeAtSlot);
  const moveCubeToSlot = useEditor((s) => s.moveCubeToSlot);
  const addCubeToFolder = useEditor((s) => s.addCubeToFolder);
  const currentPage = useEditor((s) => s.current_page);
  const pageSize = useEditor((s) => s.pageSize());
  const selectCube = useEditor((s) => s.selectCube);
  const cube_id = useEditor((s) => s.cube_id);
  // #3: DragOverlay 상태 (CubeGrid 내부 DndContext 전용 — externalDnd=false 시 사용)
  const [gridDragCube, setGridDragCube] = useState<Cube | null>(null);
  // 동적 큐브 (live_clock/timer/gauge/battery) 1초 tick — R1-3 중앙 tick
  const { updates: dynamicUpdates, nowMs: liveNowMs } = useDynamicCubes(visibleCubes);
  // v0.1.2: states 있는 큐브 (hotkey_toggle 등) 상태 반영
  const stateUpdates = useCubeStates(visibleCubes);
  // v0.1.3 사전: 방향키 네비게이션 + Enter 실행
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!cube_id) return;
      const cols = list.cols ?? 4;
      const idx = visibleCubes.findIndex((c) => c.id === cube_id);
      if (idx < 0) return;
      let nextIdx: number = idx;
      switch (e.key) {
        case 'ArrowRight': nextIdx = Math.min(idx + 1, visibleCubes.length - 1); break;
        case 'ArrowLeft': nextIdx = Math.max(idx - 1, 0); break;
        case 'ArrowDown': nextIdx = Math.min(idx + cols, visibleCubes.length - 1); break;
        case 'ArrowUp': nextIdx = Math.max(idx - cols, 0); break;
        case 'Enter': {
          const cube = visibleCubes[idx];
          if (cube) {
            e.preventDefault();
            import('./lib/tauri-bridge').then(({ executeCube }) => {
              executeCube(cube).catch((err) => console.warn('[keyboard exec]', err));
            });
          }
          return;
        }
        default: return;
      }
      if (nextIdx !== idx && visibleCubes[nextIdx]) {
        e.preventDefault();
        selectCube(visibleCubes[nextIdx].id);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cube_id, visibleCubes, list.cols, selectCube]);
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

  function handleGridDragStart(e: DragStartEvent): void {
    const id = String(e.active.id);
    if (!id.startsWith('empty-')) {
      const cube = visibleCubes.find((c) => c.id === id);
      if (cube) setGridDragCube(cube);
    }
  }

  function handleDragEnd(e: DragEndEvent): void {
    setGridDragCube(null);
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
    // over 가 다른 큐브
    const overCube = visibleCubes.find((c) => c.id === overId);
    if (overCube) {
      // 2A: folder 위 + 드래그 큐브가 folder 아닌 경우 → 폴더에 추가
      const activeCube = visibleCubes.find((c) => c.id === activeId);
      if (overCube.action_type === 'folder' && activeCube?.action_type !== 'folder') {
        addCubeToFolder(list.id, overCube.id, activeId);
        return;
      }
      // 일반 → swap (moveCubeToSlot 가 swap 도 처리)
      moveCubeToSlot(list.id, activeId, overCube.sort_order);
    }
  }

  // 2A-2: externalDnd = true 면 DndContext 래핑 생략 (외부 컨텍스트 사용)
  const gridContent = (
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
            // 우선순위: states (hotkey_toggle 등) > dynamic (live_*)
            const stateOverride = stateUpdates.get(cube.id);
            const dyn = dynamicUpdates.get(cube.id);
            let displayCube = stateOverride ?? cube;
            if (dyn) {
              displayCube = {
                ...displayCube,
                label: dyn.label ?? displayCube.label,
                icon_url: dyn.icon_url ?? displayCube.icon_url,
              };
            }
            return <SortableCubeCell key={id} cube={displayCube} nowMs={liveNowMs} showLabels={list.show_labels} />;
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
  );

  if (externalDnd) {
    return gridContent;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleGridDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setGridDragCube(null)}
    >
      {gridContent}
      {/* #3: DragOverlay */}
      <DragOverlay>
        {gridDragCube && (
          <div
            style={{
              width: 96,
              height: 96,
              transform: 'scale(1.05)',
              transformOrigin: 'top left',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              borderRadius: 12,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <CubeCellVisual cube={gridDragCube} isDragging={false} />
          </div>
        )}
      </DragOverlay>
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
      {/* #1: 솔리드 타일 — ::after 에서 + 노출 */}
      <div className="cube-icon-bg" aria-hidden />
      <span className="cube-slot-num">{slotIndex}</span>
    </button>
  );
}

function SortableCubeCell({ cube, nowMs, showLabels }: { cube: Cube; nowMs?: number; showLabels?: boolean }) {
  const cube_id = useEditor((s) => s.cube_id);
  const selectCube = useEditor((s) => s.selectCube);
  const enterFolder = useEditor((s) => s.enterFolder);
  const activeListId = useEditor((s) => s.list_id);
  const selected = cube_id === cube.id;
  const isFolder = cube.action_type === 'folder';
  // v0.1.2: payload validation 상태 (invalid 시 셀에 빨간 ! dot 표시)
  const validationErrors = useMemo(
    () => {
      try {
        return validatePayload(cube.action_type, cube.action_payload);
      } catch {
        return [];
      }
    },
    [cube.action_type, cube.action_payload],
  );
  const isInvalid = validationErrors.length > 0;
  // v0.1.2: 우클릭 컨텍스트 메뉴
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

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
    // #3: 드래그 중 원본 셀은 opacity 0.3
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <>
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      role="gridcell"
      className="cube-cell"
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
      title={`${cube.label} (${cube.action_type})${isFolder ? '\n더블클릭 → 진입' : ''}${isInvalid ? `\n검증 오류:\n  · ${validationErrors.join('\n  · ')}` : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
      }}
      {...restAttrs}
      {...listeners}
    >
      {/* R1-1: CubeCellVisual 단일 렌더러 소비 */}
      <CubeCellVisual
        cube={cube}
        selected={selected}
        invalid={isInvalid}
        isDragging={isDragging}
        nowMs={nowMs}
        showLabels={showLabels}
      />
    </button>
      {menuPos && (
        <CubeContextMenu
          x={menuPos.x}
          y={menuPos.y}
          cubeId={cube.id}
          listId={activeListId}
          onClose={() => setMenuPos(null)}
        />
      )}
    </>
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

  const draftListInspector = useEditor((s) => s.draft_list);
  // 리스트 큐브 (현재 페이지 선택) 우선, 없으면 라이브러리 큐브.
  // draft 가 활성이면 draft_list 에서도 검색 (pack.lists 에는 없음).
  const listCube = (() => {
    if (!cube_id || !list_id) return null;
    // draft 분기
    if (draftListInspector && list_id === draftListInspector.id) {
      return draftListInspector.cubes.find((c) => c.id === cube_id) ?? null;
    }
    return pack?.lists.find((l) => l.id === list_id)?.cubes.find((c) => c.id === cube_id) ?? null;
  })();
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
      <CubePreview cube={cube} />
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
            aria-invalid={!cube.label.trim()}
            style={
              !cube.label.trim()
                ? { borderColor: '#dc2626', outlineColor: '#dc2626' }
                : undefined
            }
          />
          {!cube.label.trim() && (
            <div
              className="field-hint"
              role="alert"
              style={{ color: '#dc2626', marginTop: 4, fontSize: 11 }}
            >
              {t('inspector.label_required')}
            </div>
          )}
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
      {/* R1-2: live_* 큐브 → 정적 아이콘 토글 */}
      {cube.action_type.startsWith('live_') && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={(cube.metadata as Record<string, unknown> | undefined)?.live_static_icon === true}
              onChange={(e) => {
                const meta = { ...((cube.metadata as Record<string, unknown>) ?? {}), live_static_icon: e.target.checked };
                patch({ metadata: meta });
              }}
            />
            {t('inspector.live_static_icon')}
          </label>
          <span className="muted small">{t('inspector.live_static_icon_hint')}</span>
        </div>
      )}
      {/* v0.1.2: hotkey_toggle 등 toggle 성 액션 → states 편집 UI */}
      {(cube.action_type === 'hotkey_toggle' ||
        (cube.states && cube.states.length > 0)) && (
        <CubeStatesEditor
          cube={cube}
          onStatesChange={(states) => patch({ states })}
        />
      )}
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
                  ? status.lastError
                  : `마운트 중 또는 SDK 미초기화...`}
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
              같은 큐브를 큐브 리스트 만들기 페이지에 N번 배치하면 N개 독립 instance 작동
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
          title={cube.action_type === 'plugin_action' ? 'Plugin keyDown 발송' : (isTauri() ? 'PC 앱에서 실행' : '브라우저 dev')}
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
  const next: Partial<Cube> = {
    action_type: builtin,
    action_payload: defaultPayloadFor(builtin),
  };
  // v0.1.2: hotkey_toggle 자동 states 초기화 (ON/OFF 2개 기본)
  if (builtin === 'hotkey_toggle') {
    next.states = [
      { label: 'ON', action_payload: { keys: [] } },
      { label: 'OFF', action_payload: { keys: [] } },
    ];
  }
  patch(next);
}
