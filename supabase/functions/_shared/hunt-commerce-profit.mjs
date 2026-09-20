const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;

export function minimumSafeSalePricePerUnit(profile={},input={}){
  const qty=Math.max(1,Math.min(100,Math.floor(num(input.quantity,1))));
  const cost=Math.max(0,num(input.supplier_cost_per_unit,0));
  const customerShip=Math.max(0,num(input.customer_shipping_amount,0));
  const supplierShip=Math.max(0,num(input.supplier_shipping_cost,0));
  const paymentRate=Math.max(0,num(profile.payment_rate,.04));
  const refundRate=Math.max(0,num(profile.refund_reserve_rate,.05));
  const variableRate=Math.max(0,num(profile.platform_variable_rate,0));
  const fixed=Math.max(0,num(profile.platform_fixed_per_order,0));
  const minUnit=Math.max(0,num(profile.min_contribution_per_unit,4));
  const minMargin=Math.max(0,num(profile.min_margin_rate,.20));
  const variableTotal=paymentRate+refundRate+variableRate;
  const contributionDenominator=1-variableTotal;
  if(contributionDenominator<=0)return null;

  const supplierProduct=cost*qty;
  const shippingDrag=supplierShip-customerShip*contributionDenominator;
  const minContributionTotal=minUnit*qty;
  const contributionFloor=(minContributionTotal+supplierProduct+shippingDrag+fixed)/(qty*contributionDenominator);

  const marginDenominator=1-variableTotal-minMargin;
  const marginFloor=marginDenominator>0
    ? (supplierProduct+shippingDrag+fixed)/(qty*marginDenominator)
    : Number.POSITIVE_INFINITY;

  const raw=Math.max(0,contributionFloor,marginFloor);
  if(!Number.isFinite(raw))return null;
  const rounded=Math.max(.99,Math.ceil(raw+.01)-.01);
  return Number(rounded.toFixed(2));
}

export function evaluateCommerceProfit(profile={},input={}){
  const qty=Math.max(1,Math.min(100,Math.floor(num(input.quantity,1))));
  const sale=Math.max(0,num(input.sale_price_per_unit,0));
  const cost=Math.max(0,num(input.supplier_cost_per_unit,0));
  const customerShip=Math.max(0,num(input.customer_shipping_amount,0));
  const supplierShip=Math.max(0,num(input.supplier_shipping_cost,0));
  const paymentRate=Math.max(0,num(profile.payment_rate,.04));
  const refundRate=Math.max(0,num(profile.refund_reserve_rate,.05));
  const variableRate=Math.max(0,num(profile.platform_variable_rate,0));
  const fixed=Math.max(0,num(profile.platform_fixed_per_order,0));
  const minUnit=Math.max(0,num(profile.min_contribution_per_unit,4));
  const minMargin=Math.max(0,num(profile.min_margin_rate,.20));
  const maxCouponRate=Math.max(0,num(profile.max_coupon_rate,.30));
  const productRevenue=sale*qty;
  const totalRevenue=productRevenue+customerShip;
  const supplierProduct=cost*qty;
  const paymentReserve=totalRevenue*paymentRate;
  const refundReserve=totalRevenue*refundRate;
  const platformCost=totalRevenue*variableRate+fixed;
  const contribution=totalRevenue-supplierProduct-supplierShip-paymentReserve-refundReserve-platformCost;
  const contributionMargin=productRevenue>0?contribution/productRevenue:0;
  const minimum=minUnit*qty;
  const capacity=Math.max(0,contribution-minimum);
  const couponCap=Math.min(capacity,productRevenue*maxCouponRate);
  const maxCouponRateActual=productRevenue>0?couponCap/productRevenue:0;
  const maxCac=Math.max(0,capacity);
  const gate=contribution>=minimum&&contributionMargin>=minMargin?"PASS":contribution>0?"REVIEW":"BLOCK";
  return {
    quantity:qty,product_revenue:Number(productRevenue.toFixed(2)),
    total_customer_charge:Number(totalRevenue.toFixed(2)),
    supplier_product_cost:Number(supplierProduct.toFixed(2)),
    customer_shipping_amount:Number(customerShip.toFixed(2)),
    supplier_shipping_cost:Number(supplierShip.toFixed(2)),
    payment_reserve:Number(paymentReserve.toFixed(2)),
    refund_reserve:Number(refundReserve.toFixed(2)),
    platform_cost:Number(platformCost.toFixed(2)),
    contribution_before_coupon:Number(contribution.toFixed(2)),
    contribution_margin:Number(contributionMargin.toFixed(4)),
    min_required_contribution:Number(minimum.toFixed(2)),
    max_safe_coupon_amount:Number(couponCap.toFixed(2)),
    max_safe_coupon_rate:Number(maxCouponRateActual.toFixed(4)),
    max_safe_cac:Number(maxCac.toFixed(2)),
    profit_gate_status:gate
  };
}