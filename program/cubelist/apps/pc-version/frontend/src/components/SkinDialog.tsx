/**
 * SkinDialog — 리스트 스킨 적용/해제 다이얼로그 (W2, 2026-06-10).
 *
 * 파일 선택 → "매칭 N/M" 미리보기 텍스트 + 매칭 목록 최대 10개 표시 → 적용/취소.
 * 이미 스킨 큐브가 있으면 "스킨 해제" 버튼도 표시.
 */

import { useEffect, useRef, useState } from 'react';
import type { CubeList } from '../types/cube';
import { parseSkinPack, matchSkinPack, type SkinMatch } from '../lib/skin-pack';
import { useTranslation } from '../lib/i18n/useTranslation';

export interface SkinDialogProps {
  readonly list: CubeList;
  readonly onApply: (matches: SkinMatch[]) => void;
  readonly onRemove: () => void;
  readonly onClose: () => void;
  /** 현재 리스트에 스킨 큐브가 1개 이상 있으면 true → "스킨 해제" 버튼 표시 */
  readonly hasSkin: boolean;
}

export function SkinDialog({ list, onApply, onRemove, onClose, hasSkin }: SkinDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<SkinMatch[] | null>(null);
  const [packName, setPackName] = useState('');
  const [totalCount] = useState(list.cubes.length);
  const [error, setError] = useState<string | null>(null);

  // Esc 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setMatches(null);
    try {
      const buf = await file.arrayBuffer();
      const pack = await parseSkinPack(buf, file.name);
      const result = matchSkinPack(list.cubes, pack);
      setPackName(pack.name);
      setMatches(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('skin.parse_error'));
    } finally {
      setLoading(false);
      // 동일 파일 재선택 허용 위해 value 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleApply(): void {
    if (!matches || matches.length === 0) return;
    onApply(matches);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="marketplace-modal skin-dialog" role="dialog" aria-labelledby="skin-dialog-title">
        <header className="modal-header">
          <h2 id="skin-dialog-title">{t('skin.title')}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label={t('playmode.close')}>
            ×
          </button>
        </header>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {t('skin.description')}
          </p>

          {/* 파일 선택 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cubeiconpack,.streamDeckIconPack,.zip"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? t('skin.loading') : t('skin.select_file')}
            </button>
          </div>

          {/* 오류 */}
          {error && (
            <div style={{ color: 'var(--text-danger, #e05)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* 매칭 결과 미리보기 */}
          {matches !== null && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {t('skin.match_preview')
                  .replace('{n}', String(matches.length))
                  .replace('{m}', String(totalCount))}
              </div>
              {matches.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {t('skin.no_match')}
                </div>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {matches.slice(0, 10).map((m) => {
                    const cube = list.cubes.find((c) => c.id === m.cubeId);
                    return (
                      <li
                        key={m.cubeId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <img
                          src={m.iconDataUrl}
                          alt=""
                          style={{
                            width: 24,
                            height: 24,
                            objectFit: 'contain',
                            background: 'var(--bg-tertiary, #1a1a1a)',
                            borderRadius: 4,
                          }}
                        />
                        <span>{cube?.label ?? m.cubeId}</span>
                      </li>
                    );
                  })}
                  {matches.length > 10 && (
                    <li style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {t('skin.more_matches').replace('{n}', String(matches.length - 10))}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <footer
          style={{
            padding: '12px 16px',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--border-subtle, #333)',
          }}
        >
          {hasSkin && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onRemove();
                onClose();
              }}
              style={{ marginRight: 'auto' }}
            >
              {t('skin.remove')}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onClose}>
            {t('skin.cancel')}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!matches || matches.length === 0}
            onClick={handleApply}
          >
            {t('skin.apply')}{packName ? ` — ${packName}` : ''}
          </button>
        </footer>
      </div>
    </div>
  );
}
