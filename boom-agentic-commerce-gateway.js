(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const clean=(v,max=300)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=arr=>[...new Set((Array.isArray(arr)?arr:[]).filter(Boolean))];

  function validateDiscovery(ctx={}){
    const blockers=[];
    if(ctx.merchant_identity_ready!==true)blockers.push("merchant_identity_not_ready");
    if(ctx.product_feed_ready!==true)blockers.push("product_feed_not_ready");
    if(ctx.shipping_policy_ready!==true)blockers.push("shipping_policy_not_ready");
    if(ctx.returns_policy_ready!==true)blockers.push("returns_policy_not_ready");
    if(ctx.source_freshness_ready!==true)blockers.push("source_freshness_not_ready");
    return Object.freeze({ready:blockers.length===0,blockers:Object.freeze(blockers)});
  }

  function validateCart(ctx={}){
    const discovery=validateDiscovery(ctx);
    const blockers=[...discovery.blockers];
    if(ctx.cart_endpoint_ready!==true)blockers.push("cart_endpoint_not_ready");
    if(ctx.cart_line_item_validation_ready!==true)blockers.push("cart_line_item_validation_not_ready");
    if(ctx.exact_variant_recheck_ready!==true)blockers.push("exact_variant_recheck_not_ready");
    if(ctx.continue_url_ready!==true)blockers.push("continue_url_not_ready");
    if(ctx.ucp_auth_ready!==true)blockers.push("ucp_auth_not_ready");
    return Object.freeze({ready:uniq(blockers).length===0,blockers:Object.freeze(uniq(blockers))});
  }

  function validateCheckout(ctx={}){
    const cart=validateCart(ctx);
    const blockers=[...cart.blockers];
    if(ctx.merchant_center_ready!==true)blockers.push("merchant_center_not_ready");
    if(ctx.ucp_program_approved!==true)blockers.push("ucp_program_approval_missing");
    if(ctx.native_checkout_endpoints_ready!==true)blockers.push("native_checkout_endpoints_not_ready");
    if(ctx.payment_handler_ready!==true)blockers.push("payment_handler_not_ready");
    if(ctx.m2m_bearer_auth_ready!==true)blockers.push("m2m_bearer_auth_not_ready");
    if(ctx.order_creation_ready!==true)blockers.push("order_creation_not_ready");
    if(ctx.order_status_webhook_ready!==true)blockers.push("order_status_webhook_not_ready");
    if(ctx.real_money_owner_approved!==true)blockers.push("real_money_owner_approval_required");
    return Object.freeze({ready:uniq(blockers).length===0,blockers:Object.freeze(uniq(blockers))});
  }

  function buildManifest(ctx={}){
    const discovery=validateDiscovery(ctx);
    const cart=validateCart(ctx);
    const checkout=validateCheckout(ctx);
    const protocolVersion=clean(ctx.protocol_version,40);
    const blockers=[];
    if(!protocolVersion)blockers.push("protocol_version_missing");
    if(!clean(ctx.service_endpoint,500))blockers.push("service_endpoint_missing");
    if(!clean(ctx.schema_url,500))blockers.push("schema_url_missing");

    const capabilities=[];
    if(discovery.ready)capabilities.push("discovery");
    if(cart.ready)capabilities.push("cart");
    if(checkout.ready)capabilities.push("checkout","fulfillment");

    return Object.freeze({
      protocol_version:protocolVersion||null,
      service_endpoint:clean(ctx.service_endpoint,500)||null,
      schema_url:clean(ctx.schema_url,500)||null,
      capabilities:Object.freeze(capabilities),
      discovery,
      cart,
      checkout,
      manifest_ready:blockers.length===0&&capabilities.length>0,
      profile_publish_ready:blockers.length===0&&ctx.public_well_known_profile_ready===true&&ctx.google_ucp_profile_review_ready===true,
      blockers:Object.freeze(blockers),
      well_known_publish:false,
      cart_endpoint_enabled:false,
      native_checkout_enabled:false,
      payment_enabled:false,
      order_sync_enabled:false,
      execute:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  function readiness(ctx={}){
    const manifest=buildManifest(ctx);
    let state="HOLD";
    if(manifest.discovery.ready)state="DISCOVERY_PREPARE";
    if(manifest.cart.ready)state="CART_PREPARE";
    if(manifest.checkout.ready)state="CHECKOUT_PREPARE";
    if(manifest.profile_publish_ready&&manifest.checkout.ready)state="OWNER_REVIEW";

    const allBlockers=uniq([
      ...manifest.blockers,
      ...manifest.discovery.blockers,
      ...manifest.cart.blockers,
      ...manifest.checkout.blockers
    ]);

    return Object.freeze({
      state,
      manifest,
      blockers:Object.freeze(allBlockers),
      external_profile_published:false,
      requests_served:0,
      checkout_sessions_created:0,
      payments_created:0,
      orders_created:0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,validateDiscovery,validateCart,validateCheckout,buildManifest,readiness});
  if(typeof window!=="undefined")window.BoomAgenticCommerceGateway=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
