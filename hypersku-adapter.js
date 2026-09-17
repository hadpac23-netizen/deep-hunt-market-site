(() => {
  "use strict";

  const Core = typeof module!=="undefined"&&module.exports
    ? require("./hunt-supplier-core.js")
    : globalThis.HuntSupplierCore;

  const ERROR_CODES=Object.freeze([
    "AUTH_REQUIRED",
    "PRODUCT_NOT_FOUND",
    "VARIANT_NOT_FOUND",
    "OUT_OF_STOCK",
    "COUNTRY_UNAVAILABLE",
    "SHIPPING_UNAVAILABLE",
    "QUOTE_STALE",
    "RATE_LIMITED",
    "PROVIDER_TEMPORARY_ERROR",
    "UNKNOWN_PROVIDER_ERROR"
  ]);

  const STATUS_MAP=Object.freeze({
    pending_sourcing:"SOURCING",
    pending_payment:"AWAITING_SUPPLIER_PAYMENT",
    pending_in_progress:"PROCESSING",
    processing:"PROCESSING",
    shipped:"SHIPPED",
    completed:"COMPLETED",
    cancelled:"CANCELLED",
    rejected:"FAILED"
  });

  function readiness(config={}){
    const connected=Boolean(config.connected);
    const authConfigured=Boolean(config.authConfigured);
    return Object.freeze({
      provider:"hypersku",
      connected,
      authConfigured,
      readOnlyReady:connected&&authConfigured,
      fulfillmentReady:false,
      reason:connected&&authConfigured?"READ_ONLY_READY":"AUTH_REQUIRED"
    });
  }
  function normalizeReadModel(input={}){
    return Core.canonicalProduct({
      provider:"hypersku",
      item_id:input.item_id||input.product_id,
      supplier_product_id:input.supplier_product_id||input.product_id||input.item_id,
      sku:input.sku,
      variant_id:input.variant_id,
      title:input.title,
      category:input.category,
      images:input.images||input.image_url,
      attributes:input.attributes,
      supplier_cost:input.supplier_cost,
      currency:input.currency,
      stock:input.stock,
      stock_checked_at:input.stock_checked_at,
      warehouse:input.warehouse,
      destination_country:input.destination_country,
      shipping_method:input.shipping_method,
      shipping_cost:input.shipping_cost,
      eta_min_days:input.eta_min_days,
      eta_max_days:input.eta_max_days,
      landed_cost:input.landed_cost,
      restrictions:input.restrictions,
      returns_state:input.returns_state,
      margin_ratio:input.margin_ratio,
      truth_status:input.truth_status,
      source_checked_at:input.source_checked_at
    });
  }

  function buildQuoteIntent({sku,variant_id,country,postal_code,quantity=1}={}){
    const errors=[];
    if(!sku&&!variant_id)errors.push("SKU_OR_VARIANT_REQUIRED");
    if(!country)errors.push("COUNTRY_REQUIRED");
    return Object.freeze({
      provider:"hypersku",
      operation:"SHIPPING_QUOTE",
      sku:String(sku||""),
      variant_id:String(variant_id||""),
      destination_country:String(country||"").toUpperCase(),
      postal_code:String(postal_code||""),
      quantity:Math.max(1,Number(quantity)||1),
      valid:errors.length===0,
      errors:Object.freeze(errors)
    });
  }
  function normalizeOrderStatus(value){
    const key=String(value||"").trim().toLowerCase().replace(/\s+/g,"_");
    return STATUS_MAP[key]||"UNKNOWN";
  }

  function normalizeTracking(input={}){
    return Object.freeze({
      provider:"hypersku",
      tracking_number:String(input.tracking_number||"").trim(),
      tracking_url:String(input.tracking_url||"").trim(),
      carrier:String(input.carrier||"").trim(),
      status:normalizeOrderStatus(input.status),
      updated_at:input.updated_at?new Date(input.updated_at).toISOString():null
    });
  }

  function normalizeError(input={}){
    const raw=String(input.code||input.message||"").toLowerCase();
    let code="UNKNOWN_PROVIDER_ERROR";
    if(/auth|unauthor|token|credential/.test(raw))code="AUTH_REQUIRED";
    else if(/variant.*not.*found/.test(raw))code="VARIANT_NOT_FOUND";
    else if(/product.*not.*found|item.*not.*found/.test(raw))code="PRODUCT_NOT_FOUND";
    else if(/out.*of.*stock|no.*stock/.test(raw))code="OUT_OF_STOCK";
    else if(/country.*unavailable|destination.*unsupported/.test(raw))code="COUNTRY_UNAVAILABLE";
    else if(/shipping.*unavailable|no.*shipping/.test(raw))code="SHIPPING_UNAVAILABLE";
    else if(/stale|expired.*quote/.test(raw))code="QUOTE_STALE";
    else if(/rate.*limit|too.*many/.test(raw))code="RATE_LIMITED";
    else if(/temporary|timeout|unavailable/.test(raw))code="PROVIDER_TEMPORARY_ERROR";
    return Object.freeze({provider:"hypersku",code,raw_code:String(input.code||""),message:String(input.message||"")});
  }

  const api=Object.freeze({
    provider:"hypersku",
    ERROR_CODES,
    readiness,
    normalizeReadModel,
    buildQuoteIntent,
    normalizeOrderStatus,
    normalizeTracking,
    normalizeError
  });

  if(typeof window!=="undefined")window.HyperSkuAdapter=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();
