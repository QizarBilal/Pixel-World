const CACHE = 'pixel-world-v4'
const OFFLINE_PAGE = './index.html'

self.addEventListener('install', (event) =>
{
    self.skipWaiting()
    event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_PAGE)))
})

self.addEventListener('activate', (event) =>
{
    event.waitUntil(Promise.all([
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
        self.clients.claim()
    ]))
})

self.addEventListener('fetch', (event) =>
{
    if(event.request.method !== 'GET') return
    const requestURL = new URL(event.request.url)

    // Network-first navigations prevent stale HTML from referencing assets
    // removed by a newer atomic Netlify deployment.
    if(event.request.mode === 'navigate')
    {
        event.respondWith(fetch(event.request).then((response) =>
        {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(OFFLINE_PAGE, copy))
            return response
        }).catch(async() => (await caches.match(OFFLINE_PAGE)) || Response.error()))
        return
    }

    if(requestURL.origin === self.location.origin && requestURL.pathname.includes('/assets/'))
    {
        event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) =>
        {
            if(response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
            return response
        })))
    }
})
