/* Service Worker - 离线缓存 + PWA 安装支持 */
const CACHE_NAME = 'ledger-app-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  // Chart.js CDN 也缓存一份，离线时图表仍能渲染
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// 安装：预缓存所有资源
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{})
  );
});

// 激活：清理旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

// 请求拦截：网络优先，失败回退到缓存
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  event.respondWith(
    fetch(req).then(resp => {
      // 成功获取则更新缓存
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(c => { try{ c.put(req, copy); }catch(e){} });
      return resp;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
