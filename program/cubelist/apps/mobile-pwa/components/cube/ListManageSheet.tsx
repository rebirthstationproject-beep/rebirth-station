'use client';

import { useEffect, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getSupabase } from '@/lib/supabase';
import { isLocalMode, localStore } from '@/lib/storage/local-store';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import type { CubeBoard } from '@/lib/types/cube';
import { useTranslation } from '@/lib/i18n/useTranslation';

const LIST_MANAGE_COPY = {
  ko: {
    titleNew: '새 리스트',
    titleEdit: '리스트 관리',
    nameLabel: '이름',
    namePlaceholder: '예: 일, 게임, 음악',
    nameRequired: '이름을 입력해주세요',
    loginRequired: '로그인이 필요합니다',
    gridLabel: '그리드 크기',
    gridShrinkWarning: '그리드를 줄이면 범위를 벗어나는 큐브가 잘릴 수 있습니다.',
    cutoffWarning: (n: number) => `현재 설정에서 ${n}개 큐브가 범위를 벗어나 비활성됩니다.`,
    deleteBtn: '지우기',
    deleteConfirm: (n: string) => `"${n}" 리스트와 모든 큐브를 지울까요? 되돌릴 수 없습니다.`,
    cancel: '취소',
    saveBtn: '저장',
    createBtn: '만들기',
    savingBtn: '저장 중…',
    escHint: 'Esc 로 닫기',
  },
  en: {
    titleNew: 'New list',
    titleEdit: 'Manage list',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Work, Game, Music',
    nameRequired: 'Please enter a name',
    loginRequired: 'Sign-in required',
    gridLabel: 'Grid size',
    gridShrinkWarning: 'Reducing the grid may clip cubes that fall outside the range.',
    cutoffWarning: (n: number) => `${n} cube${n > 1 ? 's' : ''} will be hidden outside the new grid.`,
    deleteBtn: 'Delete',
    deleteConfirm: (n: string) =>
      `Delete "${n}" and all of its cubes? This cannot be undone.`,
    cancel: 'Cancel',
    saveBtn: 'Save',
    createBtn: 'Create',
    savingBtn: 'Saving…',
    escHint: 'Press Esc to close',
  },
  ja: {
    titleNew: '新規リスト',
    titleEdit: 'リスト管理',
    nameLabel: '名前',
    namePlaceholder: '例: 仕事、ゲーム、音楽',
    nameRequired: '名前を入力してください',
    loginRequired: 'ログインが必要です',
    gridLabel: 'グリッド サイズ',
    gridShrinkWarning: 'グリッドを縮小すると、範囲外のキューブが切り捨てられる場合があります。',
    cutoffWarning: (n: number) => `現在の設定で ${n} 個のキューブが範囲外になります。`,
    deleteBtn: '削除',
    deleteConfirm: (n: string) =>
      `"${n}" リストとすべてのキューブを削除しますか? 元に戻せません。`,
    cancel: 'キャンセル',
    saveBtn: '保存',
    createBtn: '作成',
    savingBtn: '保存中…',
    escHint: 'Esc で閉じる',
  },
} as const;

interface ListManageSheetProps {
  open: boolean;
  board: CubeBoard | null;
  onClose: () => void;
  /** 저장 성공 시 호출. 새 보드면 생성된 ID 전달 (FA — 자동 활성 전환용) */
  onSaved: (createdBoardId?: string) => void;
  onDeleted: () => void;
}

export function ListManageSheet({ open, board, onClose, onSaved, onDeleted }: ListManageSheetProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { locale } = useTranslation();
  const c = LIST_MANAGE_COPY[locale] ?? LIST_MANAGE_COPY.ko;
  const { activeWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (!board) {
      setName('');
      setError(null);
      return;
    }
    setName(board.name);
    setError(null);
  }, [board]);

  const isNew = !board;

  async function handleSave() {
    if (name.trim().length === 0) {
      setError(c.nameRequired);
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (isLocalMode()) {
        if (isNew) {
          // 활성 워크스페이스에 자동 귀속 (null이면 기본 워크스페이스)
          const created = localStore.createBoardInWorkspace(
            name.trim().slice(0, 64),
            activeWorkspaceId,
          );
          onSaved(created.id);
        } else {
          localStore.updateBoard(board!.id, { name: name.trim().slice(0, 64) });
          onSaved();
        }
        onClose();
        return;
      }

      const supabase = getSupabase();

      if (isNew) {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          setError(c.loginRequired);
          return;
        }
        // sort_order는 마지막 board 다음
        const { data: last } = await supabase
          .from('mylist_boards')
          .select('sort_order')
          .eq('user_id', session.session.user.id)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextSort = (last?.sort_order ?? 0) + 1;

        const { data: inserted, error: err } = await supabase
          .from('mylist_boards')
          .insert({
            user_id: session.session.user.id,
            name: name.trim().slice(0, 64),
            sort_order: nextSort,
          })
          .select('id')
          .single();
        if (err) throw err;
        onSaved(inserted?.id);
        onClose();
        return;
      } else {
        const { error: err } = await supabase
          .from('mylist_boards')
          .update({
            name: name.trim().slice(0, 64),
          })
          .eq('id', board.id);
        if (err) throw err;
      }

      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    if (!board) return;
    setSaving(true);
    setConfirmingDelete(false);
    try {
      if (isLocalMode()) {
        localStore.deleteBoard(board.id);
        onDeleted();
        onClose();
        return;
      }
      const supabase = getSupabase();
      const { error: err } = await supabase.from('mylist_boards').delete().eq('id', board.id);
      if (err) throw err;
      onDeleted();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={isNew ? c.titleNew : c.titleEdit}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{c.nameLabel}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            className="border rounded-lg px-3 py-2 text-sm"
            placeholder={c.namePlaceholder}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {confirmingDelete && board && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="rounded-lg p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-900 dark:text-red-200 flex flex-col gap-2"
          >
            <p>{c.deleteConfirm(board.name)}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-3 py-1.5 rounded-md text-xs border border-red-300 dark:border-red-700"
              >
                {c.cancel}
              </button>
              <button
                type="button"
                onClick={() => void performDelete()}
                disabled={saving}
                className="px-3 py-1.5 rounded-md text-xs bg-red-600 text-white font-medium disabled:opacity-50"
              >
                {c.deleteBtn}
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-ink-muted text-right hidden sm:block">{c.escHint}</p>

        <div className="flex gap-2 pt-2">
          {!isNew && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving || confirmingDelete}
              className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {c.deleteBtn}
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface-2"
          >
            {c.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-rbs-accent text-white disabled:opacity-50"
          >
            {saving ? c.savingBtn : isNew ? c.createBtn : c.saveBtn}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
