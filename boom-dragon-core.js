(function(){
"use strict";
const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

const CORE=[
{id:"core",name:"DRAGON CORE",icon:"D",kind:"EXECUTIVE BRAIN",x:1280,y:610,color:"#ffb21b",cls:"dc-core",desc:"The orchestration and decision kernel for BOOM Studio.",unknowns:["Live commerce evidence is still being wired","Production authority remains Owner-gated"],action:"Observe → verify → simulate → prepare an Owner-gated decision."},
{id:"customers",name:"Customers",icon:"◎",kind:"CUSTOMER CORE",x:930,y:320,color:"#2e83ff",desc:"Customer journey, cohorts, intent and retention.",unknowns:["Live cohort/event feed is PREP"],action:"Find the largest journey drop and explain why."},
{id:"products",name:"Products",icon:"◇",kind:"PRODUCT CORE",x:1630,y:320,color:"#ffad17",desc:"Product truth, categories, inventory, variants and suppliers.",unknowns:["Destination shipping proof is not yet live"],action:"Rank only products that pass hard truth gates."},
{id:"orders",name:"Orders",icon:"▣",kind:"ORDER CORE",x:1805,y:610,color:"#62d86e",desc:"Cart → checkout → fulfillment → delivery → returns.",unknowns:["Live order lifecycle feed is PREP"],action:"Measure fulfilled outcomes, not checkout volume."},
{id:"profit",name:"Profit",icon:"↗",kind:"PROFIT CORE",x:1605,y:900,color:"#f7bf28",desc:"Revenue, contribution margin, CAC, AOV, returns and LTV.",unknowns:["Live ad cost and return-cost feeds are PREP"],action:"Block scale when contribution profit is unverified."},
{id:"decisions",name:"Decisions",icon:"◉",kind:"DECISION CORE",x:955,y:900,color:"#ff5c43",desc:"Evidence-backed TEST / READY / HOLD / REJECT decisions.",unknowns:["Owner approval may be required"],action:"Prepare one clear Decision Card with evidence and unknowns."},
{id:"owner",name:"Owner Gate",icon:"♛",kind:"AUTHORITY",x:755,y:610,color:"#9c5cff",desc:"Final authority for Production, spend, payments and supplier orders.",unknowns:[],action:"Approve, reject or request more evidence."}
];

const SPECIAL=[
{id:"f35",name:"F35",icon:"✈",kind:"RESEARCH",x:620,y:1240,color:"#2e83ff",desc:"Market intelligence · supplier research · fresh evidence"},
{id:"f50",name:"F50",icon:"✣",kind:"RED TEAM",x:940,y:1240,color:"#9c5cff",desc:"Contradictions · failure modes · systems challenge"},
{id:"f60t",name:"F60T",icon:"↟",kind:"DEMAND",x:1280,y:1240,color:"#20d7b1",desc:"Demand · platform timing · transformation"},
{id:"stylist",name:"BOOM Stylist",icon:"☆",kind:"TASTE",x:1620,y:1240,color:"#ff56ba",desc:"Branding · visual quality · creative fit"},
{id:"verifier",name:"Verifier",icon:"✓",kind:"CONTROL",x:1940,y:1240,color:"#27d4ee",desc:"Data checks · quality control · trust and audit"}
];

const BRANCHES={
customers:[
 {hub:"Leads",leaves:["Prospects","Active Customers","Segments"]},
 {hub:"Loyalty",leaves:["Feedback","Support","Community"]},
 {hub:"Journey",leaves:["Cold","Warm","Hot","Buyer"]}
],
products:[
 {hub:"Catalog",leaves:["Product Lines","Categories","Pricing"]},
 {hub:"Inventory",leaves:["Bundles","Lifecycle","R&D"]},
 {hub:"Supply",leaves:["Suppliers","Variants","Stock"]}
],
orders:[
 {hub:"Orders",leaves:["New Orders","Processing","Fulfilled"]},
 {hub:"Aftercare",leaves:["Returns","Subscriptions","Channels"]},
 {hub:"Flow",leaves:["Payment","Logistics","Tracking"]}
],
profit:[
 {hub:"Revenue",leaves:["Gross Profit","Net Profit","Margins"]},
 {hub:"Control",leaves:["Cost Control","Unit Economics","Cash Flow"]},
 {hub:"Growth",leaves:["AOV","CAC","LTV"]}
],
decisions:[
 {hub:"Decision",leaves:["Score","Confidence","Status"]},
 {hub:"Evidence",leaves:["Evidence","Unknowns","Risk"]},
 {hub:"Action",leaves:["Next Action","Owner Gate","Shadow Mode"]}
],
owner:[
 {hub:"Vision",leaves:["Goals","Strategy","Personal KPI"]},
 {hub:"Freedom",leaves:["Time Freedom","Life Design","Owner Only"]},
 {hub:"Control",leaves:["Approvals","Policies","Guardrails"]}
],
f35:[{hub:"Research",leaves:["Market Intel","Competitive Edge","Trend Analysis","Global View"]}],
f50:[{hub:"Systems",leaves:["Automation","Efficiency","Systems","Scale"]}],
f60t:[{hub:"Demand",leaves:["Platform","Timing","Campaigns","Attribution"]}],
stylist:[{hub:"Creative",leaves:["Hooks","Scripts","Visuals","Creative ID","Learning"]}],
verifier:[{hub:"Trust",leaves:["Data Check","Quality Control","Trust & Audit"]}]
};

const VIEWS={
Executive:["customers","products","orders","profit","decisions","owner"],
Commerce:["products","orders","profit","owner"],
Growth:["customers","products","profit","decisions"],
Risk:["orders","profit","decisions","owner"],
Learning:["decisions","owner"]
};

const NAV=[
{type:"node",id:"core",label:"Core Map",icon:"⌘"},
{type:"view",view:"owner-home",label:"Dashboard",icon:"▦"},
{sep:true},
{type:"node",id:"customers",label:"Customers",icon:"◎"},
{type:"node",id:"products",label:"Products",icon:"◇"},
{type:"node",id:"orders",label:"Orders",icon:"▣"},
{type:"node",id:"profit",label:"Profit",icon:"↗"},
{type:"node",id:"decisions",label:"Decisions",icon:"◉"},
{type:"node",id:"owner",label:"Owner Gate",icon:"♛"},
{sep:true},
{type:"node",id:"f35",label:"F35",icon:"✈"},
{type:"node",id:"f50",label:"F50",icon:"✣"},
{type:"node",id:"f60t",label:"F60T",icon:"↟"},
{type:"node",id:"stylist",label:"BOOM Stylist",icon:"☆"},
{type:"node",id:"verifier",label:"Verifier",icon:"✓"}
];

const STUDIO=[
["Pro Studio","studio","READY"],["Brain","hunt-intelligence","READY"],["Professional","professional-workbench","READY"],
["Brand Factory","brand-factory","READY"],["Connect","connect","PREP"],["Executions","executions","READY"],
["Evaluations","evaluations","READY"],["Learning","learning","READY"]
];

const CONNECTIONS=[
["BOOM Studio Fusion","Legacy capabilities mapped to canonical brains","READY"],
["A1–A12 Pipeline","Frozen Studio baseline preserved","READY"],
["Commerce Graph","Graph structure exists","READY"],
["Customer live events","Analytics/event feed","PREP"],
["Orders → Profit truth","Live order + cost evidence","PREP"],
["Content → Journey → Profit","Creative identity + attribution + profit evidence","PREP"],
["Supplier / Shipping truth","Fresh quote + SLA evidence","PREP"],
["Control Plane","Run engine · permissions · scheduler · leases","PREP"],
["Memory / Learning Archive","Preserved backlog · no silent deletion","READY"],
["Owner authority","Material actions remain gated","GATED"]
];

const state={scale:.58,x:0,y:0,drag:false,lx:0,ly:0,view:"Executive",focus:"core",rightTab:"overview"};
const coreBy=id=>CORE.find(n=>n.id===id), specialBy=id=>SPECIAL.find(n=>n.id===id), anyBy=id=>coreBy(id)||specialBy(id);

function svgPath(cls,a,b,color,key){
 const svg=$("#dragon-core-links"),p=document.createElementNS("http://www.w3.org/2000/svg","path");
 p.setAttribute("class",cls);p.dataset.edge=key||"";p.dataset.parent=key||"";p.style.stroke=color;p.style.color=color;
 const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,bend=Math.max(10,Math.min(44,Math.abs(a.x-b.x)*.032));
 p.setAttribute("d","M "+a.x+" "+a.y+" Q "+mx+" "+(my-bend)+" "+b.x+" "+b.y);svg.appendChild(p);return p
}

function renderGraph(){
 const host=$("#dragon-core-nodes"),svg=$("#dragon-core-links");if(!host||!svg)return;host.innerHTML="";svg.innerHTML="";
 const c=coreBy("core");
 CORE.filter(n=>n.id!=="core").forEach(n=>svgPath("dc-link",c,n,n.color,"core|"+n.id));
 SPECIAL.forEach(n=>svgPath("dc-special-link",{x:1280,y:720},n,n.color,"core|"+n.id));
 CORE.forEach(n=>{
   const b=document.createElement("button");b.type="button";b.className="dc-node "+(n.cls||"");b.dataset.dcNode=n.id;b.style.left=n.x+"px";b.style.top=n.y+"px";b.style.setProperty("--node",n.color);
   b.innerHTML='<span class="dc-icon">'+esc(n.icon)+'</span><strong>'+esc(n.name)+'</strong><small>'+esc(n.kind)+'</small>';host.appendChild(b)
 });
 renderBranches();
 SPECIAL.forEach(n=>{
   const b=document.createElement("button");b.type="button";b.className="dc-specialist";b.dataset.dcNode=n.id;b.style.left=n.x+"px";b.style.top=n.y+"px";b.style.setProperty("--node",n.color);
   b.innerHTML='<span class="dc-icon">'+esc(n.icon)+'</span><strong>'+esc(n.name)+'</strong><small>'+esc(n.kind)+'</small>';host.appendChild(b);renderSpecialLeaves(n)
 });
 applyView();
}

function renderBranches(){
 const host=$("#dragon-core-nodes"),cx=1280,cy=610;
 CORE.filter(n=>n.id!=="core").forEach(parent=>{
   const groups=BRANCHES[parent.id]||[],base=Math.atan2(parent.y-cy,parent.x-cx),fan=58*Math.PI/180;
   groups.forEach((group,gi)=>{
     const ga=base-fan*.34+(fan*.68*gi/Math.max(1,groups.length-1)),hub={x:cx+Math.cos(ga)*650,y:cy+Math.sin(ga)*650};
     svgPath("dc-sub-link",parent,hub,parent.color,parent.id);
     const h=document.createElement("div");h.className="dc-subhub";h.dataset.parent=parent.id;h.style.left=hub.x+"px";h.style.top=hub.y+"px";h.style.setProperty("--node",parent.color);h.innerHTML="<span></span><small>"+esc(group.hub)+"</small>";host.appendChild(h);
     const leaves=group.leaves||[],spread=Math.min(21,9+leaves.length*3.5)*Math.PI/180;
     leaves.forEach((label,i)=>{
       const a=ga-spread/2+(spread*i/Math.max(1,leaves.length-1)),leaf={x:cx+Math.cos(a)*(820+(i%2?18:-8)),y:cy+Math.sin(a)*(820+(i%2?18:-8))};
       svgPath("dc-leaf-link",hub,leaf,parent.color,parent.id);
       const l=document.createElement("div");l.className="dc-leaf";l.dataset.parent=parent.id;l.style.left=leaf.x+"px";l.style.top=leaf.y+"px";l.style.setProperty("--node",parent.color);l.innerHTML="<span></span><small>"+esc(label)+"</small>";host.appendChild(l)
     });
   });
 });
}

function renderSpecialLeaves(n){
 const host=$("#dragon-core-nodes"),group=BRANCHES[n.id]?.[0],items=group?.leaves||[],base=Math.PI/2,spread=38*Math.PI/180;
 items.forEach((label,i)=>{
   const a=base-spread/2+(spread*i/Math.max(1,items.length-1)),leaf={x:n.x+Math.cos(a)*126,y:n.y+Math.sin(a)*126};
   svgPath("dc-leaf-link",n,leaf,n.color,n.id);
   const l=document.createElement("div");l.className="dc-leaf";l.dataset.parent=n.id;l.style.left=leaf.x+"px";l.style.top=leaf.y+"px";l.style.setProperty("--node",n.color);l.innerHTML="<span></span><small>"+esc(label)+"</small>";host.appendChild(l)
 });
}

function renderNav(){
 const h=$("#dragon-core-nav");if(!h)return;
 h.innerHTML=NAV.map(item=>item.sep?'<div class="dc-nav-sep"></div>':'<button type="button" class="dc-nav-btn '+(item.id==="core"?"active":"")+'" '+(item.id?'data-dc-nav-node="'+item.id+'"':'data-dc-nav-view="'+item.view+'"')+'><span class="dc-nav-icon">'+esc(item.icon)+'</span><span>'+esc(item.label)+'</span><small class="dc-nav-state"></small></button>').join("")
}

function renderViews(){const h=$("#dragon-core-views");if(h)h.innerHTML=Object.keys(VIEWS).map(v=>'<button type="button" data-dc-view="'+v+'" class="'+(v===state.view?"active":"")+'">'+v.toUpperCase()+'</button>').join("")}
function applyView(){
 const allowed=new Set(VIEWS[state.view]||CORE.map(n=>n.id));
 $$(".dc-node").forEach(el=>{if(el.dataset.dcNode==="core")el.style.display="";else el.style.display=allowed.has(el.dataset.dcNode)?"":"none"});
 $$(".dc-subhub,.dc-sub-link,.dc-leaf,.dc-leaf-link").forEach(el=>{const p=el.dataset.parent;el.style.display=(!p||allowed.has(p)||SPECIAL.some(s=>s.id===p))?"":"none"})
}
function related(id){const set=new Set([id]);if(id==="core"){CORE.forEach(n=>set.add(n.id));SPECIAL.forEach(n=>set.add(n.id));return set}set.add("core");return set}
function focus(id){
 state.focus=id;const rel=related(id);
 $$(".dc-node,.dc-specialist").forEach(el=>{const on=rel.has(el.dataset.dcNode);el.classList.toggle("dc-dim",!on);el.classList.toggle("dc-focus",on)});
 $$(".dc-link,.dc-special-link").forEach(el=>{const parts=(el.dataset.edge||"").split("|"),on=id==="core"||parts.includes(id);el.classList.toggle("dim",!on);el.classList.toggle("focus",on)});
 $$(".dc-subhub,.dc-leaf,.dc-sub-link,.dc-leaf-link").forEach(el=>{const on=id==="core"||el.dataset.parent===id;el.classList.toggle("dc-dim",!on);el.classList.toggle("dc-focus",on);el.classList.toggle("dim",!on);el.classList.toggle("focus",on)});
 $$(".dc-nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.dcNavNode===id));
 id==="core"?hideInspector():showInspector(id);renderRightPanel()
}

function showInspector(id){
 const h=$("#dragon-core-inspector"),n=anyBy(id);if(!h||!n)return;h.classList.add("open");
 h.innerHTML='<button class="dc-inspector-close" type="button" data-dc-close>×</button><small>DRAGON CORE DETAIL · PROTOTYPE</small><h2>'+esc(n.name)+'</h2><p>'+esc(n.kind)+' · '+esc(n.desc)+'</p><section class="dc-info"><small>STATUS</small><p>GRAPH READY · Live evidence may still be PREP.</p></section><section class="dc-info"><small>UNKNOWNS / BLOCKERS</small><ul>'+((n.unknowns||["Live evidence not yet connected"]).map(x=>"<li>"+esc(x)+"</li>").join(""))+'</ul></section><section class="dc-info dc-action"><small>NEXT SAFE ACTION</small><strong>'+esc(n.action||"Prepare evidence and connect the next verified input.")+'</strong><p>No Production action from this prototype.</p></section>'
}
function hideInspector(){const h=$("#dragon-core-inspector");if(h){h.classList.remove("open");h.innerHTML=""}}

function renderRightPanel(){
 const h=$("#dragon-core-right-panel");if(!h)return;
 if(state.rightTab==="metrics"){
   h.innerHTML='<section class="dc-status-card"><small>DECISION QUALITY</small><h3>What DRAGON CORE will measure</h3><div class="dc-connection-list">'+["Evidence freshness","Score vs confidence","False-ready rate","Gate violations","Repeat-error rate","Decision regret"].map(x=>'<div class="dc-connection"><div><strong>'+x+'</strong><small>Metric schema ready · live measurement PREP</small></div><span class="dc-chip prep">PREP</span></div>').join("")+'</div></section>';return
 }
 if(state.rightTab==="activity"){
   const studio=STUDIO.map(x=>'<button type="button" class="dc-right-row" data-dc-studio="'+x[1]+'" style="--row:#ffb21b"><i></i><span><strong>'+x[0]+'</strong><span>Existing BOOM Studio function</span></span><span class="dc-chip '+x[2].toLowerCase()+'">'+x[2]+'</span></button>').join("");
   h.innerHTML='<section class="dc-status-card"><small>STUDIO FUNCTIONS</small><h3>Connected navigation</h3><div class="dc-right-list">'+studio+'</div></section><section class="dc-status-card"><small>LIVE CONNECTIONS</small><div class="dc-connection-list">'+CONNECTIONS.map(c=>'<div class="dc-connection"><div><strong>'+c[0]+'</strong><small>'+c[1]+'</small></div><span class="dc-chip '+c[2].toLowerCase()+'">'+c[2]+'</span></div>').join("")+'</div></section>';return
 }
 const coreRows=CORE.filter(n=>n.id!=="core").map(n=>'<button class="dc-right-row" type="button" data-dc-right-node="'+n.id+'" style="--row:'+n.color+'"><i></i><span><strong>'+n.name+'</strong><span>'+n.kind+'</span></span><span class="dc-chip ready">GRAPH READY</span></button>').join("");
 const specialRows=SPECIAL.map(n=>'<button class="dc-right-row" type="button" data-dc-right-node="'+n.id+'" style="--row:'+n.color+'"><i></i><span><strong>'+n.name+'</strong><span>'+n.kind+'</span></span><span class="dc-chip ready">READY</span></button>').join("");
 h.innerHTML='<section class="dc-status-card"><span class="dc-online">STRUCTURE READY</span><small>SYSTEM STATUS</small><h3>DRAGON CORE connects the BOOM Studio structure</h3><p>Graph, navigation and roles are connected. Live feeds stay marked PREP until verified.</p><div class="dc-stat-grid"><div><strong>6</strong><span>Core Hubs</span></div><div><strong>5</strong><span>Specialists</span></div><div><strong>48+</strong><span>Sub Systems</span></div></div></section><section class="dc-status-card"><small>CORE HUBS</small><div class="dc-right-list">'+coreRows+'</div></section><section class="dc-status-card"><small>SPECIALIST NODES</small><div class="dc-right-list">'+specialRows+'</div></section><div class="dc-quote"><strong>All structural systems connected.</strong><span>Live evidence connections continue in PREP.</span></div>'
}

function transform(){const c=$("#dragon-core-canvas");if(c)c.style.transform="translate("+state.x+"px,"+state.y+"px) scale("+state.scale+")"}
function fit(){const v=$("#dragon-core-viewport");if(!v)return;state.scale=Math.max(.3,Math.min(.93,Math.min(v.clientWidth/2560,v.clientHeight/1440)*.94));state.x=(v.clientWidth-2560*state.scale)/2;state.y=(v.clientHeight-1440*state.scale)/2;transform()}
function camera(id){const v=$("#dragon-core-viewport"),n=anyBy(id);if(!v||!n)return;state.scale=Math.max(state.scale,id==="core"?.58:.68);state.x=v.clientWidth/2-n.x*state.scale;state.y=v.clientHeight/2-n.y*state.scale;transform()}
function zoom(d){state.scale=Math.max(.3,Math.min(1.25,state.scale+d));transform()}
function navigate(view){document.querySelector('[data-tab="'+view+'"]')?.click()}
function installReturnButtons(){["owner-home","studio","hunt-intelligence","professional-workbench","brand-factory","connect","executions","evaluations","learning"].forEach(id=>{const v=document.getElementById(id);if(!v||v.querySelector("[data-return-dragon-core]"))return;const b=document.createElement("button");b.type="button";b.className="dragon-core-return";b.dataset.returnDragonCore="1";b.textContent="← DRAGON CORE";b.onclick=()=>navigate("dragon-control-room");v.appendChild(b)})}
function setMode(on){document.body.classList.toggle("dragon-core-mode",on)}
function search(q){
 q=(q||"").trim().toLowerCase();if(!q){focus("core");fit();return}
 const n=[...CORE,...SPECIAL].find(x=>(x.name+" "+x.kind+" "+x.desc).toLowerCase().includes(q));if(n){focus(n.id);camera(n.id);return}
 const studio=STUDIO.find(x=>x[0].toLowerCase().includes(q));if(studio){navigate(studio[1]);return}
 const nav=NAV.find(x=>x.label&&!x.sep&&x.label.toLowerCase().includes(q));if(nav?.id){focus(nav.id);camera(nav.id)}else if(nav?.view)navigate(nav.view)
}
function bind(){
 document.addEventListener("click",e=>{
   const navNode=e.target.closest("[data-dc-nav-node]");if(navNode){focus(navNode.dataset.dcNavNode);camera(navNode.dataset.dcNavNode);return}
   const navView=e.target.closest("[data-dc-nav-view]");if(navView){navigate(navView.dataset.dcNavView);return}
   const right=e.target.closest("[data-dc-right-node]");if(right){focus(right.dataset.dcRightNode);camera(right.dataset.dcRightNode);return}
   const studio=e.target.closest("[data-dc-studio]");if(studio){navigate(studio.dataset.dcStudio);return}
   const n=e.target.closest("[data-dc-node]");if(n){focus(n.dataset.dcNode);camera(n.dataset.dcNode);return}
   if(e.target.closest("[data-dc-close]")){focus("core");camera("core");return}
   const vw=e.target.closest("[data-dc-view]");if(vw){state.view=vw.dataset.dcView;renderViews();applyView();focus("core");return}
   const z=e.target.closest("[data-core-zoom]");if(z){z.dataset.coreZoom==="fit"?fit():zoom(z.dataset.coreZoom==="in"?.07:-.07);return}
   const rt=e.target.closest("[data-dc-right-tab]");if(rt){state.rightTab=rt.dataset.dcRightTab;$$("[data-dc-right-tab]").forEach(b=>b.classList.toggle("active",b===rt));renderRightPanel();return}
 });
 $$(".tab").forEach(t=>t.addEventListener("click",()=>setMode(t.dataset.tab==="dragon-control-room")));
 const searchInput=$("#dragon-core-search");if(searchInput){searchInput.addEventListener("input",()=>search(searchInput.value));searchInput.addEventListener("keydown",e=>{if(e.key==="Escape"){searchInput.value="";focus("core");fit()}})}
 window.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"&&document.body.classList.contains("dragon-core-mode")){e.preventDefault();searchInput?.focus()}});
 const v=$("#dragon-core-viewport");if(v){v.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY<0?.04:-.04)},{passive:false});v.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;state.drag=true;state.lx=e.clientX;state.ly=e.clientY;v.classList.add("dragging");v.setPointerCapture(e.pointerId)});v.addEventListener("pointermove",e=>{if(!state.drag)return;state.x+=e.clientX-state.lx;state.y+=e.clientY-state.ly;state.lx=e.clientX;state.ly=e.clientY;transform()});v.addEventListener("pointerup",()=>{state.drag=false;v.classList.remove("dragging")});v.addEventListener("dblclick",e=>{if(!e.target.closest("button")){focus("core");fit()}})}
 const tab=document.querySelector('[data-tab="dragon-control-room"]');if(tab)tab.addEventListener("click",()=>{setMode(true);history.replaceState(null,"","#dragon-control-room");setTimeout(()=>{renderGraph();renderNav();renderViews();renderRightPanel();focus("core");fit()},30)});
 window.addEventListener("hashchange",()=>{if(location.hash==="#dragon-control-room")tab?.click()});window.addEventListener("resize",()=>{if(document.body.classList.contains("dragon-core-mode"))fit()});
}
function init(){if(!$("#dragon-control-room"))return;renderGraph();renderNav();renderViews();renderRightPanel();bind();installReturnButtons();focus("core");setTimeout(()=>{if(location.hash==="#dragon-control-room")document.querySelector('[data-tab="dragon-control-room"]')?.click();else fit()},60);window.DRAGON_CORE={version:"6.0-reference-order",core:CORE,specialists:SPECIAL,connections:CONNECTIONS,studio:STUDIO,fit,focus,authority:"SHADOW_ONLY",dataMode:"DEMO_ONLY"}}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();