// public/sw.js - Service Worker completo corregido

const CACHE_NAME = 'roulette-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Assets estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Assets dinámicos (JS, CSS generados por Vite)
const DYNAMIC_PATTERNS = [
  /\/assets\/.*\.(js|css)$/,
  /\/src\/.*\.(js|ts|css)$/
];

// Assets de imágenes de premios
const IMAGE_PATTERNS = [
  /\/images\/premio-[1-8]\.(jpg|png|webp)$/
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Pre-cache de imágenes de premios
      caches.open(CACHE_NAME).then((cache) => {
        console.log('🖼️ Pre-caching prize images');
        const prizeImages = [];
        for (let i = 1; i <= 8; i++) {
          prizeImages.push(`/images/premio-${i}.jpg`);
        }
        // Usar Promise.allSettled para evitar fallos totales
        return Promise.allSettled(
          prizeImages.map(url => cache.add(url))
        ).then(results => {
          const failed = results.filter(r => r.status === 'rejected');
          if (failed.length > 0) {
            console.warn('Some prize images failed to cache:', failed);
          }
        });
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control de todos los clientes
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origin
  if (url.origin !== location.origin) {
    return;
  }

  // Estrategia para diferentes tipos de recursos
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request, url));
  }
});

async function handleGetRequest(request, url) {
  const pathname = url.pathname;

  try {
    // 1. Assets estáticos - Cache First
    if (STATIC_ASSETS.includes(pathname) || pathname === '/' || pathname === '/index.html') {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // 2. Assets dinámicos (JS, CSS) - Stale While Revalidate
    if (DYNAMIC_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE);
    }

    // 3. Imágenes de premios - Cache First con fallback
    if (IMAGE_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await cacheFirst(request, CACHE_NAME);
    }

    // 4. API calls o recursos externos - Network First
    if (pathname.startsWith('/api/')) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }

    // 5. Otros recursos - Network First con cache fallback
    return await networkFirst(request, DYNAMIC_CACHE);

  } catch (error) {
    console.error('Error handling request:', request.url, error);
    
    // Fallback para navegación
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Fallback genérico
    return new Response('Offline - Recurso no disponible', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Estrategias de caching

// Cache First - Buscar en cache primero, luego red
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // CORRECCIÓN: Verificar que el response se pueda clonar
      if (networkResponse.body && !networkResponse.bodyUsed) {
        const cache = await caches.open(cacheName);
        // Clonar ANTES de usar
        const responseToCache = networkResponse.clone();
        cache.put(request, responseToCache).catch(err => {
          console.warn('Cache put failed:', err);
        });
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for:', request.url);
    throw error;
  }
}

// Network First - Buscar en red primero, luego cache
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // CORRECCIÓN: Verificar que el response se pueda clonar
      if (networkResponse.body && !networkResponse.bodyUsed) {
        const cache = await caches.open(cacheName);
        // Clonar ANTES de usar
        const responseToCache = networkResponse.clone();
        cache.put(request, responseToCache).catch(err => {
          console.warn('Cache put failed:', err);
        });
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate - Devolver cache y actualizar en background
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Background fetch - NO ESPERAR por este
  fetch(request).then(response => {
    if (response.ok && response.body && !response.bodyUsed) {
      caches.open(cacheName).then(cache => {
        // Clonar ANTES de usar
        const responseToCache = response.clone();
        cache.put(request, responseToCache).catch(err => {
          console.warn('Background cache update failed:', err);
        });
      });
    }
  }).catch(error => {
    console.log('Background fetch failed for:', request.url);
  });

  // Devolver cache inmediatamente si existe
  if (cachedResponse) {
    return cachedResponse;
  }

  // Si no hay cache, hacer fetch síncrono
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.body && !networkResponse.bodyUsed) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch(err => {
        console.warn('Initial cache put failed:', err);
      });
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Utilidades
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      count: keys.length,
      size: await getCacheSize(cache, keys)
    };
  }
  
  return status;
}

async function getCacheSize(cache, keys) {
  let totalSize = 0;
  
  for (const request of keys) {
    try {
      const response = await cache.match(request);
      if (response && response.body && !response.bodyUsed) {
        const clone = response.clone();
        const blob = await clone.blob();
        totalSize += blob.size;
      }
    } catch (error) {
      // Ignorar errores individuales
    }
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Background Sync (si es soportado)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-roulette') {
      event.waitUntil(doBackgroundSync());
    }
  });
}

async function doBackgroundSync() {
  // Implementar sincronización en background si es necesario
  console.log('Background sync triggered');
}

// Push notifications (si es necesario)
if ('push' in self.registration) {
  self.addEventListener('push', (event) => {
    const options = {
      body: event.data ? event.data.text() : 'Nueva notificación',
      icon: '/pwa-192x192.png',
      badge: '/favicon-mask.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver más'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('Ruleta de Premios', options)
    );
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
      event.waitUntil(
        clients.openWindow('/')
      );
    }
  });
}

console.log('🎰 Service Worker loaded - Ruleta de Premios v1.0.0');