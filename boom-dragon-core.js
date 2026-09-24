(function(){
"use strict";
const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

const N=[
{id:"core",name:"DRAGON CORE",kind:"EXECUTIVE BRAIN",x:1280,y:720,cls:"dc-core",e:"Reason · debate · simulate · decide · learn",u:["Live business evidence is not wired yet","Production authority remains OFF"],a:"Observe, verify, simulate, then prepare Owner-gated action."},
{id:"customers",name:"Customers",kind:"CUSTOMER CORE",x:1280,y:405,cls:"dc-primary",e:"Journey · cohorts · intent",u:["Live cohort feed"],a:"Find the largest journey drop and explain it."},
{id:"products",name:"Products",kind:"PRODUCT CORE",x:990,y:565,cls:"dc-primary",e:"Product · variant · country truth",u:["Live shipping proof"],a:"Rank only truth-ready products."},
{id:"orders",name:"Orders",kind:"ORDER CORE",x:990,y:875,cls:"dc-primary",e:"Cart · checkout · fulfillment · return",u:["Live order stream"],a:"Measure fulfilled outcomes, not checkout volume."},
{id:"profit",name:"Profit",kind:"PROFIT CORE",x:1280,y:1035,cls:"dc-primary",e:"Margin · CAC · AOV · returns · LTV",u:["Live ad cost + return cost"],a:"Block scale when contribution profit is unknown."},
{id:"decisions",name:"Decisions",kind:"DECISION CORE",x:1570,y:875,cls:"dc-primary",e:"TEST · READY · HOLD · REJECT",u:["Owner decision"],a:"Prepare one evidence-backed Decision Card."},
{id:"owner",name:"Owner Gate",kind:"AUTHORITY",x:1570,y:565,cls:"dc-primary",e:"Final authority boundary",u:[],a:"Approve, reject, or request more evidence."},
{id:"ads",name:"Ads",kind:"GROWTH",x:1850,y:440,cls:"",e:"Campaign · audience · creative",u:["Ads Manager feed"],a:"Trace ad → customer stage → order → net profit."},
{id:"suppliers",name:"Suppliers",kind:"SUPPLY",x:690,y:520,cls:"",e:"QC · stock · MOQ · SLA",u:["Fresh supplier evidence"],a:"Use verified supplier truth before scale."},
{id:"shipping",name:"Shipping",kind:"LOGISTICS",x:710,y:1010,cls:"",e:"Country · ETA · cost",u:["Destination quote"],a:"Refresh stale shipping before READY."},
{id:"pricing",name:"Pricing",kind:"PRICE GATE",x:1280,y:1245,cls:"",e:"Floor · margin · offer",u:["Live price gate"],a:"Simulate price changes before release."},
{id:"analytics",name:"Analytics",kind:"MEASUREMENT",x:2190,y:720,cls:"",e:"CTR · CVR · AOV · repeat",u:["Live event stream"],a:"Explain change before claiming cause."},
{id:"f35",name:"F35",kind:"RESEARCH",x:810,y:205,cls:"dc-agent",e:"Fresh evidence · market · supplier",u:[],a:"Bring verified evidence."},
{id:"f50",name:"F50",kind:"RED TEAM",x:500,y:1080,cls:"dc-agent",e:"Contradictions · hidden failure",u:[],a:"Attack the decision before Owner review."},
{id:"f60t",name:"F60T",kind:"DEMAND",x:2140,y:185,cls:"dc-agent",e:"Attention · offer · timing",u:[],a:"Propose where and when to test."},
{id:"stylist",name:"BOOM Stylist",kind:"TASTE",x:705,y:770,cls:"dc-agent",e:"Visual fit · assortment",u:[],a:"Improve product and creative fit."},
{id:"verifier",name:"Verifier",kind:"CONTROL",x:1765,y:1030,cls:"dc-agent",e:"Evidence · freshness · lineage",u:[],a:"Fail closed on stale or missing proof."}
];
const E=[
["core","customers"],["core","products"],["core","orders"],["core","profit"],["core","decisions"],["core","owner"],
["customers","ads"],["products","suppliers"],["orders","shipping"],["profit","pricing"],["decisions","verifier"],
["core","f35"],["core","f50"],["core","f60t"],["products","stylist"],["analytics","core"]
];
const GROUPS=[
{p:"customers",b:[["Intent",["Cold","Warm","Hot"]],["Purchase",["Buyer","Repeat"]],["Retention",["VIP","At Risk","Lost"]]],br:500,lr:710,sp:70},
{p:"products",b:[["Fashion",["Women","Men","Kids"]],["Lifestyle",["Beauty","Accessories","Home"]],["Utility",["Tech","Office","Lighting"]]],br:500,lr:710,sp:66},
{p:"ads",b:[["Creative",["Hook","Script","Visual"]],["Audience",["Segment","Platform","Timing"]],["Performance",["CTR","CVR","ROAS"]]],br:510,lr:710,sp:62},
{p:"orders",b:[["Conversion",["Cart","Checkout","Paid"]],["Fulfillment",["Packed","Shipped","Delivered"]],["Aftercare",["Return","Refund","Repeat"]]],br:500,lr:700,sp:66},
{p:"profit",b:[["Unit Econ",["Margin","Fees","Shipping"]],["Growth Econ",["CAC","AOV","ROAS"]],["Lifetime",["Returns","Repeat","LTV"]]],br:500,lr:710,sp:68},
{p:"suppliers",b:[["Supply",["Stock","MOQ","Variants"]],["Logistics",["Warehouse","Shipping","Tracking"]],["Trust",["QC","SLA","API"]]],br:510,lr:710,sp:62}
];
const MODULES=[
["Owner","owner-home",-116],["Pro Studio","studio",-90],["Brain","hunt-intelligence",-64],["Professional","professional-workbench",-38],
["Brand Factory","brand-factory",-12],["Connect","connect",14],["Executions","executions",40],["Evaluations","evaluations",66],["Learning","learning",92]
];
const VIEWS={Executive:["core","customers","products","orders","profit","decisions","owner","ads","suppliers","shipping","f35","f50","f60t","stylist","verifier"],Commerce:["core","customers","products","orders","profit","decisions","owner","suppliers","shipping","pricing","stylist","verifier"],Growth:["core","customers","products","profit","ads","analytics","f35","f60t","stylist","owner"],Risk:["core","orders","profit","decisions","owner","suppliers","shipping","pricing","f50","verifier"],Learning:["core","f35","f50","f60t","stylist","verifier","owner"]};
const state={scale:.55,x:0,y:0,drag:false,lx:0,ly:0,view:"Executive",focus:null};
const by=id=>N.find(n=>n.id===id);

function path(cls,a,b,key=""){const svg=$("#dragon-core-links"),p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("class",cls);p.dataset.edge=key;p.setAttribute("d","M "+a.x+" "+a.y+" Q "+((a.x+b.x)/2)+" "+(((a.y+b.y)/2)-18)+" "+b.x+" "+b.y);svg.appendChild(p);return p}
function renderMain(){
 const host=$("#dragon-core-nodes"),svg=$("#dragon-core-links"); if(!host||!svg)return; host.innerHTML="";svg.innerHTML="";
 E.forEach(([a,b])=>path("dc-link",by(a),by(b),a+"|"+b));
 N.forEach(n=>{const el=document.createElement("button");el.type="button";el.className="dc-node "+n.cls;el.dataset.dcNode=n.id;el.style.left=n.x+"px";el.style.top=n.y+"px";el.innerHTML="<strong>"+esc(n.name)+"</strong><small>"+esc(n.kind)+"</small>";host.appendChild(el)});
 renderGroups();renderModules();applyView();
}
function renderGroups(){
 const host=$("#dragon-core-nodes"),cx=1280,cy=720;
 GROUPS.forEach((g,gi)=>{const parent=by(g.p),base=Math.atan2(parent.y-cy,parent.x-cx),spread=g.sp*Math.PI/180;
   g.b.forEach((branch,bi)=>{const ang=base-spread*.34+(spread*.68*bi/(g.b.length-1));const hub={x:cx+Math.cos(ang)*g.br,y:cy+Math.sin(ang)*g.br};
     path("dc-sub-link",parent,hub,g.p);
     const h=document.createElement("div");h.className="dc-subhub";h.dataset.parent=g.p;h.style.left=hub.x+"px";h.style.top=hub.y+"px";h.innerHTML="<span></span><small>"+esc(branch[0])+"</small>";host.appendChild(h);
     const items=branch[1],is=(Math.min(18,Math.max(10,items.length*6))*Math.PI/180);
     items.forEach((label,i)=>{const a=ang-is/2+(is*i/Math.max(1,items.length-1)),leaf={x:cx+Math.cos(a)*(g.lr+(i%2?16:-10)),y:cy+Math.sin(a)*(g.lr+(i%2?16:-10))};path("dc-leaf-link",hub,leaf,g.p);
       const l=document.createElement("div");l.className="dc-leaf";l.dataset.parent=g.p;l.style.left=leaf.x+"px";l.style.top=leaf.y+"px";l.innerHTML="<span></span><small>"+esc(label)+"</small>";host.appendChild(l);
     });
   });
 });
}
function renderModules(){
 const host=$("#dragon-core-nodes"),cx=1280,cy=720,r=930,inner=800;
 MODULES.forEach(([label,view,deg])=>{const a=deg*Math.PI/180,pos={x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r},start={x:cx+Math.cos(a)*inner,y:cy+Math.sin(a)*inner};path("dc-module-link",start,pos,view);
   const b=document.createElement("button");b.type="button";b.className="dc-module";b.dataset.dcModule=view;b.style.left=pos.x+"px";b.style.top=pos.y+"px";b.innerHTML="<strong>"+esc(label)+"</strong><small>STUDIO MODULE</small>";host.appendChild(b);
 });
}
function renderViews(){const h=$("#dragon-core-views");if(!h)return;h.innerHTML=Object.keys(VIEWS).map(v=>'<button type="button" data-dc-view="'+v+'" class="'+(v===state.view?"active":"")+'">'+v.toUpperCase()+'</button>').join("")}
function applyView(){const allowed=new Set(VIEWS[state.view]||N.map(n=>n.id));$$("[data-dc-node]").forEach(el=>el.style.display=allowed.has(el.dataset.dcNode)?"":"none");$$(".dc-subhub,.dc-leaf,.dc-sub-link,.dc-leaf-link").forEach(el=>el.style.display=allowed.has(el.dataset.parent)?"":"none")}
function near(id){const s=new Set([id]);E.forEach(([a,b])=>{if(a===id)s.add(b);if(b===id)s.add(a)});return s}
function focus(id){
 state.focus=id;const nset=id?near(id):null;
 $$(".dc-node").forEach(el=>{el.classList.toggle("dc-dim",!!nset&&!nset.has(el.dataset.dcNode));el.classList.toggle("dc-focus",!!nset&&nset.has(el.dataset.dcNode))});
 $$(".dc-link").forEach(el=>{const pair=(el.dataset.edge||"").split("|"),on=!!id&&(pair[0]===id||pair[1]===id);el.classList.toggle("dim",!!id&&!on);el.classList.toggle("focus",on)});
 $$(".dc-subhub,.dc-leaf,.dc-sub-link,.dc-leaf-link").forEach(el=>{const on=!id||el.dataset.parent===id||nset?.has(el.dataset.parent);el.classList.toggle("dc-dim",!!id&&!on);el.classList.toggle("dc-focus",!!id&&on);el.classList.toggle("dim",!!id&&!on);el.classList.toggle("focus",!!id&&on)});
 if(id&&id!=="core")showInspector(id);else hideInspector();
}
function showInspector(id){const h=$("#dragon-core-inspector"),n=by(id);if(!h||!n)return;h.classList.add("open");h.innerHTML='<button class="dc-inspector-close" data-dc-close type="button">×</button><small>DRAGON CORE DETAIL · DEMO</small><h2>'+esc(n.name)+'</h2><p>'+esc(n.kind)+' · '+esc(n.e)+'</p><section class="dc-info"><small>UNKNOWNS / BLOCKERS</small><ul>'+(n.u.length?n.u:["No critical unknown in demo"]).map(x=>"<li>"+esc(x)+"</li>").join("")+'</ul></section><section class="dc-info dc-action"><small>NEXT SAFE ACTION</small><strong>'+esc(n.a)+'</strong><p>Prototype only · no Production action.</p></section>'}
function hideInspector(){const h=$("#dragon-core-inspector");if(h){h.classList.remove("open");h.innerHTML=""}}
function transform(){const c=$("#dragon-core-canvas");if(c)c.style.transform="translate("+state.x+"px,"+state.y+"px) scale("+state.scale+")"}
function fit(){const v=$("#dragon-core-viewport");if(!v)return;state.scale=Math.max(.3,Math.min(.92,Math.min(v.clientWidth/2560,v.clientHeight/1440)*.96));state.x=(v.clientWidth-2560*state.scale)/2;state.y=(v.clientHeight-1440*state.scale)/2;transform()}
function camera(id){const v=$("#dragon-core-viewport"),n=by(id);if(!v||!n)return;state.scale=Math.max(state.scale,id==="core"?.56:.72);state.x=v.clientWidth/2-n.x*state.scale;state.y=v.clientHeight/2-n.y*state.scale;transform()}
function zoom(d){state.scale=Math.max(.3,Math.min(1.25,state.scale+d));transform()}
function navigate(view){const tab=document.querySelector('[data-tab="'+view+'"]');if(tab){tab.click();return}document.getElementById(view)?.scrollIntoView()}
function installReturnButtons(){["owner-home","studio","hunt-intelligence","professional-workbench","brand-factory","connect","executions","evaluations","learning"].forEach(id=>{const v=document.getElementById(id);if(!v||v.querySelector("[data-return-dragon-core]"))return;const b=document.createElement("button");b.type="button";b.className="dragon-core-return";b.dataset.returnDragonCore="1";b.textContent="← DRAGON CORE";b.onclick=()=>navigate("dragon-control-room");v.appendChild(b)})}
function bind(){
 document.addEventListener("click",e=>{const m=e.target.closest("[data-dc-module]");if(m){navigate(m.dataset.dcModule);return}const n=e.target.closest("[data-dc-node]");if(n){focus(n.dataset.dcNode);camera(n.dataset.dcNode);return}if(e.target.closest("[data-dc-close]")){focus("core");camera("core");return}const vw=e.target.closest("[data-dc-view]");if(vw){state.view=vw.dataset.dcView;renderViews();applyView();focus("core");return}const z=e.target.closest("[data-core-zoom]");if(z){z.dataset.coreZoom==="fit"?fit():zoom(z.dataset.coreZoom==="in"?.07:-.07);return}});
 const v=$("#dragon-core-viewport");if(v){v.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY<0?.04:-.04)},{passive:false});v.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;state.drag=true;state.lx=e.clientX;state.ly=e.clientY;v.classList.add("dragging");v.setPointerCapture(e.pointerId)});v.addEventListener("pointermove",e=>{if(!state.drag)return;state.x+=e.clientX-state.lx;state.y+=e.clientY-state.ly;state.lx=e.clientX;state.ly=e.clientY;transform()});v.addEventListener("pointerup",()=>{state.drag=false;v.classList.remove("dragging")});v.addEventListener("dblclick",e=>{if(!e.target.closest("button")){focus("core");fit()}})}
 const tab=document.querySelector('[data-tab="dragon-control-room"]');if(tab)tab.addEventListener("click",()=>{history.replaceState(null,"","#dragon-control-room");setTimeout(()=>{renderMain();renderViews();focus("core");camera("core")},50)});
 window.addEventListener("hashchange",()=>{if(location.hash==="#dragon-control-room")tab?.click()});window.addEventListener("resize",()=>{if($("#dragon-control-room")?.classList.contains("active"))fit()});
}
function init(){if(!$("#dragon-control-room"))return;renderMain();renderViews();bind();installReturnButtons();focus("core");setTimeout(()=>{if(location.hash==="#dragon-control-room")document.querySelector('[data-tab="dragon-control-room"]')?.click();else fit()},80);window.DRAGON_CORE={version:"4.3-unified",nodes:N,modules:MODULES,fit,focus,authority:"SHADOW_ONLY",dataMode:"DEMO_ONLY"}}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();