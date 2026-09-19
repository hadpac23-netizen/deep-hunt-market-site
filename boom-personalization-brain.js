(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const SENSITIVE_KEYS=new Set(["race","ethnicity","religion","politics","political","health","medical","disability","sexuality","sexual_orientation","sex_life","criminal_history","biometric"]);
  const clean=(v,max=120)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function sanitizeProfile(input={}){
    const rejected=[];
    for(const key of Object.keys(input||{}))if(SENSITIVE_KEYS.has(String(key).toLowerCase()))rejected.push(key);
    const affinities={};
    for(const [key,value] of Object.entries(input.category_affinity||{})){
      const k=clean(key,60).toLowerCase();
      const v=Math.max(-100,Math.min(100,num(value)));
      if(k)affinities[k]=v;
    }
    return Object.freeze({
      locale:clean(input.locale,20),
      market:clean(input.market,12).toUpperCase(),
      explicit_categories:Object.freeze(uniq(input.explicit_categories).map(x=>clean(x,60).toLowerCase()).filter(Boolean).slice(0,12)),
      category_affinity:Object.freeze(affinities),
      price_band:clean(input.price_band||"any",20).toLowerCase(),
      recent_searches:Object.freeze(uniq(input.recent_searches).map(x=>clean(x,100)).filter(Boolean).slice(0,20)),
      recent_views:Object.freeze(uniq(input.recent_views).map(x=>clean(x,120)).filter(Boolean).slice(0,40)),
      liked_ids:Object.freeze(uniq(input.liked_ids).map(x=>clean(x,120)).filter(Boolean).slice(0,100)),
      saved_ids:Object.freeze(uniq(input.saved_ids).map(x=>clean(x,120)).filter(Boolean).slice(0,100)),
      hidden_ids:Object.freeze(uniq(input.hidden_ids).map(x=>clean(x,120)).filter(Boolean).slice(0,100)),
      reduced_personalization:input.reduced_personalization===true,
      rejected_sensitive_fields:Object.freeze(rejected)
    });
  }

  function readiness(config={}){
    const blockers=[];
    if(config.preference_controls_ready!==true)blockers.push("preference_controls_missing");
    if(config.reset_controls_ready!==true)blockers.push("reset_controls_missing");
    if(config.recommendation_impression_tracking_ready!==true)blockers.push("recommendation_impression_tracking_missing");
    if(config.outcome_tracking_ready!==true)blockers.push("recommendation_outcome_tracking_missing");
    if(config.holdout_ready!==true)blockers.push("non_personalized_holdout_missing");
    if(config.market_eligibility_ready!==true)blockers.push("market_eligibility_missing");
    if(config.product_truth_ready!==true)blockers.push("product_truth_missing");
    if(config.privacy_contract_ready!==true)blockers.push("privacy_contract_missing");
    let state="HOLD";
    if(blockers.length<=4)state="PREPARE";
    if(blockers.length===0)state="MEASURE";
    return Object.freeze({
      state,
      blockers:Object.freeze(blockers),
      ranking_enabled:false,
      external_actions:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function productId(item={}){
    return clean(item.item_id||item.id||item.sku||item.supplier_sku,120);
  }
  function category(item={}){
    return clean(item.category||item.department||"",60).toLowerCase();
  }
  function verified(item={}){
    return item.retail_price_verified===true && String(item.profit_gate_status||"").toUpperCase()==="PASS";
  }
  function eligible(item={},ctx={}){
    if(item.market_eligible===false)return false;
    if(ctx.require_verified_truth===true && !verified(item))return false;
    if(item.safety_blocked===true || item.hidden===true)return false;
    return true;
  }

  function score(item={},profileInput={},ctx={}){
    const p=sanitizeProfile(profileInput);
    const id=productId(item),cat=category(item);
    if(!eligible(item,ctx))return Object.freeze({eligible:false,score:-Infinity,reasons:Object.freeze(["eligibility_block"])});
    if(p.hidden_ids.includes(id))return Object.freeze({eligible:false,score:-Infinity,reasons:Object.freeze(["user_hidden"])});
    let value=0; const reasons=[];
    if(p.reduced_personalization){
      if(verified(item)){value+=12;reasons.push("verified_truth");}
      if(item.source_fresh===true||item.source_fresh_at){value+=3;reasons.push("fresh_source");}
      return Object.freeze({eligible:true,score:value,reasons:Object.freeze(reasons),personalized:false});
    }
    if(p.explicit_categories.includes(cat)){value+=32;reasons.push("explicit_preference");}
    const affinity=num(p.category_affinity[cat]);
    if(affinity){value+=Math.max(-24,Math.min(24,affinity*.24));reasons.push("category_affinity");}
    if(p.liked_ids.includes(id)){value+=18;reasons.push("liked");}
    if(p.saved_ids.includes(id)){value+=22;reasons.push("saved");}
    if(p.recent_views.includes(id)){value-=10;reasons.push("recent_repeat_penalty");}
    const band=clean(item.price_band||"",20).toLowerCase();
    if(p.price_band!=="any"&&band&&band===p.price_band){value+=8;reasons.push("price_band_match");}
    if(verified(item)){value+=14;reasons.push("verified_truth");}
    if(item.availability_verified===true){value+=5;reasons.push("verified_stock");}
    if(item.source_fresh===true){value+=4;reasons.push("fresh_source");}
    if(item.media_quality_ready===true){value+=3;reasons.push("media_quality");}
    if(item.near_duplicate===true){value-=12;reasons.push("duplicate_penalty");}
    if(item.verified_contribution_amount!=null&&verified(item)){value+=Math.min(3,Math.max(0,num(item.verified_contribution_amount)/10));reasons.push("profit_tiebreak");}
    return Object.freeze({eligible:true,score:Number(value.toFixed(3)),reasons:Object.freeze(reasons.slice(0,8)),personalized:true});
  }

  function rank(items=[],profileInput={},ctx={}){
    const p=sanitizeProfile(profileInput);
    const maxPerCategory=Math.max(1,Number(ctx.max_per_category||4));
    const maxPerSupplier=Math.max(1,Number(ctx.max_per_supplier||4));
    const limit=Math.max(1,Math.min(100,Number(ctx.limit||24)));
    const explorationShare=Math.max(0,Math.min(.25,Number(ctx.exploration_share??.1)));
    const rows=(Array.isArray(items)?items:[]).map((item,index)=>({item,index,result:score(item,p,ctx)}))
      .filter(x=>x.result.eligible)
      .sort((a,b)=>b.result.score-a.result.score||a.index-b.index);
    const selected=[],catCount=new Map(),supplierCount=new Map();
    for(const row of rows){
      const cat=category(row.item)||"other";
      const supplier=clean(row.item.provider||row.item.supplier||"unknown",80).toLowerCase();
      if((catCount.get(cat)||0)>=maxPerCategory)continue;
      if((supplierCount.get(supplier)||0)>=maxPerSupplier)continue;
      selected.push(row);
      catCount.set(cat,(catCount.get(cat)||0)+1);
      supplierCount.set(supplier,(supplierCount.get(supplier)||0)+1);
      if(selected.length>=limit)break;
    }
    const exploreSlots=Math.floor(limit*explorationShare);
    if(exploreSlots>0&&!p.reduced_personalization){
      const selectedIds=new Set(selected.map(x=>productId(x.item)));
      const explorers=rows.filter(x=>!selectedIds.has(productId(x.item))&&!p.explicit_categories.includes(category(x.item))).slice(0,exploreSlots);
      for(let i=0;i<explorers.length;i++)selected[Math.max(0,selected.length-1-i)]=explorers[i];
    }
    return Object.freeze({
      items:Object.freeze(selected.slice(0,limit).map(x=>Object.freeze({item:x.item,score:x.result.score,reasons:x.result.reasons}))),
      personalized:p.reduced_personalization!==true,
      diversity:Object.freeze({max_per_category:maxPerCategory,max_per_supplier:maxPerSupplier}),
      exploration_share:explorationShare,
      execute:false
    });
  }

  const api=Object.freeze({VERSION,sanitizeProfile,readiness,score,rank});
  if(typeof window!=="undefined")window.BoomPersonalizationBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();