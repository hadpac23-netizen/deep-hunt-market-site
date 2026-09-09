(() => {
  const H=window.HuntCore, sb=window.supabase;
  if(!H||!sb?.createClient)return;

  const client=sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey);
  const state=new Map();
  const localKey="hunt_local_product_actions_v1";
  let session=null;
  let scanQueued=false;

  const cardSelectors=[
    ".hd-shelf-card",".hd-market-product-card",".hd-wow-product",".hd-shop-card",
    ".hd-dept-card",".hd-catalog-product",".hd-search-card",".hd-profile-product",".hd-promo-product"
  ].join(",");

  function key(provider,itemId){return String(provider||"")+":"+String(itemId||"");}
  function esc(value){return H.esc(String(value??""));}
  function readLocal(){try{return JSON.parse(localStorage.getItem(localKey)||"{}")}catch{return {}}}
  function writeLocal(value){localStorage.setItem(localKey,JSON.stringify(value||{}));}
  function loadLocalState(){
    const rows=readLocal();
    for(const [k,row] of Object.entries(rows)) if(row&&(row.liked||row.saved)) state.set(k,row);
  }
  function persistLocal(meta,row){
    const rows=readLocal(), k=key(meta.provider,meta.item_id);
    if(!row.liked&&!row.saved) delete rows[k]; else rows[k]={...meta,...row};
    writeLocal(rows);
  }

  function productInfoFromUrl(href){
    try{
      const u=new URL(href,location.href);
      if(!u.pathname.endsWith("/product.html")&&!u.pathname.endsWith("product.html"))return null;
      const provider=(u.searchParams.get("provider")||"").trim();
      const itemId=(u.searchParams.get("id")||u.searchParams.get("product_id")||"").trim();
      if(!provider||!itemId)return null;
      return {provider,itemId};
    }catch{return null;}
  }

  function metaForCard(card,info){
    const title=card?.querySelector?.(".hd-shelf-title,.hd-market-card-title,.hd-shop-card-title,.hd-wow-product-body>a,[data-product-title]")?.textContent?.trim()||"";
    const image=card?.querySelector?.("img")?.src||"";
    const category=card?.dataset?.category||new URLSearchParams(location.search).get("c")||null;
    return {provider:info.provider,item_id:info.itemId,title,image_url:image||null,category};
  }

  function productPageMeta(){
    const params=new URLSearchParams(location.search);
    return {
      provider:(params.get("provider")||"").trim(),
      item_id:(params.get("id")||params.get("product_id")||"").trim(),
      title:document.querySelector("#hd-product-title")?.textContent?.trim()||"",
      image_url:document.querySelector("#hd-product-main-image")?.src||null,
      category:new URL(document.querySelector("#hd-product-category-link")?.href||location.href).searchParams.get("c")||null
    };
  }

  function currentRow(info){return state.get(key(info.provider,info.itemId))||{liked:false,saved:false};}

  function buttonMarkup(info,kind){
    const row=currentRow(info);
    const active=kind==="like"?row.liked:row.saved;
    const icon=kind==="like"?(active?"♥":"♡"):(active?"🔖":"▱");
    const label=kind==="like"?(active?"Unlike":"Like"):(active?"Remove saved":"Save");
    return `<button type="button" class="hd-shop-action ${active?"active":""}" data-shop-action="${kind}" data-provider="${esc(info.provider)}" data-item-id="${esc(info.itemId)}" aria-pressed="${active}" aria-label="${label}" title="${label}"><span aria-hidden="true">${icon}</span></button>`;
  }
  function decorateCard(card,info){
    if(!card||card.querySelector(".hd-shop-actions"))return;
    const media=card.querySelector(".hd-shelf-media,.hd-market-card-media,.hd-wow-product-media,.hd-shop-card-media,.hd-profile-product-media,.hd-promo-product-media,a[href*='product.html']");
    if(!media)return;
    const host=document.createElement("div");
    host.className="hd-shop-actions";
    host.dataset.provider=info.provider;
    host.dataset.itemId=info.itemId;
    host.innerHTML=buttonMarkup(info,"like")+buttonMarkup(info,"save");
    card.style.position=card.style.position||"relative";
    card.appendChild(host);
  }

  function decorateProductPage(){
    if(!document.querySelector("#hd-product-layout")||document.querySelector(".hd-product-social-actions"))return;
    const info=productPageMeta();
    if(!info.provider||!info.item_id)return;
    const target=document.querySelector(".hd-product-price");
    if(!target)return;
    const host=document.createElement("div");
    host.className="hd-product-social-actions";
    host.dataset.provider=info.provider;
    host.dataset.itemId=info.item_id;
    host.innerHTML=`
      <button type="button" class="hd-product-social-btn" data-shop-action="like" data-provider="${esc(info.provider)}" data-item-id="${esc(info.item_id)}">${currentRow({provider:info.provider,itemId:info.item_id}).liked?"♥ Liked":"♡ Like"}</button>
      <button type="button" class="hd-product-social-btn" data-shop-action="save" data-provider="${esc(info.provider)}" data-item-id="${esc(info.item_id)}">${currentRow({provider:info.provider,itemId:info.item_id}).saved?"🔖 Saved":"▱ Save"}</button>`;
    target.after(host);
  }

  function scan(){
    scanQueued=false;
    document.querySelectorAll("a[href*='product.html?']").forEach(a=>{
      const info=productInfoFromUrl(a.href);
      if(!info)return;
      const card=a.closest(cardSelectors);
      if(card)decorateCard(card,info);
    });
    decorateProductPage();
    refreshButtons();
  }

  function queueScan(){
    if(scanQueued)return;
    scanQueued=true;
    requestAnimationFrame(scan);
  }

  function refreshButtons(){
    document.querySelectorAll("[data-shop-action][data-provider][data-item-id]").forEach(btn=>{
      const info={provider:btn.dataset.provider,itemId:btn.dataset.itemId};
      const row=currentRow(info);
      const kind=btn.dataset.shopAction;
      const active=kind==="like"?row.liked:row.saved;
      btn.classList.toggle("active",Boolean(active));
      btn.setAttribute("aria-pressed",String(Boolean(active)));
      if(btn.classList.contains("hd-product-social-btn")){
        btn.textContent=kind==="like"?(active?"♥ Liked":"♡ Like"):(active?"🔖 Saved":"▱ Save");
      }else{
        btn.innerHTML=`<span aria-hidden="true">${kind==="like"?(active?"♥":"♡"):(active?"🔖":"▱")}</span>`;
        btn.setAttribute("aria-label",kind==="like"?(active?"Unlike":"Like"):(active?"Remove saved":"Save"));
      }
    });
  }
  async function loadState(){
    if(!session?.user)return;
    const {data,error}=await client.from("hunt_product_actions")
      .select("provider,item_id,liked,saved,title,image_url,category,liked_at,saved_at")
      .order("updated_at",{ascending:false})
      .limit(2000);
    if(error)return;
    state.clear();
    for(const row of data||[])state.set(key(row.provider,row.item_id),row);
    refreshButtons();
  }

  function metaForButton(btn){
    const info={provider:btn.dataset.provider,itemId:btn.dataset.itemId};
    if(document.querySelector("#hd-product-layout")&&new URLSearchParams(location.search).get("id")===info.itemId){
      return productPageMeta();
    }
    const card=btn.closest(cardSelectors);
    return metaForCard(card,info);
  }

  async function toggle(btn){
    const meta=metaForButton(btn);
    if(!session?.user){
      const k=key(meta.provider,meta.item_id);
      const old=state.get(k)||{liked:false,saved:false};
      const kind=btn.dataset.shopAction;
      const next={...old};
      if(kind==="like")next.liked=!Boolean(old.liked);
      if(kind==="save")next.saved=!Boolean(old.saved);
      if(!next.liked&&!next.saved)state.delete(k);else state.set(k,next);
      persistLocal(meta,next);
      refreshButtons();
      const active=kind==="like"?Boolean(next.liked):Boolean(next.saved);
      if(active&&meta.category)H.recordSignal?.(meta.category,kind);
      window.HuntAnalytics?.shoppingAction?.({provider:meta.provider,itemId:meta.item_id,action:kind,active,category:meta.category||""});
      window.dispatchEvent(new CustomEvent("hunt:shopping-action",{detail:{provider:meta.provider,item_id:meta.item_id,liked:Boolean(next.liked),saved:Boolean(next.saved),local:true}}));
      return;
    }
    const k=key(meta.provider,meta.item_id);
    const old=state.get(k)||{liked:false,saved:false};
    const kind=btn.dataset.shopAction;
    const next={...old};
    if(kind==="like")next.liked=!Boolean(old.liked);
    if(kind==="save")next.saved=!Boolean(old.saved);

    state.set(k,next);
    refreshButtons();

    try{
      if(!next.liked&&!next.saved){
        const {error}=await client.from("hunt_product_actions")
          .delete().eq("provider",meta.provider).eq("item_id",meta.item_id);
        if(error)throw error;
        state.delete(k);
      }else{
        const now=new Date().toISOString();
        const payload={
          user_id:session.user.id,
          provider:meta.provider,
          item_id:meta.item_id,
          title:meta.title||old.title||"",
          image_url:meta.image_url||old.image_url||null,
          category:meta.category||old.category||null,
          liked:Boolean(next.liked),
          saved:Boolean(next.saved),
          liked_at:next.liked?(old.liked_at||now):null,
          saved_at:next.saved?(old.saved_at||now):null
        };
        const {data,error}=await client.from("hunt_product_actions")
          .upsert(payload,{onConflict:"user_id,provider,item_id"})
          .select("provider,item_id,liked,saved,title,image_url,category,liked_at,saved_at")
          .single();
        if(error)throw error;
        state.set(k,data);
      }
      refreshButtons();
      const preferenceActive=kind==="like"?Boolean(next.liked):Boolean(next.saved);
      if(preferenceActive&&meta.category) H.recordSignal?.(meta.category,kind);
      window.HuntAnalytics?.shoppingAction?.({
        provider:meta.provider,
        itemId:meta.item_id,
        action:kind,
        active:preferenceActive,
        category:meta.category||""
      });
      window.dispatchEvent(new CustomEvent("hunt:shopping-action",{detail:{provider:meta.provider,item_id:meta.item_id,liked:Boolean(next.liked),saved:Boolean(next.saved)}}));
    }catch{
      state.set(k,old);
      refreshButtons();
    }
  }

  async function mergeLocalToAccount(){
    if(!session?.user)return;
    const rows=Object.values(readLocal()).filter(row=>row&&(row.liked||row.saved));
    if(!rows.length)return;
    const {data:existingRows}=await client.from("hunt_product_actions")
      .select("provider,item_id,liked,saved,liked_at,saved_at,title,image_url,category");
    const existing=new Map((existingRows||[]).map(row=>[key(row.provider,row.item_id),row]));
    const now=new Date().toISOString();
    for(const row of rows){
      const previous=existing.get(key(row.provider,row.item_id))||{};
      const liked=Boolean(row.liked||previous.liked);
      const saved=Boolean(row.saved||previous.saved);
      await client.from("hunt_product_actions").upsert({
        user_id:session.user.id,provider:String(row.provider||""),item_id:String(row.item_id||""),
        title:String(row.title||previous.title||""),image_url:row.image_url||previous.image_url||null,category:row.category||previous.category||null,
        liked,saved,
        liked_at:liked?(previous.liked_at||row.liked_at||now):null,
        saved_at:saved?(previous.saved_at||row.saved_at||now):null
      },{onConflict:"user_id,provider,item_id"});
    }
    localStorage.removeItem(localKey);
  }

  document.addEventListener("click",event=>{
    const btn=event.target.closest?.("[data-shop-action][data-provider][data-item-id]");
    if(!btn)return;
    event.preventDefault();
    event.stopPropagation();
    toggle(btn);
  },true);

  const observer=new MutationObserver(queueScan);
  observer.observe(document.documentElement,{childList:true,subtree:true});

  async function init(){
    loadLocalState();
    const {data}=await client.auth.getSession();
    session=data.session||null;
    if(session?.user)await mergeLocalToAccount();
    await loadState();
    scan();
  }
  init();
})();