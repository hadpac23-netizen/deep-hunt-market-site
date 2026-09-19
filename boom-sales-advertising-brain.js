(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const clean=(v,max=160)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function productReadiness(product={},ctx={}){
    const blockers=[];
    if(!clean(product.title,180))blockers.push("title_missing");
    if(!clean(product.description,500))blockers.push("description_missing");
    if(!product.image_url&&!product.media_ready)blockers.push("media_missing");
    if(product.retail_price_verified!==true)blockers.push("verified_price_missing");
    if(String(product.profit_gate_status||"").toUpperCase()!=="PASS")blockers.push("profit_gate_not_passed");
    if(product.availability_verified!==true)blockers.push("availability_not_verified");
    if(ctx.shipping_clarity_ready!==true)blockers.push("shipping_clarity_missing");
    if(ctx.returns_clarity_ready!==true)blockers.push("returns_clarity_missing");
    if(ctx.mobile_readability_ready!==true)blockers.push("mobile_readability_missing");
    if(product.unverified_brand_claim===true)blockers.push("brand_claim_unverified");
    return Object.freeze({
      ready:blockers.length===0,
      score:Math.max(0,100-blockers.length*11),
      blockers:Object.freeze(blockers)
    });
  }

  function audience(input={}){
    const blocked=["race","ethnicity","religion","politics","health","medical","sexuality","sexual_orientation","disability","criminal_history"];
    const rejected=blocked.filter(key=>input[key]!=null);
    return Object.freeze({
      shopping_intents:Object.freeze(uniq(input.shopping_intents).map(x=>clean(x,80)).filter(Boolean).slice(0,12)),
      categories:Object.freeze(uniq(input.categories).map(x=>clean(x,60)).filter(Boolean).slice(0,12)),
      price_band:clean(input.price_band||"any",20),
      market:clean(input.market,12).toUpperCase(),
      sensitive_fields_rejected:Object.freeze(rejected)
    });
  }

  function planCandidate({product={},economics={},context={},audience_input={}}={}){
    const readiness=productReadiness(product,context);
    const a=audience(audience_input);
    const blockers=[...readiness.blockers];
    const maxSafeCac=n(economics.max_safe_cac);
    if(economics.inputs_verified!==true)blockers.push("economics_not_verified");
    if(maxSafeCac<=0)blockers.push("max_safe_cac_missing");
    if(context.attribution_ready!==true)blockers.push("attribution_not_ready");
    if(context.holdout_ready!==true)blockers.push("control_holdout_missing");
    if(context.landing_page_measurement_ready!==true)blockers.push("landing_measurement_missing");
    if(context.owner_paid_approval!==true)blockers.push("owner_paid_approval_required");
    if(a.sensitive_fields_rejected.length)blockers.push("sensitive_targeting_rejected");

    let state="HOLD";
    const nonOwner=blockers.filter(x=>x!=="owner_paid_approval_required");
    if(nonOwner.length===0)state="OWNER_REVIEW";
    else if(nonOwner.length<=3)state="PREPARE";

    return Object.freeze({
      state,
      objective:clean(context.objective||"verified_conversion_value",60),
      readiness,
      audience:a,
      max_safe_cac:maxSafeCac>0?maxSafeCac:0,
      blockers:Object.freeze(uniq(blockers)),
      sponsored_label_required:true,
      paid_launch:false,
      spend_authorized:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function build({products=[],economics_map={},context={}}={}){
    const rows=[];
    for(const product of Array.isArray(products)?products:[]){
      const key=clean((product.provider||"")+":"+(product.item_id||product.id||""),180);
      const economics=economics_map instanceof Map?economics_map.get(key):(economics_map?.[key]||{});
      rows.push(Object.freeze({
        key,
        product,
        plan:planCandidate({
          product,
          economics:economics||{},
          context,
          audience_input:{
            shopping_intents:context.shopping_intents||[],
            categories:[product.category].filter(Boolean),
            price_band:context.price_band||"any",
            market:context.market||""
          }
        })
      }));
    }
    rows.sort((a,b)=>{
      const rank={OWNER_REVIEW:3,PREPARE:2,HOLD:1};
      return (rank[b.plan.state]||0)-(rank[a.plan.state]||0)
        || b.plan.readiness.score-a.plan.readiness.score
        || b.plan.max_safe_cac-a.plan.max_safe_cac;
    });
    return Object.freeze({
      rows:Object.freeze(rows),
      owner_review_candidates:rows.filter(x=>x.plan.state==="OWNER_REVIEW").length,
      prepare_candidates:rows.filter(x=>x.plan.state==="PREPARE").length,
      paid_launches:0,
      spend:0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,productReadiness,audience,planCandidate,build});
  if(typeof window!=="undefined")window.BoomSalesAdvertisingBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();