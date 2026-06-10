'use client';

import { useMemo, useState, useEffect, type DragEvent } from 'react';
import type { CubeItem } from '@/lib/types/cube';
import {
  parseActionPayload,
  CUBE_BG_PRESETS,
  getCubeActionUuid,
  getCubeStates,
  getCubeActiveState,
  type CubeBgPreset,
} from '@/lib/types/cube';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { useToast } from '@/lib/toast/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';

// 인스펙터 UI 다국어 (TUD 2026-05-23, TUE 2026-05-23 확장).
// TUD = 헤더 + 핵심 버튼 (6키). TUE = placeholder + 빈 상태 + toast + actionDetail (확장 12키).
//
// TUM (2026-05-23 영구 결정): INSPECTOR_COPY와 ACTION_PREVIEW_COPY 두 카탈로그 분리 사유.
//   - INSPECTOR_COPY = 인스펙터 UI 도메인 (헤더/버튼/placeholder/toast)
//   - ACTION_PREVIEW_COPY = 액션 미리보기 도메인 (nonLinkActionPreview 헬퍼 전용, 큐브 액션 표기)
//   분리 이유: 도메인 책임 분리 + 후자는 Cube.tsx의 summarizeAction과 페어링되어 외부 호출도 가능.
//   변경 시 한 카탈로그만 영향 — 결합도 ↓.
const INSPECTOR_COPY = {
  ko: {
    cubeInfo: '큐브 정보',
    library: '라이브러리',
    name: '이름',
    save: '저장',
    fullEdit: '전체 편집 (단축키·매크로·폴더…)',
    deselect: '선택 해제',
    libraryHint: '드래그 또는 클릭으로 보드에 추가',
    searchPlaceholder: '검색...',
    nameMissing: '이름을 입력해주세요',
    saved: '저장됨',
    selectListFirst: '먼저 리스트를 선택하세요',
    localModeOnly: 'LOCAL_MODE에서만 동작',
    added: (label: string) => `"${label}" 추가됨`,
    cubeNamePlaceholder: '큐브 이름',
    loadingLibrary: '라이브러리를 불러오는 중...',
    loading: '로딩...',
    noResults: '검색 결과 없음',
    empty: '비어 있음',
    moreItems: (n: number) => `...외 ${n}개 (검색으로 좁히세요)`,
    actionDetail: '액션 상세',
    editViaFullEdit: '편집 = ‟전체 편집” 진입',
    color: '색상',
    colorChanged: '색상 변경됨',
    icon: '아이콘 URL',
    iconHint: '아이콘 이미지 URL (PNG/WebP/JPG/SVG) — 비우면 기본 색 블록',
    iconUnsafe: '아이콘 URL은 http(s) 프로토콜 + 이미지 확장자만 허용됩니다',
    hotkey: '단축키',
    hotkeyHint: '1~9 또는 단일 키 (예: F1). 비우면 단축키 없음',
    hotkeyInvalid: '단축키는 단일 영숫자 또는 F1~F12만 허용됩니다',
    hotkeyConflict: '같은 보드에 동일 단축키 큐브가 이미 있습니다',
    hotkeyCapturing: '키를 누르세요...',
    states: '상태 (토글)',
    statesHint: '여러 상태로 토글되는 큐브 — 탭마다 다음 상태로 순환',
    addState: '+ 상태 추가',
    statesNone: '단일 상태',
  },
  en: {
    cubeInfo: 'Cube info',
    library: 'Library',
    name: 'Name',
    save: 'Save',
    fullEdit: 'Edit all (shortcut · macro · folder…)',
    deselect: 'Deselect',
    libraryHint: 'Drag or click to add',
    searchPlaceholder: 'Search...',
    nameMissing: 'Please enter a name',
    saved: 'Saved',
    selectListFirst: 'Select a list first',
    localModeOnly: 'LOCAL_MODE only',
    added: (label: string) => `Added "${label}"`,
    cubeNamePlaceholder: 'Cube name',
    loadingLibrary: 'Loading library...',
    loading: 'Loading...',
    noResults: 'No results',
    empty: 'Empty',
    moreItems: (n: number) => `...+${n} more (refine search)`,
    actionDetail: 'Action detail',
    editViaFullEdit: 'Edit via "Edit all"',
    color: 'Color',
    colorChanged: 'Color changed',
    icon: 'Icon URL',
    iconHint: 'Image URL (PNG/WebP/JPG/SVG) — empty for default color block',
    iconUnsafe: 'Icon URL must use http(s) and an image extension',
    hotkey: 'Hotkey',
    hotkeyHint: '1~9 or single key (e.g. F1). Empty for none',
    hotkeyInvalid: 'Hotkey must be a single alphanumeric or F1~F12',
    hotkeyConflict: 'Another cube on this board already uses this hotkey',
    hotkeyCapturing: 'Press a key...',
    states: 'States (toggle)',
    statesHint: 'Cube toggles between states — each tap cycles to the next',
    addState: '+ Add state',
    statesNone: 'Single state',
  },
  ja: {
    cubeInfo: 'キューブ情報',
    library: 'ライブラリ',
    name: '名前',
    save: '保存',
    fullEdit: '全体編集 (ショートカット・マクロ・フォルダ…)',
    deselect: '選択解除',
    libraryHint: 'ドラッグまたはクリックで追加',
    searchPlaceholder: '検索...',
    nameMissing: '名前を入力してください',
    saved: '保存しました',
    selectListFirst: 'リストを先に選択してください',
    localModeOnly: 'LOCAL_MODE のみ動作',
    added: (label: string) => `"${label}" を追加しました`,
    cubeNamePlaceholder: 'キューブ名',
    loadingLibrary: 'ライブラリを読み込み中...',
    loading: '読み込み中...',
    noResults: '結果なし',
    empty: '空',
    moreItems: (n: number) => `...他 ${n} 個 (検索で絞り込み)`,
    actionDetail: 'アクション詳細',
    editViaFullEdit: '編集 = ‟全体編集” で',
    color: '色',
    colorChanged: '色を変更しました',
    icon: 'アイコン URL',
    iconHint: '画像 URL (PNG/WebP/JPG/SVG) — 空欄なら既定の色ブロック',
    iconUnsafe: 'アイコン URL は http(s) と画像拡張子のみ',
    hotkey: 'ホットキー',
    hotkeyHint: '1~9 または単一キー (例: F1)。空欄でホットキーなし',
    hotkeyInvalid: 'ホットキーは単一の英数字または F1~F12 のみ',
    hotkeyConflict: '同じボードに同じホットキーのキューブが既にあります',
    hotkeyCapturing: 'キーを押してください...',
    states: 'ステート (トグル)',
    statesHint: '複数のステートを切り替えるキューブ — タップごとに次のステートへ循環',
    addState: '+ ステート追加',
    statesNone: 'シングルステート',
  },
} as const;

