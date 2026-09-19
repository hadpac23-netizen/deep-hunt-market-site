(() => {
  "use strict";
  const H=window.HuntCore;
  if(!H)return;

  const WORLDS=["women","men","beauty","accessories","tech","home","sports","kids"];
  const WORLD_SET=new Set(WORLDS);
  const DISCOVERY=new Set(["for-you","fresh","look","explore","verified","local"]);
  const STYLES=new Set(["cinematic","editorial","quiet-luxury","electric"]);
  const ENERGY=new Set(["calm","balanced","vivid"]);
  const DENSITY=new Set(["airy","balanced","rich"]);
  const INTENTS=new Set(["discover","style","compare","complete-look","explore"]);
  const DECISION_GOALS=new Set(["explore","simplify","compare","confidence","complete"]);
  const CHOICE_MODES=new Set(["editorial","guided","comparison","evidence","minimal"]);
  const RECOMMENDATION_STRATEGIES=new Set(["relevant-mix","narrow-set","side-by-side","verified-first","complementary"]);
  const CLARIFY_MODES=new Set(["none","ask-one"]);
  const DIVERSITY_MODES=new Set(["accuracy","balanced","serendipity"]);
  const EXPLANATION_MODES=new Set(["none","why-this","compare-facts","why-verified"]);
  const CACHE_KEY="boom_commerce_brain_plan_v3";
  const AI_TTL=12*60*1000;
  const BLOCKED_COPY=/\b(last chance|hurry|act now|only \d+ left|selling fast|everyone is buying|trending now|best seller|lowest price|guaranteed|don'?t miss|fomo)\b/i;

  let shelves=window.HuntMarketShelves?.shelves||{};
  let currentPlan=null;
  let currentSource="local";
  let currentPhase="arrival";
  let searchHint=[];
  let productHint="";
  let shoppingMission="";
  let missionQualifiers={device:false,size:false,budget:false,style:false,color:false};
  let behavior={productClicks:0,likes:0,saves:0,searches:0};
  let aiTimer=null;
  let aiInFlight=false;
  let lastAiAt=0;

  const clean=(v,max=120)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));

  function broadWorld(slug){
    const s=String(slug||"").trim();
    if(WORLD_SET.has(s))return s;
    for(const world of WORLDS){
      const children=H.departmentSubcategories?.[world]||[];
      if(children.includes(s))return world;
    }
    try{
      const inferred=H.inferCategory?.({category:s,title:s});
      if(WORLD_SET.has(inferred))return inferred;
      for(const world of WORLDS){
        if((H.departmentSubcategories?.[world]||[]).includes(inferred))return world;
      }
    }catch{}
    return "";
  }

  function pageName(){
    const path=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    if(path.startsWith("product"))return "product";
    if(path.startsWith("category"))return "category";
    if(path.startsWith("search"))return "search";
    if(path.startsWith("checkout"))return "checkout";
    if(path.startsWith("profile"))return "profile";
    if(path.startsWith("auth"))return "auth";
    return "home";
  }

  function locale(){
    return window.HuntExperienceI18n?.current?.()||document.documentElement.lang||"en";
  }
  function market(){
    return window.HuntCountry?.market?.()||"US";
  }

  function signalScores(){
    const out={};
    const explicit=H.shoppingPreferences?.().categories||[];
    for(const raw of explicit){
      const w=broadWorld(raw);
      if(w)out[w]=Math.max(out[w]||0,58);
    }
    for(const [raw,value] of Object.entries(H.signals?.()||{})){
      const w=broadWorld(raw);
      if(!w)continue;
      out[w]=Math.max(out[w]||0,clamp(value));
    }
    for(const raw of searchHint){
      const w=broadWorld(raw);
      if(w)out[w]=Math.max(out[w]||0,72);
    }
    const productWorld=broadWorld(productHint);
    if(productWorld)out[productWorld]=Math.max(out[productWorld]||0,68);
    return out;
  }

  function topInterests(){
    const scores=signalScores();
    const explicit=(H.shoppingPreferences?.().categories||[]).map(broadWorld).filter(Boolean);
    const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([w])=>w);
    return [...new Set([...explicit,...ranked])].slice(0,6);
  }

  function countWorld(world){
    const slugs=[world,...(H.departmentSubcategories?.[world]||[])];
    const keys=new Set();
    for(const slug of slugs){
      for(const item of Array.isArray(shelves?.[slug])?shelves[slug]:[]){
        if(item?.item_id)keys.add(String(item.provider||"")+":"+String(item.item_id));
      }
    }
    return keys.size;
  }
  function catalogSummary(){
    return Object.fromEntries(WORLDS.map(w=>[w,countWorld(w)]));
  }
  function allItems(){
    const seen=new Set(),out=[];
    for(const rows of Object.values(shelves||{})){
      for(const item of Array.isArray(rows)?rows:[]){
        const key=(item?.provider||"")+":"+(item?.item_id||"");
        if(!item?.item_id||seen.has(key))continue;
        seen.add(key);out.push(item);
      }
    }
    return out;
  }
  function capabilities(){
    let verified=0,local=0;
    for(const item of allItems()){
      if(item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS")verified++;
      if(window.HuntCountry?.readiness?.(item)==="verified_match")local++;
    }
    return {verified,local};
  }

  function decisionState(){
    const page=pageName();
    if(page==="checkout")return {goal:"confidence",choice_mode:"minimal"};
    if(shoppingMission==="outfit"||shoppingMission==="trip"||shoppingMission==="event"||shoppingMission==="setup")return {goal:"complete",choice_mode:"guided"};
    if(shoppingMission==="replace"||shoppingMission==="compare")return {goal:"compare",choice_mode:"comparison"};
    if(shoppingMission==="replenish")return {goal:"confidence",choice_mode:"minimal"};
    if(shoppingMission==="gift"||shoppingMission==="budget")return {goal:"simplify",choice_mode:"guided"};
    if(page==="product"){
      if(currentPhase==="intent"||behavior.saves+behavior.likes>=2)return {goal:"complete",choice_mode:"evidence"};
      return {goal:"compare",choice_mode:"comparison"};
    }
    if(page==="search")return {goal:"simplify",choice_mode:"guided"};
    if(currentPhase==="arrival")return {goal:"explore",choice_mode:"editorial"};
    if(currentPhase==="discover")return {goal:"simplify",choice_mode:"guided"};
    if(currentPhase==="deepen")return {goal:"compare",choice_mode:"comparison"};
    return {goal:"confidence",choice_mode:"evidence"};
  }

  function decisionSupport(){
    const scores=Object.values(signalScores()).map(Number).sort((a,b)=>b-a);
    const gap=scores.length>1?scores[0]-scores[1]:(scores[0]||0);
    const ambiguous=topInterests().length===0||(topInterests().length>1&&gap<8);
    const page=pageName(),goal=decisionState().goal;
    const missionNeedsDetail=shoppingMission==="gift"||(shoppingMission==="replace"&&!missionQualifiers.device&&!missionQualifiers.size);
    const clarify=((missionNeedsDetail||ambiguous)&&(page==="home"||page==="search")&&behavior.searches<=2)?"ask-one":"none";
    const diversity=goal==="explore"?"serendipity":goal==="simplify"||goal==="confidence"?"accuracy":"balanced";
    const explanation=goal==="compare"?"compare-facts":goal==="confidence"?"why-verified":goal==="complete"?"why-this":"none";
    return {clarify_mode:clarify,diversity_mode:diversity,explanation_mode:explanation,interest_gap:Math.round(gap)};
  }

  function context(){
    const decision=decisionState();
    const support=decisionSupport();
    return Object.freeze({
      page:pageName(),
      locale:locale(),
      market:market(),
      top_interests:topInterests(),
      signal_strengths:signalScores(),
      catalog_summary:catalogSummary(),
      session_phase:currentPhase,
      decision_goal:decision.goal,
      choice_mode:decision.choice_mode,
      clarify_mode:support.clarify_mode,
      diversity_mode:support.diversity_mode,
      explanation_mode:support.explanation_mode,
      shopping_mission:shoppingMission||"none",
      mission_qualifiers:{...missionQualifiers},
      interaction_summary:{...behavior},
      reduced_motion:matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }

  function styleFor(world){
    if(world==="tech")return "electric";
    if(world==="beauty"||world==="accessories")return "quiet-luxury";
    if(world==="home")return "editorial";
    return "cinematic";
  }
  function fallbackPlan(ctx=context()){
    const interests=ctx.top_interests.length?ctx.top_interests:["women","beauty","accessories","tech"];
    const primary=interests[0]||"women";
    const secondary=interests.find(x=>x!==primary)||"beauty";
    const cap=capabilities();
    let mode="for-you";
    if(ctx.session_phase==="discover")mode="explore";
    if(ctx.session_phase==="deepen")mode="look";
    if(ctx.session_phase==="intent"&&cap.verified>=4)mode="verified";
    if(ctx.page==="search")mode="explore";
    if(ctx.page==="product")mode="look";
    if(ctx.page==="checkout")mode=cap.verified>=4?"verified":"for-you";
    const goal=DECISION_GOALS.has(ctx.decision_goal)?ctx.decision_goal:"explore";
    const choice=CHOICE_MODES.has(ctx.choice_mode)?ctx.choice_mode:"editorial";
    const strategy=goal==="simplify"?"narrow-set":goal==="compare"?"side-by-side":goal==="confidence"?"verified-first":goal==="complete"?"complementary":"relevant-mix";
    const support=decisionSupport();
    return {
      primary_world:primary,
      secondary_world:secondary,
      discovery_mode:mode,
      decision_goal:goal,
      choice_mode:choice,
      recommendation_strategy:strategy,
      clarify_mode:support.clarify_mode,
      diversity_mode:support.diversity_mode,
      explanation_mode:support.explanation_mode,
      night_world:primary,
      style_mode:styleFor(primary),
      motion_energy:ctx.reduced_motion?"calm":(ctx.session_phase==="arrival"?"balanced":ctx.session_phase==="discover"?"vivid":"balanced"),
      density:ctx.page==="home"?(ctx.session_phase==="arrival"?"airy":"rich"):"balanced",
      intent:ctx.page==="product"?"complete-look":ctx.page==="checkout"?"compare":ctx.session_phase==="discover"?"explore":"discover",
      microcopy:{headline:"",subline:"",cta:""},
      rationale_codes:ctx.top_interests.length?["explicit_or_behavior_interest","session_phase","catalog_depth"]:["session_phase","catalog_depth"],
    };
  }

  function safeCopy(value,max){
    const text=clean(value,max);
    return BLOCKED_COPY.test(text)?"":text;
  }
  function validatePlan(raw,ctx=context()){
    const base=fallbackPlan(ctx);
    const world=v=>WORLD_SET.has(String(v||""))?String(v):"";
    const cap=capabilities();
    let mode=DISCOVERY.has(String(raw?.discovery_mode||""))?String(raw.discovery_mode):base.discovery_mode;
    if(mode==="verified"&&cap.verified<4)mode=base.discovery_mode==="verified"?"for-you":base.discovery_mode;
    if(mode==="local"&&cap.local<4)mode="for-you";
    const primary=world(raw?.primary_world)||base.primary_world;
    let secondary=world(raw?.secondary_world)||base.secondary_world;
    if(secondary===primary)secondary=primary==="beauty"?"accessories":"beauty";
    return {
      primary_world:primary,
      secondary_world:secondary,
      discovery_mode:mode,
      night_world:world(raw?.night_world)||primary,
      style_mode:STYLES.has(String(raw?.style_mode||""))?String(raw.style_mode):base.style_mode,
      motion_energy:ctx.reduced_motion?"calm":(ENERGY.has(String(raw?.motion_energy||""))?String(raw.motion_energy):base.motion_energy),
      density:DENSITY.has(String(raw?.density||""))?String(raw.density):base.density,
      intent:INTENTS.has(String(raw?.intent||""))?String(raw.intent):base.intent,
      decision_goal:DECISION_GOALS.has(String(raw?.decision_goal||""))?String(raw.decision_goal):base.decision_goal,
      choice_mode:CHOICE_MODES.has(String(raw?.choice_mode||""))?String(raw.choice_mode):base.choice_mode,
      recommendation_strategy:RECOMMENDATION_STRATEGIES.has(String(raw?.recommendation_strategy||""))?String(raw.recommendation_strategy):base.recommendation_strategy,
      clarify_mode:CLARIFY_MODES.has(String(raw?.clarify_mode||""))?String(raw.clarify_mode):base.clarify_mode,
      diversity_mode:DIVERSITY_MODES.has(String(raw?.diversity_mode||""))?String(raw.diversity_mode):base.diversity_mode,
      explanation_mode:EXPLANATION_MODES.has(String(raw?.explanation_mode||""))?String(raw.explanation_mode):base.explanation_mode,
      microcopy:{
        headline:safeCopy(raw?.microcopy?.headline,72),
        subline:safeCopy(raw?.microcopy?.subline,128),
        cta:safeCopy(raw?.microcopy?.cta,34),
      },
      rationale_codes:Array.isArray(raw?.rationale_codes)?[...new Set(raw.rationale_codes.map(x=>clean(x,36).toLowerCase().replace(/[^a-z0-9_-]/g,"")).filter(Boolean))].slice(0,6):base.rationale_codes,
    };
  }

  function apply(plan,{source="local",reason="refresh"}={}){
    currentPlan=Object.freeze(validatePlan(plan));
    currentSource=source;
    const body=document.body;
    if(body){
      body.dataset.boomPrimary=currentPlan.primary_world;
      body.dataset.boomSecondary=currentPlan.secondary_world;
      body.dataset.boomStyle=currentPlan.style_mode;
      body.dataset.boomEnergy=currentPlan.motion_energy;
      body.dataset.boomDensity=currentPlan.density;
      body.dataset.boomIntent=currentPlan.intent;
      body.dataset.boomDecisionGoal=currentPlan.decision_goal;
      body.dataset.boomChoiceMode=currentPlan.choice_mode;
      body.dataset.boomRecommendation=currentPlan.recommendation_strategy;
      body.dataset.boomClarify=currentPlan.clarify_mode;
      body.dataset.boomDiversity=currentPlan.diversity_mode;
      body.dataset.boomExplanation=currentPlan.explanation_mode;
      body.dataset.boomBrainSource=source;
      body.dataset.boomPhase=currentPhase;
    }
    window.dispatchEvent(new CustomEvent("boom:plan",{detail:{plan:currentPlan,source,reason}}));
    return currentPlan;
  }

  function signature(ctx=context()){
    return JSON.stringify([
      ctx.page,ctx.locale,ctx.market,ctx.session_phase,ctx.decision_goal,ctx.choice_mode,
      ctx.clarify_mode,ctx.diversity_mode,ctx.explanation_mode,ctx.shopping_mission,ctx.top_interests.slice(0,4),
      Object.entries(ctx.catalog_summary).map(([k,v])=>[k,Math.min(9,Math.floor(Number(v||0)/20))]),
    ]);
  }
  function readCache(sig){
    try{
      const row=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
      if(!row||row.sig!==sig||Date.now()-Number(row.at||0)>AI_TTL)return null;
      return row.plan||null;
    }catch{return null}
  }
  function writeCache(sig,plan){
    try{localStorage.setItem(CACHE_KEY,JSON.stringify({sig,at:Date.now(),plan}))}catch{}
  }

  async function requestAI(reason="scheduled"){
    if(aiInFlight||!navigator.onLine)return null;
    const ctx=context(),sig=signature(ctx);
    const cached=readCache(sig);
    if(cached){
      apply(cached,{source:"ai-cache",reason});
      return cached;
    }
    if(Date.now()-lastAiAt<45000)return null;
    aiInFlight=true;lastAiAt=Date.now();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const res=await fetch("/api/boom-ai-director",{
        method:"POST",
        signal:controller.signal,
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({context:ctx})
      });
      if(!res.ok)return null;
      const data=await res.json();
      if(!data?.ok||!data?.plan)return null;
      const plan=validatePlan(data.plan,ctx);
      writeCache(sig,plan);
      apply(plan,{source:"ai",reason});
      return plan;
    }catch{return null}
    finally{clearTimeout(timeout);aiInFlight=false}
  }

  function scheduleAI(reason="scheduled",delay=900){
    clearTimeout(aiTimer);
    aiTimer=setTimeout(()=>requestAI(reason),delay);
  }

  function refresh({reason="refresh",ai=false}={}){
    const plan=apply(fallbackPlan(),{source:"local",reason});
    if(ai)scheduleAI(reason);
    return plan;
  }

  function scoreProduct(item){
    if(!currentPlan)return 0;
    const w=broadWorld(item?.category||H.inferCategory?.(item));
    if(!w)return 0;
    let score=w===currentPlan.primary_world?24:w===currentPlan.secondary_world?11:0;
    const verified=item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS";
    if(currentPlan.decision_goal==="confidence"&&verified)score+=8;
    if(currentPlan.decision_goal==="compare"&&verified)score+=4;
    if(currentPlan.decision_goal==="complete"&&w===currentPlan.secondary_world)score+=6;
    if(currentPlan.diversity_mode==="accuracy"&&w===currentPlan.primary_world)score+=5;
    if(currentPlan.diversity_mode==="serendipity"&&w===currentPlan.secondary_world)score+=5;
    if(currentPlan.diversity_mode==="balanced"&&verified)score+=2;
    return score;
  }

  function explainProduct(item){
    if(!currentPlan)return [];
    const reasons=[];
    const w=broadWorld(item?.category||H.inferCategory?.(item));
    const verified=item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS";
    if(w===currentPlan.primary_world)reasons.push("interest-match");
    if(w===currentPlan.secondary_world&&currentPlan.decision_goal==="complete")reasons.push("complementary");
    if(verified)reasons.push("verified-commerce");
    if(currentPlan.diversity_mode==="serendipity"&&w!==currentPlan.primary_world)reasons.push("fresh-discovery");
    return reasons.slice(0,2);
  }

  window.addEventListener("hunt:shelves",e=>{shelves=e.detail?.shelves||shelves;refresh({reason:"shelves"});scheduleAI("shelves",1200)});
  window.addEventListener("hunt:shelves-refreshed",e=>{shelves=e.detail?.shelves||shelves;refresh({reason:"shelves-refreshed"})});
  window.addEventListener("hunt:personalization-ready",()=>{refresh({reason:"personalization"});scheduleAI("personalization",650)});
  window.addEventListener("hunt:country-changed",()=>{refresh({reason:"country"});scheduleAI("country",850)});
  window.addEventListener("hunt:experience-language",()=>{refresh({reason:"language"});scheduleAI("language",850)});
  window.addEventListener("hunt:signal",()=>refresh({reason:"signal"}));
  window.addEventListener("hunt:search-intent",e=>{
    searchHint=Array.isArray(e.detail?.categories)?e.detail.categories.slice(0,6):[];
    const mission=String(e.detail?.mission_type||"").toLowerCase();
    shoppingMission=["gift","outfit","replace","replenish","compare","trip","event","setup","budget"].includes(mission)?mission:"";
    missionQualifiers={device:e.detail?.has_device===true,size:e.detail?.has_size===true,budget:e.detail?.has_budget===true,style:Number(e.detail?.style_count||0)>0,color:Number(e.detail?.color_count||0)>0};
    behavior.searches=Math.min(50,behavior.searches+1);
    refresh({reason:"search-intent"});scheduleAI("search-intent",500);
  });
  window.addEventListener("hunt:product-loaded",e=>{
    productHint=String(e.detail?.product?.category||"");
    behavior.productClicks=Math.min(50,behavior.productClicks+1);
    refresh({reason:"product"});scheduleAI("product",700);
  });
  window.addEventListener("hunt:shopping-action",e=>{
    if(e.detail?.liked===true)behavior.likes=Math.min(50,behavior.likes+1);
    if(e.detail?.saved===true)behavior.saves=Math.min(50,behavior.saves+1);
    refresh({reason:"shopping-action"});
    if(behavior.likes+behavior.saves===2)scheduleAI("shopping-action",650);
  });
  window.addEventListener("boom:phase",e=>{
    const next=String(e.detail?.phase||"");
    if(["arrival","discover","deepen","intent"].includes(next)&&next!==currentPhase){
      currentPhase=next;refresh({reason:"phase"});
    }
  });

  window.BoomCommerceBrain=Object.freeze({
    context,
    plan:()=>currentPlan,
    source:()=>currentSource,
    refresh,
    requestAI,
    scoreProduct,
    explainProduct,
    broadWorld,
    decisionState,
    decisionSupport,
    shoppingMission:()=>shoppingMission||"none",
    behavior:()=>Object.freeze({...behavior}),
  });

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{refresh({reason:"boot"});scheduleAI("boot",1500)},{once:true});
  }else{
    refresh({reason:"boot"});scheduleAI("boot",1500);
  }
})();