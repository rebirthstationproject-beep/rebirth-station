'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { importFromFile as importCubeFile, importFromText, type ImportResult } from '@/lib/cube-format/import';
import { dryRunImport, type DryRunPreview } from '@/lib/cube-format/dry-run';
import { kindFromExtension } from '@/lib/cube-format/spec';
import { useTranslation } from '@/lib/i18n/useTranslation';

const IMPORT_COPY = {
  ko: {
    title: '큐브 파일 가져오기',
    selectDrop: '파일을 여기에 놓거나',
    selectPick: '파일 선택',
    selectAcceptHint: '지원 확장자',
    selectOrPaste: '또는 JSON 직접 붙여넣기',
    selectFooter: '다음 단계에서 미리보기로 어떤 큐브가 추가될지 확인한 뒤 확정합니다.',
    previewBack: '다시 선택',
    previewConfirm: '확정하고 가져오기',
    previewSaving: '저장 중…',
    licenseConsentCommercial: '상업 라이선스 — 재배포·공유 시 제작자 표기 의무를 이해했습니다.',
    licenseConsentProprietary: '비공개 라이선스 — 외부 공유·재배포·업로드 금지를 이해했습니다.',
    doneSuccessTitle: '가져왔습니다',
    doneSuccessSubA: '새 리스트',
    doneSuccessSubB: '개 · 큐브',
    doneSuccessSubC: '개',
    doneFailTitle: '가져오지 못했습니다',
    doneClose: '닫기',
    doneOpenNew: '새 리스트로 이동 →',
    pasteSubmit: '미리보기',
    licenseLabel: '라이선스',
    unspecified: 'unspecified',
    redistAttribution: '재배포·공유 시 제작자 표기 권장',
    badExt: (n: string) => `지원하지 않는 확장자: ${n} (.cubeone / .cubelist / .cubepack 만 허용)`,
    fileReadFail: '파일을 읽지 못했습니다',
    escHint: 'Esc 로 닫기',
  },
  en: {
    title: 'Import cube file',
    selectDrop: 'Drop a file here or',
    selectPick: 'Choose file',
    selectAcceptHint: 'Accepted extensions',
    selectOrPaste: 'Or paste JSON directly',
    selectFooter: 'In the next step, preview what will be added before confirming.',
    previewBack: 'Pick again',
    previewConfirm: 'Confirm & import',
    previewSaving: 'Saving…',
    licenseConsentCommercial:
      'Commercial license — I will attribute the author when redistributing.',
    licenseConsentProprietary:
      'Proprietary license — I will not share, redistribute, or upload externally.',
    doneSuccessTitle: 'Imported',
    doneSuccessSubA: 'New lists:',
    doneSuccessSubB: ' · cubes:',
    doneSuccessSubC: '',
    doneFailTitle: 'Import failed',
    doneClose: 'Close',
    doneOpenNew: 'Open new list →',
    pasteSubmit: 'Preview',
    licenseLabel: 'License',
    unspecified: 'unspecified',
    redistAttribution: 'Attribution recommended when redistributing.',
    badExt: (n: string) => `Unsupported extension: ${n} (only .cubeone / .cubelist / .cubepack).`,
    fileReadFail: 'Could not read the file',
    escHint: 'Press Esc to close',
  },
  ja: {
    title: 'キューブ ファイル 取り込み',
    selectDrop: 'ファイルをここにドロップするか',
    selectPick: 'ファイル選択',
    selectAcceptHint: '対応拡張子',
    selectOrPaste: 'もしくは JSON を直接貼り付け',
    selectFooter: '次のステップで何が追加されるかをプレビューしてから確定します。',
    previewBack: '選び直す',
    previewConfirm: '確定して取り込み',
    previewSaving: '保存中…',
    licenseConsentCommercial: '商業ライセンス — 再配布·共有時に制作者表記の義務を理解しました。',
    licenseConsentProprietary: '非公開ライセンス — 外部共有·再配布·アップロードしないことを理解しました。',
    doneSuccessTitle: '取り込みました',
    doneSuccessSubA: '新規リスト',
    doneSuccessSubB: '個 · キューブ',
    doneSuccessSubC: '個',
    doneFailTitle: '取り込みに失敗しました',
    doneClose: '閉じる',
    doneOpenNew: '新しいリストへ →',
    pasteSubmit: 'プレビュー',
    licenseLabel: 'ライセンス',
    unspecified: '未指定',
    redistAttribution: '再配布·共有時は制作者表記を推奨します。',
    badExt: (n: string) =>
      `非対応の拡張子: ${n} (.cubeone / .cubelist / .cubepack のみ対応)。`,
    fileReadFail: 'ファイルを読み込めませんでした',
    escHint: 'Esc で閉じる',
  },
};

