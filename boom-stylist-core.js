(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const uniq=rows=>[...new Set((rows||[]).filter(Boolean))];

  const OCCASIONS=Object.freeze({
    everyday:{label:"Everyday",slots:["top","bottom","shoes","bag","accessory"]},
    work:{label:"Work",slots:["tailoring","top","shoes","bag","accessory"]},
    dinner:{label:"Dinner",slots:["hero","shoes","bag","jewelry"]},
    travel:{label:"Travel",slots:["comfort","bag","shoes","tech","layer"]},
    event:{label:"Event",slots:["hero","shoes","bag","jewelry","beauty"]},
    gift:{label:"Gift",slots:["gift","accessory","presentation"]},
    home_office:{label:"Home Office",slots:["desk","lighting","tech","comfort"]}
  });

  const COMPLEMENTS=Object.freeze({
    "women-dresses":["women-shoes","bags","jewelry-earrings","jewelry-necklaces","makeup"],
    "women-evening":["women-shoes","bags","jewelry-earrings","jewelry-necklaces","makeup"],
    "women-tops":["women-jeans","women-bottoms","bags","women-shoes","jewelry"],
    "women-jeans":["women-tops","women-shoes","bags","belts","jewelry"],
    "men-suits":["men-shoes","belts","watches","men-wallets"],
    "men-tops":["men-jeans","men-bottoms","men-shoes","watches"],
    "men-jeans":["men-tops","men-shoes","belts","watches"],
    "jewelry-necklaces":["jewelry-earrings","jewelry-rings","women-dresses","bags"],
    "jewelry-earrings":["jewelry-necklaces","jewelry-rings","women-dresses","bags"],
    "phone-cases":["chargers-cables","power-banks","stands-holders","audio"],
    "travel":["luggage","bags","power-banks","drinkware"],
    "home":["lighting","home-storage","home-decor","kitchen"]
  });

  function complementarySlugs(category){
    const key=clean(category);
    return uniq(COMPLEMENTS[key]||[]).slice(0,8);
  }

  function budgetPlan({budget,anchorPrice=0,itemCount=4}={}){
    const total=Math.max(0,Number(budget)||0);
    const anchor=Math.max(0,Number(anchorPrice)||0);
    const count=Math.max(1,Math.min(8,Number(itemCount)||4));
    const remaining=Math.max(0,total-anchor);
    const perItem=count?remaining/count:0;
    return Object.freeze({
      budget_total:Number(total.toFixed(2)),
      anchor_reserved:Number(anchor.toFixed(2)),
      remaining:Number(remaining.toFixed(2)),
      target_per_item:Number(perItem.toFixed(2)),
      item_count:count
    });
  }

  function reasonFor({candidateCategory,context={},country=""}={}){
    const category=clean(candidateCategory);
    const reasons=[];
    if((context.recent_categories||[]).includes(category))reasons.push("Matches a category you explored");
    if(context.saved_categories?.includes?.(category))reasons.push("Matches items you saved");
    if(country)reasons.push("Must pass delivery verification for "+clean(country).toUpperCase());
    if(!reasons.length)reasons.push("Completes the current look or mission");
    return reasons.slice(0,2).join(" · ");
  }

  function createMission({anchor={},occasion="everyday",budget=0,context={},country=""}={}){
    const key=OCCASIONS[occasion]?occasion:"everyday";
    const category=clean(anchor.category);
    const targets=complementarySlugs(category);
    const plan=budgetPlan({budget,anchorPrice:anchor.price||0,itemCount:Math.max(1,Math.min(4,targets.length||4))});
    return Object.freeze({
      mission_id:"stylist:"+Date.now()+":"+Math.random().toString(36).slice(2,7),
      occasion:key,
      occasion_label:OCCASIONS[key].label,
      anchor:Object.freeze({provider:clean(anchor.provider),item_id:clean(anchor.item_id),category,title:clean(anchor.title)}),
      target_categories:Object.freeze(targets),
      budget:plan,
      country:clean(country).toUpperCase(),
      why:targets.map(slug=>Object.freeze({category:slug,reason:reasonFor({candidateCategory:slug,context,country})})),
      requires_country_product_truth:true,
      exact_fit_claim:false
    });
  }

  function lookLockerEntry({anchor={},items=[],occasion="everyday",budget=0,status="saved"}={}){
    const safeItems=(items||[]).map(x=>Object.freeze({
      provider:clean(x.provider),item_id:clean(x.item_id),variant_id:clean(x.variant_id),category:clean(x.category),title:clean(x.title)
    })).filter(x=>x.provider&&x.item_id);
    return Object.freeze({
      look_id:"look:"+Date.now()+":"+Math.random().toString(36).slice(2,7),
      status:clean(status)||"saved",
      occasion:OCCASIONS[occasion]?occasion:"everyday",
      anchor:Object.freeze({provider:clean(anchor.provider),item_id:clean(anchor.item_id),category:clean(anchor.category),title:clean(anchor.title)}),
      items:Object.freeze(safeItems),
      budget:Number(budget)||0,
      created_at:new Date().toISOString(),
      stores_source_photo:false
    });
  }

  const api=Object.freeze({OCCASIONS,COMPLEMENTS,complementarySlugs,budgetPlan,reasonFor,createMission,lookLockerEntry});
  if(typeof window!=="undefined")window.BoomStylistCore=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
