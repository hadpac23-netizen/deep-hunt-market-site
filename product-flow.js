(() => {
  const H=window.HuntCore, runtime=window.BoomRuntime;
  if(!H)return;
  const client=runtime?.getSupabaseClient?.() || null;
  const $=q=>document.querySelector(q);
  let current=null;
  let pool=[];
  let recommendations={similar:[],complementary:[],discover:[]};
  let cursor=0;
  let loading=false;
  let observer=null;
  const seen=new Set();

  function key(item){return String(item?.provider||"")+":"+String(item?.item_id||"")}
  const categoryAliases={
    "women-dresses":"dresses","men-dresses":"dresses",
    "women-tops":"tops","men-tops":"tops",
    "women-shirts":"tops","men-shirts":"tops",
    "women-bottoms":"bottoms","men-bottoms":"bottoms",
    "women-jeans":"bottoms","men-jeans":"bottoms",
    "women-skirts":"dresses",
    "women-knitwear":"knitwear","men-knitwear":"knitwear",
    "women-hoodies":"hoodies","men-hoodies":"hoodies",
    "women-outerwear":"jackets","men-outerwear":"jackets","men-jackets":"jackets","women-jackets":"jackets",
    "women-swimwear":"swimwear","men-swimwear":"swimwear",
    "women-socks":"socks","men-socks":"socks",
    "women-shoes":"shoes","men-shoes":"shoes",
    "women-bags":"bags","men-bags":"bags",
    "women-accessories":"accessories","men-accessories":"accessories",
    "men-boxers":"underwear","men-underwear":"underwear","women-underwear":"underwear",
    "hair-accessories":"hairaccessories",
    "phone-accessories":"phoneaccessories",
    "jewelry-sets":"jewelrysets"
  };
  function normalizeSlug(value){
    const raw=String(value||"").trim().toLowerCase().replace(/\s+/g,"-");
    return categoryAliases[raw]||raw.replace(/^(women|men)-/,"");
  }
  function categoryOf(item){
    const explicit=normalizeSlug(item?.hunt_shelf||item?.storefront_shelf||item?.canonical_shelf||item?.category||"");
    const inferred=normalizeSlug(H.inferCategory(item)||"");
    if(!explicit)return inferred;
    if(explicit==="accessories"&&inferred&&inferred!=="accessories")return inferred;
    return explicit;
  }
  function exactIdentity(item,slug){
    const s=normalizeSlug(slug),t=String(item?.title||"").toLowerCase();
    const inferred=normalizeSlug(H.inferCategory(item)||"");
    const exact={
      dresses:()=>/\b(dress|dresses|gown|gowns)\b/.test(t)&&!/\b(tree skirt|christmas tree skirt)\b/.test(t),
      socks:()=>/\b(sock|socks)\b/.test(t),
      swimwear:()=>/\b(swimwear|swimsuit|swim shorts|swimming trunks|board shorts|boardshorts|bikini)\b/.test(t),
      shoes:()=>/\b(shoe|shoes|sneaker|sneakers|loafer|loafers|boots?|sandals?|slides?|heels?)\b/.test(t),
      bags:()=>/\b(handbag|purse|tote|crossbody|backpack|duffel|duffle|shoulder bag|messenger bag|chest bag|\bbag\b)\b/.test(t),
      earrings:()=>/\b(earring|earrings|stud earrings?|hoop earrings?)\b/.test(t),
      necklaces:()=>/\b(necklace|necklaces|pendant|pendants|choker|chokers)\b/.test(t),
      bracelets:()=>/\b(bracelet|bracelets|bangle|bangles)\b/.test(t),
      rings:()=>/\b(ring|rings|signet ring|band ring)\b/.test(t),
      hoodies:()=>/\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/.test(t),
      knitwear:()=>/\b(sweater|sweaters|cardigan|cardigans|knitwear|pullover)\b/.test(t),
      jackets:()=>/\b(jacket|jackets|coat|coats|parka|windbreaker|bomber|trench)\b/.test(t),
      underwear:()=>/\b(boxer|boxers|brief|briefs|underwear|underpants|trunks)\b/.test(t),
      hats:()=>/\b(hat|hats|cap|caps|beanie|bucket hat)\b/.test(t),
      hairaccessories:()=>/\b(hair clip|hairpin|headband|scrunchie|barrette|hair accessory)\b/.test(t),
      lighting:()=>/\b(lamp|lamps|lighting|night light|desk light|ceiling light|led light)\b/.test(t),
      kitchen:()=>/\b(kitchen|cookware|utensil|bakeware|lunch box|food storage)\b/.test(t),
      storage:()=>/\b(storage|organizer|closet|rack|shelf|shelving)\b/.test(t)
    };
    if(exact[s])return exact[s]();
    return inferred===s || categoryOf(item)===s;
  }
  function safeHttps(value){try{return new URL(value).protocol==="https:"}catch{return false}}
  function price(item){
    const n=Number(item?.price_amount);
    return Number.isFinite(n)&&n>0?H.money(n,item.currency||"USD"):"View product";
  }
  function categoryTitle(slug){return H.categoryDefs?.[slug]?.title||slug||"More"}
  function isWomen(item){
    const title=String(item?.title||"").toLowerCase();
    const gender=String(item?.gender||"").toLowerCase();
    if(gender==="women")return true;
    if(/\bunisex\b/.test(title))return false;
    const w=/\b(women(?:'s)?|woman|female|ladies)\b/.test(title);
    const m=/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title);
    return w&&!m;
  }
  function isMen(item){
    const title=String(item?.title||"").toLowerCase();
    const gender=String(item?.gender||"").toLowerCase();
    if(gender==="men")return true;
    if(/\bunisex\b/.test(title))return false;
    const m=/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title);
    const w=/\b(women(?:'s)?|woman|female|ladies)\b/.test(title);
    return m&&!w;
  }

  function siblingSlugs(slug){
    for(const group of H.categoryGroups||[]){
      const items=Array.isArray(group?.items)?group.items:[];
      if(items.includes(slug))return items.filter(x=>x!==slug);
    }
    return [];
  }

  const complementaryMap={
    dresses:["bags","shoes","earrings","necklaces","bracelets"],
    tops:["bottoms","bags","accessories","necklaces"],
    hoodies:["bottoms","shoes","bags","accessories"],
    knitwear:["bottoms","bags","accessories"],
    jackets:["tops","bottoms","bags","accessories"],
    swimwear:["bags","hats","accessories"],
    socks:["shoes","bottoms"],
    shoes:["socks","bags","accessories"],
    bags:["accessories","wallets-small-accessories","earrings","necklaces"],
    earrings:["necklaces","bracelets","rings","dresses"],
    necklaces:["earrings","bracelets","rings","dresses"],
    bracelets:["rings","necklaces","bags"],
    rings:["bracelets","necklaces","bags"],
    jewelry:["earrings","necklaces","bracelets","rings"],
    beauty:["perfume","accessories","bags"],
    perfume:["beauty","accessories"],
    home:["storage","lighting","kitchen","bath"],
    kitchen:["storage","home"],
    storage:["home","kitchen","office"],
    tech:["phoneaccessories","gaming","office"],
    phoneaccessories:["tech","gaming"],
    gaming:["tech","office"],
    travel:["bags","accessories","outdoors"],
    outdoors:["travel","sports"],
    kids:["toys","bags"],
    pets:["home","travel"]
  };
  function complementarySlugs(slug){return complementaryMap[slug]||[]}

  function relationScore(item,currentCategory,currentPrice,currentGender){
    const slug=categoryOf(item);
    let score=0;
    if(slug===currentCategory)score+=100;
    if(siblingSlugs(currentCategory).includes(slug))score+=55;
    const prefs=H.shoppingPreferences?.()||{};
    if(prefs.categories?.includes(slug))score+=28;
    score+=Math.min(30,Number(H.signals?.()?.[slug]||0));
    if(currentGender==="women"&&isWomen(item))score+=25;
    if(currentGender==="men"&&isMen(item))score+=25;
    const p=Number(item?.price_amount);
    if(Number.isFinite(currentPrice)&&currentPrice>0&&Number.isFinite(p)&&p>0){
      const ratio=Math.abs(p-currentPrice)/Math.max(currentPrice,1);
      score+=Math.max(0,18-Math.round(ratio*18));
    }
    if(item?.availability_verified)score+=6;
    if(String(item?.price_basis||"").toUpperCase()==="MERCHANT_RETAIL")score+=4;
    return score;
  }

  function stableTie(item){
    const text=key(item);
    let h=0;
    for(let i=0;i<text.length;i++)h=(h*31+text.charCodeAt(i))>>>0;
    return h;
  }

  async function buildPool(product){
    const currentCategory=normalizeSlug(product?.hunt_shelf||product?.storefront_shelf||product?.canonical_shelf||product?.category||H.inferCategory(product)||"");
    const prefs=H.shoppingPreferences?.()||{};
    const discoverySeeds=["beauty","home","tech","travel","bags","jewelry","lighting","kitchen"];
    const requested=[currentCategory,...complementarySlugs(currentCategory),...(prefs.categories||[]).map(normalizeSlug).slice(0,3),...discoverySeeds]
      .map(normalizeSlug)
      .filter(Boolean)
      .filter((slug,index,array)=>array.indexOf(slug)===index)
      .slice(0,10);

    const shardResults=await Promise.all(requested.map(async slug=>{
      try{
        const res=await fetch("catalog-shards/"+encodeURIComponent(slug)+".json?v=catalog30k1",{cache:"force-cache"});
        if(!res.ok)return [];
        const data=await res.json();
        return (Array.isArray(data?.products)?data.products:[]).map(item=>({...item,category:item.category||slug}));
      }catch{return []}
    }));

    let all=shardResults.flat().filter(item=>{
      const k=key(item);
      return item?.item_id&&k!==key(product)&&!seen.has(k);
    });

    if(!all.length){
      const res=await fetch("catalog-home.json?v=platform1",{cache:"force-cache"});
      if(!res.ok)throw new Error("Catalog unavailable");
      const data=await res.json();
      all=[];
      for(const [slug,rows] of Object.entries(data?.shelves||{})){
        for(const raw of Array.isArray(rows)?rows:[]){
          all.push({...raw,category:raw.category||slug});
        }
      }
    }

    const deduped=[];
    const keys=new Set();
    for(const item of all){
      const k=key(item);
      if(keys.has(k))continue;
      keys.add(k);deduped.push(item);
    }

    const currentPrice=Number(product?.price_amount);
    const title=String(product?.title||"").toLowerCase();
    const routeDepartment=String(product?.hunt_department||product?.storefront_department||product?.canonical_department||"").toLowerCase();
    const currentGender=routeDepartment==="women"?"women":routeDepartment==="men"?"men":isWomen(product)?"women":isMen(product)?"men":/\b(dress|skirt|blouse|handbag|purse)\b/.test(title)?"women":"general";

    pool=deduped
      .filter(item=>{
        const slug=categoryOf(item);
        if(!slug)return false;
        if(currentGender==="women"&&isMen(item))return false;
        if(currentGender==="men"&&isWomen(item))return false;
        if(["dresses","socks","swimwear","shoes","bags","earrings","necklaces","bracelets","rings","hoodies","knitwear","jackets","underwear","hats","hairaccessories","lighting","kitchen","storage"].includes(slug)&&!exactIdentity(item,slug))return false;
        return true;
      })
      .map(item=>({item,score:relationScore(item,currentCategory,currentPrice,currentGender),tie:stableTie(item)}))
      .sort((a,b)=>(b.score-a.score)||(a.tie-b.tie))
      .map(x=>x.item);

    const used=new Set();
    const take=(predicate,limit)=>{
      const out=[];
      for(const item of pool){
        const k=key(item);
        if(used.has(k)||!predicate(item))continue;
        used.add(k);out.push(item);
        if(out.length>=limit)break;
      }
      return out;
    };
    const siblings=new Set(siblingSlugs(currentCategory));
    const complements=new Set(complementarySlugs(currentCategory));
    recommendations.similar=take(item=>{
      const slug=categoryOf(item);
      return slug===currentCategory&&exactIdentity(item,currentCategory);
    },12);
    recommendations.complementary=take(item=>{
      const slug=categoryOf(item);
      return complements.has(slug)&&exactIdentity(item,slug);
    },12);
    const discoverCounts=new Map();
    recommendations.discover=take(item=>{
      const slug=categoryOf(item);
      if(slug===currentCategory||complements.has(slug))return false;
      const limit=slug==="socks"?1:2;
      const n=discoverCounts.get(slug)||0;
      if(n>=limit)return false;
      discoverCounts.set(slug,n+1);
      return true;
    },12);
    cursor=0;
  }

  function card(item){
    const href=H.productUrl(item);
    const img=safeHttps(item.image_url)
      ? '<img src="'+H.esc(item.image_url)+'" alt="'+H.esc(item.title||"Product")+'" loading="lazy">'
      : '<div class="hd-profile-product-placeholder">H</div>';
    const slug=categoryOf(item);
    return '<article class="hd-shelf-card" role="listitem" data-category="'+H.esc(slug)+'" data-endless-key="'+H.esc(key(item))+'">'+
      '<a class="hd-shelf-media" href="'+H.esc(href)+'">'+img+'</a>'+
      '<div class="hd-shelf-body">'+
        '<a class="hd-shelf-title" href="'+H.esc(href)+'">'+H.esc(item.title||"Product")+'</a>'+
        '<span class="hd-shelf-price">'+H.esc(price(item))+'</span>'+
        '<div class="hd-shelf-meta"><span>'+H.esc(categoryTitle(slug))+'</span><span>'+H.esc(item.provider||"HUNT")+'</span></div>'+
      '</div>'+
    '</article>';
  }

  function renderRecommendationSections(){
    const sections=[
      ["similar","#hd-similar-grid","#hd-similar-block","similar_products"],
      ["complementary","#hd-complementary-grid","#hd-complementary-block","complementary_products"],
      ["discover","#hd-discover-grid","#hd-discover-block","controlled_discovery"]
    ];
    for(const [name,gridSel,blockSel,placement] of sections){
      const items=recommendations[name]||[];
      const grid=$(gridSel),block=$(blockSel);
      if(block)block.hidden=!items.length;
      if(grid)grid.innerHTML=items.map(card).join("");
      if(items.length)window.HuntAnalytics?.recommendationImpression?.({placement,items});
    }
  }

  function appendNext(){
    if(loading||!pool.length)return;
    loading=true;
    const host=$("#hd-endless-grid");
    const sentinel=$("#hd-endless-sentinel");
    const size=window.matchMedia?.("(max-width:760px)")?.matches?8:12;
    const next=[];
    while(cursor<pool.length&&next.length<size){
      const item=pool[cursor++];
      const k=key(item);
      if(seen.has(k))continue;
      seen.add(k);next.push(item);
    }
    if(next.length){
      host.insertAdjacentHTML("beforeend",next.map(card).join(""));
      window.HuntAnalytics?.recommendationImpression?.({placement:"endless_discovery",items:next});
      const cat=String(next[0]?.category||"");
      if($("#hd-endless-copy"))$("#hd-endless-copy").textContent="BOOM is mixing more "+categoryTitle(cat)+" with related finds and your shopping preferences.";
    }
    if(cursor>=pool.length){
      sentinel.classList.add("done");
      sentinel.querySelector("strong").textContent="You reached the end of this discovery pool.";
      observer?.disconnect();
    }
    loading=false;
  }

  function setupObserver(){
    const sentinel=$("#hd-endless-sentinel");
    if(!sentinel)return;
    observer?.disconnect();
    observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting))appendNext();
    },{rootMargin:"900px 0px"});
    observer.observe(sentinel);
  }

  function youtubeId(url){
    try{
      const u=new URL(url);
      if(u.hostname.includes("youtu.be"))return u.pathname.slice(1).split("/")[0];
      if(u.hostname.includes("youtube.com"))return u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop();
      return "";
    }catch{return ""}
  }

  function renderVideoCard(media){
    const id=youtubeId(media.media_url);
    const thumb=media.thumbnail_url&&safeHttps(media.thumbnail_url)
      ? media.thumbnail_url
      : id?"https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg":"";
    if(id){
      return '<article class="hd-product-video-card" data-product-video-id="'+H.esc(id)+'">'+
        '<button type="button" class="hd-product-video-thumb" aria-label="Play product video">'+
          (thumb?'<img src="'+H.esc(thumb)+'" alt="" loading="lazy">':"")+
          '<span class="hd-product-video-play" aria-hidden="true">▶</span>'+
        '</button>'+
        '<div class="hd-product-video-copy"><strong>Product video</strong><small>'+H.esc(media.source_name||"Verified product source")+'</small></div>'+
      '</article>';
    }
    if(/\.mp4(?:$|\?)/i.test(media.media_url)&&safeHttps(media.media_url)){
      return '<article class="hd-product-video-card"><video controls preload="metadata" playsinline src="'+H.esc(media.media_url)+'"></video><div class="hd-product-video-copy"><strong>Product video</strong><small>'+H.esc(media.source_name||"Verified product source")+'</small></div></article>';
    }
    return "";
  }

  async function loadVerifiedMedia(product){
    if(!client||!product?.item_id)return;
    const {data,error}=await client.from("hunt_product_media")
      .select("id,media_type,media_url,thumbnail_url,source_name,source_url")
      .eq("provider",String(product.provider||""))
      .eq("item_id",String(product.item_id))
      .eq("media_type","video")
      .eq("status","approved")
      .eq("verified_relation",true)
      .limit(6);
    if(error||!data?.length)return;
    const html=data.map(renderVideoCard).filter(Boolean).join("");
    if(!html)return;
    $("#hd-product-video-grid").innerHTML=html;
    $("#hd-product-media-section").hidden=false;
  }

  document.addEventListener("click",event=>{
    const link=event.target.closest?.(".hd-recommendation-grid a[href*=\'product.html\']");
    if(link){
      const cardEl=link.closest("[data-endless-key]");
      const k=cardEl?.dataset.endlessKey||"";
      const product=pool.find(x=>key(x)===k);
      if(product)window.HuntAnalytics?.relatedProductClick?.(product,"product_recommendations");
    }
  },true);

  document.addEventListener("click",event=>{
    const button=event.target.closest?.(".hd-product-video-thumb[data-product-video-id], .hd-product-video-card[data-product-video-id] .hd-product-video-thumb");
    if(!button)return;
    const cardEl=button.closest("[data-product-video-id]");
    const id=cardEl?.dataset.productVideoId||"";
    if(!/^[A-Za-z0-9_-]{6,20}$/.test(id))return;
    const frame=document.createElement("iframe");
    frame.className="hd-product-video-frame";
    frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?autoplay=1&rel=0";
    frame.title="Verified product video";
    frame.allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share";
    frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.allowFullscreen=true;
    button.replaceWith(frame);
  });

  async function init(product){
    current=product;
    seen.add(key(product));
    await Promise.allSettled([loadVerifiedMedia(product),buildPool(product)]);
    renderRecommendationSections();
  }

  window.addEventListener("hunt:product-loaded",event=>init(event.detail?.product));
})();
