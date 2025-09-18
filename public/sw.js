// Service Worker for ErrorX Forum PWA
const CACHE_NAME = 'errorx-forum-v1';
const STATIC_CACHE_NAME = 'errorx-static-v1';
const DYNAMIC_CACHE_NAME = 'errorx-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/signin',
  '/signup',
  '/offline',
  '/manifest.json',
  '/logo-light.png',
  '/logo-dark.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/posts',
  '/api/categories',
  '/api/users/profile',
  '/api/notifications'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // API routes - network first with fallback
    if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME);
    }
    
    // Next.js pages and other assets - stale while revalidate
    if (url.pathname.startsWith('/_next/') || 
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.svg')) {
      return await staleWhileRevalidate(request, STATIC_CACHE_NAME);
    }
    
    // HTML pages - network first with offline fallback
    if (request.headers.get('accept')?.includes('text/html')) {
      return await networkFirstWithOfflineFallback(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default - network only
    return await fetch(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return await cache.match('/offline') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network error', { status: 503 });
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  if (response.status === 200) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cached || fetchPromise;
}

// Network first with offline fallback
async function networkFirstWithOfflineFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    return await staticCache.match('/offline') || new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'post-sync') {
    event.waitUntil(syncPosts());
  } else if (event.tag === 'comment-sync') {
    event.waitUntil(syncComments());
  } else if (event.tag === 'reaction-sync') {
    event.waitUntil(syncReactions());
  }
});

// Sync offline posts
async function syncPosts() {
  try {
    const db = await openDB();
    const posts = await getAllFromStore(db, 'offline-posts');
    
    for (const post of posts) {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(post.data),
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'offline-posts', post.id);
          console.log('[SW] Synced offline post:', post.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync post:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Sync offline comments
async function syncComments() {
  try {
    const db = await openDB();
    const comments = await getAllFromStore(db, 'offline-comments');
    
    for (const comment of comments) {
      try {
        const response = await fetch(`/api/posts/${comment.postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comment.data),
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'offline-comments', comment.id);
          console.log('[SW] Synced offline comment:', comment.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync comment:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Sync offline reactions
async function syncReactions() {
  try {
    const db = await openDB();
    const reactions = await getAllFromStore(db, 'offline-reactions');
    
    for (const reaction of reactions) {
      try {
        const response = await fetch(`/api/posts/${reaction.postId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reaction.data),
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'offline-reactions', reaction.id);
          console.log('[SW] Synced offline reaction:', reaction.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync reaction:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('errorx-forum', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-posts')) {
        db.createObjectStore('offline-posts', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offline-comments')) {
        db.createObjectStore('offline-comments', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offline-reactions')) {
        db.createObjectStore('offline-reactions', { keyPath: 'id' });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'notification',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/';
  
  if (data.url) {
    url = data.url;
  } else if (data.postId) {
    url = `/posts/${data.postId}`;
  } else if (data.conversationId) {
    url = `/conversations/${data.conversationId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Service worker loaded');