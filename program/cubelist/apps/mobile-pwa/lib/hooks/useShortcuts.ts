'use client';

import { useEffect } from 'react';

export interface ShortcutBinding {
  /** 단축키 — 소문자, 한국어 X. 예: 'e', 'm', '?', '1' */
  key: string;
  /** Ctrl(또는 Mac Cmd) 필요 여부 */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** 화면에 표시할 라벨 */
  label: string;
  /**
   * 키 입력 시 호출되는 핸들러. async도 허용 — rejection은 console.warn으로 흘림.
   * void 반환을 명시하려면 명시적으로 `(): void`로 작성.
   */
  handler: () => void | Promise<void>;
  /**
   * 동일 key+modifier 조합이 여러 곳에서 등록된 경우 우선순위.
   * 숫자가 클수록 우선. 미지정 시 0. 동률이면 등록 순서 유지.
   *
   * 권장 값 (Stage 1 채택):
   * | 범위 | 용도 | 예시 |
   * |---|---|---|
   * | 0 | 페이지 레벨 기본 단축키 | e, m, /, escape (list 페이지) |
   * | 10~20 | 페이지 보조 (덜 자주 사용) | ArrowLeft/Right (보드 네비) |
   * | 30 | 도움말·메타 동작 | ?, Shift+? |
   * | 50~80 | 시트·모달 안 단축키 | r (녹화), Cmd+S (저장) |
   * | 100+ | 위급·강제 동작 | Esc 강제 종료 |
   *
   * 영구 동기화 룰 (ND): 본 표는 `docs/kbd-style-guide.md`의 priority 권장값과
   * 항상 일치해야 합니다. 한쪽만 변경하지 마세요.
   */
  priority?: number;
}

export interface ShortcutOptions {
  /** true 면 단축키 무시 (모달/시트 열림 시 부모가 게이트) */
  disabled?: boolean;
  /**
   * true 면 dialog 자동 게이트 우회 — 시트 안에서도 단축키 등록 가능.
   *
   * 기본은 false (안전): `[role=dialog][aria-modal=true]` DOM 존재 시 단축키 비활성.
   * 시트 자체에 글로벌 단축키를 등록하려면 true. 부모와 충돌하는 키는 priority로 정렬.
   */
  allowInDialog?: boolean;
}

/**
 * 게이트 우선순위 (PK — 영구 명시):
 *
 * 단축키 발화 전 다음 순서로 게이트 검사. 하나라도 차단되면 비활성:
 *
 * 1. **`disabled: true`** — useEffect 자체가 등록 X (가장 강력, 컴포넌트 레벨 토글)
 * 2. **input/textarea/select/contentEditable 포커스** — IME composition + 텍스트 편집 보호
 * 3. **`[role=dialog][aria-modal=true]` DOM 존재** — `allowInDialog: false` 시만 게이트
 *
 * 즉 `disabled` ⊃ DOM 포커스 게이트 ⊃ dialog 게이트.
 * `disabled: true` + `allowInDialog: true` 조합은 disabled가 우선이라 단축키 비활성.
 *
 * 일반 패턴:
 * - 시트 열림 동안 부모 단축키 끄려면 `disabled: !sheetOpen ? false : true`
 * - 시트 안 단축키는 `allowInDialog: true, disabled: !sheetOpen`
 */

