/**
 * 디바이스별 디폴트 페이지 사이즈 (cols × rows).
 *
 * **사용자 명시 (2026-06-01)**:
 * - 일반 모바일 (iPhone 일반/Pro, 갤럭시 일반): 4×6 / 6×4 = 24
 * - Pro Max / 울트라 (iPhone Pro Max, 갤럭시 울트라): 4×7 / 7×4 = 28
 * - 태블릿 (iPad, 갤럭시 탭): 6×12 ~ 8×14 (사용자 직접 테스트 후 확정)
 * - PC 데스크톱: 사용자 정의 (cube list 의 cols × 4 행 디폴트)
 *
 * 화면 구성은 유저가 자유롭게 설정 가능 — 본 디폴트는 빈 슬롯 표시 + 권장 페이지 경계 가이드용.
 *
 * **태블릿은 잠정값**. 사용자 실측 후 정정 예정.
 */

export interface PageSizeSpec {
  readonly cols: number;
  readonly rows: number;
  readonly label: string;
}

/** 일반 모바일 세로 (iPhone 일반/Pro, 갤럭시 일반) */
export const PHONE_PORTRAIT: PageSizeSpec = { cols: 4, rows: 6, label: '일반 모바일 세로 (4×6)' };

/** 일반 모바일 가로 */
export const PHONE_LANDSCAPE: PageSizeSpec = { cols: 6, rows: 4, label: '일반 모바일 가로 (6×4)' };

/** Pro Max / 울트라 세로 (iPhone Pro Max, 갤럭시 울트라) */
export const PHONE_MAX_PORTRAIT: PageSizeSpec = { cols: 4, rows: 7, label: 'Pro Max 세로 (4×7)' };

/** Pro Max / 울트라 가로 */
export const PHONE_MAX_LANDSCAPE: PageSizeSpec = { cols: 7, rows: 4, label: 'Pro Max 가로 (7×4)' };

/** 태블릿 세로 (잠정 — 사용자 실측 후 정정) */
export const TABLET_PORTRAIT: PageSizeSpec = { cols: 6, rows: 12, label: '태블릿 세로 (6×12, 잠정)' };

/** 태블릿 가로 (잠정) */
export const TABLET_LANDSCAPE: PageSizeSpec = { cols: 12, rows: 6, label: '태블릿 가로 (12×6, 잠정)' };

/** 태블릿 큰 (잠정 — 8×14 / 14×8 가능성) */
export const TABLET_LARGE_PORTRAIT: PageSizeSpec = { cols: 8, rows: 14, label: '태블릿 대형 세로 (8×14, 잠정)' };
export const TABLET_LARGE_LANDSCAPE: PageSizeSpec = { cols: 14, rows: 8, label: '태블릿 대형 가로 (14×8, 잠정)' };

/** PC 데스크톱 — 사용자 cols 정의 + 권장 4 행 */
export const PC_DEFAULT_ROWS = 4;

/**
 * 뷰포트 기반 자동 감지.
 * - innerWidth < 480: 일반 모바일 세로 (4×6)
 * - 480 ~ 768: 일반 모바일 가로 (6×4)  ※ Pro Max 는 사용자가 명시 토글로 4×7 전환
 * - 768 ~ 1024: 태블릿 세로 (6×12, 잠정)
 * - 1024 ~ 1366: 태블릿 가로 (12×6, 잠정)
 * - 1366+: PC 데스크톱 (사용자 cols × 4)
 */
export function detectDefaultPageSize(
  innerWidth: number,
  innerHeight: number,
): PageSizeSpec | null {
  const isPortrait = innerHeight > innerWidth;
  if (innerWidth < 480) return PHONE_PORTRAIT;
  if (innerWidth < 768) return PHONE_LANDSCAPE;
  if (innerWidth < 1024) return isPortrait ? TABLET_PORTRAIT : TABLET_LANDSCAPE;
  if (innerWidth < 1366) return TABLET_LANDSCAPE;
  return null; // PC — 사용자 cols 정의 사용
}

/**
 * 사용자가 명시 선택 가능한 프리셋 옵션 (설정 패널 dropdown).
 */
export const PAGE_SIZE_PRESETS: ReadonlyArray<PageSizeSpec> = [
  PHONE_PORTRAIT,
  PHONE_LANDSCAPE,
  PHONE_MAX_PORTRAIT,
  PHONE_MAX_LANDSCAPE,
  TABLET_PORTRAIT,
  TABLET_LANDSCAPE,
  TABLET_LARGE_PORTRAIT,
  TABLET_LARGE_LANDSCAPE,
];
