(() => {
  const key = "hunt_deal_cart_v1";
  const functionsBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const publishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const $ = q => document.querySelector(q);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (value, currency="USD") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    try { return new Intl.NumberFormat("en", {style:"currency",currency}).format(Number(value)); }
    catch { return String(value); }
  };
  const read = () => {
    try {
      const raw=JSON.parse(localStorage.getItem(key)||"[]");
      return (Array.isArray(raw)?raw:[]).map(item=>{
        const verified=item?.retail_price_verified===true && item?.price_basis==="HUNT_RETAIL_PROFIT_GATE";
        const amount=verified && Number.isFinite(Number(item?.price_amount)) && Number(item.price_amount)>0
          ? Number(item.price_amount)
          : null;
        return {
          ...item,
          price_amount:amount,
          price_basis:amount!==null?"HUNT_RETAIL_PROFIT_GATE":"PRICE_PENDING",
          retail_price_verified:amount!==null,
          qty:Math.max(1,Math.min(5,Number(item?.qty)||1))
        };
      });
    } catch { return []; }
  };
  const write = cart => localStorage.setItem(key, JSON.stringify(cart));
  let checkoutTracked = false;
  let quoteVerified = false;
  const destinationKey = "hunt_destination_market_v1";

  function readShipping(country) {
    const value = id => String($(id)?.value || "").trim();
    const shipping = {
      shippingCustomerName:value("#hd-ship-name"),
      shippingAddress:value("#hd-ship-address"),
      shippingAddress2:value("#hd-ship-address2"),
      shippingCity:value("#hd-ship-city"),
      shippingProvince:value("#hd-ship-province"),
      shippingZip:value("#hd-ship-zip"),
      shippingPhone:value("#hd-ship-phone"),
      shippingCountryCode:String(country || "").toUpperCase()
    };
    const customerEmail=value("#hd-ship-email").toLowerCase();
    const required=[
      ["Full name",shipping.shippingCustomerName],
      ["Address",shipping.shippingAddress],
      ["City",shipping.shippingCity],
      ["Province / region",shipping.shippingProvince],
      ["Postal code",shipping.shippingZip],
      ["Phone",shipping.shippingPhone],
      ["Email",customerEmail]
    ];
    const missing=required.filter(([,v])=>!v).map(([label])=>label);
    if (missing.length) throw new Error("SHIPPING_ADDRESS_INCOMPLETE");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) throw new Error("CUSTOMER_EMAIL_INVALID");
    return {shipping,customer_email:customerEmail};
  }

  function rememberDestination(country) {
    try { localStorage.setItem(destinationKey, String(country || "").toUpperCase()); } catch {}
  }

  async function checkBundlePreview(cart, country) {
    const box = $("#hd-bundle-preview");
    const copy = $("#hd-bundle-preview-copy");
    if (!box || !copy) return;
    if (!Array.isArray(cart) || cart.length < 2) {
      box.hidden = true;
      return null;
    }
    const invalid = cart.find(item => !item?.provider || !item?.item_id || !item?.variant_id);
    if (invalid) {
      box.hidden = false;
      copy.textContent = "Choose a real option for every bundle item before BOOM can verify an offer.";
      return null;
    }
    box.hidden = false;
    copy.textContent = "BOOM is checking whether this bundle has a safe verified offer…";
    try {
      const res = await fetch(functionsBase + "/hunt-bundle-preview", {
        method:"POST",
        headers:{apikey:publishableKey,"content-type":"application/json"},
        body:JSON.stringify({
          country_code:String(country || "").toUpperCase(),
          items:cart.map(item=>({
            provider:item.provider,item_id:item.item_id,variant_id:item.variant_id,
            qty:Math.max(1,Math.min(5,Number(item.qty)||1))
          }))
        }),
        cache:"no-store"
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || data?.ok !== true) throw new Error(data?.error || "BUNDLE_CHECK_FAILED");
      if (data.offer_available === true) {
        copy.textContent = "Verified bundle preview: " + money(data.discount_amount, data.currency || "USD") + " potential offer. " + (data.application_enabled ? "It can be revalidated by checkout." : "Preview only until checkout discount application is activated.");
      } else if (data.offer_status === "OWNER_ACTIVATION_REQUIRED") {
        copy.textContent = "Bundle verified. No customer discount is active yet because the owner-approved bundle policy is not enabled.";
      } else {
        copy.textContent = data.message || "Bundle verified, but no safe offer is available right now.";
      }
      return data;
    } catch {
      copy.textContent = "BOOM could not verify a bundle offer right now. No discount was applied.";
      return null;
    }
  }

  function resetQuote(message="Verify price and shipping before payment.") {
    quoteVerified = false;
    if ($("#hd-checkout-shipping")) $("#hd-checkout-shipping").textContent = "PENDING";
    if ($("#hd-checkout-discount")) $("#hd-checkout-discount").textContent = "—";
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
      OUT_OF_STOCK:"One or more selected items are currently out of stock.",
      SHIPPING_UNAVAILABLE:"No verified shipping route is currently available for this destination.",
      SHIPPING_ADDRESS_INCOMPLETE:"Complete the shipping details before HUNT creates a checkout session.",
      CUSTOMER_EMAIL_INVALID:"Enter a valid email for order updates."
    };
    return messages[code] || "We could not verify this cart right now. No payment was attempted.";
  }

  async function verifyPriceAndShipping() {
    const button = $("#hd-checkout-verify");
    const status = $("#hd-checkout-status");
    const cart = read();
    const country = String($("#hd-checkout-market")?.value || "").toUpperCase();

    if (!cart.length) {
      resetQuote("Your cart is empty.");
      return;
    }
    const invalid = cart.find(item =>
      !item?.provider ||
      !item?.item_id ||
      !item?.variant_id ||
      item?.retail_price_verified !== true ||
      item?.price_basis !== "HUNT_RETAIL_PROFIT_GATE"
    );
    if (invalid) {
      resetQuote("One or more items need a fresh product/variant check before shipping can be quoted.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Verifying…";
    }
    if (status) status.textContent = "Rechecking HUNT retail price, supplier stock and shipping…";

    try {
      const shippingInput = readShipping(country);
      const bundlePreview = await checkBundlePreview(cart, country);
      const payload = {
        country_code: country,
        customer_email: shippingInput.customer_email,
        shipping: shippingInput.shipping,
        idempotency_key: `hunt-quote-${Date.now()}-${crypto.randomUUID()}`,
        checkout_offer_id: bundlePreview?.offer_id || null,
        items: cart.map(item => ({
          provider:item.provider,
          item_id:item.item_id,
          variant_id:item.variant_id,
          qty:Math.max(1,Math.min(5,Number(item.qty)||1))
        }))
      };
      const res = await fetch(functionsBase + "/hunt-payment-session", {
        method:"POST",
        headers:{
          apikey:publishableKey,
          "content-type":"application/json"
        },
        body:JSON.stringify(payload),
        cache:"no-store"
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || data?.ok !== true || !data?.session) {
        throw new Error(String(data?.error || "QUOTE_FAILED"));
      }

      const session = data.session;
      const currency = String(session.currency || "USD");
      $("#hd-checkout-subtotal").textContent = money(session.product_amount,currency);
      $("#hd-checkout-shipping").textContent = money(session.shipping_amount,currency);
      $("#hd-checkout-total").textContent = money(session.total_amount,currency);
      const discountAmount = Number(session.discount_amount || 0);
      $("#hd-checkout-discount").textContent = discountAmount > 0 ? "−" + money(discountAmount,currency) : (bundlePreview?.offer_available ? "PREVIEW" : "—");
      quoteVerified = true;
      rememberDestination(country);

      if (status) {
        status.textContent = data.payment_ready === true
          ? "Price and shipping verified. Payment account status is controlled separately."
          : "Price, stock and shipping verified. Payment is still disabled during pre-launch.";
      }
      window.HuntAnalytics?.checkoutQuoteVerified?.({
        country,
        currency,
        productAmount:Number(session.product_amount||0),
        shippingAmount:Number(session.shipping_amount||0),
        totalAmount:Number(session.total_amount||0)
      });
    } catch (err) {
      resetQuote(friendlyQuoteError(String(err?.message || "QUOTE_FAILED")));
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = quoteVerified ? "Recheck price & shipping" : "Verify price & shipping";
      }
    }
  }

  function render() {
    const cart = read();
    const host = $("#hd-checkout-items");
    const empty = $("#hd-checkout-empty");
    if (!host || !empty) return;
    empty.hidden = cart.length > 0;
    write(cart);
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
    const count = cart.reduce((sum,item)=>sum + Math.max(1,Number(item.qty)||1),0);
    document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=String(count));
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
      cart[index].qty = Math.max(1,Math.min(5,(Number(cart[index].qty)||1)+Number(event.target.dataset.delta||0)));
    } else return;
    write(cart);
    resetQuote("Cart changed. Recheck price and shipping.");
    render();
  });
  $("#hd-clear-cart")?.addEventListener("click",()=>{
    write([]);
    resetQuote("Your cart is empty.");
    render();
  });
  $("#hd-checkout-market")?.addEventListener("change", event => {
    const country = event.currentTarget.value || "";
    rememberDestination(country);
    resetQuote("Destination changed. Recheck price and shipping.");
    const bundleBox = $("#hd-bundle-preview");
    if (bundleBox) bundleBox.hidden = true;
    window.HuntAnalytics?.checkoutMarket(country);
  });
  $("#hd-checkout-verify")?.addEventListener("click",verifyPriceAndShipping);
  rememberDestination($("#hd-checkout-market")?.value || "");
  render();
})();
