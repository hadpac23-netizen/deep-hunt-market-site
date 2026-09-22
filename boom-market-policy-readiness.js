(() => {
  "use strict";
  if(window.BoomMarketPolicyReadiness?.version)return;
  const version="BOOM-MARKET-POLICY-READINESS-V1";
  const mapped=new Set(["IL","EU","GB","US","AU"]);
  function marketKey(country){
    const c=String(country||"").trim().toUpperCase();
    const eu=new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]);
    if(c==="UK")return "GB";
    if(c==="GB")return "GB";
    if(eu.has(c))return "EU";
    return c;
  }
  function evaluate(input={}){
    const market=marketKey(input.country);
    const g=input.global||{};
    const m=input.market||{};
    const checks={
      BUSINESS_IDENTITY_PUBLISHED:g.business_identity_published===true,
      LEGAL_REGISTRY_DEPLOYED:g.legal_registry_deployed===true,
      TERMS_PUBLISHED:g.terms_published===true,
      PRIVACY_PUBLISHED:g.privacy_published===true,
      RETURNS_PUBLISHED:g.returns_published===true,
      SHIPPING_PUBLISHED:g.shipping_published===true,
      RETURNS_ADDRESS_READY:g.returns_address_ready===true,
      SUPPORT_CONTACT_READY:g.support_contact_ready===true,
      PRIVACY_CONTACT_READY:g.privacy_contact_ready===true,
      VERIFIED_SHIPPING_PROMISE_SOURCE:g.verified_shipping_promise_source===true,
      CANCELLATION_RETURN_FLOW_IMPLEMENTED:g.cancellation_return_flow_implemented===true,
      MARKET_SPECIFIC_REVIEW_APPROVED:m.review_approved===true
    };
    const unmapped=!mapped.has(market);
    const order=Object.keys(checks);
    const first=order.find(k=>!checks[k])||null;
    let state="READY_FOR_OWNER_REVIEW";
    let blocker=first;
    if(unmapped){state="HOLD_UNMAPPED_MARKET";blocker="MARKET_NOT_MAPPED";}
    else if(first){state="BLOCKED_"+first;}
    return {
      version,mode:"SHADOW",country:String(input.country||"").toUpperCase(),market,
      mapped:!unmapped,state,blocker,checks,
      real_money_allowed:false,
      material_action_authorized:false
    };
  }
  function evaluateMany(countries=[],global={},reviews={}){
    return countries.map(country=>evaluate({country,global,market:reviews[marketKey(country)]||reviews[String(country||"").toUpperCase()]||{}}));
  }
  window.BoomMarketPolicyReadiness={version,marketKey,evaluate,evaluateMany};
})();