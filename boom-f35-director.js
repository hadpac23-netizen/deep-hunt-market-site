(() => {
  "use strict";
  let phase="arrival",raf=0;
  const sections=new Set();
  const thresholds={arrival:.12,discover:.38,deepen:.72};

  function computePhase(){
    const doc=document.documentElement;
    const max=Math.max(1,doc.scrollHeight-innerHeight);
    const ratio=Math.max(0,Math.min(1,scrollY/max));
    if(ratio<thresholds.arrival)return "arrival";
    if(ratio<thresholds.discover)return "discover";
    if(ratio<thresholds.deepen)return "deepen";
    return "intent";
  }
  function setPhase(next){
    if(next===phase)return;
    phase=next;
    if(document.body)document.body.dataset.boomPhase=phase;
    window.dispatchEvent(new CustomEvent("boom:phase",{detail:{phase}}));
  }
  function onScroll(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{raf=0;setPhase(computePhase())});
  }

  const observer=new IntersectionObserver(entries=>{
    let strongest=null;
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      if(!strongest||entry.intersectionRatio>strongest.intersectionRatio)strongest=entry;
    }
    if(!strongest)return;
    sections.forEach(section=>section.removeAttribute("data-boom-focus"));
    strongest.target.setAttribute("data-boom-focus","true");
    window.dispatchEvent(new CustomEvent("boom:focus",{detail:{id:strongest.target.id||"",ratio:strongest.intersectionRatio}}));
  },{threshold:[.15,.35,.55,.75]});

  function scan(){
    document.querySelectorAll("main section,#hunt-now,#hunt-night-edit,#hd-endless-discovery").forEach(section=>{
      if(sections.has(section))return;
      sections.add(section);observer.observe(section);
    });
  }

  function interaction(event){
    const product=event.target.closest?.(".hd-market-product-card,.hd-shelf-card,.hd-night-card,.hd-discovery-card");
    if(product)window.dispatchEvent(new CustomEvent("boom:engagement",{detail:{type:"product-card"}}));
  }

  addEventListener("scroll",onScroll,{passive:true});
  addEventListener("resize",onScroll,{passive:true});
  document.addEventListener("click",interaction,{passive:true});
  window.addEventListener("hunt:shelves",scan);
  window.addEventListener("hunt:shelves-refreshed",scan);

  window.BoomF35Director=Object.freeze({phase:()=>phase,scan});

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{scan();setPhase(computePhase())},{once:true});
  }else{
    scan();setPhase(computePhase());
  }
})();