/**
 * 전역 키보드 단축키 훅.
 *
 * 정착본 §3: 데스크탑 효율 + 모바일 영향 없음.
 * input/textarea/contentEditable 포커스 시 자동 비활성.
 * `disabled` 옵션으로 모달·시트 열린 동안 일시 정지 가능.
 * 또한 `[role="dialog"][aria-modal="true"]` 가 DOM에 있으면 자동 게이트.
 *
 * 관련 문서:
 * - `docs/kbd-style-guide.md` — 단축키 시각화 `<kbd>` 스타일 가이드 (KL)
 * - `docs/night-auto-log.md` — Phase IT/KP/LP — priority·allowInDialog·다중 호출 패턴 변경 이력
 *
 * @example priority 충돌 처리
 * ```tsx
 * // 페이지 레벨 — 도움말 토글 (낮은 priority)
 * useShortcuts([{ key: '?', shift: true, label: '도움말', handler: openHelp, priority: 0 }]);
 *
 * // 시트 안 — 같은 ? 키를 닫기에 매핑 (높은 priority)
 * useShortcuts([{ key: '?', shift: true, label: '시트 닫기', handler: close, priority: 100 }]);
 *
 * // 두 훅이 동시 마운트되어도 priority 100이 우선 발화.
 * // 동률이면 useShortcuts 호출 순서가 stable order (먼저 mount된 쪽 우선).
 * ```
 *
 * @example allowInDialog — 시트 안에서 단축키 등록
 * ```tsx
 * // 시트 안에서도 동작해야 하는 단축키 (예: 매크로 시트에서 R 키)
 * useShortcuts(
 *   [{ key: 'r', label: '녹화 시작', handler: startRecord, priority: 50 }],
 *   { allowInDialog: true },
 * );
 *
 * // 기본 (allowInDialog: false): dialog 자동 게이트로 시트 내에서 단축키 비활성.
 * // priority 활용해 부모 단축키와의 충돌 해결.
 * ```
 *
 * @example sync handler throw — try-catch로 keydown 리스너 보호 (SJ — SH 후속)
 * ```tsx
 * useShortcuts([
 *   {
 *     key: 'd',
 *     label: '삭제',
 *     handler: () => {
 *       // sync handler가 throw해도 React 18 이벤트 핸들러는 boundary가 잡지 X.
 *       // useShortcuts 내부 try-catch가 console.warn으로 처리하여 다음 단축키도 정상 동작.
 *       if (!selectedId) throw new Error('no selection');
 *       deleteItem(selectedId);
 *     },
 *   },
 * ]);
 *
 * // 권장 패턴: throw 대신 일찍 return으로 무동작. UI 안내가 필요하면 Toast 명시 호출.
 * useShortcuts([
 *   { key: 'd', label: '삭제', handler: () => {
 *     if (!selectedId) { showToast({ level: 'warning', message: '선택 없음' }); return; }
 *     deleteItem(selectedId);
 *   }},
 * ]);
 * ```
 *
 * @example async handler — rejection은 console.warn으로 흘림 (RX)
 * ```tsx
 * useShortcuts([
 *   {
 *     key: 's',
 *     mod: true,
 *     label: '저장',
 *     handler: async () => {
 *       // 비동기 저장. 실패 시 throw — Toast로 사용자 안내는 호출자 책임
 *       const res = await fetch('/api/save', { method: 'POST' });
 *       if (!res.ok) {
 *         showToast({ level: 'error', message: '저장 실패' });
 *         throw new Error(`save ${res.status}`);
 *       }
 *       showToast({ level: 'success', message: '저장됨' });
 *     },
 *   },
 * ]);
 *
 * // 핸들러 내부에서 reject(throw)되면 useShortcuts가 `.catch(console.warn)` 처리.
 * // 사용자 UI 안내(Toast)는 핸들러 안에서 명시적으로 호출 — 단축키 훅은 알지 못함.
 * ```
 *
 * @example 다중 호출 패턴 — 같은 컴포넌트에서 여러 useShortcuts
 * ```tsx
 * function ListPage() {
 *   // 페이지 레벨 (낮은 priority)
 *   useShortcuts([
 *     { key: 'e', label: '편집', handler: toggleEdit },
 *     { key: 'm', label: '거치', handler: toggleMount },
 *   ]);
 *
 *   // 검색 모달이 열려 있을 때만 활성 (조건부 등록)
 *   useShortcuts(
 *     [{ key: '/', label: '검색', handler: openSearch, priority: 10 }],
 *     { disabled: !searchEnabled },
 *   );
 *
 *   // 시트 안 단축키 (allowInDialog)
 *   useShortcuts(
 *     [{ key: 'r', label: '녹화', handler: record, priority: 100 }],
 *     { allowInDialog: true, disabled: !sheetOpen },
 *   );
 * }
 *
 * // 각 useShortcuts 호출이 독립 이벤트 리스너로 등록되며,
 * // dispatch 시 priority 정렬은 호출 간에는 적용 안 됨 (개별 호출 내부 정렬만).
 * // 호출 간 충돌은 disabled 옵션으로 조건부 해결.
 * ```
 */
