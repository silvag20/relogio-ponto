// Service worker: deixa o app abrir sem internet (a marcação offline é tratada em index.html)
const CACHE = 'relogio-ponto-v1';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const ARQUIVOS = ['./','index.html','manifest.json','icon-192.png','icon-512.png',
  'assets/logo-grupo-calissa.png','assets/marca-dagua-leve.png','assets/marca-dagua.png'];

self.addEventListener('install', e=>{
  e.waitUntil((async()=>{
    const c = await caches.open(CACHE);
    await Promise.all(ARQUIVOS.map(a=>c.add(a).catch(()=>{})));
    try{ await c.add(new Request(CDN, {mode:'no-cors'})); }catch(err){}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n=>n!==CACHE).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);
  const mesmaOrigem = url.origin===self.location.origin;
  if(!mesmaOrigem && req.url!==CDN) return; // chamadas ao Supabase passam direto
  e.respondWith((async()=>{
    const c = await caches.open(CACHE);
    try{
      const resp = await fetch(req);
      if(resp && (resp.ok || resp.type==='opaque')) c.put(req, resp.clone());
      return resp;
    }catch(err){
      const guardado = await c.match(req, {ignoreSearch:true}) || (req.mode==='navigate' ? await c.match('index.html') : null);
      if(guardado) return guardado;
      throw err;
    }
  })());
});
