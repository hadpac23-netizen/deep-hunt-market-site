(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const clean=(v,max=180)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const isHttps=v=>{try{return new URL(String(v||"")).protocol==="https:"}catch{return false}};
  const host=v=>{try{return new URL(String(v||"")).hostname.toLowerCase()}catch{return ""}};

  function sellerQuality(store={},metrics={}){
    const blockers=[]; let score=100;
    const fail=(code,penalty=10)=>{blockers.push(code);score-=penalty};
    if(store.status!=="approved")fail("store_not_approved",25);
    if(store.kyc_status!=="verified")fail("kyc_not_verified",20);
    if(!isHttps(store.website_url))fail("https_domain_missing",15);
    if(metrics.catalog_quality_ready!==true)fail("catalog_quality_not_ready",8);
    if(metrics.image_quality_ready!==true)fail("image_quality_not_ready",6);
    if(metrics.category_accuracy_ready!==true)fail("category_accuracy_not_ready",8);
    if(metrics.price_clarity_ready!==true)fail("price_clarity_not_ready",8);
    if(metrics.inventory_freshness_ready!==true)fail("inventory_freshness_not_ready",10);
    if(metrics.returns_clarity_ready!==true)fail("returns_clarity_not_ready",6);
    if(metrics.shipping_clarity_ready!==true)fail("shipping_clarity_not_ready",6);
    const broken=n(metrics.broken_link_rate);
    if(broken!==null&&broken>.02)fail("broken_link_rate_high",Math.min(15,broken*100));
    return Object.freeze({score:Math.max(0,Number(score.toFixed(1))),blockers:Object.freeze(blockers)});
  }

  function productEligibility(product={},store={}){
    const blockers=[];
    if(!clean(product.external_id,160))blockers.push("external_id_missing");
    if(!clean(product.title,240))blockers.push("title_missing");
    if(store.status!=="approved")blockers.push("store_not_approved");
    if(product.status!=="approved")blockers.push("product_not_approved");
    if(product.safety_status!=="passed")blockers.push("safety_not_passed");
    if(product.category_supported!==true)blockers.push("category_not_supported");
    const url=product.product_url||product.destination_url;
    if(!isHttps(url))blockers.push("product_url_not_https");
    const storeHost=host(store.website_url),productHost=host(url);
    if(storeHost&&productHost&&productHost!==storeHost&&!productHost.endsWith("."+storeHost))blockers.push("destination_outside_store_domain");
    if(product.currency&&n(product.price_amount)===null)blockers.push("invalid_retail_price");
    if(product.publish_requested===true&&product.status!=="approved")blockers.push("publication_before_review_forbidden");
    return Object.freeze({eligible:blockers.length===0,blockers:Object.freeze(blockers),publish:false});
  }

  function systemReadiness(config={}){
    const blockers=[];
    if(config.marketplace_snapshot_adapter_ready!==true)blockers.push("marketplace_snapshot_adapter_missing");
    if(config.merchant_registry_ready!==true)blockers.push("merchant_registry_missing");
    if(config.store_review_workflow_ready!==true)blockers.push("store_review_workflow_missing");
    if(config.product_review_workflow_ready!==true)blockers.push("product_review_workflow_missing");
    if(config.program_gate_ready!==true)blockers.push("merchant_program_gate_missing");
    if(config.seller_api_secret_hashing_ready!==true)blockers.push("seller_api_secret_hashing_unverified");
    if(config.seller_api_revocation_ready!==true)blockers.push("seller_api_revocation_unverified");
    if(config.seller_api_rate_limit_ready!==true)blockers.push("seller_api_rate_limit_unverified");
    if(config.attribution_registry_ready!==true)blockers.push("marketplace_attribution_missing");
    if(config.payout_controls_ready!==true)blockers.push("merchant_payout_controls_missing");
    let state="HOLD";
    if(blockers.length<=5)state="PREPARE";
    if(blockers.length===0)state="OWNER_REVIEW";
    return Object.freeze({
      state,
      blockers:Object.freeze(blockers),
      auto_approve_merchants:false,
      auto_approve_products:false,
      publish_products:false,
      activate_ads:false,
      merchant_payouts:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function summarize({stores=[],products=[],config={}}={}){
    const readiness=systemReadiness(config);
    const storeRows=(Array.isArray(stores)?stores:[]).map(row=>({store:row,quality:sellerQuality(row,row.metrics||{})}));
    const storeMap=new Map(storeRows.map(x=>[String(x.store.id||""),x.store]));
    const productRows=(Array.isArray(products)?products:[]).map(row=>({product:row,eligibility:productEligibility(row,storeMap.get(String(row.store_id||""))||{})}));
    return Object.freeze({
      readiness,
      stores:storeRows.length,
      products:productRows.length,
      eligible_products:productRows.filter(x=>x.eligibility.eligible).length,
      store_rows:Object.freeze(storeRows),
      product_rows:Object.freeze(productRows),
      published:0,
      payouts:0,
      execute_actions:false
    });
  }

  const api=Object.freeze({VERSION,sellerQuality,productEligibility,systemReadiness,summarize});
  if(typeof window!=="undefined")window.HuntMarketplaceBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();