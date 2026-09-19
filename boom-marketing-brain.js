(() => {
  "use strict";

  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const count=(summary,channel,key="ready")=>n(summary?.channels?.[channel]?.[key]);

  function channelRow({channel,mode,priority,approvalRequired=false,locked=false,state="prepare",reason="",action=""}){
    return Object.freeze({channel,mode,priority,approvalRequired,locked,state,reason,action});
  }

  function build({plan={},data={},passportSummary=null}={}) {
    const deals=(plan.rankedDeals||[]).filter(x=>x?.boom?.eligibleForPromotion);
    const sessions=n(plan.funnel?.sessions);
    const launch=plan.launch||{};
    const summary=passportSummary||data.passportSummary||{channels:{}};
    const channels=[];

    const googleData=count(summary,"google_free_listings","data_ready");
    const googleReady=count(summary,"google_free_listings","ready");
    const googleAiData=count(summary,"google_ai","data_ready");
    const googleAiReady=count(summary,"google_ai","ready");
    const agentData=count(summary,"agentic_ucp","data_ready");
    const agentReady=count(summary,"agentic_ucp","ready");
    const agentTx=count(summary,"agentic_ucp","transaction_ready");
    const socialData=count(summary,"organic_social","data_ready");
    const socialReady=count(summary,"organic_social","ready");
    const pinterestData=count(summary,"pinterest_catalog","data_ready");
    const pinterestReady=count(summary,"pinterest_catalog","ready");
    const paidReady=count(summary,"paid_media","ready");

    channels.push(channelRow({
      channel:"seo",
      mode:"organic",
      priority:sessions<100?96:80,
      state:"ready",
      reason:"SEO compounds free product discovery and does not require ad spend.",
      action:"Keep crawlability, canonical URLs, Product structured data, internal links and Search Console measurement healthy."
    }));

    channels.push(channelRow({
      channel:"onsite",
      mode:"owned",
      priority:deals.length?94:72,
      state:deals.length?"ready":"prepare",
      reason:deals.length?"Verified deal candidates can be tested safely onsite.":"Use onsite discovery to gather stronger intent and conversion evidence.",
      action:deals.length?"Run controlled onsite exposure tests on verified deals.":"Improve product discovery before buying traffic."
    }));

    channels.push(channelRow({
      channel:"google_free_listings",
      mode:"organic-commerce",
      priority:googleReady>0?93:googleData>0?84:42,
      approvalRequired:true,
      locked:googleReady===0,
      state:googleReady>0?"ready":googleData>0?"prepare":"blocked",
      reason:googleReady>0
        ? googleReady+" product passport"+(googleReady===1?" is":"s are")+" connected and ready for truthful Google discovery."
        : googleData>0
          ? googleData+" passport"+(googleData===1?" is":"s are")+" data-ready but the external channel or account gate is not ready."
          :"No product currently satisfies the full Google commerce data contract.",
      action:googleReady>0
        ?"Prepare a Free Listings export batch for owner review."
        :googleData>0
          ?"Finish Merchant connection/account gates without changing product truth."
          :"Close the top passport blockers: description, canonical URL, feed-safe availability, legal identity, shipping and returns."
    }));

    channels.push(channelRow({
      channel:"ai_commerce_discovery",
      mode:"agentic",
      priority:agentReady>0||googleAiReady>0?91:agentData>0||googleAiData>0?82:40,
      approvalRequired:true,
      locked:agentReady===0&&googleAiReady===0,
      state:agentReady>0||googleAiReady>0?"ready":agentData>0||googleAiData>0?"prepare":"blocked",
      reason:(agentData+googleAiData)>0
        ? "Commerce Passports expose structured truth and conversational depth for AI shopping surfaces."
        : "Agent-readable product data is still incomplete.",
      action:agentReady>0||googleAiReady>0
        ? "Prepare discovery-only agent exports; keep transaction capabilities separately gated."
        : "Enrich Product Truth with verified Q&A, related products, variant options and documents."
    }));

    channels.push(channelRow({
      channel:"organic_social",
      mode:"organic",
      priority:socialReady>0?89:socialData>0?81:58,
      approvalRequired:true,
      locked:socialReady===0,
      state:socialReady>0?"ready":socialData>0?"prepare":"blocked",
      reason:socialData>0
        ? socialData+" product passport"+(socialData===1?" has":"s have")+" enough verified creative inputs for product-native drafts."
        :"Creative drafts should wait for stronger verified product facts and media.",
      action:socialReady>0
        ?"Prepare channel-specific organic drafts with tracked UTMs and owner approval."
        :"Build drafts only; connect publishing later and keep external posting OFF."
    }));

    channels.push(channelRow({
      channel:"pinterest_catalog",
      mode:"visual-commerce",
      priority:pinterestReady>0?86:pinterestData>0?77:52,
      approvalRequired:true,
      locked:pinterestReady===0,
      state:pinterestReady>0?"ready":pinterestData>0?"prepare":"blocked",
      reason:"Visual discovery is valuable only when product media, destination URL and commerce truth are complete.",
      action:pinterestReady>0
        ?"Prepare product-forward catalog entries and 2:3 creative drafts for review."
        :"Close image/feed/canonical/commerce blockers before catalog publishing."
    }));

    channels.push(channelRow({
      channel:"email_lifecycle",
      mode:"lifecycle",
      priority:48,
      approvalRequired:true,
      locked:true,
      state:"prepare",
      reason:"Lifecycle messages require consented audiences, real triggers and frequency caps.",
      action:"Prepare saved-item, cart, back-in-stock and order-update trigger contracts; do not send yet."
    }));

    const paidAllowed=launch.canRunPaidMarketing&&deals.length>0&&paidReady>0;
    channels.push(channelRow({
      channel:"paid_media",
      mode:"paid",
      priority:paidAllowed?74:5,
      approvalRequired:true,
      locked:!paidAllowed,
      state:paidAllowed?"ready":"locked",
      reason:"Paid scale requires verified economics, attribution, eligible products and explicit owner approval.",
      action:paidAllowed
        ?"Draft a capped experiment with a control; owner still approves spend."
        :"Keep paid media OFF until launch, attribution, passport and economics gates pass."
    }));

    channels.sort((a,b)=>b.priority-a.priority);
    return Object.freeze({
      eligibleDeals:deals.length,
      passportSummary:summary,
      agentic:Object.freeze({
        discovery_data_ready:agentData,
        discovery_connected_ready:agentReady,
        transaction_ready:agentTx
      }),
      primary:channels[0],
      channels:Object.freeze(channels)
    });
  }

  const api=Object.freeze({build});
  if(typeof window!=="undefined")window.BoomMarketingBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
