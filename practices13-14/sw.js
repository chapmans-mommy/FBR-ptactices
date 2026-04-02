const CACHE_NAME = 'app-shell-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';
 

const ASSETS = [
    '/',
    './index.html',
    './style.css',      
    './app.js',
    './manifest.json',
    './icons/icon-icons-16-16.png',
    './icons/icon-icons-32-32.png',
    './icons/icon-icons-48-48.png',
    './icons/icon-icons-64-64.png',
    './icons/icon-icons-128-128.png',
    './icons/icon-icons-256-256.png',
    './icons/icon-icons-512-512.png'
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


// FETCH — разные стратегии
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Пропускаем запросы к другим источникам
    if (url.origin !== location.origin) return;
    
    // Динамический контент (content/*) — Network First
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkRes => {
                    const resClone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, resClone);
                    });
                    return networkRes;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cached => cached || caches.match('/content/home.html'));
                })
        );
        return;
    }
    
    // Статика (App Shell) — Cache First
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
                        const resClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, resClone);
                        });
                        return response;
                    });
            })
    );
});

// ========== PUSH-УВЕДОМЛЕНИЯ ==========
self.addEventListener('push', (event) => {
    let data = { title: '📝 Новая заметка!', body: '' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: '/icons/icon-icons-128-128.png',
        badge: '/icons/icon-icons-48-48.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Обработчик клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});