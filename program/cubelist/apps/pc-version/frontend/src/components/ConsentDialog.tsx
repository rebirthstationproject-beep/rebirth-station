/**
 * Tier 2/3 권한 동의 다이얼로그 (v0.1.4 사전, 2026-05-31).
 *
 * tauri-bridge.ts 의 requireConsent 가 window.confirm 대신 본 컴포넌트 사용.
 * 옵션: 이번만 허용 / 영구 허용 / 거부.
 * 영구 허용 시 localStorage 영속 (cubelist:tier_consents).
 */

import { useEffect } from 'react';
import { useTranslation } from '../lib/i18n/useTranslation';

interface ConsentDialogProps {
  readonly actionType: string;
  readonly tier: 2 | 3;
  readonly onAllowOnce: () => void;
  readonly onAllowAlways: () => void;
  readonly onDeny: () => void;
}

export function ConsentDialog({
  actionType,
  tier,
  onAllowOnce,
  onAllowAlways,
  onDeny,
}: ConsentDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onDeny();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onDeny]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDeny();
      }}
    >
      <div className={`consent-dialog tier-${tier}`} role="alertdialog" aria-labelledby="consent-title">
        <header className="consent-header">
          <span className={`consent-tier-badge tier-${tier}`}>Tier {tier}</span>
          <h2 id="consent-title">{t('consent.title')}</h2>
        </header>
        <div className="consent-body">
          <p>{tier === 3 ? t('consent.tier3') : t('consent.tier2')}</p>
          <div className="consent-action-info">
            <span className="consent-label">{t('consent.action')}:</span>
            <code className="consent-action-name">{actionType}</code>
          </div>
        </div>
        <footer className="consent-footer">
          <button type="button" className="btn-ghost" onClick={onDeny}>
            {t('consent.deny')}
          </button>
          <button type="button" className="btn-ghost" onClick={onAllowOnce}>
            {t('consent.once')}
          </button>
          <button type="button" className="btn-primary" onClick={onAllowAlways}>
            {t('consent.always')}
          </button>
        </footer>
      </div>
    </div>
  );
}

// === tauri-bridge.ts 가 사용하는 promise 기반 prompt ===

let promptOpen = false;

/**
 * 단일 동의 dialog 표시 → Promise<'allow_once' | 'allow_always' | 'deny'>.
 * 이미 열려있으면 'deny' 즉시 반환 (중복 prompt 방지).
 */
export function showConsentDialog(actionType: string, tier: 2 | 3): Promise<'allow_once' | 'allow_always' | 'deny'> {
  if (promptOpen) return Promise.resolve('deny');
  return new Promise((resolve) => {
    promptOpen = true;
    const container = document.createElement('div');
    container.className = 'consent-dialog-root';
    document.body.appendChild(container);

    // dynamic React render
    void import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(container);
      const close = (result: 'allow_once' | 'allow_always' | 'deny') => {
        root.unmount();
        promptOpen = false;
        if (container.parentNode) container.parentNode.removeChild(container);
        resolve(result);
      };
      root.render(
        <ConsentDialog
          actionType={actionType}
          tier={tier}
          onAllowOnce={() => close('allow_once')}
          onAllowAlways={() => close('allow_always')}
          onDeny={() => close('deny')}
        />,
      );
    });
  });
}
