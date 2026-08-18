/* 我们的光年 —— 离线缓存 Service Worker（Phase 5 PWA）
 * 策略：
 *  - 页面导航：网络优先，离线时回退到缓存的 index.html（保证拿到最新版本）
 *  - 静态资源：stale-while-revalidate（先用缓存秒开，后台静默更新）
 *  - 跨域请求（Google Fonts 等）不拦截
 * 版本号在变更缓存策略时手动递增即可（如 v1 → v2）触发全量更新
 */
const CACHE = 'our-light-years-v1'

// 首次安装时预缓存的核心页面与入口文件
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // 立即接管新版本
  )
})

self.addEventListener('activate', (event) => {
  // 清理旧版本的缓存，避免陈旧资源残留
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // 只处理同源请求，跨域（字体/外部图片）交给浏览器默认行为
  if (url.origin !== self.location.origin) return

  // 页面导航（HashRouter 下始终命中 /index.html）：网络优先，失败回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 每次拿到最新页面即更新缓存副本
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // 静态资源（JS/CSS/图片等）：缓存优先，后台刷新
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
