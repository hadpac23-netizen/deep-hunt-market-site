(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.F60T=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const WEIGHTS=Object.freeze({
    attention:0.22,
    intent:0.24,
    platform_fit:0.14,
    region_fit:0.10,
    freshness:0.12,
    economics:0.18
  });

  const ACTIVATION_BLOCKED=new Set([
    "blocked_without_separate_agreement",
    "blocked_for_live_commercial_radar",
    "disabled_until_source_verified"
  ]);

  function clamp01(v){
    const n=Number(v);
    if(!Number.isFinite(n))return 0;
    return Math.max(0,Math.min(1,n));
  }

  function ageMinutes(observedAt,nowMs=Date.now()){
    const t=Date.parse(observedAt||"");
    if(!Number.isFinite(t))return Infinity;
    return Math.max(0,(nowMs-t)/60000);
  }

  function geometricCore(s){
    let logSum=0;
    for(const [key,weight] of Object.entries(WEIGHTS)){
      const value=Math.max(0.01,clamp01(s[key]));
      logSum+=weight*Math.log(value);
    }
    return Math.exp(logSum);
  }

  function economicsScore(s){
    if(s.economics!=null)return clamp01(s.economics);
    const contribution=Number(s.contribution_per_order);
    const target=Number(s.target_contribution_per_order);
    if(Number.isFinite(contribution)&&Number.isFinite(target)&&target>0){
      return clamp01(contribution/target);
    }
    return 0;
  }

  function normalize(signal){
    const s={...signal};
    s.attention=clamp01(s.attention);
    s.velocity=clamp01(s.velocity);
    s.intent=clamp01(s.intent);
    s.platform_fit=clamp01(s.platform_fit);
    s.region_fit=clamp01(s.region_fit);
    s.freshness=clamp01(s.freshness);
    s.confidence=clamp01(s.confidence);
    s.fulfillment=clamp01(s.fulfillment);
    s.trust=clamp01(s.trust);
    s.commerce_relevance=clamp01(s.commerce_relevance);
    s.economics=economicsScore(s);
    return s;
  }

  function hardKills(s,source,nowMs){
    const reasons=[];
    if(!s.source_verified)reasons.push("source_unverified");
    if(s.identifiable_person_tracking)reasons.push("identifiable_person_tracking");
    if(s.sensitive_trait_targeting)reasons.push("sensitive_trait_targeting");
    if(s.restricted_or_unsafe_category)reasons.push("restricted_or_unsafe_category");
    if(s.fake_urgency||s.fake_popularity||s.fake_reviews)reasons.push("deceptive_merchandising");
    if(s.counterfeit_or_unverified_inventory)reasons.push("inventory_trust_failure");
    if(s.stock_verified===false)reasons.push("stock_unverified");
    if(s.shipping_verified===false)reasons.push("shipping_unverified");

    const contribution=Number(s.contribution_per_order);
    if(Number.isFinite(contribution)&&contribution<=0)reasons.push("non_positive_contribution");

    const maxAge=Number(source?.max_age_minutes);
    if(Number.isFinite(maxAge)&&ageMinutes(s.observed_at,nowMs)>maxAge)reasons.push("stale_signal");
    return reasons;
  }

  function observeOnlyReasons(s,source){
    const reasons=[];
    if(ACTIVATION_BLOCKED.has(source?.commercial_activation))reasons.push("commercial_rights_not_approved");
    if(String(source?.status||"").startsWith("research_only"))reasons.push("research_only_source");
    if(s.confidence<0.35)reasons.push("low_confidence");
    if(s.commerce_relevance<0.35)reasons.push("weak_commerce_relevance");
    if(s.intent<0.30)reasons.push("weak_intent");
    return reasons;
  }

  function tierFor(score){
    if(score>=78)return "HOT";
    if(score>=62)return "WATCH";
    if(score>=45)return "OBSERVE";
    return "LOW";
  }

  function evaluate(signal,source={},options={}){
    const nowMs=options.nowMs||Date.now();
    const s=normalize(signal||{});
    const kills=hardKills(s,source,nowMs);
    const observeOnly=observeOnlyReasons(s,source);

    if(kills.length){
      return {
        id:s.id||null,
        source_id:s.source_id||source.id||null,
        status:"KILLED",
        activation_allowed:false,
        score:0,
        tier:"KILLED",
        reasons:kills,
        observe_only_reasons:observeOnly
      };
    }

    const core=geometricCore(s);
    const confidenceMultiplier=0.70+(0.30*s.confidence);
    const velocityMultiplier=0.90+(0.20*s.velocity);
    const qualityMultiplier=0.75+(0.125*s.fulfillment)+(0.125*s.trust);
    const score=Math.max(0,Math.min(100,core*confidenceMultiplier*velocityMultiplier*qualityMultiplier*100));
    const activationAllowed=observeOnly.length===0;

    return {
      id:s.id||null,
      source_id:s.source_id||source.id||null,
      status:activationAllowed?"ELIGIBLE":"OBSERVE_ONLY",
      activation_allowed:activationAllowed,
      score:Number(score.toFixed(2)),
      tier:activationAllowed?tierFor(score):"OBSERVE_ONLY",
      reasons:[],
      observe_only_reasons:observeOnly,
      components:{
        attention:s.attention,
        velocity:s.velocity,
        intent:s.intent,
        platform_fit:s.platform_fit,
        region_fit:s.region_fit,
        freshness:s.freshness,
        economics:s.economics,
        confidence:s.confidence,
        fulfillment:s.fulfillment,
        trust:s.trust,
        commerce_relevance:s.commerce_relevance
      }
    };
  }

  function rank(signals,sourceById={},options={}){
    return (Array.isArray(signals)?signals:[])
      .map(signal=>evaluate(signal,sourceById[signal.source_id]||{},options))
      .sort((a,b)=>{
        if(a.activation_allowed!==b.activation_allowed)return a.activation_allowed?-1:1;
        return b.score-a.score;
      });
  }

  return Object.freeze({
    version:"F60T-LIVE-INDEX-V1",
    weights:WEIGHTS,
    evaluate,
    rank,
    ageMinutes
  });
});
