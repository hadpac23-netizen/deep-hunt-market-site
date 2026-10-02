const CACHE="hunt-shell-pwa7-costprivacy1";
const CORE=[
  "./",
  "./index.html",
  "./category.html",
  "./product.html",
  "./terms.html",
  "./privacy.html",
  "./returns.html",
  "./shipping.html",
  "./legal.css",
  "./hunt-shop.css",
  "./hunt-deal.css",
  "./market-core.js",
  "./storefront-privacy.js?v=source-privacy4",
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
  if(/\/boom-promotions\.js$/i.test(url.pathname) || /\/catalog-(?:home|snapshot|shards\/[^/]+)\.json$/i.test(url.pathname)){
    event.respondWith(networkFirst(request));
    return;
  }
  if(request.mode==="navigate" || /\/(?:storefront-privacy|market-core|product|product-flow|category|profile|hunt-deal|hunt-wow)\.js$/i.test(url.pathname)){
    event.respondWith(networkFirst(request));
    return;
  }
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|json|webmanifest)$/i.test(url.pathname)){
    event.respondWith(staleWhileRevalidate(request));
  }
});
