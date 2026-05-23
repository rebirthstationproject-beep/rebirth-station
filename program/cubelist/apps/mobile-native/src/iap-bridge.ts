/**
 * IAP Bridge — Capacitor 네이티브 앱 측 실제 구매 로직
 *
 * 회사: 리버스 스테이션 (Rebirth Station)
 * 결제 모델: memory/project_cubelist_iap.md
 *
 * 라이브러리: cordova-plugin-purchase (CdvPurchase v13+)
 *   - Android: Google Play Billing v6
 *   - iOS: StoreKit 2 호환
 *
 * 본 모듈은 모바일 앱(Capacitor) 빌드에서만 활성.
 * `apps/web/lib/iap.ts`의 `purchaseAndVerify()`가 본 함수를 동적 import.
 */

import 'cordova-plugin-purchase/www/store.d';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const CdvPurchase: any;

/**
 * 큐브 리스트 IAP product ID 정의.
 * Google Play Console / App Store Connect에 동일 ID로 등록 필요.
 */
export const CUBELIST_PRODUCTS = {
  PRO_MONTHLY: 'com.rebirthstation.cubelist.pro.monthly',
  PRO_YEARLY: 'com.rebirthstation.cubelist.pro.yearly',
  PRO_LIFETIME: 'com.rebirthstation.cubelist.pro.lifetime',
} as const;

export type CubelistProductId = (typeof CUBELIST_PRODUCTS)[keyof typeof CUBELIST_PRODUCTS];

interface PurchaseResult {
  productId: string;
  transactionId: string;
  rawReceipt: string;
  platform: 'android' | 'ios';
}

let initialized = false;

/**
 * Capacitor 앱 시작 시 1회 호출. product 등록 + listener 설정.
 */
export async function initializeIap(): Promise<void> {
  if (initialized) return;
  if (typeof CdvPurchase === 'undefined') {
    throw new Error('CdvPurchase not loaded — Capacitor 네이티브 앱에서만 동작');
  }

  const { store, Platform, ProductType } = CdvPurchase;

  // 디버그 로그는 dev 빌드에서만
  store.verbosity = store.WARNING;

  // 구독 (월/연)
  store.register([
    {
      id: CUBELIST_PRODUCTS.PRO_MONTHLY,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY,
    },
    {
      id: CUBELIST_PRODUCTS.PRO_MONTHLY,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.APPLE_APPSTORE,
    },
    {
      id: CUBELIST_PRODUCTS.PRO_YEARLY,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.GOOGLE_PLAY,
    },
    {
      id: CUBELIST_PRODUCTS.PRO_YEARLY,
      type: ProductType.PAID_SUBSCRIPTION,
      platform: Platform.APPLE_APPSTORE,
    },
    // 평생결제 (일회성)
    {
      id: CUBELIST_PRODUCTS.PRO_LIFETIME,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.GOOGLE_PLAY,
    },
    {
      id: CUBELIST_PRODUCTS.PRO_LIFETIME,
      type: ProductType.NON_CONSUMABLE,
      platform: Platform.APPLE_APPSTORE,
    },
  ]);

  // 구매 완료 → 영수증 가공 → 서버 검증으로 전달은 호출자가 처리
  await store.initialize([Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE]);
  initialized = true;
}

/**
 * 구매 시도. 결과 반환 후 서버사이드 검증으로 전달.
 */
export async function purchaseProduct(productId: CubelistProductId): Promise<PurchaseResult> {
  if (!initialized) {
    await initializeIap();
  }

  const { store } = CdvPurchase;
  const product = store.get(productId);
  if (!product) {
    throw new Error(`product not registered: ${productId}`);
  }

  const offer = product.getOffer();
  if (!offer) {
    throw new Error(`no offer for product: ${productId}`);
  }

  return new Promise((resolve, reject) => {
    const transaction = offer.order();

    // 한 번만 매칭 — 동일 productId 새 구매 후 즉시 정리
    const off = store.when().approved((tx: any) => {
      if (tx.products?.some((p: any) => p.id === productId)) {
        tx.verify();
      }
    });

    store.when().verified((receipt: any) => {
      const tx = receipt.transactions?.[0];
      if (!tx) return;
      off();
      receipt.finish();
      resolve({
        productId,
        transactionId: tx.transactionId,
        rawReceipt: extractReceipt(receipt),
        platform: receipt.platform === 'ios-appstore' ? 'ios' : 'android',
      });
    });

    if (transaction?.then) {
      transaction.catch(reject);
    }
  });
}

function extractReceipt(receipt: any): string {
  // iOS: receipt.appStoreReceipt 또는 receipt.signature
  // Android: receipt.purchaseToken
  return (
    receipt.appStoreReceipt ??
    receipt.purchaseToken ??
    receipt.signature ??
    JSON.stringify(receipt)
  );
}

/**
 * 기존 구독 복원 (StoreKit restorePurchases).
 * iOS App Store 가이드 요구 사항 — "Restore Purchases" 버튼 필요.
 */
export async function restorePurchases(): Promise<void> {
  if (!initialized) {
    await initializeIap();
  }
  const { store } = CdvPurchase;
  await store.restorePurchases();
}

/**
 * 상품 정보 조회 (가격·로컬라이즈된 타이틀).
 */
export function getProductInfo(productId: CubelistProductId): {
  title: string;
  description: string;
  priceFormatted: string;
} | null {
  if (!initialized) return null;
  const { store } = CdvPurchase;
  const product = store.get(productId);
  if (!product) return null;
  const offer = product.getOffer();
  if (!offer) return null;
  return {
    title: product.title,
    description: product.description,
    priceFormatted: offer.pricingPhases?.[0]?.price ?? '',
  };
}