interface ImportSheetProps {
  open: boolean;
  onClose: () => void;
  onImported: (result: ImportResult) => void;
  /** 외부에서 raw 텍스트를 주입 — 시드 카탈로그 자동 진입 등 */
  initialText?: string | null;
}

type Step = 'select' | 'preview' | 'done';

/**
 * 큐브 파일 가져오기 시트 (2단계: 선택 → 미리보기 → 확정).
 *
 * 정착본: docs/file-format-spec.md
 * 지원 확장자: .cubeone / .cubelist / .cubepack
 *
 * 단계
 * 1. select — 드래그&드롭 또는 파일 선택
 * 2. preview — dry-run 결과 (보드/큐브 목록 + 경고)
 * 3. done — 실제 Supabase insert 결과
 */
export function ImportSheet({ open, onClose, onImported, initialText }: ImportSheetProps) {
  const { locale } = useTranslation();
  const t = IMPORT_COPY[locale] ?? IMPORT_COPY.ko;
  const [step, setStep] = useState<Step>('select');
  const [rawText, setRawText] = useState('');
  /** v3 ZIP 파일 선택 경로에서 File 객체를 보관 — confirm 시 importCubeFile로 전달 */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DryRunPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastInitialRef = useRef<string | null>(null);

  // initialText 변경 + open 시 자동 미리보기 진입 (한 번만)
  useEffect(() => {
    if (!open || !initialText) return;
    if (lastInitialRef.current === initialText) return;
    lastInitialRef.current = initialText;
    setRawText(initialText);
    setPendingFile(null);
    setPreview(dryRunImport(initialText));
    setStep('preview');
  }, [open, initialText]);

  function reset(): void {
    setStep('select');
    setRawText('');
    setPendingFile(null);
    setPreview(null);
    setResult(null);
    setBusy(false);
  }

  const handleFile = useCallback(
    async (file: File): Promise<void> => {
      if (busy) return;
      const kind = kindFromExtension(file.name);
      if (!kind) {
        setPreview({
          success: false,
          boardCount: 0,
          cubeCount: 0,
          boards: [],
          warnings: [],
          meta: {},
          reason: t.badExt(file.name),
        });
        setPendingFile(null);
        setStep('preview');
        return;
      }
      // dry-run은 텍스트 기반 — ZIP이면 텍스트 파싱이 실패해도 미리보기는 진행
      const text = await file.text();
      setPendingFile(file);
      setRawText(text);
      setPreview(dryRunImport(text));
      setStep('preview');
    },
    [busy, t],
  );

  function handlePaste(text: string): void {
    if (busy) return;
    setRawText(text);
    setPendingFile(null);
    setPreview(dryRunImport(text));
    setStep('preview');
  }

  async function handleConfirm(): Promise<void> {
    if (busy || !preview?.success) return;
    setBusy(true);
    // v3 ZIP 파일 선택 경로: importCubeFile (ZIP 파싱 포함)
    // paste·seed 경로: importFromText (텍스트 기반)
    const r = pendingFile
      ? await importCubeFile(pendingFile)
      : await importFromText(rawText);
    setBusy(false);
    setResult(r);
    setStep('done');
    if (r.success) {
      onImported(r);
      setTimeout(() => {
        reset();
        onClose();
      }, 2_000);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t.title}
    >
      {step === 'select' && (
        <SelectStep
          dragOver={dragOver}
          setDragOver={setDragOver}
          inputRef={inputRef}
          onFile={handleFile}
          onPaste={handlePaste}
          busy={busy}
          copy={t}
        />
      )}

      {step === 'preview' && preview && (
        <PreviewStep
          preview={preview}
          onBack={reset}
          onConfirm={handleConfirm}
          busy={busy}
          copy={t}
        />
      )}

      {step === 'done' && result && (
        <DoneStep result={result} onClose={onClose} copy={t} />
      )}
    </BottomSheet>
  );
}

