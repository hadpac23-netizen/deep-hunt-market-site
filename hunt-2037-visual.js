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
    const [a,b]=FALLBACKS[Math.abs(i)%FALLBACKS.length];
    document.documentElement.style.setProperty("--hunt-brand-a",a);
    document.documentElement.style.setProperty("--hunt-brand-b",b);
    document.documentElement.style.setProperty("--hunt-city-image",city?.asset_url?`url("${city.asset_url}")`:"none");
    document.body.dataset.huntCity=city?.id||"hunt";
    const badge=document.querySelector("#hunt2037-city-badge");
    if(badge)badge.textContent=city?.name||"HUNT Night";
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

    window.addEventListener("hunt:experience-event",event=>{
      if(event.detail?.type==="world_enter")nextCity();
    });
    window.addEventListener("scroll",()=>{
      const y=Math.floor(window.scrollY/900);
      if(y!==index&&cities.length){index=y%cities.length;applyCity(cityAt(index),index)}
    },{passive:true});
  }

  window.Hunt2037Visual=Object.freeze({loadManifest,applyCity,nextCity});
  init();
})();
