(() => {
  "use strict";

  const Core=window.BoomStylistCore;
  const Memory=window.HuntExperienceMemory;
  if(!Core)return;

  const $=q=>document.querySelector(q);
  const occasion=$("#stylist-occasion");
  const category=$("#stylist-category");
  const budget=$("#stylist-budget");
  const country=$("#stylist-country");
  const build=$("#stylist-build");
  const status=$("#stylist-status");
  const targets=$("#stylist-targets");

  const params=new URLSearchParams(location.search);
  const WORLD_ANCHORS=Object.freeze({
    fashion:"women-dresses",
    jewelry:"jewelry-necklaces",
    "tech-home":"home",
    travel:"travel"
  });

  const title=slug=>String(slug||"")
    .split("-")
    .filter(Boolean)
    .map(word=>word.charAt(0).toUpperCase()+word.slice(1))
    .join(" ");

  function hasOption(select,value){
    return Boolean(select&&Array.from(select.options||[]).some(option=>option.value===value));
  }

  function applyContext(){
    const world=params.get("world")||"";
    const requestedOccasion=params.get("occasion")||"";
    if(requestedOccasion&&hasOption(occasion,requestedOccasion))occasion.value=requestedOccasion;
    const anchor=WORLD_ANCHORS[world]||"";
    if(anchor&&hasOption(category,anchor))category.value=anchor;
    return world;
  }

  function renderMission(){
    const world=params.get("world")||"";
    const mission=Core.createMission({
      anchor:{category:category?.value||"",title:title(category?.value||"")},
      occasion:occasion?.value||"everyday",
      budget:Number(budget?.value||0),
      country:String(country?.value||"").trim().toUpperCase(),
      context:Memory?.decisionContext?.()||{}
    });

    if(status){
      status.textContent=(world?title(world)+" world · ":"")
        +mission.occasion_label+" mission · budget "+mission.budget.budget_total
        +" · "+mission.target_categories.length+" target categories.";
    }

    if(targets){
      targets.innerHTML=mission.why.map(row=>{
        const href="category.html?c="+encodeURIComponent(row.category);
        return '<div class="stylist-target"><strong>'+title(row.category)
          +'</strong><a href="'+href+'">Open category</a><small>'
          +String(row.reason||"")+'</small></div>';
      }).join("");
    }

    window.BoomStylistAlphaMission=mission;
  }

  build?.addEventListener("click",renderMission);
  applyContext();
  renderMission();

  window.BoomStylistAlpha=Object.freeze({
    renderMission,
    getMission:()=>window.BoomStylistAlphaMission||null
  });
})();
