(() => {
  "use strict";

  const clean=value=>String(value??"").trim().toLowerCase();
  const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
  const WEIGHTS=Object.freeze({
    purchase:9,save:7,like:5,add_to_cart:5,look_save:4,try_on:3.5,share:3,watch:2.5,
    dwell:2,product_view:1.5,impression:.25,world_enter:1,skip:-2,not_interested:-8,return:-9
  });

  function modeFor(count=0){
    const total=Math.max(0,Number(count)||0);
    if(total<5)return "cold_start";
    if(total<20)return "learning";
    return "personalized";
  }

  function ranked(map,limit=12){
    return [...map.entries()]
      .filter(([key])=>Boolean(key))
      .sort((a,b)=>b[1]-a[1])
      .slice(0,limit)
      .map(([key,score])=>Object.freeze({key,score:Number(score.toFixed(3))}));
  }

  function buildProfile(events=[]){
    const rows=Array.isArray(events)?events:[];
    const categories=new Map(),providers=new Map(),worlds=new Map();
    const now=Date.now();
    for(const row of rows.slice(-500)){
      const ageDays=Math.max(0,(now-new Date(row.ts||now).getTime())/86400000);
      const recency=Math.max(.2,Math.exp(-ageDays/45));
      const score=Number(WEIGHTS[clean(row.type)]??0)*recency;
      const category=clean(row.category),provider=clean(row.provider),world=clean(row.world);
      if(category)categories.set(category,(categories.get(category)||0)+score);
      if(provider)providers.set(provider,(providers.get(provider)||0)+score);
      if(world)worlds.set(world,(worlds.get(world)||0)+score);
    }
    const interactions=rows.length;
    const positiveSignals=rows.filter(row=>Number(WEIGHTS[clean(row.type)]||0)>1).length;
    return Object.freeze({
      version:1,
      interactions,
      mode:modeFor(interactions),
      confidence:Number(clamp(positiveSignals/20).toFixed(3)),
      categories:Object.freeze(ranked(categories,20)),
      providers:Object.freeze(ranked(providers,12)),
      worlds:Object.freeze(ranked(worlds,8)),
      controls:Object.freeze({sensitive_traits_used:false,body_traits_used:false,reset_supported:true})
    });
  }

  function scoreFor(list,key){
    const hit=(list||[]).find(row=>row.key===clean(key));
    return Number(hit?.score||0);
  }

  function candidateSignals(profile={},candidate={}){
    const category=clean(candidate.category||candidate._shelf_slug);
    const provider=clean(candidate.provider||candidate.supplier);
    const categoryScore=scoreFor(profile.categories,category);
    const providerScore=scoreFor(profile.providers,provider);
    const confidence=clamp(profile.confidence);
    const positive=Math.max(0,categoryScore)*.75+Math.max(0,providerScore)*.25;
    const negative=Math.abs(Math.min(0,categoryScore))*.8+Math.abs(Math.min(0,providerScore))*.2;
    return Object.freeze({
      affinity:Number(clamp(.5+(positive-negative)/20*confidence).toFixed(3)),
      relevance:Number(clamp(.45+categoryScore/18*confidence).toFixed(3)),
      hide_risk:Number(clamp(negative/12).toFixed(3)),
      reason:categoryScore>=4?"taste_category_match":categoryScore<=-4?"taste_negative_signal":"taste_exploration"
    });
  }

  function enrichContext(context={},events=[]){
    return Object.freeze({...context,taste_profile:buildProfile(events)});
  }

  const api=Object.freeze({WEIGHTS,modeFor,buildProfile,candidateSignals,enrichContext});
  if(typeof window!=="undefined")window.BoomTasteDNA=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
