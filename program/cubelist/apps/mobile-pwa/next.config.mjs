/** @type {import('next').NextConfig} */
const runtime = process.env.NEXT_PUBLIC_RUNTIME ?? 'web';
const isStatic = runtime === 'tauri' || runtime === 'capacitor';

const nextConfig = {
  // Tauri/Capacitor 빌드 시 static export
  // - Tauri: apps/pc-helper/tauri.conf.json의 frontendDist=out/
  // - Capacitor: apps/mobile/capacitor.config.ts의 webDir=../web/out
  output: isStatic ? 'export' : undefined,
  images: {
    unoptimized: isStatic,
  },
  // 거치 모드 PWA 최적화
  experimental: {
    optimizePackageImports: ['@dnd-kit/core', '@dnd-kit/sortable', 'embla-carousel-react'],
  },
};

export default nextConfig;
