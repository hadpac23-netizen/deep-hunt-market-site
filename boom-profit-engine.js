(() => {
  "use strict";
  if(window.BoomProfitEngine?.version)return;
  const version="BOOM-PROFIT-ENGINE-V1";
  const TARGET=10000;
  const required=[
    "gross_revenue","supplier_cost","shipping_cost","payment_fees","discount_cost",
    "marketing_cost","returns_cost","cancellation_refund_cost","other_variable_cost"
  ];
  const num=v=>typeof v==="number"&&Number.isFinite(v)?v:null;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function evaluateHour(input={}){
    const missing=required.filter(k=>num(input[k])===null);
    const orders=num(input.orders);
    const qualifiedUsers=num(input.qualified_users);
    if(missing.length){
      return {
        version,verified:false,status:"UNKNOWN_INCOMPLETE_COST_EVIDENCE",
        target_net_profit_per_hour_usd:TARGET,missing,
        verified_net_profit:null,target_gap:null,target_attainment_percent:null,
        material_action_authorized:false
      };
    }
    const revenue=input.gross_revenue;
    const costs=required.filter(k=>k!=="gross_revenue").reduce((s,k)=>s+input[k],0);
    const supplierAndShipping=input.supplier_cost+input.shipping_cost;
    const grossMargin=revenue-supplierAndShipping;
    const contribution=revenue-costs;
    const netProfit=contribution;
    const gap=TARGET-netProfit;
    return {
      version,verified:true,status:netProfit>=TARGET?"TARGET_MET":"TARGET_GAP",
      target_net_profit_per_hour_usd:TARGET,
      gross_revenue:revenue,total_variable_cost:costs,
      gross_margin:grossMargin,contribution_margin:contribution,
      verified_net_profit:netProfit,
      net_profit_per_order:orders&&orders>0?netProfit/orders:null,
      conversion_rate:orders!==null&&qualifiedUsers&&qualifiedUsers>0?orders/qualifiedUsers:null,
      target_gap:gap>0?gap:0,
      target_attainment_percent:TARGET>0?Number((netProfit/TARGET*100).toFixed(2)):null,
      material_action_authorized:false
    };
  }
  function productProfitScore(input={}){
    const keys=["net_margin","conversion","freshness","stock_reliability","return_risk","customer_relevance"];
    if(keys.some(k=>num(input[k])===null))return {verified:false,status:"UNKNOWN_INCOMPLETE_SCORE_EVIDENCE",score:null};
    const score=
      clamp(input.net_margin,0,1)*0.30+
      clamp(input.conversion,0,1)*0.15+
      clamp(input.freshness,0,1)*0.15+
      clamp(input.stock_reliability,0,1)*0.15+
      (1-clamp(input.return_risk,0,1))*0.10+
      clamp(input.customer_relevance,0,1)*0.15;
    return {verified:true,status:"SCORED",score:Number((score*100).toFixed(2)),material_action_authorized:false};
  }
  function requiredOrdersForTarget(netProfitPerOrder){
    const n=num(netProfitPerOrder);
    if(n===null||n<=0)return null;
    return Math.ceil(TARGET/n);
  }
  window.BoomProfitEngine={version,targetNetProfitPerHourUsd:TARGET,evaluateHour,productProfitScore,requiredOrdersForTarget};
})();