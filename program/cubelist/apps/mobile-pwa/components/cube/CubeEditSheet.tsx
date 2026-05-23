'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { MacroEditor } from './MacroEditor';
import { Cube } from './Cube';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { useCubeBoards } from '@/lib/hooks/useCubeBoards';
import type { CubeItem } from '@/lib/types/cube';
import {
  CUBE_BG_PRESETS,
  cleanBadge,
  cubeBgPresetLabel,
  readCubeMeta,
  type CubeBgPreset,
} from '@/lib/types/cube';
import type { MacroStepDto } from '@/types/protocol';
import { exportCubeOne, downloadAsFile } from '@/lib/cube-format/export';

import { useTranslation } from '@/lib/i18n/useTranslation';

const EDIT_COPY = {
  ko: {
    title: '큐브 편집',
    previewLabel: '미리보기',
    nameLabel: '이름 (최대 16자)',
    namePlaceholder: '예: 네이버',
    iconLabel: '아이콘 URL (선택)',
    badgeLabel: '배지 (선택, 최대 4자)',
    badgePlaceholder: 'NEW / HOT / PRO 등',
    bgLabel: '배경색',
    doubleTapTitle: '더블탭 보호 (실수 방지)',
    doubleTapBody:
      '켜면 한 번 누르면 무시되고, 정해진 시간 안에 한 번 더 눌러야 실행됩니다. 위험한 매크로·외부 앱 실행에 권장.',
    doubleTapInterval: '간격',
    doubleTapAria: '더블탭 인식 간격',
    longPressTitle: '길게 누름 시간',
    longPressBody: '편집 시트 진입까지 누르고 있는 시간. 짧을수록 빠르게 진입.',
    longPressAria: '길게 누름 시간',
    actionTitle: '동작',
    actionFootnote: '저장 시 현재 선택된 동작 타입의 데이터만 반영됩니다. 다른 타입의 임시 입력은 창을 닫으면 사라집니다.',
    actionDraftTooltip: '작성 중인 데이터가 있습니다',
    linkLabel: '열 주소',
    shortcutLabel: '단축키 (예: ctrl+shift+t)',
    shortcutHint: '지원 키: ctrl, shift, alt, win, tab, enter, esc, space, f1~f12, 일반 문자',
    folderLabel: '폴더에 담을 큐브',
    folderHint: '체크한 큐브들이 이 폴더 안으로 들어갑니다 (재귀 X, 폴더는 폴더를 포함 못 함)',
    folderEmpty: '같은 보드에 다른 큐브가 없습니다',
    folderSelectionCount: (sel: number, total: number) => `${sel}/${total} 선택`,
    deleteBtn: '지우기',
    deleteConfirm: (n: string) => `"${n}" 큐브를 지울까요?`,
    exportBtn: '내보내기',
    exportTitle: '.cubeone 파일로 내보내기',
    cancel: '취소',
    saveBtn: '저장',
    savingBtn: '저장 중…',
    savedFlash: '저장됨',
    saveErrorName: '이름을 입력해주세요',
    escHint: 'Esc 로 닫기',
  },
  en: {
    title: 'Edit cube',
    previewLabel: 'Preview',
    nameLabel: 'Name (max 16 chars)',
    namePlaceholder: 'e.g. Naver',
    iconLabel: 'Icon URL (optional)',
    badgeLabel: 'Badge (optional, max 4 chars)',
    badgePlaceholder: 'NEW / HOT / PRO …',
    bgLabel: 'Background color',
    doubleTapTitle: 'Double-tap guard (prevent accidents)',
    doubleTapBody:
      'When enabled, a single tap is ignored — you must tap again within the window. Recommended for risky macros or external app launches.',
    doubleTapInterval: 'Interval',
    doubleTapAria: 'Double-tap window',
    longPressTitle: 'Long-press duration',
    longPressBody: 'How long to hold before the edit sheet opens. Shorter = faster.',
    longPressAria: 'Long-press duration',
    actionTitle: 'Action',
    actionFootnote:
      'Only the currently selected action type is saved. Drafts of other types disappear when you close this sheet.',
    actionDraftTooltip: 'You have unsaved data here',
    linkLabel: 'Open URL',
    shortcutLabel: 'Shortcut (e.g. ctrl+shift+t)',
    shortcutHint: 'Supported: ctrl, shift, alt, win, tab, enter, esc, space, f1–f12, regular keys',
    folderLabel: 'Cubes inside this folder',
    folderHint: 'Checked cubes will live inside this folder (no recursion — folders cannot contain folders)',
    folderEmpty: 'No other cubes on this board',
    folderSelectionCount: (sel: number, total: number) => `${sel}/${total} selected`,
    deleteBtn: 'Delete',
    deleteConfirm: (n: string) => `Delete cube "${n}"?`,
    exportBtn: 'Export',
    exportTitle: 'Export as .cubeone',
    cancel: 'Cancel',
    saveBtn: 'Save',
    savingBtn: 'Saving…',
    savedFlash: 'Saved',
    saveErrorName: 'Please enter a name',
    escHint: 'Press Esc to close',
  },
  ja: {
    title: 'キューブ編集',
    previewLabel: 'プレビュー',
    nameLabel: '名前 (最大 16 文字)',
    namePlaceholder: '例: ネイバー',
    iconLabel: 'アイコン URL (任意)',
    badgeLabel: 'バッジ (任意、最大 4 文字)',
    badgePlaceholder: 'NEW / HOT / PRO など',
    bgLabel: '背景色',
    doubleTapTitle: 'ダブルタップ保護 (誤操作防止)',
    doubleTapBody:
      'オンにすると 1 回の押下は無視され、指定時間内にもう一度押すと実行されます。危険なマクロや外部アプリ起動に推奨。',
    doubleTapInterval: '間隔',
    doubleTapAria: 'ダブルタップ判定間隔',
    longPressTitle: '長押し時間',
    longPressBody: '編集シートを開くまでの押下時間。短いほど素早く開きます。',
    longPressAria: '長押し時間',
    actionTitle: 'アクション',
    actionFootnote:
      '保存時は選択中のアクション タイプのデータのみ反映されます。他タイプの一時入力はシートを閉じると消えます。',
    actionDraftTooltip: '入力中のデータがあります',
    linkLabel: '開く URL',
    shortcutLabel: 'ショートカット (例: ctrl+shift+t)',
    shortcutHint: '対応キー: ctrl, shift, alt, win, tab, enter, esc, space, f1〜f12, 通常キー',
    folderLabel: 'フォルダ内のキューブ',
    folderHint: 'チェックしたキューブがこのフォルダ内に入ります (フォルダはフォルダを含めません)',
    folderEmpty: '同じボードに他のキューブはありません',
    folderSelectionCount: (sel: number, total: number) => `${sel}/${total} 選択`,
    deleteBtn: '削除',
    deleteConfirm: (n: string) => `キューブ "${n}" を削除しますか?`,
    exportBtn: 'エクスポート',
    exportTitle: '.cubeone でエクスポート',
    cancel: 'キャンセル',
    saveBtn: '保存',
    savingBtn: '保存中…',
    savedFlash: '保存しました',
    saveErrorName: '名前を入力してください',
    escHint: 'Esc で閉じる',
  },
} as const;

