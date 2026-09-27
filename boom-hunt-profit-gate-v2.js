"use strict";

const DEFAULTS=Object.freeze({
  min_profit_usd:4,
  payment_reserve_rate:0.04,
  refund_reserve_rate:0.05,
  target_product_margin:0.35
});

const n=v=>{
  const x=Number(v);
  return Number.isFinite(x)?x:null;
};

function targetRetail(sourceCost,opts={}){
  const cost=n(sourceCost);
  if(cost===null||cost<=0)return null;
  const minProfit=Math.max(0,n(opts.min_profit_usd)??DEFAULTS.min_profit_usd);
  const paymentReserve=Math.min(.15,Math.max(0,n(opts.payment_reserve_rate)??DEFAULTS.payment_reserve_rate));
  const refundReserve=Math.min(.20,Math.max(0,n(opts.refund_reserve_rate)??DEFAULTS.refund_reserve_rate));
  const targetMargin=Math.min(.75,Math.max(.10,n(opts.target_product_margin)??DEFAULTS.target_product_margin));
  const reserve=Math.max(.50,1-paymentReserve-refundReserve);
  const contributionFloor=(cost+minProfit)/reserve;
  const marginFloor=cost/Math.max(.05,reserve-targetMargin);
  const raw=Math.max(contributionFloor,marginFloor);
  const retail=Math.max(.99,Math.ceil(raw+.01)-.01);
  const contribution=retail*reserve-cost;
  const margin=retail>0?contribution/retail:0;
  return {
    supplier_cost_usd:+cost.toFixed(2),
    target_retail_usd:+retail.toFixed(2),
    projected_product_contribution_usd:+contribution.toFixed(2),
    projected_product_margin:+margin.toFixed(4),
    payment_reserve_rate:paymentReserve,
    refund_reserve_rate:refundReserve,
    reserve_rate_total:+(paymentReserve+refundReserve).toFixed(4),
    min_profit_usd:minProfit,
    target_product_margin:targetMargin
  };
}

function evaluateProfit(input={},opts={}){
  const cost=n(input.supplier_cost_usd);
  if(cost===null||cost<=0){
    return {
      status:"PROFIT_BLOCK",
      reason:"SUPPLIER_COST_MISSING_OR_INVALID",
      final_profit_verified:false,
      material_action_authorized:false
    };
  }

  const target=targetRetail(cost,opts);
  const providedRetail=n(input.retail_price_usd);
  const retail=providedRetail!==null&&providedRetail>0?providedRetail:target.target_retail_usd;
  const paymentReserve=target.payment_reserve_rate;
  const refundReserve=target.refund_reserve_rate;
  const reserve=1-paymentReserve-refundReserve;
  const productContribution=retail*reserve-cost;
  const productMargin=retail>0?productContribution/retail:0;
  const mathPass=productContribution>=target.min_profit_usd&&productMargin>=target.target_product_margin;

  const marketKnown=input.market_validation_pass===true||input.market5_all_pass===true
    ?"PASS"
    :(input.market_validation_pass===false||input.market5_all_pass===false?"FAIL":"UNKNOWN");

  const supplierShipping=n(input.supplier_shipping_usd);
  const customerShipping=n(input.customer_shipping_usd??input.customer_shipping_grossup_usd);
  const shippingKnown=supplierShipping!==null&&supplierShipping>=0&&customerShipping!==null&&customerShipping>=0;

  let projectedOrderContribution=null;
  let customerTotal=null;
  if(shippingKnown){
    customerTotal=retail+customerShipping;
    projectedOrderContribution=customerTotal*reserve-cost-supplierShipping;
  }

  let status="PROFIT_REVIEW";
  let reason="MARKET_VALIDATION_UNKNOWN";

  if(!mathPass){
    status="PROFIT_BLOCK";
    reason="PRODUCT_MARGIN_OR_CONTRIBUTION_BELOW_FLOOR";
  }else if(marketKnown==="FAIL"){
    status="PROFIT_REVIEW";
    reason="MARKET_VALIDATION_FAILED";
  }else if(marketKnown==="UNKNOWN"){
    status="PROFIT_REVIEW";
    reason="MARKET_VALIDATION_UNKNOWN";
  }else if(!shippingKnown){
    status="PROFIT_REVIEW";
    reason="DESTINATION_SHIPPING_NOT_VERIFIED";
  }else if(projectedOrderContribution<target.min_profit_usd){
    status="PROFIT_BLOCK";
    reason="DESTINATION_CONTRIBUTION_BELOW_FLOOR";
  }else{
    status="PROFIT_PASS";
    reason="PROJECTED_DESTINATION_CONTRIBUTION_PASS";
  }

  return {
    status,
    reason,
    pricing_basis:providedRetail!==null&&providedRetail>0?"PROVIDED_RETAIL":"PRICE_GATE_V2_1_TARGET",
    retail_price_usd:+retail.toFixed(2),
    target_retail_usd:target.target_retail_usd,
    supplier_cost_usd:+cost.toFixed(2),
    projected_product_contribution_usd:+productContribution.toFixed(2),
    projected_product_margin:+productMargin.toFixed(4),
    market_validation_status:marketKnown,
    shipping_verified:shippingKnown,
    supplier_shipping_usd:shippingKnown?+supplierShipping.toFixed(2):null,
    customer_shipping_usd:shippingKnown?+customerShipping.toFixed(2):null,
    customer_total_usd:shippingKnown?+customerTotal.toFixed(2):null,
    projected_order_contribution_usd:shippingKnown?+projectedOrderContribution.toFixed(2):null,
    final_profit_verified:false,
    final_profit_blockers:[
      "TAX_IMPORT_NOT_FULLY_REALIZED",
      "FX_COST_NOT_REALIZED",
      "MARKETING_COST_NOT_REALIZED",
      "RETURNS_REFUNDS_NOT_REALIZED",
      "PAYMENT_PROCESSOR_ACTUAL_FEE_NOT_REALIZED"
    ],
    material_action_authorized:false
  };
}

module.exports={DEFAULTS,targetRetail,evaluateProfit};
