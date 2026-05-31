/**
 * 설정 패널 (v0.1.3+, 2026-05-31).
 *
 * TopBar ⚙ 클릭 → 본 모달.
 * - 영구 동의 목록 + 일괄 초기화 / 개별 제거
 * - 라이브러리 폴더 변경
 * - 언어 (LocaleSwitcher 임베드)
 */

import { useEffect, useState } from 'react';
import { useTranslation } from '../lib/i18n/useTranslation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { clearAllTierConsents } from '../lib/tauri-bridge';

const CONSENT_STORAGE_KEY = 'cubelist:tier_consents';
const LIBRARY_DIR_KEY = 'cubelist:library_dir';

// Phase 8 (2026-06-01): 단축키 viewer — 편집은 v0.1.4
interface ShortcutEntry {
  readonly action: string;
  readonly keys: string;
  readonly labelKey: string;
}

const DEFAULT_SHORTCUTS: readonly ShortcutEntry[] = [
  { action: 'global_search', keys: 'Ctrl+F / Cmd+F', labelKey: 'shortcuts.global_search' },
  { action: 'export_pack', keys: 'Ctrl+E / Cmd+E', labelKey: 'shortcuts.export_pack' },
  { action: 'close_modal', keys: 'Esc', labelKey: 'shortcuts.close_modal' },
  { action: 'arrow_nav', keys: '← ↑ ↓ →', labelKey: 'shortcuts.arrow_nav' },
  { action: 'delete_cube', keys: 'Delete / Backspace', labelKey: 'shortcuts.delete_cube' },
  { action: 'context_menu', keys: 'ContextMenu / Shift+F10', labelKey: 'shortcuts.context_menu' },
] as const;

interface SettingsPanelProps {
  readonly onClose: () => void;
}

interface ConsentEntry {
  readonly actionType: string;
  readonly granted: boolean;
}

function loadConsents(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveConsents(consents: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consents));
  } catch {
    /* ignore */
  }
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const [consents, setConsents] = useState<ConsentEntry[]>([]);
  const [libDir, setLibDir] = useState<string>(
    () => window.localStorage.getItem(LIBRARY_DIR_KEY) ?? '',
  );

  useEffect(() => {
    const map = loadConsents();
    setConsents(
      Object.entries(map).map(([actionType, granted]) => ({
        actionType,
        granted: granted === true,
      })),
    );
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function removeConsent(actionType: string): void {
    const map = loadConsents();
    delete map[actionType];
    saveConsents(map);
    setConsents((prev) => prev.filter((e) => e.actionType !== actionType));
  }

  function clearAll(): void {
    if (!window.confirm(t('settings.consents_clear_confirm'))) return;
    clearAllTierConsents();
    setConsents([]);
  }

  function changeLibDir(): void {
    const next = window.prompt(t('settings.library_prompt'), libDir);
    if (next === null) return;
    const trimmed = next.trim();
    if (trimmed.length === 0) {
      window.localStorage.removeItem(LIBRARY_DIR_KEY);
      setLibDir('');
    } else {
      window.localStorage.setItem(LIBRARY_DIR_KEY, trimmed);
      setLibDir(trimmed);
    }
    window.alert(t('settings.library_changed'));
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-panel" role="dialog" aria-labelledby="settings-title">
        <header className="modal-header">
          <h2 id="settings-title">{t('settings.title')}</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="×">
            ×
          </button>
        </header>

        <div className="modal-body">
          {/* 언어 */}
          <section className="settings-section">
            <h3 className="settings-section-title">{t('settings.section_lang')}</h3>
            <LocaleSwitcher />
          </section>

          {/* 라이브러리 폴더 */}
          <section className="settings-section">
            <h3 className="settings-section-title">{t('settings.section_library')}</h3>
            <div className="settings-current-value">
              {libDir.length > 0 ? <code>{libDir}</code> : <span className="muted">{t('settings.library_unset')}</span>}
            </div>
            <button type="button" className="btn-ghost" onClick={changeLibDir}>
              {t('settings.library_change')}
            </button>
          </section>

          {/* 영구 동의 */}
          <section className="settings-section">
            <h3 className="settings-section-title">{t('settings.section_consents')} ({consents.length})</h3>
            {consents.length === 0 ? (
              <div className="muted small">{t('settings.consents_empty')}</div>
            ) : (
              <>
                <ul className="consents-list">
                  {consents.map((entry) => (
                    <li key={entry.actionType} className="consents-item">
                      <code>{entry.actionType}</code>
                      <button
                        type="button"
                        className="consents-remove"
                        onClick={() => removeConsent(entry.actionType)}
                        aria-label={`${entry.actionType} ${t('settings.consents_remove')}`}
                        title={t('settings.consents_remove_one')}
                      >
                        {t('settings.consents_remove')}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-ghost settings-danger-btn"
                  onClick={clearAll}
                >
                  {t('settings.consents_clear_all')}
                </button>
              </>
            )}
            <div className="settings-hint">{t('settings.consents_hint')}</div>
          </section>

          {/* 동기화 정보 */}
          <section className="settings-section">
            <h3 className="settings-section-title">{t('settings.section_sync')}</h3>
            <div className="settings-current-value">
              <span className="muted small">{t('settings.sync_info')}</span>
            </div>
          </section>

          {/* Phase 8 (2026-06-01): 단축키 viewer (편집은 v0.1.4) */}
          <section className="settings-section">
            <h3 className="settings-section-title">{t('settings.section_shortcuts')}</h3>
            <ul className="shortcuts-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {DEFAULT_SHORTCUTS.map((s) => (
                <li
                  key={s.action}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: 12,
                  }}
                >
                  <span>{t(s.labelKey as Parameters<typeof t>[0])}</span>
                  <kbd style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.8 }}>
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
            <div className="settings-hint" style={{ marginTop: 8 }}>
              {t('settings.shortcuts_edit_planned')}
            </div>
          </section>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            {t('settings.done')}
          </button>
        </footer>
      </div>
    </div>
  );
}
