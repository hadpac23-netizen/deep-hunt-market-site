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
  const isStaticPublicHost = location.hostname.endsWith(".github.io") || location.hostname === "127.0.0.1" || location.hostname === "localhost";
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

  function retailState(item) {
    const verified = item?.retail_price_verified === true;
    const gate = String(item?.profit_gate_status || "").toUpperCase();
    const amount = Number(item?.retail_price_amount);
    const currency = String(item?.retail_currency || item?.currency || "USD");
    const ready = verified && gate === "PASS" && Number.isFinite(amount) && amount > 0;
    return {ready, amount: ready ? amount : null, currency};
  }

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
    const retail = retailState(item);
    if (!retail.ready) {
      const detailUrl = window.HuntCore ? window.HuntCore.productUrl(item) : "";
      if (detailUrl) location.href = detailUrl;
      return;
    }
    const cart = readCart();
    const key = String(item.provider) + ":" + String(item.item_id);
    const existing = cart.find(row => row.key === key);
    const row = {
      key,
      provider: String(item.provider),
      item_id: String(item.item_id),
      title: String(item.title || "Product"),
      image_url: typeof item.image_url === "string" ? item.image_url : null,
      price_amount: retail.amount,
      currency: retail.currency,
      price_basis: "HUNT_RETAIL_PROFIT_GATE",
      retail_price_verified: true,
      profit_gate_status: "PASS",
      qty: 1
    };
    if (existing) Object.assign(existing, row, {qty:Math.min(5,(Number(existing.qty)||1)+1)});
    else cart.push(row);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartCount();
    location.href = "checkout.html";
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

  function glyphFor() {
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
      : `<div class="hd-product-visual" aria-hidden="true">${glyphFor()}</div>`;
    return `
      <article class="hd-deal-card" data-category="${category}" data-search="${esc(c.title||"")}">
        <div class="hd-deal-top"><span class="hd-verdict ${verdict==="SELL"?"sell":""}">${esc(verdict)}</span><span class="hd-heart">♡</span></div>
        ${productVisual}
        <h3>${esc(c.title || "Verified product")}</h3>
        <div class="hd-price">${(() => { const r=retailState(c); return r.ready ? money(r.amount,r.currency) : "Price pending"; })()}</div>
        <div class="hd-provider">HUNT NETWORK · ${m.outbound_clicks||0} clicks · ${m.conversions||0} conversions</div>
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
      const retail = retailState(item);
      const priceLabel = retail.ready ? money(retail.amount, retail.currency) : "Price pending";
      const gaps = (item.gaps || []).slice(0,2).map(x => `<li>${esc(x)}</li>`).join("");
      const detailUrl = window.HuntCore ? window.HuntCore.productUrl(item) : `product.html?id=${encodeURIComponent(item.item_id || "")}`;
      return `
        <article class="hd-catalog-card glass">
          <div class="hd-catalog-media">${image}<span class="hd-catalog-badge">${esc(item.verdict || "CATALOG")}</span></div>
          <div class="hd-catalog-body">
            <div class="hd-provider">HUNT VERIFIED SOURCE</div>
            <h3><a class="hd-catalog-title-link" href="${esc(detailUrl)}">${esc(item.title || "Catalog product")}</a></h3>
            <div class="hd-catalog-price"><small>${retail.ready ? "HUNT retail" : "Customer price"}</small><strong>${priceLabel}</strong></div>
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
      const retail = retailState(candidate);
      $("#hd-best-copy").textContent = ["HUNT NETWORK", retail.ready ? money(retail.amount,retail.currency) : "Price pending"].filter(Boolean).join(" · ");
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

  const legacyShelfAliases = Object.freeze({
    dresses:"women-dresses",
    tops:"women-tops",
    bottoms:"women-bottoms",
    sleepwear:"women-nightwear",
    womenunderwear:"women-underwear",
    menunderwear:"men-underwear",
    suits:"men-tailoring",
    wallart:"wall-art"
  });
  const departmentLabels = Object.freeze({
    women:"Women",men:"Men",kids:"Kids",baby:"Baby",home:"Home & Living",
    tech:"Tech",sports:"Sports & Outdoor",accessories:"Accessories"
  });

  function canonicalTaxonomy() {
    const t=window.HuntCore?.canonicalTaxonomy;
    return t?.defs && t?.groups ? t : {defs:{},groups:{}};
  }

  function canonicalShelfSlug(raw) {
    const slug=String(raw||"").trim().toLowerCase();
    return legacyShelfAliases[slug] || slug;
  }

  function canonicalAllowedShelves() {
    return new Set(Object.keys(canonicalTaxonomy().defs || {}));
  }

  function shelfMetaFor(slug) {
    const def=window.HuntCore?.categoryDefs?.[slug] || canonicalTaxonomy().defs?.[slug];
    return def ? [def.title || slug,slug] : null;
  }

  function canonicalCategoryHref(slug) {
    const def=window.HuntCore?.categoryDefs?.[slug] || canonicalTaxonomy().defs?.[slug];
    if (def?.canonical && def?.parent) {
      return `category.html?c=${encodeURIComponent(def.parent)}&sub=${encodeURIComponent(slug)}`;
    }
    return window.HuntCore ? window.HuntCore.categoryUrl(slug) : `category.html?c=${encodeURIComponent(slug)}`;
  }

  function normalizeCanonicalShelfData(data) {
    const source=data?.shelves || {};
    const allowed=canonicalAllowedShelves();
    const shelves={};
    for (const [rawSlug,rawRows] of Object.entries(source)) {
      for (const item of Array.isArray(rawRows) ? rawRows : []) {
        const declaredRaw=item?.canonical_shelf || item?.taxonomy_shelf || item?.category_slug || rawSlug;
        const canonical=canonicalShelfSlug(declaredRaw);
        if (!allowed.has(canonical)) continue;
        if (!shelves[canonical]) shelves[canonical]=[];
        shelves[canonical].push({...item,_hunt_canonical_shelf:canonical});
      }
    }
    return {...(data||{}),shelves,_hunt_canonical_taxonomy:canonicalTaxonomy().version || "unknown"};
  }

  function canonicalDepartments() {
    const {defs,groups}=canonicalTaxonomy();
    return Object.entries(groups || {}).map(([department,slugs])=>{
      const exact=(Array.isArray(slugs)?slugs:[]).filter(slug=>defs?.[slug]?.canonical===true && defs?.[slug]?.parent===department);
      return [departmentLabels[department] || window.HuntCore?.categoryDefs?.[department]?.title || department,exact];
    }).filter(([,slugs])=>slugs.length);
  }

  function shelfCard(item) {
    const detailUrl = window.HuntCore
      ? window.HuntCore.productUrl(item)
      : `product.html?id=${encodeURIComponent(item.item_id || "")}`;
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.title || "Product")}" loading="lazy">`
      : '<div class="hd-shelf-placeholder">◇</div>';
    const sourceCode = window.HuntCore?.sourceCodeForProvider?.(item.provider) || "s0";
    const podSetupRequired = sourceCode === "s3" || sourceCode === "s4";
    const quoteVerified = String(item?.quote_verification_status || "").toUpperCase() === "PASS";
    const detailRecheckRequired = item?.checkout_status === "PRODUCT_DETAIL_RECHECK_REQUIRED"
      || Boolean(item?.detail_recheck_status);
    const truthBadge = quoteVerified
      ? "QUOTE VERIFIED"
      : item.quality_gate === "BOOM_PREMIUM"
        ? "BOOM PICK"
        : podSetupRequired
          ? "POD CATALOG"
          : detailRecheckRequired
            ? "RECHECK REQUIRED"
            : "SOURCE CATALOG";
    const detailLine = quoteVerified
      ? "A recent stock and shipping quote passed; destination is rechecked before checkout."
      : podSetupRequired
        ? "Product source verified; HUNT setup is required before checkout."
        : detailRecheckRequired
          ? "Product detail must be verified again before checkout."
          : "Open for current price, variants and availability.";
    return `<article class="hd-shelf-card" role="listitem" data-category="${esc(item.category || "")}">
      <a class="hd-shelf-media" href="${esc(detailUrl)}">${image}<span>${esc(truthBadge)}</span></a>
      <div class="hd-shelf-card-body">
        <small>HUNT SOURCE</small>
        <a class="hd-shelf-title" href="${esc(detailUrl)}">${esc(item.title || "Product")}</a>
        <p>${esc(detailLine)}</p>
        <a class="hd-shelf-open" href="${esc(detailUrl)}">View product →</a>
      </div>
    </article>`;
  }

  function renderLowSourceShelf() {
    return;
  }

  function shelfItemLimit() {
    if (window.matchMedia?.("(max-width: 760px)")?.matches) return 10;
    if (window.matchMedia?.("(max-width: 1100px)")?.matches) return 12;
    return 18;
  }

  function mergeProductRecord(base, fresh) {
    if (!base) return fresh || {};
    if (!fresh) return base;
    const out = {...base};
    const detailGate = base?.checkout_status === "PRODUCT_DETAIL_RECHECK_REQUIRED"
      || Boolean(base?.detail_recheck_status);
    for (const [field,value] of Object.entries(fresh)) {
      if (detailGate && ["availability_verified","retail_price_verified","retail_price_amount","profit_gate_status","checkout_status","snapshot_quality_gate"].includes(field)) continue;
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

  function mergeShelfData(snapshot, live) {
    snapshot = normalizeCanonicalShelfData(snapshot);
    live = normalizeCanonicalShelfData(live);
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
      rows.sort((a,b) => shelfQualityScore(b) - shelfQualityScore(a));
      shelves[slug] = rows;
    }

    return {
      ...(snapshot || {}),
      ...(live || {}),
      shelves,
      visible_product_count: unique.size,
      shelf_entry_count: Object.values(shelves).reduce((sum, rows) => sum + rows.length, 0),
      source: "Verified catalog snapshot + live fulfillment refresh",
      _hunt_merged: true
    };
  }

  function orderedShelfDepartments() {
    const signals = window.HuntCore?.signals?.() || {};
    return canonicalDepartments()
      .map((entry,index)=>({entry,index,score:entry[1].reduce((sum,slug)=>sum+Number(signals[slug]||0),0)}))
      .sort((a,b)=>(b.score-a.score)||(a.index-b.index))
      .map(row=>row.entry);
  }

  function isShelfFit(slug,item) {
    return String(item?._hunt_canonical_shelf||"")===String(slug||"");
  }

  function shelfQualityScore(item) {
    let score = 0;
    if (item?.quality_gate === "BOOM_PREMIUM") score += 90;
    if (item?.availability_verified === true) score += 50;
    const retail = Number(item?.retail_price_amount);
    const base = Number(item?.price_amount);
    if ((Number.isFinite(retail) && retail > 0) || (Number.isFinite(base) && base > 0)) score += 20;
    const stock = Number(item?.stock_quantity);
    if (Number.isFinite(stock) && stock > 0) score += Math.min(20, stock);
    if (String(item?.brand || "").trim()) score += 8;
    if (Array.isArray(item?.gallery) && item.gallery.length >= 2) score += 10;
    if (Number(item?.variant_count || 0) >= 2) score += 8;
    if (item?._hunt_fresh === true) score += 7;
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

    for (const group of groups.values()) group.sort((a,b) => shelfQualityScore(b) - shelfQualityScore(a));
    const providers = [...groups.keys()].sort((a,b) => {
      const aTop = groups.get(a)?.[0];
      const bTop = groups.get(b)?.[0];
      return shelfQualityScore(bTop) - shelfQualityScore(aTop);
    });
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
    data = normalizeCanonicalShelfData(data);
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
    const html = orderedShelfDepartments().map(([department, slugs]) => {
      const sections = slugs.map(slug => {
        const meta = shelfMetaFor(slug);
        let items = Array.isArray(shelves[slug]) ? shelves[slug].filter(item => isShelfFit(slug, item)) : [];
        if (!meta || items.length < 4) return "";
        const selected = selectShelfItems(items, limit, renderedKeys);
        const cards = selected.map(shelfCard).join("");
        const categoryHref = canonicalCategoryHref(slug);
        return `<section class="hd-market-shelf"><div class="hd-market-shelf-head"><div><small>${mode === "live" ? "LIVE CATEGORY" : "VERIFIED CATALOG"}</small><h3>${esc(meta[0])}</h3><p>${items.length} real catalog products ready to inspect.</p></div><a href="${esc(categoryHref)}">View all →</a></div><div class="hd-shelf-track" role="list" tabindex="0" aria-label="${esc(meta[0])} products">${cards}</div></section>`;
      }).filter(Boolean).join("");
      if (!sections) return "";
      return `<section class="hd-shelf-department"><div class="hd-shelf-department-head"><span>DEPARTMENT</span><h2>${esc(department)}</h2></div>${sections}</section>`;
    }).join("");

    root.innerHTML = html || '<div class="hd-shelf-loading glass">No catalog products available.</div>';
    const fullCatalogCount = Number(data?.catalog_total_product_count || 0);
    const count = fullCatalogCount || Number(data?.visible_product_count || 0);
    const label = fullCatalogCount ? "CATALOG" : (mode === "live" ? "LIVE" : mode === "hybrid" ? "READY" : "CATALOG");
    counter.textContent = `${count.toLocaleString()} ${label}`;
    counter.title = fullCatalogCount
      ? "BOOM quality catalog across category pages; home shelves remain curated for speed."
      : (mode === "hybrid" ? "Verified catalog with live fulfillment refresh merged in" : (mode === "live" ? "Live fulfillment refresh" : "Verified catalog snapshot while live sources refresh"));
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
        renderMarketShelvesData(merged, "hybrid");
        window.dispatchEvent(new CustomEvent("hunt:shelves-refreshed", {detail:merged}));
      } else {
        renderMarketShelvesData(merged, "live");
      }
    } catch (err) {
      if (renderedFallback) {
        counter.title = "Live refresh is temporarily unavailable; showing verified catalog products.";
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
    host.innerHTML = items.map((item,index) => {
      const state = String(item.state || "UNKNOWN").toUpperCase();
      const tone = /READY|LIVE|CONFIGURED|CATALOG_LIVE/.test(state)
        ? "ready"
        : /AUTH_REQUIRED|APPROVAL_REQUIRED|MANUAL_PROGRAM|VERIFYING/.test(state)
          ? "waiting"
          : "neutral";
      return `<span class="hd-provider-pill ${tone}"><b>HUNT SOURCE ${index+1}</b><small>${esc(state.replaceAll("_", " "))}</small></span>`;
    }).join("") || "<span>No source state yet.</span>";
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
    const states = (data.providers || []).map((p,index) => {
      const count = p.result_count ? " (" + p.result_count + ")" : "";
      return "HUNT source " + (index+1) + ": " + p.state + count;
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
    if (status) status.textContent = dict.searching || "Searching verified HUNT sources…";
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
  }).catch(err => {
    const empty = $("#hd-empty");
    if (empty) { empty.hidden = false; empty.querySelector("p").textContent = err.message; }
  });
})();
