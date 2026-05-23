'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
import { CubeGrid } from './CubeGrid';
import { CubeContextMenu } from './CubeContextMenu';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { CubeEditSheet } from './CubeEditSheet';
import { ListManageSheet } from './ListManageSheet';
import { ImportSheet } from './ImportSheet';
import { CubeSearch } from './CubeSearch';
import { CubePackSheet } from './CubePackSheet';
import { exportCubeList, downloadAsFile } from '@/lib/cube-format/export';
import { importFromFile } from '@/lib/cube-format/import';

import { useShortcuts } from '@/lib/hooks/useShortcuts';
import { useHelperConnection } from '@/lib/hooks/useHelperConnection';
import { useCubeBoards } from '@/lib/hooks/useCubeBoards';
import { useDisplaySettings } from '@/lib/hooks/useDisplaySettings';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { useRealtimeBoards } from '@/lib/hooks/useRealtimeBoards';
import { useSession } from '@/lib/hooks/useSession';
import { parseActionPayload, getCubeEffectivePayload, type CubeBoard, type CubeItem } from '@/lib/types/cube';
import { trackPress } from '@/lib/telemetry';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast/useToast';
import { trigger as hapticTrigger } from '@/lib/haptics';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/lib/i18n/useTranslation';

const HEADER_COPY = {
  ko: {
    moveLeftAria: '현재 리스트를 앞으로 이동',
    moveLeftTitle: '현재 리스트를 앞으로',
    moveLeft: '← 앞으로',
    moveRightAria: '현재 리스트를 뒤로 이동',
    moveRightTitle: '현재 리스트를 뒤로',
    moveRight: '뒤로 →',
    settingsAria: '현재 리스트 관리',
    settings: '리스트 설정',
    newListAria: '새 리스트',
    newList: '+ 새 리스트',
    importAria: '가져오기',
    importTitle: '.cubeone / .cubelist / .cubepack 가져오기',
    importBtn: '가져오기',
    bundleAria: '큐브팩 만들기',
    bundleTitle: '여러 리스트를 묶어 .cubepack 파일로 만들기',
    bundleBtn: '묶음 만들기',
    exportAria: '현재 리스트 내보내기',
    exportTitle: '현재 리스트를 .cubelist 파일로 내보내기',
    exportBtn: '내보내기',
    exportSuccess: (name: string) => `${name} 내보내기 완료`,
    addCubeSuccess: '큐브 추가 — 내용을 편집해주세요',
    addCubeFailPrefix: '추가 실패',
    loginRequired: '로그인이 필요합니다',
    fileImportLabel: '파일 가져오기',
    colsLabel: '한 줄당',
    colsAria: '한 줄당 큐브 개수',
    colsUnit: '개',
    searchAria: '큐브 검색',
    searchBtn: '검색',
  },
  en: {
    moveLeftAria: 'Move current list left',
    moveLeftTitle: 'Move current list left',
    moveLeft: '← Left',
    moveRightAria: 'Move current list right',
    moveRightTitle: 'Move current list right',
    moveRight: 'Right →',
    settingsAria: 'Manage current list',
    settings: 'List settings',
    newListAria: 'New list',
    newList: '+ New list',
    importAria: 'Import',
    importTitle: 'Import .cubeone / .cubelist / .cubepack',
    importBtn: 'Import',
    bundleAria: 'Create cubepack',
    bundleTitle: 'Bundle multiple lists into a .cubepack',
    bundleBtn: 'Create pack',
    exportAria: 'Export current list',
    exportTitle: 'Export current list as .cubelist',
    exportBtn: 'Export',
    exportSuccess: (name: string) => `Exported "${name}"`,
    addCubeSuccess: 'Cube added — edit its content',
    addCubeFailPrefix: 'Add failed',
    loginRequired: 'Sign-in required',
    fileImportLabel: 'File import',
    colsLabel: 'Per row',
    colsAria: 'Cubes per row',
    colsUnit: '',
    searchAria: 'Search cubes',
    searchBtn: 'Search',
  },
  ja: {
    moveLeftAria: '現在のリストを左へ移動',
    moveLeftTitle: '現在のリストを左へ',
    moveLeft: '← 左へ',
    moveRightAria: '現在のリストを右へ移動',
    moveRightTitle: '現在のリストを右へ',
    moveRight: '右へ →',
    settingsAria: '現在のリストを管理',
    settings: 'リスト設定',
    newListAria: '新規リスト',
    newList: '+ 新規リスト',
    importAria: '取り込み',
    importTitle: '.cubeone / .cubelist / .cubepack を取り込み',
    importBtn: '取り込み',
    bundleAria: 'キューブパック作成',
    bundleTitle: '複数リストを .cubepack に束ねる',
    bundleBtn: 'パック作成',
    exportAria: '現在のリストをエクスポート',
    exportTitle: '現在のリストを .cubelist でエクスポート',
    exportBtn: 'エクスポート',
    exportSuccess: (name: string) => `${name} をエクスポートしました`,
    addCubeSuccess: 'キューブを追加しました — 内容を編集してください',
    addCubeFailPrefix: '追加失敗',
    loginRequired: 'ログインが必要です',
    fileImportLabel: 'ファイル取り込み',
    colsLabel: '1行あたり',
    colsAria: '1行あたりのキューブ数',
    colsUnit: '個',
    searchAria: 'キューブ検索',
    searchBtn: '検索',
  },
} as const;

