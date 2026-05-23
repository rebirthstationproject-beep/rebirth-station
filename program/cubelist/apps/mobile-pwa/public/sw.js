/* 큐브 리스트 서비스 워커
 *
 * 정착 원칙
 * - 캐싱 전략: 정적 자산은 stale-while-revalidate, API는 network-first
 * - 등록 실패는 사용자에게 알림 (정착본 §3 — 기존 jusomoa의 SW silent-fail 패턴 회피)
 * - Wake Lock과 무관 (Wake Lock은 페이지 컨텍스트)
 */

const CACHE_NAME = 'cubelist-v1';
const STATIC_ASSETS = [
  '/',
  '/list',
  '/pair',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase API/Realtime은 캐시 우회
  if (url.host.endsWith('.supabase.co')) return;
  // WS는 fetch 이벤트와 무관

  // HTML은 network-first (최신 화면 우선)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r ?? caches.match('/list'))),
    );
    return;
  }

  // 정적 자산은 stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
