/**
 * Cube List 자체 SVG 아이콘 생성기 (design.md Level 10 자동화).
 *
 * 디자인 시스템:
 * - viewBox: 0 0 24 24
 * - stroke-linecap: round
 * - stroke-linejoin: round
 * - stroke-width: 2 (main), 1.5 (secondary)
 * - 색상 ≤ 2개 (카테고리 컬러)
 * - 중심 정렬 (12, 12)
 *
 * 사용:
 *   const svg = generateIcon({ label: 'Brush', action_type: 'shortcut' });
 *   const dataUrl = asDataUrl(svg);
 *   // cube.icon_url = dataUrl;
 */

// ============================================================
// Level 2 — 카테고리 컬러
// ============================================================

export const CATEGORY_COLORS: Record<string, { primary: string; secondary: string }> = {
  navigation: { primary: '#3B82F6', secondary: '#1D4ED8' },
  edit: { primary: '#8B5CF6', secondary: '#6D28D9' },
  view: { primary: '#06B6D4', secondary: '#0E7490' },
  layer: { primary: '#F59E0B', secondary: '#B45309' },
  selection: { primary: '#EC4899', secondary: '#BE185D' },
  filter: { primary: '#10B981', secondary: '#047857' },
  text: { primary: '#6366F1', secondary: '#4338CA' },
  shape: { primary: '#F43F5E', secondary: '#BE123C' },
  tool: { primary: '#84CC16', secondary: '#4D7C0F' },
  fill: { primary: '#EAB308', secondary: '#A16207' },
  transform: { primary: '#A855F7', secondary: '#7E22CE' },
  color: { primary: '#FB923C', secondary: '#C2410C' },
  brush: { primary: '#22D3EE', secondary: '#0891B2' },
  time: { primary: '#FF9800', secondary: '#F57C00' },
  audio: { primary: '#7B1FA2', secondary: '#4A148C' },
  system: { primary: '#64748B', secondary: '#334155' },
};

export type IconCategory = keyof typeof CATEGORY_COLORS;

/** 라벨 + 액션 → 카테고리 (Level 2) */
export function categoryFromAction(action_type: string, label: string): IconCategory {
  const l = label.toLowerCase();
  if (
    action_type === 'live_clock' ||
    action_type === 'live_timer' ||
    /\bclock|\btimer|\btime\b/.test(l)
  ) return 'time';
  if (
    action_type === 'live_battery' ||
    action_type === 'live_gauge' ||
    /\bbattery|\bgauge|\bcpu\b/.test(l)
  ) return 'time';
  if (action_type === 'media_key' || /\bvolume|\bmute|\baudio|\bplay|\bpause|\bnext|\bprev/.test(l))
    return 'audio';
  if (/\blayer/.test(l)) return 'layer';
  if (/\bselect|\bmask|\blasso|\bmagic/.test(l)) return 'selection';
  if (/\bbrush|\bpen|\beraser|\bclone|\bheal/.test(l)) return 'brush';
  if (/\bcolor|\bhue|\bsaturation|\bblack|\bwhite|\badj_|\blevels|\bcurves/.test(l)) return 'color';
  if (/\btransform|\brotate|\bscale|\bflip|\bperspective|\bfree/.test(l)) return 'transform';
  if (/\bfill|\bstroke/.test(l)) return 'fill';
  if (/\btext|\btype|\bfont|\bhorizontal|\bvertical/.test(l)) return 'text';
  if (/\bzoom|\bview|\brulers|\bgrid|\bsnap|\bactual_size/.test(l)) return 'view';
  if (/\bshape|\bline|\brectangle|\bpolygon|\bcrop/.test(l)) return 'shape';
  if (
    action_type === 'page_navigate' ||
    action_type === 'page_jump' ||
    action_type === 'folder' ||
    action_type === 'folder_up' ||
    action_type === 'folder_open' ||
    /\bpage|\bfolder|\bback|\bforward|\bhome|\bopen/.test(l)
  ) return 'navigation';
  if (/\bfile|\bsave|\bexport|\bnew\b|\bcopy|\bpaste|\bcut|\bundo|\bredo/.test(l)) return 'edit';
  if (/\bblur|\bfilter|\bsharpen|\bnoise/.test(l)) return 'filter';
  if (action_type === 'link') return 'navigation';
  if (action_type === 'app_launch' || action_type === 'focus_window') return 'view';
  if (action_type === 'shortcut' || action_type === 'hotkey_toggle') return 'tool';
  if (action_type === 'macro') return 'transform';
  return 'system';
}

