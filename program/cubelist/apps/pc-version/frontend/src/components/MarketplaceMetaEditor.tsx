/**
 * 마켓플레이스 메타 편집 모달 (v0.1.3 사전, 2026-05-31).
 *
 * 현재 큐브팩 (useEditor.pack) 의 extensions.marketplace 편집.
 * 게시는 v0.1.3 진입 시 서버 API 호출.
 */

import { useEffect, useState } from 'react';
import { useEditor } from '../store/editor';
import {
  PLATFORMS,
  emptyMarketplaceMeta,
  formatPrice,
  validateMarketplaceMeta,
  type MarketplaceMeta,
  type Platform,
  type PaymentType,
} from '../types/marketplace';

interface MarketplaceMetaEditorProps {
  readonly onClose: () => void;
}

export function MarketplaceMetaEditor({ onClose }: MarketplaceMetaEditorProps) {
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);

  // 초기 메타 (저장된 값 또는 빈 값)
  const initialMeta = (pack?.extensions as { marketplace?: MarketplaceMeta } | undefined)
    ?.marketplace ?? emptyMarketplaceMeta();

  const [meta, setMeta] = useState<MarketplaceMeta>(initialMeta);
  const [tagsInput, setTagsInput] = useState((meta.tags ?? []).join(', '));
  const [autoCaptureBusy, setAutoCaptureBusy] = useState(false);
  const errors = validateMarketplaceMeta(meta);

  // Esc 키 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Phase 4 (2026-06-01): 첫 열림 시 cover 없고 lists 있으면 silent 자동 캡처
  // (handleExport 와 동일 정책 — confirm prompt 제거, 사용자가 ✕ 제거 버튼으로 명시 거부 가능)
  useEffect(() => {
    if (meta.cover_url) return;
    if (!pack || pack.lists.length === 0) return;
    if (autoCaptureBusy) return;
    setAutoCaptureBusy(true);
    void import('../lib/pack-thumbnail').then(async ({ captureCubeListThumbnail }) => {
      try {
        const dataUrl = await captureCubeListThumbnail(pack.lists[0], {
          packName: pack.name,
          subtitle: meta.author.name || undefined,
        });
        if (dataUrl) {
          setMeta((prev) => ({ ...prev, cover_url: dataUrl }));
        }
      } catch {
        // silent — 캡처 실패는 사용자가 수동 캡처 버튼으로 재시도
      } finally {
        setAutoCaptureBusy(false);
      }
    });
    // 한 번만 — meta.cover_url / pack.id 변경 시 재실행 X
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save(): void {
    if (!pack) return;
    if (errors.length > 0) {
      window.alert(`검증 오류:\n\n${errors.map((e) => `· ${e}`).join('\n')}`);
      return;
    }
    const finalMeta: MarketplaceMeta = {
      ...meta,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    loadPack({
      ...pack,
      extensions: {
        ...(pack.extensions ?? {}),
        marketplace: finalMeta as unknown as Record<string, unknown>,
      },
    });
    onClose();
  }

  function patch(p: Partial<MarketplaceMeta>): void {
    setMeta((prev) => ({ ...prev, ...p }));
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="marketplace-modal"
        role="dialog"
        aria-labelledby="mp-modal-title"
      >
        <header className="modal-header">
          <h2 id="mp-modal-title">🏪 마켓플레이스 메타</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          {!pack ? (
            <div className="muted">큐브팩이 로드되지 않았습니다.</div>
          ) : (
            <>
              <div className="mp-field">
                <label htmlFor="mp-author-name">작성자 이름 *</label>
                <input
                  id="mp-author-name"
                  type="text"
                  value={meta.author.name}
                  placeholder="홍길동 또는 ProjectX"
                  onChange={(e) =>
                    patch({ author: { ...meta.author, name: e.target.value } })
                  }
                />
              </div>

              <div className="mp-field">
                <label htmlFor="mp-author-email">작성자 이메일</label>
                <input
                  id="mp-author-email"
                  type="email"
                  value={meta.author.email ?? ''}
                  placeholder="hello@example.com"
                  onChange={(e) =>
                    patch({ author: { ...meta.author, email: e.target.value } })
                  }
                />
              </div>

              <div className="mp-field">
                <label htmlFor="mp-platform">플랫폼</label>
                <select
                  id="mp-platform"
                  value={meta.platform}
                  onChange={(e) => patch({ platform: e.target.value as Platform })}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mp-field mp-field-row">
                <div className="mp-field-half">
                  <label htmlFor="mp-price">가격 (USD)</label>
                  <input
                    id="mp-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={(meta.price_cents / 100).toFixed(2)}
                    onChange={(e) => {
                      const dollars = parseFloat(e.target.value) || 0;
                      patch({ price_cents: Math.round(dollars * 100) });
                    }}
                  />
                  <div className="mp-field-hint">{formatPrice(meta.price_cents)}</div>
                </div>
                <div className="mp-field-half">
                  <label htmlFor="mp-payment-type">결제 방식</label>
                  <select
                    id="mp-payment-type"
                    value={meta.payment_type ?? 'one_time'}
                    onChange={(e) => patch({ payment_type: e.target.value as PaymentType })}
                  >
                    <option value="one_time">1회 구매</option>
                    <option value="subscription_monthly">월간 구독</option>
                    <option value="subscription_yearly">연간 구독</option>
                  </select>
                </div>
              </div>

              <div className="mp-field">
                <label htmlFor="mp-version">버전 (semver)</label>
                <input
                  id="mp-version"
                  type="text"
                  value={meta.version ?? ''}
                  placeholder="0.1.0"
                  onChange={(e) => patch({ version: e.target.value })}
                />
              </div>

              <div className="mp-field">
                <label htmlFor="mp-tags">태그 (쉼표 구분, 최대 20개)</label>
                <input
                  id="mp-tags"
                  type="text"
                  value={tagsInput}
                  placeholder="streaming, productivity, design"
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="mp-field">
                <label htmlFor="mp-description">긴 설명 (Markdown, 최대 10,000자)</label>
                <textarea
                  id="mp-description"
                  rows={6}
                  value={meta.long_description ?? ''}
                  placeholder="이 큐브팩의 주요 기능과 활용법을 작성하세요..."
                  onChange={(e) => patch({ long_description: e.target.value })}
                />
                <div className="mp-field-hint">
                  {(meta.long_description ?? '').length} / 10,000
                </div>
              </div>

              <div className="mp-field">
                <label htmlFor="mp-changelog">변경 이력 (Markdown)</label>
                <textarea
                  id="mp-changelog"
                  rows={3}
                  value={meta.changelog ?? ''}
                  placeholder="## v0.1.0\n- 첫 출시"
                  onChange={(e) => patch({ changelog: e.target.value })}
                />
              </div>

              <div className="mp-field">
                <label htmlFor="mp-demo-video">데모 영상 URL (YouTube/Vimeo)</label>
                <input
                  id="mp-demo-video"
                  type="url"
                  value={meta.demo_video_url ?? ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) => patch({ demo_video_url: e.target.value })}
                />
              </div>

              <div className="mp-field">
                <label>커버 이미지 (자동 캡처)</label>
                {meta.cover_url ? (
                  <div className="mp-cover-preview">
                    <img src={meta.cover_url} alt="커버 미리보기" />
                  </div>
                ) : null}
                <div className="mp-cover-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={async () => {
                      if (!pack || pack.lists.length === 0) {
                        window.alert('큐브 리스트가 없습니다.');
                        return;
                      }
                      const { captureCubeListThumbnail } = await import('../lib/pack-thumbnail');
                      const dataUrl = await captureCubeListThumbnail(pack.lists[0], {
                        packName: pack.name,
                        subtitle: meta.author.name || undefined,
                      });
                      if (dataUrl) {
                        patch({ cover_url: dataUrl });
                      } else {
                        window.alert('캡처 실패 — 큐브 리스트가 비어있거나 브라우저 미지원');
                      }
                    }}
                    disabled={!pack || pack.lists.length === 0}
                  >
                    📷 첫 리스트 자동 캡처
                  </button>
                  {meta.cover_url && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => patch({ cover_url: undefined })}
                    >
                      ✕ 제거
                    </button>
                  )}
                </div>
                <div className="mp-field-hint">
                  큐브 리스트의 첫 16개 큐브 (4×4) 를 1280×720 PNG 로 캡처합니다.
                </div>
              </div>

              {errors.length > 0 && (
                <ul className="payload-errors" aria-live="polite">
                  {errors.map((e, i) => (
                    <li key={i}>⚠ {e}</li>
                  ))}
                </ul>
              )}

              <div className="mp-publish-info">
                <strong>📋 게시 정보</strong>
                <p>
                  v0.1.3 진입 시 서버 API 가 활성화됩니다. 현재는 로컬 저장만 가능 (CubePack.extensions.marketplace).
                </p>
              </div>
            </>
          )}
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={!pack || errors.length > 0}
          >
            저장
          </button>
        </footer>
      </div>
    </div>
  );
}
