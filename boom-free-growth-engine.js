(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const row=(channel,score,state,reason,next,blockers=[])=>Object.freeze({
    channel,score:Number(score.toFixed(1)),state,reason,next,blockers:Object.freeze(blockers)
  });

  function build(input={}){
    const p=input.plan||{}, data=input.data||{}, marketing=input.marketing||{};
    const sessions=n(p.funnel?.sessions);
    const passports=data.passportSummary||{channels:{}};
    const ch=(name,key="ready")=>n(passports.channels?.[name]?.[key]);
    const seoScore=n(input.seo_score);
    const eligibleDeals=n(marketing.eligibleDeals);
    const creator=data.creatorSystem||{};
    const measurement=input.measurement||{};
    const localization=input.localization||{};
    const sharing=input.sharing||{};
    const opportunities=[];

    const seoBlock=[];
    if(input.crawlable_urls_ready!==true)seoBlock.push("crawlable_urls_missing");
    if(input.structured_data_ready!==true)seoBlock.push("product_structured_data_missing");
    if(input.search_console_ready!==true)seoBlock.push("search_console_missing");
    const seoState=seoBlock.length?"PREPARE":"TEST_CANDIDATE";
    opportunities.push(row(
      "technical_seo",
      (sessions<100?98:84)+(seoScore<70?4:0),
      seoState,
      seoBlock.length?"Free search discovery still has technical gaps.":"Organic search foundations are measurable and ready for controlled improvement.",
      seoBlock.length?"Close crawl, structured-data and Search Console gaps.":"Run page-template SEO experiments and measure search clicks/product opens.",
      seoBlock
    ));

    const googleData=ch("google_free_listings","data_ready"), googleReady=ch("google_free_listings","ready");
    const googleBlock=[];
    if(googleData<=0)googleBlock.push("google_product_truth_missing");
    if(googleReady<=0)googleBlock.push("merchant_free_listing_gate_not_ready");
    opportunities.push(row(
      "google_free_listings",
      googleReady>0?96:googleData>0?86:48,
      googleReady>0?"TEST_CANDIDATE":googleData>0?"PREPARE":"HOLD",
      googleReady>0?"Verified products can be prepared for owner-reviewed free listings.":"Free Listings depend on complete truthful merchant and product data.",
      googleReady>0?"Prepare a review-only export batch; do not publish automatically.":"Close merchant, shipping, returns, price and availability blockers.",
      googleBlock
    ));

    const socialData=ch("organic_social","data_ready"),socialReady=ch("organic_social","ready");
    opportunities.push(row(
      "organic_short_form",
      socialReady>0?90:socialData>0?79:55,
      socialReady>0?"TEST_CANDIDATE":socialData>0?"PREPARE":"HOLD",
      socialReady>0?"Verified creative inputs exist for product-native organic drafts.":"Organic content requires exact product truth and authorized media.",
      socialReady>0?"Create draft variants, attach UTMs and keep publishing owner-gated.":"Close creative media and product-fact blockers first.",
      socialReady>0?[]:["verified_creative_inputs_missing"]
    ));

    const referralBlock=[];
    if(sharing.share_ready!==true)referralBlock.push("share_flow_missing");
    if(sharing.attribution_ready!==true)referralBlock.push("referral_attribution_missing");
    if(sharing.reward_economics_ready!==true)referralBlock.push("referral_reward_economics_missing");
    opportunities.push(row(
      "referral_sharing",
      referralBlock.length?62:88,
      referralBlock.length?"PREPARE":"TEST_CANDIDATE",
      referralBlock.length?"Referral growth is not yet measurable end to end.":"Share/referral mechanics can be tested without paid acquisition.",
      referralBlock.length?"Finish share, attribution and reward-economics contracts.":"Run a capped referral experiment with a non-referral control.",
      referralBlock
    ));

    const locBlock=[];
    if(localization.language_ready!==true)locBlock.push("language_localization_missing");
    if(localization.currency_ready!==true)locBlock.push("currency_localization_missing");
    if(localization.shipping_truth_ready!==true)locBlock.push("country_shipping_truth_missing");
    opportunities.push(row(
      "country_localization",
      locBlock.length?74:91,
      locBlock.length?"PREPARE":"TEST_CANDIDATE",
      locBlock.length?"Country discovery should not outrun language, currency or shipping truth.":"Localized discovery can improve organic relevance without ad spend.",
      locBlock.length?"Close localization and shipping-truth gaps by market.":"Test localized category landing pages and measure organic engagement.",
      locBlock
    ));

    const earnedBlock=[];
    if(String(creator.state||"HOLD")==="HOLD")earnedBlock.push("creator_system_not_ready");
    if(measurement.earned_attribution_ready!==true)earnedBlock.push("earned_attribution_missing");
    opportunities.push(row(
      "earned_creators_communities",
      earnedBlock.length?58:87,
      earnedBlock.length?"PREPARE":"TEST_CANDIDATE",
      earnedBlock.length?"Earned distribution needs rights and attribution before scale.":"Permission-based creator/community distribution can be measured without paid media.",
      earnedBlock.length?"Finish rights, attribution and outreach controls.":"Prepare permission-based outreach candidates; external sends stay OFF.",
      earnedBlock
    ));

    opportunities.sort((a,b)=>b.score-a.score);
    const primary=opportunities.find(x=>x.state==="TEST_CANDIDATE")
      || opportunities.find(x=>x.state==="PREPARE")
      || opportunities[0]||null;

    return Object.freeze({
      version:VERSION,
      primary,
      opportunities:Object.freeze(opportunities),
      organic_test_candidates:opportunities.filter(x=>x.state==="TEST_CANDIDATE").length,
      paid_spend:false,
      external_publish:false,
      external_send:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED",
      eligible_deals:eligibleDeals
    });
  }

  const api=Object.freeze({VERSION,build});
  if(typeof window!=="undefined")window.BoomFreeGrowthEngine=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();