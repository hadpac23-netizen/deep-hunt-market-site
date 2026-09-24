(() => {
  "use strict";
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let current=window.DRAGON_PRODUCT_LIVE_REFRESH_STATE||window.DragonProductLiveRefresh?.readCached?.()||null;
  const read=()=>current||window.DRAGON_PRODUCT_LIVE_REFRESH_STATE||null;

  function label(s=read()){
    if(!s)return "LIVE REFRESH READY";
    if(s.status==="REFRESHING")return "REFRESHING…";
    if(s.status==="DISCOVERY_FRESH")return "DISCOVERY FRESH";
    if(s.status==="BLOCKED")return "REFRESH BLOCKED";
    return "DETAIL PREP";
  }
  function tone(s=read()){return s?.status==="DISCOVERY_FRESH"?"ready":s?.status==="BLOCKED"?"hold":"prep"}

  function button(){
    return '<button type="button" class="dc-live-refresh-button" data-cj-shadow-refresh>'+
      (read()?.status==="REFRESHING"?"Refreshing CJ…":"Refresh CJ Shadow")+
      '</button>';
  }

  function card(){
    const s=read();
    return '<section class="dc-info dc-product-live-card" data-product-live-card>'+
      '<small>CJ OFFICIAL · SHADOW REFRESH</small>'+
      '<p><b>'+esc(label(s))+'</b> · Production effect: NO</p>'+
      (s?.status==="DISCOVERY_FRESH"
        ? '<div class="dc-live-refresh-metrics">'+
            '<span><b>'+esc(s.products_seen??0)+'</b>Products</span>'+
            '<span><b>'+esc(s.source_rows_seen??0)+'</b>Source rows</span>'+
            '<span><b>'+esc(s.age_minutes??"—")+'m</b>Age</span>'+
          '</div>'+
          '<p>Discovery source is fresh. Detail Truth remains <b>RECHECK_REQUIRED</b> until Variant + Stock + Shipping + Landed Cost + Profit Gate are fresh.</p>'
        : '<p>Run the official CJ shadow read to refresh discovery evidence.</p>')+
      (s?.error?'<p class="dc-refresh-error">'+esc(s.error)+'</p>':'')+
      button()+
    '</section>';
  }

  function inject(){
    const inspector=document.querySelector("#dragon-core-inspector.open");
    if(!inspector||inspector.querySelector("h2")?.textContent?.trim()!=="Products")return;
    inspector.querySelector("[data-product-live-card]")?.remove();
    const existing=inspector.querySelector("[data-product-truth-card]");
    if(existing)existing.insertAdjacentHTML("afterend",card());
    else inspector.insertAdjacentHTML("beforeend",card());
  }

  function paintNode(){
    const node=document.querySelector('[data-dc-node="products"]');
    if(!node)return;
    let el=node.querySelector(".dc-product-live-badge");
    if(!el){el=document.createElement("span");el.className="dc-product-live-badge";node.appendChild(el);}
    el.className="dc-product-live-badge "+tone();
    el.textContent=read()?.status==="DISCOVERY_FRESH"?"CJ DISCOVERY FRESH":"CJ SHADOW";
  }

  function paint(){paintNode();inject();}

  window.addEventListener("dragon:product-live-refresh",e=>{current=e.detail||null;setTimeout(paint,0)});
  document.addEventListener("click",async e=>{
    const refresh=e.target.closest("[data-cj-shadow-refresh]");
    if(refresh){
      refresh.disabled=true;
      await window.DragonProductLiveRefresh?.runBrowser?.({start_page:1,page_count:1});
      setTimeout(paint,0);
      return;
    }
    if(e.target.closest('[data-dc-node="products"],[data-dc-nav-node="products"],[data-dc-right-node="products"]'))setTimeout(paint,0);
  });

  function init(){paint();setTimeout(paint,300);setTimeout(paint,900)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.DRAGON_PRODUCT_LIVE_REFRESH_UI=Object.freeze({paint,label,tone});
})();