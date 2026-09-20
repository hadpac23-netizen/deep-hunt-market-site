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
    if (url.includes("/functions/v1/hunt-payment-session")) {
      return Promise.resolve(json({ok:true,payment_ready:false,session:{
        currency:"USD",product_amount:7.99,shipping_amount:4.50,total_amount:12.49
      }}));
    }
    return nativeFetch(input, init);
  };
})();