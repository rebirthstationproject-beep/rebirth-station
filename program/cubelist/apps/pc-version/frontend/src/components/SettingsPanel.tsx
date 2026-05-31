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
  const _t = useTranslation();
  void _t; // i18n 키 추가 시 활성 — 현재는 한글 본문 직접 사용
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
    if (!window.confirm('모든 영구 동의를 초기화할까요?')) return;
    clearAllTierConsents();
    setConsents([]);
  }

  function changeLibDir(): void {
    const next = window.prompt(
      '라이브러리 폴더 경로 입력 (예: C:\\Users\\PC\\Downloads\\플러그인\\CUBE):',
      libDir,
    );
    if (next === null) return;
    const trimmed = next.trim();
    if (trimmed.length === 0) {
      window.localStorage.removeItem(LIBRARY_DIR_KEY);
      setLibDir('');
    } else {
      window.localStorage.setItem(LIBRARY_DIR_KEY, trimmed);
      setLibDir(trimmed);
    }
    window.alert('라이브러리 폴더가 변경됩니다. 다음 부팅 시 자동 로드됩니다.');
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
          <h2 id="settings-title">⚙ 설정</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <div className="modal-body">
          {/* 언어 */}
          <section className="settings-section">
            <h3 className="settings-section-title">언어 / Language / 言語</h3>
            <LocaleSwitcher />
          </section>

          {/* 라이브러리 폴더 */}
          <section className="settings-section">
            <h3 className="settings-section-title">📁 라이브러리 폴더</h3>
            <div className="settings-current-value">
              {libDir.length > 0 ? <code>{libDir}</code> : <span className="muted">미등록</span>}
            </div>
            <button type="button" className="btn-ghost" onClick={changeLibDir}>
              경로 변경
            </button>
          </section>

          {/* 영구 동의 */}
          <section className="settings-section">
            <h3 className="settings-section-title">🔒 영구 동의 ({consents.length})</h3>
            {consents.length === 0 ? (
              <div className="muted small">영구 허용한 액션이 없습니다.</div>
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
                        aria-label={`${entry.actionType} 동의 제거`}
                        title="이 동의 제거"
                      >
                        제거
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-ghost settings-danger-btn"
                  onClick={clearAll}
                >
                  🗑 모두 초기화
                </button>
              </>
            )}
            <div className="settings-hint">
              영구 동의한 액션은 다음 실행 시 prompt 없이 즉시 실행됩니다.
              여기서 제거하면 다음 실행 시 다시 prompt 됩니다.
            </div>
          </section>

          {/* 동기화 정보 */}
          <section className="settings-section">
            <h3 className="settings-section-title">🔄 동기화 (v0.1.4 사전)</h3>
            <div className="settings-current-value">
              <span className="muted small">
                LiveSyncBridge 활성 — 동적 큐브/상태/선택 변경이 외부 구독자에게 전파됩니다.
                <br />
                모바일 PWA 연결은 v0.1.4 진입 시 활성화됩니다.
              </span>
            </div>
          </section>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            완료
          </button>
        </footer>
      </div>
    </div>
  );
}
