(() => {
  const H=window.HuntCore, runtime=window.BoomRuntime;
  if(!H)return;
  const functionsBase = H.functionsBase;
  const publishableKey = H.publishableKey;
  const client = runtime?.getSupabaseClient?.() || null;
  const $ = q => document.querySelector(q);
  const esc = H.esc;
  const money = H.money;
  const read = () => H.cart();
  let checkoutTracked = false;
  let quoteVerified = false;

  function shippingState() {
    const country=String($("#hd-checkout-market")?.value||"").toUpperCase();
    const field=id=>String($(id)?.value||"").trim();
    const values={
      shippingCustomerName:field("#hd-ship-name").slice(0,80),
      shippingAddress:field("#hd-ship-address").slice(0,160),
      shippingAddress2:field("#hd-ship-address2").slice(0,160),
      shippingCity:field("#hd-ship-city").slice(0,80),
      shippingProvince:field("#hd-ship-province").slice(0,80),
      shippingZip:field("#hd-ship-zip").slice(0,20),
      shippingPhone:field("#hd-ship-phone").slice(0,30),
      shippingCountryCode:country
    };
    const email=field("#hd-ship-email").slice(0,254);
    const required=[["name",values.shippingCustomerName],["email",email],["address",values.shippingAddress],["city",values.shippingCity],["province",values.shippingProvince],["postal",values.shippingZip],["phone",values.shippingPhone],["country",values.shippingCountryCode]];
    const missing=required.filter(([,value])=>!value).map(([name])=>name);
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&!missing.includes("email"))missing.push("email");
    const hasAny=Boolean(email||Object.entries(values).some(([key,value])=>key!=="shippingCountryCode"&&value));
    return {country,email,snapshot:values,missing,complete:missing.length===0,hasAny};
  }

  function updateShippingStatus({emit=false}={}) {
    const state=shippingState();
    const status=$("#hd-shipping-status");
    if(status){
      status.textContent=state.complete
        ? "Delivery details are complete and will be attached only when checkout is verified."
        : state.hasAny
          ? state.missing.length+" required delivery field"+(state.missing.length===1?"":"s")+" still need attention."
          : "Add delivery details before an order can be handed to a supplier.";
    }
    if(emit)runtime?.emit?.("checkout.shipping.update",{complete:state.complete,missing_count:state.missing.length,country:state.country},{broadcast:false});
    return state;
  }

  function resetQuote(message="Verify price and shipping before payment.") {
    quoteVerified = false;
    if ($("#hd-checkout-shipping")) $("#hd-checkout-shipping").textContent = "PENDING";
    if ($("#hd-checkout-total")) $("#hd-checkout-total").textContent = "PRE-LAUNCH";
    if ($("#hd-checkout-status")) $("#hd-checkout-status").textContent = message;
  }

  function friendlyQuoteError(code) {
    const messages = {
      COUNTRY_REQUIRED:"Choose a destination country.",
      INVALID_CART:"Your cart needs to be refreshed.",
      INVALID_LINE_ITEM:"Open the product and choose an available option before checkout.",
      PROVIDER_PAYMENT_NOT_READY:"One or more products are catalog-only and cannot be quoted for HUNT checkout yet.",
      PRODUCT_RECHECK_FAILED:"A product could not be rechecked at the supplier. Please open it again before checkout.",
      VARIANT_RECHECK_FAILED:"The selected option is no longer available. Please choose another option.",
      RETAIL_PRICE_NOT_READY:"HUNT retail pricing is not verified for one or more items.",
      CURRENCY_REVIEW_REQUIRED:"This item needs a currency review before checkout.",
      SHIPPING_RECHECK_FAILED:"Shipping could not be rechecked right now.",
      INVALID_CUSTOMER_EMAIL:"Enter a valid email address for delivery updates.",
      SUPPLIER_COST_NOT_READY:"A product needs a fresh supplier-price check before checkout.",
      PROFIT_RECHECK_FAILED:"A product needs a fresh HUNT price check before checkout.",
      PROFIT_PROFILE_NOT_ACTIVE:"Checkout pricing is temporarily unavailable.",
      ECONOMICS_EVIDENCE_STORE_FAILED:"Checkout verification could not be recorded safely. No payment was attempted.",
      OUT_OF_STOCK:"One or more selected items are currently out of stock.",
      SHIPPING_UNAVAILABLE:"No verified shipping route is currently available for this destination."
    };
    return messages[code] || "We could not verify this cart right now. No payment was attempted.";
  }

  async function verifyPriceAndShipping() {
    const button = $("#hd-checkout-verify");
    const status = $("#hd-checkout-status");
    const cart = read();
    const country = String($("#hd-checkout-market")?.value || "").toUpperCase();
    const shipping=updateShippingStatus();

    if (!cart.length) {
      resetQuote("Your cart is empty.");
      return;
    }
    const invalid = cart.find(item =>
      !item?.provider || !item?.item_id || !item?.variant_id ||
      item?.retail_price_verified !== true || item?.price_basis !== "HUNT_RETAIL_PROFIT_GATE"
    );
    if (invalid) {
      resetQuote("One or more items need a fresh product/variant check before shipping can be quoted.");
      return;
    }

    if (status) status.textContent = "Rechecking HUNT retail price, supplier stock and shipping…";
    if (button) button.textContent = "Verifying…";
    const run=runtime?.runAction ? runtime.runAction.bind(runtime) : async (_id,opts)=>opts.execute({});

    try {
      const data=await run("checkout.quote.verify",{
        key:country+":"+cart.map(x=>x.key+"x"+x.qty).join("|"),
        element:button,
        broadcastSuccess:false,
        traceContext:{
          surface:"checkout",
          owner:"operations_brain",
          decision_owner:"commerce_truth_brain",
          endpoint:"hunt-payment-session",
          analytics:"checkoutQuoteVerified",
          learning:"evidence_refresh"
        },
        successDetail:result=>({
          country,
          items:cart.length,
          payment_ready:Boolean(result?.payment_ready),
          stock_evidence:"FRESH",
          shipping_evidence:"FRESH",
          shipping_attached:Boolean(result?.shipping_attached),
          commerce_truth:String(result?.session?.commerce_snapshot?.status||"UNKNOWN"),
          commerce_checked_at:String(result?.session?.commerce_snapshot?.checked_at||"")
        }),
        execute:async({correlationId}={})=>{
          const payload = {
            country_code: country,
            idempotency_key: correlationId || `hunt-quote-${Date.now()}-${crypto.randomUUID()}`,
            customer_email:shipping.email||null,
            shipping_snapshot:shipping.hasAny?shipping.snapshot:{},
            items: cart.map(item => ({
              provider:item.provider, item_id:item.item_id, variant_id:item.variant_id,
              qty:Math.max(1,Math.min(5,Number(item.qty)||1))
            }))
          };
          if (client?.functions?.invoke) {
            const {data,error}=await client.functions.invoke("hunt-payment-session",{body:payload});
            if(error||data?.ok!==true||!data?.session)throw new Error(String(data?.error||error?.message||"QUOTE_FAILED"));
            return data;
          }
          const res = await fetch(functionsBase + "/hunt-payment-session", {
            method:"POST",
            headers:{apikey:publishableKey,"content-type":"application/json"},
            body:JSON.stringify(payload), cache:"no-store"
          });
          const data = await res.json().catch(()=>({}));
          if (!res.ok || data?.ok !== true || !data?.session) throw new Error(String(data?.error || "QUOTE_FAILED"));
          return data;
        }
      });

      const session = data.session;
      const currency = String(session.currency || "USD");
      $("#hd-checkout-subtotal").textContent = money(session.product_amount,currency);
      $("#hd-checkout-shipping").textContent = money(session.shipping_amount,currency);
      $("#hd-checkout-total").textContent = money(session.total_amount,currency);
      quoteVerified = true;
      window.dispatchEvent(new CustomEvent("hunt:checkout-verified",{detail:{
        payment_session_id:String(session.id||""),
        idempotency_key:String(data.idempotency_key||""),
        commerce_status:String(session?.commerce_snapshot?.status||""),
        commerce_checked_at:String(session?.commerce_snapshot?.checked_at||"")
      }}));
      if (status) {
        const deliveryCopy=data.shipping_attached===true
          ? " Delivery details are attached to this checkout session."
          : " Add complete delivery details before supplier handoff.";
        status.textContent = data.payment_ready === true
          ? "Price, stock, shipping and checkout economics verified."+deliveryCopy+" Payment account status is controlled separately."
          : "Price, stock, shipping and checkout economics verified."+deliveryCopy+" Payment is still disabled during pre-launch.";
      }
      window.HuntAnalytics?.checkoutQuoteVerified?.({
        country,currency,productAmount:Number(session.product_amount||0),
        shippingAmount:Number(session.shipping_amount||0),totalAmount:Number(session.total_amount||0)
      });
    } catch (err) {
      resetQuote(friendlyQuoteError(String(err?.message || "QUOTE_FAILED")));
    } finally {
      if (button) button.textContent = quoteVerified ? "Recheck price & shipping" : "Verify price & shipping";
    }
  }

  function render() {
    const cart = read();
    const host = $("#hd-checkout-items");
    const empty = $("#hd-checkout-empty");
    if (!host || !empty) return;
    empty.hidden = cart.length > 0;
    host.innerHTML = cart.map(item => {
      const ready = item?.retail_price_verified === true && item?.price_basis === "HUNT_RETAIL_PROFIT_GATE" && Number(item?.price_amount) > 0;
      const priceCopy = ready
        ? `HUNT retail ${money(item.price_amount,item.currency||"USD")}`
        : "Price verification pending";
      return `
      <article class="hd-checkout-item" data-key="${esc(item.key)}">
        ${item.image_url ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}">` : `<div class="hd-checkout-thumb">◇</div>`}
        <div class="hd-checkout-item-copy"><small>${esc(item.provider)} · ${ready ? "HUNT RETAIL" : "PRICE PENDING"}</small><h3>${esc(item.title)}</h3><p>${item.variant_label ? `Selected: ${esc(item.variant_label)} · ` : ""}${priceCopy}</p></div>
        <div class="hd-qty"><button type="button" data-delta="-1">−</button><span>${Math.max(1,Number(item.qty)||1)}</span><button type="button" data-delta="1">+</button></div>
        <button class="hd-remove" type="button" aria-label="Remove item">×</button>
      </article>`;
    }).join("");
    const readyItems = cart.filter(x=>x?.retail_price_verified===true && x?.price_basis==="HUNT_RETAIL_PROFIT_GATE" && Number(x?.price_amount)>0);
    const pendingPrice = readyItems.length !== cart.length;
    const currencies = new Set(readyItems.map(x=>x.currency||"USD"));
    const subtotal = readyItems.reduce((sum,x)=>sum + Number(x.price_amount)*Math.max(1,Number(x.qty)||1),0);
    $("#hd-checkout-subtotal").textContent = pendingPrice
      ? "PRICE CHECK REQUIRED"
      : currencies.size === 1
        ? money(subtotal,[...currencies][0])
        : (currencies.size ? "MULTI-CURRENCY" : "—");
    H.updateCartBadges();
    if (!checkoutTracked && cart.length) {
      checkoutTracked = true;
      window.HuntAnalytics?.beginCheckout(cart, $("#hd-checkout-market")?.value || "");
    }
  }

  document.addEventListener("click", event => {
    const row = event.target.closest?.(".hd-checkout-item");
    if (!row) return;
    const cart = read();
    const current = cart.find(x => x.key === row.dataset.key);
    if (!current) return;
    if (event.target.matches(".hd-remove")) {
      H.removeCart(row.dataset.key);
    } else if (event.target.matches("[data-delta]")) {
      const nextQty=Math.max(1,Math.min(5,(Number(current.qty)||1)+Number(event.target.dataset.delta||0)));
      H.setCartQuantity(row.dataset.key,nextQty);
    }
  });
  $("#hd-clear-cart")?.addEventListener("click",()=>H.clearCart());
  $("#hd-checkout-market")?.addEventListener("change", event => {
    resetQuote("Destination changed. Recheck price and shipping.");
    updateShippingStatus({emit:true});
    window.HuntAnalytics?.checkoutMarket(event.currentTarget.value || "");
    runtime?.emit?.("checkout.destination.change",{country:String(event.currentTarget.value||"").toUpperCase()},{broadcast:false});
  });
  $("#hd-checkout-shipping-form")?.addEventListener("submit",event=>event.preventDefault());
  $("#hd-checkout-shipping-form")?.addEventListener("input",()=>{
    if(quoteVerified)resetQuote("Shipping details changed. Recheck before checkout.");
    updateShippingStatus();
  });
  $("#hd-checkout-shipping-form")?.addEventListener("change",()=>updateShippingStatus({emit:true}));
  $("#hd-checkout-verify")?.addEventListener("click",verifyPriceAndShipping);
  window.addEventListener("hunt:cart-changed",()=>{
    resetQuote(read().length?"Cart changed. Recheck price and shipping.":"Your cart is empty.");
    render();
  });

  render();
  updateShippingStatus();
})();
