const CACHE_NAME = 'iheratu-v2';
const BASE_PATH = '/IheratU';
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/index.css`,
  `${BASE_PATH}/js/game.js`,
  `${BASE_PATH}/js/Key.js`,
  `${BASE_PATH}/js/mobile.js`,
  `${BASE_PATH}/js/popup.js`,
  `${BASE_PATH}/js/soundjs-0.6.0.min.js`,
  `${BASE_PATH}/assets/clock.png`,
  `${BASE_PATH}/assets/door.png`,
  `${BASE_PATH}/assets/key.png`,
  `${BASE_PATH}/assets/peep.png`,
  `${BASE_PATH}/audio/ding.mp3`,
  `${BASE_PATH}/audio/ding.ogg`,
  `${BASE_PATH}/audio/error.mp3`,
  `${BASE_PATH}/audio/error.ogg`,
  `${BASE_PATH}/audio/jazz.mp3`,
  `${BASE_PATH}/audio/jazz.ogg`,
  `${BASE_PATH}/audio/rewind.mp3`,
  `${BASE_PATH}/audio/rewind.ogg`,
  `${BASE_PATH}/audio/step.mp3`,
  `${BASE_PATH}/audio/step.ogg`,
  `${BASE_PATH}/audio/unlock.mp3`,
  `${BASE_PATH}/audio/unlock.ogg`,
  `${BASE_PATH}/css/intro.png`,
  `${BASE_PATH}/css/levels_bg.png`,
  `${BASE_PATH}/favicon.png`,
  `${BASE_PATH}/thumbnail.png`
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
