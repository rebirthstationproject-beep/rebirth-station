/**
 * IAP (In-App Purchase) 클라이언트 추상
 *
 * 결제 모델 (memory/project_cubelist_iap.md):
 * - 외부 결제 게이트웨이 사용 안 함
 * - Google Play Billing (Android 네이티브 앱)
 * - Apple StoreKit (iOS 네이티브 앱)
 * - PWA·Windows 앱은 IAP 구매 불가 — `usePurchaseAvailable()` false
 *
 * 본 모듈은 추상 인터페이스만. 실제 구현은 모바일 앱 빌드 트랙(Capacitor)에서 활성.
 */

export type IapProvider = 'play_store' | 'app_store' | 'microsoft_store';

export interface IapProduct {
  productId: string;
  title: string;
  description: string;
  priceFormatted: string; // 사용자 로케일 가격 (스토어가 반환)
  /** 'subscription' | 'consumable' | 'non_consumable' */
  type: 'subscription' | 'consumable' | 'non_consumable';
}

export interface IapPurchase {
  productId: string;
  transactionId: string;
  rawReceipt: string; // Android: purchaseToken / iOS: base64 receipt
}

/**
 * 본 환경에서 IAP 구매가 가능한지.
 *
 * - 모바일 네이티브 앱 (Capacitor): true
 * - PWA / 모바일 브라우저: false
 * - Windows MSI 앱: false
 */
export function isPurchaseAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  // Capacitor 네이티브 앱은 globalThis.Capacitor 노출
  const capacitor = (window as unknown as { Capacitor?: { isNativePlatform(): boolean } }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

/**
 * 현재 플랫폼에 맞는 IAP provider 식별.
 */
export function detectProvider(): IapProvider | null {
  if (!isPurchaseAvailable()) return null;

  const capacitor = (window as unknown as {
    Capacitor?: { getPlatform(): string };
  }).Capacitor;
  const platform = capacitor?.getPlatform?.();
  if (platform === 'android') return 'play_store';
  if (platform === 'ios') return 'app_store';
  return null;
}

/**
 * IAP 구매 → receipt 서버사이드 검증 → entitlement 갱신.
 *
 * **본 함수는 stub**. 실제 구현은 Capacitor 플러그인 (`@capacitor/google-play-billing`
 * 또는 `cordova-plugin-purchase` 통합) 으로 모바일 앱 빌드 시 완성.
 */
export async function purchaseAndVerify(
  productId: string,
  supabaseUrl: string,
  jwt: string,
): Promise<{ success: boolean; reason?: string }> {
  const provider = detectProvider();
  if (!provider) {
    return { success: false, reason: 'iap_not_available' };
  }

  // Capacitor 네이티브 앱 측 bridge 동적 import — 웹 번들에 포함 안 됨
  let purchase: IapPurchase;
  try {
    const dynamicImport = Function('m', 'return import(m)') as (m: string) => Promise<{ purchaseProduct: (id: string) => Promise<IapPurchase> }>;
    const bridge = await dynamicImport('../../mobile/src/iap-bridge');
    const result = await bridge.purchaseProduct(productId);
    purchase = {
      productId: result.productId,
      transactionId: result.transactionId,
      rawReceipt: result.rawReceipt,
    };
  } catch (e) {
    return { success: false, reason: `purchase_aborted:${(e as Error).message}` };
  }

  // 서버사이드 검증
  const res = await fetch(`${supabaseUrl}/functions/v1/verify-iap-receipt`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      product_id: purchase.productId,
      transaction_id: purchase.transactionId,
      raw_receipt: purchase.rawReceipt,
    }),
  });

  if (!res.ok) {
    return { success: false, reason: `verify_failed_${res.status}` };
  }

  const body = await res.json();
  return { success: Boolean(body.is_pro_active) };
}
