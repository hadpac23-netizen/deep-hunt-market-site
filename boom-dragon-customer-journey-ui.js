(() => {
  "use strict";

  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  let current=null;
  const read=()=>current||window.DRAGON_CUSTOMER_JOURNEY_STATE||null;

  function label(j=read()){
    if(!j)return "JOURNEY PREP";
    if(j.status==="BLOCKED")return "JOURNEY BLOCKED";
    if(j.stale)return "JOURNEY STALE";
    if(j.purchase_truth?.buyer_ready===true)return "JOURNEY READY";
    return "BUYER PREP";
  }
  function tone(j=read()){
    return j&&j.status!=="BLOCKED"&&!j.stale&&j.purchase_truth?.buyer_ready===true?"ready":"prep";
  }
  function v(value){return value===null||value===undefined?"—":String(value);}

  function paintNode(){
    const node=document.querySelector('[data-dc-node="customers"]');
    if(!node)return;
    let badge=node.querySelector(".dc-customer-journey-badge");
    if(!badge){badge=document.createElement("span");badge.className="dc-customer-journey-badge";node.appendChild(badge);}
    badge.className="dc-customer-journey-badge "+tone();
    badge.textContent=label();
  }

  function card(){
    const j=read();
    if(!j)return '<section class="dc-info dc-journey-card" data-journey-card><small>CUSTOMER JOURNEY TRUTH</small><p>Loading journey evidence…</p></section>';
    const s=j.stages||{};
    const p=j.purchase_truth||{};
    return '<section class="dc-info dc-journey-card" data-journey-card>'+
      '<small>CUSTOMER JOURNEY TRUTH</small>'+
      '<p><b>'+esc(label(j))+'</b> · '+esc(j.source||"")+'</p>'+
      '<div class="dc-journey-flow">'+
        '<span><b>'+v(s.views)+'</b>View</span><i>→</i>'+
        '<span><b>'+v(s.saves)+'</b>Save</span><i>→</i>'+
        '<span><b>'+v(s.cart)+'</b>Cart</span><i>→</i>'+
        '<span><b>'+v(s.checkout)+'</b>Checkout</span><i>→</i>'+
        '<span><b>'+v(s.buyer)+'</b>Buyer</span><i>→</i>'+
        '<span><b>'+v(s.repeat)+'</b>Repeat</span>'+
      '</div>'+
      '<p>Window: '+esc(j.window_days||7)+' days · Latest activity: '+esc(j.latest_activity_day||"unknown")+'</p>'+
      (p.test_contamination_detected===true
        ? '<p class="dc-journey-warning">TEST-CONTAMINATED legacy order metric detected. Test orders are excluded from Buyer/Repeat.</p>'
        : '')+
      '<p class="dc-journey-note">Buyer truth: '+(p.buyer_ready===true?"SERVER CONFIRMED":"SERVER PREP")+'. Legacy order counts never become Buyer automatically.</p>'+
    '</section>';
  }

  function injectInspector(){
    const inspector=document.querySelector("#dragon-core-inspector.open");
    if(!inspector||inspector.querySelector("h2")?.textContent?.trim()!=="Customers")return;
    inspector.querySelector("[data-journey-card]")?.remove();
    const status=Array.from(inspector.querySelectorAll(".dc-info")).find(x=>x.querySelector("small")?.textContent==="STATUS");
    if(status)status.insertAdjacentHTML("beforebegin",card()); else inspector.insertAdjacentHTML("beforeend",card());
  }

  function right(){
    const j=read(),s=j?.stages||{},p=j?.purchase_truth||{};
    return '<section class="dc-status-card dc-journey-summary" data-journey-summary>'+
      '<span class="dc-chip '+tone(j)+'">'+esc(label(j))+'</span>'+
      '<small>CUSTOMER JOURNEY</small><h3>View → Save → Cart → Checkout → Buyer → Repeat</h3>'+
      '<div class="dc-stat-grid"><div><strong>'+v(s.views)+'</strong><span>Views</span></div><div><strong>'+v(s.cart)+'</strong><span>Cart</span></div><div><strong>'+v(s.checkout)+'</strong><span>Checkout</span></div></div>'+
      '<p>Buyer '+v(s.buyer)+' · Repeat '+v(s.repeat)+' · Buyer truth '+(p.buyer_ready===true?"READY":"PREP")+'</p>'+
    '</section>';
  }
  function injectRight(){
    const panel=document.querySelector("#dragon-core-right-panel");if(!panel)return;
    panel.querySelector("[data-journey-summary]")?.remove();
    panel.insertAdjacentHTML("afterbegin",right());
  }
  function paint(){paintNode();injectInspector();injectRight();}

  window.addEventListener("dragon:customer-journey",event=>{current=event.detail||null;setTimeout(paint,0)});
  document.addEventListener("click",event=>{
    if(event.target.closest('[data-dc-node="customers"],[data-dc-nav-node="customers"],[data-dc-right-node="customers"],[data-dc-right-tab]'))setTimeout(paint,0);
  });
  const observer=new MutationObserver(()=>{const panel=document.querySelector("#dragon-core-right-panel");if(panel&&!panel.querySelector("[data-journey-summary]"))injectRight();});
  function init(){const panel=document.querySelector("#dragon-core-right-panel");if(panel)observer.observe(panel,{childList:true});paint();setTimeout(paint,200);setTimeout(paint,1000);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.DRAGON_CUSTOMER_JOURNEY_UI=Object.freeze({paint,label,tone});
})();