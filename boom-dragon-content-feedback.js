(() => {
  "use strict";
  const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const clean=v=>String(v??"").trim();
  const n=v=>Number.isFinite(Number(v))?Number(v):0;

  function canonicalCreativeKey(id){
    const s=clean(id);
    return /^creative:[0-9a-f-]{36}$/i.test(s)?s:"";
  }
  function distributionIdentity(creativeId){
    const id=clean(creativeId);
    return /^[0-9a-f-]{36}$/i.test(id)?"creative:"+id:"";
  }
  function normalize(data={}){
    const c=data.counts||{},r=data.readiness||{};
    return Object.freeze({
      status:clean(data.status||"PREP").toUpperCase(),
      source:clean(data.source||""),
      generated_at:data.generated_at||null,
      counts:Object.freeze({
        creative_drafts:n(c.creative_drafts),
        verified_product_creatives:n(c.verified_product_creatives),
        experiment_linked_creatives:n(c.experiment_linked_creatives),
        marketing_experiments:n(c.marketing_experiments),
        distribution_drafts:n(c.distribution_drafts),
        distribution_approved:n(c.distribution_approved),
        distribution_published:n(c.distribution_published),
        canonical_creative_identity:n(c.canonical_creative_identity),
        attribution_contexts:n(c.attribution_contexts),
        confirmed_attributed_purchases:n(c.confirmed_attributed_purchases),
        profit_linked_orders:n(c.profit_linked_orders),
        settled_profit_orders:n(c.settled_profit_orders),
        learning_items:n(c.learning_items)
      }),
      readiness:Object.freeze({
        creative_identity_ready:r.creative_identity_ready===true,
        attribution_ready:r.attribution_ready===true,
        profit_ready:r.profit_ready===true,
        winner_eligible:r.winner_eligible===true
      }),
      campaigns:Object.freeze(Array.isArray(data.campaigns)?data.campaigns.map(x=>Object.freeze({...x})):[]),
      blockers:Object.freeze(Array.isArray(data.blockers)?[...data.blockers]:[]),
      rules:Object.freeze({...data.rules})
    });
  }
  async function token(){
    const client=window.BOOM_SUPABASE_CLIENT;
    if(!client?.auth?.getSession)return null;
    try{const {data:{session}}=await client.auth.getSession();return session?.access_token||null}catch{return null}
  }
  async function load(opts={}){
    const accessToken=await token();
    if(!accessToken)return normalize({
      status:"BLOCKED",
      source:"auth",
      blockers:["ADMIN_SESSION_REQUIRED"],
      rules:{winner_rule:"Server evidence required"}
    });
    const days=Math.max(1,Math.min(60,Number(opts.days||14)));
    try{
      const res=await fetch(BASE+"/hunt-content-feedback-snapshot?days="+days,{
        cache:"no-store",
        headers:{
          apikey:window.HuntCore?.publishableKey||"sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X",
          Authorization:"Bearer "+accessToken
        }
      });
      if(!res.ok)throw new Error("HTTP_"+res.status);
      return normalize(await res.json());
    }catch(error){
      return normalize({
        status:"PREP",
        source:"content feedback function not deployed",
        counts:{
          creative_drafts:96,
          distribution_drafts:96,
          distribution_published:0,
          canonical_creative_identity:0,
          confirmed_attributed_purchases:0,
          settled_profit_orders:0
        },
        readiness:{
          creative_identity_ready:false,
          attribution_ready:false,
          profit_ready:false,
          winner_eligible:false
        },
        blockers:[
          "SNAPSHOT_FUNCTION_NOT_DEPLOYED",
          "NO_PUBLISHED_DISTRIBUTION",
          "CANONICAL_CREATIVE_ID_NOT_READY",
          "NO_CONFIRMED_ATTRIBUTED_PURCHASE",
          "NO_SETTLED_PROFIT_EVIDENCE"
        ],
        rules:{
          canonical_utm_content:"creative:<creative_uuid>",
          winner_rule:"Published + canonical creative identity + confirmed attributed purchase + non-test settled profit evidence",
          revenue_only_winner:false,
          browser_purchase_winner:false,
          owner_gate_required:true
        }
      });
    }
  }
  async function initBrowser(){
    if(typeof window==="undefined")return null;
    const snapshot=await load({days:14});
    window.DRAGON_CONTENT_FEEDBACK_STATE=snapshot;
    window.dispatchEvent(new CustomEvent("dragon:content-feedback",{detail:snapshot}));
    return snapshot;
  }

  const api=Object.freeze({canonicalCreativeKey,distributionIdentity,normalize,load,initBrowser});
  if(typeof window!=="undefined"){
    window.DragonContentFeedback=api;
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(initBrowser,120));
    else setTimeout(initBrowser,120);
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();