// ============================================================
// Level 3 — Stroke 표준
// ============================================================

const STROKE_MAIN = 2;
const STROKE_SEC = 1.5;

const COMMON_STROKE = `stroke-width="${STROKE_MAIN}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;

// ============================================================
// Level 5 — Semantic Metaphor → SVG paths
// ============================================================

interface IconBlock {
  /** SVG paths/shapes (excluding outer <svg> wrapper) */
  readonly body: string;
  /** stroke color (overrides category) — null 이면 카테고리 사용 */
  readonly strokeOverride?: string | null;
  /** fill color */
  readonly fillOverride?: string | null;
}

/** Action / 라벨 키워드 → 메타포 SVG 본문 매핑 */
const METAPHOR_LIBRARY: ReadonlyArray<{ pattern: RegExp; block: IconBlock }> = [
  // === Navigation ===
  {
    pattern: /^link$|website|browser/i,
    block: {
      body:
        '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" />' +
        '<path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />',
    },
  },
  {
    pattern: /^folder$|folder_open|folder_up/i,
    block: {
      body: '<path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2z" />',
    },
  },
  {
    pattern: /page_navigate|next.?page|forward/i,
    block: { body: '<path d="M5 12h14M13 5l7 7-7 7" />' },
  },
  {
    pattern: /prev.?page|page_previous|back/i,
    block: { body: '<path d="M19 12H5M11 19l-7-7 7-7" />' },
  },
  {
    pattern: /page_jump/i,
    block: { body: '<path d="M3 12h18M8 5L3 12l5 7M16 5l5 7-5 7" />' },
  },
  {
    pattern: /home/i,
    block: { body: '<path d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" />' },
  },

  // === Edit ===
  { pattern: /\bundo\b/i, block: { body: '<path d="M9 14l-4-4 4-4M5 10h11a4 4 0 014 4v0a4 4 0 01-4 4h-5" />' } },
  { pattern: /\bredo\b/i, block: { body: '<path d="M15 14l4-4-4-4M19 10H8a4 4 0 00-4 4v0a4 4 0 004 4h5" />' } },
  { pattern: /\bcopy\b/i, block: { body: '<rect x="9" y="3" width="6" height="3" rx="1" /><rect x="6" y="5" width="12" height="16" rx="2" />' } },
  { pattern: /\bpaste\b/i, block: { body: '<rect x="9" y="3" width="6" height="3" rx="1" /><rect x="6" y="5" width="12" height="16" rx="2" /><path d="M9 14h6M9 17h4" />' } },
  { pattern: /\bcut\b/i, block: { body: '<circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 8l12 12M20 4L8 16" />' } },
  { pattern: /\bdelete|\btrash/i, block: { body: '<path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />' } },
  { pattern: /\bsave\b/i, block: { body: '<path d="M5 3h11l3 3v15a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M8 3v5h7V3M8 14h8v7H8z" />' } },
  { pattern: /\bopen\b/i, block: { body: '<path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9h-9l-2-2H5a2 2 0 00-2 2z" /><path d="M3 11h18" />' } },
  { pattern: /\bnew\b/i, block: { body: '<path d="M14 3H5a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 3v5h5" />' } },
  { pattern: /\bexport\b/i, block: { body: '<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7" /><path d="M16 7l-4-4-4 4M12 3v14" />' } },

  // === Selection ===
  { pattern: /select_all|select.?all/i, block: { body: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="2 2" /><circle cx="3" cy="3" r="1.5" fill="currentColor" /><circle cx="21" cy="3" r="1.5" fill="currentColor" /><circle cx="3" cy="21" r="1.5" fill="currentColor" /><circle cx="21" cy="21" r="1.5" fill="currentColor" />' } },
  { pattern: /\blasso\b/i, block: { body: '<path d="M21 12c0 4-4 7-9 7s-9-3-9-7 4-7 9-7 9 3 9 7z" /><path d="M9 19v3M12 22a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />' } },
  { pattern: /magic.?wand|magic/i, block: { body: '<path d="M3 21L14 10M11 7l3 3M15 4l3 3M19 8l2 2" /><circle cx="6" cy="6" r="1" fill="currentColor" /><circle cx="20" cy="14" r="1" fill="currentColor" />' } },
  { pattern: /\bmask\b/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" />' } },

  // === Layer ===
  { pattern: /new.?layer|\blayer.?new/i, block: { body: '<path d="M3 12l9-5 9 5-9 5z" /><path d="M3 17l9 5 9-5" />' } },
  { pattern: /duplicate.?layer|layer.?duplicate/i, block: { body: '<path d="M5 10l7-4 7 4-7 4z" /><path d="M5 15l7 4 7-4" /><path d="M5 5l7-4 7 4" />' } },
  { pattern: /merge.?layer|layer.?merge/i, block: { body: '<path d="M5 6l7-3 7 3-7 3z" /><path d="M5 11l7 3 7-3" /><path d="M12 14v7M9 18l3 3 3-3" />' } },
  { pattern: /group.?layer|layer.?group/i, block: { body: '<rect x="3" y="6" width="18" height="12" rx="2" /><rect x="6" y="9" width="5" height="6" rx="1" /><rect x="13" y="9" width="5" height="6" rx="1" />' } },
  { pattern: /lock.?layer/i, block: { body: '<rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />' } },
  { pattern: /\blayer/i, block: { body: '<path d="M3 12l9-5 9 5-9 5z" /><path d="M3 17l9 5 9-5" /><path d="M3 7l9-5 9 5" />' } },

  // === Tools ===
  { pattern: /\bbrush\b/i, block: { body: '<path d="M9 11l-6 6v4h4l6-6" /><path d="M13 5l6 6-6 6" /><circle cx="14" cy="6" r="2" fill="currentColor" />' } },
  { pattern: /\bpen\b/i, block: { body: '<path d="M12 19l7-7-4-4-7 7z" /><path d="M3 21l5-2L19 8 16 5 5 16z" />' } },
  { pattern: /\beraser/i, block: { body: '<path d="M16 3l5 5-13 13H3v-5z" /><path d="M11 8l5 5" />' } },
  { pattern: /\bdodge|burn/i, block: { body: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />' } },
  { pattern: /\beyedropper/i, block: { body: '<path d="M11 11l-6 6v4h4l6-6" /><path d="M14 8l4-4 3 3-4 4-3-3z" />' } },
  { pattern: /clone.?stamp/i, block: { body: '<path d="M9 21h6M12 21V11" /><circle cx="12" cy="6" r="3" /><path d="M5 11h14l-2 8H7z" />' } },
  { pattern: /\bzoom|magnify/i, block: { body: '<circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5M8 11h6M11 8v6" />' } },
  { pattern: /\bmove\b/i, block: { body: '<path d="M12 2v20M2 12h20M5 9l-3 3 3 3M19 9l3 3-3 3M9 5l3-3 3 3M9 19l3 3 3-3" />' } },
  { pattern: /\bcrop/i, block: { body: '<path d="M6 2v14a2 2 0 002 2h14M2 6h14a2 2 0 012 2v14" />' } },

  // === Color ===
  { pattern: /hue.?saturation|adj_hue/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5 6l14 12M19 6L5 18" />' } },
  { pattern: /color.?balance|adj_color_balance/i, block: { body: '<circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="3" fill="currentColor" opacity="0.5" /><circle cx="15" cy="14" r="3" fill="currentColor" opacity="0.7" />' } },
  { pattern: /brightness|contrast/i, block: { body: '<circle cx="12" cy="12" r="5" /><path d="M12 2v3M12 19v3M5 12H2M22 12h-3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />' } },
  { pattern: /black.?and.?white/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 010 18z" fill="currentColor" />' } },
  { pattern: /\binvert\b/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path d="M12 3a9 9 0 000 18z" fill="currentColor" />' } },
  { pattern: /\bauto.?color|auto.?tone|auto.?contrast/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" />' } },
  { pattern: /\blevels\b/i, block: { body: '<path d="M3 20V8m4 12V4m4 16v-6m4 6V10m4 10v-4" />' } },
  { pattern: /\bcurves\b/i, block: { body: '<path d="M3 20C7 18 9 8 12 8s5 10 9 12" />' } },
  { pattern: /foreground|background/i, block: { body: '<rect x="4" y="4" width="11" height="11" rx="1" /><rect x="9" y="9" width="11" height="11" rx="1" fill="currentColor" />' } },

  // === Transform ===
  { pattern: /free.?transform|transform/i, block: { body: '<rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="4" cy="4" r="1.5" fill="currentColor" /><circle cx="20" cy="4" r="1.5" fill="currentColor" /><circle cx="4" cy="20" r="1.5" fill="currentColor" /><circle cx="20" cy="20" r="1.5" fill="currentColor" />' } },
  { pattern: /\brotate|rotation/i, block: { body: '<path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 4v6h-6" />' } },
  { pattern: /\bflip.?horizontal/i, block: { body: '<path d="M12 3v18" /><path d="M9 9V6L3 12l6 6v-3" /><path d="M15 9V6l6 6-6 6v-3" />' } },
  { pattern: /\bflip.?vertical/i, block: { body: '<path d="M3 12h18" /><path d="M9 9H6L12 3l6 6h-3" /><path d="M9 15H6l6 6 6-6h-3" />' } },
  { pattern: /perspective/i, block: { body: '<path d="M3 4l18 4v8L3 20z" />' } },

  // === Fill ===
  { pattern: /fill_with|content.?aware.?fill/i, block: { body: '<path d="M5 11l7-8 7 8a7 7 0 11-14 0z" />' } },
  { pattern: /\bfill\b/i, block: { body: '<path d="M5 11l7-8 7 8a7 7 0 11-14 0z" fill="currentColor" />' } },
  { pattern: /\bstroke\b/i, block: { body: '<rect x="3" y="3" width="18" height="18" rx="2" />' } },

  // === Text ===
  { pattern: /horizontal.?type|^text/i, block: { body: '<path d="M5 5h14M12 5v14M9 19h6" />' } },
  { pattern: /vertical.?type/i, block: { body: '<path d="M5 5h6M8 5v14M5 19h6" /><path d="M15 7l-3 3M18 7l-3 3" />' } },
  { pattern: /\bfont\b/i, block: { body: '<path d="M4 5h14M11 5v14M8 19h6" /><path d="M16 19l3-9 3 9M17 16h4" />' } },

  // === Shape ===
  { pattern: /\bline\b/i, block: { body: '<path d="M3 21L21 3" />' } },
  { pattern: /rectangle|rect/i, block: { body: '<rect x="3" y="6" width="18" height="12" rx="2" />' } },
  { pattern: /ellipse|circle/i, block: { body: '<circle cx="12" cy="12" r="9" />' } },
  { pattern: /polygon|shape/i, block: { body: '<polygon points="12 2 22 9 18 21 6 21 2 9" />' } },

  // === View ===
  { pattern: /actual_size|fit.?screen/i, block: { body: '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 9l-2-2M8 9v-2M8 9h2M16 15l2 2M16 15v2M16 15h-2" />' } },
  { pattern: /\brulers\b/i, block: { body: '<rect x="3" y="6" width="18" height="4" rx="1" /><path d="M6 6v2M9 6v2M12 6v3M15 6v2M18 6v2" /><rect x="6" y="14" width="4" height="6" rx="1" /><path d="M6 17h2M6 19h2" />' } },
  { pattern: /\bgrid\b|snap.?to/i, block: { body: '<rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" />' } },

  // === Tools — Photoshop specific ===
  { pattern: /\bblur\b/i, block: { body: '<circle cx="12" cy="12" r="9" opacity="0.3" /><circle cx="12" cy="12" r="6" opacity="0.5" /><circle cx="12" cy="12" r="3" />' } },
  { pattern: /\bneural/i, block: { body: '<circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="12" cy="12" r="2" /><path d="M8 6h8M8 18h8M6 8v8M18 8v8M8 8l8 8M16 8l-8 8" />' } },
  { pattern: /drop.?shadow/i, block: { body: '<rect x="3" y="3" width="14" height="14" rx="2" fill="currentColor" opacity="0.3" /><rect x="7" y="7" width="14" height="14" rx="2" />' } },
  { pattern: /healing/i, block: { body: '<path d="M19 13l-6 6-6-6a4 4 0 116-5 4 4 0 116 5z" /><path d="M9 11l3 3 3-3" />' } },
  { pattern: /align.?horizontal/i, block: { body: '<path d="M12 4v16" /><rect x="6" y="7" width="12" height="3" rx="1" fill="currentColor" /><rect x="4" y="14" width="16" height="3" rx="1" fill="currentColor" />' } },
  { pattern: /align.?vertical/i, block: { body: '<path d="M4 12h16" /><rect x="7" y="6" width="3" height="12" rx="1" fill="currentColor" /><rect x="14" y="4" width="3" height="16" rx="1" fill="currentColor" />' } },
  { pattern: /\bfade\b/i, block: { body: '<path d="M3 12h18M3 8h18M3 16h18" opacity="0.4" /><path d="M3 4h18M3 20h18" />' } },
  { pattern: /flatten/i, block: { body: '<path d="M3 18h18M3 14h18" /><rect x="3" y="6" width="18" height="4" rx="1" fill="currentColor" />' } },
  { pattern: /apply.?image|last.?filter/i, block: { body: '<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9l3 3 6-6" />' } },
  { pattern: /file.?info|info/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M12 8v0M12 12v4" />' } },
  { pattern: /image.?size|canvas.?size/i, block: { body: '<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9l-3 3 3 3M15 9l3 3-3 3M12 6l-3 3M12 18l3-3" />' } },
  { pattern: /increase.?brush|decrease.?brush/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" />' } },
  { pattern: /direct.?selection|path.?selection/i, block: { body: '<path d="M3 3l8 18 3-7 7-3z" />' } },
  { pattern: /perspective.?crop/i, block: { body: '<path d="M5 6l14-2v16l-14-2z" />' } },

  // === Time ===
  { pattern: /^live_clock$|^clock$|world.?clock|digital.?clock|analog.?clock/i, block: { body: '<circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" />' } },
  { pattern: /^live_timer$|tomato|pomodoro|^timer\b/i, block: { body: '<path d="M12 2v3M9 5h6" /><circle cx="12" cy="14" r="8" /><path d="M12 11v3l2 2" />' } },
  { pattern: /^live_battery$|battery/i, block: { body: '<rect x="3" y="8" width="16" height="8" rx="1" /><rect x="20" y="10" width="2" height="4" rx="0.5" fill="currentColor" /><rect x="5" y="10" width="8" height="4" rx="0.5" fill="currentColor" stroke="none" />' } },
  { pattern: /^live_gauge$|gauge|speed.?test|hardware/i, block: { body: '<path d="M4 18a8 8 0 0116 0" /><path d="M12 18v-5" /><circle cx="12" cy="18" r="1" fill="currentColor" />' } },

  // === Audio ===
  { pattern: /^audio_play$|\bplay\b/i, block: { body: '<polygon points="6 4 20 12 6 20" fill="currentColor" />' } },
  { pattern: /pause/i, block: { body: '<rect x="6" y="4" width="4" height="16" fill="currentColor" /><rect x="14" y="4" width="4" height="16" fill="currentColor" />' } },
  { pattern: /\bstop\b/i, block: { body: '<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" />' } },
  { pattern: /\bnext\b/i, block: { body: '<polygon points="5 4 16 12 5 20" fill="currentColor" /><rect x="17" y="5" width="2" height="14" fill="currentColor" />' } },
  { pattern: /\bprev/i, block: { body: '<polygon points="19 4 8 12 19 20" fill="currentColor" /><rect x="5" y="5" width="2" height="14" fill="currentColor" />' } },
  { pattern: /\bmute\b/i, block: { body: '<path d="M11 5L6 9H3v6h3l5 4z" /><path d="M16 9l5 5M21 9l-5 5" />' } },
  { pattern: /\bvolume/i, block: { body: '<path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15 9a5 5 0 010 6" />' } },

  // === System ===
  { pattern: /\bsleep\b|system_sleep/i, block: { body: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />' } },
  { pattern: /system.?actionbar|toggle/i, block: { body: '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" />' } },
  { pattern: /window.?close|\bclose\b/i, block: { body: '<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9l6 6M15 9l-6 6" />' } },

  // === Plugin Action / Macro / Hotkey Toggle ===
  { pattern: /^plugin_action$/i, block: { body: '<path d="M9 5v4H5v6h4v4h6v-4h4V9h-4V5z" />' } },
  { pattern: /^macro$|super.?macro/i, block: { body: '<circle cx="6" cy="6" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><path d="M6 8v8M12 8v8M18 8v8" /><path d="M4 18h16" />' } },
  { pattern: /^shortcut$|hotkey/i, block: { body: '<rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="7" cy="10" r="0.5" fill="currentColor" /><circle cx="11" cy="10" r="0.5" fill="currentColor" /><circle cx="15" cy="10" r="0.5" fill="currentColor" /><path d="M7 14h10" />' } },
  { pattern: /^profile_rotate$/i, block: { body: '<path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 4v6h-6" />' } },
  { pattern: /^app_launch$/i, block: { body: '<path d="M4 14l8-8 8 8M12 6v15M4 21h16" />' } },
  { pattern: /^mouse_click$/i, block: { body: '<path d="M12 2v6M12 18v4M4 12h6M14 12h6" /><circle cx="12" cy="12" r="2" fill="currentColor" />' } },
  { pattern: /^focus_window$/i, block: { body: '<rect x="3" y="3" width="18" height="18" rx="2" /><rect x="7" y="7" width="10" height="10" rx="1" />' } },
  { pattern: /^text_insert$/i, block: { body: '<path d="M4 6h16M12 6v14M8 20h8" />' } },
  { pattern: /^clipboard_copy$/i, block: { body: '<rect x="9" y="3" width="6" height="3" rx="1" /><rect x="6" y="5" width="12" height="16" rx="2" />' } },
];

// ============================================================
// Level 10 — 자동 생성기
// ============================================================

function findBlock(label: string, action_type: string): IconBlock {
  const haystack = `${action_type} ${label}`;
  for (const { pattern, block } of METAPHOR_LIBRARY) {
    if (pattern.test(haystack)) return block;
  }
  // 기본 fallback: 라벨 첫 글자
  const first = (label.trim().charAt(0) || '?').toUpperCase();
  return {
    body: `<text x="12" y="16" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">${escapeXml(first)}</text>`,
  };
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));
}

