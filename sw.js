// Znalostní báze Sladké dílny – práce bez internetu.
// Vždy se nejdřív zkusí web (aby byla data aktuální); když není internet, použije se poslední uložená verze.
const CACHE = 'kb-v1';
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./', './data.js', './manifest.webmanifest']).catch(()=>{})));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k !== CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
function save(key, res){
  if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(key, copy)); }
  return res;
}
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;          // GitHub API, YouTube apod. se neukládají
  const key = url.origin + url.pathname;             // bez ?t=… (data.js se načítá s časovou značkou)
  if(url.pathname.indexOf('/images/') !== -1){        // obrázky se nemění (název = otisk obsahu)
    e.respondWith(caches.match(key).then(hit=>hit || fetch(req).then(res=>save(key, res))));
    return;
  }
  e.respondWith(
    fetch(req).then(res=>save(key, res)).catch(()=>
      caches.match(key)
        .then(hit=>hit || (req.mode === 'navigate' ? caches.match(url.origin + url.pathname.replace(/[^\/]*$/, '')) : null))
        .then(hit=>hit || Response.error())
    )
  );
});