interface CubeEditSheetProps {
  open: boolean;
  item: CubeItem | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

/** SD-AQ~AV (2026-05-23): 4 enum → 10 enum 확장. CubeEditSheet은 link/shortcut/macro/folder UI만 구현, 6 신규는 외부에서 진입 시 fallback */
type ActionType = CubeItem['action_type'];

/**
 * 큐브 편집 시트 — label / icon / action 수정 + 삭제.
 *
 * 정착본 §7
 * - 편집 모드에서 길게 누름 → 본 시트 열림
 * - 외래어 금지 (Bind/Sync X)
 * - 매크로 에디터는 별도 페이즈
 */
export function CubeEditSheet({ open, item, onClose, onSaved, onDeleted }: CubeEditSheetProps) {
  const [label, setLabel] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [actionType, setActionType] = useState<ActionType>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [shortcutKeys, setShortcutKeys] = useState('');
  const [macroSteps, setMacroSteps] = useState<MacroStepDto[]>([]);
  /** folder 액션의 cube_ids — 같은 보드 다른 큐브 다중 선택 */
  const [folderCubeIds, setFolderCubeIds] = useState<string[]>([]);
  // SD-BD~BI (2026-05-23): 6 신규 enum 풀 편집 state
  const [textValue, setTextValue] = useState(''); // text_insert / clipboard_copy
  const [appPath, setAppPath] = useState(''); // app_launch
  const [appArgs, setAppArgs] = useState(''); // app_launch (space-separated)
  const [winPattern, setWinPattern] = useState(''); // focus_window
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [mouseButton, setMouseButton] = useState<'left' | 'right' | 'middle'>('left');
  const [mouseRelative, setMouseRelative] = useState(false);
  const [pluginUuid, setPluginUuid] = useState('');
  const [pluginPayloadJson, setPluginPayloadJson] = useState('{}');
  // SD-BK (2026-05-23): Plugin UUID 자동 listing (data/plugins → public/plugins 미러본)
  const [availablePluginUuids, setAvailablePluginUuids] = useState<Array<{ uuid: string; name: string }>>([]);
  // 같은 보드의 다른 큐브들 (folder 선택 시 cube_ids 후보)
  const { boards } = useCubeBoards();
  const sameBoardCubes = (item
    ? (boards.find((b) => b.id === item.board_id)?.items ?? []).filter(
        (it) => it.id !== item.id && it.action_type !== 'folder',
      )
    : []
  ).sort((a, b) => a.sort_order - b.sort_order);
  const [bgColor, setBgColor] = useState<CubeBgPreset>('default');
  const [badge, setBadge] = useState('');
  const [confirmDoublePress, setConfirmDoublePress] = useState(false);
  const [doublePressWindowMs, setDoublePressWindowMs] = useState(400);
  const [longPressMs, setLongPressMs] = useState(600);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useTranslation();
  const ec = EDIT_COPY[locale] ?? EDIT_COPY.ko;

  // SD-BK (2026-05-23): Plugin UUID 카탈로그 fetch (시트 마운트 1회)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const indexResp = await fetch('/plugins/index.json');
        if (!indexResp.ok) return;
        const indexData = (await indexResp.json()) as { entries?: Array<{ file: string }> };
        if (!indexData.entries) return;
        const out: Array<{ uuid: string; name: string }> = [];
        for (const ent of indexData.entries) {
          const fileResp = await fetch(`/plugins/${ent.file}`);
          if (!fileResp.ok) continue;
          const file = await fileResp.json();
          if (Array.isArray(file.actions)) {
            for (const a of file.actions) {
              if (typeof a.uuid === 'string' && typeof a.name === 'string') {
                out.push({ uuid: a.uuid, name: a.name });
              }
            }
          }
        }
        if (!cancelled) setAvailablePluginUuids(out);
      } catch {
        // 정적 manifest 없으면 무시
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!item) return;
    setLabel(item.label);
    setIconUrl(item.icon_url ?? '');
    setActionType(item.action_type);
    const payload = item.action_payload as Record<string, unknown>;
    setLinkUrl(typeof payload.url === 'string' ? payload.url : '');
    setShortcutKeys(
      Array.isArray(payload.keys) ? (payload.keys as string[]).join('+') : '',
    );
    setMacroSteps(Array.isArray(payload.steps) ? (payload.steps as MacroStepDto[]) : []);
    setFolderCubeIds(Array.isArray(payload.cube_ids) ? (payload.cube_ids as string[]) : []);
    // SD-BD~BI (2026-05-23): 6 신규 enum payload 동기화
    setTextValue(typeof payload.text === 'string' ? payload.text : '');
    setAppPath(typeof payload.path === 'string' ? payload.path : '');
    setAppArgs(Array.isArray(payload.args) ? (payload.args as string[]).join(' ') : '');
    setWinPattern(typeof payload.title_pattern === 'string' ? payload.title_pattern : '');
    setMouseX(typeof payload.x === 'number' ? payload.x : 0);
    setMouseY(typeof payload.y === 'number' ? payload.y : 0);
    setMouseButton(
      payload.button === 'right' || payload.button === 'middle' ? payload.button : 'left',
    );
    setMouseRelative(Boolean(payload.relative));
    setPluginUuid(typeof payload.plugin_uuid === 'string' ? payload.plugin_uuid : '');
    setPluginPayloadJson(
      typeof payload.payload === 'object' && payload.payload !== null
        ? JSON.stringify(payload.payload, null, 2)
        : '{}',
    );
    const meta = readCubeMeta(item.metadata);
    setBgColor(meta.bgColor);
    setBadge(meta.badge ?? '');
    setConfirmDoublePress(meta.confirmDoublePress);
    setDoublePressWindowMs(meta.doublePressWindowMs);
    setLongPressMs(meta.longPressMs);
    setError(null);
  }, [item]);

  if (!item) return null;

  async function handleSave() {
    if (!item) return;
    if (label.trim().length === 0) {
      setError(ec.saveErrorName);
      return;
    }
    // SD-BP (2026-05-23): text_insert/clipboard_copy 텍스트 1024자 길이 검증 (PC helper sendInput 부담 회피)
    if ((actionType === 'text_insert' || actionType === 'clipboard_copy') && textValue.length > 1024) {
      setError(
        locale === 'en'
          ? `Text length ${textValue.length} exceeds 1024 char limit`
          : locale === 'ja'
            ? `テキスト長 ${textValue.length} は 1024 文字制限を超えました`
            : `텍스트 길이 ${textValue.length}자가 1024자 제한을 초과합니다`,
      );
      return;
    }
    // SD-BM (2026-05-23): focus_window 와일드카드 검증 — `*` 1개 이하 허용 (정규식 회피)
    if (actionType === 'focus_window') {
      const wildcardCount = (winPattern.match(/\*/g) ?? []).length;
      if (wildcardCount > 1) {
        setError(
          locale === 'en'
            ? 'Window title pattern allows at most one wildcard (*)'
            : locale === 'ja'
              ? 'ウィンドウタイトルパターンはワイルドカード (*) を最大 1 個まで許可'
              : '윈도우 패턴은 와일드카드(*) 1개까지만 허용됩니다',
        );
        return;
      }
    }
    // SD-BJ (2026-05-23): plugin_action payload JSON 사전 검증 — 잘못된 JSON 차단
    if (actionType === 'plugin_action' && pluginPayloadJson.trim().length > 0) {
      try {
        const parsed = JSON.parse(pluginPayloadJson);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setError(
            locale === 'en'
              ? 'Plugin payload must be a JSON object'
              : locale === 'ja'
                ? 'プラグイン payload は JSON オブジェクトである必要があります'
                : '플러그인 payload는 JSON 객체여야 합니다',
          );
          return;
        }
      } catch {
        setError(
          locale === 'en'
            ? 'Plugin payload JSON is invalid'
            : locale === 'ja'
              ? 'プラグイン payload の JSON が無効です'
              : '플러그인 payload JSON 형식이 올바르지 않습니다',
        );
        return;
      }
    }
    setSaving(true);
    setError(null);

    try {
      const action_payload = buildPayload(actionType, linkUrl, shortcutKeys, macroSteps, folderCubeIds, {
        textValue,
        appPath,
        appArgs,
        winPattern,
        mouseX,
        mouseY,
        mouseButton,
        mouseRelative,
        pluginUuid,
        pluginPayloadJson,
      });
      const metadata: Record<string, unknown> = {};
      if (bgColor !== 'default') metadata.bg_color = bgColor;
      const cleanedBadge = cleanBadge(badge);
      if (cleanedBadge) metadata.badge = cleanedBadge.toUpperCase();
      if (confirmDoublePress) {
        metadata.confirm_double_press = true;
        if (doublePressWindowMs !== 400) metadata.double_press_window_ms = doublePressWindowMs;
      }
      if (longPressMs !== 600) metadata.long_press_ms = longPressMs;

      if (isLocalMode()) {
        localStore.updateItem(item.id, {
          label: label.trim().slice(0, 32),
          icon_url: iconUrl.trim() || null,
          action_type: actionType,
          action_payload,
          metadata,
        });
        onSaved();
        setSavedFlash(true);
        setTimeout(() => {
          setSavedFlash(false);
          onClose();
        }, 1_400);
        return;
      }

      const supabase = getSupabase();
      const { error: err } = await supabase
        .from('mylist_items')
        .update({
          label: label.trim().slice(0, 32),
          icon_url: iconUrl.trim() || null,
          action_type: actionType,
          action_payload,
          metadata,
        })
        .eq('id', item.id);

      if (err) throw err;
      onSaved();
      setSavedFlash(true);
      setTimeout(() => {
        setSavedFlash(false);
        onClose();
      }, 1_400);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    if (!item) return;
    setSaving(true);
    setConfirmingDelete(false);
    try {
      if (isLocalMode()) {
        localStore.deleteItem(item.id);
        onDeleted();
        onClose();
        return;
      }
      const supabase = getSupabase();
      const { error: err } = await supabase.from('mylist_items').delete().eq('id', item.id);
      if (err) throw err;
      onDeleted();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // 실시간 미리보기 데이터 — 저장 전 상태를 Cube 컴포넌트에 그대로 전달
  const previewItem = item
    ? {
        ...item,
        label: label || '(이름 없음)',
        icon_url: iconUrl.trim() || null,
        action_type: actionType,
        action_payload: buildPayload(actionType, linkUrl, shortcutKeys, macroSteps, folderCubeIds, {
        textValue,
        appPath,
        appArgs,
        winPattern,
        mouseX,
        mouseY,
        mouseButton,
        mouseRelative,
        pluginUuid,
        pluginPayloadJson,
      }),
        metadata: {
          ...(bgColor !== 'default' ? { bg_color: bgColor } : {}),
          ...(badge.trim().length > 0
            ? { badge: badge.trim().slice(0, 4).toUpperCase() }
            : {}),
          ...(confirmDoublePress ? { confirm_double_press: true } : {}),
          ...(confirmDoublePress && doublePressWindowMs !== 400
            ? { double_press_window_ms: doublePressWindowMs }
            : {}),
          ...(longPressMs !== 600 ? { long_press_ms: longPressMs } : {}),
        },
      }
    : null;

  // savedFlash 동안은 본문 입력 차단 — race 방지 (사용자가 닫히기 전 추가 변경 시도 → 무시되는 혼란 차단)
  const inputsLocked = saving || savedFlash;

  return (
    <BottomSheet open={open} onClose={onClose} title={ec.title}>
      <fieldset
        disabled={inputsLocked}
        className={`contents ${inputsLocked ? '[&_input]:opacity-60 [&_textarea]:opacity-60 [&_select]:opacity-60' : ''}`}
        aria-busy={inputsLocked}
      >
      <div className="flex flex-col gap-4">
        {/* 실시간 미리보기 */}
        {previewItem && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
            <div className="w-20 h-20 flex-shrink-0">
              <Cube item={previewItem} editMode={false} />
            </div>
            <div className="flex-1 min-w-0 text-xs text-ink-muted">
              <p className="font-medium text-ink">{ec.previewLabel}</p>
              <p className="mt-0.5 truncate">{previewItem.label}</p>
            </div>
          </div>
        )}

        {/* 이름 */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{ec.nameLabel}</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={32}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder={ec.namePlaceholder}
          />
        </label>

        {/* 아이콘 URL */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{ec.iconLabel}</span>
          <input
            type="url"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder="https://example.com/favicon.ico"
          />
        </label>

        {/* 배지 */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{ec.badgeLabel}</span>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value.slice(0, 4))}
            maxLength={4}
            className="border rounded-lg px-3 py-2 text-sm font-mono"
            placeholder={ec.badgePlaceholder}
          />
        </label>

        {/* 색상 */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{ec.bgLabel}</span>
          <div className="flex flex-wrap gap-2">
            {CUBE_BG_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setBgColor(p.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
                  bgColor === p.value
                    ? 'border-rbs-accent ring-2 ring-rbs-accent/30'
                    : 'border-border'
                }`}
                aria-pressed={bgColor === p.value}
              >
                <span
                  className={`w-4 h-4 rounded ${p.className.split(' ')[0]}`}
                  aria-hidden
                />
                {cubeBgPresetLabel(p.value, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 더블탭 보호 */}
        <div className="flex flex-col gap-2 p-2 rounded-lg border border-border cubelist-focus-group">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmDoublePress}
              onChange={(e) => setConfirmDoublePress(e.target.checked)}
              className="mt-0.5"
            />
            <div className="flex-1 text-xs">
              <p className="font-medium text-ink">{ec.doubleTapTitle}</p>
              <p className="text-ink-muted mt-0.5">{ec.doubleTapBody}</p>
            </div>
          </label>
          {confirmDoublePress && (
            <label className="flex items-center gap-3 text-xs pl-6">
              <span className="text-ink-muted">{ec.doubleTapInterval}</span>
              <input
                type="range"
                min={300}
                max={700}
                step={50}
                value={doublePressWindowMs}
                onChange={(e) => setDoublePressWindowMs(Number(e.target.value))}
                className="flex-1 accent-rbs-accent"
                aria-label={ec.doubleTapAria}
              />
              <span className="flex items-center gap-1 w-auto justify-end">
                <span className="font-mono text-ink">{doublePressWindowMs}ms</span>
                {doublePressWindowMs === 400 && (
                  <span className="text-[9px] px-1 py-0.5 rounded-full bg-surface-2 text-ink-muted border border-border">
                    {locale === 'en' ? 'default' : locale === 'ja' ? '既定' : '기본'}
                  </span>
                )}
              </span>
            </label>
          )}
        </div>

        {/* 길게 누름 시간 (HI) */}
        <div className="flex flex-col gap-2 p-2 rounded-lg border border-border cubelist-focus-group">
          <div className="text-xs">
            <p className="font-medium text-ink">{ec.longPressTitle}</p>
            <p className="text-ink-muted mt-0.5">{ec.longPressBody}</p>
          </div>
          <label className="flex items-center gap-3 text-xs">
            <input
              type="range"
              min={400}
              max={900}
              step={50}
              value={longPressMs}
              onChange={(e) => setLongPressMs(Number(e.target.value))}
              className="flex-1 accent-rbs-accent"
              aria-label={ec.longPressAria}
            />
            <span className="flex items-center gap-1 w-auto justify-end">
              <span className="font-mono text-ink">{longPressMs}ms</span>
              {longPressMs === 600 && (
                <span className="text-[9px] px-1 py-0.5 rounded-full bg-surface-2 text-ink-muted border border-border">
                  {locale === 'en' ? 'default' : locale === 'ja' ? '既定' : '기본'}
                </span>
              )}
            </span>
          </label>
        </div>

        {/* 동작 타입 — SD-BD~BI: 10 enum 토글 (4 기본 + 6 신규 row 2) */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{ec.actionTitle}</span>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                'link',
                'shortcut',
                'macro',
                'folder',
                'text_insert',
                'clipboard_copy',
                'app_launch',
                'focus_window',
                'mouse_click',
                'plugin_action',
              ] as const
            ).map((t) => {
              const hasDraft =
                (t === 'link' && linkUrl.trim().length > 0) ||
                (t === 'shortcut' && shortcutKeys.trim().length > 0) ||
                // SD-BD~BI (2026-05-23): 6 신규 enum draft 마커
                ((t === 'text_insert' || t === 'clipboard_copy') && textValue.length > 0) ||
                (t === 'app_launch' && appPath.trim().length > 0) ||
                (t === 'focus_window' && winPattern.trim().length > 0) ||
                (t === 'mouse_click' && (mouseX !== 0 || mouseY !== 0)) ||
                (t === 'plugin_action' && pluginUuid.trim().length > 0) ||
                (t === 'macro' && macroSteps.length > 0);
              const isActive = actionType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActionType(t)}
                  className={`relative px-2.5 py-2 rounded-lg border text-xs ${
                    isActive
                      ? 'bg-rbs-accent text-white border-rbs-accent'
                      : 'bg-surface text-ink'
                  }`}
                  title={hasDraft && !isActive ? ec.actionDraftTooltip : undefined}
                >
                  {actionLabel(t, locale)}
                  {hasDraft && !isActive && (
                    <span
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rbs-accent"
                      aria-label="작성 중인 데이터 있음"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-muted">{ec.actionFootnote}</p>
        </div>

        {/* 동작별 입력 */}
        {actionType === 'link' && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{ec.linkLabel}</span>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="https://"
            />
          </label>
        )}

        {actionType === 'shortcut' && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{ec.shortcutLabel}</span>
            <input
              type="text"
              value={shortcutKeys}
              onChange={(e) => setShortcutKeys(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="ctrl+c"
            />
            <span className="text-xs text-ink-muted">{ec.shortcutHint}</span>
          </label>
        )}

        {actionType === 'macro' && (
          <MacroEditor steps={macroSteps} onChange={setMacroSteps} />
        )}

        {/* SD-BD~BI (2026-05-23): 6 신규 enum 풀 편집 — SD-AY 안내 박스 → 실 편집 UI 교체 */}
        {/* text_insert / clipboard_copy 풀 편집 — multiline textarea */}
        {(actionType === 'text_insert' || actionType === 'clipboard_copy') && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {actionType === 'text_insert' ? '입력할 텍스트' : '클립보드 복사 텍스트'}
            </label>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={4}
              maxLength={1024}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-surface focus:outline-none focus:ring-2 font-mono resize-y ${
                textValue.length > 900
                  ? 'border-yellow-500 focus:ring-yellow-300'
                  : 'border-border focus:border-rbs-accent focus:ring-rbs-accent/20'
              }`}
              placeholder={actionType === 'text_insert' ? '예: 안녕하세요\\nDear customer,' : '복사할 텍스트'}
            />
            <p className="text-[10px] text-ink-muted text-right font-mono">
              {textValue.length} / 1024
            </p>
            <p className="text-xs text-ink-muted">
              {actionType === 'text_insert'
                ? '큐브를 누르면 현재 포커스에 텍스트 입력 (PC 헬퍼 Tier 1)'
                : '큐브를 누르면 클립보드에 복사 (PC 헬퍼 Tier 1)'}
            </p>
          </div>
        )}

        {/* SD-BF (2026-05-23): app_launch 풀 편집 — path + args 공백 구분. SD-BL: 흔한 경로 제안 datalist */}
        {actionType === 'app_launch' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">앱 실행 경로</label>
            <input
              type="text"
              list="cubelist-app-paths"
              value={appPath}
              onChange={(e) => setAppPath(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
              placeholder="C:\\Program Files\\App\\app.exe"
            />
            <datalist id="cubelist-app-paths">
              <option value="C:\\Windows\\notepad.exe">Notepad</option>
              <option value="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe">Chrome</option>
              <option value="C:\\Program Files\\Microsoft VS Code\\Code.exe">VS Code</option>
              <option value="C:\\Windows\\System32\\calc.exe">Calculator</option>
              <option value="C:\\Windows\\System32\\cmd.exe">Command Prompt</option>
              <option value="C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Slack\\slack.exe">Slack</option>
              <option value="C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-*\\Discord.exe">Discord</option>
              <option value="C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe">OBS Studio</option>
            </datalist>
            <label className="text-sm font-medium">실행 인자 (공백 구분, 따옴표로 그룹화)</label>
            <input
              type="text"
              value={appArgs}
              onChange={(e) => setAppArgs(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
              placeholder='--flag value "공백 있는 값"'
            />
            {/* SD-BU (2026-05-23): quoted args parse 결과 미리보기 */}
            {appArgs.trim() && (
              <p className="text-[10px] text-ink-muted font-mono">
                → [{parseQuotedArgs(appArgs).map((a) => `"${a}"`).join(', ')}]
              </p>
            )}
            <p className="text-xs text-ink-muted">
              Tier 2 — 1회 동의 prompt 필요. 경로 화이트리스트 검증 (PC 헬퍼).
            </p>
            {/* SD-BQ (2026-05-23): %USERNAME% 등 환경변수 사용 시 안내 */}
            {/[%$]/.test(appPath) && (
              <p className="text-[10px] text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded">
                💡 환경변수 (예: %USERNAME%, $HOME)는 PC 헬퍼에서 자동 expand됩니다.
              </p>
            )}
          </div>
        )}

        {/* SD-BG (2026-05-23): focus_window 풀 편집 */}
        {actionType === 'focus_window' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">윈도우 타이틀 패턴</label>
            <input
              type="text"
              value={winPattern}
              onChange={(e) => setWinPattern(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
              placeholder="*.txt - Notepad / Chrome / Slack"
            />
            <p className="text-xs text-ink-muted">
              부분 일치 또는 와일드카드(*) 지원. 첫 매칭 윈도우에 포커스 (Tier 2).
            </p>
            {/* SD-BV (2026-05-23): 패턴 예시 */}
            <details className="text-[10px] text-ink-muted">
              <summary className="cursor-pointer hover:text-rbs-accent">📖 패턴 예시</summary>
              <ul className="mt-1 pl-3 space-y-0.5 list-disc">
                <li><code className="font-mono">Notepad</code> — 부분 일치 (제목에 "Notepad" 포함)</li>
                <li><code className="font-mono">*.txt - Notepad</code> — `*`는 임의 문자 (위치 자유), `.txt` 확장자 메모장</li>
                <li><code className="font-mono">Chrome*</code> — Chrome으로 시작 (접두 매칭)</li>
                <li><code className="font-mono">*Chrome</code> — Chrome으로 끝남 (접미 매칭)</li>
              </ul>
              <p className="mt-1.5 text-[9px] italic">⚠ 와일드카드 `*`는 최대 1개. 정규식 미지원 (영구).</p>
            </details>
          </div>
        )}

        {/* SD-BH (2026-05-23): mouse_click 풀 편집 — x/y/button/relative */}
        {actionType === 'mouse_click' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">마우스 좌표 (x, y)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={mouseX}
                onChange={(e) => setMouseX(Number(e.target.value) || 0)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                placeholder="x"
              />
              <input
                type="number"
                value={mouseY}
                onChange={(e) => setMouseY(Number(e.target.value) || 0)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
                placeholder="y"
              />
            </div>
            <label className="text-sm font-medium">버튼</label>
            <div className="flex gap-2">
              {(['left', 'right', 'middle'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setMouseButton(b)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                    mouseButton === b
                      ? 'bg-rbs-accent text-white border-rbs-accent'
                      : 'bg-surface text-ink border-border'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mouseRelative}
                onChange={(e) => setMouseRelative(e.target.checked)}
                className="accent-rbs-accent"
              />
              상대 좌표 (현재 마우스 위치 기준)
            </label>
            {/* SD-BN (2026-05-23): 좌표 picker — PC 헬퍼 의존 안내 (sendMessage 후속) */}
            <p className="text-[10px] text-ink-muted italic">
              💡 좌표 직접 입력 (PC 헬퍼 페어링 후 "현재 위치 캡처" 자동 입력 후속 지원 — SD-BN-2)
            </p>
            <p className="text-xs text-ink-muted">Tier 2 — PC 헬퍼 필요.</p>
          </div>
        )}

        {/* SD-BI (2026-05-23): plugin_action 풀 편집 — UUID + JSON payload. SD-BK: 자동 listing datalist */}
        {actionType === 'plugin_action' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Plugin UUID (역도메인)</label>
            <input
              type="text"
              list="cubelist-plugin-uuids"
              value={pluginUuid}
              onChange={(e) => setPluginUuid(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono"
              placeholder="com.example.plugin.action"
            />
            {availablePluginUuids.length > 0 && (
              <datalist id="cubelist-plugin-uuids">
                {availablePluginUuids.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </datalist>
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Payload (JSON)</label>
              {/* SD-BR (2026-05-23): JSON pretty 버튼 — raw 입력을 2-space indent로 자동 정렬 */}
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(pluginPayloadJson);
                    setPluginPayloadJson(JSON.stringify(parsed, null, 2));
                  } catch {
                    // 무시 — 잘못된 JSON은 SD-BJ에서 저장 시 차단
                  }
                }}
                className="text-[10px] text-rbs-accent hover:underline px-1.5 py-0.5 rounded border border-rbs-accent/30"
                title="JSON 정렬 (2-space indent)"
              >
                {'{ } Format'}
              </button>
            </div>
            <textarea
              value={pluginPayloadJson}
              onChange={(e) => setPluginPayloadJson(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface focus:border-rbs-accent focus:outline-none focus:ring-2 focus:ring-rbs-accent/20 font-mono resize-y"
              placeholder='{"key": "value"}'
            />
            <p className="text-xs text-ink-muted">
              플러그인 정의 액션. UUID 매핑 + payload 검증은 플러그인 manifest 위임.
            </p>
          </div>
        )}

        {actionType === 'folder' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{ec.folderLabel}</label>
            <p className="text-xs text-ink-muted">{ec.folderHint}</p>
            {sameBoardCubes.length === 0 ? (
              <p className="text-xs text-ink-muted py-3 text-center border border-dashed border-border rounded-lg">
                {ec.folderEmpty}
              </p>
            ) : (
              <>
                <div className="text-xs text-ink-muted">
                  {ec.folderSelectionCount(folderCubeIds.length, sameBoardCubes.length)}
                </div>
                <ul className="max-h-[40vh] overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  {sameBoardCubes.map((cube) => (
                    <li key={cube.id}>
                      <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-rbs-accent"
                          checked={folderCubeIds.includes(cube.id)}
                          onChange={(e) => {
                            setFolderCubeIds((prev) =>
                              e.target.checked
                                ? [...prev, cube.id]
                                : prev.filter((id) => id !== cube.id),
                            );
                          }}
                        />
                        <span className="text-[10px] text-ink-muted font-mono w-12 truncate">
                          {cube.action_type}
                        </span>
                        <span className="flex-1 truncate">{cube.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {confirmingDelete && item && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="rounded-lg p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-900 dark:text-red-200 flex flex-col gap-2"
          >
            <p>{ec.deleteConfirm(item.label)}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-3 py-1.5 rounded-md text-xs border border-red-300 dark:border-red-700"
              >
                {ec.cancel}
              </button>
              <button
                type="button"
                onClick={() => void performDelete()}
                disabled={saving}
                className="px-3 py-1.5 rounded-md text-xs bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {ec.deleteBtn}
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-ink-muted text-right hidden sm:block">
          {ec.escHint}
        </p>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={saving || confirmingDelete}
            className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {ec.deleteBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!item) return;
              void exportCubeOne(item, { license: 'personal' }).then((blob) => {
                downloadAsFile(
                  `${item.label.replace(/[^a-z0-9가-힣_-]+/gi, '_')}.cubeone`,
                  blob,
                );
              });
            }}
            disabled={saving}
            className="px-3 py-2 rounded-lg text-xs text-ink-muted hover:bg-surface-2 disabled:opacity-50"
            title={ec.exportTitle}
          >
            {ec.exportBtn}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface-2"
          >
            {ec.cancel}
          </button>
          {savedFlash && (
            <span
              role="status"
              aria-live="polite"
              className="px-2.5 py-1 rounded-full bg-rbs-accent text-white text-xs font-medium animate-pulse"
            >
              ✓ {ec.savedFlash}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || savedFlash}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-rbs-accent text-white disabled:opacity-50"
          >
            {saving ? ec.savingBtn : savedFlash ? ec.savedFlash : ec.saveBtn}
          </button>
        </div>
      </div>
      </fieldset>
    </BottomSheet>
  );
}

function actionLabel(t: ActionType, locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  // SD-AQ~AV (2026-05-23): 10 enum 확장. CubeEditSheet UI는 4개 + 신규 6개 라벨만 (실편집 UI는 추가 후속)
  const table: Record<'ko' | 'en' | 'ja', Record<ActionType, string>> = {
    ko: {
      link: '링크',
      shortcut: '단축키',
      macro: '매크로',
      folder: '폴더',
      text_insert: '텍스트 입력',
      clipboard_copy: '클립보드 복사',
      app_launch: '앱 실행',
      focus_window: '윈도우 포커스',
      mouse_click: '마우스 클릭',
      plugin_action: '플러그인',
    },
    en: {
      link: 'Link',
      shortcut: 'Shortcut',
      macro: 'Macro',
      folder: 'Folder',
      text_insert: 'Text insert',
      clipboard_copy: 'Clipboard copy',
      app_launch: 'App launch',
      focus_window: 'Focus window',
      mouse_click: 'Mouse click',
      plugin_action: 'Plugin',
    },
    ja: {
      link: 'リンク',
      shortcut: 'ショートカット',
      macro: 'マクロ',
      folder: 'フォルダ',
      text_insert: 'テキスト入力',
      clipboard_copy: 'クリップボードコピー',
      app_launch: 'アプリ起動',
      focus_window: 'ウィンドウフォーカス',
      mouse_click: 'マウスクリック',
      plugin_action: 'プラグイン',
    },
  };
  return table[locale][t];
}

/**
 * SD-BD~BI (2026-05-23): 6 신규 enum 풀 편집 payload 인자 묶음.
 * SD-AY 안내 박스에서 SD-BD~BI 풀 편집 UI 진입 시 신규 state 5개 사용.
 */
interface ExtendedPayloadArgs {
  textValue: string;
  appPath: string;
  appArgs: string;
  winPattern: string;
  mouseX: number;
  mouseY: number;
  mouseButton: 'left' | 'right' | 'middle';
  mouseRelative: boolean;
  pluginUuid: string;
  pluginPayloadJson: string;
}

/**
 * SD-BU (2026-05-23): quoted args 지원 파서 — `"hello world" -flag value`를 ["hello world", "-flag", "value"]로 분리.
 * 단순 상태 머신 (백슬래시 이스케이프 미지원, 사용자 결정 시 확장).
 */
function parseQuotedArgs(raw: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (const ch of raw) {
    if (ch === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && /\s/.test(ch)) {
      if (cur.length > 0) {
        out.push(cur);
        cur = '';
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0) out.push(cur);
  return out;
}

function buildPayload(
  type: ActionType,
  linkUrl: string,
  shortcutKeysCsv: string,
  macroSteps: MacroStepDto[],
  folderCubeIds: string[],
  ext?: ExtendedPayloadArgs,
): Record<string, unknown> {
  switch (type) {
    case 'link':
      return { url: linkUrl.trim() };
    case 'shortcut':
      return {
        keys: shortcutKeysCsv
          .split(/[+\s,]/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean),
      };
    case 'macro':
      return { steps: macroSteps };
    case 'folder':
      return { cube_ids: folderCubeIds };
    // SD-BD~BI (2026-05-23): 6 신규 enum 풀 편집 payload
    case 'text_insert':
      return { text: ext?.textValue ?? '' };
    case 'clipboard_copy':
      return { text: ext?.textValue ?? '' };
    case 'app_launch':
      return {
        path: (ext?.appPath ?? '').trim(),
        args: (ext?.appArgs ?? '').trim()
          ? parseQuotedArgs(ext!.appArgs)
          : undefined,
      };
    case 'focus_window':
      return { title_pattern: (ext?.winPattern ?? '').trim() };
    case 'mouse_click':
      return {
        x: ext?.mouseX ?? 0,
        y: ext?.mouseY ?? 0,
        button: ext?.mouseButton ?? 'left',
        relative: ext?.mouseRelative ?? false,
      };
    case 'plugin_action': {
      let payload: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(ext?.pluginPayloadJson ?? '{}');
        if (typeof parsed === 'object' && parsed !== null) payload = parsed as Record<string, unknown>;
      } catch {
        // 잘못된 JSON은 빈 객체 fallback
      }
      return { plugin_uuid: (ext?.pluginUuid ?? '').trim(), payload };
    }
  }
}
