(() => {
  "use strict";
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  function build({plan={},data={}}={}){
    const deals=(plan.rankedDeals||[]).filter(x=>x?.boom?.eligibleForPromotion);
    const sessions=n(plan.funnel?.sessions);
    const launch=plan.launch||{};
    const channels=[];
    channels.push({channel:"seo",mode:"organic",priority:sessions<100?95:78,approvalRequired:false,
      reason:"Compounds free discovery and does not require ad spend.",
      action:"Improve crawlability, Product structured data, canonical URLs, internal links and Search Console measurement."});
    channels.push({channel:"onsite",mode:"owned",priority:deals.length?92:70,approvalRequired:false,
      reason:deals.length?"Verified deal candidates can be tested safely onsite.":"Use personalization/discovery while deal evidence is still thin.",
      action:deals.length?"Test top verified deals against a control.":"Improve product discovery and collect stronger intent signals."});
    channels.push({channel:"organic_social",mode:"organic",priority:deals.length?88:58,approvalRequired:true,
      reason:"Product-native short-form can create qualified traffic without paid spend.",
      action:deals.length?"Prepare channel-specific creative drafts for the top eligible deals.":"Prepare category/value creative only from verified HUNT media."});
    channels.push({channel:"pinterest",mode:"organic",priority:deals.length?82:55,approvalRequired:true,
      reason:"Visual product discovery fits catalog-led shopping.",
      action:"Prepare 2:3 product-forward drafts and truthful destination URLs."});
    channels.push({channel:"email",mode:"lifecycle",priority:45,approvalRequired:true,
      reason:"Useful only for consented users with relevant saved/browse/cart signals.",
      action:"Do not send until consent, frequency caps and a real trigger audience exist."});
    channels.push({channel:"paid_media",mode:"paid",priority:launch.canRunPaidMarketing&&deals.length?72:5,approvalRequired:true,
      locked:!(launch.canRunPaidMarketing&&deals.length),
      reason:"Paid scale must wait for launch, attribution and economics gates.",
      action:launch.canRunPaidMarketing&&deals.length?"Draft a capped pilot; owner approves spend.":"Keep paid media locked."});
    channels.sort((a,b)=>b.priority-a.priority);
    return Object.freeze({eligibleDeals:deals.length,primary:channels[0],channels:Object.freeze(channels)});
  }
  const api=Object.freeze({build});
  if(typeof window!=="undefined")window.BoomMarketingBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();