(() => {
  "use strict";
  const Core=window.BoomStylistCore;
  if(!Core)return;
  const $=q=>document.querySelector(q);
  const occasion=$("#stylist-occasion");
  const category=$("#stylist-category");
  const budget=$("#stylist-budget");
  const country=$("#stylist-country");
  const build=$("#stylist-build");
  const status=$("#stylist-status");
  const targets=$("#stylist-targets");

  const title=slug=>String(slug||"").replace(/-/g," ").replace(/w/g,m=>m.toUpperCase());

  function renderMission(){
    const mission=Core.createMission({
      anchor:{category:category?.value||"",title:title(category?.value||"")},
      occasion:occasion?.value||"everyday",
      budget:Number(budget?.value||0),
      country:String(country?.value||"").trim().toUpperCase(),
      context:{}
    });
    if(status){
      status.textContent=mission.occasion_label+" mission · budget "+mission.budget.budget_total
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
  renderMission();

  window.BoomStylistAlpha=Object.freeze({renderMission,getMission:()=>window.BoomStylistAlphaMission||null});
})();
