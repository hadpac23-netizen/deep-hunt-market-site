(() => {
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let current=null;
const read=()=>current||window.DRAGON_FUSION_REGISTRY_STATE||null;
function card(){
  const s=read(),m=s?.summary||{};
  return '<section class="dc-status-card dc-fusion-card" data-fusion-card>'+
    '<span class="dc-chip '+(m.mapped?"ready":"prep")+'">'+(m.mapped?"FUSION MAPPED":"FUSION REVIEW")+'</span>'+
    '<small>BOOM STUDIO → DRAGON FUSION</small>'+
    '<h3>One runtime · one owner per capability</h3>'+
    '<div class="dc-stat-grid">'+
      '<div><strong>'+esc(m.total??"—")+'</strong><span>Capabilities</span></div>'+
      '<div><strong>'+esc(m.connected??"—")+'</strong><span>Repo/Connected</span></div>'+
      '<div><strong>'+esc(m.preserved??"—")+'</strong><span>Preserved</span></div>'+
    '</div>'+
    '<p>'+esc(m.primaryViews??"—")+' existing Studio views preserved · '+esc(m.planned??"—")+' control-plane items still planned/partial.</p>'+
    '<p class="dc-fusion-rule">Extract capabilities — not legacy runtime. No silent deletion.</p>'+
  '</section>';
}
function injectRight(){
  const panel=document.querySelector("#dragon-core-right-panel");if(!panel)return;
  panel.querySelector("[data-fusion-card]")?.remove();
  panel.insertAdjacentHTML("beforeend",card());
}
function inspector(){
  const h=document.querySelector("#dragon-core-inspector.open");if(!h)return;
  const title=h.querySelector("h2")?.textContent?.trim();
  if(!["DRAGON CORE","Owner Gate","Decisions","F35","F50","F60T","BOOM Stylist","Verifier"].includes(title))return;
  h.querySelector("[data-fusion-inspector]")?.remove();
  const s=read(),m=s?.summary||{};
  h.insertAdjacentHTML("beforeend",
    '<section class="dc-info dc-fusion-inspector" data-fusion-inspector>'+
    '<small>FUSION REGISTRY</small>'+
    '<p><b>'+esc(m.total??"—")+' capabilities</b> mapped into canonical owners.</p>'+
    '<p>'+esc(m.preserved??"—")+' archived capabilities preserved; '+esc(m.planned??"—")+' still need control-plane wiring.</p>'+
    '<p>No legacy capability is deleted merely because DRAGON became the visual home.</p>'+
    '</section>');
}
function paint(){injectRight();inspector();}
window.addEventListener("dragon:fusion-registry",e=>{current=e.detail||null;setTimeout(paint,0)});
document.addEventListener("click",e=>{
  if(e.target.closest("[data-dc-node],[data-dc-right-tab]"))setTimeout(paint,0);
});
const obs=new MutationObserver(()=>{const p=document.querySelector("#dragon-core-right-panel");if(p&&!p.querySelector("[data-fusion-card]"))injectRight()});
function init(){const p=document.querySelector("#dragon-core-right-panel");if(p)obs.observe(p,{childList:true});paint();setTimeout(paint,500);setTimeout(paint,1400)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.DRAGON_FUSION_UI=Object.freeze({paint});
})();