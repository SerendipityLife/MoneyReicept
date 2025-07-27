const CACHE_NAME = 'receipt-manager-v1';
const API_CACHE_NAME = 'receipt-manager-api-v1';

// Files to cache for offline use
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icon/favicon.png',
  '/assets/icon/icon.png',
  // Add other static assets
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/receipts',
  '/api/budget/summary',
  '/api/settings'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      caches.open(API_CACHE_NAME)
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static resources
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with cache-first strategy for GET, network-first for others
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  if (request.method === 'GET') {
    // Cache-first strategy for GET requests
    try {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Try to update cache in background
        fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        }).catch(() => {
          // Ignore network errors in background update
        });
        
        return cachedResponse;
      }
      
      // If not in cache, try network
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
      
    } catch (error) {
      // Return cached version if available
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline response
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'No cached data available' 
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } else {
    // Network-first strategy for POST, PUT, DELETE
    try {
      const networkResponse = await fetch(request);
      
      // If successful, invalidate related cache entries
      if (networkResponse.ok) {
        await invalidateRelatedCache(request);
      }
      
      return networkResponse;
    } catch (error) {
      // Store request for later sync
      await storeFailedRequest(request);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          offline: true,
          message: 'Request stored for sync when online' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
  try {
    // Try network first for HTML files to get updates
    if (request.destination === 'document') {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        // Fall back to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
    }
    
    // Cache-first for other static resources
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
    
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Invalidate cache entries related to the request
async function invalidateRelatedCache(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const url = new URL(request.url);
  
  // Invalidate related cache entries based on the request
  if (url.pathname.includes('/receipts')) {
    const keys = await cache.keys();
    const receiptsKeys = keys.filter(key => 
      key.url.includes('/api/receipts') || 
      key.url.includes('/api/budget')
    );
    
    await Promise.all(receiptsKeys.map(key => cache.delete(key)));
  }
}

// Store failed requests for later sync
async function storeFailedRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  // Store in IndexedDB for persistence
  const db = await openDB();
  const transaction = db.transaction(['failed_requests'], 'readwrite');
  const store = transaction.objectStore('failed_requests');
  await store.add(requestData);
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReceiptManagerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('failed_requests')) {
        const store = db.createObjectStore('failed_requests', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

async function syncFailedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failed_requests'], 'readonly');
    const store = transaction.objectStore('failed_requests');
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove from failed requests
          const deleteTransaction = db.transaction(['failed_requests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('failed_requests');
          await deleteStore.delete(requestData.id);
        }
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing failed requests:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/icon/icon.png',
      badge: '/assets/icon/badge.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle action buttons
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data.url || '/');
      break;
    case 'dismiss':
      // Just close the notification
      break;
    default:
      clients.openWindow('/');
  }
}