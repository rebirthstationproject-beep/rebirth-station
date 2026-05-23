'use client';

import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { exportCubePack, downloadAsFile } from '@/lib/cube-format/export';
import { type LicenseKind } from '@/lib/cube-format/spec';
import type { CubeBoard } from '@/lib/types/cube';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useSession } from '@/lib/hooks/useSession';

interface CubePackSheetProps {
  /** 시트 열림 상태 (BottomSheet 부모가 토글) */
  open: boolean;
  /** 시트 닫기 — Esc / ✕ / 배경 클릭 시 호출 */
  onClose: () => void;
  /** 현재 사용자의 모든 보드 — 사용자가 어느 보드를 .cubepack에 포함할지 체크 선택 */
  boards: CubeBoard[];
}

const PERSONA_PRESETS_BY_LOCALE: Record<'ko' | 'en' | 'ja', Array<{ value: string; label: string }>> = {
  ko: [
    { value: 'developer', label: '개발자' },
    { value: 'designer', label: '디자이너' },
    { value: 'streamer', label: '스트리머' },
    { value: 'editor', label: '에디터' },
    { value: 'trader', label: '트레이더' },
    { value: 'student', label: '학생' },
    { value: 'office', label: '직장인' },
    { value: 'creator', label: '크리에이터' },
  ],
  en: [
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'streamer', label: 'Streamer' },
    { value: 'editor', label: 'Editor' },
    { value: 'trader', label: 'Trader' },
    { value: 'student', label: 'Student' },
    { value: 'office', label: 'Office worker' },
    { value: 'creator', label: 'Creator' },
  ],
  ja: [
    { value: 'developer', label: '開発者' },
    { value: 'designer', label: 'デザイナー' },
    { value: 'streamer', label: 'ストリーマー' },
    { value: 'editor', label: 'エディター' },
    { value: 'trader', label: 'トレーダー' },
    { value: 'student', label: '学生' },
    { value: 'office', label: '会社員' },
    { value: 'creator', label: 'クリエイター' },
  ],
};

const PACK_COPY = {
  ko: {
    title: '큐브팩 만들기',
    listsLabel: '묶을 리스트',
    noBoardsHint: '먼저 리스트를 만들어주세요',
    nameLabel: '묶음 이름',
    namePlaceholder: '예: 개발자 키트, 스트리머 풀세트',
    descLabel: '설명 (선택)',
    descPlaceholder: '이 큐브팩이 어떤 작업 흐름을 다루는지',
    personaLabel: '대상 페르소나 (선택, 복수 가능)',
    authorLabel: '제작자 표기 (선택)',
    authorPlaceholder: '익명이면 비워두세요',
    licenseLabel: '라이선스',
    cancel: '취소',
    createBtn: '.cubepack 만들기',
    footerNote: '파일은 본인 기기로 다운로드됩니다. Stage 1에서는 마켓 업로드 없이 직접 공유·백업 용도로 사용하세요.',
    pickAtLeastOne: '하나 이상의 리스트를 선택해주세요',
    nameRequired: '묶음 이름을 입력해주세요',
    escHint: 'Esc 로 닫기',
    units: (n: number, _total: number) => ` (${n}/${_total})`,
    boardItems: (n: number) => `${n}개`,
  },
  en: {
    title: 'Create cubepack',
    listsLabel: 'Lists to bundle',
    noBoardsHint: 'Create at least one list first.',
    nameLabel: 'Pack name',
    namePlaceholder: 'e.g. Developer kit, Streamer full set',
    descLabel: 'Description (optional)',
    descPlaceholder: 'What workflow does this pack cover?',
    personaLabel: 'Target personas (optional, multi-select)',
    authorLabel: 'Author credit (optional)',
    authorPlaceholder: 'Leave blank to stay anonymous',
    licenseLabel: 'License',
    cancel: 'Cancel',
    createBtn: 'Create .cubepack',
    footerNote:
      'The file is downloaded to your device. In Stage 1 use this for direct sharing or backup; no marketplace upload yet.',
    pickAtLeastOne: 'Select at least one list',
    nameRequired: 'Enter a name for the pack',
    escHint: 'Press Esc to close',
    units: (n: number, _total: number) => ` (${n}/${_total})`,
    boardItems: (n: number) => `${n} cubes`,
  },
  ja: {
    title: 'キューブパックを作成',
    listsLabel: '束ねるリスト',
    noBoardsHint: 'まずリストを作成してください。',
    nameLabel: 'パック名',
    namePlaceholder: '例: 開発者キット、ストリーマー フルセット',
    descLabel: '説明 (任意)',
    descPlaceholder: 'このキューブパックが扱う作業フロー',
    personaLabel: '対象ペルソナ (任意、複数選択可)',
    authorLabel: '制作者表記 (任意)',
    authorPlaceholder: '匿名にする場合は空欄でも可',
    licenseLabel: 'ライセンス',
    cancel: 'キャンセル',
    createBtn: '.cubepack を作成',
    footerNote:
      'ファイルはお手元のデバイスにダウンロードされます。Stage 1 ではマーケット アップロードはせず、共有・バックアップ用途で使用してください。',
    pickAtLeastOne: '1つ以上のリストを選択してください',
    nameRequired: 'パック名を入力してください',
    escHint: 'Esc で閉じる',
    units: (n: number, _total: number) => ` (${n}/${_total})`,
    boardItems: (n: number) => `${n} キューブ`,
  },
} as const;

type LicenseLabels = Record<LicenseKind, string>;

