(() => {
  "use strict";
  if(window.HuntCjRetailPriceGateV2?.version)return;
  const version="HUNT-CJ-RETAIL-PRICE-GATE-V2.1";
  function price(sourceCost,opts={}){
    const cost=Number(sourceCost);
    if(!Number.isFinite(cost)||cost<=0)return null;
    const minProfit=Math.max(0,Number(opts.min_profit_usd??4));
    const paymentReserve=Math.min(.15,Math.max(0,Number(opts.payment_reserve_rate??.04)));
    const refundReserve=Math.min(.20,Math.max(0,Number(opts.refund_reserve_rate??.05)));
    const targetMargin=Math.min(.75,Math.max(.10,Number(opts.target_product_margin??.35)));
    const reserve=Math.max(.50,1-paymentReserve-refundReserve);
    const contributionFloor=(cost+minProfit)/reserve;
    const marginDenominator=Math.max(.05,reserve-targetMargin);
    const marginFloor=cost/marginDenominator;
    const raw=Math.max(contributionFloor,marginFloor);
    const retail=Math.max(.99,Math.ceil(raw+.01)-.01);
    const projectedProfit=retail*reserve-cost;
    const projectedMargin=retail>0?projectedProfit/retail:0;
    return {
      retail_price_amount:Number(retail.toFixed(2)),
      retail_currency:"USD",
      retail_price_verified:true,
      profit_gate_status:projectedProfit>=minProfit&&projectedMargin>=targetMargin?"PASS":"REVIEW",
      projected_product_profit:Number(projectedProfit.toFixed(2)),
      projected_product_margin:Number(projectedMargin.toFixed(4)),
      shipping_priced_separately:true
    };
  }
  window.HuntCjRetailPriceGateV2={version,price};
})();