const CACHE_NAME = 'iheratu-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/game.js',
  '/js/Key.js',
  '/js/mobile.js',
  '/js/popup.js',
  '/js/soundjs-0.6.0.min.js',
  '/assets/clock.png',
  '/assets/door.png',
  '/assets/key.png',
  '/assets/peep.png',
  '/audio/ding.mp3',
  '/audio/ding.ogg',
  '/audio/error.mp3',
  '/audio/error.ogg',
  '/audio/jazz.mp3',
  '/audio/jazz.ogg',
  '/audio/rewind.mp3',
  '/audio/rewind.ogg',
  '/audio/step.mp3',
  '/audio/step.ogg',
  '/audio/unlock.mp3',
  '/audio/unlock.ogg',
  '/css/intro.png',
  '/css/levels_bg.png',
  '/favicon.png',
  '/thumbnail.png'
];

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求 - 优先使用缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，返回缓存的资源
        if (response) {
          return response;
        }
        // 缓存未命中，从网络获取
        return fetch(event.request).then(
          response => {
            // 检查是否是有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 克隆响应并缓存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
      .catch(() => {
        // 网络和缓存都失败时的后备方案
        return caches.match('/index.html');
      })
  );
});
