(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H)return;
  const client=sb?.createClient?sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey):null;
  const $=q=>document.querySelector(q);
  let current=null;
  let pool=[];
  let cursor=0;
  let loading=false;
  let observer=null;
  const seen=new Set();

  function key(item){return String(item?.provider||"")+":"+String(item?.item_id||"")}
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
      const slugs=Array.isArray(group)?group:(Array.isArray(group?.items)?group.items:[]);
      if(slugs.includes(slug))return slugs.filter(x=>x!==slug);
    }
    return [];
  }

  const relatedMap={
    women:["dresses","tops","bottoms","hoodies","knitwear","jackets","activewear","swimwear","bags","shoes","accessories","jewelry"],
    men:["tops","bottoms","hoodies","knitwear","jackets","activewear","shoes","accessories"],
    dresses:["women","shoes","bags","jewelry"], tops:["women","men","hoodies","jackets","knitwear","bottoms"],
    bottoms:["women","men","tops","hoodies","jackets"], hoodies:["women","men","tops","bottoms","jackets"],
    jackets:["women","men","tops","bottoms","hoodies"], knitwear:["women","men","tops","bottoms","jackets"],
    activewear:["women","men","sports","shoes"], swimwear:["women","sports","travel"],
    perfume:["beauty"], beauty:["perfume"], jewelry:["accessories","bags"], bags:["accessories","shoes"], shoes:["accessories","bags"],
    phoneaccessories:["tech"], gaming:["tech"], tech:["phoneaccessories","gaming"],
    kitchen:["home","storage"], storage:["home","kitchen"], bedding:["home","blankets","pillows"], bath:["home"], lighting:["home"],
    travel:["bags","accessories"], sports:["activewear","outdoors"], outdoors:["sports","travel"],
    toys:["kids","gifts"], kids:["toys"], gifts:["party","crafts"], accessories:["bags","shoes","jewelry"]
  };
  const broadCategories=new Set(["women","men","home","tech","sports","accessories","beauty","gifts"]);

  function productTokens(value){
    const raw=[value?.title,value?.brand,value?.type_name,value?.model].filter(Boolean).join(" ").toLowerCase();
    return new Set((raw.match(/[a-z0-9]{3,}/g)||[]).filter(token=>!["the","and","for","with","from","product","women","woman","mens","men"].includes(token)));
  }

  function relationScore(item,current,currentCategory,currentPrice,currentGender){
    const slug=String(H.inferCategory(item)||item?.category||"");
    if(currentGender==="women"&&isMen(item))return -1;
    if(currentGender==="men"&&isWomen(item))return -1;

    const exact=slug===currentCategory;
    const related=(relatedMap[currentCategory]||[]).includes(slug);
    const a=productTokens(current), b=productTokens(item);
    let overlap=0; a.forEach(token=>{if(b.has(token))overlap+=1;});
    const brandA=String(current?.brand||"").trim().toLowerCase();
    const brandB=String(item?.brand||"").trim().toLowerCase();
    const brandMatch=Boolean(brandA&&brandB&&brandA===brandB);
    const typeA=String(current?.type_name||"").trim().toLowerCase();
    const typeB=String(item?.type_name||"").trim().toLowerCase();
    const typeMatch=Boolean(typeA&&typeB&&typeA===typeB);
    const lexical=overlap>0||brandMatch||typeMatch;

    if(!exact&&!related)return -1;
    if(broadCategories.has(currentCategory)&&!lexical)return -1;
    if(related&&!lexical)return -1;

    let score=exact?140:65;
    score+=Math.min(48,overlap*12)+(brandMatch?40:0)+(typeMatch?25:0);
    const prefs=H.shoppingPreferences?.()||{};
    if(prefs.categories?.includes(slug))score+=8;
    score+=Math.min(8,Number(H.signals?.()?.[slug]||0));
    const p=Number(item?.price_amount);
    if(Number.isFinite(currentPrice)&&currentPrice>0&&Number.isFinite(p)&&p>0){
      const ratio=Math.abs(p-currentPrice)/Math.max(currentPrice,1);
      score+=Math.max(0,14-Math.round(ratio*14));
    }
    if(item?.availability_verified)score+=5;
    return score;
  }

  function stableTie(item){
    const text=key(item);
    let h=0;
    for(let i=0;i<text.length;i++)h=(h*31+text.charCodeAt(i))>>>0;
    return h;
  }

  async function buildPool(product){
    const currentCategory=String(H.inferCategory(product)||product?.category||"");
    const prefs=H.shoppingPreferences?.()||{};
    const requested=[currentCategory,...siblingSlugs(currentCategory),...(prefs.categories||[]).slice(0,3)]
      .filter(Boolean)
      .filter((slug,index,array)=>array.indexOf(slug)===index)
      .slice(0,8);

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
    const currentGender=isWomen(product)?"women":isMen(product)?"men":/\b(dress|skirt|blouse|handbag|purse)\b/.test(title)?"women":"general";

    pool=deduped
      .map(item=>({item,score:relationScore(item,product,currentCategory,currentPrice,currentGender),tie:stableTie(item)}))
      .filter(row=>row.score>=0)
      .sort((a,b)=>(b.score-a.score)||(a.tie-b.tie))
      .map(x=>x.item);
    cursor=0;
  }

  function card(item){
    const href=H.productUrl(item);
    const img=safeHttps(item.image_url)
      ? '<img src="'+H.esc(item.image_url)+'" alt="'+H.esc(item.title||"Product")+'" loading="lazy">'
      : '<div class="hd-profile-product-placeholder">H</div>';
    const slug=String(H.inferCategory(item)||item.category||"");
    return '<article class="hd-shelf-card" role="listitem" data-category="'+H.esc(slug)+'" data-endless-key="'+H.esc(key(item))+'">'+
      '<a class="hd-shelf-media" href="'+H.esc(href)+'">'+img+'</a>'+
      '<div class="hd-shelf-body">'+
        '<a class="hd-shelf-title" href="'+H.esc(href)+'">'+H.esc(item.title||"Product")+'</a>'+
        '<span class="hd-shelf-price">'+H.esc(price(item))+'</span>'+
        '<div class="hd-shelf-meta"><span>'+H.esc(categoryTitle(slug))+'</span><span>'+H.esc(item.provider||"HUNT")+'</span></div>'+
      '</div>'+
    '</article>';
  }

  function appendNext(){
    if(loading)return;
    const host=$("#hd-endless-grid");
    const sentinel=$("#hd-endless-sentinel");
    if(!pool.length){
      if(sentinel){
        sentinel.classList.add("done");
        sentinel.querySelector("strong").textContent="No more closely related products are verified right now.";
      }
      observer?.disconnect();
      return;
    }
    loading=true;
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
      if($("#hd-endless-copy"))$("#hd-endless-copy").textContent="BOOM is showing closely related "+categoryTitle(cat)+" products first — not random catalog filler.";
    }
    if(cursor>=pool.length){
      sentinel.classList.add("done");
      sentinel.querySelector("strong").textContent=pool.length?"You reached the end of the closely related products.":"No more closely related products are verified right now.";
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
    const link=event.target.closest?.("#hd-endless-grid a[href*=\'product.html\']");
    if(link){
      const cardEl=link.closest("[data-endless-key]");
      const k=cardEl?.dataset.endlessKey||"";
      const product=pool.find(x=>key(x)===k);
      if(product)window.HuntAnalytics?.relatedProductClick?.(product,"endless_discovery");
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
    appendNext();
    setupObserver();
  }

  window.addEventListener("hunt:product-loaded",event=>init(event.detail?.product));
})();
