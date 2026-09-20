(() => {
  "use strict";
  const FLOOR_ORDER=[
    "hunt-hero4","departments","hd-building-floor-nav","for-you","women-edit","hunt-men-floor","hunt-kids-floor",
    "hunt-beauty-floor","hunt-tech-floor","hunt-home-floor","hunt-active-floor","hunt-fresh-floor","hunt-market-hall",
    "hunt-advertising-floor","hunt-ai-floor","hunt-ai-media-floor","hunt-penthouse"
  ];
  const PRIMARY_GRIDS=["hd-home3-women","hd-building-men","hd-building-kids","hd-home3-beauty","hd-building-tech","hd-building-home"];
  const LEGACY_SECTIONS=["fresh-in-hunt","shop","live-search","deals","hunt-now","hunt-lifestyle-stream","hunt-night-edit","look-builder"];
  let timer=null;

  function duplicateIds(){
    const seen=new Set(),dupes=[];
    for(const el of document.querySelectorAll("[id]")){
      if(seen.has(el.id))dupes.push(el.id); else seen.add(el.id);
    }
    return [...new Set(dupes)];
  }

  function orderState(){
    const main=document.querySelector("#main-content");
    if(!main)return {pass:false,actual:[]};
    const actual=[...main.children].map(el=>el.id).filter(Boolean);
    const present=FLOOR_ORDER.filter(id=>actual.includes(id));
    const positions=present.map(id=>actual.indexOf(id));
    return {pass:positions.every((n,i)=>i===0||n>positions[i-1]),actual};
  }

  function containmentState(){
    const expected={
      "fresh-in-hunt":"hunt-fresh-floor","shop":"hunt-market-hall","live-search":"hunt-market-hall","deals":"hunt-market-hall",
      "hunt-now":"hunt-ai-floor","hunt-lifestyle-stream":"hunt-advertising-floor",
      "hunt-night-edit":"hunt-penthouse","look-builder":"hunt-penthouse"
    };
    const misplaced=[];
    for(const [id,parentId] of Object.entries(expected)){
      const node=document.getElementById(id);
      if(node&&!node.closest("#"+parentId))misplaced.push({id,expected_parent:parentId});
    }
    const main=document.querySelector("#main-content");
    const stray=main?[...main.children].filter(el=>el.id&&!FLOOR_ORDER.includes(el.id)).map(el=>el.id):[];
    return {pass:misplaced.length===0&&stray.length===0,misplaced,stray};
  }

  function balanceState(){
    const counts=PRIMARY_GRIDS.map(id=>({id,count:document.querySelectorAll("#"+id+" .hd-home3-card").length}));
    const active=counts.filter(x=>x.count>0);
    const values=active.map(x=>x.count);
    return {
      pass:values.length<2||Math.max(...values)<=Math.max(1,Math.min(...values))*1.5,
      counts
    };
  }
  function audit(){
    const order=orderState();
    const containment=containmentState();
    const balance=balanceState();
    const duplicate_ids=duplicateIds();
    const overflow=document.documentElement.scrollWidth>window.innerWidth+3;
    const categoryButton=document.querySelector("#hd-all-categories");
    const menu=document.querySelector("#hd-mega-menu");
    const categoryTriggers=document.querySelectorAll("[data-open-categories]").length;
    const navigation=Boolean(categoryButton&&menu&&categoryButton.getAttribute("aria-controls")==="hd-mega-menu"&&categoryButton.hasAttribute("aria-expanded")&&categoryTriggers>=1);
    const maxFloorHeight=window.innerWidth<=760?3300:2600;
    const hugeFloors=[...document.querySelectorAll(".hd-building-floor,.hd-building-special-floor,#for-you")]
      .map(el=>({id:el.id,height:Math.round(el.getBoundingClientRect().height)}))
      .filter(x=>x.height>maxFloorHeight);
    const report=Object.freeze({
      pass:order.pass&&containment.pass&&balance.pass&&!duplicate_ids.length&&!overflow&&navigation&&!hugeFloors.length,
      order,
      containment,
      balance,
      duplicate_ids,
      horizontal_overflow:overflow,
      category_navigation:navigation,
      category_triggers:categoryTriggers,
      huge_floors:hugeFloors,
      checked_at:new Date().toISOString()
    });
    document.body.dataset.huntVisualOrder=report.pass?"pass":"review";
    const issues=[];
    if(!order.pass)issues.push("order");
    if(!containment.pass)issues.push("containment");
    if(!balance.pass)issues.push("balance");
    if(duplicate_ids.length)issues.push("duplicate-ids");
    if(overflow)issues.push("overflow");
    if(!navigation)issues.push("categories");
    if(hugeFloors.length)issues.push("floor-height");
    document.body.dataset.huntVisualOrderIssues=issues.join(",")||"none";
    document.body.dataset.huntVisualOrderDetail=[
      "actual="+order.actual.join("|"),
      "misplaced="+containment.misplaced.map(x=>x.id+">"+x.expected_parent).join("|"),
      "stray="+containment.stray.join("|"),
      "huge="+hugeFloors.map(x=>x.id+":"+x.height).join("|"),
      "vw="+window.innerWidth
    ].join(";");
    window.dispatchEvent(new CustomEvent("hunt:visual-order-audit",{detail:report}));
    return report;
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(audit,500);
  }

  window.HuntVisualOrderGuard=Object.freeze({audit,report:audit});
  window.addEventListener("hunt:shelves",schedule);
  window.addEventListener("hunt:shelves-refreshed",schedule);
  window.addEventListener("hunt:personalization-ready",schedule);
  window.addEventListener("resize",schedule,{passive:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
})();
