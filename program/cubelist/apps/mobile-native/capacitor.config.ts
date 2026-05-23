import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 설정 — 큐브 리스트 모바일 앱.
 *
 * 회사: 리버스 스테이션 (Rebirth Station)
 * 결제: Google Play Billing + Apple StoreKit IAP (외부 결제 X)
 *
 * webDir = `../web/out` (Next.js static export)
 * appId  = `com.rebirthstation.cubelist`
 */

const config: CapacitorConfig = {
  appId: 'com.rebirthstation.cubelist',
  appName: '큐브 리스트',
  webDir: '../web/out',
  bundledWebRuntime: false,

  // 거치 모드 친화 — 폰을 다양한 방향으로 거치할 수 있도록
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#FCE4EC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#E91E63',
    },
    // IAP 플러그인 — cordova-plugin-purchase가 자동 인식. 추가 설정 불필요.
    // Google Play / App Store Connect에 등록된 product_id는 런타임에서 register.
  },

  // 거치 모드용 WebView 설정
  server: {
    androidScheme: 'https',
    // 개발 시 hotreload: process.env.CAP_HOTRELOAD === 'true' ? 'http://192.168.x.x:3000' : undefined,
  },
};

export default config;
