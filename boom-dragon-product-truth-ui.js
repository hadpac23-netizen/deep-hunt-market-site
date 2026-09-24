(() => {
  "use strict";

  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const state=()=>window.DRAGON_PRODUCT_TRUTH_STATE||null;

  function label(t=state()){
    if(!t)return "TRUTH PREP";
    if(t.status==="BLOCKED")return "TRUTH BLOCKED";
    if(t.stale)return "SNAPSHOT STALE";
    return t.live?"LIVE VERIFIED":"SNAPSHOT READY";
  }

  function tone(t=state()){
    if(!t||t.status==="BLOCKED"||t.stale)return "prep";
    return "ready";
  }

  function paintProductNode(){
    const node=document.querySelector('[data-dc-node="products"]');
    if(!node)return;
    const small=node.querySelector("small");
    if(small)small.textContent="PRODUCT CORE · "+label();
    let badge=node.querySelector(".dc-product-truth-badge");
    if(!badge){
      badge=document.createElement("span");
      badge.className="dc-product-truth-badge";
      node.appendChild(badge);
    }
    badge.className="dc-product-truth-badge "+tone();
    badge.textContent=label();
  }

  function truthCard(){
    const t=state();
    if(!t){
      return '<section class="dc-info dc-product-truth-card" data-product-truth-card><small>PRODUCT TRUTH</small><p>Loading catalog truth snapshot…</p></section>';
    }
    const blockers=Array.isArray(t.blockers)&&t.blockers.length?t.blockers:["No snapshot blocker recorded"];
    return '<section class="dc-info dc-product-truth-card" data-product-truth-card>'+
      '<small>PRODUCT TRUTH</small>'+
      '<p><b>'+esc(label(t))+'</b> · '+esc(t.source||"")+'</p>'+
      '<div class="dc-truth-metrics">'+
        '<span><b>'+esc(t.catalog_total??"—")+'</b>Catalog</span>'+
        '<span><b>'+esc(t.quote_verified_count??"—")+'</b>Quote verified</span>'+
        '<span><b>'+esc(t.priority_verified?.total??"—")+'</b>Priority verified</span>'+
      '</div>'+
      '<p>Snapshot age: '+esc(t.age_hours==null?"unknown":t.age_hours+"h")+'</p>'+
      '<ul>'+blockers.map(x=>"<li>"+esc(x)+"</li>").join("")+'</ul>'+
      '<p class="dc-truth-note">Per-product live evaluation uses HuntCountryProductTruth: Variant · Stock · Shipping · Landed Cost · Margin · Freshness.</p>'+
    '</section>';
  }

  function injectProductInspector(){
    const inspector=document.querySelector("#dragon-core-inspector.open");
    if(!inspector)return;
    const title=inspector.querySelector("h2")?.textContent?.trim();
    if(title!=="Products")return;
    inspector.querySelector("[data-product-truth-card]")?.remove();
    const status=Array.from(inspector.querySelectorAll(".dc-info")).find(x=>x.querySelector("small")?.textContent==="STATUS");
    if(status)status.insertAdjacentHTML("beforebegin",truthCard());
    else inspector.insertAdjacentHTML("beforeend",truthCard());
  }

  function rightCard(){
    const t=state();
    const chip=tone(t);
    const blockers=t?.blockers?.length?t.blockers.join(" · "):"No snapshot blocker recorded";
    return '<section class="dc-status-card dc-product-truth-summary" data-product-truth-summary>'+
      '<span class="dc-chip '+chip+'">'+esc(label(t))+'</span>'+
      '<small>PRODUCT TRUTH</small>'+
      '<h3>Catalog truth layer</h3>'+
      '<p>'+esc(t?.source||"Waiting for catalog-readiness.json + catalog-index.json")+'</p>'+
      '<div class="dc-stat-grid">'+
        '<div><strong>'+esc(t?.catalog_total??"—")+'</strong><span>Catalog</span></div>'+
        '<div><strong>'+esc(t?.quote_verified_count??"—")+'</strong><span>Quote Verified</span></div>'+
        '<div><strong>'+esc(t?.priority_verified?.total??"—")+'</strong><span>Priority Verified</span></div>'+
      '</div>'+
      '<p class="dc-truth-blockers">'+esc(blockers)+'</p>'+
    '</section>';
  }

  function injectRightPanel(){
    const panel=document.querySelector("#dragon-core-right-panel");
    if(!panel)return;
    panel.querySelector("[data-product-truth-summary]")?.remove();
    panel.insertAdjacentHTML("afterbegin",rightCard());
  }

  function paint(){
    paintProductNode();
    injectProductInspector();
    injectRightPanel();
  }

  window.addEventListener("dragon:product-truth",()=>setTimeout(paint,0));
  document.addEventListener("click",event=>{
    if(event.target.closest('[data-dc-node="products"],[data-dc-nav-node="products"],[data-dc-right-node="products"]')){
      setTimeout(paint,0);
    }
    if(event.target.closest("[data-dc-right-tab],[data-dc-view]"))setTimeout(paint,0);
  });

  const observer=new MutationObserver(()=>{
    const panel=document.querySelector("#dragon-core-right-panel");
    if(panel&&!panel.querySelector("[data-product-truth-summary]"))injectRightPanel();
  });

  function init(){
    const panel=document.querySelector("#dragon-core-right-panel");
    if(panel)observer.observe(panel,{childList:true});
    paint();
    setTimeout(paint,150);
    setTimeout(paint,800);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();

  window.DRAGON_PRODUCT_TRUTH_UI=Object.freeze({paint,label,tone});
})();