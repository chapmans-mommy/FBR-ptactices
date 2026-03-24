// ========== НАЗВАНИЕ КЭША ==========
const CACHE_NAME = 'notes-cache-v2';  // v2 — добавили CSS

// ========== РЕСУРСЫ ДЛЯ КЭШИРОВАНИЯ ==========
const ASSETS = [
    '/',
    './index.html',
    './style.css',      
    './app.js',
    './manifest.json',
    '/icons/icons-icon-16-16.png',
    '/icons/icons-icon-32-32.png',
    '/icons/icons-icon-48-48.png',
    '/icons/icons-icon-64-64.png',
    '/icons/icons-icon-128-128.png',
    '/icons/icons-icon-256-256.png',
    '/icons/icons-icon-512-512.png'
];

// ========== СОБЫТИЕ INSTALL ==========
self.addEventListener('install', event => {
    console.log('[SW] Установка...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем файлы...');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('[SW] Кэширование завершено!');
                return self.skipWaiting();
            })
    );
});

// ========== СОБЫТИЕ ACTIVATE ==========
self.addEventListener('activate', event => {
    console.log('[SW] Активация...');
    
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Удаляем старый кэш:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW] Активация завершена!');
            return self.clients.claim();
        })
    );
});

// ========== СОБЫТИЕ FETCH ==========
self.addEventListener('fetch', event => {
    // Пропускаем запросы, которые не относятся к нашему приложению
    if (!event.request.url.includes('localhost') && !event.request.url.includes('127.0.0.1')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] Из кэша:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('[SW] Из сети:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                        
                        return response;
                    });
            })
    );
});