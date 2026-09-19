const CACHE="hunt-shell-pwa3";
const CORE=[
  "./",
  "./index.html",
  "./category.html",
  "./search.html",
  "./product.html",
  "./hunt-shop.css",
  "./hunt-deal.css",
  "./hunt-home-3.css",
  "./hunt-building.css",
  "./hunt-attention-architecture.css",
  "./hunt-decision-confidence.css",
  "./market-core.js",
  "./hunt-home-3.js",
  "./hunt-attention-architecture.js",
  "./hunt-attention-guard.js",
  "./hunt-browse-continuity.js",
  "./product.js",
  "./category.js",
  "./search.js",
  "./hunt-icon.svg",
  "./manifest.webmanifest"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

async function networkFirst(request){
  try{
    const response=await fetch(request);
    if(response?.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone());
    }
    return response;
  }catch{
    return (await caches.match(request)) || (await caches.match("./index.html"));
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response?.ok)cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==="navigate"){
    event.respondWith(networkFirst(request));
    return;
  }
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|json|webmanifest)$/i.test(url.pathname)){
    event.respondWith(staleWhileRevalidate(request));
  }
});
