(() => {
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let current=null;
const read=()=>current||window.DRAGON_CONTROL_PLANE_STATE||null;
function label(s=read()){
  if(!s)return "CONTROL PREP";
  if(s.status==="BLOCKED")return "CONTROL BLOCKED";
  if(s.readiness?.routing==="READY")return "SHADOW READY";
  return "CONTROL REVIEW";
}
function tone(s=read()){return s?.readiness?.routing==="READY"?"ready":s?.status==="BLOCKED"?"hold":"prep"}
function card(){
  const s=read(),c=s?.counts||{},q=s?.queue||{},r=s?.readiness||{};
  return '<section class="dc-status-card dc-control-plane-card" data-control-plane-card>'+
    '<span class="dc-chip '+tone(s)+'">'+esc(label(s))+'</span>'+
    '<small>CONTROL PLANE · SHADOW</small>'+
    '<h3>Run → Lease → Permission → Evidence → Gate → Learning</h3>'+
    '<div class="dc-stat-grid">'+
      '<div><strong>'+esc(c.active_runs??"—")+'</strong><span>Active Runs</span></div>'+
      '<div><strong>'+esc(q.waiting_owner??"—")+'</strong><span>Owner Gate</span></div>'+
      '<div><strong>'+esc(q.blocked??"—")+'</strong><span>Blocked</span></div>'+
    '</div>'+
    '<p>Routing '+esc(r.routing||"PREP")+' · Queue '+esc(r.derived_queue||"PREP")+
      ' · Handoff '+esc(r.handoff||"PREP")+' · Tools '+esc(r.permissions||"PREP")+' · Execution '+esc(r.execution||"OFF")+'</p>'+
    '<p class="dc-control-rule">Uses existing BOOM runtime. No second client, queue or executor.</p>'+
  '</section>';
}
function inspector(){
  const h=document.querySelector("#dragon-core-inspector.open");if(!h)return;
  const title=h.querySelector("h2")?.textContent?.trim();
  if(!["DRAGON CORE","Owner Gate","Decisions","Verifier"].includes(title))return;
  h.querySelector("[data-control-plane-inspector]")?.remove();
  const s=read(),c=s?.counts||{},q=s?.queue||{},r=s?.readiness||{};
  const gaps=(s?.gaps||[]).slice(0,8).map(x=>"<li>"+esc(x)+"</li>").join("");
  h.insertAdjacentHTML("beforeend",
    '<section class="dc-info dc-control-plane-inspector" data-control-plane-inspector>'+
      '<small>CONTROL PLANE V1</small>'+
      '<p><b>'+esc(c.runs??0)+' derived runs</b> · '+esc(c.managers??0)+' managers · '+esc(c.workers??0)+' workers</p>'+
      '<div class="dc-control-queue"><span>Queued <b>'+esc(q.queued??0)+'</b></span><span>Running <b>'+esc(q.running??0)+'</b></span><span>Owner <b>'+esc(q.waiting_owner??0)+'</b></span><span>Blocked <b>'+esc(q.blocked??0)+'</b></span></div>'+
      '<p>Permissions '+esc(r.permissions||"PREP")+' · Lease '+esc(r.leases||"PREP")+' · Retry '+esc(r.retry||"PREP")+' · Evidence '+esc(r.evidence||"PREP")+'</p>'+
      '<p>Budget '+esc(s?.policy?.budget_status||"PREP")+' · External spend 
      '<ul>'+gaps+'</ul>'+
      '<p>No live action is executed by this layer.</p>'+
    '</section>');
}
function paint(){
  const p=document.querySelector("#dragon-core-right-panel");
  if(p){p.querySelector("[data-control-plane-card]")?.remove();p.insertAdjacentHTML("afterbegin",card())}
  inspector();
}
window.addEventListener("dragon:control-plane",e=>{current=e.detail||null;setTimeout(paint,0)});
document.addEventListener("click",e=>{if(e.target.closest("[data-dc-node],[data-dc-right-tab]"))setTimeout(paint,0)});
const obs=new MutationObserver(()=>{const p=document.querySelector("#dragon-core-right-panel");if(p&&!p.querySelector("[data-control-plane-card]"))paint()});
function init(){const p=document.querySelector("#dragon-core-right-panel");if(p)obs.observe(p,{childList:true});paint();setTimeout(paint,600);setTimeout(paint,1500)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.DRAGON_CONTROL_PLANE_UI=Object.freeze({paint,label,tone});
})();+esc(s?.policy?.external_spend_usd??"—")+' · Scheduler '+esc(r.scheduler||"PREP")+'</p>'+
      '<ul>'+gaps+'</ul>'+
      '<p>No live action is executed by this layer.</p>'+
    '</section>');
}
function paint(){
  const p=document.querySelector("#dragon-core-right-panel");
  if(p){p.querySelector("[data-control-plane-card]")?.remove();p.insertAdjacentHTML("afterbegin",card())}
  inspector();
}
window.addEventListener("dragon:control-plane",e=>{current=e.detail||null;setTimeout(paint,0)});
document.addEventListener("click",e=>{if(e.target.closest("[data-dc-node],[data-dc-right-tab]"))setTimeout(paint,0)});
const obs=new MutationObserver(()=>{const p=document.querySelector("#dragon-core-right-panel");if(p&&!p.querySelector("[data-control-plane-card]"))paint()});
function init(){const p=document.querySelector("#dragon-core-right-panel");if(p)obs.observe(p,{childList:true});paint();setTimeout(paint,600);setTimeout(paint,1500)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.DRAGON_CONTROL_PLANE_UI=Object.freeze({paint,label,tone});
})();