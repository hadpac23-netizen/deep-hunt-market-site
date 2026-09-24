(() => {
"use strict";
const clean=v=>String(v??"").trim();
const esc=v=>clean(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let state=Object.freeze({status:"IDLE",items:[],counts:{},material_execution:{}});
let timer=null;

function relative(ts){
  const ms=Date.parse(ts||"");
  if(!Number.isFinite(ms))return "—";
  const d=Math.max(0,Date.now()-ms);
  const m=Math.floor(d/60000);
  if(m<1)return "now";
  if(m<60)return m+"m";
  const h=Math.floor(m/60);
  if(h<24)return h+"h";
  return Math.floor(h/24)+"d";
}
function tone(item={}){
  const s=clean(item.status).toUpperCase();
  if(item.kind==="OWNER_GATE"||s==="WAITING_OWNER")return "gate";
  if(["FAILED","BLOCKED","EXPIRED","OFF"].includes(s))return "hold";
  if(["VERIFIED","ON","HEALTHY","DONE","COMPLETED","RUNNING","QUEUED"].includes(s))return "ready";
  return "prep";
}
function normalize(data={}){
  return Object.freeze({
    status:data?.ok===true?"READY":"BLOCKED",
    generated_at:data?.generated_at||null,
    counts:Object.freeze({...data?.counts}),
    material_execution:Object.freeze({...data?.material_execution}),
    items:Object.freeze((Array.isArray(data?.items)?data.items:[]).map(x=>Object.freeze({...x}))),
    error:data?.error||null
  });
}
async function refresh(){
  const client=window.BOOM_SUPABASE_CLIENT;
  if(!client?.functions?.invoke){
    state=Object.freeze({status:"PREVIEW",items:[],counts:{},material_execution:{},error:"Supabase session unavailable"});
    paint();
    return state;
  }
  state=Object.freeze({...state,status:"LOADING"});
  paint();
  const {data,error}=await client.functions.invoke("hunt-control-plane-activity",{body:{limit:50}});
  if(error){
    state=Object.freeze({status:"BLOCKED",items:[],counts:{},material_execution:{},error:error.message||String(error)});
  }else{
    state=normalize(data||{});
  }
  window.DRAGON_CONTROL_ACTIVITY_STATE=state;
  window.dispatchEvent(new CustomEvent("dragon:control-activity",{detail:state}));
  paint();
  return state;
}
function row(item){
  const meta=[
    item.manager?item.manager:null,
    item.action_class?item.action_class:null,
    item.expires_at?"lease "+relative(item.expires_at):null,
    Number(item.recurrence_count||0)>0?"repeat "+Number(item.recurrence_count):null
  ].filter(Boolean).join(" · ");
  return '<div class="dc-activity-row '+tone(item)+'">'+
    '<div class="dc-activity-icon">'+esc((item.kind||"?").slice(0,1))+'</div>'+
    '<div class="dc-activity-body">'+
      '<div class="dc-activity-top"><b>'+esc(item.kind||"EVENT")+'</b><span>'+esc(relative(item.at))+'</span></div>'+
      '<strong>'+esc(item.status||"—")+'</strong>'+
      '<p>'+esc(item.summary||meta||"Control Plane activity")+'</p>'+
      (meta?'<small>'+esc(meta)+'</small>':'')+
    '</div>'+
  '</div>';
}
function markup(){
  const c=state.counts||{},m=state.material_execution||{};
  const materialOff=!(m.payment_live||m.supplier_live_order||m.external_publish);
  return '<section class="dc-status-card dc-live-activity-card" data-control-activity-card>'+
    '<div class="dc-activity-head"><div><small>CONTROL ACTIVITY · LIVE</small><h3>What DRAGON did, why, and what is gated</h3></div>'+
    '<button type="button" data-control-activity-refresh>REFRESH</button></div>'+
    '<div class="dc-activity-stats">'+
      '<span><b>'+esc(c.commands??"—")+'</b>Commands</span>'+
      '<span><b>'+esc(c.waiting_owner??"—")+'</b>Owner Gates</span>'+
      '<span><b>'+esc(c.evidence??"—")+'</b>Evidence</span>'+
      '<span><b>'+esc(c.managers??"—")+'</b>Managers</span>'+
    '</div>'+
    '<p class="dc-material-state '+(materialOff?"safe":"danger")+'">MATERIAL EXECUTION: '+(materialOff?"OFF":"REVIEW")+
      ' · Payment '+(m.payment_live?"ON":"OFF")+
      ' · Supplier '+(m.supplier_live_order?"ON":"OFF")+
      ' · Publish '+(m.external_publish?"ON":"OFF")+'</p>'+
    (state.status==="LOADING"?'<p class="dc-activity-empty">Refreshing live control activity…</p>':
      state.error?'<p class="dc-activity-error">'+esc(state.error)+'</p>':
      state.items.length?'<div class="dc-activity-feed">'+state.items.slice(0,24).map(row).join("")+'</div>':
      '<p class="dc-activity-empty">No activity loaded yet.</p>')+
  '</section>';
}
function paint(){
  const mount=document.querySelector("[data-control-activity-mount]");
  if(!mount)return;
  mount.innerHTML=markup();
}
function tabActive(){
  const b=document.querySelector('[data-dc-right-tab="activity"]');
  return Boolean(b?.classList.contains("active")&&document.body.classList.contains("dragon-core-mode")&&!document.hidden);
}
function schedule(){
  if(timer)clearInterval(timer);
  timer=setInterval(()=>{if(tabActive())refresh()},45000);
}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-control-activity-refresh]")){refresh();return}
  const tab=e.target.closest('[data-dc-right-tab="activity"]');
  if(tab)setTimeout(()=>{paint();refresh()},30);
});
document.addEventListener("visibilitychange",()=>{if(tabActive())refresh()});
window.addEventListener("dragon:control-plane",()=>{if(tabActive())refresh()});
function init(){schedule();setTimeout(()=>{paint();if(tabActive())refresh()},500)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();

const api=Object.freeze({normalize,tone,relative,refresh,paint});
window.DragonControlActivity=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();