interface CubeListViewProps {
  editMode: boolean;
  /** 보기 모드 long-press 시 호출 — iOS jiggle 진입 (page.tsx의 setEditMode(true)) */
  onRequestEdit?: () => void;
  /** Empty state에서 "라이브러리 둘러보기" 버튼 — page.tsx의 setViewMode('table') */
  onOpenLibrary?: () => void;
  /** 편집 모드 + 큐브 선택 시 호출 — page.tsx의 setSelectedCubeId (Stream Deck 인스펙터) */
  onSelectCube?: (item: CubeItem | null) => void;
  /** 외부에서 알린 현재 선택 큐브 ID (보드 전환 시 자동 해제용) */
  selectedCubeId?: string | null;
}

/**
 * 큐브 리스트 본 View — 탭(스와이프)으로 board 전환 + 각 board는 그리드.
 *
 * 정착 원칙(tech-review.md §7)
 * - 보기 모드: Embla 스와이프 활성
 * - 편집 모드: 스와이프 잠금 (상단 점 탭으로만 board 이동)
 * - 편집 모드 + 큐브 길게 누름 → CubeEditSheet
 * - 헤더 + 버튼 → ListManageSheet (새 리스트 / 이름 변경)
 */
export function CubeListView({ editMode, onRequestEdit, onOpenLibrary, onSelectCube, selectedCubeId }: CubeListViewProps) {
  const {
    boards: allBoards,
    activeBoardId,
    setActiveBoard,
    reorderItems,
    loadBoards,
    moveBoard,
    lastError,
    clearLastError,
  } = useCubeBoards();
  const { activeWorkspaceId } = useWorkspace();
  // 활성 워크스페이스의 보드만 필터링 (null = 기본 워크스페이스 = workspace_id 미지정 보드)
  const boards = useMemo(
    () => allBoards.filter((b) => (b.workspace_id ?? null) === activeWorkspaceId),
    [allBoards, activeWorkspaceId],
  );

  // 워크스페이스 전환 시 활성 보드가 다른 ws에 속하면 첫 보드로 자동 전환
  useEffect(() => {
    if (boards.length === 0) return;
    if (!activeBoardId || !boards.some((b) => b.id === activeBoardId)) {
      setActiveBoard(boards[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, boards.length]);
  const helper = useHelperConnection();
  const { user } = useSession();
  const { locale } = useTranslation();
  const { cols: displayCols, setCols: setDisplayCols, minCols, maxCols } = useDisplaySettings();
  const hc = HEADER_COPY[locale] ?? HEADER_COPY.ko;

  // Realtime 변경 디바운스 — 짧은 시간 내 여러 변경 시 1회만 reload
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedReload = useCallback((): void => {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      void loadBoards();
    }, 300);
  }, [loadBoards]);

  useRealtimeBoards({
    userId: user?.id ?? null,
    activeBoardId,
    onBoardsChanged: debouncedReload,
    onItemsChanged: debouncedReload,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    watchDrag: !editMode,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingItem, setEditingItem] = useState<CubeItem | null>(null);
  const [managingBoard, setManagingBoard] = useState<CubeBoard | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [importing, setImporting] = useState(false);
  const [packing, setPacking] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  // 큐브 컨텍스트 메뉴 상태 (TUS, 2026-05-23)
  const [contextMenu, setContextMenu] = useState<{
    item: CubeItem;
    x: number;
    y: number;
  } | null>(null);

  /**
   * 스크린리더 알림 emit — 같은 메시지 반복 시 발화하도록 강제 reset.
   * 50ms 동안 빈 문자열 → 새 메시지로 텍스트 변경 트리거.
   */
  const announce = useCallback((msg: string): void => {
    setLiveAnnouncement('');
    requestAnimationFrame(() => setLiveAnnouncement(msg));
  }, []);

  // 보드 개수 변경 추적 — 추가/제거를 스크린리더에 1회 알림
  const prevBoardsCountRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = prevBoardsCountRef.current;
    prevBoardsCountRef.current = boards.length;
    if (prev === null) return; // 첫 로드는 알림 X
    if (boards.length > prev) {
      const added = boards.length - prev;
      announce(
        locale === 'en'
          ? `${added} list${added > 1 ? 's' : ''} added · total ${boards.length}`
          : locale === 'ja'
            ? `リスト ${added} 件追加 · 合計 ${boards.length}`
            : `리스트 ${added}개 추가 · 총 ${boards.length}개`,
      );
    } else if (boards.length < prev) {
      const removed = prev - boards.length;
      announce(
        locale === 'en'
          ? `${removed} list${removed > 1 ? 's' : ''} removed · total ${boards.length}`
          : locale === 'ja'
            ? `リスト ${removed} 件削除 · 合計 ${boards.length}`
            : `리스트 ${removed}개 삭제 · 총 ${boards.length}개`,
      );
    }
  }, [boards.length, locale, announce]);

  // 시트·모달 열림 신호 — 단축키 게이트
  const anySheetOpen =
    searchOpen ||
    editingItem !== null ||
    managingBoard !== null ||
    creatingList ||
    importing ||
    packing;

  // `/` 단축키로 검색 모달 열기 (정착본 §7) — QB: useMemo로 stable reference (page.tsx와 일관)
  const searchBindings = useMemo(
    () => [
      { key: '/', label: '큐브 검색', handler: () => setSearchOpen(true) },
      { key: 'k', mod: true, label: '큐브 검색 (Cmd/Ctrl+K)', handler: () => setSearchOpen(true) },
    ],
    [],
  );
  useShortcuts(searchBindings, { disabled: anySheetOpen });

  // ?board=:id 쿼리 → 마운트 시 1회 활성 보드 전환 (DN 진입 핸들)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryBoardId = searchParams?.get('board') ?? null;
  const querySeedFile = searchParams?.get('seed') ?? null;

  // ET — seed/board 처리 완료 후 URL 깨끗하게 (브라우저 history는 유지)
  function stripQueryParam(param: string): void {
    if (!searchParams || !pathname) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const appliedBoardQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (!queryBoardId) return;
    if (appliedBoardQueryRef.current === queryBoardId) return;
    const idx = boards.findIndex((b) => b.id === queryBoardId);
    if (idx === -1) return; // 아직 보드 로드 전이면 다음 effect cycle에서 재시도
    setActiveBoard(queryBoardId);
    emblaApi?.scrollTo(idx);
    appliedBoardQueryRef.current = queryBoardId;
    stripQueryParam('board');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryBoardId, boards, setActiveBoard, emblaApi]);

  // ?seed=:file 쿼리 → /api/seeds/:file fetch 후 ImportSheet 자동 진입 (DZ)
  const [seedText, setSeedText] = useState<string | null>(null);
  const [seedFetching, setSeedFetching] = useState(false);
  const appliedSeedRef = useRef<string | null>(null);
  const { showToast: showSeedToast } = useToast();
  useEffect(() => {
    if (!querySeedFile) return;
    if (appliedSeedRef.current === querySeedFile) return;
    appliedSeedRef.current = querySeedFile;
    setSeedFetching(true);
    // unmount 후 setState 호출 차단 (React warning 방지)
    let mounted = true;
    void (async () => {
      const retryHint =
        locale === 'en'
          ? '— Reopen the seed catalog and click "Open in Cube List" again to retry.'
          : locale === 'ja'
            ? '— シード カタログを再度開いて「キューブ・リストで開く」を押すと再試行できます。'
            : '— /seeds 페이지에서 "큐브 리스트에서 열기"를 다시 누르면 재시도됩니다.';
      // 5초 timeout — 느린 네트워크에서 무한 대기 차단
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000);
      try {
        const res = await fetch(`/api/seeds/${encodeURIComponent(querySeedFile)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          showSeedToast({
            level: 'error',
            message: `시드 '${querySeedFile}' 를 불러오지 못했습니다 (${res.status}) ${retryHint}`,
            duration: 7_000,
          });
          // 실패 URL 정리 — 같은 ?seed=... 무한 retry 방지 (재진입은 카드에서 다시 클릭)
          stripQueryParam('seed');
          return;
        }
        // v3 ZIP 처리 — blob 받아 File로 변환 후 importFromFile 직접 호출
        // (ImportSheet 우회: 시드는 Rebirth Station 안전 출처라 preview 단계 생략)
        const blob = await res.blob();
        if (!mounted) return;
        const seedFile = new File([blob], querySeedFile, { type: blob.type });
        const result = await importFromFile(seedFile);
        if (!mounted) return;
        if (result.success) {
          await loadBoards();
          showSeedToast({
            level: 'success',
            message: `시드 '${querySeedFile}' import 완료 (보드 ${result.insertedBoards}/큐브 ${result.insertedItems})`,
            duration: 4_500,
          });
        } else {
          showSeedToast({
            level: 'error',
            message: `시드 import 실패: ${result.reason}`,
            duration: 6_000,
          });
        }
        stripQueryParam('seed');
      } catch (e) {
        clearTimeout(timeoutId);
        const isAbort = (e as Error).name === 'AbortError';
        const timeoutMsg =
          locale === 'en'
            ? 'Request timed out (5s)'
            : locale === 'ja'
              ? 'リクエストがタイムアウトしました (5秒)'
              : '요청이 시간 초과되었습니다 (5초)';
        const msg = isAbort ? timeoutMsg : (e as Error).message;
        showSeedToast({
          level: 'error',
          message: `시드 불러오기 실패: ${msg} ${retryHint}`,
          duration: 7_000,
        });
        // 무한 retry 방지 — URL 정리 (재진입은 카드에서 다시 클릭)
        stripQueryParam('seed');
      } finally {
        if (mounted) setSeedFetching(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // stripQueryParam은 closure 안에서만 호출 — deps 추가 시 무한루프 우려
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySeedFile, showSeedToast]);

  const handleSearchSelect = useCallback(
    (boardId: string, itemId: string): void => {
      setActiveBoard(boardId);
      const idx = boards.findIndex((b) => b.id === boardId);
      if (idx !== -1) emblaApi?.scrollTo(idx);
      setHighlightedItemId(itemId);
      // sr-only 안내 — 검색 결과로 점프했음을 알림
      const board = boards.find((b) => b.id === boardId);
      const item = board?.items.find((i) => i.id === itemId);
      if (item && board) {
        const msg =
          locale === 'en'
            ? `Jumped to "${item.label}" in "${board.name}"`
            : locale === 'ja'
              ? `「${board.name}」の「${item.label}」へ移動しました`
              : `"${board.name}"의 "${item.label}"로 이동했습니다`;
        announce(msg);
      }
      window.setTimeout(() => setHighlightedItemId(null), 2_000);
    },
    [boards, setActiveBoard, emblaApi, locale, announce],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = (): void => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  // store lastError watch → Toast로 노출
  const { showToast: showStoreErr } = useToast();
  useEffect(() => {
    if (!lastError) return;
    showStoreErr({ level: 'error', message: lastError.message });
    clearLastError();
  }, [lastError, showStoreErr, clearLastError]);

  // Phase 6: 전역 키보드 좌/우 = 보드 전환 (편집 모드 외 + 입력 포커스 외)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent): void => {
      if (editMode) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        e.preventDefault();
        emblaApi?.scrollTo(selectedIndex - 1);
      } else if (e.key === 'ArrowRight' && selectedIndex < boards.length - 1) {
        e.preventDefault();
        emblaApi?.scrollTo(selectedIndex + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editMode, selectedIndex, boards.length, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const idx = boards.findIndex((b) => b.id === activeBoardId);
    if (idx !== -1 && idx !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(idx);
    }
  }, [emblaApi, boards, activeBoardId]);

  /**
   * 폴더 진입 스택 — Stream Deck Folder 패턴 (큐브 안에 큐브).
   * 활성 보드 내 cube_id 스택. 비어있으면 최상위.
   * 폴더 큐브 onPress 시 push, "뒤로" 큐브 onPress 시 pop.
   */
  const [folderStack, setFolderStack] = useState<string[]>([]);

  /**
   * 폴더 스택에 따라 표시되는 큐브 계산.
   * - 최상위: 어떤 폴더에도 속하지 않은 큐브들 + 모든 폴더 큐브
   * - 폴더 안: 첫 셀에 "← 뒤로" + 폴더의 cube_ids 안 큐브 (sort_order 정렬)
   */
  const getDisplayItems = useCallback(
    (board: CubeBoard, stack: string[]): CubeItem[] => {
      // 어딘가 폴더의 cube_ids에 속한 ID 수집
      const inSomeFolder = new Set<string>();
      for (const it of board.items) {
        if (it.action_type === 'folder') {
          const ids = (it.action_payload as { cube_ids?: string[] })?.cube_ids;
          if (Array.isArray(ids)) ids.forEach((id) => inSomeFolder.add(id));
        }
      }

      if (stack.length === 0) {
        return board.items.filter((it) => !inSomeFolder.has(it.id));
      }

      const folderId = stack[stack.length - 1];
      const folder = board.items.find((it) => it.id === folderId);
      const cubeIds =
        folder && folder.action_type === 'folder'
          ? ((folder.action_payload as { cube_ids?: string[] })?.cube_ids ?? [])
          : [];

      const backCube: CubeItem = {
        id: '__back__',
        board_id: board.id,
        sort_order: -1,
        label:
          locale === 'en' ? '← Back' : locale === 'ja' ? '← 戻る' : '← 뒤로',
        icon_url: null,
        action_type: 'folder',
        action_payload: { cube_ids: [] },
        metadata: { __back__: true, bg_color: 'midnight' },
        created_at: '',
        updated_at: '',
      };

      const items = cubeIds
        .map((id) => board.items.find((it) => it.id === id))
        .filter((it): it is CubeItem => it !== undefined)
        .sort((a, b) => a.sort_order - b.sort_order);

      return [backCube, ...items];
    },
    [locale],
  );

  /** 폴더 경로 (스택의 각 cube label 추출) */
  const folderPath = useMemo(() => {
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return [];
    return folderStack
      .map((id) => board.items.find((it) => it.id === id)?.label ?? '?')
      .filter(Boolean);
  }, [boards, activeBoardId, folderStack]);

  // 보드 전환 시 폴더 스택 초기화
  useEffect(() => {
    setFolderStack([]);
  }, [activeBoardId]);

  const handlePress = (item: CubeItem): void => {
    hapticTrigger('light');
    // 뒤로 가기 가상 큐브
    if (item.id === '__back__') {
      setFolderStack((prev) => prev.slice(0, -1));
      return;
    }
    // 편집 모드: 탭 = 선택 (인스펙터 갱신), 액션 실행 X — Stream Deck 모델
    if (editMode) {
      onSelectCube?.(item);
      return;
    }
    // 폴더 진입
    if (item.action_type === 'folder') {
      setFolderStack((prev) => [...prev, item.id]);
      return;
    }
    // SD-V (2026-05-23): multi-state 큐브 탭 시 state 인덱스 +1 (mod states.length)
    // metadata.states[] 정의된 경우만 동작, 단일 state는 무영향
    if (isLocalMode()) {
      const states = Array.isArray(item.metadata?.states) ? item.metadata.states : [];
      if (states.length > 1) {
        const curState =
          typeof item.metadata?.state === 'number' && (item.metadata.state as number) >= 0
            ? Math.floor(item.metadata.state as number)
            : 0;
        const nextState = (curState + 1) % states.length;
        const newMeta = { ...((item.metadata ?? {}) as Record<string, unknown>) };
        newMeta.state = nextState;
        localStore.updateItem(item.id, { metadata: newMeta });
        void loadBoards();
      }
    }
    // SD-CH-2 (2026-05-23): multi-state 큐브의 effective payload 적용 (state별 다른 동작)
    const effectivePayload = getCubeEffectivePayload(item);
    const action = parseActionPayload({ ...item, action_payload: effectivePayload });
    // SD-AE (2026-05-23): shortcut/macro 큐브는 PC helper 필요 — 미연결 시 toast 안내
    if ((item.action_type === 'shortcut' || item.action_type === 'macro') && helper.status !== 'connected') {
      const msg =
        locale === 'en'
          ? 'PC helper not connected — shortcut/macro requires pairing'
          : locale === 'ja'
            ? 'PC ヘルパー未接続 — ショートカット/マクロにはペアリングが必要'
            : 'PC 헬퍼 미연결 — 단축키/매크로 실행에 페어링이 필요합니다';
      showToast({ level: 'warning', message: msg, duration: 2_500 });
    }
    helper.sendPressItem(activeBoardId ?? '', item.id, 'tap', action);
    trackPress({
      boardId: activeBoardId,
      itemId: item.id,
      actionType: item.action_type,
      pressKind: 'tap',
      status: { kind: 'ok' },
      elapsedMs: null,
      mountMode:
        typeof document !== 'undefined' &&
        document.body.querySelector('.cubelist-mount-mode') !== null,
      doublePressGuard: Boolean(item.metadata?.confirm_double_press),
    });
  };

  const handleLongPress = (item: CubeItem): void => {
    // iOS jiggle UX: 보기 모드 long-press = 편집 모드 진입 (jiggle 시작)
    if (!editMode) {
      onRequestEdit?.();
      return;
    }
    setEditingItem(item);
  };

  const handleDeleteCube = useCallback(
    async (item: CubeItem): Promise<void> => {
      if (isLocalMode()) {
        localStore.deleteItem(item.id);
        await loadBoards();
        return;
      }
      const supabase = getSupabase();
      const { error } = await supabase.from('mylist_items').delete().eq('id', item.id);
      if (error) {
        showToast({ level: 'error', message: `삭제 실패: ${error.message}` });
        return;
      }
      await loadBoards();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 큐브 우클릭 컨텍스트 메뉴 (TUS, 2026-05-23) — 편집 모드만 활성
  const handleContextMenuCube = useCallback(
    (item: CubeItem, x: number, y: number): void => {
      if (!editMode) return;
      setContextMenu({ item, x, y });
    },
    [editMode],
  );

  // 큐브 복제 (TUT, 2026-05-23)
  const handleDuplicateCube = useCallback(
    (item: CubeItem): void => {
      if (!isLocalMode()) {
        showToast({ level: 'warning', message: 'LOCAL_MODE에서만 동작' });
        return;
      }
      const newItem = localStore.duplicateItem(item.id);
      if (newItem) {
        void loadBoards();
        showToast({ level: 'success', message: '복제됨', duration: 1_200 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 컨텍스트 메뉴 색상 변경 (TUS, 2026-05-23) — Inspector handleColorChange 동일 로직
  const handleContextColorChange = useCallback(
    (item: CubeItem, preset: import('@/lib/types/cube').CubeBgPreset): void => {
      if (!isLocalMode()) return;
      const newMeta = { ...((item.metadata ?? {}) as Record<string, unknown>) };
      newMeta.bg_color = preset;
      localStore.updateItem(item.id, { metadata: newMeta });
      void loadBoards();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { showToast } = useToast();

  const handleAddCube = useCallback(
    async (boardId: string): Promise<void> => {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        showToast({ level: 'warning', message: hc.loginRequired });
        return;
      }
      // 현재 보드 items의 max(sort_order) + 1.0, 빈 보드면 0.0
      const board = boards.find((b) => b.id === boardId);
      const maxOrder = board && board.items.length > 0
        ? Math.max(...board.items.map((it) => it.sort_order))
        : -1;
      const nextSortOrder = maxOrder + 1.0;

      const { data: newItem, error } = await supabase
        .from('mylist_items')
        .insert({
          board_id: boardId,
          sort_order: nextSortOrder,
          label: '새 큐브',
          action_type: 'link',
          action_payload: { url: 'https://' },
        })
        .select('*')
        .single();
      if (error || !newItem) {
        showToast({ level: 'error', message: `${hc.addCubeFailPrefix}: ${error?.message ?? 'unknown'}` });
        return;
      }
      await loadBoards();
      setEditingItem(newItem as CubeItem);
      showToast({ level: 'success', message: hc.addCubeSuccess });
    },
    [boards, loadBoards, showToast],
  );

  if (boards.length === 0) {
    return (
      <>
        <EmptyState
          onCreate={() => setCreatingList(true)}
          onImport={() => setImporting(true)}
          onOpenLibrary={onOpenLibrary}
        />
        <ListManageSheet
          open={creatingList}
          board={null}
          onClose={() => setCreatingList(false)}
          onSaved={async (createdId) => {
            await loadBoards();
            if (createdId) setActiveBoard(createdId);
          }}
          onDeleted={() => void loadBoards()}
        />
        <ImportSheet
          open={importing}
          onClose={() => {
            setImporting(false);
            setSeedText(null);
          }}
          onImported={() => void loadBoards()}
          initialText={seedText}
        />
      </>
    );
  }

  const currentBoard = boards.find((b) => b.id === activeBoardId) ?? boards[selectedIndex];
  const showEmptyBoardHint = currentBoard && currentBoard.items.length === 0;

  return (
    <div className="flex flex-col">
      {seedFetching && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border shadow-md text-xs text-ink-muted"
        >
          <Spinner size="sm" />
          <span>
            {locale === 'en'
              ? 'Loading seed…'
              : locale === 'ja'
                ? 'シードを読み込み中…'
                : '시드 불러오는 중…'}
          </span>
        </div>
      )}
      <span className="cubelist-sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </span>

      {/* 활성 보드 헤더 라벨 — 보드 21+ 시 사용자가 현재 위치 즉시 인지 + 폴더 경로 */}
      {currentBoard && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-ink truncate max-w-[60vw]">
            {currentBoard.name}
          </h2>
          {folderPath.length > 0 && (
            <span className="text-xs text-rbs-accent truncate max-w-[40vw]">
              {folderPath.map((label) => `/ ${label}`).join(' ')}
            </span>
          )}
          <span className="text-xs text-ink-muted">
            {locale === 'en'
              ? `${currentBoard.items.length} cube${currentBoard.items.length === 1 ? '' : 's'}`
              : locale === 'ja'
                ? `${currentBoard.items.length} 個`
                : `${currentBoard.items.length}개`}
          </span>
          {boards.length > 1 && (
            <span className="text-[10px] text-ink-muted opacity-70">
              · {selectedIndex + 1} / {boards.length}
            </span>
          )}
        </div>
      )}
      {showEmptyBoardHint && (
        <div
          role="note"
          className="mx-4 mt-3 mb-1 px-3 py-2 rounded-lg bg-rbs-accent-soft border border-rbs-accent/30 text-xs text-rbs-accent-strong dark:bg-rbs-accent/15 dark:text-rbs-accent"
        >
          {editMode
            ? locale === 'en'
              ? 'Tap a + cell to add your first cube'
              : locale === 'ja'
                ? '空のセルの + を押して最初のキューブを追加してください'
                : '빈 칸의 + 버튼을 눌러 첫 큐브를 추가해주세요'
            : locale === 'en'
              ? 'No cubes yet. Use the "Edit" button at the top right.'
              : locale === 'ja'
                ? 'まだキューブがありません。右上の「編集」から追加できます。'
                : '아직 큐브가 없습니다. 우측 상단 "편집" 버튼으로 추가하세요'}
        </div>
      )}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {boards.map((board, idx) => (
            <div
              key={board.id}
              className="flex-[0_0_100%] min-w-0"
              role="tabpanel"
              id={`cubelist-tabpanel-${board.id}`}
              aria-labelledby={`cubelist-tab-${board.id}`}
              aria-hidden={idx !== selectedIndex}
            >
              <CubeGrid
                items={board.id === activeBoardId ? getDisplayItems(board, folderStack) : board.items}
                cols={displayCols}
                editMode={editMode}
                onPress={handlePress}
                onLongPress={handleLongPress}
                onDeleteCube={(item) => void handleDeleteCube(item)}
                onContextMenuCube={handleContextMenuCube}
                onFocusChange={(item) => {
                  // TVI (2026-05-23): 편집 모드에서 키보드 네비로 큐브 focus 변경 시 인스펙터 동기화
                  if (editMode) onSelectCube?.(item);
                }}
                highlightedItemId={
                  board.id === activeBoardId
                    ? (selectedCubeId ?? highlightedItemId)
                    : highlightedItemId
                }
                onReorder={(next) => {
                  // 폴더 안 reorder는 폴더 큐브의 cube_ids 배열 순서 갱신 (sort_order 미사용)
                  if (folderStack.length > 0 && board.id === activeBoardId) {
                    const folderId = folderStack[folderStack.length - 1];
                    const newIds = next.filter((it) => it.id !== '__back__').map((it) => it.id);
                    if (isLocalMode()) {
                      localStore.updateItem(folderId, {
                        action_payload: { cube_ids: newIds },
                      });
                      void loadBoards();
                    }
                    return;
                  }
                  reorderItems(board.id, next);
                }}
                onAddCube={() => void handleAddCube(board.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지 인디케이터 도트 (TUX, 2026-05-23 / TVJ 클릭 핸들러) — 그리드 하단 sm 이상 시각화 */}
      {boards.length > 1 && (
        <div
          className="hidden sm:flex justify-center items-center gap-1.5 pt-2 pb-1"
          role="navigation"
          aria-label="보드 페이지 도트"
        >
          {boards.map((board, idx) => (
            <button
              key={`page-dot-${board.id}`}
              type="button"
              onClick={() => {
                emblaApi?.scrollTo(idx);
                setActiveBoard(board.id);
              }}
              className={
                idx === selectedIndex
                  ? 'w-2 h-2 rounded-full bg-rbs-accent transition-all hover:scale-125'
                  : 'w-1.5 h-1.5 rounded-full bg-border transition-all hover:bg-rbs-accent/60 hover:scale-125'
              }
              title={`${board.name} (${idx + 1}/${boards.length})`}
              aria-label={`${board.name} (${idx + 1}/${boards.length})`}
              aria-current={idx === selectedIndex}
            />
          ))}
        </div>
      )}

      <div
        className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 py-3 px-2"
        role="tablist"
        aria-label="큐브 리스트 보드 선택"
        onKeyDown={(e) => {
          if (boards.length === 0) return;
          const goTo = (next: number): void => {
            const clamped = Math.max(0, Math.min(boards.length - 1, next));
            emblaApi?.scrollTo(clamped);
            setActiveBoard(boards[clamped].id);
            requestAnimationFrame(() => {
              const el = document.getElementById(`cubelist-tab-${boards[clamped].id}`);
              el?.focus();
            });
          };
          switch (e.key) {
            case 'ArrowRight':
              e.preventDefault();
              goTo(selectedIndex + 1);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              goTo(selectedIndex - 1);
              break;
            case 'Home':
              e.preventDefault();
              goTo(0);
              break;
            case 'End':
              e.preventDefault();
              goTo(boards.length - 1);
              break;
          }
        }}
      >
        {boards.map((board, idx) => (
          <button
            key={board.id}
            type="button"
            role="tab"
            id={`cubelist-tab-${board.id}`}
            aria-selected={idx === selectedIndex}
            aria-controls={`cubelist-tabpanel-${board.id}`}
            aria-label={board.name}
            aria-keyshortcuts={idx < 9 ? String(idx + 1) : undefined}
            title={idx < 9 ? `${board.name} (Stage 2: ${idx + 1}번 단축키)` : board.name}
            tabIndex={idx === selectedIndex ? 0 : -1}
            onClick={() => {
              emblaApi?.scrollTo(idx);
              setActiveBoard(board.id);
            }}
            className={
              idx === selectedIndex
                ? 'rounded-full bg-rbs-accent transition-all w-6 h-2 sm:w-auto sm:h-auto sm:px-3 sm:py-1 sm:text-xs sm:font-medium sm:text-white'
                : 'rounded-full bg-border hover:bg-ink-muted/60 transition-all w-2 h-2 sm:w-auto sm:h-auto sm:px-3 sm:py-1 sm:text-xs sm:bg-surface-2 sm:text-ink sm:hover:bg-rbs-accent-soft sm:hover:text-rbs-accent-strong dark:sm:hover:text-rbs-accent'
            }
          >
            <span className="hidden sm:inline truncate max-w-[140px]">{board.name}</span>
          </button>
        ))}

        {/* 검색 버튼 (편집 모드 외 + 보드 1+) — 단축키 / 또는 Cmd/Ctrl+K 미인지 사용자 발견성 */}
        {!editMode && boards.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-1.5 ml-1 text-xs px-2.5 py-1 rounded-full border border-border text-ink-muted hover:bg-surface-2 hover:text-rbs-accent"
            aria-label={hc.searchAria}
            aria-keyshortcuts="/ Control+k"
            title="/ 또는 Cmd/Ctrl+K"
          >
            <span>🔍</span>
            <span className="hidden sm:inline">{hc.searchBtn}</span>
            <kbd className="hidden sm:inline text-[10px] opacity-60">/</kbd>
          </button>
        )}

        {editMode && (
          <>
            <span className="mx-1 text-ink-muted">|</span>
            <button
              type="button"
              onClick={() => currentBoard && void moveBoard(currentBoard.id, -1)}
              disabled={!currentBoard || selectedIndex === 0}
              className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2 disabled:opacity-30"
              aria-label={hc.moveLeftAria}
              title={hc.moveLeftTitle}
            >
              {hc.moveLeft}
            </button>
            <button
              type="button"
              onClick={() => currentBoard && void moveBoard(currentBoard.id, 1)}
              disabled={!currentBoard || selectedIndex === boards.length - 1}
              className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2 disabled:opacity-30"
              aria-label={hc.moveRightAria}
              title={hc.moveRightTitle}
            >
              {hc.moveRight}
            </button>
            <button
              type="button"
              onClick={() => currentBoard && setManagingBoard(currentBoard)}
              className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2"
              aria-label={hc.settingsAria}
            >
              {hc.settings}
            </button>
            <button
              type="button"
              onClick={() => setCreatingList(true)}
              className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2"
              aria-label={hc.newListAria}
            >
              {hc.newList}
            </button>
            <span
              className="text-[10px] text-ink-muted italic"
              title={
                locale === 'en'
                  ? 'Multi-select cubes — coming in Stage 2'
                  : locale === 'ja'
                    ? '複数選択 — Stage 2 で対応'
                    : '큐브 다중 선택 — Stage 2 예정'
              }
            >
              {locale === 'en'
                ? '⌧ multi-select (Stage 2)'
                : locale === 'ja'
                  ? '⌧ 複数選択 (Stage 2)'
                  : '⌧ 다중 선택 (Stage 2)'}
            </span>
            <button
              type="button"
              onClick={() => setImporting(true)}
              className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2"
              aria-label={hc.importAria}
              title={hc.importTitle}
            >
              {hc.importBtn}
            </button>
            <button
              type="button"
              onClick={() => setPacking(true)}
              disabled={boards.length === 0}
              className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2 disabled:opacity-40"
              aria-label={hc.bundleAria}
              title={hc.bundleTitle}
            >
              {hc.bundleBtn}
            </button>
            {currentBoard && (
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const blob = await exportCubeList(currentBoard, { license: 'personal' });
                    downloadAsFile(
                      `${currentBoard.name.replace(/[^a-z0-9가-힣_-]+/gi, '_')}.cubelist`,
                      blob,
                    );
                    showToast({
                      level: 'success',
                      message: hc.exportSuccess(currentBoard.name),
                    });
                  })();
                }}
                className="text-xs px-2 py-1 rounded-md border hover:bg-surface-2"
                aria-label={hc.exportAria}
                title={hc.exportTitle}
              >
                {hc.exportBtn}
              </button>
            )}
          </>
        )}
      </div>

      <CubeEditSheet
        open={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={() => void loadBoards()}
        onDeleted={() => void loadBoards()}
      />

      <ListManageSheet
        open={managingBoard !== null || creatingList}
        board={managingBoard}
        onClose={() => {
          setManagingBoard(null);
          setCreatingList(false);
        }}
        onSaved={async (createdId) => {
          await loadBoards();
          if (createdId) setActiveBoard(createdId);
        }}
        onDeleted={() => void loadBoards()}
      />

      <ImportSheet
        open={importing}
        onClose={() => {
          setImporting(false);
          setSeedText(null);
        }}
        onImported={() => void loadBoards()}
        initialText={seedText}
      />

      <CubeSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        boards={boards}
        onSelect={handleSearchSelect}
      />

      <CubePackSheet
        open={packing}
        onClose={() => setPacking(false)}
        boards={boards}
      />

      {/* 큐브 컨텍스트 메뉴 (TUS, 2026-05-23) */}
      <CubeContextMenu
        open={contextMenu !== null}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : { x: 0, y: 0 }}
        item={contextMenu?.item ?? null}
        onClose={() => setContextMenu(null)}
        onEdit={(item) => setEditingItem(item)}
        onDuplicate={handleDuplicateCube}
        onColorChange={handleContextColorChange}
        onDelete={(item) => void handleDeleteCube(item)}
      />
    </div>
  );
}

interface EmptyStateProps {
  onCreate: () => void;
  onImport: () => void;
  onOpenLibrary?: () => void;
}

function EmptyState({ onCreate, onImport, onOpenLibrary }: EmptyStateProps) {
  const { locale } = useTranslation();
  const heading =
    locale === 'en'
      ? 'Start your first cube list'
      : locale === 'ja'
        ? '最初のキューブ リストを始めましょう'
        : '첫 큐브 리스트를 시작해보세요';
  const body =
    locale === 'en'
      ? 'Three ways to begin: pick from 1,431 ready-made cubes (recommended), create an empty list, or import a file.'
      : locale === 'ja'
        ? '3 つの始め方: 用意された 1,431 個のキューブから選ぶ (推奨)、空リスト作成、ファイル取り込み。'
        : '시작 방법 3가지: 준비된 1,431개 큐브에서 고르기 (권장) · 빈 리스트 만들기 · 파일 가져오기.';
  const browseLibrary =
    locale === 'en'
      ? '🗂 Browse 1,431 cubes (Library)'
      : locale === 'ja'
        ? '🗂 1,431 個のキューブを見る (ライブラリ)'
        : '🗂 1,431개 큐브 둘러보기 (라이브러리)';
  const browseHint =
    locale === 'en'
      ? 'Open the table view → pick a category (food, ai, shopping…) → add to your board.'
      : locale === 'ja'
        ? '表ビュー → カテゴリ選択 (food, ai, shopping…) → ボードに追加。'
        : '표 보기 → 카테고리 선택 (food, ai, shopping…) → 보드에 추가.';
  const create =
    locale === 'en' ? 'Create empty list' : locale === 'ja' ? '空リストを作成' : '빈 리스트 만들기';
  const importLabel =
    locale === 'en' ? 'Import file' : locale === 'ja' ? 'ファイル取り込み' : '파일 가져오기';
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-24 h-24 mb-4 rounded-3xl bg-rbs-accent-soft" aria-hidden />
      <h2 className="text-lg font-semibold mb-2">{heading}</h2>
      <p className="text-sm text-ink-muted mb-6 max-w-md">{body}</p>
      <div className="flex flex-col gap-3 items-stretch w-full max-w-md">
        {onOpenLibrary && (
          <div className="rounded-xl border-2 border-rbs-accent bg-rbs-accent-soft/30 dark:bg-rbs-accent/10 p-4 text-left">
            <button
              type="button"
              onClick={onOpenLibrary}
              className="w-full bg-rbs-accent text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rbs-accent/90"
            >
              {browseLibrary}
            </button>
            <p className="text-xs text-ink-muted mt-2">{browseHint}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={onCreate}
            className="bg-surface text-ink border border-border px-5 py-2 rounded-xl font-medium hover:border-rbs-accent hover:text-rbs-accent"
          >
            {create}
          </button>
          <button
            type="button"
            onClick={onImport}
            className="bg-surface text-ink border border-border px-5 py-2 rounded-xl font-medium hover:border-rbs-accent hover:text-rbs-accent"
          >
            {importLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