type ImportCopy = typeof IMPORT_COPY.ko;

interface SelectStepProps {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  onPaste: (text: string) => void;
  busy: boolean;
  copy: ImportCopy;
}

function SelectStep({
  dragOver,
  setDragOver,
  inputRef,
  onFile,
  onPaste,
  busy,
  copy,
}: SelectStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
          dragOver
            ? 'border-rbs-accent bg-rbs-accent-soft/40'
            : 'border-border bg-surface-2'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void onFile(file);
        }}
      >
        <p className="text-sm text-ink-muted mb-3">{copy.selectDrop}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="px-4 py-2 rounded-lg border bg-surface border-border text-sm font-medium hover:border-rbs-accent disabled:opacity-50"
        >
          {copy.selectPick}
        </button>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept=".cubeone,.cubelist,.cubepack,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        <p className="text-xs text-ink-muted mt-3">
          {copy.selectAcceptHint}: <code className="font-mono">.cubeone</code> ·{' '}
          <code className="font-mono">.cubelist</code> ·{' '}
          <code className="font-mono">.cubepack</code>
        </p>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          {copy.selectOrPaste}
        </summary>
        <PasteArea onSubmit={onPaste} disabled={busy} label={copy.pasteSubmit} />
      </details>

      <p className="text-[10px] text-ink-muted">{copy.selectFooter}</p>
      <p className="text-[10px] text-ink-muted text-right hidden sm:block">{copy.escHint}</p>
    </div>
  );
}

interface PreviewStepProps {
  preview: DryRunPreview;
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
  copy: ImportCopy;
}

