(() => {
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let current=window.DRAGON_PRODUCT_DETAIL_SHADOW_STATE||window.DragonProductDetailShadow?.readCached?.()||null;
const read=()=>current||window.DRAGON_PRODUCT_DETAIL_SHADOW_STATE||null;

function card(){
  const s=read();
  const country=esc(s?.country_code||window.DragonProductDetailShadow?.preferredCountry?.()||"US");
  return '<section class="dc-info dc-detail-shadow-card" data-detail-shadow-card>'+
    '<small>DETAIL TRUTH · SHADOW</small>'+
    '<p><b>'+(s?.status==="DETAIL_SAMPLE_VERIFIED"?"DETAIL SAMPLE VERIFIED":s?.status==="VERIFYING"?"VERIFYING…":"DETAIL RECHECK")+'</b> · Destination '+country+'</p>'+
    (s?.status==="DETAIL_SAMPLE_VERIFIED"
      ? '<div class="dc-detail-grid">'+
          '<span><b>'+esc(s.stock_quantity??"—")+'</b>Stock</span>'+
          '<span><b>$'+esc(s.shipping_cost_usd??"—")+'</b>Shipping</span>'+
          '<span><b>$'+esc(s.retail_price_usd??"—")+'</b>Retail</span>'+
          '<span><b>'+esc(s.profit_gate_status||"—")+'</b>Profit Gate</span>'+
        '</div>'+
        '<p>'+esc(s.variant_title||s.variant_id)+' · '+esc(s.shipping_method||"")+' · '+esc(s.shipping_aging||"")+'</p>'+
        '<p class="dc-detail-note">One variant × one destination is verified. Portfolio coverage remains PREP.</p>'
      : '<p>Runs Product Detail → verified Variant → live CJ Stock/Shipping quote. No order is created.</p>')+
    (s?.error?'<p class="dc-refresh-error">'+esc(s.error)+'</p>':'')+
    '<div class="dc-detail-controls"><input data-detail-country maxlength="2" value="'+country+'" aria-label="Destination country code"><button type="button" data-detail-verify>Verify Detail</button></div>'+
  '</section>';
}
function inject(){
  const inspector=document.querySelector("#dragon-core-inspector.open");
  if(!inspector||inspector.querySelector("h2")?.textContent?.trim()!=="Products")return;
  inspector.querySelector("[data-detail-shadow-card]")?.remove();
  const live=inspector.querySelector("[data-product-live-card]");
  if(live)live.insertAdjacentHTML("afterend",card());else inspector.insertAdjacentHTML("beforeend",card());
}
function paint(){inject();}
window.addEventListener("dragon:product-detail-shadow",e=>{current=e.detail||null;setTimeout(paint,0)});
document.addEventListener("click",async e=>{
  const btn=e.target.closest("[data-detail-verify]");
  if(btn){
    const cardEl=btn.closest("[data-detail-shadow-card]");
    const cc=String(cardEl?.querySelector("[data-detail-country]")?.value||"US").trim().toUpperCase();
    btn.disabled=true;
    await window.DragonProductDetailShadow?.runBrowser?.({country_code:cc});
    setTimeout(paint,0);
    return;
  }
  if(e.target.closest('[data-dc-node="products"],[data-dc-nav-node="products"],[data-dc-right-node="products"]'))setTimeout(paint,0);
});
function init(){paint();setTimeout(paint,350);setTimeout(paint,1000)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.DRAGON_PRODUCT_DETAIL_SHADOW_UI=Object.freeze({paint});
})();