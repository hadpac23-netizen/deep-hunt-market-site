(() => {
  const H = window.HuntCore;
  const params = new URLSearchParams(location.search);
  const requested = params.get("c") || "women";
  const slug = H.categoryDefs[requested] ? requested : "women";
  const def = H.categoryDefs[slug];
  let rawResults = [];
  let resultOrder = new Map();

  const $ = q => document.querySelector(q);
  const productKey = p => `${p.provider || ""}:${p.item_id || ""}`;

  function productCard(product) {
    const score = H.personalScore(product);
    const image = product.image_url?.startsWith("https://")
      ? `<img src="${H.esc(product.image_url)}" alt="${H.esc(product.title || "Product")}" loading="lazy">`
      : `<div class="hd-market-card-placeholder">◇</div>`;
    const badge = score > 0 ? `<span class="hd-market-for-you">FOR YOU</span>` : `<span class="hd-market-source">${H.esc(product.provider || "LIVE")}</span>`;
    const price = H.money(product.price_amount, product.currency || "USD");
    const productUrl = H.productUrl(product);
    return `<article class="hd-market-product-card" data-key="${H.esc(productKey(product))}" data-price="${Number(product.price_amount)||0}" data-score="${score}">
      <a class="hd-market-card-media" href="${H.esc(productUrl)}" data-product-view="${H.esc(productKey(product))}">${image}${badge}</a>
      <div class="hd-market-card-body">
        <small>${H.esc(product.provider || "Provider")} · ${H.esc(product.availability_verified ? "AVAILABLE" : "DISCOVERY")}</small>
        <a href="${H.esc(productUrl)}" class="hd-market-card-title" data-product-view="${H.esc(productKey(product))}">${H.esc(product.title || "Product")}</a>
        <div class="hd-market-card-price"><strong>${price}</strong><span>${H.esc(product.price_basis || "SOURCE PRICE")}</span></div>
        <p>${H.esc(score > 0 ? H.personalReason(product) : "Open the product to inspect images, variants and availability.")}</p>
        <a class="hd-btn hd-market-view" href="${H.esc(productUrl)}" data-product-view="${H.esc(productKey(product))}">View product →</a>
      </div>
    </article>`;
  }

  function renderCategories() {
    const entries = Object.entries(H.categoryDefs);
    const chips = entries.map(([key,value]) => `<a class="${key===slug?"active":""}" href="${H.categoryUrl(key)}">${value.icon} ${H.esc(value.title)}</a>`).join("");
    $("#hd-category-strip").innerHTML = chips;
    $("#hd-category-side-links").innerHTML = chips;
  }

  function filteredSorted() {
    const min = Number($("#hd-price-min").value || 0);
    const maxRaw = $("#hd-price-max").value.trim();
    const max = maxRaw ? Number(maxRaw) : Infinity;
    const sort = $("#hd-cat-sort").value;
    const items = rawResults.filter(p => {
      const price = Number(p.price_amount);
      return Number.isFinite(price) && price >= min && price <= max;
    });
    if (sort === "price-low") items.sort((a,b)=>(Number(a.price_amount)||Infinity)-(Number(b.price_amount)||Infinity));
    else if (sort === "price-high") items.sort((a,b)=>(Number(b.price_amount)||0)-(Number(a.price_amount)||0));
    else if (sort === "for-you") items.sort((a,b)=>H.personalScore(b)-H.personalScore(a) || (resultOrder.get(productKey(a))||0)-(resultOrder.get(productKey(b))||0));
    else items.sort((a,b)=>(resultOrder.get(productKey(a))||0)-(resultOrder.get(productKey(b))||0));
    return items;
  }

  function renderGrid() {
    const items = filteredSorted();
    $("#hd-cat-count").textContent = `${items.length} live products`;
    $("#hd-category-grid").innerHTML = items.map(productCard).join("");
    $("#hd-category-empty").hidden = items.length > 0;
  }

  async function load() {
    document.title = `${def.title} — HUNT DEAL`;
    $("#hd-cat-title").textContent = def.title;
    $("#hd-cat-breadcrumb").textContent = def.title;
    $("#hd-cat-copy").textContent = def.description;
    renderCategories();
    H.recordSignal(slug,"category");
    const score = Number(H.signals()[slug] || 0);
    $("#hd-boom-reason").textContent = score > 2 ? `This category has a ${score}-point local interest signal.` : "Learning locally from category visits, product views and cart actions.";
    H.updateCartBadges();

    const data = await H.search(def.query,24);
    rawResults = Array.isArray(data.results) ? data.results : [];
    resultOrder = new Map(rawResults.map((p,i)=>[productKey(p),i]));
    rawResults.forEach(p => { try { sessionStorage.setItem(`hunt_product_${productKey(p)}`, JSON.stringify(p)); } catch {} });
    const states = (data.providers || []).filter(x=>x.result_count || x.state === "SEARCHED").map(x=>`${x.provider}: ${x.result_count||0}`).join(" · ");
    $("#hd-cat-provider-state").textContent = states || "No connected provider returned a product for this category yet.";
    renderGrid();
  }

  $("#hd-cat-apply")?.addEventListener("click",renderGrid);
  $("#hd-cat-sort")?.addEventListener("change",renderGrid);
  document.addEventListener("click", event => {
    const link = event.target.closest?.("[data-product-view]");
    if (!link) return;
    const product = rawResults.find(p=>productKey(p)===link.dataset.productView);
    if (product) H.recordSignal(product,"view");
  });

  load().catch(err=>{
    $("#hd-cat-provider-state").textContent = err.message || "Category unavailable";
    $("#hd-category-empty").hidden = false;
  });
})();
