(() => {
  window.__boomActionTrace=[];
  window.addEventListener("boom:action",event=>window.__boomActionTrace.push(event.detail));
  const nativeFetch = window.fetch.bind(window);
  const product = {
    provider: "CJdropshipping",
    item_id: "2410010236461621700",
    title: "HUNT E2E Verified CJ Product",
    image_url: "",
    gallery: [],
    category: "tops",
    description: "Deterministic browser E2E fixture; live supplier contract is verified separately.",
    retail_price_verified: true,
    profit_gate_status: "PASS",
    retail_price_amount: 7.99,
    retail_currency: "USD",
    quote_verification_status: "PASS",
    quote_verified_at: new Date().toISOString(),
    variants: [
      {variant_id:"E2E-BLK-S", color:"Black", size:"S"},
      {variant_id:"E2E-BLK-M", color:"Black", size:"M"}
    ]
  };
  const json = body => new Response(JSON.stringify(body), {
    status: 200,
    headers: {"content-type":"application/json"}
  });
  window.fetch = (input, init) => {
    const url = String(input?.url || input || "");
    if (url.includes("/functions/v1/hunt-storefront")) return Promise.resolve(json({product}));
    if (url.includes("/functions/v1/hunt-cj-quote")) {
      const parsed=new URL(url);
      const vid=parsed.searchParams.get("vid")||"";
      const quantity=Number(parsed.searchParams.get("quantity")||0);
      window.__boomLastStockQuote={vid,quantity};
      try{sessionStorage.setItem("__boomLastStockQuote",JSON.stringify({vid,quantity}));}catch{}
      const known=["E2E-BLK-S","E2E-BLK-M"].includes(vid);
      return Promise.resolve(json({
        stock_verified:true,
        stock_available:known&&quantity>0,
        vid,
        quantity
      }));
    }
    if (url.includes("/functions/v1/hunt-payment-session")) {
      let request={};
      try{request=JSON.parse(String(init?.body||"{}"));}catch{}
      const ship=request?.shipping_snapshot||{};
      const shippingAttached=Boolean(request?.customer_email&&ship.shippingCustomerName&&ship.shippingAddress&&ship.shippingCity&&ship.shippingProvince&&ship.shippingZip&&ship.shippingPhone&&ship.shippingCountryCode);
      window.__boomLastPaymentRequest=request;
      return Promise.resolve(json({ok:true,payment_ready:false,shipping_attached:shippingAttached,session:{
        currency:"USD",product_amount:7.99,shipping_amount:4.50,total_amount:12.49,
        commerce_snapshot:{
          version:"HUNT-COMMERCE-TRUTH-V1",
          status:"PASS",
          decision_owner:"commerce_truth_brain",
          execution_owner:"operations_brain",
          checked_at:new Date().toISOString(),
          total_contribution_before_coupon:4.04
        }
      }}));
    }
    return nativeFetch(input, init);
  };
})();