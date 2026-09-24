(() => {
  "use strict";

  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const money=(v,currency="USD")=>{
    if(v===null||v===undefined||!Number.isFinite(Number(v)))return "—";
    try{return new Intl.NumberFormat("en",{style:"currency",currency}).format(Number(v));}
    catch{return String(v);}
  };

  let current=null;

  function read(){
    current=window.DragonOrderProfit?.readLastPreview?.()||null;
    return current;
  }

  function label(p=current||read()){
    if(!p)return "NO VERIFIED QUOTE";
    const s=String(p.status||"PREP").toUpperCase();
    if(s==="QUOTE_PROFIT_PREVIEW")return "QUOTE PREVIEW";
    if(s==="QUOTE_PROFIT_HOLD")return "QUOTE HOLD";
    if(s==="REALIZED_FINAL")return "REALIZED FINAL";
    if(s==="FULFILLED_PROVISIONAL")return "FULFILLED PREVIEW";
    if(s==="PAID_PROVISIONAL")return "PAID PREVIEW";
    return "PROFIT PREP";
  }

  function tone(p=current||read()){
    const s=String(p?.status||"").toUpperCase();
    if(s==="QUOTE_PROFIT_PREVIEW")return "ready";
    if(s==="REALIZED_FINAL")return "ready";
    return "prep";
  }

  function paintNode(id){
    const node=document.querySelector('[data-dc-node="'+id+'"]');
    if(!node)return;
    let badge=node.querySelector(".dc-order-profit-badge");
    if(!badge){
      badge=document.createElement("span");
      badge.className="dc-order-profit-badge";
      node.appendChild(badge);
    }
    badge.className="dc-order-profit-badge "+tone();
    badge.textContent=label();
  }

  function detailCard(){
    const p=current||read();
    if(!p){
      return '<section class="dc-info dc-order-profit-card" data-order-profit-card><small>ORDER → PROFIT TRUTH</small><p>No verified checkout profit preview is stored in this tab yet.</p><p class="dc-profit-note">A quote must be verified first. Nothing here is treated as realized profit.</p></section>';
    }
    const contribution=p.contribution_amount;
    const margin=p.contribution_margin_rate;
    return '<section class="dc-info dc-order-profit-card" data-order-profit-card>'+
      '<small>ORDER → PROFIT TRUTH</small>'+
      '<p><b>'+esc(label(p))+'</b> · '+esc(p.currency||"USD")+'</p>'+
      '<div class="dc-profit-metrics">'+
        '<span><b>'+money(p.revenue_amount,p.currency)+'</b>Revenue</span>'+
        '<span><b>'+money(p.supplier_product_cost,p.currency)+'</b>Product cost</span>'+
        '<span><b>'+money(p.supplier_shipping_cost,p.currency)+'</b>Shipping cost</span>'+
        '<span><b>'+money(contribution,p.currency)+'</b>Contribution</span>'+
      '</div>'+
      '<p>Margin: '+(margin==null?"—":(Number(margin)*100).toFixed(1)+"%")+
      ' · Payment/refund/platform values are '+(p.fees_are_reserves?"reserves, not final fees.":"not confirmed as reserves.")+'</p>'+
      '<p class="dc-profit-note"><strong>REALIZED:</strong> '+(p.realized===true?"YES":"NO")+'. Final net profit is never shown until payment, fulfillment, refunds and all costs are finalized.</p>'+
    '</section>';
  }

  function injectInspector(){
    const inspector=document.querySelector("#dragon-core-inspector.open");
    if(!inspector)return;
    const title=inspector.querySelector("h2")?.textContent?.trim();
    if(title!=="Orders"&&title!=="Profit")return;
    inspector.querySelector("[data-order-profit-card]")?.remove();
    const status=Array.from(inspector.querySelectorAll(".dc-info")).find(x=>x.querySelector("small")?.textContent==="STATUS");
    if(status)status.insertAdjacentHTML("beforebegin",detailCard());
    else inspector.insertAdjacentHTML("beforeend",detailCard());
  }

  function rightSummary(){
    const p=current||read();
    return '<section class="dc-status-card dc-order-profit-summary" data-order-profit-summary>'+
      '<span class="dc-chip '+tone(p)+'">'+esc(label(p))+'</span>'+
      '<small>ORDER → PROFIT</small>'+
      '<h3>Checkout economics evidence</h3>'+
      '<p>'+(p
        ? 'Revenue '+money(p.revenue_amount,p.currency)+' · Contribution '+money(p.contribution_amount,p.currency)
        : 'Waiting for a verified checkout quote.')+'</p>'+
      '<p class="dc-profit-note">Realized profit: <b>'+(p?.realized===true?"YES":"NO")+'</b></p>'+
    '</section>';
  }

  function injectRight(){
    const panel=document.querySelector("#dragon-core-right-panel");
    if(!panel)return;
    panel.querySelector("[data-order-profit-summary]")?.remove();
    panel.insertAdjacentHTML("afterbegin",rightSummary());
  }

  function paint(){
    read();
    paintNode("orders");
    paintNode("profit");
    injectInspector();
    injectRight();
  }

  window.addEventListener("hunt:order-profit-preview",event=>{
    current=event.detail||null;
    setTimeout(paint,0);
  });

  document.addEventListener("click",event=>{
    if(event.target.closest('[data-dc-node="orders"],[data-dc-node="profit"],[data-dc-nav-node="orders"],[data-dc-nav-node="profit"],[data-dc-right-node="orders"],[data-dc-right-node="profit"],[data-dc-right-tab]')){
      setTimeout(paint,0);
    }
  });

  const observer=new MutationObserver(()=>{
    const panel=document.querySelector("#dragon-core-right-panel");
    if(panel&&!panel.querySelector("[data-order-profit-summary]"))injectRight();
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

  window.DRAGON_ORDER_PROFIT_UI=Object.freeze({paint,label,tone});
})();