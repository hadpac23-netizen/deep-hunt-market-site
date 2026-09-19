(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const clean=(v,max=2000)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  const RULES=Object.freeze([
    {code:"waterproof_claim",re:/\bwaterproof\b/i,evidence:"waterproof"},
    {code:"water_resistance_claim",re:/\bwater[- ]?resistant\b/i,evidence:"water resistant"},
    {code:"universal_fit_claim",re:/\b(fits? all|universal fit|works? with every)\b/i,evidence:"universal compatibility"},
    {code:"guarantee_claim",re:/\b(guaranteed|guarantee(?:d)? results?|100% guaranteed)\b/i,evidence:"guarantee"},
    {code:"delivery_promise",re:/\b(deliver(?:y|ed)? (?:today|tomorrow|overnight|next day)|arrives? (?:today|tomorrow)|same[- ]day delivery)\b/i,evidence:"delivery promise"},
    {code:"free_shipping_claim",re:/\bfree shipping\b/i,evidence:"free shipping"},
    {code:"scarcity_claim",re:/\b(only \d+ left|selling out fast|last chance|almost gone|limited stock)\b/i,evidence:"scarcity"},
    {code:"popularity_claim",re:/(?:#\s*1\b|\b(?:no\.?\s*1|best[- ]seller|bestseller|most popular|trending #?1|number one)\b)/i,evidence:"popularity"},
    {code:"superiority_claim",re:/\b(best|better than all|ultimate|perfect)\b/i,evidence:"superiority"},
    {code:"original_brand_claim",re:/\b(100% authentic|guaranteed authentic|official original)\b/i,evidence:"authenticity"},
    {code:"medical_claim",re:/\b(cures?|treats?|heals?|clinically proven|medical grade)\b/i,evidence:"medical"},
    {code:"discount_claim",re:/\b\d{1,3}%\s*(off|discount|price drop)\b/i,evidence:"discount"}
  ]);

  function evidenceText(input={}){
    const rows=[
      ...(Array.isArray(input.verified_facts)?input.verified_facts:[]),
      ...(Array.isArray(input.verified_claims)?input.verified_claims:[])
    ];
    return rows.map(v=>clean(v,300).toLowerCase()).join(" | ");
  }

  function hasEvidence(haystack,needle){
    const normalized=clean(needle,120).toLowerCase();
    if(!normalized)return false;
    return haystack.includes(normalized);
  }

  function inspectText(text,input={}){
    const value=clean(text,5000);
    const evidence=evidenceText(input);
    const violations=[];
    for(const rule of RULES){
      if(rule.re.test(value)&&!hasEvidence(evidence,rule.evidence)){
        violations.push(rule.code);
      }
    }
    return Object.freeze({
      pass:violations.length===0,
      violations:Object.freeze(uniq(violations)),
      text:value
    });
  }

  function inspectDraft(draft={},input={}){
    const fields=["hook","headline","body","cta","script","overlay_text"];
    const violations=[];
    for(const field of fields){
      const result=inspectText(draft?.[field],input);
      for(const code of result.violations)violations.push(field+":"+code);
    }
    return Object.freeze({
      pass:violations.length===0,
      violations:Object.freeze(uniq(violations)),
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function sanitizeDraft(draft={},input={}){
    const inspection=inspectDraft(draft,input);
    return Object.freeze({
      ...draft,
      claim_firewall:Object.freeze({
        version:VERSION,
        pass:inspection.pass,
        violations:inspection.violations
      }),
      publish_ready:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RULES,inspectText,inspectDraft,sanitizeDraft});
  if(typeof window!=="undefined")window.BoomClaimFirewall=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
