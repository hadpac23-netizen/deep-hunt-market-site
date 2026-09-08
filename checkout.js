(() => {
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

  function render() {
    const cart = read();
    const host = $("#hd-checkout-items");
    const empty = $("#hd-checkout-empty");
    if (!host || !empty) return;
    empty.hidden = cart.length > 0;
    host.innerHTML = cart.map(item => `
      <article class="hd-checkout-item" data-key="${esc(item.key)}">
        ${item.image_url ? `<img src="${esc(item.image_url)}" alt="${esc(item.title)}">` : `<div class="hd-checkout-thumb">◇</div>`}
        <div class="hd-checkout-item-copy"><small>${esc(item.provider)} · ${esc(item.price_basis || "SUPPLIER_BASE")}</small><h3>${esc(item.title)}</h3><p>${item.variant_label ? `Selected: ${esc(item.variant_label)} · ` : ""}Source cost ${money(item.price_amount,item.currency||"USD")} · not a retail price</p></div>
        <div class="hd-qty"><button type="button" data-delta="-1">−</button><span>${Math.max(1,Number(item.qty)||1)}</span><button type="button" data-delta="1">+</button></div>
        <button class="hd-remove" type="button" aria-label="Remove item">×</button>
      </article>`).join("");
    const currencies = new Set(cart.map(x=>x.currency||"USD"));
    const subtotal = cart.reduce((sum,x)=>sum + (Number(x.price_amount)||0)*Math.max(1,Number(x.qty)||1),0);
    $("#hd-checkout-subtotal").textContent = currencies.size === 1 ? money(subtotal,[...currencies][0]) : "MULTI-CURRENCY";
    const count = cart.reduce((sum,item)=>sum + Math.max(1,Number(item.qty)||1),0);
    document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=String(count));
  }

  document.addEventListener("click", event => {
    const row = event.target.closest?.(".hd-checkout-item");
    if (!row) return;
    const cart = read();
    const index = cart.findIndex(x => x.key === row.dataset.key);
    if (index < 0) return;
    if (event.target.matches(".hd-remove")) cart.splice(index,1);
    else if (event.target.matches("[data-delta]")) {
      cart[index].qty = Math.max(1,Math.min(20,(Number(cart[index].qty)||1)+Number(event.target.dataset.delta||0)));
    } else return;
    write(cart); render();
  });
  $("#hd-clear-cart")?.addEventListener("click",()=>{ write([]); render(); });
  render();
})();
