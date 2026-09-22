(() => {
  "use strict";
  if(window.BoomMarketingCostGateway?.version)return;
  const version="BOOM-MARKETING-COST-EVIDENCE-GATEWAY-V1";
  const required=["source_class","platform","account_ref","period_start","period_end","currency","spend","channel_fees","evidence_ref","retrieved_at","verification_status"];
  const statuses=new Set(["VERIFIED","UNVERIFIED","PARTIAL","REJECTED"]);
  const number=v=>typeof v==="number"&&Number.isFinite(v)?v:null;
  function normalize(input={}){
    const row={};
    for(const k of required)row[k]=input[k]??null;
    row.campaign_ref=input.campaign_ref??null;
    row.ad_group_ref=input.ad_group_ref??null;
    row.country=input.country??null;
    const missing=required.filter(k=>row[k]===null||row[k]==="");
    if(number(row.spend)===null)missing.push("spend_numeric");
    if(number(row.channel_fees)===null)missing.push("channel_fees_numeric");
    const status=String(row.verification_status||"").toUpperCase();
    if(!statuses.has(status))missing.push("verification_status_valid");
    const coverage=input.coverage_proven===true;
    const verified=status==="VERIFIED" && missing.length===0 && (row.spend!==0 || coverage);
    return {
      ok:missing.length===0,
      verified,
      record:{...row,verification_status:status},
      missing:[...new Set(missing)],
      cost_truth:verified?"VERIFIED":"UNKNOWN",
      reason:row.spend===0&&!coverage?"ZERO_WITHOUT_COVERAGE_PROOF":(verified?"VERIFIED":"INCOMPLETE_OR_UNVERIFIED"),
      material_action_authorized:false
    };
  }
  function aggregate(records=[]){
    const normalized=records.map(normalize);
    const accepted=normalized.filter(x=>x.verified);
    const currencies=[...new Set(accepted.map(x=>x.record.currency))];
    if(!accepted.length)return {verified:false,status:"NO_VERIFIED_COST_EVIDENCE",spend:null,fees:null,currency:null,records:0};
    if(currencies.length!==1)return {verified:false,status:"MULTI_CURRENCY_REQUIRES_FX_EVIDENCE",spend:null,fees:null,currency:null,records:accepted.length};
    return {
      verified:true,status:"VERIFIED",
      spend:accepted.reduce((s,x)=>s+x.record.spend,0),
      fees:accepted.reduce((s,x)=>s+x.record.channel_fees,0),
      currency:currencies[0],records:accepted.length
    };
  }
  window.BoomMarketingCostGateway={version,normalize,aggregate};
})();