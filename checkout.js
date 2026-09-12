(() => {
  const H = window.HuntCore;
  const key = "hunt_deal_cart_v1";
  const $ = q => document.querySelector(q);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (value, currency="USD") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    try { return new Intl.NumberFormat("en", {style:"currency",currency}).format(Number(value)); }
    catch { return String(value); }
  };
  const read = () => { try { const v=JSON.parse(localStorage.getItem(key)||"[]"); return Array.isArray(v)?v:[]; } catch { return []; } };
  const write = cart => localStorage.setItem(key, JSON.stringify(cart));
  const isCJ = item => String(item?.provider || "").toLowerCase().includes("cj");
  const verifiedRetail = item => {
    const amount = Number(item?.retail_price_amount);
    const currency = String(item?.retail_currency || item?.currency || "").toUpperCase();
    const verified = item?.retail_price_verified === true && item?.profit_gate_status === "PASS";
    return verified && Number.isFinite(amount) && amount >= 0 && /^[A-Z]{3}$/.test(currency)
      ? {amount,currency} : null;
  };
  let checkoutTracked = false;
  let quoteGeneration = 0;

  function pricingSnapshot(cart) {
    const rows = cart.map(item=>({item,retail:verifiedRetail(item)}));
    const allVerified = rows.length > 0 && rows.every(row=>row.retail);
    const currencies = new Set(rows.filter(row=>row.retail).map(row=>row.retail.currency));
    const subtotal = rows.reduce((sum,row)=>sum + (row.retail?.amount||0)*Math.max(1,Number(row.item.qty)||1),0);
    return {rows,allVerified,currencies,subtotal};
  }
  async function refreshShipping(cart, pricing) {
    const country = String($("#hd-checkout-market")?.value || "").toUpperCase();
    const shippingEl = $("#hd-checkout-shipping");
    const totalEl = $("#hd-checkout-total");
    const generation = ++quoteGeneration;
    if (!shippingEl || !totalEl) return;
    if (!cart.length) { shippingEl.textContent="—"; totalEl.textContent="—"; return; }
    if (!country) { shippingEl.textContent="SELECT COUNTRY"; totalEl.textContent="NOT SET"; return; }
    const countryBlocked = cart.filter(item => window.HuntCountry?.status?.(item,country)?.state === "blocked");
    if (countryBlocked.length) { shippingEl.textContent="ITEM NOT AVAILABLE"; totalEl.textContent="NOT SET"; return; }
    if (!pricing.allVerified || pricing.currencies.size !== 1) {
      shippingEl.textContent="PRICING GATE PENDING"; totalEl.textContent="NOT SET"; return;
    }
    const unsupported = cart.filter(item => !isCJ(item) || !item?.variant_id);
    if (unsupported.length) {
      shippingEl.textContent="SOME ITEMS PENDING";
      totalEl.textContent="NOT SET";
      return;
    }
    shippingEl.textContent="CHECKING…";
    totalEl.textContent="CHECKING…";
    const results = await Promise.all(cart.map(async item => {
      try {
        const quote = await H.cjQuote({
          vid:item.variant_id,
          country_code:country,
          quantity:Math.max(1,Math.min(5,Number(item.qty)||1))
        });
        const cheapest = Array.isArray(quote?.shipping_options) ? quote.shipping_options[0] : null;
        return {item,quote,cheapest};
      } catch (error) {
        return {item,error};
      }
    }));
    if (generation !== quoteGeneration) return;
    const allReady = results.length === cart.length && results.every(row =>
      row.quote?.stock_verified === true &&
      row.quote?.stock_available === true &&
      row.quote?.shipping_verified === true &&
      row.cheapest && Number.isFinite(Number(row.cheapest.price_usd))
    );
    if (!allReady) {
      shippingEl.textContent="QUOTE UNAVAILABLE";
      totalEl.textContent="NOT SET";
      return;
    }
    const shipping = results.reduce((sum,row)=>sum + Number(row.cheapest.price_usd||0),0);
    const currency = [...pricing.currencies][0];
    shippingEl.textContent = money(shipping,"USD");
    totalEl.textContent = currency === "USD" ? money(pricing.subtotal + shipping,"USD") : "CURRENCY REVIEW";
  }

  function render() {
    const cart = read();
    const host = $("#hd-checkout-items");
    const empty = $("#hd-checkout-empty");
    if (!host || !empty) return;
    empty.hidden = cart.length > 0;
    host.innerHTML = cart.map(item => {
      const retail = verifiedRetail(item);
      return `
      <article class="hd-checkout-item" data-key="${esc(item.key)}">
        ${item.image_url ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}">` : `<div class="hd-checkout-thumb">◇</div>`}
        <div class="hd-checkout-item-copy"><small>${esc(item.provider)}</small><h3>${esc(item.title)}</h3><p>${item.variant_label ? `Selected: ${esc(item.variant_label)} · ` : ""}${retail ? `HUNT price ${money(retail.amount,retail.currency)} · Profit Gate PASS` : "Retail pricing pending Profit Gate"}${isCJ(item) ? " · stock rechecked before cart" : ""}</p></div>
        <div class="hd-qty"><button type="button" data-delta="-1">−</button><span>${Math.max(1,Number(item.qty)||1)}</span><button type="button" data-delta="1">+</button></div>
        <button class="hd-remove" type="button" aria-label="Remove item">×</button>
      </article>`; }).join("");
    const pricing = pricingSnapshot(cart);
    $("#hd-checkout-subtotal").textContent = pricing.allVerified && pricing.currencies.size === 1
      ? money(pricing.subtotal,[...pricing.currencies][0])
      : "PRICING PENDING";
    const count = cart.reduce((sum,item)=>sum + Math.max(1,Number(item.qty)||1),0);
    document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=String(count));
    refreshShipping(cart, pricing);
    if (!checkoutTracked && cart.length) {
      checkoutTracked = true;
      window.HuntAnalytics?.beginCheckout(cart, $("#hd-checkout-market")?.value || "");
    }
  }
  document.addEventListener("click", event => {
    const row = event.target.closest?.(".hd-checkout-item");
    if (!row) return;
    const cart = read();
    const index = cart.findIndex(x => x.key === row.dataset.key);
    if (index < 0) return;
    if (event.target.matches(".hd-remove")) cart.splice(index,1);
    else if (event.target.matches("[data-delta]")) {
      const maxQty = isCJ(cart[index]) ? 5 : 20;
      cart[index].qty = Math.max(1,Math.min(maxQty,(Number(cart[index].qty)||1)+Number(event.target.dataset.delta||0)));
    } else return;
    write(cart); render();
  });
  $("#hd-clear-cart")?.addEventListener("click",()=>{ write([]); render(); });
  $("#hd-checkout-market")?.addEventListener("change", event => {
    window.HuntAnalytics?.checkoutMarket(event.currentTarget.value || "");
    render();
  });

  function paymentFingerprint(cart,country){
    return JSON.stringify({
      country,
      items:cart.map(item=>[item.provider,item.item_id,item.variant_id,Math.max(1,Number(item.qty)||1)])
    });
  }
  function paymentIdempotency(cart,country){
    const fingerprint=paymentFingerprint(cart,country);
    try{
      const saved=JSON.parse(sessionStorage.getItem("hunt_payment_attempt_v1")||"null");
      if(saved?.fingerprint===fingerprint&&saved?.key)return saved.key;
    }catch{}
    const key=crypto.randomUUID();
    sessionStorage.setItem("hunt_payment_attempt_v1",JSON.stringify({fingerprint,key}));
    return key;
  }
  async function validateSecureCheckout(){
    const button=$("#hd-checkout-pay");
    const status=$("#hd-checkout-pay-status");
    const cart=read();
    const country=String($("#hd-checkout-market")?.value||"").toUpperCase();
    if(!button||!status)return;
    if(!cart.length){ status.textContent="Your cart is empty."; return; }
    if(!country){ status.textContent="Choose a destination country first."; return; }
    if(cart.some(item=>!item.variant_id)){
      status.textContent="Every item needs a verified variant before secure checkout.";
      return;
    }
    button.disabled=true;
    button.textContent="Validating stock, shipping & price…";
    status.textContent="HUNT is rechecking the cart on the server. No payment is being collected.";
    try{
      const response=await fetch(H.functionsBase+"/hunt-payment-session",{
        method:"POST",
        headers:{apikey:H.publishableKey,"Content-Type":"application/json"},
        body:JSON.stringify({
          country_code:country,
          idempotency_key:paymentIdempotency(cart,country),
          items:cart.map(item=>({
            provider:item.provider,
            item_id:item.item_id,
            variant_id:item.variant_id,
            qty:Math.max(1,Number(item.qty)||1)
          }))
        })
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.ok!==true)throw new Error(data?.error||"Checkout validation failed");
      const session=data.session||{};
      if(Number.isFinite(Number(session.product_amount)))$("#hd-checkout-subtotal").textContent=money(session.product_amount,session.currency||"USD");
      if(Number.isFinite(Number(session.shipping_amount)))$("#hd-checkout-shipping").textContent=money(session.shipping_amount,session.currency||"USD");
      if(Number.isFinite(Number(session.total_amount)))$("#hd-checkout-total").textContent=money(session.total_amount,session.currency||"USD");

      if(data.payment_ready!==true){
        button.textContent="Payment account activation pending";
        status.textContent=`Server verified cart total ${money(session.total_amount,session.currency||"USD")}. Stock, destination shipping and retail price passed. Live payment remains disabled until the authorized merchant account is connected.`;
        return;
      }
      if(session.provider_redirect_url){
        status.textContent="Secure payment session ready. Redirecting…";
        location.href=session.provider_redirect_url;
        return;
      }
      button.textContent="Secure payment fields ready";
      status.textContent="PayPlus secure hosted fields are ready for this session. HUNT still needs the final hosted-fields UI activation before collecting payment.";
    }catch(error){
      button.textContent="Validate secure checkout";
      status.textContent=String(error?.message||"Checkout validation failed.");
    }finally{
      button.disabled=false;
    }
  }
  $("#hd-checkout-pay")?.addEventListener("click",validateSecureCheckout);
  render();
})();