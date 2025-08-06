const CACHE_NAME = 'bespoke-ai-v1.0.0'
const STATIC_CACHE = 'bespoke-ai-static-v1.0.0'
const RUNTIME_CACHE = 'bespoke-ai-runtime-v1.0.0'

// 캐시할 정적 자산들
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/content',
  '/campaigns',
  '/analytics',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// API 엔드포인트 패턴 (향후 백엔드 통합시 사용)
const API_PATTERNS = [
  /^https?:\/\/api\.bespoke-ai\.com\/.*$/,
  /^https?:\/\/localhost:3001\/api\/.*$/
]

// 이미지 패턴
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/i
]

// 설치 이벤트 - 정적 자산 캐시
self.addEventListener('install', (event) => {
  console.log('ServiceWorker installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      self.skipWaiting()
    ])
  )
})

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('ServiceWorker activating...')
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== STATIC_CACHE &&
                cacheName !== RUNTIME_CACHE &&
                cacheName !== CACHE_NAME
              )
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      self.clients.claim()
    ])
  )
})

// Fetch 이벤트 - 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Chrome extension 요청은 무시
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return
  }

  event.respondWith(handleFetch(request))
})

// 요청 처리 전략
async function handleFetch(request) {
  const url = new URL(request.url)
  
  try {
    // 1. HTML 페이지 - Network First with Cache Fallback
    if (request.mode === 'navigate') {
      return await networkFirstStrategy(request, STATIC_CACHE)
    }

    // 2. API 요청 - Network First with Cache Fallback
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request, RUNTIME_CACHE, 5000)
    }

    // 3. 이미지 - Cache First with Network Fallback
    if (isImageRequest(url)) {
      return await cacheFirstStrategy(request, RUNTIME_CACHE)
    }

    // 4. 정적 자산 - Cache First with Network Fallback
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request, STATIC_CACHE)
    }

    // 5. 기타 - Network First
    return await networkFirstStrategy(request, RUNTIME_CACHE)

  } catch (error) {
    console.error('Fetch handler error:', error)
    
    // 오프라인 페이지 반환 (HTML 요청의 경우)
    if (request.mode === 'navigate') {
      return await getOfflinePage()
    }
    
    throw error
  }
}

// Network First 전략
async function networkFirstStrategy(request, cacheName, timeout = 3000) {
  try {
    const networkPromise = fetch(request)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    })

    const response = await Promise.race([networkPromise, timeoutPromise])
    
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request.clone(), response.clone())
    }
    
    return response
  } catch (error) {
    console.log('Network failed, trying cache:', error.message)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Cache First 전략
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)
  
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request.clone(), response.clone())
  }
  
  return response
}

// 오프라인 페이지 생성
async function getOfflinePage() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>오프라인 - Bespoke AI</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: #f9fafb; 
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 400px;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: #00B06B;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: white;
          font-size: 32px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        p {
          font-size: 16px;
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .retry-btn {
          background: #00B06B;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .retry-btn:hover {
          background: #008d56;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>오프라인 상태</h1>
        <p>인터넷 연결을 확인하고 다시 시도해주세요. 일부 기능은 오프라인에서도 사용할 수 있습니다.</p>
        <button class="retry-btn" onclick="location.reload()">다시 시도</button>
      </div>
    </body>
    </html>
  `
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// 유틸리티 함수들
function isApiRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.href))
}

function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.') // 확장자가 있는 파일
  )
}

// 백그라운드 동기화 (향후 확장)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // 오프라인 상태에서 저장된 데이터를 서버와 동기화
  console.log('Performing background sync')
}

// 푸시 알림 (향후 확장)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url ? { url: data.url } : undefined,
      actions: [
        {
          action: 'open',
          title: '보기'
        },
        {
          action: 'close', 
          title: '닫기'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Bespoke AI', options)
    )
  }
})

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' && event.notification.data?.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  } else if (event.action !== 'close') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})