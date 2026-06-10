/**
 * CubeCell — 단일 셀 비주얼 컴포넌트 (R1-1, 2026-06-10).
 *
 * 셀 비주얼 전체(아이콘 분기 + 라이브 + placeholder + 라벨 + 상태 클래스)를
 * 단일 컴포넌트로 통합. CubeMakerCenter inline 셀과 SortableCubeCell 양쪽이 소비.
 * 분기 로직 복제 0.
 *
 * R1-2: live_* → live_static_icon===true 아닐 때 무조건 LiveCubeVisual.
 * R1-3: now(ms) props 수신 → 순수 렌더러 (setInterval 없음).
 * R2 보완: title_style 정식 CubeTitleStyle 타입 사용 (단언 제거).
 *          show_labels prop 추가 (리스트 단위 라벨 토글).
 */

import type { Cube, CubeTitleStyle } from '../types/cube';
import { LiveCubeVisual } from './LiveCubeVisual';
import { generateIconDataUrl } from '../lib/icon-generator';

const LIVE_TYPES = new Set([
  'live_clock',
  'live_timer',
  'live_battery',
  'live_gauge',
  'live_weather',
  'live_monitor',
  'live_alarm',
  'live_stock',
  'live_calendar',
  'live_news',
  'live_network',
]);

export interface CubeCellVisualProps {
  readonly cube: Cube;
  /**
   * 선택 상태 (is-selected 클래스 + outline glow).
   * SortableCubeCell 에서 사용.
   */
  readonly selected?: boolean;
  /**
   * 큐브 만들기 탭의 다중 선택 순번 (1-based).
   * 있으면 우상단에 배지 표시.
   */
  readonly selectionIndex?: number;
  /**
   * payload 검증 실패 (is-invalid 클래스 + 우상단 ! 표시).
   */
  readonly invalid?: boolean;
  /**
   * DnD 드래그 중 (is-dragging 클래스).
   */
  readonly isDragging?: boolean;
  /**
   * 중앙 tick ms (R1-3). grida container 에서 내려줌.
   * 없으면 LiveCubeVisual 에서 Date.now() 폴백.
   */
  readonly nowMs?: number;
  /**
   * 리스트 단위 라벨 표시 여부 (R2 보완, CubeList.show_labels).
   * undefined = ON (기본), false = 리스트 전체 라벨 숨김.
   * 개별 큐브의 title_style.show === false 도 라벨 숨김 → 어느 한쪽이라도 false 면 숨김.
   */
  readonly showLabels?: boolean;
}

export function CubeCellVisual({
  cube,
  selected,
  selectionIndex,
  invalid,
  isDragging,
  nowMs,
  showLabels,
}: CubeCellVisualProps) {
  const isLiveType = LIVE_TYPES.has(cube.action_type);
  const iconMeta = (cube.metadata ?? {}) as Record<string, unknown>;
  const isTinyIcon = iconMeta.icon_is_tiny === true;
  // icon_is_duplicate: 변환 폴백으로 동일 아이콘 반복 (2026-06-10) → 생성 글리프로 대체
  const isPlaceholderIcon =
    !cube.icon_url ||
    iconMeta.icon_is_placeholder === true ||
    iconMeta.icon_is_duplicate === true;
  const iconSourceStr = (iconMeta.icon_source as string | undefined) ?? '';
  const isSdkMonoPng = /^state(@\dx)?\.png$/i.test(iconSourceStr);
  const isFolder = cube.action_type === 'folder';

  // R1-2: live_* 는 live_static_icon===true 가 아닌 한 항상 LiveCubeVisual
  const forceStaticIcon = iconMeta.live_static_icon === true;
  const useLiveVisual = isLiveType && !forceStaticIcon;

  // placeholder (generated SVG) — live 아닐 때만 사용
  const useGeneratedSvg = !useLiveVisual && (!cube.icon_url || isPlaceholderIcon || isTinyIcon);
  const generatedSvgUrl = useGeneratedSvg
    ? generateIconDataUrl(cube.label, cube.action_type)
    : null;

  // live/folder 구분 글리프 (R2-1: 우상단 6px 무채색)
  const showLiveGlyph = isLiveType && !forceStaticIcon;
  const showFolderGlyph = isFolder;

  const cellClass = [
    cube.icon_url ? 'has-icon' : '',
    selected ? 'is-selected' : '',
    selectionIndex !== undefined && selectionIndex >= 0 ? 'is-in-selection' : '',
    isTinyIcon ? 'icon-tiny' : '',
    isSdkMonoPng ? 'icon-sdk-mono' : '',
    isPlaceholderIcon && !useLiveVisual ? 'icon-placeholder' : '',
    invalid ? 'is-invalid' : '',
    isDragging ? 'is-dragging' : '',
    isFolder ? 'is-folder' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`cube-cell-visual ${cellClass}`}>
      {/* 아이콘 영역 */}
      {useLiveVisual ? (
        <div
          className="cube-icon-bg"
          aria-hidden
          style={{ background: '#0a0a0a', overflow: 'hidden' }}
        >
          <LiveCubeVisual cube={cube} nowMs={nowMs} />
        </div>
      ) : cube.icon_url && !isPlaceholderIcon && !isTinyIcon ? (
        <div
          className="cube-icon-bg"
          style={{ backgroundImage: `url("${cube.icon_url}")` }}
          aria-hidden
        />
      ) : !isFolder && generatedSvgUrl ? (
        // R2-2: placeholder = 무채색 다크 타일 + 중앙 SVG 글리프 (컬러 그라데이션 제거)
        <div
          className="cube-icon-bg cube-icon-generated"
          style={{
            backgroundImage: `url("${generatedSvgUrl}")`,
            backgroundSize: '55% 55%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundColor: '#0d0d0d',
          }}
          aria-hidden
        />
      ) : (
        <div
          className="cube-icon-bg cube-icon-letter"
          aria-hidden
        />
      )}

      {/* R2-1: 라벨 하단 오버레이 — title_style.show===false 숨김 (R2 보완: 정식 CubeTitleStyle 타입 사용) */}
      {/* showLabels===false(리스트 토글) 또는 title_style.show===false(큐브 단위) 시 숨김 */}
      {showLabels !== false && (cube.title_style as CubeTitleStyle | undefined)?.show !== false && (
        <span className="cube-label">{isFolder ? '📁 ' : ''}{cube.label}</span>
      )}

      {/* R2-1: live/folder 구분 글리프 — 우상단 6px 무채색 */}
      {(showLiveGlyph || showFolderGlyph) && (
        <span className="cube-type-glyph" aria-hidden>
          {showLiveGlyph ? '●' : '▶'}
        </span>
      )}

      {/* 다중 선택 순번 배지 */}
      {selectionIndex !== undefined && selectionIndex >= 0 && (
        <span className="library-cube-order">{selectionIndex + 1}</span>
      )}
    </div>
  );
}


