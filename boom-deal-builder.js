(() => {
  "use strict";
  const H=window.HuntCore;
  if(!H)return;
  const $=q=>document.querySelector(q);
  const KEY="hunt_deal_builder_v1";
  let current=null;
  let candidates=[];

  const map={
    "dresses":["women-shoes","bags","jewelry-earrings","jewelry-rings","makeup","sunglasses"],
    "eveningdresses":["women-shoes","bags","jewelry-earrings","jewelry-necklaces","makeup"],
    "womensuits":["women-shoes","bags","watches","jewelry-earrings"],
    "tops":["women-jeans","women-bottoms","bags","women-shoes","jewelry"],
    "jeans":["women-tops","women-shoes","bags","belts"],
    "bottoms":["women-tops","women-shoes","bags","belts"],
    "underwear":["women-sleepwear","women-socks","beauty","bags"],
    "hoodies":["women-jeans","men-jeans","women-shoes","men-shoes","sports-bags"],
    "knitwear":["women-jeans","men-jeans","women-shoes","men-shoes"],
    "jackets":["women-jeans","men-jeans","women-shoes","men-shoes"],
    "activewear":["fitness-accessories","sports-bags","active-bottoms"],
    "phonecases":["chargers-cables","power-banks","stands-holders","audio"],
    "phoneaccessories":["phone-cases","chargers-cables","power-banks","stands-holders"],
    "beauty":["beauty-tools","skincare","makeup","body-care"],
    "home":["kitchen","home-storage","lighting","home-decor"],
    "sports":["fitness-accessories","sports-bags","active-bottoms","cycling"],
    "pets":["pet-toys","pet-feeding","pet-grooming","pet-beds"],
    "kids":["kids-shoes","kids-accessories","toys"],
    "women-dresses":["women-shoes","bags","jewelry-earrings","jewelry-rings","makeup","sunglasses"],
    "women-evening":["women-shoes","bags","jewelry-earrings","jewelry-necklaces","makeup"],
    "women-suits":["women-shoes","bags","watches","jewelry-earrings"],
    "women-tops":["women-jeans","women-bottoms","bags","women-shoes","jewelry"],
    "women-jeans":["women-tops","women-shoes","bags","belts"],
    "men-suits":["men-shoes","belts","watches","men-wallets"],
    "men-tops":["men-jeans","men-bottoms","men-shoes","watches"],
    "men-jeans":["men-tops","men-shoes","belts","watches"],
    "phone-cases":["chargers-cables","power-banks","stands-holders","audio"],
    "chargers-cables":["phone-cases","power-banks","stands-holders"],
    "makeup":["beauty-tools","skincare","hair-accessories","bags"],
    "skincare":["beauty-tools","makeup","body-care"],
    "kitchen":["drinkware","home-storage","small-appliances","cleaning"],
    "home-storage":["kitchen","cleaning","home-decor","lighting"],
    "fitness":["fitness-accessories","sports-bags","active-bottoms","cycling"],
    "active-bottoms":["fitness-accessories","sports-bags","women-tops","men-tops"],
    "kids-clothing":["kids-shoes","kids-accessories","toys"],
    "kids-shoes":["kids-clothing","kids-accessories","toys"],
    "baby-clothing":["baby-shoes","baby","toys"],
    "pet-accessories":["pet-toys","pet-feeding","pet-grooming","pet-beds"],
    "pet-beds":["pet-toys","pet-feeding","pet-grooming"],
    "travel":["luggage","bags","phone-accessories"],
    "luggage":["travel","bags","phone-accessories"]
  };

  function read(){
    try{
      const v=JSON.parse(localStorage.getItem(KEY)||"null");
      return v&&typeof v==="object"?v:{anchor:null,items:[]};
    }catch{return {anchor:null,items:[]}}
  }
  function write(v){localStorage.setItem(KEY,JSON.stringify(v));window.dispatchEvent(new CustomEvent("hunt:deal-builder",{detail:v}))}
  function key(x){return String(x?.provider||"")+":"+String(x?.item_id||"")}
  function slug(x){
    const raw=String(x?.category||"").trim();
    if(raw&&H.categoryDefs?.[raw])return raw;
    return String(H.inferCategory?.(x)||raw||"");
  }
  function safeImg(v){try{return new URL(v).protocol==="https:"}catch{return false}}
  function titleFor(s){return H.categoryDefs?.[s]?.title||s.replace(/-/g," ")}
  function price(x){
    const n=Number(x?.retail_price_amount);
    const c=x?.retail_currency||x?.currency||"USD";
    return Number.isFinite(n)&&n>0?H.money(n,c):"Choose options";
  }
  function complementarySlugs(product){
    const s=slug(product);
    let out=map[s]||[];
    if(!out.length){
      for(const [dep,children] of Object.entries(H.departmentSubcategories||{})){
        if(s===dep||(Array.isArray(children)&&children.includes(s))){
          out=(children||[]).filter(x=>x!==s).slice(0,6);
          break;
        }
      }
    }
    return [...new Set(out)].slice(0,6);
  }
  async function loadCandidates(product){
    const slugs=complementarySlugs(product);
    const rows=(await Promise.all(slugs.map(async s=>{
      try{
        const res=await fetch("catalog-shards/"+encodeURIComponent(s)+".json?v=dealbuilder1",{cache:"force-cache"});
        if(!res.ok)return [];
        const data=await res.json();
        return (data?.products||[]).slice(0,36).map(x=>({...x,category:x.category||s,_bundle_reason:titleFor(s)}));
      }catch{return []}
    }))).flat();
    const seen=new Set([key(product)]),clean=[];
    for(const x of rows){
      const k=key(x);
      if(!x?.item_id||seen.has(k)||String(x?.provider||"").toLowerCase()!=="cjdropshipping")continue;
      if(!safeImg(x.image_url))continue;
      seen.add(k);clean.push(x);
    }
    const ranked=clean
      .map(x=>({x,score:(Number(H.personalScore?.(x)||0)*2)+(x.availability_verified?12:0)+(Number(x.retail_price_amount)>0?8:0)+Math.random()*6}))
      .sort((a,b)=>b.score-a.score);
    const perType=new Map(),mixed=[];
    for(const row of ranked){
      const type=String(row.x?._bundle_reason||row.x?.category||"other");
      const n=Number(perType.get(type)||0);
      if(n>=2)continue;
      perType.set(type,n+1);
      mixed.push(row.x);
      if(mixed.length>=8)break;
    }
    candidates=mixed;
  }
  function card(x,state){
    const k=key(x),selected=(state.items||[]).some(i=>i.key===k);
    return '<article class="hd-bundle-card" data-bundle-key="'+H.esc(k)+'">'+
      '<a class="hd-bundle-media" href="'+H.esc(H.productUrl(x))+'"><img src="'+H.esc(x.image_url)+'" alt="'+H.esc(x.title||"Product")+'" loading="lazy"></a>'+
      '<div class="hd-bundle-copy"><small>'+H.esc(x._bundle_reason||"Complete the look")+'</small>'+
      '<a href="'+H.esc(H.productUrl(x))+'">'+H.esc(x.title||"Product")+'</a><strong>'+H.esc(price(x))+'</strong>'+
      '<button type="button" data-bundle-toggle="'+H.esc(k)+'">'+(selected?"Remove":"Add to bundle")+'</button></div></article>';
  }
  function render(){
    const host=$("#hd-deal-builder-grid"),section=$("#hd-deal-builder");
    if(!host||!section||!current)return;
    const state=read();
    host.innerHTML=candidates.map(x=>card(x,state)).join("");
    const count=(state.items||[]).length;
    $("#hd-deal-builder-count").textContent=String(count);
    $("#hd-deal-builder-copy").textContent=count
      ? "BOOM saved "+count+" complementary pick"+(count===1?"":"s")+". Open each item to choose its real color/size before checkout."
      : "Choose complementary products. BOOM keeps the bundle across pages, but every item still needs real options and checkout verification.";
    section.hidden=!candidates.length;
  }
  function ensureAnchor(product){
    const state=read();
    const anchor={key:key(product),provider:product.provider,item_id:product.item_id,title:product.title,category:slug(product)};
    if(!state.anchor||state.anchor.key!==anchor.key)state.anchor=anchor;
    state.items=Array.isArray(state.items)?state.items:[];
    write(state);
  }
  document.addEventListener("click",e=>{
    const btn=e.target.closest?.("[data-bundle-toggle]");
    if(!btn)return;
    const k=btn.dataset.bundleToggle;
    const item=candidates.find(x=>key(x)===k);if(!item)return;
    const state=read();state.items=Array.isArray(state.items)?state.items:[];
    const idx=state.items.findIndex(x=>x.key===k);
    if(idx>=0)state.items.splice(idx,1);
    else state.items.push({key:k,provider:item.provider,item_id:item.item_id,title:item.title,category:slug(item),product_url:H.productUrl(item)});
    write(state);render();
  });
  $("#hd-deal-builder-clear")?.addEventListener("click",()=>{const s=read();s.items=[];write(s);render()});
  $("#hd-deal-builder-checkout")?.addEventListener("click",()=>{location.href="checkout.html#boom-bundle"});
  window.addEventListener("hunt:product-loaded",async e=>{
    current=e.detail?.product||null;if(!current)return;
    ensureAnchor(current);
    await loadCandidates(current);
    render();
  });
})();