const LICENSE_LABELS_BY_LOCALE: Record<'ko' | 'en' | 'ja', LicenseLabels> = {
  ko: {
    free: '무료 — 누구나 사용·재배포',
    personal: '개인 — 본인 사용만',
    commercial: '상업 — 사용 가능, 재배포 시 출처 표시',
    proprietary: '비공개 — 자사 콜라보 등',
  },
  en: {
    free: 'Free — anyone can use & redistribute',
    personal: 'Personal — your own use only',
    commercial: 'Commercial — usable, attribution on redistribution',
    proprietary: 'Proprietary — inhouse collab, no external distribution',
  },
  ja: {
    free: '無料 — 誰でも使用・再配布可',
    personal: '個人 — 本人の使用のみ',
    commercial: '商業 — 使用可、再配布時は出典表示',
    proprietary: '非公開 — 自社コラボなど',
  },
};

const LICENSE_KINDS: LicenseKind[] = ['free', 'personal', 'commercial', 'proprietary'];

/**
 * 큐브팩 큐레이션 시트.
 *
 * 정착본: docs/file-format-spec.md §.cubepack — 직군별 묶음
 *
 * 흐름
 * 1. 보드 다중 선택 (체크박스)
 * 2. 메타 입력 (이름·설명·페르소나·라이선스)
 * 3. .cubepack 파일 다운로드
 *
 * Stage 1 — 마켓 업로드 X, 사용자 백업/공유 트랙.
 */
export function CubePackSheet({ open, onClose, boards }: CubePackSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personas, setPersonas] = useState<Set<string>>(new Set());
  const [license, setLicense] = useState<LicenseKind>('personal');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { locale } = useTranslation();
  const { user } = useSession();
  const sessionNickname = (user?.user_metadata?.nickname as string | undefined) ?? '';
  const licenseLabels = LICENSE_LABELS_BY_LOCALE[locale] ?? LICENSE_LABELS_BY_LOCALE.ko;
  const personaPresets = PERSONA_PRESETS_BY_LOCALE[locale] ?? PERSONA_PRESETS_BY_LOCALE.ko;
  const c = PACK_COPY[locale] ?? PACK_COPY.ko;

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setName('');
      setDescription('');
      setPersonas(new Set());
      setLicense('personal');
      // JB — 시트 열릴 때 사용자 닉네임으로 author 자동 채움
      setAuthor(sessionNickname);
      setError(null);
    }
  }, [open, sessionNickname]);

  const selectedBoards = useMemo(
    () => boards.filter((b) => selectedIds.has(b.id)),
    [boards, selectedIds],
  );

  function toggleBoard(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePersona(value: string): void {
    setPersonas((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function handleExport(): void {
    setError(null);
    if (selectedBoards.length === 0) {
      setError(c.pickAtLeastOne);
      return;
    }
    if (name.trim().length === 0) {
      setError(c.nameRequired);
      return;
    }

    void (async () => {
      try {
        const blob = await exportCubePack(selectedBoards, {
          name: name.trim().slice(0, 80),
          description: description.trim() || undefined,
          target_persona: personas.size > 0 ? Array.from(personas) : undefined,
          license,
          author: author.trim() || undefined,
        });
        downloadAsFile(
          `${name.replace(/[^a-z0-9가-힣_-]+/gi, '_').slice(0, 32) || 'cubepack'}.cubepack`,
          blob,
        );
        onClose();
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={c.title}>
      <div className="flex flex-col gap-4">
        {/* 보드 선택 */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {c.listsLabel}
            {c.units(selectedIds.size, boards.length)}
          </span>
          {boards.length === 0 ? (
            <p className="text-xs text-ink-muted py-3 text-center border border-dashed rounded-lg">
              {c.noBoardsHint}
            </p>
          ) : (
            <ul className="border border-border rounded-lg divide-y max-h-48 overflow-y-auto">
              {boards.map((b) => (
                <li key={b.id}>
                  <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(b.id)}
                      onChange={() => toggleBoard(b.id)}
                    />
                    <span className="flex-1 truncate">{b.name}</span>
                    <span className="text-xs text-ink-muted">
                      {c.boardItems(b.items.length)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 묶음 메타 */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{c.nameLabel}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="border border-border bg-surface rounded-lg px-3 py-2 text-sm"
            placeholder={c.namePlaceholder}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{c.descLabel}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="border border-border bg-surface rounded-lg px-3 py-2 text-sm"
            placeholder={c.descPlaceholder}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{c.personaLabel}</span>
          <div className="flex flex-wrap gap-1.5">
            {personaPresets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePersona(p.value)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  personas.has(p.value)
                    ? 'bg-rbs-accent text-white border-rbs-accent'
                    : 'bg-surface text-ink-muted border-border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{c.authorLabel}</span>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={80}
            className="border border-border bg-surface rounded-lg px-3 py-2 text-sm"
            placeholder={c.authorPlaceholder}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{c.licenseLabel}</span>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value as LicenseKind)}
            className="border border-border bg-surface rounded-lg px-3 py-2 text-sm"
          >
            {LICENSE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {licenseLabels[kind]}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-ink-muted hover:bg-surface-2"
          >
            {c.cancel}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={selectedIds.size === 0 || name.trim().length === 0}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-rbs-accent text-white disabled:opacity-50"
          >
            {c.createBtn}
          </button>
        </div>

        <p className="text-[10px] text-ink-muted">{c.footerNote}</p>
        <p className="text-[10px] text-ink-muted text-right hidden sm:block">{c.escHint}</p>
      </div>
    </BottomSheet>
  );
}