export function useShortcuts(bindings: ShortcutBinding[], options?: ShortcutOptions): void {
  const disabled = Boolean(options?.disabled);
  const allowInDialog = Boolean(options?.allowInDialog);
  useEffect(() => {
    if (disabled) return;
    function onKey(e: KeyboardEvent): void {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (target.isContentEditable) return;
      }

      // 모달 dialog가 열려 있으면 전역 단축키 무시 (검색 모달 등) — allowInDialog로 우회 가능
      if (!allowInDialog && typeof document !== 'undefined') {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (dialog) return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // priority 정렬 — 높은 우선순위 먼저 매칭, 동률이면 등록 순서 (stable sort)
      const matched = bindings
        .map((b, idx) => ({ b, idx }))
        .filter(({ b }) => {
          if (b.key !== key) return false;
          if (Boolean(b.mod) !== isMod) return false;
          if (Boolean(b.shift) !== e.shiftKey) return false;
          if (Boolean(b.alt) !== e.altKey) return false;
          return true;
        })
        .sort((a, b) => {
          const pa = a.b.priority ?? 0;
          const pb = b.b.priority ?? 0;
          if (pa !== pb) return pb - pa;
          return a.idx - b.idx;
        });

      if (matched.length > 0) {
        // PR (영구): 매칭된 단축키만 preventDefault. 미매칭 시 브라우저 기본 동작 보존.
        // → Ctrl+S 등 브라우저 기본 단축키를 useShortcuts에 등록하면 브라우저 동작 차단됨 (의도).
        // → 미등록 시 브라우저 기본(저장/새로고침 등)은 그대로 발화.
        e.preventDefault();
        // SH (영구): sync handler가 throw해도 keydown 리스너가 끊기지 않도록 try-catch.
        // React 18 이벤트 핸들러 throw는 boundary가 잡지 않으므로 명시적 console.warn.
        try {
          const result = matched[0].b.handler();
          // Promise 반환 시 rejection을 콘솔로 — UI 단축키는 throw하면 안 됨
          if (result && typeof (result as Promise<void>).catch === 'function') {
            (result as Promise<void>).catch((err) =>
              console.warn('[cubelist] shortcut handler rejected', err),
            );
          }
        } catch (err) {
          console.warn('[cubelist] shortcut handler threw', err);
        }
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bindings, disabled, allowInDialog]);
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  // navigator.platform은 deprecated이나 fallback으로 유지. userAgentData가 있으면 우선
  type NavWithUAD = Navigator & { userAgentData?: { platform?: string } };
  const uad = (navigator as NavWithUAD).userAgentData?.platform;
  if (uad) return /mac/i.test(uad);
  return /Mac/i.test(navigator.platform) || /Mac OS X/i.test(navigator.userAgent);
}

const KEY_DISPLAY: Record<string, string> = {
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  arrowdown: '↓',
  escape: 'Esc',
  enter: '⏎',
  ' ': 'Space',
  space: 'Space',
  tab: 'Tab',
};

/** 단축키 라벨 포맷 — Mac/Windows 자동 분기 + 화살표·특수키 친화 라벨 */
export function formatShortcut(b: ShortcutBinding): string {
  const isMac = isMacPlatform();
  const parts: string[] = [];
  if (b.mod) parts.push(isMac ? '⌘' : 'Ctrl');
  if (b.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (b.alt) parts.push(isMac ? '⌥' : 'Alt');
  const k = b.key.toLowerCase();
  parts.push(KEY_DISPLAY[k] ?? k.toUpperCase());
  return parts.join('+');
}
