(() => {
  let dict = HuntI18n.start("deal");
  let allDeals = [];
  let activeCategory = "all";
  let providerCheckout = {};
  let checkoutPolicy = {mode:"ONSITE_FIRST", public_checkout_enabled:false};
  let catalogItems = [];
  let searchItems = [];
  const cartKey = "hunt_deal_cart_v1";

  const $ = q => document.querySelector(q);
  const isStaticPublicHost = location.hostname.endsWith(".github.io");
  const supabaseFunctionsBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const supabasePublishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const publicApiUrl = name => isStaticPublicHost
    ? supabaseFunctionsBase + "/" + name
    : (name === "hunt-storefront" ? "/api/storefront" : "/api/deals/hunt");
  const publicApiHeaders = extra => ({
    ...(isStaticPublicHost ? {"apikey": supabasePublishableKey} : {}),
    ...(extra || {})
  });
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (value, currency="USD") => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    try { return new Intl.NumberFormat(document.documentElement.lang || "en", {style:"currency",currency}).format(Number(value)); }
    catch { return String(value); }
  };

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(cartKey) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }

  function updateCartCount() {
    const count = readCart().reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
    const badge = $("#hd-cart-count");
    if (badge) badge.textContent = String(count);
    document.querySelectorAll("[data-cart-count]").forEach(el => el.textContent = String(count));
  }

  function addToCart(item) {
    if (!item || !item.item_id || !item.provider) return;
    const cart = readCart();
    const key = String(item.provider) + ":" + String(item.item_id);
    const existing = cart.find(row => row.key === key);
    if (existing) existing.qty = Math.min(20, (Number(existing.qty) || 1) + 1);
    else cart.push({
      key,
      provider: String(item.provider),
      item_id: String(item.item_id),
      title: String(item.title || "Product"),
      image_url: typeof item.image_url === "string" ? item.image_url : null,
      price_amount: item.price_amount == null ? null : Number(item.price_amount),
      currency: String(item.currency || "USD"),
      price_basis: String(item.price_basis || "SUPPLIER_BASE"),
      qty: 1
    });
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartCount();
    location.href = "checkout.html";
  }

  function categoryFor(deal) {
    const title = String(deal?.title || deal?.evaluation?.candidate?.title || "").toLowerCase();
    if (/(perfume|fragrance|beauty|skincare|makeup|cosmetic|hair care|serum|cream)/.test(title)) return "beauty";
    if (/(jewelry|jewellery|necklace|bracelet|earring|ring|handbag|purse|wallet|belt|sunglass|accessor)/.test(title)) return "accessories";
    if (/(shoe|shirt|dress|watch|bag|fashion|jacket|sneaker|clothing|apparel|top|skirt)/.test(title)) return "fashion";
    if (/(travel|luggage|carry|suitcase|adapter|passport)/.test(title)) return "travel";
    if (/(home|kitchen|vacuum|fryer|lamp|chair|bed|coffee|decor|rug)/.test(title)) return "home";
    return "tech";
  }

  function glyphFor(provider) {
    const p = String(provider || "").toLowerCase();
    if (p.includes("amazon")) return "a";
    if (p.includes("ebay")) return "e";
    if (p.includes("walmart")) return "✦";
    if (p.includes("etsy")) return "E";
    if (p.includes("temu")) return "T";
    if (p.includes("shein")) return "S";
    return "◇";
  }

  function candidateOf(deal) {
    return deal.evaluation?.candidate || deal.candidate || deal;
  }

  function renderCard(deal) {
    const c = candidateOf(deal);
    const e = deal.evaluation || {};
    const m = deal.metrics || {};
    const verdict = String(deal.verdict || e.verdict || "TEST").toUpperCase();
    const category = categoryFor(deal);
    const verified = (e.verified_signals || deal.verified_signals || []).slice(0,2).join(" · ");
    const gaps = (e.gaps || deal.gaps || []).slice(0,1).join(" · ");
    const checkout = providerCheckout[c.provider] || {};
    const canCheckoutHere = checkoutPolicy.public_checkout_enabled === true
      && checkout.mode === "ONSITE_CAPABLE"
      && Boolean(deal.id)
      && !isStaticPublicHost;
    const previewCart = c.merchant_product === true && Boolean(c.item_id) && Boolean(c.provider);
    const productHref = previewCart && window.HuntCore ? window.HuntCore.productUrl(c) : "";
    const cta = canCheckoutHere
      ? `<a class="hd-retailer" href="/checkout/${encodeURIComponent(deal.id)}">${esc(dict.onsiteCheckout || "Buy on HUNT DEAL")} →</a>`
      : previewCart
        ? `<a class="hd-retailer" href="${esc(productHref)}">View product / choose options →</a>`
        : `<button class="hd-retailer" type="button" disabled title="${esc(checkout.note || checkoutPolicy.rule || "")}">${esc(dict.onsitePending || "On-site checkout pending")}</button>`;
    const productVisual = typeof c.image_url === "string" && c.image_url.startsWith("https://")
      ? `<div class="hd-product-visual has-image"><img src="${esc(c.image_url)}" alt="${esc(c.title || "Product")}" loading="lazy"></div>`
      : `<div class="hd-product-visual" aria-hidden="true">${esc(glyphFor(c.provider))}</div>`;
    return `
      <article class="hd-deal-card" data-category="${category}" data-search="${esc((c.title||"")+" "+(c.provider||""))}">
        <div class="hd-deal-top"><span class="hd-verdict ${verdict==="SELL"?"sell":""}">${esc(verdict)}</span><span class="hd-heart">♡</span></div>
        ${productVisual}
        <h3>${esc(c.title || "Verified product")}</h3>
        <div class="hd-price">${money(c.price_amount,c.currency||"USD")}</div>
        <div class="hd-provider">${esc(c.provider || "Provider")} · ${m.outbound_clicks||0} clicks · ${m.conversions||0} conversions</div>
        <div class="hd-why"><b>${esc(dict.why || "Why this deal?")}</b>${esc(verified || "Evidence review passed the minimum public gate.")}</div>
        <div class="hd-red-note">● ${esc(dict.redTeam || "Red Team note")}: ${esc(gaps || "No recorded evidence gap.")}</div>
        ${cta}
      </article>`;
  }

  function applyFilters() {
    const query = ($("#hd-search-input")?.value || "").trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll(".hd-deal-card").forEach(card => {
      const categoryOk = activeCategory === "all" || card.dataset.category === activeCategory;
      const searchOk = !query || (card.dataset.search || "").toLowerCase().includes(query);
      const show = categoryOk && searchOk;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (allDeals.length) $("#hd-empty").hidden = visible > 0;
  }

  function renderDeals(deals) {
    allDeals = (deals || []).filter(deal => {
      if (!isStaticPublicHost) return true;
      const c = candidateOf(deal);
      return typeof c.affiliate_url === "string" && c.affiliate_url.startsWith("https://");
    });
    const grid = $("#hd-deal-grid");
    if (!grid) return;
    grid.innerHTML = allDeals.map(renderCard).join("");
    $("#hd-empty").hidden = allDeals.length > 0;
    applyFilters();
  }


  function renderCatalog(products) {
    const grid = $("#hd-catalog-grid");
    const count = $("#hd-catalog-count");
    if (!grid || !count) return;
    const items = Array.isArray(products) ? products : [];
    catalogItems = items;
    count.textContent = items.length ? items.length + " LIVE" : "WAITING";
    grid.innerHTML = items.map(item => {
      const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
        ? `<img class="hd-catalog-image" src="${esc(item.image_url)}" alt="${esc(item.title || "Catalog product")}" loading="lazy">`
        : '<div class="hd-catalog-image hd-catalog-placeholder">◇</div>';
      const base = item.price_amount == null ? "—" : money(item.price_amount, item.currency || "USD");
      const gaps = (item.gaps || []).slice(0,2).map(x => `<li>${esc(x)}</li>`).join("");
      const detailUrl = window.HuntCore ? window.HuntCore.productUrl(item) : `product.html?provider=${encodeURIComponent(item.provider || "Printful")}&id=${encodeURIComponent(item.item_id || "")}`;
      return `
        <article class="hd-catalog-card glass">
          <div class="hd-catalog-media">${image}<span class="hd-catalog-badge">${esc(item.verdict || "CATALOG")}</span></div>
          <div class="hd-catalog-body">
            <div class="hd-provider">${esc(item.provider || "Provider")} · VERIFIED SOURCE</div>
            <h3><a class="hd-catalog-title-link" href="${esc(detailUrl)}">${esc(item.title || "Catalog product")}</a></h3>
            <div class="hd-catalog-price"><small>${esc(dict.catalogBase || "Supplier base")}</small><strong>${base}</strong></div>
            <ul class="hd-catalog-gaps">${gaps}</ul>
            <a class="hd-retailer" href="${esc(detailUrl)}">View product / choose options →</a>
          </div>
        </article>`;
    }).join("");
  }

  function renderAdvisor(data) {
    const deals = data.deals || [];
    const top = [...deals].sort((a,b)=>(b.readiness_score||0)-(a.readiness_score||0))[0];
    const candidate = top ? candidateOf(top) : null;
    const topTest = deals.find(d => String(d.verdict).toUpperCase()==="TEST") || top;
    const testCandidate = topTest ? candidateOf(topTest) : null;

    if (candidate) {
      $("#hd-best-title").textContent = candidate.title || dict.noBest;
      $("#hd-best-copy").textContent = [candidate.provider, money(candidate.price_amount,candidate.currency||"USD")].filter(Boolean).join(" · ");
      $("#hd-best-status").textContent = String(top.verdict || "TEST").toUpperCase();
    }
    if (testCandidate) {
      $("#hd-test-title").textContent = testCandidate.title || dict.noWorth;
      $("#hd-test-copy").textContent = (topTest.evaluation?.gaps || []).slice(0,1).join("") || "Evidence gate passed; conversion evidence still needed.";
    }
    const confidence = top ? Math.max(0,Math.min(100,Number(top.readiness_score||0))) : 0;
    $("#hd-confidence-number").textContent = confidence + "%";
    document.querySelector(".hd-ring")?.style.setProperty("background",
      `conic-gradient(#4bf5a1 0 ${confidence*.3}%,#5fa8ff ${confidence*.3}% ${confidence*.65}%,#8071ff ${confidence*.65}% ${confidence}%,#10263f ${confidence}% 100%)`);
  }

  function renderMetrics(data) {
    const commerce = data.commerce || {};
    $("#hd-provider-count").textContent = (data.providers || []).length;
    $("#hd-qualified-count").textContent = commerce.public_test_sell_count || 0;
    $("#hd-click-count").textContent = commerce.outbound_clicks || 0;
    $("#hd-commission").textContent = money(commerce.net_confirmed_commission_usd || 0);
  }

  const shelfMeta = {
    women: ["Women's Fashion", "women"],
    men: ["Men's Fashion", "men"],
    dresses: ["Dresses & Skirts", "dresses"],
    tops: ["Tops & T-Shirts", "tops"],
    hoodies: ["Hoodies & Sweatshirts", "hoodies"],
    jackets: ["Jackets & Outerwear", "jackets"],
    activewear: ["Activewear", "activewear"],
    bags: ["Bags & Totes", "bags"],
    shoes: ["Shoes", "shoes"],
    accessories: ["Accessories", "accessories"],
    travel: ["Travel Picks", "travel"],
    home: ["Home Finds", "home"],
    tech: ["Phone & Tech", "tech"],
    gifts: ["Gift Ideas", "gifts"],
    kids: ["Kids & Youth", "kids"],
    hats: ["Hats & Caps", "hats"],
    drinkware: ["Drinkware", "drinkware"],
    wallart: ["Wall Art", "wallart"],
    blankets: ["Blankets & Towels", "blankets"],
    stickers: ["Stickers", "stickers"],
    stationery: ["Stationery", "stationery"],
    pets: ["Pets", "pets"],
    socks: ["Socks", "socks"],
    swimwear: ["Swimwear", "swimwear"],
    office: ["Office & Desk", "office"],
    pillows: ["Pillows", "pillows"],
    ornaments: ["Ornaments", "ornaments"],
  };

  const shelfDepartments = [
    ["Fashion", ["women","men","dresses","tops","hoodies","jackets","activewear","swimwear","socks"]],
    ["Accessories", ["bags","shoes","hats","accessories"]],
    ["Home & Lifestyle", ["home","pillows","blankets","wallart","drinkware","travel","tech"]],
    ["Kids & Pets", ["kids","pets"]],
    ["Gifts & Office", ["gifts","ornaments","stickers","stationery","office"]],
  ];

  function shelfCard(item) {
    const detailUrl = window.HuntCore
      ? window.HuntCore.productUrl(item)
      : `product.html?provider=${encodeURIComponent(item.provider || "Printful")}&id=${encodeURIComponent(item.item_id || "")}`;
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.title || "Product")}" loading="lazy">`
      : '<div class="hd-shelf-placeholder">◇</div>';
    return `<article class="hd-shelf-card">
      <a class="hd-shelf-media" href="${esc(detailUrl)}">${image}<span>VERIFIED SOURCE</span></a>
      <div class="hd-shelf-card-body">
        <small>${esc(item.provider || "Provider")}</small>
        <a class="hd-shelf-title" href="${esc(detailUrl)}">${esc(item.title || "Product")}</a>
        <p>Open for source price, sizes, colors and availability.</p>
        <a class="hd-shelf-open" href="${esc(detailUrl)}">View product →</a>
      </div>
    </article>`;
  }

  function renderLowSourceShelf(products) {
    const root = $("#hd-shelves-root");
    if (!root) return;
    const low = (Array.isArray(products) ? products : [])
      .filter(item => Number.isFinite(Number(item.price_amount)) && Number(item.price_amount) > 0)
      .sort((a,b)=>Number(a.price_amount)-Number(b.price_amount))
      .slice(0,6);
    if (!low.length) return;
    const cards = low.map(item => {
      const detailUrl = window.HuntCore ? window.HuntCore.productUrl(item) : `product.html?provider=Printful&id=${encodeURIComponent(item.item_id || "")}`;
      const image = item.image_url?.startsWith("https://") ? `<img src="${esc(item.image_url)}" alt="${esc(item.title || "Product")}" loading="lazy">` : '<div class="hd-shelf-placeholder">◇</div>';
      return `<article class="hd-shelf-card low-cost"><a class="hd-shelf-media" href="${esc(detailUrl)}">${image}<span>LOW SOURCE COST</span></a><div class="hd-shelf-card-body"><small>${esc(item.provider || "Printful")}</small><a class="hd-shelf-title" href="${esc(detailUrl)}">${esc(item.title || "Product")}</a><div class="hd-shelf-source-price"><b>${money(item.price_amount,item.currency||"USD")}</b><em>supplier base</em></div><a class="hd-shelf-open" href="${esc(detailUrl)}">View product →</a></div></article>`;
    }).join("");
    const section = document.createElement("section");
    section.className = "hd-market-shelf low-source";
    section.innerHTML = `<div class="hd-market-shelf-head"><div><small>VALUE FIRST</small><h3>Low source cost picks</h3><p>Lowest verified supplier-base costs from the connected live catalog. Not final retail prices.</p></div><a href="#catalog">See live catalog →</a></div><div class="hd-shelf-track">${cards}</div>`;
    root.prepend(section);
  }

  async function loadMarketShelves() {
    const root = $("#hd-shelves-root");
    const counter = $("#hd-shelf-count");
    if (!root || !counter) return;
    try {
      const res = await fetch(publicApiUrl("hunt-storefront") + "?shelves=1", {
        cache:"no-store",
        headers: publicApiHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Market shelves unavailable");
      const shelves = data.shelves || {};
      const html = shelfDepartments.map(([department, slugs]) => {
        const sections = slugs.map(slug => {
          const meta = shelfMeta[slug];
          const items = Array.isArray(shelves[slug]) ? shelves[slug] : [];
          if (!meta || !items.length) return "";
          const cards = items.map(shelfCard).join("");
          const categoryHref = window.HuntCore ? window.HuntCore.categoryUrl(meta[1]) : `category.html?c=${encodeURIComponent(meta[1])}`;
          return `<section class="hd-market-shelf"><div class="hd-market-shelf-head"><div><small>LIVE CATEGORY</small><h3>${esc(meta[0])}</h3><p>${items.length} real catalog products ready to inspect.</p></div><a href="${esc(categoryHref)}">View all →</a></div><div class="hd-shelf-track">${cards}</div></section>`;
        }).filter(Boolean).join("");
        if (!sections) return "";
        return `<section class="hd-shelf-department"><div class="hd-shelf-department-head"><span>DEPARTMENT</span><h2>${esc(department)}</h2></div>${sections}</section>`;
      }).join("");
      root.innerHTML = html || '<div class="hd-shelf-loading glass">No live shelves yet.</div>';
      counter.textContent = `${Number(data.visible_product_count || 0)} LIVE`;
      renderLowSourceShelf(catalogItems);
    } catch (err) {
      root.innerHTML = `<div class="hd-shelf-loading glass">${esc(err.message || "Market shelves unavailable")}</div>`;
      counter.textContent = "WAITING";
    }
  }

  function renderProviderNetwork(providers) {
    const host = $("#hd-provider-badges");
    if (!host) return;
    const items = Array.isArray(providers) ? providers : [];
    host.innerHTML = items.map(item => {
      const state = String(item.state || "UNKNOWN").toUpperCase();
      const tone = /READY|LIVE|CONFIGURED|CATALOG_LIVE/.test(state)
        ? "ready"
        : /AUTH_REQUIRED|APPROVAL_REQUIRED|MANUAL_PROGRAM|VERIFYING/.test(state)
          ? "waiting"
          : "neutral";
      return `<span class="hd-provider-pill ${tone}"><b>${esc(item.provider || "Provider")}</b><small>${esc(state.replaceAll("_", " "))}</small></span>`;
    }).join("") || "<span>No provider state yet.</span>";
  }

  async function load() {
    const res = await fetch(publicApiUrl("hunt-storefront"),{
      cache:"no-store",
      headers: publicApiHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Storefront unavailable");
    providerCheckout = data.provider_checkout || {};
    checkoutPolicy = data.checkout || checkoutPolicy;
    renderMetrics(data);
    renderProviderNetwork(data.providers || []);
    renderCatalog(data.merchant_products || []);
    if (!(data.deals || []).length && (data.merchant_products || []).length) {
      $("#hd-test-title").textContent = dict.liveCatalogConnected || "Live merchant catalog connected";
      $("#hd-test-copy").textContent = (data.merchant_products || []).length + " catalog products available for validation.";
    }
    renderAdvisor(data);
    renderDeals(data.deals || []);
  }

  function renderLiveSearch(data) {
    const section = $("#live-search");
    const grid = $("#hd-search-grid");
    const status = $("#hd-live-search-status");
    if (!section || !grid || !status) return;
    const results = data.results || [];
    searchItems = results;
    const states = (data.providers || []).map(p => {
      const count = p.result_count ? " (" + p.result_count + ")" : "";
      return p.provider + ": " + p.state + count;
    }).join(" · ");
    section.hidden = false;
    status.textContent = results.length
      ? results.length + " discovery results · " + states
      : (states || (dict.searchNoResults || "No live results yet."));
    grid.innerHTML = results.map(renderCard).join("");
    if (results.length) renderAdvisor({deals: results});
  }

  async function runLiveSearch(query) {
    const clean = String(query || "").trim();
    if (!clean) return;
    const section = $("#live-search");
    const status = $("#hd-live-search-status");
    if (section) section.hidden = false;
    if (status) status.textContent = dict.searching || "Searching ready providers…";
    try {
      const res = await fetch(publicApiUrl("hunt-deals-hunt"), {
        method: "POST",
        headers: publicApiHeaders({"Content-Type":"application/json"}),
        body: JSON.stringify({query: clean, limit: 12})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Live search unavailable");
      window.HuntAnalytics?.search({
        category: window.HuntCore?.slugFromQuery(clean) || "unknown",
        resultCount: Array.isArray(data.results) ? data.results.length : 0
      });
      renderLiveSearch(data);
    } catch (err) {
      if (status) status.textContent = err.message || "Live search unavailable";
      const grid = $("#hd-search-grid");
      if (grid) grid.innerHTML = "";
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest?.(".hd-cart-add");
    if (!button) return;
    const item = [...catalogItems, ...searchItems].find(row => String(row.provider) === String(button.dataset.cartProvider) && String(row.item_id) === String(button.dataset.cartId));
    if (item) addToCart(item);
  });

  document.querySelectorAll("[data-hunt-query]").forEach(btn => {
    btn.addEventListener("click", () => {
      const query = String(btn.dataset.huntQuery || "").trim();
      if (!query) return;
      const slug = window.HuntCore ? window.HuntCore.slugFromQuery(query) : "women";
      window.HuntCore?.recordSignal(slug, "category");
      location.href = window.HuntCore ? window.HuntCore.categoryUrl(slug) : `category.html?c=${encodeURIComponent(slug)}`;
    });
  });

  document.querySelectorAll(".hd-filter-row button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".hd-filter-row button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category || "all";
      applyFilters();
    });
  });
  $("#hd-search-input")?.addEventListener("input", applyFilters);
  $("#hd-search-input")?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runLiveSearch(event.currentTarget.value);
  });

  window.addEventListener("hunt:language", e => {
    dict = e.detail.dict;
    if (allDeals.length) renderDeals(allDeals);
  });

  updateCartCount();
  loadMarketShelves();

  load().then(() => {
    const root = $("#hd-shelves-root");
    if (root && !root.querySelector(".hd-market-shelf.low-source")) renderLowSourceShelf(catalogItems);
  }).catch(err => {
    const empty = $("#hd-empty");
    if (empty) { empty.hidden = false; empty.querySelector("p").textContent = err.message; }
  });
})();