/**
 * 우측 인스펙터 패널 — Stream Deck 우측 패널 대응.
 *
 * sm 이상에서만 표시 (모바일은 BottomSheet 진입 유지).
 *
 * 모드:
 * - 선택된 큐브 없음: 빠른 라이브러리 (jusomoa 카테고리 트리)
 * - 선택된 큐브 있음: 라벨/아이콘/액션 빠른 편집 + "전체 편집" 진입
 *
 * 정착본 v3 (2026-05-23 Stream Deck UI 반영, S3+S4):
 * - 우측 280px 고정 패널
 * - 편집 모드에서만 노출
 * - 라이브러리 카테고리 칩 트리
 * - 빠른 편집 (label, url) 즉시 저장
 *
 * **lg 미만 미노출 영구 결정** (TST-V, 2026-05-23):
 * - sm/md 화면(<1024px)에서는 인스펙터를 렌더 X (`hidden lg:flex`).
 *   이유: 좌측 BoardSidebar(220px) + 그리드 + 우측 인스펙터(280px) 동시 표시 시 그리드 폭이
 *   모바일 권장값(320px 이상) 미달. 가독성 우선.
 * - 모바일 fallback: 기존 BottomSheet(CubeEditSheet)가 long-press → 큐브 편집 진입을 처리.
 *   라이브러리 진입은 표 모드(`CubeTableView`)가 sm 이하에서 단일 칼럼으로 동작.
 * - 변경 시: docs/desktop-app-setup.md "lg 미만 fallback" 섹션 + 본 주석 동시 갱신 필수.
 */

interface CubeInspectorProps {
  /** 현재 선택된 큐브 (선택 X 시 null) */
  selectedCube: CubeItem | null;
  /** 활성 보드 ID (라이브러리에서 큐브 추가 시 사용) */
  activeBoardId: string | null;
  /** 활성 보드 이름 + 큐브 수 (TUW, 2026-05-23) — "선택 없음" 헤더에 표시 */
  activeBoardName?: string | null;
  activeBoardItemCount?: number;
  /** 활성 보드의 큐브 목록 (TVL, 2026-05-23) — 단축키 충돌 감지용 */
  activeBoardItems?: CubeItem[];
  /** 큐브 갱신 시 부모에 알림 (useCubeBoards.loadBoards 호출) */
  onChange?: () => void;
  /** "전체 편집" 클릭 시 호출 — BottomSheet 진입 */
  onOpenFullEdit?: (item: CubeItem) => void;
  /** 인스펙터 닫기 (큐브 선택 해제) */
  onDeselect?: () => void;
}

interface ManifestCategory {
  slug: string;
  name: string;
  count: number;
}

interface ManifestItem {
  slug: string;
  label: string;
  icon_src: string | null;
  url: string;
}

const STATIC_MANIFEST_BASE = '/cubeone/jusomoa';

