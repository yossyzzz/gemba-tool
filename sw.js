// 現場ツール PRO — Service Worker v1.0
const CACHE_NAME = 'gemba-tool-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// インストール時: 静的アセットをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ: キャッシュ優先 → ネットワーク fallback
self.addEventListener('fetch', e => {
  // Anthropic API と外部リクエストはキャッシュしない
  if (e.request.url.includes('anthropic.com') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('unsplash.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 成功レスポンスのみキャッシュ
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