/**
 * 자체 SVG 아이콘 생성 (24×24).
 * 반환: SVG 마크업 문자열
 */
export function generateIcon(spec: { label: string; action_type: string; size?: number }): string {
  const category = categoryFromAction(spec.action_type, spec.label);
  const colors = CATEGORY_COLORS[category];
  const color = colors.primary;
  const block = findBlock(spec.label, spec.action_type);
  const strokeColor = block.strokeOverride ?? color;
  const fillColor = block.fillOverride ?? 'none';
  const size = spec.size ?? 24;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ` +
    `style="color: ${strokeColor};" ` +
    `stroke="${strokeColor}" fill="${fillColor}" ${COMMON_STROKE.replace('fill="none"', '')}` +
    `>${block.body}</svg>`
  );
}

/** SVG → data URL (cube.icon_url 호환) */
export function asDataUrl(svg: string): string {
  // base64 (한글 안 들어가는 SVG라 일반 btoa OK)
  const encoded = typeof window !== 'undefined' && window.btoa ? window.btoa(svg) : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

/** 라벨 + 액션으로 바로 data URL 생성 */
export function generateIconDataUrl(label: string, action_type: string): string {
  return asDataUrl(generateIcon({ label, action_type }));
}

/** 카테고리 컬러 페어 (placeholder 그라데이션 등 활용) */
export function categoryColorPair(action_type: string, label: string): [string, string] {
  const cat = categoryFromAction(action_type, label);
  const c = CATEGORY_COLORS[cat];
  return [c.primary, c.secondary];
}

void STROKE_SEC;
