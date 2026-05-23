import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { IapInitializer } from '@/components/iap/IapInitializer';
import { I18nProvider } from '@/lib/i18n/useTranslation';
import { ThemeProvider } from '@/lib/theme/useTheme';
import { ToastProvider } from '@/lib/toast/useToast';
import './globals.css';

export const metadata: Metadata = {
  title: '큐브 리스트 — 리버스 스테이션',
  description: '안 쓰는 폰을 거치형 컨트롤 패널로. 한국어 우선.',
  applicationName: '큐브 리스트',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '큐브 리스트',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1d20',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* FOUC 방지 — hydration 전 html.class 선반영. default = dark (사용자 결정 2026-05-22). */}
        <Script id="cubelist-theme-init" strategy="beforeInteractive">
          {`(function(){try{var c=localStorage.getItem('cubelist:theme');var d=(c==='dark')||(c==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches)||(!c);if(d){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`}
        </Script>
      </head>
      <body className="bg-surface text-ink">
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              {children}
              <ServiceWorkerRegister />
              <IapInitializer />
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
