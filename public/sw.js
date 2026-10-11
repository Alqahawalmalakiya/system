const CACHE='royal-coffee-shell-v1';
const STATIC_FILES=['/offline.html','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('royal-coffee-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method==='GET'&&url.origin===self.location.origin&&STATIC_FILES.includes(url.pathname)){
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  return;
 }
 // Booking data, API requests and app pages are always fetched live.
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||url.origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).catch(async()=>{
  const offline=await caches.match('/offline.html');
  return offline||new Response('اتصل بالإنترنت لفتح القهوة الملكية.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
 }));
});
