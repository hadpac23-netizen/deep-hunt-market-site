(() => {
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let current=null;
const read=()=>current||window.DRAGON_SECURITY_STATE||null;
function card(){
  const s=read()||{};
  const dbReady=s.database_status==="HARDENED";
  const authReady=s.leaked_password_protection==="ENABLED";
  return '<section class="dc-status-card dc-security-card" data-security-card>'+
    '<span class="dc-chip '+(dbReady&&authReady?"ready":dbReady?"prep":"hold")+'">'+
      (dbReady&&authReady?"SECURITY READY":dbReady?"DB HARDENED · AUTH PREP":"SECURITY REVIEW")+
    '</span>'+
    '<small>SECURITY / VERIFIER</small>'+
    '<h3>Database hardened · Auth blocker visible</h3>'+
    '<div class="dc-security-grid">'+
      '<span><b>'+esc(s.definer_warnings??"—")+'</b>Public Definer Warnings</span>'+
      '<span><b>'+esc(s.rls_warnings??"—")+'</b>RLS Policy Warnings</span>'+
      '<span><b>'+(s.leaked_password_protection==="ENABLED"?"ON":"OFF")+'</b>Leaked Password Protection</span>'+
    '</div>'+
    '<p>'+(dbReady
      ? 'Public privileged RPCs are behind private implementations and explicit server-only deny policies.'
      : 'Database security state needs review.')+'</p>'+
    (!authReady
      ? '<p class="dc-security-blocker"><b>AUTH BLOCKER</b> · Leaked Password Protection is still disabled.</p>'
      : '')+
  '</section>';
}
function injectRight(){
  const panel=document.querySelector("#dragon-core-right-panel");if(!panel)return;
  panel.querySelector("[data-security-card]")?.remove();
  panel.insertAdjacentHTML("beforeend",card());
}
function injectInspector(){
  const h=document.querySelector("#dragon-core-inspector.open");if(!h)return;
  const title=h.querySelector("h2")?.textContent?.trim();
  if(!["Verifier","DRAGON CORE","Owner Gate"].includes(title))return;
  h.querySelector("[data-security-inspector]")?.remove();
  const s=read()||{};
  h.insertAdjacentHTML("beforeend",
    '<section class="dc-info dc-security-inspector" data-security-inspector>'+
      '<small>SECURITY STATUS</small>'+
      '<p><b>DB '+esc(s.database_status||"UNKNOWN")+'</b> · Definer '+esc(s.definer_warnings??"—")+' · RLS '+esc(s.rls_warnings??"—")+'</p>'+
      '<p>Leaked Password Protection: <b>'+esc(s.leaked_password_protection||"UNKNOWN")+'</b></p>'+
    '</section>');
}
function paint(){injectRight();injectInspector()}
window.addEventListener("dragon:security-status",e=>{current=e.detail||null;setTimeout(paint,0)});
document.addEventListener("click",e=>{
  if(e.target.closest("[data-dc-node],[data-dc-right-tab]"))setTimeout(paint,0);
});
const obs=new MutationObserver(()=>{const p=document.querySelector("#dragon-core-right-panel");if(p&&!p.querySelector("[data-security-card]"))injectRight()});
function init(){const p=document.querySelector("#dragon-core-right-panel");if(p)obs.observe(p,{childList:true});paint();setTimeout(paint,600)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.DRAGON_SECURITY_UI=Object.freeze({paint});
})();