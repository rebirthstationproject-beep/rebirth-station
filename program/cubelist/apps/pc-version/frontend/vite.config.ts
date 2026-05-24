import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tauri WebView2 환경에서 `/assets/...` 절대 경로가 깨지는 경우가 있어 상대 경로 사용.
  // dev (vite serve) 도 정상 작동.
  base: './',
  server: {
    port: 3002,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
  clearScreen: false,
});
