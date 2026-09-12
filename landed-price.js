(() => {
  const number = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const positive = value => {
    const n = number(value);
    return n !== null && n >= 0 ? n : null;
  };
  const currency = value => /^[A-Z]{3}$/.test(String(value || "").toUpperCase())
    ? String(value).toUpperCase() : null;

  function calculate(input = {}) {
    const blockers = [];
    const unknowns = [];
    const productCost = positive(input.product_cost);
    const shipping = positive(input.shipping_cost);
    const code = String(input.country_code || "").toUpperCase();
    const ccy = currency(input.currency);

    if (!(productCost > 0)) blockers.push("product_cost_missing");
    if (input.product_cost_verified !== true) blockers.push("product_cost_unverified");
    if (shipping === null) blockers.push("shipping_cost_missing");
    if (input.shipping_verified !== true) blockers.push("shipping_unverified");
    if (!/^[A-Z]{2}$/.test(code)) blockers.push("country_required");
    if (!ccy) blockers.push("currency_invalid");

    const supplierFee = positive(input.supplier_order_fee);
    const handlingFee = positive(input.handling_fee);
    const duty = positive(input.duty_estimate);
    const tax = positive(input.tax_estimate);

    if (supplierFee === null) unknowns.push("supplier_order_fee");
    if (handlingFee === null) unknowns.push("handling_fee");
    if (duty === null) unknowns.push("duty_estimate");
    if (tax === null) unknowns.push("tax_estimate");

    const knownCost = [productCost,shipping,supplierFee,handlingFee,duty,tax]
      .filter(v=>v!==null).reduce((sum,v)=>sum+v,0);

    const paymentRate = number(input.payment_fee_rate);
    const paymentFixed = positive(input.payment_fee_fixed);
    const targetMargin = number(input.target_margin_rate);
    if (paymentRate === null) unknowns.push("payment_fee_rate");
    if (paymentFixed === null) unknowns.push("payment_fee_fixed");
    if (targetMargin === null) unknowns.push("target_margin_rate");

    let suggestedRetail = null;
    let projectedProfit = null;
    const denominator = paymentRate !== null && targetMargin !== null
      ? 1 - paymentRate - targetMargin : null;
    const retailReady = blockers.length===0 && unknowns.length===0 && denominator > 0;

    if (retailReady) {
      suggestedRetail = (knownCost + paymentFixed) / denominator;
      const paymentCost = suggestedRetail * paymentRate + paymentFixed;
      projectedProfit = suggestedRetail - knownCost - paymentCost;
    }

    return {
      state: blockers.length ? "BLOCKED" : (retailReady ? "RETAIL_READY" : "COST_PARTIAL"),
      country_code:code || null,
      currency:ccy,
      known_landed_cost: blockers.length ? null : Number(knownCost.toFixed(2)),
      suggested_retail_price: suggestedRetail === null ? null : Number(suggestedRetail.toFixed(2)),
      projected_profit: projectedProfit === null ? null : Number(projectedProfit.toFixed(2)),
      blockers:[...new Set(blockers)],
      unknowns:[...new Set(unknowns)]
    };
  }

  function fromProduct(product = {}, options = {}) {
    const sameCountry = String(product.shipping_country || "").toUpperCase() === String(options.country_code || "").toUpperCase();
    return calculate({
      product_cost:product.price_amount,
      product_cost_verified:product.price_amount != null,
      shipping_cost:sameCountry ? product.shipping_amount : null,
      shipping_verified:product.shipping_verified === true && sameCountry,
      country_code:options.country_code,
      currency:product.currency,
      supplier_order_fee:options.supplier_order_fee,
      handling_fee:options.handling_fee,
      duty_estimate:options.duty_estimate,
      tax_estimate:options.tax_estimate,
      payment_fee_rate:options.payment_fee_rate,
      payment_fee_fixed:options.payment_fee_fixed,
      target_margin_rate:options.target_margin_rate
    });
  }

  const api={calculate,fromProduct};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(typeof window!=="undefined")window.HuntLandedPrice=api;
})();