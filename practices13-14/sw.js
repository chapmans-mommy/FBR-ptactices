
const CACHE_NAME = 'notes-cache-v2';  

const ASSETS = [
    '/',
    './practices13-14/index.html',
    './practices13-14/style.css',      
    './practices13-14/app.js',
    './practices13-14/manifest.json',
    './practices13-14/icons/icon-icons-16-16.png',
    './practices13-14/icons/icon-icons-32-32.png',
    './practices13-14/icons/icon-icons-48-48.png',
    './practices13-14/icons/icon-icons-64-64.png',
    './practices13-14/icons/icon-icons-128-128.png',
    './practices13-14/icons/icon-icons-256-256.png',
    './practices13-14/icons/icon-icons-512-512.png'
];

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