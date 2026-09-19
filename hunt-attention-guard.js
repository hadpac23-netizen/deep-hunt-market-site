(() => {
  "use strict";
  const MIN_TARGET=24;
  let timer=null;

  function visible(el){
    if(!el)return false;
    const style=getComputedStyle(el);
    const rect=el.getBoundingClientRect();
    return style.display!=="none"&&style.visibility!=="hidden"&&rect.width>0&&rect.height>0;
  }

  function targetAudit(){
    const selectors=[
      "#hd-all-categories",
      "#hd-building-floor-nav a",
      ".hd-department-bar a",
      ".hd-building-mini-head a",
      "#hd-mega-menu a"
    ];
    const nodes=[...new Set(selectors.flatMap(sel=>[...document.querySelectorAll(sel)]))].filter(visible);
    const failures=nodes.map(el=>{
      const rect=el.getBoundingClientRect();
      return {tag:el.tagName.toLowerCase(),text:String(el.textContent||"").trim().slice(0,40),width:Math.round(rect.width),height:Math.round(rect.height)};
    }).filter(x=>x.width<MIN_TARGET||x.height<MIN_TARGET);
    return {pass:failures.length===0,checked:nodes.length,failures};
  }

  function scopeAudit(){
    const nav=document.querySelector("#hd-building-floor-nav");
    if(!nav)return {pass:false,current:[],zone:""};
    const current=[...nav.querySelectorAll("[aria-current='location']")].map(a=>a.getAttribute("href"));
    const floor=document.body.dataset.huntCurrentFloor||"";
    const zone=document.body.dataset.huntCurrentZone||"";
    return {pass:current.length===1&&Boolean(floor)&&Boolean(zone),current,floor,zone};
  }

  function hierarchyAudit(){
    const cards=[...document.querySelectorAll(".hd-home3-card")].slice(0,40);
    const failures=[];
    for(const card of cards){
      const title=card.querySelector(".hd-home3-title");
      const price=card.querySelector(".hd-market-card-price strong");
      if(!title||!price||!visible(title)||!visible(price)){
        failures.push({reason:"missing-visible-title-or-price"});
        continue;
      }
      const order=title.compareDocumentPosition(price);
      if(!(order&Node.DOCUMENT_POSITION_FOLLOWING))failures.push({reason:"price-before-title"});
    }
    return {pass:failures.length===0,checked:cards.length,failures};
  }

  function menuAudit(){
    const menu=document.querySelector("#hd-mega-menu");
    if(!menu||!menu.children.length)return {pass:true,checked:false,clusters:0,maxDepartments:0};
    const clusters=[...menu.querySelectorAll(".hd-mega-cluster")];
    const counts=clusters.map(c=>c.querySelectorAll("section").length);
    const maxDepartments=counts.length?Math.max(...counts):0;
    return {
      pass:clusters.length===3&&maxDepartments<=5,
      checked:true,
      clusters:clusters.length,
      departmentsPerCluster:counts,
      maxDepartments
    };
  }

  function salienceAudit(){
    const grids=[...document.querySelectorAll(".hd-building-grid,.hd-home3-product-grid")];
    const failures=[];
    for(const grid of grids){
      const labels=grid.querySelectorAll(":scope > .hd-home3-card .hd-home3-card-label").length;
      if(labels>2)failures.push({id:grid.id||"",labels});
    }
    return {pass:failures.length===0,checked:grids.length,failures};
  }

  function audit(){
    const targets=targetAudit();
    const scope=scopeAudit();
    const hierarchy=hierarchyAudit();
    const menu=menuAudit();
    const salience=salienceAudit();
    const report=Object.freeze({
      pass:targets.pass&&scope.pass&&hierarchy.pass&&menu.pass&&salience.pass,
      targets,scope,hierarchy,menu,salience,
      checked_at:new Date().toISOString()
    });
    document.body.dataset.huntAttentionGuard=report.pass?"pass":"review";
    window.dispatchEvent(new CustomEvent("hunt:attention-audit",{detail:report}));
    return report;
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(audit,450);
  }

  window.HuntAttentionGuard=Object.freeze({audit,report:audit});
  window.addEventListener("hunt:shelves",schedule);
  window.addEventListener("hunt:attention-floor",schedule);
  window.addEventListener("resize",schedule,{passive:true});
  document.addEventListener("click",event=>{
    if(event.target.closest?.("#hd-all-categories,[data-open-categories]"))setTimeout(schedule,80);
  });
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
})();
