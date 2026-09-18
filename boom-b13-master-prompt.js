(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,Number(v)||0));
  const uniq=rows=>[...new Set((rows||[]).filter(Boolean))];

  const WATCH_FIELDS=Object.freeze(["price","stock","size","color","shipping","eta"]);
  const LOOK_WATCH_FIELDS=Object.freeze([...WATCH_FIELDS,"total_look_cost"]);

  function productRef(input={}){
    return Object.freeze({
      provider:clean(input.provider).toLowerCase(),
      item_id:clean(input.item_id),
      variant_id:clean(input.variant_id),
      sku:clean(input.sku),
      category:clean(input.category),
      title:clean(input.title)
    });
  }
  function productKey(input={}){
    const p=productRef(input);
    return p.provider&&p.item_id?p.provider+":"+p.item_id+(p.variant_id?":"+p.variant_id:""):"";
  }
  function createWatchPlan({scope="product",product=null,items=[],fields=[],country="",meaningfulOnly=true}={}){
    const mode=scope==="look"?"look":"product";
    const refs=(mode==="look"?(items||[]):[product]).filter(Boolean).map(productRef);
    const invalid=refs.filter(x=>!x.provider||!x.item_id);
    const allowed=mode==="look"?LOOK_WATCH_FIELDS:WATCH_FIELDS;
    const selected=uniq((fields.length?fields:allowed).map(clean).filter(x=>allowed.includes(x)));
    const blockers=[];
    if(!refs.length)blockers.push("WATCH_TARGET_REQUIRED");
    if(invalid.length)blockers.push("EXACT_PRODUCT_REFERENCE_REQUIRED");
    if(!selected.length)blockers.push("WATCH_FIELD_REQUIRED");
    return Object.freeze({
      ready:blockers.length===0,
      scope:mode,
      country:clean(country).toUpperCase(),
      targets:Object.freeze(refs),
      fields:Object.freeze(selected),
      meaningful_only:meaningfulOnly!==false,
      notification_policy:"notify_on_material_change_only",
      live_notifications:false,
      blockers:Object.freeze(blockers)
    });
  }
  function meaningfulChanges(previous={},current={},options={}){
    const changes=[];
    const threshold=Math.max(0,Number(options.price_threshold||0));
    const p=Number(previous.price),c=Number(current.price);
    if(Number.isFinite(p)&&Number.isFinite(c)&&Math.abs(c-p)>threshold)
      changes.push({field:"price",from:p,to:c});
    for(const field of ["stock","shipping","eta"]){
      if(clean(previous[field])!==clean(current[field])&&(clean(previous[field])||clean(current[field])))
        changes.push({field,from:previous[field]??null,to:current[field]??null});
    }
    for(const field of ["sizes","colors"]){
      const a=JSON.stringify([...(previous[field]||[])].map(clean).sort());
      const b=JSON.stringify([...(current[field]||[])].map(clean).sort());
      if(a!==b)changes.push({field,from:previous[field]||[],to:current[field]||[]});
    }
    return Object.freeze({meaningful:changes.length>0,changes:Object.freeze(changes)});
  }

  const COMPONENTS=Object.freeze(["top","bottom","dress","jacket","shoes","bag","jewelry","watch","eyewear","hat","beauty","tech","home"]);
  function createLookDeconstructionPlan({source_ref="",components=[],country="",budget=null}={}){
    const rows=(components||[]).map((x,index)=>Object.freeze({
      id:clean(x.id)||"component-"+(index+1),
      category:clean(x.category).toLowerCase(),
      descriptor:clean(x.descriptor),
      confidence:Number.isFinite(Number(x.confidence))?clamp(x.confidence):null,
      requires_verified_match:true
    }));
    const blockers=[];
    if(!clean(source_ref))blockers.push("INSPIRATION_SOURCE_REQUIRED");
    if(!rows.length)blockers.push("COMPONENTS_REQUIRED");
    if(rows.some(x=>!COMPONENTS.includes(x.category)))blockers.push("UNSUPPORTED_COMPONENT");
    return Object.freeze({
      ready:blockers.length===0,
      source_ref:clean(source_ref),
      components:Object.freeze(rows),
      country:clean(country).toUpperCase(),
      budget:Number.isFinite(Number(budget))?Math.max(0,Number(budget)):null,
      exact_match_claim:false,
      verified_product_matches_required:true,
      provider_execution:false,
      blockers:Object.freeze(blockers)
    });
  }

  const CUSTOMER_ACTIONS=Object.freeze(["more_like_this","less_like_this","reset_taste","reduce_personalization"]);
  function customerControl(action,{strength=1,target=""}={}){
    const a=clean(action).toLowerCase();
    if(!CUSTOMER_ACTIONS.includes(a))return Object.freeze({valid:false,action:a,reason:"UNSUPPORTED_CUSTOMER_CONTROL"});
    const effect=a==="reset_taste"
      ?{reset:true,personalization_level:0}
      :a==="reduce_personalization"
        ?{reset:false,personalization_level:Math.max(0,1-clamp(strength))}
        :{reset:false,signal:a==="more_like_this"?1:-1,target:clean(target)};
    return Object.freeze({
      valid:true,action:a,effect:Object.freeze(effect),
      sensitive_traits_used:false,body_traits_used:false
    });
  }

  const COMPLEMENTS=Object.freeze({
    "women-dresses":["women-shoes","bags","jewelry-earrings","jewelry-necklaces"],
    "women-jeans":["women-tops","women-shoes","bags","belts"],
    "men-suits":["men-shoes","belts","watches","men-wallets"],
    "phone-cases":["chargers-cables","power-banks","stands-holders","audio"],
    "luggage":["travel","power-banks","bags","drinkware"]
  });
  function postPurchasePlan({orders=[],country=""}={}){
    const verified=(orders||[]).filter(x=>x&&x.verified===true&&["paid","processing","shipped","delivered","completed"].includes(clean(x.status).toLowerCase()));
    const owned=verified.flatMap(order=>(order.items||[]).map(item=>Object.freeze({
      order_id:clean(order.id),
      provider:clean(item.provider).toLowerCase(),
      item_id:clean(item.item_id),
      variant_id:clean(item.variant_id),
      category:clean(item.category),
      title:clean(item.title)
    }))).filter(x=>x.provider&&x.item_id);
    const targets=uniq(owned.flatMap(x=>COMPLEMENTS[x.category]||[]));
    return Object.freeze({
      ready:owned.length>0,
      owned_items:Object.freeze(owned),
      complement_categories:Object.freeze(targets),
      country:clean(country).toUpperCase(),
      tracking_support:true,
      returns_support:true,
      avoid_redundant_recommendations:true,
      requires_live_product_truth:true,
      blockers:Object.freeze(owned.length?[]:["VERIFIED_PURCHASE_REQUIRED"])
    });
  }

  function referralDecision({referrer_id="",customer_id="",conversion_verified=false,duplicate=false,reward_rule_verified=false}={}){
    const blockers=[];
    if(!clean(referrer_id)||!clean(customer_id))blockers.push("IDENTITIES_REQUIRED");
    if(clean(referrer_id)&&clean(referrer_id)===clean(customer_id))blockers.push("SELF_REFERRAL_BLOCKED");
    if(duplicate)blockers.push("DUPLICATE_REFERRAL_BLOCKED");
    if(!conversion_verified)blockers.push("VERIFIED_CONVERSION_REQUIRED");
    if(!reward_rule_verified)blockers.push("REWARD_RULE_VERIFICATION_REQUIRED");
    return Object.freeze({
      reward_eligible:blockers.length===0,
      points_issued:0,
      automatic_payout:false,
      blockers:Object.freeze(blockers)
    });
  }

  function shopTogetherFoundation({participants=[],look_id="",owner_controlled=true}={}){
    const ids=uniq((participants||[]).map(clean).filter(Boolean));
    return Object.freeze({
      ready:ids.length>=2,
      participants:Object.freeze(ids),
      look_id:clean(look_id),
      voting_supported:true,
      shared_cart_supported:false,
      payment_authority:"individual_checkout_only",
      owner_controlled:owner_controlled!==false,
      live_realtime_session:false,
      blockers:Object.freeze(ids.length>=2?[]:["TWO_PARTICIPANTS_REQUIRED"])
    });
  }

  function coverage(){
    return Object.freeze([
      {id:"hunt-watch",state:"PILOT",evidence:"Product watch planning + meaningful-change detection"},
      {id:"style-watch",state:"PILOT",evidence:"Look watch includes total look cost"},
      {id:"look-deconstruction",state:"PILOT",evidence:"Multi-component inspiration plan; verified matches required"},
      {id:"customer-controls",state:"PILOT",evidence:"More/Less/Reset/Reduce controls without sensitive traits"},
      {id:"post-purchase",state:"PILOT",evidence:"Verified purchase → owned-item context → complements"},
      {id:"referral-guard",state:"PILOT",evidence:"Verified conversion + anti-self/duplicate reward gate"},
      {id:"shop-together",state:"FOUNDATION",evidence:"Voting/session contract; shared payments remain disabled"}
    ]);
  }

  const api=Object.freeze({
    WATCH_FIELDS,LOOK_WATCH_FIELDS,COMPONENTS,CUSTOMER_ACTIONS,
    productRef,productKey,createWatchPlan,meaningfulChanges,createLookDeconstructionPlan,
    customerControl,postPurchasePlan,referralDecision,shopTogetherFoundation,coverage
  });
  if(typeof window!=="undefined")window.BoomB13MasterPrompt=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();