export function CubeInspector({
  selectedCube,
  activeBoardId,
  activeBoardName,
  activeBoardItemCount,
  activeBoardItems,
  onChange,
  onOpenFullEdit,
  onDeselect,
}: CubeInspectorProps) {
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const t = INSPECTOR_COPY[locale] ?? INSPECTOR_COPY.ko;
  const [categories, setCategories] = useState<ManifestCategory[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  // SD-AC2 (2026-05-23): Plugin 카탈로그 액션 목록 inline 표시
  const [pluginActions, setPluginActions] = useState<
    Array<{ uuid: string; name: string; icon: string; action_type: string; default_payload: Record<string, unknown> }>
  >([]);
  // SD-DC (2026-05-23): 펼침 상태 localStorage 영속
  const [pluginExpanded, setPluginExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('cubelist:inspector:pluginExpanded') === '1';
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('cubelist:inspector:pluginExpanded', pluginExpanded ? '1' : '0');
  }, [pluginExpanded]);
  // SD-CO (2026-05-23): fetch 실패 추적 — Tauri build 등 plugin 경로 손실 케이스 안내
  const [pluginLoadFailed, setPluginLoadFailed] = useState(false);
  const [categoryItems, setCategoryItems] = useState<ManifestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);

  // 인스펙터용 로컬 편집 state (빠른 편집)
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editHotkey, setEditHotkey] = useState('');
  const [hotkeyCapturing, setHotkeyCapturing] = useState(false);
  // SD-AZ (2026-05-23): 6 신규 enum 빠른 편집 state
  const [editText, setEditText] = useState(''); // text_insert/clipboard_copy
  const [editPath, setEditPath] = useState(''); // app_launch
  const [editPattern, setEditPattern] = useState(''); // focus_window
  const [editMouseX, setEditMouseX] = useState(0); // mouse_click
  const [editMouseY, setEditMouseY] = useState(0);
  // SD-CE (2026-05-23): button/relative 빠른 편집
  const [editMouseButton, setEditMouseButton] = useState<'left' | 'right' | 'middle'>('left');
  const [editMouseRelative, setEditMouseRelative] = useState(false);

  /**
   * 큐브 변경 시 빠른 편집 state 동기화 (TUC, 2026-05-23 영구 주석).
   *
   * deps=[selectedCube]: 사용자가 인스펙터에서 텍스트 편집 중에 그리드의 다른 큐브를
   * 클릭하면 selectedCube 참조가 바뀌면서 editLabel/editUrl이 새 큐브로 덮어쓰임.
   * 이는 **의도된 동작** — 인스펙터는 "현재 선택 큐브 = 진실원"으로 동작하며,
   * 편집은 명시적 "저장" 클릭으로만 커밋.
   *
   * 미저장 변경사항은 큐브 전환 시 손실되지만 (Stream Deck도 동일 모델),
   * 향후 사용자 보고 시 dirty 마커 + 확인 prompt 도입 가능 (Stage 2 후보).
   */
  useEffect(() => {
    if (selectedCube) {
      setEditLabel(selectedCube.label);
      const payload = parseActionPayload(selectedCube);
      setEditUrl(payload.action_type === 'link' ? payload.url : '');
      setEditIcon(selectedCube.icon_url ?? '');
      setEditHotkey((selectedCube.metadata?.hotkey as string | undefined) ?? '');
      // SD-AZ (2026-05-23): 6 신규 enum payload 동기화
      setEditText(
        payload.action_type === 'text_insert' || payload.action_type === 'clipboard_copy'
          ? payload.text
          : '',
      );
      setEditPath(payload.action_type === 'app_launch' ? payload.path : '');
      setEditPattern(payload.action_type === 'focus_window' ? payload.title_pattern : '');
      setEditMouseX(payload.action_type === 'mouse_click' ? payload.x : 0);
      setEditMouseY(payload.action_type === 'mouse_click' ? payload.y : 0);
      // SD-CE (2026-05-23): button/relative 동기화
      setEditMouseButton(payload.action_type === 'mouse_click' ? payload.button : 'left');
      setEditMouseRelative(payload.action_type === 'mouse_click' ? Boolean(payload.relative) : false);
    } else {
      setEditLabel('');
      setEditUrl('');
      setEditIcon('');
      setEditHotkey('');
      setEditText('');
      setEditPath('');
      setEditPattern('');
      setEditMouseX(0);
      setEditMouseY(0);
      setEditMouseButton('left');
      setEditMouseRelative(false);
    }
  }, [selectedCube]);

  // 카테고리 목록 로드 (선택 큐브 없을 때만)
  useEffect(() => {
    if (selectedCube !== null) return;
    let cancelled = false;
    fetch(`${STATIC_MANIFEST_BASE}/categories.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ManifestCategory[] | null) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setCategories(data);
          setActiveCategorySlug((prev) => prev ?? data[0].slug);
        }
      })
      .catch(() => {
        /* 정적 manifest 없으면 무시 */
      });

    // SD-AC2: Plugin 카탈로그 fetch — public/plugins/index.json (mirror) 또는 data/plugins
    // SD-CO (2026-05-23): 실패 추적 — Tauri build 또는 mirror 미실행 케이스 안내
    (async () => {
      try {
        const indexResp = await fetch('/plugins/index.json');
        if (!indexResp.ok) {
          if (!cancelled) setPluginLoadFailed(true);
          return;
        }
        const indexData = (await indexResp.json()) as { entries?: Array<{ file: string }> };
        if (!indexData.entries) {
          if (!cancelled) setPluginLoadFailed(true);
          return;
        }
        const allActions: typeof pluginActions = [];
        for (const ent of indexData.entries) {
          const fileResp = await fetch(`/plugins/${ent.file}`);
          if (!fileResp.ok) continue;
          const file = await fileResp.json();
          if (Array.isArray(file.actions)) {
            for (const a of file.actions) {
              allActions.push({
                uuid: a.uuid,
                name: a.name,
                icon: a.icon ?? '●',
                action_type: a.action_type,
                default_payload: a.default_payload ?? {},
              });
            }
          }
        }
        if (!cancelled) {
          setPluginActions(allActions);
          setPluginLoadFailed(allActions.length === 0);
        }
      } catch {
        if (!cancelled) setPluginLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCube]);

  // 활성 카테고리 아이템 로드
  useEffect(() => {
    if (!activeCategorySlug || selectedCube !== null) return;
    let cancelled = false;
    setLoadingItems(true);
    fetch(`${STATIC_MANIFEST_BASE}/${activeCategorySlug}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ManifestItem[] | null) => {
        if (cancelled) return;
        setCategoryItems(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCategoryItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategorySlug, selectedCube]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return categoryItems;
    const q = searchQuery.toLowerCase();
    return categoryItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [categoryItems, searchQuery]);

  // SD-AO (2026-05-23): plugin 액션 검색 필터 — 검색 시 자동 plugin 섹션 펼침
  const filteredPluginActions = useMemo(() => {
    if (!searchQuery.trim()) return pluginActions;
    const q = searchQuery.toLowerCase();
    return pluginActions.filter(
      (a) => a.name.toLowerCase().includes(q) || a.uuid.toLowerCase().includes(q),
    );
  }, [pluginActions, searchQuery]);

  // 검색어 있을 때 plugin 섹션 자동 펼침
  useEffect(() => {
    if (searchQuery.trim().length > 0 && filteredPluginActions.length > 0) {
      setPluginExpanded(true);
    }
  }, [searchQuery, filteredPluginActions.length]);

  /**
   * 빠른 저장 (TST-S 2026-05-23 신규, TUG 2026-05-23 영구 주석).
   *
   * 가드 정책:
   * - label 빈값 = 차단 (nameMissing toast) — 큐브 라벨 0자는 인스펙터/그리드 모두 표시 불가
   * - URL 빈값 = 허용 — 사용자가 의도적으로 placeholder 큐브 생성 가능 (예: 추후 채울 슬롯).
   *   빈 URL 큐브를 누르면 helper.sendPressItem이 no-op으로 호출되어 부작용 없음.
   *
   * 변경 시: 큐 항목 TUG 인용 + 본 주석 갱신 필수.
   */
  function handleQuickSave(): void {
    if (!selectedCube || !isLocalMode()) return;
    const newLabel = editLabel.trim();
    if (!newLabel) {
      showToast({ level: 'warning', message: t.nameMissing });
      return;
    }
    const newPayload = { ...(selectedCube.action_payload as Record<string, unknown>) };
    if (selectedCube.action_type === 'link') {
      newPayload.url = editUrl.trim();
    }
    // SD-AZ (2026-05-23): 6 신규 enum payload 빠른 편집
    if (selectedCube.action_type === 'text_insert' || selectedCube.action_type === 'clipboard_copy') {
      newPayload.text = editText;
    } else if (selectedCube.action_type === 'app_launch') {
      newPayload.path = editPath.trim();
    } else if (selectedCube.action_type === 'focus_window') {
      newPayload.title_pattern = editPattern.trim();
    } else if (selectedCube.action_type === 'mouse_click') {
      newPayload.x = editMouseX;
      newPayload.y = editMouseY;
      // SD-CE (2026-05-23): button/relative 저장
      newPayload.button = editMouseButton;
      newPayload.relative = editMouseRelative;
    }
    const newIcon = editIcon.trim();
    // TVZ (2026-05-23): 아이콘 URL 검증 — http(s) 또는 data:image, 빈값 OK
    if (!isValidIconUrl(newIcon)) {
      showToast({ level: 'warning', message: t.iconUnsafe });
      return;
    }
    // TVH (2026-05-23 신규) / TVM (정규화) / TVL (충돌 감지)
    const newHotkey = editHotkey.trim().slice(0, 4);
    if (!isValidHotkey(newHotkey)) {
      showToast({ level: 'warning', message: t.hotkeyInvalid });
      return;
    }
    if (newHotkey && activeBoardItems) {
      const conflict = activeBoardItems.find(
        (it) =>
          it.id !== selectedCube.id &&
          typeof it.metadata?.hotkey === 'string' &&
          (it.metadata.hotkey as string).toLowerCase() === newHotkey.toLowerCase(),
      );
      if (conflict) {
        showToast({ level: 'warning', message: t.hotkeyConflict });
        return;
      }
    }
    const newMeta = { ...((selectedCube.metadata ?? {}) as Record<string, unknown>) };
    if (newHotkey) {
      newMeta.hotkey = newHotkey;
    } else {
      delete newMeta.hotkey;
    }
    // SD-E (2026-05-23): 사용자가 라벨을 수동으로 변경했으면 linked_title 자동 해제
    // (Stream Deck LinkedTitle 대응 — 라이브러리 자동 라벨 → 사용자 명시 라벨로 전환)
    if (newLabel !== selectedCube.label) {
      newMeta.linked_title = false;
    }
    localStore.updateItem(selectedCube.id, {
      label: newLabel,
      icon_url: newIcon || null,
      action_payload: newPayload,
      metadata: newMeta,
    });
    onChange?.();
    showToast({ level: 'success', message: t.saved, duration: 1_500 });
  }

  /**
   * 큐브 색상 즉시 변경 (TUQ, 2026-05-23).
   * 5색 preset 칩 클릭 시 metadata.bg_color 갱신 + 즉시 저장 (별도 저장 버튼 불필요).
   */
  function handleColorChange(preset: CubeBgPreset): void {
    if (!selectedCube || !isLocalMode()) return;
    const newMeta = { ...((selectedCube.metadata ?? {}) as Record<string, unknown>) };
    newMeta.bg_color = preset;
    localStore.updateItem(selectedCube.id, { metadata: newMeta });
    onChange?.();
    showToast({ level: 'success', message: t.colorChanged, duration: 1_200 });
  }

  /**
   * Multi-state 추가/삭제 (SD-AB, 2026-05-23).
   * 추가: 현재 큐브의 label/icon을 복사한 새 state 추가
   * 삭제: 해당 인덱스 제거 + reindex + 활성 state 클램프
   */
  function handleAddState(): void {
    if (!selectedCube || !isLocalMode()) return;
    const newMeta = { ...((selectedCube.metadata ?? {}) as Record<string, unknown>) };
    const cur = Array.isArray(newMeta.states) ? [...(newMeta.states as Record<string, unknown>[])] : [];
    cur.push({
      index: cur.length,
      label: `${selectedCube.label} ${cur.length + 1}`,
      icon_url: selectedCube.icon_url,
    });
    newMeta.states = cur;
    localStore.updateItem(selectedCube.id, { metadata: newMeta });
    onChange?.();
  }

  /** SD-AG2 (2026-05-23): state label 인라인 편집 */
  function handleStateLabelChange(idx: number, newLabel: string): void {
    if (!selectedCube || !isLocalMode()) return;
    const newMeta = { ...((selectedCube.metadata ?? {}) as Record<string, unknown>) };
    const cur = Array.isArray(newMeta.states) ? [...(newMeta.states as Record<string, unknown>[])] : [];
    if (idx < 0 || idx >= cur.length) return;
    cur[idx] = { ...cur[idx], label: newLabel.slice(0, 32) };
    newMeta.states = cur;
    localStore.updateItem(selectedCube.id, { metadata: newMeta });
    onChange?.();
  }

  /** SD-AG2 (2026-05-23): state 활성화 (메뉴 클릭) — 토글 인터랙션 외 직접 선택 */
  function handleStateActivate(idx: number): void {
    if (!selectedCube || !isLocalMode()) return;
    const newMeta = { ...((selectedCube.metadata ?? {}) as Record<string, unknown>) };
    newMeta.state = idx;
    localStore.updateItem(selectedCube.id, { metadata: newMeta });
    onChange?.();
  }

  function handleRemoveState(idx: number): void {
    if (!selectedCube || !isLocalMode()) return;
    const newMeta = { ...((selectedCube.metadata ?? {}) as Record<string, unknown>) };
    const cur = Array.isArray(newMeta.states) ? (newMeta.states as Record<string, unknown>[]) : [];
    const next = cur.filter((_, i) => i !== idx).map((s, i) => ({ ...s, index: i }));
    if (next.length === 0) {
      delete newMeta.states;
      delete newMeta.state;
    } else {
      newMeta.states = next;
      // 활성 state 클램프
      const curActive = typeof newMeta.state === 'number' ? newMeta.state : 0;
      if (curActive >= next.length) newMeta.state = next.length - 1;
    }
    localStore.updateItem(selectedCube.id, { metadata: newMeta });
    onChange?.();
  }

  /**
   * SD-AC2 (2026-05-23): Plugin 액션을 활성 보드에 큐브로 추가.
   * action_type에 따라 default_payload + UUID metadata 설정.
   */
  function handleAddPluginAction(action: {
    uuid: string;
    name: string;
    icon: string;
    action_type: string;
    default_payload: Record<string, unknown>;
  }): void {
    if (!activeBoardId) {
      showToast({ level: 'warning', message: t.selectListFirst });
      return;
    }
    if (!isLocalMode()) {
      showToast({ level: 'warning', message: t.localModeOnly });
      return;
    }
    const at = ['link', 'shortcut', 'macro', 'folder'].includes(action.action_type)
      ? (action.action_type as 'link' | 'shortcut' | 'macro' | 'folder')
      : 'link';
    localStore.addItem(activeBoardId, {
      label: action.name,
      icon_url: null,
      action_type: at,
      action_payload: action.default_payload,
      metadata: { source: 'streamdeck', action_uuid: action.uuid, linked_title: true },
    });
    onChange?.();
    showToast({ level: 'success', message: t.added(action.name), duration: 1_500 });
  }

  function handleAddFromLibrary(item: ManifestItem): void {
    if (!activeBoardId) {
      showToast({ level: 'warning', message: t.selectListFirst });
      return;
    }
    if (!isLocalMode()) {
      showToast({ level: 'warning', message: t.localModeOnly });
      return;
    }
    localStore.addItem(activeBoardId, {
      label: item.label,
      icon_url: item.icon_src,
      action_type: 'link',
      action_payload: { url: item.url },
      // SD-E (2026-05-23): 라이브러리 자동 라벨 → linked_title=true (사용자 수정 시 자동 해제)
      metadata: { source: 'jusomoa', via: 'inspector', linked_title: true },
    });
    onChange?.();
    showToast({ level: 'success', message: t.added(item.label), duration: 1_500 });
  }

  function handleDragStart(e: DragEvent<HTMLButtonElement>, item: ManifestItem): void {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'cubelist/cube',
        label: item.label,
        icon_src: item.icon_src,
        action_type: 'link',
        url: item.url,
      }),
    );
  }

  return (
    <aside
      className="cubelist-inspector hidden lg:flex flex-col w-[280px] flex-shrink-0 border-l border-border"
      aria-label="큐브 인스펙터"
    >
      {selectedCube ? (
        <>
          <header className="px-3 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-ink truncate">{t.cubeInfo}</span>
            {onDeselect && (
              <button
                type="button"
                onClick={onDeselect}
                className="text-[10px] text-ink-muted hover:text-rbs-accent px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                title={`${t.deselect} (Esc)`}
                aria-keyshortcuts="Escape"
                aria-label={t.deselect}
              >
                <kbd className="text-[9px] font-mono opacity-70">Esc</kbd>
                <span aria-hidden>✕</span>
              </button>
            )}
          </header>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* 미리보기 — 정적 표시 카드. TUI (2026-05-23): cubelist-key-elevated hover lift 미적용 영구 결정 (클릭 가능 오해 방지) */}
            {/* TVF (2026-05-23): editIcon/editLabel을 우선 사용해 입력 즉시 미리보기 (저장 전 시각 검증) */}
            {/* TVG (2026-05-23): 라이브러리 큐브 드래그 → 아이콘만 받기 (전체 큐브 X) */}
            <div
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes('application/json')) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const raw = e.dataTransfer.getData('application/json');
                if (!raw) return;
                try {
                  const data = JSON.parse(raw) as { type?: string; icon_src?: string | null };
                  if (data.type !== 'cubelist/cube' || !data.icon_src) return;
                  setEditIcon(data.icon_src);
                } catch {
                  // 무시
                }
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-rbs-accent/40 transition relative"
              title="라이브러리 큐브를 끌어와 아이콘만 가져오기"
            >
              {/* SD-L (2026-05-23): linked_title 시각 마커 — 우상단 🔗 dot */}
              {selectedCube.metadata?.linked_title === true && editLabel === selectedCube.label && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rbs-accent"
                  title="라이브러리 자동 라벨 — 수정하면 자동 해제"
                  aria-label="linked title"
                />
              )}
              {editIcon.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editIcon.trim()}
                  alt=""
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    // 로드 실패 시 placeholder
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-rbs-accent-soft" aria-hidden />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{editLabel || selectedCube.label}</p>
                <p className="text-[10px] text-ink-muted uppercase">
                  {actionTypeLabel(selectedCube.action_type)}
                </p>
              </div>
            </div>

            {/* 빠른 편집: 라벨 */}
            <label className="block">
              <span className="text-[10px] text-ink-muted font-medium">{t.name}</span>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20"
                placeholder={t.cubeNamePlaceholder}
              />
            </label>

            {/* 빠른 편집: URL (link 타입만) */}
            {selectedCube.action_type === 'link' && (
              <label className="block">
                <span className="text-[10px] text-ink-muted font-medium">URL</span>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                  placeholder="https://"
                />
              </label>
            )}

            {/* SD-AZ (2026-05-23): 6 신규 enum 빠른 편집 — 핵심 필드 1~2개. SD-BW: maxLength 1024 + 카운터 */}
            {(selectedCube.action_type === 'text_insert' || selectedCube.action_type === 'clipboard_copy') && (
              <label className="block">
                <span className="text-[10px] text-ink-muted font-medium">
                  {selectedCube.action_type === 'text_insert' ? 'Text' : 'Clipboard'}
                </span>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  maxLength={1024}
                  className={`mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border bg-surface focus:outline-none focus:ring-2 font-mono resize-y ${
                    editText.length > 900
                      ? 'border-yellow-500 focus:ring-yellow-300'
                      : 'border-border focus:border-rbs-accent focus:ring-rbs-accent/20'
                  }`}
                  placeholder={selectedCube.action_type === 'text_insert' ? '입력할 텍스트' : '복사할 텍스트'}
                />
                <span className="text-[9px] text-ink-muted text-right font-mono block">
                  {editText.length} / 1024
                </span>
              </label>
            )}
            {selectedCube.action_type === 'app_launch' && (
              <label className="block">
                <span className="text-[10px] text-ink-muted font-medium">App path</span>
                <input
                  type="text"
                  value={editPath}
                  onChange={(e) => setEditPath(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                  placeholder="C:\\Program Files\\..."
                />
              </label>
            )}
            {selectedCube.action_type === 'focus_window' && (
              <label className="block">
                <span className="text-[10px] text-ink-muted font-medium">Window title pattern</span>
                <input
                  type="text"
                  value={editPattern}
                  onChange={(e) => setEditPattern(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                  placeholder="*.txt - Notepad"
                />
              </label>
            )}
            {selectedCube.action_type === 'mouse_click' && (
              <div className="block space-y-2">
                <span className="text-[10px] text-ink-muted font-medium">Mouse position (x, y)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editMouseX}
                    onChange={(e) => setEditMouseX(Number(e.target.value) || 0)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                    placeholder="x"
                  />
                  <input
                    type="number"
                    value={editMouseY}
                    onChange={(e) => setEditMouseY(Number(e.target.value) || 0)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                    placeholder="y"
                  />
                </div>
                {/* SD-CE (2026-05-23): button 3-toggle + relative checkbox */}
                <div className="flex gap-1">
                  {(['left', 'right', 'middle'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setEditMouseButton(b)}
                      className={`flex-1 px-2 py-1 rounded text-[10px] border ${
                        editMouseButton === b
                          ? 'bg-rbs-accent text-white border-rbs-accent'
                          : 'bg-surface text-ink border-border'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                  <input
                    type="checkbox"
                    checked={editMouseRelative}
                    onChange={(e) => setEditMouseRelative(e.target.checked)}
                    className="accent-rbs-accent"
                  />
                  상대 좌표
                </label>
              </div>
            )}

            {/* 빠른 편집: 아이콘 URL (TUU, 2026-05-23) */}
            <label className="block">
              <span className="text-[10px] text-ink-muted font-medium">{t.icon}</span>
              <input
                type="text"
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                placeholder="https://...icon.png"
              />
              <span className="text-[9px] text-ink-muted/80 mt-0.5 block">{t.iconHint}</span>
            </label>

            {/* 빠른 편집: 단축키 (TVH 신규 / TVM 정규화 / TVQ 키 캡처 / TVU 캡처 시각) */}
            <label className="block">
              <span className="text-[10px] text-ink-muted font-medium flex items-center gap-1.5">
                {t.hotkey}
                {hotkeyCapturing && (
                  <span className="text-[9px] text-rbs-accent font-medium animate-pulse">
                    ● {t.hotkeyCapturing}
                  </span>
                )}
              </span>
              <input
                type="text"
                value={editHotkey}
                onChange={(e) => setEditHotkey(e.target.value)}
                onFocus={() => setHotkeyCapturing(true)}
                onBlur={() => setHotkeyCapturing(false)}
                onKeyDown={(e) => {
                  // TVQ (2026-05-23): focus 상태에서 키 누르면 자동 입력 (a-z/0-9/F1-F12)
                  // 다중 키 조합·Esc·Tab 등은 브라우저 기본 동작 유지
                  if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
                  if (e.key === 'Backspace') {
                    e.preventDefault();
                    setEditHotkey('');
                    return;
                  }
                  if (/^[a-zA-Z0-9]$/.test(e.key)) {
                    e.preventDefault();
                    setEditHotkey(e.key);
                  } else if (/^F([1-9]|1[0-2])$/.test(e.key)) {
                    e.preventDefault();
                    setEditHotkey(e.key);
                  }
                }}
                maxLength={4}
                aria-invalid={editHotkey.trim().length > 0 && !isValidHotkey(editHotkey.trim())}
                className={
                  editHotkey.trim().length > 0 && !isValidHotkey(editHotkey.trim())
                    ? 'mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border-2 border-red-500 bg-surface focus:outline-none focus:ring-2 focus:ring-red-300 font-mono'
                    : 'mt-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono'
                }
                placeholder="1, 2, F1..."
              />
              <span className="text-[9px] text-ink-muted/80 mt-0.5 block">{t.hotkeyHint}</span>
            </label>

            {/* 비-link 액션 읽기 전용 미리보기 (TST-S, 2026-05-23) — 편집은 "전체 편집"에서 */}
            {selectedCube.action_type !== 'link' && (
              <div className="block">
                <span className="text-[10px] text-ink-muted font-medium">{t.actionDetail}</span>
                <div className="mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface-2 font-mono text-ink-muted break-all">
                  {nonLinkActionPreview(selectedCube, locale)}
                </div>
                <p className="text-[10px] text-ink-muted/80 mt-1">
                  {t.editViaFullEdit}
                </p>
              </div>
            )}

            {/* 큐브 색상 변경 (TUQ, 2026-05-23) — 5색 preset 칩 즉시 저장 */}
            <div className="block">
              <span className="text-[10px] text-ink-muted font-medium">{t.color}</span>
              <div className="mt-1 grid grid-cols-5 gap-1.5">
                {CUBE_BG_PRESETS.map((preset) => {
                  const currentBg = (selectedCube.metadata?.bg_color as string | undefined) ?? 'default';
                  const isActive = currentBg === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleColorChange(preset.value)}
                      title={preset.label}
                      aria-label={`${t.color}: ${preset.label}`}
                      aria-pressed={isActive}
                      className={`aspect-square rounded-lg border-2 ${preset.className} ${
                        isActive
                          ? 'ring-2 ring-rbs-accent ring-offset-2 ring-offset-surface'
                          : 'opacity-80 hover:opacity-100'
                      } transition`}
                    />
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickSave}
              className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-rbs-accent text-white hover:bg-rbs-accent/90"
            >
              {t.save}
            </button>

            {onOpenFullEdit && (
              <button
                type="button"
                onClick={() => onOpenFullEdit(selectedCube)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-2"
              >
                {t.fullEdit}
              </button>
            )}

            {/* SD-AB (2026-05-23): Multi-state 편집 UI (간단 — 추가/삭제만, 풀 편집은 후속) */}
            <div className="block pt-2 border-t border-border">
              <span className="text-[10px] text-ink-muted font-medium flex items-center justify-between">
                {t.states}
                <button
                  type="button"
                  onClick={handleAddState}
                  className="text-[9px] text-rbs-accent hover:underline px-1.5 py-0.5 rounded border border-rbs-accent/30"
                >
                  {t.addState}
                </button>
              </span>
              <p className="text-[9px] text-ink-muted/80 mt-0.5">{t.statesHint}</p>
              {getCubeStates(selectedCube).length === 0 ? (
                <p className="text-[10px] text-ink-muted mt-1.5 italic">{t.statesNone}</p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {getCubeStates(selectedCube).map((st, idx) => (
                    <li
                      key={`state-${idx}`}
                      className={`flex items-center justify-between gap-2 px-2 py-1 rounded text-[11px] ${
                        idx === getCubeActiveState(selectedCube)
                          ? 'bg-rbs-accent-soft border border-rbs-accent/30'
                          : 'border border-border'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleStateActivate(idx)}
                        className="font-mono text-[10px] text-ink-muted hover:text-rbs-accent flex-shrink-0"
                        title={`state #${idx} 활성화`}
                        aria-label={`state #${idx} 활성화`}
                      >
                        #{idx}
                      </button>
                      <input
                        type="text"
                        value={st.label ?? ''}
                        onChange={(e) => handleStateLabelChange(idx, e.target.value)}
                        placeholder={selectedCube.label}
                        className="flex-1 min-w-0 bg-transparent text-ink focus:outline-none focus:bg-surface px-1 py-0.5 rounded text-[11px]"
                        aria-label={`state #${idx} 라벨`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveState(idx)}
                        className="text-[10px] text-red-500 hover:text-red-700 flex-shrink-0"
                        aria-label={`state #${idx} 삭제`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 메타데이터 */}
            <div className="pt-2 border-t border-border space-y-1 text-[10px] text-ink-muted">
              <div className="flex justify-between">
                <span>action_type</span>
                <span className="font-mono">{selectedCube.action_type}</span>
              </div>
              <div className="flex justify-between">
                <span>sort_order</span>
                <span className="font-mono">{selectedCube.sort_order}</span>
              </div>
              {/* SD-M (2026-05-23): UUID 역도메인 식별자 — SD 호환 + debug용 */}
              <div className="flex justify-between gap-2">
                <span>uuid</span>
                <span className="font-mono text-[9px] truncate" title={getCubeActionUuid(selectedCube)}>
                  {getCubeActionUuid(selectedCube)}
                </span>
              </div>
              {/* SD-Q (2026-05-23): multi-state 인디케이터 — states 정의된 경우만 */}
              {getCubeStates(selectedCube).length > 0 && (
                <div className="flex justify-between">
                  <span>state</span>
                  <span className="font-mono">
                    {getCubeActiveState(selectedCube)} / {getCubeStates(selectedCube).length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="px-3 py-2.5 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink">{t.library}</span>
              {/* SD-AC 1단계 (2026-05-23): Plugin 카탈로그 진입 링크 */}
              <a
                href="/seeds"
                className="text-[9px] font-mono text-rbs-accent hover:underline px-1.5 py-0.5 rounded border border-rbs-accent/30"
                title="Stream Deck 호환 Plugin 카탈로그 보기"
              >
                + Plugins
              </a>
            </div>
            <p className="text-[10px] text-ink-muted mt-0.5">
              {t.libraryHint}
            </p>
            {activeBoardName && (
              <p className="text-[10px] text-rbs-accent mt-1 flex items-center gap-1">
                <span aria-hidden>▸</span>
                <span className="truncate flex-1">{activeBoardName}</span>
                {typeof activeBoardItemCount === 'number' && (
                  <span className="font-mono opacity-70">({activeBoardItemCount})</span>
                )}
              </p>
            )}
          </header>

          {/* 검색 — SD-DN (2026-05-23): plugin/카테고리 결과 별도 카운트 */}
          <div className="px-3 py-2 border-b border-border">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20"
            />
            {searchQuery.trim().length > 0 && (
              <p className="text-[9px] text-ink-muted mt-1 flex items-center gap-2 font-mono">
                <span>◆ {filteredPluginActions.length}</span>
                <span>·</span>
                <span>▶ {filteredItems.length}</span>
              </p>
            )}
          </div>

          {/* SD-CO (2026-05-23): plugin fetch 실패 안내. SD-CU 다국어 */}
          {pluginLoadFailed && pluginActions.length === 0 && (
            <div className="px-3 py-1.5 border-b border-border bg-yellow-50 dark:bg-yellow-950/20">
              <p className="text-[10px] text-yellow-700 dark:text-yellow-300">
                {locale === 'en'
                  ? '⚠ Plugin catalog could not be loaded (mirror not run or build path lost)'
                  : locale === 'ja'
                    ? '⚠ プラグインカタログを読み込めません (ミラー未実行またはビルドパス紛失)'
                    : '⚠ Plugin 카탈로그를 불러올 수 없습니다 (mirror 미실행 또는 빌드 경로 손실)'}
              </p>
            </div>
          )}

          {/* SD-AC2 (2026-05-23): Plugin 카탈로그 토글 섹션 (jusomoa 카테고리 위) + SD-AO 검색 통합 */}
          {pluginActions.length > 0 && (
            <div className="border-b border-border">
              <button
                type="button"
                onClick={() => setPluginExpanded((v) => !v)}
                className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-ink flex items-center justify-between hover:bg-surface-2"
              >
                <span>
                  ◆ Stream Deck 호환 ({filteredPluginActions.length}
                  {searchQuery.trim() && filteredPluginActions.length !== pluginActions.length
                    ? `/${pluginActions.length}`
                    : ''}
                  )
                </span>
                <span className="text-[9px] text-ink-muted">{pluginExpanded ? '▼' : '▶'}</span>
              </button>
              {pluginExpanded && (
                <ul className="max-h-[160px] overflow-y-auto px-2 pb-1 space-y-0.5">
                  {filteredPluginActions.length === 0 ? (
                    <li className="text-[10px] text-ink-muted text-center py-2">{t.noResults}</li>
                  ) : null}
                  {filteredPluginActions.map((a) => (
                    <li key={a.uuid}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          // SD-AM (2026-05-23): plugin 액션 드래그 — 그리드 EmptySlot 드롭으로 큐브 추가
                          e.dataTransfer.effectAllowed = 'copy';
                          e.dataTransfer.setData(
                            'application/json',
                            JSON.stringify({
                              type: 'cubelist/cube',
                              label: a.name,
                              icon_src: null,
                              action_type: a.action_type,
                              url: (a.default_payload as { url?: string }).url ?? null,
                              action_uuid: a.uuid,
                              action_payload: a.default_payload,
                            }),
                          );
                        }}
                        onClick={() => handleAddPluginAction(a)}
                        className="w-full flex items-center gap-2 px-1.5 py-1 rounded text-[11px] text-ink hover:bg-rbs-accent-soft dark:hover:bg-rbs-accent/15 group cursor-grab active:cursor-grabbing"
                        title={`${a.name} — ${a.uuid} (클릭 또는 드래그)`}
                      >
                        <span aria-hidden className="text-[14px]">
                          {a.icon}
                        </span>
                        <span className="truncate flex-1 text-left">{a.name}</span>
                        <span className="text-[9px] font-mono text-ink-muted">{a.action_type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 카테고리 트리 */}
          {categories.length === 0 ? (
            <div className="p-3 text-[11px] text-ink-muted text-center">
              {t.loadingLibrary}
            </div>
          ) : (
            <>
              <nav
                className="px-2 py-1 border-b border-border max-h-[140px] overflow-y-auto"
                aria-label={t.library}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setActiveCategorySlug(cat.slug)}
                    aria-current={cat.slug === activeCategorySlug}
                    className={
                      cat.slug === activeCategorySlug
                        ? 'w-full text-left px-2 py-1 text-[11px] rounded bg-rbs-accent text-white flex items-center justify-between gap-1'
                        : 'w-full text-left px-2 py-1 text-[11px] rounded text-ink hover:bg-surface-2 flex items-center justify-between gap-1'
                    }
                  >
                    {/* TUN (2026-05-23 영구): ▶ 마커는 정적 텍스트로 reduced-motion 무관, 핑크 위 흰색 ▶ 다크 모드 동일 톤 contrast 충분 */}
                    {cat.slug === activeCategorySlug && (
                      <span aria-hidden className="text-[9px] opacity-90 flex-shrink-0">▶</span>
                    )}
                    <span className="truncate flex-1">{cat.name}</span>
                    <span
                      className={
                        cat.slug === activeCategorySlug
                          ? 'text-[9px] font-mono opacity-80'
                          : 'text-[9px] font-mono text-ink-muted'
                      }
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* 아이템 목록 */}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingItems ? (
                  <p className="text-[11px] text-ink-muted text-center py-4">{t.loading}</p>
                ) : filteredItems.length === 0 ? (
                  <p className="text-[11px] text-ink-muted text-center py-4">
                    {searchQuery ? t.noResults : t.empty}
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {filteredItems.slice(0, 100).map((item) => (
                      <li key={item.slug}>
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={() => handleAddFromLibrary(item)}
                          className="w-full flex items-center gap-2 px-1.5 py-1 rounded text-[11px] text-ink hover:bg-rbs-accent-soft dark:hover:bg-rbs-accent/15 group cursor-grab active:cursor-grabbing"
                          title={`클릭 또는 드래그 — ${item.url}`}
                        >
                          {item.icon_src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.icon_src} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded bg-rbs-accent-soft flex-shrink-0" aria-hidden />
                          )}
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-rbs-accent text-[9px]">＋</span>
                        </button>
                      </li>
                    ))}
                    {filteredItems.length > 100 && (
                      <li className="text-[9px] text-ink-muted text-center pt-1">
                        {t.moreItems(filteredItems.length - 100)}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
}

/**
 * 아이콘 URL 검증 (TVZ, 2026-05-23) — http(s) 프로토콜 + 이미지 확장자 + data: URL (base64) 허용.
 * 거부: javascript:, file:, 확장자 없는 URL.
 * 빈값은 허용 (기본 색 블록).
 */
export function isValidIconUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return true;
  if (/^data:image\//i.test(trimmed)) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  // 확장자 또는 query 무관 (CDN 호환 — 확장자 없는 URL도 OK 단 http(s)면)
  return true;
}

/**
 * 큐브 단축키 정규화 (TVM, 2026-05-23) — 허용 패턴:
 * - 단일 영숫자: a-z, A-Z, 0-9
 * - 기능 키: F1~F12 (대소문자 무관)
 *
 * 거부: 다중 키 조합 (Ctrl+A 등), 공백, 특수문자, 한글
 * 비어있는 문자열은 hotkey 없음으로 별도 처리 (저장 시 metadata.hotkey 삭제)
 */
export function isValidHotkey(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return true; // 빈값 = 단축키 없음 = 허용
  if (/^[a-zA-Z0-9]$/.test(trimmed)) return true;
  if (/^[Ff]([1-9]|1[0-2])$/.test(trimmed)) return true;
  return false;
}

function actionTypeLabel(t: CubeItem['action_type']): string {
  switch (t) {
    case 'link':
      return 'LINK';
    case 'shortcut':
      return 'SHORTCUT';
    case 'macro':
      return 'MACRO';
    case 'folder':
      return 'FOLDER';
    // SD-AQ~AV (2026-05-23)
    case 'text_insert':
      return 'TEXT';
    case 'clipboard_copy':
      return 'COPY';
    case 'app_launch':
      return 'APP';
    case 'focus_window':
      return 'FOCUS';
    case 'mouse_click':
      return 'MOUSE';
    case 'plugin_action':
      return 'PLUGIN';
  }
}

/**
 * 비-link 액션 1줄 미리보기 (TST-S 2026-05-23 신규, TUH 2026-05-23 다국어).
 * 인스펙터는 link만 빠른 편집 지원 — shortcut/macro/folder는 읽기 전용 요약.
 */
const ACTION_PREVIEW_COPY = {
  ko: {
    noKeys: '(키 없음)',
    macroSteps: (n: number) => `${n}단계 매크로`,
    folder: (n: number) => `폴더 (${n}개 큐브)`,
    noUrl: '(URL 없음)',
  },
  en: {
    noKeys: '(no keys)',
    macroSteps: (n: number) => `${n}-step macro`,
    folder: (n: number) => `Folder (${n} cubes)`,
    noUrl: '(no URL)',
  },
  ja: {
    noKeys: '(キーなし)',
    macroSteps: (n: number) => `${n} ステップのマクロ`,
    folder: (n: number) => `フォルダ (${n} キューブ)`,
    noUrl: '(URL なし)',
  },
} as const;

function nonLinkActionPreview(item: CubeItem, locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  const payload = parseActionPayload(item);
  const c = ACTION_PREVIEW_COPY[locale] ?? ACTION_PREVIEW_COPY.ko;
  switch (payload.action_type) {
    case 'shortcut':
      return payload.keys.length > 0 ? payload.keys.join(' + ') : c.noKeys;
    case 'macro':
      return c.macroSteps(payload.steps.length);
    case 'folder':
      return c.folder(payload.cube_ids.length);
    case 'link':
      return payload.url || c.noUrl;
    // SD-AQ~AV (2026-05-23): 6 enum 확장 미리보기
    // SD-BT (2026-05-23): 줄바꿈 \n → " ↵ " 시각 인라인 변환
    case 'text_insert': {
      if (!payload.text) return '(no text)';
      const t = payload.text.slice(0, 40).replace(/\n/g, ' ↵ ');
      return `"${t}${payload.text.length > 40 ? '…' : ''}"`;
    }
    case 'clipboard_copy': {
      if (!payload.text) return '(no text)';
      const t = payload.text.slice(0, 40).replace(/\n/g, ' ↵ ');
      return `⧉ "${t}${payload.text.length > 40 ? '…' : ''}"`;
    }
    case 'app_launch':
      return payload.path || '(no path)';
    case 'focus_window':
      return payload.title_pattern || '(no pattern)';
    case 'mouse_click':
      return `(${payload.x}, ${payload.y}) ${payload.button}${payload.relative ? ' relative' : ''}`;
    case 'plugin_action':
      return payload.plugin_uuid || '(no plugin)';
  }
}
