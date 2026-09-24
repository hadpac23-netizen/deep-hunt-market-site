(() => {
  "use strict";

  const clean=v=>String(v??"").trim();
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const round=v=>v===null?null:Number(Number(v).toFixed(2));
  const paid=s=>["paid","succeeded","completed"].includes(clean(s).toLowerCase());
  const fulfilled=s=>["fulfilled","delivered","completed"].includes(clean(s).toLowerCase());

  function normalizePreview(input={}){
    const status=clean(input.status||"PREP").toUpperCase();
    return Object.freeze({
      status,
      realized:false,
      basis:clean(input.basis||"QUOTE").toUpperCase(),
      currency:clean(input.currency||"USD").toUpperCase(),
      revenue_amount:num(input.revenue_amount),
      product_revenue_amount:num(input.product_revenue_amount),
      shipping_revenue_amount:num(input.shipping_revenue_amount),
      discount_amount:num(input.discount_amount),
      supplier_product_cost:num(input.supplier_product_cost),
      supplier_shipping_cost:num(input.supplier_shipping_cost),
      payment_fee_reserve:num(input.payment_fee_reserve),
      refund_reserve:num(input.refund_reserve),
      platform_fee:num(input.platform_fee),
      contribution_amount:num(input.contribution_amount),
      contribution_margin_rate:num(input.contribution_margin_rate),
      minimum_contribution:num(input.minimum_contribution),
      units:num(input.units),
      fees_are_reserves:input.fees_are_reserves===true,
      issues:Object.freeze(Array.isArray(input.issues)?[...input.issues]:[])
    });
  }

  function evaluateActualOrder(input={}){
    const issues=[];
    const revenue=num(input.revenue_amount);
    const supplierProduct=num(input.supplier_product_cost);
    const supplierShipping=num(input.supplier_shipping_cost);
    const paymentFee=num(input.payment_fee_amount);
    const platformFee=num(input.platform_fee_amount);
    const refunds=num(input.refund_amount);
    const taxCost=num(input.tax_cost_amount);
    const chargebacks=num(input.chargeback_amount);
    const marketing=num(input.marketing_cost_amount);

    if(!clean(input.order_id))issues.push("ORDER_ID_MISSING");
    if(!paid(input.payment_status))issues.push("PAYMENT_NOT_CONFIRMED");
    if(revenue===null)issues.push("REVENUE_UNKNOWN");
    if(supplierProduct===null)issues.push("SUPPLIER_PRODUCT_COST_UNKNOWN");
    if(supplierShipping===null)issues.push("SUPPLIER_SHIPPING_COST_UNKNOWN");
    if(paymentFee===null)issues.push("PAYMENT_FEE_UNKNOWN");
    if(platformFee===null)issues.push("PLATFORM_FEE_UNKNOWN");
    if(refunds===null)issues.push("REFUND_AMOUNT_UNKNOWN");

    const directKnown=issues.filter(x=>[
      "REVENUE_UNKNOWN","SUPPLIER_PRODUCT_COST_UNKNOWN","SUPPLIER_SHIPPING_COST_UNKNOWN",
      "PAYMENT_FEE_UNKNOWN","PLATFORM_FEE_UNKNOWN","REFUND_AMOUNT_UNKNOWN"
    ].includes(x)).length===0;

    const contribution=directKnown
      ? revenue-supplierProduct-supplierShipping-paymentFee-platformFee-refunds
      : null;

    const extrasKnown=[taxCost,chargebacks,marketing].every(v=>v!==null);
    const net=directKnown&&extrasKnown
      ? contribution-taxCost-chargebacks-marketing
      : null;

    let status="ORDER_PROFIT_HOLD";
    if(paid(input.payment_status))status="PAID_PROVISIONAL";
    if(paid(input.payment_status)&&fulfilled(input.fulfillment_status)&&directKnown)status="FULFILLED_PROVISIONAL";
    if(
      input.financial_finalized===true &&
      paid(input.payment_status) &&
      fulfilled(input.fulfillment_status) &&
      directKnown &&
      extrasKnown &&
      input.costs_complete===true
    ) status="REALIZED_FINAL";

    if(status==="REALIZED_FINAL"&&net===null)status="ORDER_PROFIT_HOLD";

    return Object.freeze({
      status,
      realized:status==="REALIZED_FINAL",
      currency:clean(input.currency||"USD").toUpperCase(),
      revenue_amount:round(revenue),
      supplier_product_cost:round(supplierProduct),
      supplier_shipping_cost:round(supplierShipping),
      payment_fee_amount:round(paymentFee),
      platform_fee_amount:round(platformFee),
      refund_amount:round(refunds),
      tax_cost_amount:round(taxCost),
      chargeback_amount:round(chargebacks),
      marketing_cost_amount:round(marketing),
      contribution_amount:round(contribution),
      contribution_margin_rate:contribution!==null&&revenue>0
        ? Number((contribution/revenue).toFixed(4))
        : null,
      net_profit_amount:status==="REALIZED_FINAL"?round(net):null,
      payment_status:clean(input.payment_status),
      fulfillment_status:clean(input.fulfillment_status),
      financial_finalized:input.financial_finalized===true,
      costs_complete:input.costs_complete===true,
      issues:Object.freeze(issues)
    });
  }

  function readLastPreview(){
    if(typeof sessionStorage==="undefined")return null;
    try{
      const row=JSON.parse(sessionStorage.getItem("hunt_last_profit_preview_v1")||"null");
      return row&&typeof row==="object"?row:null;
    }catch{return null;}
  }

  function savePreview(preview,meta={}){
    if(typeof sessionStorage==="undefined")return null;
    const normalized=normalizePreview(preview);
    const row={
      ...normalized,
      payment_session_id:clean(meta.payment_session_id),
      country_code:clean(meta.country_code).toUpperCase(),
      captured_at:new Date().toISOString()
    };
    try{sessionStorage.setItem("hunt_last_profit_preview_v1",JSON.stringify(row));}catch{}
    return Object.freeze(row);
  }

  const api=Object.freeze({normalizePreview,evaluateActualOrder,readLastPreview,savePreview});
  if(typeof window!=="undefined")window.DragonOrderProfit=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();