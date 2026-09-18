(() => {
  "use strict";

  const Flow=window.Hunt2037Flow;
  if(!Flow?.enabled?.())return;

  const FALLBACKS=[
    ["#4338ca","#06b6d4"],
    ["#7c3aed","#ec4899"],
    ["#0f766e","#22d3ee"],
    ["#b45309","#f43f5e"],
    ["#1d4ed8","#9333ea"]
  ];
  let cities=[];
  let index=0;
  let worldLock=false;
  const WORLD_CITY=Object.freeze({fashion:"tokyo",jewelry:"paris","tech-home":"shenzhen",travel:"dubai"});

  async function loadManifest(){
    try{
      const res=await fetch("hunt-city-night-manifest.json?v=1",{cache:"no-store"});
      if(!res.ok)throw new Error("CITY_MANIFEST_LOAD_FAILED");
      const body=await res.json();
      cities=Array.isArray(body?.cities)?body.cities:[];
    }catch{cities=[]}
  }

  function cityAt(i){
    if(!cities.length)return {id:"hunt",name:"HUNT Night",asset_url:null};
    return cities[Math.abs(i)%cities.length];
  }

  function applyCity(city,i=index){
    const fallback=FALLBACKS[Math.abs(i)%FALLBACKS.length];
    const a=city?.accent_a||fallback[0];
    const b=city?.accent_b||fallback[1];
    document.documentElement.style.setProperty("--hunt-brand-a",a);
    document.documentElement.style.setProperty("--hunt-brand-b",b);
    document.documentElement.style.setProperty("--hunt-city-image",city?.asset_url?`url("${city.asset_url}")`:"none");
    document.body.dataset.huntCity=city?.id||"hunt";
    const badge=document.querySelector("#hunt2037-city-badge");
    if(badge){
      const hasAsset=Boolean(city?.asset_url);
      badge.dataset.asset=hasAsset?"image":"mood";
      badge.textContent=(hasAsset?"":"CITY MOOD · ")+(city?.name||"HUNT Night");
      badge.title=city?.mood||"";
    }
  }

  function cityById(id){return cities.find(city=>city.id===id)||null;}

  function applyWorldMood(worldId){
    const cityId=WORLD_CITY[worldId]||"";
    const city=cityById(cityId);
    if(city){
      index=Math.max(0,cities.indexOf(city));
      applyCity(city,index);
    }
  }

  function nextCity(){
    index=(index+1)%Math.max(1,cities.length);
    applyCity(cityAt(index),index);
  }

  async function init(){
    const brand=document.querySelector(".hd-brand");
    if(brand)brand.dataset.hunt2037Wordmark="true";

    const hero=document.querySelector(".hd-hero");
    if(hero&&!document.querySelector("#hunt2037-city-badge")){
      const badge=document.createElement("span");
      badge.id="hunt2037-city-badge";
      badge.className="hunt2037-city-badge";
      badge.setAttribute("aria-hidden","true");
      hero.appendChild(badge);
    }

    await loadManifest();
    applyCity(cityAt(0),0);

    window.addEventListener("hunt:world-mode",event=>{
      worldLock=event.detail?.active===true;
      if(worldLock)applyWorldMood(event.detail?.world||"");
    });
    window.addEventListener("hunt:experience-event",event=>{
      if(event.detail?.type==="world_enter"&&!worldLock)nextCity();
    });
    window.addEventListener("scroll",()=>{
      if(worldLock)return;
      const y=Math.floor(window.scrollY/900);
      if(y!==index&&cities.length){index=y%cities.length;applyCity(cityAt(index),index)}
    },{passive:true});
  }

  window.Hunt2037Visual=Object.freeze({loadManifest,applyCity,applyWorldMood,nextCity});
  init();
})();
