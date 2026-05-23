/**
 * Rebirth Station Stage 게이트 시스템
 *
 * 정착본: memory/project_rebirth_station.md — Stage 1~7+ 운영 기준
 * 결정: 2026-05-21
 *
 * Stage 1 시스템 개발 + 브랜딩 (현재)
 * Stage 2 시스템 완성
 * Stage 3 업데이트·개선 반복
 * Stage 4 광고·결제 모듈 추가 (앱 등록 절차에서 IAP·광고 활성화)
 * Stage 5 수익 발생
 * Stage 6 사업자 등록 + 상표권 출원
 * Stage 7+ 글로벌·B2B·하드웨어 확장
 *
 * 원칙: 수익 0 상태에서 법무·세무·상표·등록 비용 X. 부트스트랩 정석.
 */

export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 현재 Stage — 환경변수 `NEXT_PUBLIC_RBS_STAGE`로 오버라이드 가능.
 * 기본값은 1 (Stage 1 시스템 개발).
 */
export const CURRENT_STAGE: Stage = parseStageEnv();

function parseStageEnv(): Stage {
  const raw = process.env.NEXT_PUBLIC_RBS_STAGE;
  if (!raw) return 1;
  const n = Number(raw);
  if (n >= 1 && n <= 7) return n as Stage;
  return 1;
}

/**
 * Feature gate — 특정 기능이 현재 Stage에서 활성화되는지.
 *
 * Stage 4 이전 이연 항목: 광고 SDK / IAP 실 결제 / 사업자 등록 / 상표 / 도메인 패밀리 / 영문 슬로건
 */
export const FEATURES = {
  /** 광고 SDK 실 표시 (AdSense·AdMob 활성). Stage 4부터. */
  ads_active: CURRENT_STAGE >= 4,

  /** IAP 실 구매 흐름 (cordova-plugin-purchase). 앱 등록 절차에서 활성. */
  iap_active: CURRENT_STAGE >= 4,

  /** 후원 안내(자발적 Pro 업그레이드 의향 수집). Stage 1부터 가능. */
  upgrade_signal: CURRENT_STAGE >= 1,

  /** Pro 가격 표시. Stage 4부터 실 가격 노출. */
  show_pro_pricing: CURRENT_STAGE >= 4,

  /** 마켓플레이스 유료 큐브. 자사 무료 콜라보는 Stage 1부터. */
  paid_marketplace: CURRENT_STAGE >= 4,

  /** 영문 슬로건. Stage 4 종료 후 마케팅과 함께. */
  english_slogan: CURRENT_STAGE >= 5,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}

export function stageLabel(s: Stage = CURRENT_STAGE): string {
  switch (s) {
    case 1:
      return 'Stage 1 — 시스템 개발 + 브랜딩';
    case 2:
      return 'Stage 2 — 시스템 완성';
    case 3:
      return 'Stage 3 — 업데이트·개선 반복';
    case 4:
      return 'Stage 4 — 광고·결제 모듈 추가';
    case 5:
      return 'Stage 5 — 수익 발생';
    case 6:
      return 'Stage 6 — 사업자 등록·상표';
    case 7:
      return 'Stage 7+ — 글로벌·B2B·하드웨어';
  }
}
