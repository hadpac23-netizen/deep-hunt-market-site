(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const PROVIDERS=Object.freeze({
    gclid:"GOOGLE_ADS",
    fbclid:"META",
    ttclid:"TIKTOK_ADS",
    msclkid:"MICROSOFT_ADS"
  });

  function classify(attribution={}){
    const touches=[attribution?.last_touch,attribution?.first_touch].filter(x=>x&&typeof x==="object");
    const found=[];
    for(const touch of touches){
      for(const [key,provider] of Object.entries(PROVIDERS)){
        const value=String(touch?.[key]||"").trim();
        if(value&&!found.some(x=>x.key===key))found.push({key,provider});
      }
    }
    if(found.length===0)return Object.freeze({state:"NO_PROVIDER_CLICK_ID",provider:null,click_id_type:null,ambiguous:false});
    if(found.length>1)return Object.freeze({state:"AMBIGUOUS_PROVIDER_CLICK_IDS",provider:null,click_id_type:null,ambiguous:true,types:Object.freeze(found.map(x=>x.key))});
    return Object.freeze({state:"PROVIDER_DETECTED_UNVERIFIED",provider:found[0].provider,click_id_type:found[0].key,ambiguous:false});
  }

  function evaluate(input={}){
    const detected=classify(input.attribution||{});
    const officialVerified=input.official_api_verified===true;
    const evidenceRef=String(input.evidence_ref||"").trim();
    const verifiedAt=String(input.verified_at||"").trim();
    const providerMatch=!input.verified_provider || input.verified_provider===detected.provider;
    const typeMatch=!input.verified_click_id_type || input.verified_click_id_type===detected.click_id_type;

    const providerClickValidation=detected.state==="PROVIDER_DETECTED_UNVERIFIED"
      && officialVerified
      && Boolean(evidenceRef)
      && Boolean(verifiedAt)
      && providerMatch
      && typeMatch;

    return Object.freeze({
      version:VERSION,
      detected,
      state:providerClickValidation?"VERIFIED":detected.state,
      provider_click_validation:providerClickValidation,
      official_api_verified:officialVerified,
      evidence_ref:providerClickValidation?evidenceRef:null,
      verified_at:providerClickValidation?verifiedAt:null,
      raw_click_id_exposed:false,
      conversion_claim_allowed:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function evaluateLedger(input={}){
    const verified=Math.max(0,Number(input.provider_verified)||0);
    const pending=Math.max(0,Number(input.pending_provider_validation)||0);
    return Object.freeze({
      version:VERSION,
      state:verified>0?"VERIFIED":pending>0?"PENDING_PROVIDER_VALIDATION":"NO_PROVIDER_CLICK_ID",
      provider_click_validation:verified>0,
      provider_verified:verified,
      pending_provider_validation:pending,
      official_api_evidence_required:true,
      raw_click_id_exposed:false,
      conversion_claim_allowed:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,PROVIDERS,classify,evaluate,evaluateLedger});
  if(typeof window!=="undefined")window.BoomProviderClickValidation=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();