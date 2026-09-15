(() => {
  "use strict";
  const H=window.HuntCore;
  if(!H)return;
  const $=q=>document.querySelector(q);
  let manifest=null;
  const seen=new Set();

  const worlds={
    women:[
      {title:"Style rotation",copy:"T-shirts, blouses, jeans, jackets, underwear, shoes and slippers.",slugs:["women-tshirts","women-blouses","women-jeans","women-outerwear","women-underwear","women-shoes","women-slippers","women-socks","women-hosiery"]},
      {title:"Jewelry & accessories",copy:"Rings, earrings, necklaces, bracelets, sunglasses, bags and hair accessories.",slugs:["jewelry-rings","jewelry-earrings","jewelry-ear-cuffs","jewelry-necklaces","jewelry-pendants","jewelry-bracelets","jewelry-anklets","jewelry-sets","sunglasses","bags","hair-accessories","headbands","hair-clips"]},
      {title:"Beauty, hair & fragrance",copy:"Makeup, skincare, nails, hair tools, body care and fragrance.",slugs:["makeup","skincare","nails","hair-tools","hair","beauty-tools","body-care","fragrance"]},
      {title:"Useful everyday",copy:"Phone stands, chargers, power banks, audio and practical electronics.",slugs:["stands-holders","chargers-cables","power-banks","audio","electronics","wearables","projectors"]},
      {title:"Home & organize",copy:"Storage, lighting, small appliances and useful home finds.",slugs:["home-storage","cable-management","lighting","sensor-lighting","air-care","portable-vacuums","kitchen-electric","small-appliances","cleaning","home-decor"]}
    ],
    men:[
      {title:"Men's style",copy:"T-shirts, jeans, ripped and baggy denim, jackets, underwear, shoes and slippers.",slugs:["men-tops","men-jeans","men-ripped-jeans","men-baggy-jeans","men-outerwear","men-underwear","men-shoes","men-slippers","men-socks"]},
      {title:"Accessories & finish",copy:"Watches, belts, wallets, bags and selected accessories.",slugs:["watches","belts","men-wallets","men-bags","men-accessories"]},
      {title:"Grooming & fragrance",copy:"Fragrance, skincare, hair and body-care finds.",slugs:["fragrance","skincare","hair","body-care","beauty-tools"]},
      {title:"Useful tech",copy:"Phone stands, chargers, power banks, audio, wearables and electronics.",slugs:["stands-holders","chargers-cables","power-banks","audio","wearables","electronics","computer-accessories","projectors"]},
      {title:"Sports, travel & everyday",copy:"Fitness gear, travel, luggage and practical storage.",slugs:["fitness","fitness-accessories","sports-gear","travel","luggage","home-storage"]}
    ],
    general:[
      {title:"Trending across HUNT",copy:"A dynamic mix of fashion, accessories and useful finds.",slugs:["women-tshirts","men-tops","bags","watches","jewelry","electronics"]},
      {title:"Useful everyday",copy:"Phone, charging, organization and practical home products.",slugs:["stands-holders","chargers-cables","power-banks","home-storage","cable-management","sensor-lighting","air-care","portable-vacuums","kitchen-electric","small-appliances","projectors"]},
      {title:"Beauty & accessories",copy:"Jewelry, beauty, hair, nails and fragrance.",slugs:["jewelry-earrings","jewelry-rings","makeup","hair-tools","nails","fragrance"]}
    ]
  };

  function key(item){return String(item?.provider||"")+":"+String(item?.item_id||"")}
  function safeHttps(value){try{return new URL(value).protocol==="https:"}catch{return false}}
  function detectGender(product){
    const dep=String(product?.department||product?.category||"").toLowerCase();
    const gender=String(product?.gender||"").toLowerCase();
    const title=String(product?.title||"").toLowerCase();
    if(gender==="women"||dep==="women"||/\b(women(?:'s)?|woman|female|ladies)\b/.test(title))return "women";
    if(gender==="men"||dep==="men"||/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title))return "men";
    if(dep.startsWith("women-"))return "women";
    if(dep.startsWith("men-"))return "men";
    return "general";
  }
  async function getManifest(){
    if(manifest)return manifest;
    const res=await fetch("catalog-manifest.json?v=taxonomy6",{cache:"force-cache"});
    if(!res.ok)throw new Error("Catalog manifest unavailable");
    manifest=await res.json();
    return manifest;
  }
  async function loadSlug(slug){
    try{
      const m=await getManifest();
      const info=m?.categories?.[slug];
      const page=Array.isArray(info?.pages)?info.pages[0]:null;
      if(!page)return [];
      const res=await fetch(page+"?v=taxonomy6",{cache:"force-cache"});
      if(!res.ok)return [];
      const data=await res.json();
      return (Array.isArray(data?.products)?data.products:[]).map(x=>({...x,category:x.category||slug}));
    }catch{return []}
  }
  function baseScore(item,slug){
    let score=0;
    if(String(item?.category||"")===slug)score+=18;
    if(item?.availability_verified===true)score+=12;
    const price=Number(item?.retail_price_amount);
    if(Number.isFinite(price)&&price>0)score+=8;
    score+=Math.min(18,Number(H.personalScore?.(item)||0));
    score+=Number(window.HuntSupplierGravity?.productBoost?.(item)||0);
    return score;
  }
  function pick(rows,slug,limit=4,currentKey=""){
    const unique=[];
    const local=new Set();
    for(const item of rows){
      const k=key(item);
      if(!item?.item_id||k===currentKey||seen.has(k)||local.has(k)||!safeHttps(item.image_url))continue;
      local.add(k);unique.push(item);
    }
    const ranked=window.HuntSupplierGravity?.rankProducts
      ? window.HuntSupplierGravity.rankProducts(unique,{baseScore:item=>baseScore(item,slug)})
      : unique.sort((a,b)=>baseScore(b,slug)-baseScore(a,slug));
    return ranked.slice(0,limit);
  }
  function price(item){
    const n=Number(item?.retail_price_amount);
    const c=item?.retail_currency||item?.currency||"USD";
    return Number.isFinite(n)&&n>0?H.money(n,c):"View product";
  }
  function card(item,slug){
    const href=H.productUrl(item);
    return '<article class="hd-shelf-card" role="listitem" data-category="'+H.esc(slug)+'">'+
      '<a class="hd-shelf-media" href="'+H.esc(href)+'"><img src="'+H.esc(item.image_url)+'" alt="'+H.esc(item.title||"Product")+'" loading="lazy"></a>'+
      '<div class="hd-shelf-card-body"><small>'+H.esc(item.provider||"HUNT")+'</small>'+
      '<a class="hd-shelf-title" href="'+H.esc(href)+'">'+H.esc(item.title||"Product")+'</a>'+
      '<strong class="hd-shelf-price">'+H.esc(price(item))+'</strong></div></article>';
  }
  async function buildGroup(group,currentKey){
    const loaded=await Promise.all(group.slugs.map(async slug=>({slug,rows:await loadSlug(slug)})));
    const selected=[];
    for(const source of loaded){
      const rows=pick(source.rows,source.slug,2,currentKey);
      for(const item of rows){
        if(selected.length>=6)break;
        const k=key(item); if(seen.has(k))continue;
        seen.add(k); selected.push({...item,_world_slug:source.slug});
      }
      if(selected.length>=6)break;
    }
    if(!selected.length)return "";
    return '<section class="hd-market-shelf hd-life-world-shelf">'+
      '<div class="hd-market-shelf-head"><div><small>BOOM STYLE & LIFE</small><h3>'+H.esc(group.title)+'</h3><p>'+H.esc(group.copy)+'</p></div></div>'+
      '<div class="hd-shelf-track" role="list">'+selected.map(x=>card(x,x._world_slug)).join("")+'</div>'+
      '</section>';
  }
  async function init(product){
    const root=$("#hd-life-world"),host=$("#hd-life-world-groups");
    if(!root||!host||!product)return;
    seen.clear();seen.add(key(product));
    const gender=detectGender(product);
    const groups=worlds[gender]||worlds.general;
    const html=(await Promise.all(groups.map(g=>buildGroup(g,key(product))))).filter(Boolean).join("");
    if(!html)return;
    $("#hd-life-world-title").textContent=gender==="women"?"More for her":gender==="men"?"More for him":"Explore more around you";
    $("#hd-life-world-copy").textContent="BOOM mixes style, accessories, beauty, useful tech and everyday finds. Saved and liked products stay pinned while the rest can rotate.";
    host.innerHTML=html;
    root.hidden=false;
    window.HuntAnalytics?.recommendationImpression?.({placement:"style_life_world",items:[...host.querySelectorAll("a[href*='product.html']")].slice(0,12).map(a=>({href:a.href}))});
  }
  window.addEventListener("hunt:product-loaded",e=>init(e.detail?.product));
})();