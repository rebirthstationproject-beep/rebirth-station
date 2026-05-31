'use client';

import { memo, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { CubeItem } from '@/lib/types/cube';
import {
  parseActionPayload,
  getCubeBgClassName,
  readCubeMeta,
  getCubeEffectiveLabel,
  getCubeEffectiveIcon,
  getCubeStates,
  getCubeActiveState,
} from '@/lib/types/cube';
import { trigger as hapticTrigger } from '@/lib/haptics';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CubeProps {
  item: CubeItem;
  /** 편집 모드 — 드래그·삭제 핸들 표시 */
  editMode: boolean;
  /** 보기 모드에서 탭 시 호출 (press_item 송신) */
  onPress?: (item: CubeItem) => void;
  /** 편집 모드에서 길게 누름 → 편집 시트 오픈 */
  onLongPress?: (item: CubeItem) => void;
  /** 우클릭 시 컨텍스트 메뉴 오픈 (TUS, 2026-05-23) — pageX/Y 좌표 + item 전달 */
  onContextMenu?: (item: CubeItem, x: number, y: number) => void;
  /** v0.1.3: LiveSyncBridge — PC 측 동적 큐브 라벨/이미지 override */
  liveOverride?: { label?: string; icon_url?: string | null };
}

/**
 * 큐브 — 단일 버튼 단위.
 *
 * 보기 모드:  탭 → onPress, 길게 → onLongPress(편집 시트 또는 컨텍스트)
 * 편집 모드: 드래그 가능 (부모가 DnD 컨텍스트로 감싸야 함)
 */
function CubeImpl({ item: rawItem, editMode, onPress, onLongPress, onContextMenu, liveOverride }: CubeProps) {
  // v0.1.3: PC LiveSyncBridge 의 라이브 업데이트 우선 적용 (rawItem → item 으로 변환)
  const item: CubeItem = liveOverride
    ? {
        ...rawItem,
        label: liveOverride.label ?? rawItem.label,
        icon_url:
          liveOverride.icon_url !== undefined ? liveOverride.icon_url : rawItem.icon_url,
      }
    : rawItem;
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef(0);
  const { locale } = useTranslation();
  const armedLabel = locale === 'en' ? 'Tap again' : locale === 'ja' ? 'もう一度' : '한 번 더';
  const armedFullMessage =
    locale === 'en'
      ? 'Armed — tap once more within the guard window to execute'
      : locale === 'ja'
        ? '保護解除中 — ガード時間内にもう一度押すと実行されます'
        : '대기 중 — 보호 시간 안에 한 번 더 누르면 실행됩니다';
  const armedExpiredMessage =
    locale === 'en'
      ? 'Guard window expired — tap again to re-arm'
      : locale === 'ja'
        ? 'ガード時間が切れました — もう一度押して再準備'
        : '보호 시간 만료 — 다시 누르면 재대기';
  const [expiredAnnouncement, setExpiredAnnouncement] = useState('');
  const cubeSuffix = locale === 'en' ? 'cube' : locale === 'ja' ? 'キューブ' : '큐브';
  const editAriaSuffix =
    locale === 'en'
      ? 'cube — tap to edit'
      : locale === 'ja'
        ? 'キューブ — タップで編集'
        : '큐브 — 탭하여 편집';
  const doubleAriaSuffix = (ms: number) =>
    locale === 'en'
      ? `Double-tap guard (press twice within ${ms}ms)`
      : locale === 'ja'
        ? `ダブルタップ保護 (${ms}ms 以内に 2 回押す)`
        : `더블탭 보호 (${ms}밀리초 안에 두 번 누르세요)`;
  const marker2xTitle =
    locale === 'en'
      ? 'Double-tap guard: press twice to execute'
      : locale === 'ja'
        ? 'ダブルタップ保護: 2 回押すと実行'
        : '더블탭 보호: 두 번 눌러야 실행됩니다';
  const marker2xAria =
    locale === 'en'
      ? 'Double-tap guard active'
      : locale === 'ja'
        ? 'ダブルタップ保護 有効'
        : '더블탭 보호 활성';
  // 더블탭 보호 — confirm_double_press 메타데이터 켜진 큐브는 두 번째 탭만 실제 실행
  const lastTapRef = useRef(0);
  const armedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * armed — **액션 상태** (boolean).
   * 더블탭 첫 탭 후 DOUBLE_TAP_WINDOW_MS(기본 800ms) 동안 true.
   * 두 번째 탭 발생 또는 윈도우 만료 시 false. 실제 큐브 실행 가부를 결정.
   *
   * 영구 분리 이유 (OZ — OO 검토 후 영구 명시):
   * armed=false 즉시 chip을 사라지게 하면 (1) 사용자가 행동 결과를 인지하기 전에 UI가 깜빡임
   * (2) reduced-motion 사용자에게 상태 전환 신호가 손실됨. 따라서 armed → false 전환은
   * 즉시 발화하되, chip 시각 표시는 armedChipVisible로 200ms 별도 유지하며 opacity 페이드.
   */
  const [armed, setArmed] = useState(false);
  /**
   * armedChipVisible — **UI 시각 상태** (boolean).
   * armed=true 시 즉시 true → chip mount + 180ms keyframe fade-in (cubelist-armed-chip).
   * armed=false 전환 시 200ms 동안 true 유지하며 opacity transition으로 fade-out → unmount.
   * KU·KR·LN 작업으로 도입. armed와 별도 state인 이유는 위 armed JSDoc 참조.
   */
  const [armedChipVisible, setArmedChipVisible] = useState(false);
  // SD-AL (2026-05-23): multi-state 토글 시 360ms ring flash 시각 피드백
  const [stateFlash, setStateFlash] = useState(false);
  const prevStateRef = useRef<number>(getCubeActiveState(item));
  useEffect(() => {
    const curState = getCubeActiveState(item);
    if (curState !== prevStateRef.current && getCubeStates(item).length > 1) {
      setStateFlash(true);
      const tid = setTimeout(() => setStateFlash(false), 380);
      prevStateRef.current = curState;
      return () => clearTimeout(tid);
    }
    prevStateRef.current = curState;
    return undefined;
  }, [item]);
  useEffect(() => {
    if (armed) {
      setArmedChipVisible(true);
      return undefined;
    }
    if (armedChipVisible) {
      const t = setTimeout(() => setArmedChipVisible(false), 200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [armed, armedChipVisible]);
  const meta = readCubeMeta(item.metadata);
  const confirmDoublePress = meta.confirmDoublePress;
  const DOUBLE_TAP_WINDOW_MS = meta.doublePressWindowMs;

  // 편집 모드 진입 시 armed 자동 해제 — 보기 모드에서 첫 탭 후 편집 모드로 들어와도 깨끗하게 초기화
  // RG: pressTimerRef도 함께 cleanup — 보기 모드 long-press 진행 중 외부에서 editMode true 전환 시
  //     long-press 콜백 (onLongPress=편집 시트) 발화 race 차단. 편집 모드는 별도 진입 흐름 사용.
  useEffect(() => {
    if (editMode) {
      lastTapRef.current = 0;
      if (armedTimerRef.current) {
        clearTimeout(armedTimerRef.current);
        armedTimerRef.current = null;
      }
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setArmed(false);
    }
  }, [editMode]);

  // unmount cleanup — pressTimer / armedTimer 모두 해제 (HF: 메모리 누수 + 콜백 실행 방지)
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
    };
  }, []);

  // longpress 발화 시간 (헬퍼에서 검증)
  const LONG_PRESS_MS = meta.longPressMs;

  const handlePointerDown = (): void => {
    pressStartRef.current = Date.now();
    if (editMode) return; // 편집 모드: dnd-kit이 드래그 활성, tap은 onPointerUp에서 처리
    pressTimerRef.current = setTimeout(() => {
      hapticTrigger('heavy'); // 편집 시트 진입 신호 — 강한 피드백
      onLongPress?.(item);
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = (fired: boolean): void => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (!fired) return;
    const elapsed = Date.now() - pressStartRef.current;

    if (editMode) {
      // 편집 모드: 200ms 미만 tap → 편집 시트(onLongPress 콜백 재활용)
      // long-press는 dnd-kit이 드래그로 처리하므로 여기서는 무시
      if (elapsed < 200) {
        hapticTrigger('light');
        onLongPress?.(item);
      }
      return;
    }

    if (confirmDoublePress) {
      const now = Date.now();
      const sincePrev = now - lastTapRef.current;
      if (sincePrev > 0 && sincePrev <= DOUBLE_TAP_WINDOW_MS) {
        lastTapRef.current = 0;
        if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
        setArmed(false);
        hapticTrigger('success');
        onPress?.(item);
      } else {
        lastTapRef.current = now;
        // 첫 탭 신호 — 더블탭 보호는 의도적 동작이므로 'warning'으로 더 또렷한 신호
        hapticTrigger('warning');
        setArmed(true);
        if (armedTimerRef.current) clearTimeout(armedTimerRef.current);
        armedTimerRef.current = setTimeout(() => {
          setArmed(false);
          lastTapRef.current = 0;
          // 만료 1회 sr-only 안내 (시각 변화 없이 음성 피드백만)
          setExpiredAnnouncement(armedExpiredMessage);
          // 다음 armed 진입을 위해 짧게 클리어
          setTimeout(() => setExpiredAnnouncement(''), 600);
        }, DOUBLE_TAP_WINDOW_MS);
      }
      return;
    }

    onPress?.(item);
  };

  const doubleHint =
    locale === 'en'
      ? `Double-tap guard (${DOUBLE_TAP_WINDOW_MS}ms window)`
      : locale === 'ja'
        ? `ダブルタップ保護 (${DOUBLE_TAP_WINDOW_MS}ms 以内に 2 回)`
        : `더블탭 보호 (${DOUBLE_TAP_WINDOW_MS}ms 내 두 번 누름)`;
  // 기본값(600ms)이 아니면 longpress 안내 추가
  const longPressHint =
    LONG_PRESS_MS !== 600
      ? locale === 'en'
        ? `Long-press ${LONG_PRESS_MS}ms`
        : locale === 'ja'
          ? `長押し ${LONG_PRESS_MS}ms`
          : `길게 누름 ${LONG_PRESS_MS}ms`
      : null;
  const previewTitle = [
    item.label,
    summarizeAction(item, locale),
    confirmDoublePress ? doubleHint : null,
    longPressHint,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      title={previewTitle}
      onPointerDown={handlePointerDown}
      onPointerUp={() => handlePointerUp(true)}
      onPointerLeave={() => handlePointerUp(false)}
      onPointerCancel={() => handlePointerUp(false)}
      onContextMenu={(e) => {
        if (!onContextMenu) return;
        if (item.id === '__back__') return;
        e.preventDefault();
        onContextMenu(item, e.pageX, e.pageY);
      }}
      className={clsx(
        'aspect-square rounded-2xl border relative',
        getCubeBgClassName(item.metadata),
        'flex flex-col items-center justify-center p-2 gap-1',
        // Stream Deck 톤 v2: 양각 키 시각 (inset highlight + soft shadow + 호버 시 lift)
        'cubelist-key-elevated',
        'transition-all duration-150 active:scale-95 hover:-translate-y-0.5 hover:shadow-lg hover:border-rbs-accent/40 dark:hover:border-rbs-accent/60',
        editMode && 'border-dashed border-rbs-accent',
        confirmDoublePress && !editMode && 'ring-2 ring-rbs-accent/40 ring-offset-1 ring-offset-surface hover:ring-rbs-accent/70 cursor-pointer',
        armed && 'cubelist-double-tap-armed',
        stateFlash && 'cubelist-state-flash',
      )}
      aria-label={`${item.label} ${cubeSuffix}`}
      aria-keyshortcuts="Enter Space"
      aria-description={
        editMode
          ? `${actionLabel(item.action_type, locale)} ${editAriaSuffix}`
          : armed
            ? `${actionLabel(item.action_type, locale)} · ${armedFullMessage}`
            : confirmDoublePress
              ? `${actionLabel(item.action_type, locale)} · ${doubleAriaSuffix(DOUBLE_TAP_WINDOW_MS)}`
              : actionLabel(item.action_type, locale)
      }
    >
      {typeof item.metadata?.badge === 'string' && item.metadata.badge && (
        <span className="absolute top-1 right-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rbs-accent text-white leading-none">
          {String(item.metadata.badge).slice(0, 4)}
        </span>
      )}
      {/* SD-AK (2026-05-23): multi-state 큐브 좌상단 state 인덱스 마커 (states>1일 때만) */}
      {(() => {
        const states = getCubeStates(item);
        if (states.length <= 1) return null;
        const active = getCubeActiveState(item);
        return (
          <span
            aria-hidden
            className="absolute top-1 left-1 text-[9px] font-mono leading-none px-1 py-0.5 rounded bg-rbs-accent-strong/85 text-white dark:bg-white/15 dark:text-rbs-accent-soft shadow-sm"
            title={`state ${active + 1} / ${states.length}`}
          >
            {active + 1}/{states.length}
          </span>
        );
      })()}
      {/* 단축키 시각 마커 (TVH, 2026-05-23) — metadata.hotkey 있을 때 좌하단 kbd 표시 (badge와 위치 겹침 회피) */}
      {typeof item.metadata?.hotkey === 'string' && item.metadata.hotkey && !editMode && (
        <kbd className="absolute bottom-1 left-1 text-[9px] font-mono leading-none px-1 py-0.5 rounded bg-rbs-accent-strong/85 text-white dark:bg-white/15 dark:text-rbs-accent-soft shadow-sm">
          {String(item.metadata.hotkey).slice(0, 4)}
        </kbd>
      )}
      {/* 폴더 큐브 시각 — 우상단 📁 + cube_ids 카운트 (뒤로 가기 가상 큐브 제외) */}
      {item.action_type === 'folder' && !item.metadata?.__back__ && (
        <span
          className="absolute top-1 right-1 text-[10px] font-semibold leading-none px-1 py-0.5 rounded bg-rbs-accent-soft text-rbs-accent-strong dark:bg-rbs-accent/30 dark:text-rbs-accent flex items-center gap-0.5"
          aria-label="폴더"
        >
          📁{' '}
          {Array.isArray((item.action_payload as { cube_ids?: unknown })?.cube_ids)
            ? ((item.action_payload as { cube_ids: unknown[] }).cube_ids?.length ?? 0)
            : 0}
        </span>
      )}
      {confirmDoublePress && !editMode && (
        // VB (영구): marker chip은 시멘틱 토큰화 금지 — 큐브 배경(라이트/다크)과 contrast 보장 위한
        // 의도된 직접 색상. bg-surface는 OLED 검정에 묻히고 핑크 텍스트 강조 효과 약화됨.
        <span
          className="absolute top-1 left-1 text-[9px] font-bold leading-none px-1 py-0.5 rounded bg-white/90 dark:bg-rbs-accent-strong/80 text-rbs-accent shadow-sm"
          title={marker2xTitle}
          aria-label={marker2xAria}
        >
          2×
        </span>
      )}
      {editMode && (
        <span
          aria-hidden
          className="hidden sm:inline absolute bottom-1 right-1 text-[9px] font-mono leading-none text-ink-muted bg-surface-2/80 px-1 py-0.5 rounded"
          title={`sort (${item.sort_order})`}
        >
          {item.sort_order}
        </span>
      )}
      {editMode && LONG_PRESS_MS !== 600 && (
        <span
          aria-hidden
          className="hidden sm:inline absolute bottom-1 left-1 text-[9px] font-mono leading-none text-ink-muted bg-surface-2/80 px-1 py-0.5 rounded"
          title={
            locale === 'en'
              ? `Long-press ${LONG_PRESS_MS}ms`
              : locale === 'ja'
                ? `長押し ${LONG_PRESS_MS}ms`
                : `길게 누름 ${LONG_PRESS_MS}ms`
          }
        >
          ⏱{LONG_PRESS_MS}
        </span>
      )}
      {armedChipVisible && (
        <>
          <span
            aria-hidden
            className={`absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-rbs-accent text-white text-[9px] font-bold leading-none pointer-events-none whitespace-nowrap z-10 shadow-md transition-opacity duration-200 ${
              armed ? 'opacity-100 cubelist-armed-chip' : 'opacity-0'
            }`}
          >
            {armedLabel}
          </span>
          {armed && (
            <span className="cubelist-sr-only" role="status" aria-live="assertive">
              {`${item.label}: ${armedFullMessage}`}
            </span>
          )}
        </>
      )}
      {expiredAnnouncement && !armed && (
        <span className="cubelist-sr-only" role="status" aria-live="polite">
          {`${item.label}: ${expiredAnnouncement}`}
        </span>
      )}
      {/* SD-U (2026-05-23): multi-state 적용 — states 정의된 경우 active state의 label/icon 사용, 단일 state는 동일 동작 */}
      {(() => {
        const effIcon = getCubeEffectiveIcon(item);
        return effIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={effIcon} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-rbs-accent-soft" aria-hidden />
        );
      })()}
      {(() => {
        const effLabel = getCubeEffectiveLabel(item);
        return (
          <span
            className="text-xs text-center line-clamp-2 leading-tight break-words"
            title={effLabel.length > 8 ? effLabel : undefined}
          >
            {truncateLabel(effLabel)}
          </span>
        );
      })()}
    </button>
  );
}

export const Cube = memo(CubeImpl);

/** action_type 다국어 라벨 (SD-AQ~AV 2026-05-23: 10 enum 확장) */
function actionLabel(t: CubeItem['action_type'], locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  const table: Record<'ko' | 'en' | 'ja', Record<CubeItem['action_type'], string>> = {
    ko: {
      link: '링크 액션',
      shortcut: '단축키 액션',
      macro: '매크로 액션',
      folder: '폴더',
      text_insert: '텍스트 입력',
      clipboard_copy: '클립보드 복사',
      app_launch: '앱 실행',
      focus_window: '윈도우 포커스',
      mouse_click: '마우스 클릭',
      plugin_action: '플러그인 액션',
    },
    en: {
      link: 'Link action',
      shortcut: 'Shortcut action',
      macro: 'Macro action',
      folder: 'Folder',
      text_insert: 'Insert text',
      clipboard_copy: 'Copy to clipboard',
      app_launch: 'Launch app',
      focus_window: 'Focus window',
      mouse_click: 'Mouse click',
      plugin_action: 'Plugin action',
    },
    ja: {
      link: 'リンク アクション',
      shortcut: 'ショートカット アクション',
      macro: 'マクロ アクション',
      folder: 'フォルダ',
      text_insert: 'テキスト入力',
      clipboard_copy: 'クリップボードへコピー',
      app_launch: 'アプリ起動',
      focus_window: 'ウィンドウフォーカス',
      mouse_click: 'マウスクリック',
      plugin_action: 'プラグインアクション',
    },
  };
  return table[locale][t];
}

/** 라벨 자동 줄임 — 한 줄 길이를 안전한 범위(약 16자)로 제한 */
function truncateLabel(label: string): string {
  if (label.length <= 16) return label;
  return label.slice(0, 15) + '…';
}

/** title 속성용 — 액션 한 줄 요약 (URL/키/매크로 단계 수) */
function summarizeAction(item: CubeItem, locale: 'ko' | 'en' | 'ja' = 'ko'): string {
  const payload = parseActionPayload(item);
  const emptyUrl =
    locale === 'en' ? '(no URL)' : locale === 'ja' ? '(URL なし)' : '(URL 없음)';
  const emptyKeys =
    locale === 'en' ? '(no keys)' : locale === 'ja' ? '(キーなし)' : '(키 없음)';
  switch (payload.action_type) {
    case 'link':
      return `→ ${payload.url || emptyUrl}`;
    case 'shortcut':
      return `→ ${payload.keys.length > 0 ? payload.keys.join('+') : emptyKeys}`;
    case 'macro':
      return locale === 'en'
        ? `→ ${payload.steps.length}-step macro`
        : locale === 'ja'
          ? `→ ${payload.steps.length} ステップのマクロ`
          : `→ ${payload.steps.length}단계 매크로`;
    case 'folder':
      // TUK 일관성 (2026-05-23): nonLinkActionPreview와 동일 표기 ("cubes" / "キューブ" / "큐브")
      return locale === 'en'
        ? `→ Folder (${payload.cube_ids.length} cubes)`
        : locale === 'ja'
          ? `→ フォルダ (${payload.cube_ids.length} キューブ)`
          : `→ 폴더 (${payload.cube_ids.length}개 큐브)`;
    // SD-AQ~AV (2026-05-23): 6 enum 확장 요약. SD-CB: \n → " ↵ " 인라인 변환 (Inspector와 일관성)
    case 'text_insert': {
      const t = payload.text.slice(0, 30).replace(/\n/g, ' ↵ ');
      return `→ "${t}${payload.text.length > 30 ? '…' : ''}"`;
    }
    case 'clipboard_copy': {
      const t = payload.text.slice(0, 30).replace(/\n/g, ' ↵ ');
      return `→ ⧉ "${t}${payload.text.length > 30 ? '…' : ''}"`;
    }
    case 'app_launch':
      return `→ 🚀 ${payload.path || '(no path)'}`;
    case 'focus_window':
      return `→ 🪟 ${payload.title_pattern || '(no pattern)'}`;
    case 'mouse_click':
      return `→ 🖱 (${payload.x}, ${payload.y}) ${payload.button}`;
    case 'plugin_action':
      return `→ 🧩 ${payload.plugin_uuid || '(no plugin)'}`;
  }
}
