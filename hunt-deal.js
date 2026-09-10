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
  const isLocalPreview = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  const isGitHubPublicHost = location.hostname.endsWith(".github.io");
  const isStaticPublicHost = isGitHubPublicHost || isLocalPreview;
  const supabaseFunctionsBase = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const supabasePublishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const publicApiUrl = name => isLocalPreview
    ? location.origin + "/functions/v1/" + name
    : isGitHubPublicHost
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
    location.href = window.HuntLightPreview?.rewrite?.("checkout.html") || "checkout.html";
  }

  function categoryFor(deal) {
    const title = String(deal?.title || deal?.evaluation?.candidate?.title || "").toLowerCase();
    if (/(perfume|fragrance)/.test(title)) return "perfume";
    if (/(beauty|skincare|makeup|cosmetic|hair care|serum|cream)/.test(title)) return "beauty";
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
        <div class="hd-deal-top"><span class="hd-verdict ${verdict==="SELL"?"sell":""}">${esc(verdict)}</span></div>
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
    bottoms: ["Bottoms", "bottoms"],
    hoodies: ["Hoodies & Sweatshirts", "hoodies"],
    knitwear: ["Knitwear", "knitwear"],
    jackets: ["Jackets & Outerwear", "jackets"],
    activewear: ["Activewear", "activewear"],
    bags: ["Bags & Totes", "bags"],
    shoes: ["Shoes", "shoes"],
    accessories: ["Accessories", "accessories"],
    travel: ["Travel Picks", "travel"],
    home: ["Home Finds", "home"],
    storage: ["Storage & Organization", "storage"],
    bedding: ["Bedding", "bedding"],
    cleaning: ["Cleaning & Laundry", "cleaning"],
    tech: ["Phone & Tech", "tech"],
    phoneaccessories: ["Phone Accessories", "phoneaccessories"],
    gaming: ["Gaming Accessories", "gaming"],
    sports: ["Sports & Fitness", "sports"],
    outdoors: ["Outdoor & Garden", "outdoors"],
    beauty: ["Beauty & Skincare", "beauty"],
    perfume: ["Perfume & Fragrance", "perfume"],
    jewelry: ["Jewelry", "jewelry"],
    kitchen: ["Kitchen", "kitchen"],
    toys: ["Toys & Play", "toys"],
    crafts: ["Arts & Crafts", "crafts"],
    party: ["Party & Celebration", "party"],
    lighting: ["Lighting", "lighting"],
    bath: ["Bath & Bathroom", "bath"],
    gifts: ["Gift Ideas", "gifts"],
    kids: ["Kids & Youth", "kids"],
    hats: ["Hats & Caps", "hats"],
    drinkware: ["Drinkware", "drinkware"],
    wallart: ["Wall Art", "wallart"],
    blankets: ["Blankets & Towels", "blankets"],
    stickers: ["Stickers", "stickers"],
    stationery: ["Stationery", "stationery"],
    pets: ["Pets", "pets"],
    suits: ["Suits & Formalwear", "suits"],
    underwear: ["Underwear & Essentials", "underwear"],
    socks: ["Socks", "socks"],
    swimwear: ["Swimwear", "swimwear"],
    office: ["Office & Desk", "office"],
    pillows: ["Pillows", "pillows"],
    ornaments: ["Ornaments", "ornaments"],
  };

  const shelfDepartments = [
    ["Women · Clothing", ["women","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","socks","swimwear"]],
    ["Women · Shoes & Accessories", ["shoes","bags","jewelry","accessories","hats"]],
    ["Beauty & Fragrance", ["beauty","perfume"]],
    ["Men", ["men","suits","underwear","socks"]],
    ["Home & Living", ["home","kitchen","storage","bedding"]],
    ["Tech & Gaming", ["tech","phoneaccessories","gaming","office"]],
    ["Everyday", ["travel","kids","toys","pets"]],
    ["Creative & Gifts", ["crafts","party","gifts","stationery"]],
  ];

  function shelfCard(item) {
    const detailUrl = window.HuntCore
      ? window.HuntCore.productUrl(item)
      : `product.html?provider=${encodeURIComponent(item.provider || "Printful")}&id=${encodeURIComponent(item.item_id || "")}`;
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.title || "Product")}" loading="lazy">`
      : '<div class="hd-shelf-placeholder">◇</div>';
    const effectiveCategory = window.HuntCore?.inferCategory?.(item) || item.category || "";
    const hasPrice = Number.isFinite(Number(item?.price_amount)) && Number(item.price_amount) > 0;
    const basis = String(item?.price_basis || "").toUpperCase();
    const priceLabel = basis === "MARKETPLACE_RETAIL" ? "marketplace" : (basis === "SUPPLIER_BASE" ? "supplier base" : "source");
    const priceHtml = hasPrice
      ? `<div class="hd-shelf-source-price"><b>${money(Number(item.price_amount),item.currency||"USD")}</b><em>${esc(priceLabel)}</em></div>`
      : "";
    return `<article class="hd-shelf-card" role="listitem" data-category="${esc(effectiveCategory)}">
      <a class="hd-shelf-media" href="${esc(detailUrl)}">${image}<span>${esc(item?.availability_verified === true ? "VERIFIED AVAILABLE" : "CATALOG DISCOVERY")}</span></a>
      <div class="hd-shelf-card-body">
        <small>${esc(item.provider || "Provider")}</small>
        <a class="hd-shelf-title" href="${esc(detailUrl)}">${esc(item.title || "Product")}</a>
        ${priceHtml}
        <p>${esc(item?.availability_verified === true ? "Availability verified. Open for sizes, colors and current details." : "Catalog item. Open to recheck variants and availability.")}</p>
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
      return `<article class="hd-shelf-card low-cost" role="listitem"><a class="hd-shelf-media" href="${esc(detailUrl)}">${image}<span>LOW SOURCE COST</span></a><div class="hd-shelf-card-body"><small>${esc(item.provider || "Printful")}</small><a class="hd-shelf-title" href="${esc(detailUrl)}">${esc(item.title || "Product")}</a><div class="hd-shelf-source-price"><b>${money(item.price_amount,item.currency||"USD")}</b><em>supplier base</em></div><a class="hd-shelf-open" href="${esc(detailUrl)}">View product →</a></div></article>`;
    }).join("");
    const section = document.createElement("section");
    section.className = "hd-market-shelf low-source";
    section.innerHTML = `<div class="hd-market-shelf-head"><div><small>VALUE FIRST</small><h3>Low source cost picks</h3><p>Lowest verified supplier-base costs from the connected live catalog. Not final retail prices.</p></div><a href="#catalog">See live catalog →</a></div><div class="hd-shelf-track" role="list" tabindex="0" aria-label="Low source cost products">${cards}</div>`;
    root.prepend(section);
  }

  function shelfItemLimit() {
    if (window.matchMedia?.("(max-width: 760px)")?.matches) return 4;
    if (window.matchMedia?.("(max-width: 1100px)")?.matches) return 6;
    return 8;
  }

  function shelfDepartmentLimit() {
    if (window.matchMedia?.("(max-width: 760px)")?.matches) return 3;
    if (window.matchMedia?.("(max-width: 1100px)")?.matches) return 4;
    return 4;
  }

  function shelfCategoryLimit(department) {
    const mobile = window.matchMedia?.("(max-width: 760px)")?.matches;
    const tablet = window.matchMedia?.("(max-width: 1100px)")?.matches;
    if (department === "Women · Clothing") return mobile ? 2 : (tablet ? 2 : 3);
    if (department === "Women · Shoes & Accessories") return mobile ? 2 : (tablet ? 2 : 3);
    if (department === "Men") return mobile ? 1 : 2;
    return 1;
  }

  function mergeProductRecord(base, fresh) {
    if (!base) return fresh || {};
    if (!fresh) return base;
    const out = {...base};
    for (const [field,value] of Object.entries(fresh)) {
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value) && value.length === 0 && Array.isArray(out[field]) && out[field].length) continue;
      if (field === "price_amount") {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) continue;
      }
      if (typeof value === "object" && !Array.isArray(value) && value && !Object.keys(value).length && out[field]) continue;
      out[field] = value;
    }
    return out;
  }

  const curatedFashionSlugs = new Set(["women","men","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","socks","swimwear","shoes","bags","jewelry","accessories","hats"]);

  function overlayFashionSnapshot(snapshot, fashion) {
    const shelves = {...(snapshot?.shelves || {})};
    for (const [slug, rows] of Object.entries(fashion?.shelves || {})) {
      if (!curatedFashionSlugs.has(slug) || !Array.isArray(rows) || !rows.length) continue;
      shelves[slug] = rows;
    }
    const unique = new Set();
    for (const rows of Object.values(shelves)) {
      for (const item of Array.isArray(rows) ? rows : []) {
        if (item?.item_id) unique.add(String(item.provider || "") + ":" + String(item.item_id));
      }
    }
    return {
      ...(snapshot || {}),
      shelves,
      visible_product_count: unique.size,
      shelf_entry_count: Object.values(shelves).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0),
      source: "HUNT curated fashion + catalog snapshot",
      availability_policy: "CATALOG_DISCOVERY_UNTIL_PROVIDER_RECHECK"
    };
  }

  function mergeShelfData(snapshot, live) {
    const snapShelves = snapshot?.shelves || {};
    const liveShelves = live?.shelves || {};
    const slugs = new Set([...Object.keys(snapShelves), ...Object.keys(liveShelves)]);
    const shelves = {};
    const unique = new Set();

    for (const slug of slugs) {
      const seen = new Set();
      const positions = new Map();
      const rows = [];
      const append = (items, fresh) => {
        for (const item of Array.isArray(items) ? items : []) {
          const key = `${item?.provider || ""}:${item?.item_id || ""}`;
          if (!item?.item_id) continue;
          if (seen.has(key)) {
            if (fresh) {
              const index = positions.get(key);
              rows[index] = {...mergeProductRecord(rows[index], item), _hunt_fresh:true};
            }
            continue;
          }
          seen.add(key);
          unique.add(key);
          positions.set(key, rows.length);
          rows.push({...item, _hunt_fresh: fresh});
        }
      };
      append(snapShelves[slug], false);
      append(liveShelves[slug], true);
      shelves[slug] = rows;
    }

    return {
      ...(snapshot || {}),
      ...(live || {}),
      shelves,
      visible_product_count: unique.size,
      shelf_entry_count: Object.values(shelves).reduce((sum, rows) => sum + rows.length, 0),
      source: "Curated catalog snapshot + live supplier refresh",
      _hunt_merged: true
    };
  }

  function orderedShelfDepartments() {
    const signals = window.HuntCore?.signals?.() || {};
    const pinned = ["Women · Clothing","Women · Shoes & Accessories","Men"];
    const defaultOrder = ["Home & Living","Tech & Gaming","Beauty & Fragrance","Everyday","Creative & Gifts"];
    const scored = shelfDepartments
      .map((entry, index) => ({entry, index, score: entry[1].reduce((sum, slug) => sum + Number(signals[slug] || 0), 0)}));
    const pinnedRows = pinned
      .map(name => scored.find(row => row.entry[0] === name))
      .filter(Boolean);
    const rest = scored
      .filter(row => !pinned.includes(row.entry[0]))
      .sort((a,b) => (b.score - a.score)
        || (defaultOrder.indexOf(a.entry[0]) - defaultOrder.indexOf(b.entry[0]))
        || (a.index - b.index));
    return [...pinnedRows,...rest].map(row => row.entry);
  }

  function isWomenShelfItem(item) {
    const title=String(item?.title||"").toLowerCase();
    const explicitKids=/\b(baby|newborn|toddler|kid|kids|child|children|boys?|girls?|youth|infant)\b/.test(title);
    const hasWomen=/\b(women(?:'s)?|woman|female|ladies)\b/.test(title);
    const hasMen=/\b(men(?:'s)?|man|male|gentlemen|boys?)\b/.test(title);
    if (explicitKids || hasMen || /\bunisex\b/.test(title)) return false;
    if (hasWomen) return true;
    return String(item?.gender||"").toLowerCase()==="women";
  }

  function isMenShelfItem(item) {
    const title=String(item?.title||"").toLowerCase();
    const explicitKids=/\b(baby|newborn|toddler|kid|kids|child|children|boys?|girls?|youth|infant)\b/.test(title);
    const hasMen=/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title);
    const hasWomen=/\b(women(?:'s)?|woman|female|ladies|girls?)\b/.test(title);
    if (explicitKids || hasWomen || /\bunisex\b/.test(title)) return false;
    if (hasMen) return true;
    return String(item?.gender||"").toLowerCase()==="men";
  }

  function matchesShelfTruth(item, slug, department) {
    const inferred = window.HuntCore?.inferCategory?.(item) || item?.category || "";
    if (slug === "women") return isWomenShelfItem(item);
    if (slug === "men") return isMenShelfItem(item);
    if (department.startsWith("Women") && isMenShelfItem(item)) return false;
    return inferred === slug;
  }

  function displayQualityScore(item) {
    const title = String(item?.title || "").trim();
    let score = 0;
    if (typeof item?.image_url === "string" && item.image_url.startsWith("https://")) score += 8;
    if (item?.availability_verified === true) score += 4;
    if (Number.isFinite(Number(item?.price_amount)) && Number(item.price_amount) > 0) score += 2;
    if (Number(item?.variant_count || 0) > 0) score += 2;
    if (title.length >= 18 && title.length <= 90) score += 2;
    if (item?.brand) score += 1;
    return score;
  }

  function selectShelfItems(items, limit, renderedKeys) {
    const rows = [];
    const localSeen = new Set();
    const groups = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      const key = `${item?.provider || ""}:${item?.item_id || ""}`;
      if (!item?.item_id || localSeen.has(key)) continue;
      localSeen.add(key);
      const provider = String(item.provider || "Other");
      if (!groups.has(provider)) groups.set(provider, []);
      groups.get(provider).push(item);
    }

    // Display art: prefer complete, identifiable products while preserving provider diversity.
    for (const [provider, group] of groups) {
      groups.set(provider, group
        .map((item,index)=>({item,index,score:displayQualityScore(item)}))
        .sort((a,b)=>(b.score-a.score)||(a.index-b.index))
        .map(row=>row.item));
    }
    const providers = [...groups.keys()];
    let cursor = 0;
    while (rows.length < limit && providers.length) {
      const provider = providers[cursor % providers.length];
      const group = groups.get(provider) || [];
      let pickIndex = group.findIndex(item => !renderedKeys.has(`${item.provider || ""}:${item.item_id || ""}`));
      if (pickIndex < 0) pickIndex = group.length ? 0 : -1;
      if (pickIndex >= 0) {
        const [item] = group.splice(pickIndex, 1);
        rows.push(item);
        renderedKeys.add(`${item.provider || ""}:${item.item_id || ""}`);
      }
      if (!group.length) {
        groups.delete(provider);
        providers.splice(cursor % providers.length, 1);
        if (!providers.length) break;
        cursor = cursor % providers.length;
      } else cursor += 1;
    }
    return rows;
  }

  function renderMarketShelvesData(data, mode = "live") {
    const root = $("#hd-shelves-root");
    const counter = $("#hd-shelf-count");
    if (!root || !counter) return false;
    const shelves = data?.shelves || {};
    const hasProducts = Object.values(shelves).some(items => Array.isArray(items) && items.length);
    if (!hasProducts) return false;

    window.HuntMarketShelves = data;
    window.dispatchEvent(new CustomEvent("hunt:shelves", {detail:data}));

    const renderedKeys = new Set();
    const limit = shelfItemLimit();
    const html = orderedShelfDepartments().slice(0, shelfDepartmentLimit()).map(([department, slugs]) => {
      const sections = [];
      for (const slug of slugs) {
        if (sections.length >= shelfCategoryLimit(department)) break;
        const meta = shelfMeta[slug];
        let items = Array.isArray(shelves[slug]) ? shelves[slug] : [];
        items = items.filter(item => matchesShelfTruth(item, slug, department));
        if (!meta || items.length < 4) continue;
        const selected = selectShelfItems(items, limit, renderedKeys);
        if (!selected.length) continue;
        for (const item of selected) {
          try { sessionStorage.setItem("hunt_product_" + String(item.provider || "") + ":" + String(item.item_id || ""), JSON.stringify(item)); } catch {}
        }
        const cards = selected.map(shelfCard).join("");
        const categoryHref = department.startsWith("Women") && slug !== "women"
          ? `category.html?c=women&sub=${encodeURIComponent(slug)}`
          : (window.HuntCore ? window.HuntCore.categoryUrl(meta[1]) : `category.html?c=${encodeURIComponent(meta[1])}`);
        sections.push(`<section class="hd-market-shelf"><div class="hd-market-shelf-head"><div><small>${mode === "live" ? "LIVE CATEGORY" : "CURATED CATALOG"}</small><h3>${esc(meta[0])}</h3><p>${items.length} real catalog products ready to inspect.</p></div><a href="${esc(categoryHref)}">View all →</a></div><div class="hd-shelf-track" role="list" tabindex="0" aria-label="${esc(meta[0])} products">${cards}</div></section>`);
      }
      if (!sections.length) return "";
      return `<section class="hd-shelf-department"><div class="hd-shelf-department-head"><span>DEPARTMENT</span><h2>${esc(department)}</h2></div>${sections.join("")}</section>`;
    }).join("");

    const browseMore = html
      ? '<div class="hd-home-catalog-cta"><a class="hd-btn" href="#departments">Browse all departments</a><span>The full catalog stays available through Categories and Search.</span></div>'
      : '';
    root.innerHTML = (html + browseMore) || '<div class="hd-shelf-loading glass">No catalog products available.</div>';
    const count = Number(data?.visible_product_count || 0);
    const label = mode === "live" ? "LIVE" : "CATALOG";
    counter.textContent = `${count.toLocaleString()} ${label}`;
    counter.title = mode === "hybrid" ? "Curated catalog with verified live supplier refresh merged in" : (mode === "live" ? "Verified live supplier refresh" : "Curated catalog discovery while live suppliers refresh");
    return true;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {...options, signal:controller.signal});
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadMarketShelves() {
    const root = $("#hd-shelves-root");
    const counter = $("#hd-shelf-count");
    if (!root || !counter) return;

    let renderedFallback = false;
    let snapshotData = null;

    try {
      const snapshotRes = await fetch("catalog-home.json?v=platform1", {cache:"force-cache"});
      if (snapshotRes.ok) {
        snapshotData = await snapshotRes.json();
        try {
          const fashionRes = await fetch("catalog-fashion/home.json?v=fashion1", {cache:"force-cache"});
          if (fashionRes.ok) snapshotData = overlayFashionSnapshot(snapshotData, await fashionRes.json());
        } catch {}
        renderedFallback = renderMarketShelvesData(snapshotData, "snapshot");
      }
    } catch {}

    try {
      const res = await fetchWithTimeout(publicApiUrl("hunt-storefront") + "?shelves=1", {
        cache:"no-store",
        headers: publicApiHeaders()
      }, 15000);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Market shelves unavailable");
      const merged = snapshotData ? mergeShelfData(snapshotData, data) : data;
      if (snapshotData && renderedFallback) {
        // Freeze the already-visible storefront. Background live refresh may enrich data,
        // but it must never replace/reorder cards the shopper is already looking at.
        window.HuntMarketShelves = merged;
        window.dispatchEvent(new CustomEvent("hunt:shelves-refreshed", {detail:merged}));
        const count = Number(merged?.visible_product_count || 0);
        counter.textContent = `${count.toLocaleString()} CATALOG`;
        counter.title = "Curated catalog stays stable while verified live supplier data refreshes in the background.";
      } else {
        renderMarketShelvesData(merged, "live");
      }
    } catch (err) {
      if (renderedFallback) {
        counter.title = "Live refresh is temporarily unavailable; showing curated catalog discovery products.";
        return;
      }
      const msg = err?.name === "AbortError"
        ? "Live catalog is taking longer than expected. Try again shortly."
        : (err.message || "Market shelves unavailable");
      root.innerHTML = `<div class="hd-shelf-loading glass">${esc(msg)}</div>`;
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
    if (!clean) return null;
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
      section?.scrollIntoView({behavior:"smooth",block:"start"});
      return data;
    } catch (err) {
      if (status) status.textContent = err.message || "Live search unavailable";
      const grid = $("#hd-search-grid");
      if (grid) grid.innerHTML = "";
      return null;
    }
  }

  async function executeSmartSearch(rawQuery) {
    const H = window.HuntCore;
    const intent = H?.resolveSearchIntent ? H.resolveSearchIntent(rawQuery) : {kind:"search",query:String(rawQuery||"").trim()};
    if (!intent?.query && !intent?.slug) return;
    if (intent.kind === "category" && intent.slug) {
      H?.recordSignal?.(intent.slug,"search");
      location.href = H?.categoryUrl ? H.categoryUrl(intent.slug) : "category.html?c=" + encodeURIComponent(intent.slug);
      return;
    }
    if(intent.slug) H?.recordSignal?.(intent.slug,"search");
    window.dispatchEvent(new CustomEvent("hunt:search",{detail:intent}));
    await runLiveSearch(intent.query || rawQuery);
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
  $("#hd-search-form")?.addEventListener("submit", event => {
    event.preventDefault();
    executeSmartSearch($("#hd-search-input")?.value || "");
  });

  window.addEventListener("hunt:language", e => {
    dict = e.detail.dict;
    if (allDeals.length) renderDeals(allDeals);
  });

  updateCartCount();
  loadMarketShelves();

  load().then(() => {
    const root = $("#hd-shelves-root");
  }).catch(err => {
    const empty = $("#hd-empty");
    if (empty) { empty.hidden = false; empty.querySelector("p").textContent = err.message; }
  });
})();