function PreviewStep({ preview, onBack, onConfirm, busy, copy }: PreviewStepProps) {
  const requiresConsent =
    preview.success &&
    (preview.meta.license === 'commercial' || preview.meta.license === 'proprietary');
  const [licenseAgreed, setLicenseAgreed] = useState(false);

  if (!preview.success) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200">
          <p className="font-medium text-sm">{copy.fileReadFail}</p>
          <p className="text-xs mt-1">{preview.reason}</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-sm border"
          >
            {copy.previewBack}
          </button>
        </div>
      </div>
    );
  }

  const licenseInfo = describeLicense(preview.meta.license);

  return (
    <div className="flex flex-col gap-3">
      <header className="text-sm">
        <p>
          <strong>{preview.kind}</strong> · 리스트 {preview.boardCount}개 · 큐브{' '}
          {preview.cubeCount}개
        </p>
        {preview.meta.author && (
          <p className="text-xs text-ink-muted mt-0.5">
            제작자: {preview.meta.author}
          </p>
        )}
      </header>

      <div
        className={`rounded-lg p-2.5 text-xs border ${
          licenseInfo.tone === 'warn'
            ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200 border-yellow-300'
            : 'bg-surface-2 text-ink border-border'
        }`}
      >
        <p className="font-medium">
          라이선스: {licenseInfo.label}{' '}
          <span className="font-mono text-ink-muted">({preview.meta.license ?? 'unspecified'})</span>
        </p>
        <p className="mt-0.5 text-ink-muted">{licenseInfo.description}</p>
        {preview.meta.author && (
          <p className="mt-1 text-[11px] text-ink-muted">
            재배포·공유 시 제작자 표기 권장: <strong className="font-medium">{preview.meta.author}</strong>
          </p>
        )}
      </div>

      {preview.warnings.map((w, i) => (
        <div
          key={i}
          className={`rounded-lg p-2 text-xs ${
            w.level === 'error'
              ? 'bg-red-50 text-red-900 border border-red-200'
              : w.level === 'warning'
                ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          {w.message}
        </div>
      ))}

      <div className="border border-border rounded-lg max-h-[40vh] overflow-y-auto">
        {preview.boards.map((b, idx) => (
          <details key={idx} className="border-b border-border last:border-b-0" open={idx === 0}>
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium hover:bg-surface-2">
              {b.name} <span className="text-xs text-ink-muted">({b.cubes.length} 큐브)</span>
            </summary>
            <ul className="px-3 pb-3 flex flex-col gap-1.5">
              {b.cubes.map((c, ci) => (
                <li key={ci} className="text-xs flex items-start gap-2">
                  <span className="font-mono text-ink-muted">{c.actionType}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.label}</p>
                    <p className="text-ink-muted truncate">{c.summary}</p>
                    {c.warnings.map((w, wi) => (
                      <p key={wi} className="text-yellow-700 text-[10px] mt-0.5">⚠ {w}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      {requiresConsent && (
        <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
          <input
            type="checkbox"
            checked={licenseAgreed}
            onChange={(e) => setLicenseAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-yellow-900 dark:text-yellow-200">
            {preview.meta.license === 'commercial'
              ? copy.licenseConsentCommercial
              : copy.licenseConsentProprietary}
          </span>
        </label>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="px-3 py-2 rounded-lg text-sm border disabled:opacity-50"
        >
          {copy.previewBack}
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || (requiresConsent && !licenseAgreed)}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-rbs-accent text-white disabled:opacity-60"
        >
          {busy ? copy.previewSaving : copy.previewConfirm}
        </button>
      </div>
    </div>
  );
}

interface DoneStepProps {
  result: ImportResult;
  onClose: () => void;
  copy: ImportCopy;
}

function DoneStep({ result, onClose, copy }: DoneStepProps) {
  const firstBoardId = result.boardIds?.[0];
  return (
    <div className="flex flex-col gap-3">
      <div
        role={result.success ? 'status' : 'alert'}
        aria-live="polite"
        className={`rounded-lg p-3 text-sm ${
          result.success
            ? 'bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200 border border-green-200'
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}
      >
        {result.success ? (
          <>
            <p className="font-medium">{copy.doneSuccessTitle}</p>
            <p className="text-xs mt-1">
              {copy.doneSuccessSubA} {result.insertedBoards}
              {copy.doneSuccessSubB} {result.insertedItems}
              {copy.doneSuccessSubC}
            </p>
            {result.reason && <p className="text-xs mt-1 opacity-80">{result.reason}</p>}
          </>
        ) : (
          <>
            <p className="font-medium">{copy.doneFailTitle}</p>
            <p className="text-xs mt-1">{result.reason}</p>
          </>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        {result.success && firstBoardId && (
          <a
            href={`/list?board=${encodeURIComponent(firstBoardId)}`}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-rbs-accent text-white"
          >
            {copy.doneOpenNew}
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm border"
        >
          {copy.doneClose}
        </button>
      </div>
    </div>
  );
}

interface PasteAreaProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  label: string;
}

interface LicenseInfo {
  label: string;
  description: string;
  tone: 'info' | 'warn';
}

function describeLicense(license: string | null | undefined): LicenseInfo {
  switch (license) {
    case 'free':
      return {
        label: '무료',
        description: '누구나 자유롭게 사용·재배포할 수 있습니다.',
        tone: 'info',
      };
    case 'personal':
      return {
        label: '개인',
        description: '본인 사용 한정. 타인에게 재배포·판매하지 않습니다.',
        tone: 'info',
      };
    case 'commercial':
      return {
        label: '상업',
        description:
          '상업적 사용 가능. 재배포 시 출처(author) 표시 의무. Stage 2 마켓플레이스 진입 시 등록 가능.',
        tone: 'warn',
      };
    case 'proprietary':
      return {
        label: '비공개',
        description:
          '자사 콜라보 등 비공개 자료. 외부로 공유·재배포·업로드 금지.',
        tone: 'warn',
      };
    default:
      return {
        label: '미지정',
        description: '라이선스가 명시되지 않았습니다. 본인 사용으로 간주하세요.',
        tone: 'info',
      };
  }
}

function PasteArea({ onSubmit, disabled, label }: PasteAreaProps) {
  const [text, setText] = useState('');
  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{ "rbs_format_version": 1, "kind": "cubelist", ... }'
        className="w-full h-32 border rounded-md p-2 text-xs font-mono border-border bg-surface-2"
      />
      <button
        type="button"
        onClick={() => onSubmit(text)}
        disabled={disabled || text.trim().length === 0}
        className="self-end px-3 py-1.5 rounded-md bg-rbs-accent text-white text-xs font-medium disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
