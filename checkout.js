(() => {
  const key = "hunt_deal_cart_v1";
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
    write(cart); render();
  });
  $("#hd-clear-cart")?.addEventListener("click",()=>{ write([]); render(); });
  $("#hd-checkout-market")?.addEventListener("change", event => {
    window.HuntAnalytics?.checkoutMarket(event.currentTarget.value || "");
  });
  render();
})();
