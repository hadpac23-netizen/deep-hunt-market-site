(() => {
  "use strict";

  const FLOOR_ZONES = {
    "for-you":"discover",
    "women-edit":"departments",
    "hunt-men-floor":"departments",
    "hunt-kids-floor":"departments",
    "hunt-beauty-floor":"departments",
    "hunt-tech-floor":"departments",
    "hunt-home-floor":"departments",
    "hunt-active-floor":"departments",
    "hunt-fresh-floor":"market",
    "hunt-market-hall":"market",
    "hunt-advertising-floor":"market",
    "hunt-ai-floor":"intelligence",
    "hunt-ai-media-floor":"intelligence",
    "hunt-penthouse":"intelligence"
  };

  const ZONE_LABELS = {
    discover:"DISCOVER",
    departments:"DEPARTMENTS",
    market:"MARKET",
    intelligence:"INTELLIGENCE"
  };

  let observer=null;
  let currentId="";
  let scrollInstalled=false;
  let scrollFrame=0;
  const seen=new Set();

  function links(){
    return [...document.querySelectorAll("#hd-building-floor-nav a[href^='#']")];
  }

  function floorId(link){
    return String(link.getAttribute("href")||"").replace(/^#/,"");
  }

  function decorateNavigation(){
    const nav=document.querySelector("#hd-building-floor-nav");
    if(!nav)return;
    let previous="";
    links().forEach(link=>{
      const id=floorId(link);
      const zone=FLOOR_ZONES[id]||"departments";
      link.dataset.attentionZone=zone;
      if(zone!==previous){
        link.dataset.zoneStart="true";
        link.setAttribute("aria-label",ZONE_LABELS[zone]+" · "+link.textContent.trim());
      }
      previous=zone;
    });
  }

  function decorateFloors(){
    let previous="";
    for(const [id,zone] of Object.entries(FLOOR_ZONES)){
      const floor=document.getElementById(id);
      if(!floor)continue;
      floor.dataset.attentionZone=zone;
      if(zone!==previous)floor.dataset.attentionZoneStart="true";
      previous=zone;
    }
  }

  function updateCurrent(id,reason="observer"){
    if(!id||id===currentId)return;
    currentId=id;
    links().forEach(link=>{
      const active=floorId(link)===id;
      link.classList.toggle("is-current-floor",active);
      if(active)link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    });
    document.body.dataset.huntCurrentFloor=id;
    document.body.dataset.huntCurrentZone=FLOOR_ZONES[id]||"departments";

    const active=document.querySelector("#hd-building-floor-nav a[aria-current='location']");
    const nav=active?.closest("#hd-building-floor-nav");
    if(active&&nav&&(reason==="observer"||reason==="scroll")){
      const target=Math.max(0,active.offsetLeft-(nav.clientWidth-active.clientWidth)/2);
      nav.scrollTo({left:target,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    }

    if(!seen.has(id)){
      seen.add(id);
      window.dispatchEvent(new CustomEvent("hunt:attention-floor",{detail:{floor:id,zone:FLOOR_ZONES[id]||"departments"}}));
    }
  }

  function syncCurrentFloor(reason="scroll"){
    const floors=Object.keys(FLOOR_ZONES).map(id=>document.getElementById(id)).filter(Boolean);
    if(!floors.length)return;
    const eyeLine=Math.max(120,window.innerHeight*.35);
    let active=floors.find(floor=>{
      const rect=floor.getBoundingClientRect();
      return rect.top<=eyeLine&&rect.bottom>eyeLine;
    });
    if(!active){
      active=floors.map(floor=>({floor,distance:Math.abs(floor.getBoundingClientRect().top-eyeLine)}))
        .sort((a,b)=>a.distance-b.distance)[0]?.floor;
    }
    if(active)updateCurrent(active.id,reason);
  }

  function scheduleSync(){
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;
      syncCurrentFloor("scroll");
    });
  }

  function installObserver(){
    observer?.disconnect();
    const floors=Object.keys(FLOOR_ZONES).map(id=>document.getElementById(id)).filter(Boolean);
    if(!floors.length)return;

    if("IntersectionObserver" in window){
      observer=new IntersectionObserver(()=>syncCurrentFloor("observer"),{rootMargin:"-34% 0px -64% 0px",threshold:[0]});
      floors.forEach(floor=>observer.observe(floor));
    }

    if(!scrollInstalled){
      window.addEventListener("scroll",scheduleSync,{passive:true});
      window.addEventListener("resize",scheduleSync,{passive:true});
      scrollInstalled=true;
    }
    syncCurrentFloor("initial");
  }

  function installClickIntent(){
    document.querySelector("#hd-building-floor-nav")?.addEventListener("click",event=>{
      const link=event.target.closest?.("a[href^='#']");
      if(link)updateCurrent(floorId(link),"click");
    });
  }

  function install(){
    decorateNavigation();
    decorateFloors();
    installObserver();
    installClickIntent();
    document.body.dataset.huntAttentionArchitecture="ready";
  }

  window.HuntAttentionArchitecture=Object.freeze({
    install,
    currentFloor:()=>currentId,
    zones:Object.freeze({...FLOOR_ZONES})
  });

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
  window.addEventListener("hunt:shelves",()=>setTimeout(installObserver,250));
})();
