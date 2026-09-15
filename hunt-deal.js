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
    if(window.HuntCore?.saveCart)window.HuntCore.saveCart(cart);else localStorage.setItem(cartKey, JSON.stringify(cart));
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

  function glyphFor(provider) {
    const p = String(provider || "").toLowerCase();
    if (p.includes("amazon")) return "a";
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
        <div class="hd-price">${(() => { const r=retailState(c); return r.ready ? money(r.amount,r.currency) : "Price pending"; })()}</div>
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
    const items = (Array.isArray(products) ? products : []).filter(item => String(item?.provider || "").toLowerCase() === "cjdropshipping");
    catalogItems = items;
    count.textContent = items.length ? items.length + " LIVE" : "WAITING";
    grid.innerHTML = items.map(item => {
      const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
        ? `<img class="hd-catalog-image" src="${esc(item.image_url)}" alt="${esc(item.title || "Catalog product")}" loading="lazy">`
        : '<div class="hd-catalog-image hd-catalog-placeholder">◇</div>';
      const retail = retailState(item);
      const priceLabel = retail.ready ? money(retail.amount, retail.currency) : "Price pending";
      const gaps = (item.gaps || []).slice(0,2).map(x => `<li>${esc(x)}</li>`).join("");
      const detailUrl = window.HuntCore ? window.HuntCore.productUrl(item) : `product.html?provider=${encodeURIComponent(item.provider || "CJdropshipping")}&id=${encodeURIComponent(item.item_id || "")}`;
      return `
        <article class="hd-catalog-card glass">
          <div class="hd-catalog-media">${image}<span class="hd-catalog-badge">${esc(item.verdict || "CATALOG")}</span></div>
          <div class="hd-catalog-body">
            <div class="hd-provider">${esc(item.provider || "Provider")} · VERIFIED SOURCE</div>
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
      $("#hd-best-copy").textContent = [candidate.provider, retail.ready ? money(retail.amount,retail.currency) : "Price pending"].filter(Boolean).join(" · ");
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
    eveningdresses: ["Evening & Occasion Dresses", "eveningdresses"],
    womensuits: ["Women's Suits & Blazers", "womensuits"],
    tops: ["Tops & T-Shirts", "tops"],
    jeans: ["Jeans & Denim", "jeans"],
    bottoms: ["Bottoms", "bottoms"],
    underwear: ["Women's Underwear & Bras", "underwear"],
    thongs: ["Women's Thongs", "thongs"],
    boxers: ["Men's Boxer Briefs", "boxers"],
    longboxers: ["Men's Long Boxer Briefs", "longboxers"],
    mensbriefs: ["Men's Briefs & Low-Rise", "mensbriefs"],
    hoodies: ["Hoodies & Sweatshirts", "hoodies"],
    knitwear: ["Knitwear", "knitwear"],
    jackets: ["Jackets & Outerwear", "jackets"],
    activewear: ["Activewear", "activewear"],
    bags: ["Bags & Totes", "bags"],
    shoes: ["Shoes", "shoes"],
    accessories: ["Accessories", "accessories"],
    sunglasses: ["Sunglasses", "sunglasses"],
    belts: ["Belts & Small Accessories", "belts"],
    travel: ["Travel Picks", "travel"],
    home: ["Home Finds", "home"],
    storage: ["Storage & Organization", "storage"],
    bedding: ["Bedding", "bedding"],
    cleaning: ["Cleaning & Laundry", "cleaning"],
    tech: ["Phone & Tech", "tech"],
    phonecases: ["Premium Phone Cases", "phonecases"],
    phoneaccessories: ["Phone Accessories", "phoneaccessories"],
    chargers: ["Chargers & Cables", "chargers"],
    powerbanks: ["Power Banks", "powerbanks"],
    phonestands: ["Phone & Tablet Stands", "phonestands"],
    earbuds: ["Earbuds & Audio", "earbuds"],
    usefultech: ["Useful Electronics", "usefultech"],
    hairaccessories: ["Hair Accessories", "hairaccessories"],
    plussize: ["Plus Size", "plussize"],
    suits: ["Suits & Tailoring", "suits"],
    sets: ["Matching Sets", "sets"],
    sleepwear: ["Sleepwear", "sleepwear"],
    womenunderwear: ["Women's Essentials", "womenunderwear"],
    menunderwear: ["Men's Essentials", "menunderwear"],
    gaming: ["Gaming Accessories", "gaming"],
    sports: ["Sports & Fitness", "sports"],
    outdoors: ["Outdoor & Garden", "outdoors"],
    beauty: ["Beauty & Skincare", "beauty"],
    makeup: ["Makeup", "makeup"],
    skincare: ["Skincare", "skincare"],
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
    socks: ["Socks", "socks"],
    swimwear: ["Swimwear", "swimwear"],
    office: ["Office & Desk", "office"],
    pillows: ["Pillows", "pillows"],
    ornaments: ["Ornaments", "ornaments"],
  };

  const shelfDepartments = [["Women",["women-dresses","women-evening","women-suits","women-tops","women-jeans","women-bottoms","women-skirts","women-knitwear","women-outerwear","women-underwear","women-sleepwear","women-swim","women-shoes","women-socks","women-wallets","women-hoodies","women-clothing"]],["Men",["men-tops","men-suits","men-jeans","men-bottoms","men-outerwear","men-knitwear","men-boxers","men-underwear","men-sleepwear","men-shoes","men-bags","men-wallets","men-socks","men-hoodies","men-accessories","men-clothing"]],["Kids & Baby",["kids-clothing","kids-shoes","kids-accessories","baby","baby-clothing","baby-shoes"]],["Beauty",["skincare","body-care","makeup","nails","hair","beauty-tools"]],["Accessories & Jewelry",["jewelry-necklaces","jewelry-rings","jewelry-earrings","jewelry-bracelets","jewelry","watches","bags","hats","belts","scarves","keychains","gloves","hair-accessories","bag-accessories","socks"]],["Phone & Tech",["phone-cases","chargers-cables","power-banks","stands-holders","audio","wearables","wearable-accessories","smart-home","cameras","computer-accessories","electronics","gaming"]],["Home & Living",["home-storage","kitchen","lighting","bedding","bath","home-decor","drinkware","tools-diy","cleaning","small-appliances"]],["Sports & Outdoors",["fitness","outdoors","active-bottoms","sports-gear","sports-bags","cycling","fitness-accessories"]],["Pets",["pet-accessories","pet-toys","pet-grooming","pet-clothing","pet-feeding","pet-walk","pet-beds","aquarium"]],["Toys",["toys"]],["Travel",["luggage"]],["Office & Crafts",["crafts","stationery","stickers"]],["Gifts & Party",["party"]]];

  function shelfCard(item) {
    const detailUrl = window.HuntCore
      ? window.HuntCore.productUrl(item)
      : `product.html?provider=${encodeURIComponent(item.provider || "CJdropshipping")}&id=${encodeURIComponent(item.item_id || "")}`;
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.title || "Product")}" loading="lazy">`
      : '<div class="hd-shelf-placeholder">◇</div>';
    const providerName = String(item.provider || "").toLowerCase();
    const quoteVerified = String(item?.quote_verification_status || "").toUpperCase() === "PASS";
    const detailRecheckRequired = item?.checkout_status === "PRODUCT_DETAIL_RECHECK_REQUIRED"
      || Boolean(item?.detail_recheck_status);
    const truthBadge = quoteVerified
      ? "QUOTE VERIFIED"
      : item.quality_gate === "BOOM_PREMIUM"
        ? "BOOM PICK"
        : detailRecheckRequired
          ? "RECHECK REQUIRED"
          : "SOURCE CATALOG";
    const detailLine = quoteVerified
      ? "A recent stock and shipping quote passed; destination is rechecked before checkout."
      : detailRecheckRequired
        ? "Product detail must be verified again before checkout."
        : "Open for current price, variants and availability.";
    const retailAmount = Number(item?.retail_price_amount);
    const retailReady = item?.retail_price_verified === true && String(item?.profit_gate_status || "").toUpperCase() === "PASS" && Number.isFinite(retailAmount) && retailAmount > 0;
    const retailEstimated = !retailReady && Number.isFinite(retailAmount) && retailAmount > 0;
    const retailText = retailReady ? money(retailAmount, item?.retail_currency || "USD") : (retailEstimated ? `From ${money(retailAmount, item?.retail_currency || "USD")}` : "Price on product");
    const newBadge = window.HuntCore?.isNewArrival?.(item) ? `<b class="hd-new-pulse">NEW</b>` : "";
    return `<article class="hd-shelf-card" role="listitem" data-category="${esc(item.category || "")}">
      <a class="hd-shelf-media" href="${esc(detailUrl)}">${image}<span>${esc(truthBadge)}</span>${newBadge}</a>
      <div class="hd-shelf-card-body">
        <small>${esc(item.provider || "Provider")}</small>
        <a class="hd-shelf-title" href="${esc(detailUrl)}">${esc(item.title || "Product")}</a>
        <strong class="hd-shelf-price">${esc(retailText)}</strong>
        <p>${esc(detailLine)}</p>
        <a class="hd-shelf-open" href="${esc(detailUrl)}">View product →</a>
      </div>
    </article>`;
  }

  function renderLowSourceShelf() {
    // Supplier economics are internal-only and never rendered to customers.
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
          if (String(item?.provider || "").toLowerCase() !== "cjdropshipping") continue;
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
      source: "Verified catalog snapshot + live supplier refresh",
      _hunt_merged: true
    };
  }

  function orderedShelfDepartments() {
    const signals = window.HuntCore?.signals?.() || {};
    return shelfDepartments
      .map((entry, index) => ({entry, index, score: entry[1].reduce((sum, slug) => sum + Number(signals[slug] || 0), 0)}))
      .sort((a,b) => (b.score - a.score) || (a.index - b.index))
      .map(row => row.entry);
  }

  function isWomenShelfItem(item) {
    const title=String(item?.title||"").toLowerCase();
    if (String(item?.gender||"").toLowerCase()==="women") return true;
    if (/\bunisex\b/.test(title)) return false;
    const hasWomen=/\b(women(?:'s)?|woman|female|ladies)\b/.test(title);
    const hasMen=/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title);
    return hasWomen && !hasMen;
  }

  function isShelfFit(slug, item) {
    const title = String(item?.title || "").toLowerCase();
    const rules = {
      women: /\b(dress|skirt|shirt|t-shirt|tee|top|tank|blouse|hoodie|sweatshirt|jacket|coat|windbreaker|jogger|pants|trousers|leggings|shorts|swim|pajama|sleepwear|activewear|sports bra|cardigan|sweater|bodysuit)\b/i,
      men: /\b(men(?:'s)?|male|gentlemen)\b.*\b(shirt|tee|top|jacket|coat|pants|trousers|shorts|hoodie|suit|blazer|activewear|swim|underwear)\b|\b(shirt|tee|top|jacket|coat|pants|trousers|shorts|hoodie|suit|blazer|activewear|swim|underwear)\b.*\b(men(?:'s)?|male|gentlemen)\b/i,
      bags: /\b(bag|backpack|tote|handbag|purse|crossbody|duffle|weekender)\b/i,
      hairaccessories: /\b(hair|headband|hairpin|barrette|scrunchie|comb|claw clip|shark clip)\b/i,
      phonecases: /\b(case|cover)\b.*\b(phone|iphone|samsung|magsafe)\b|\b(phone|iphone|samsung|magsafe)\b.*\b(case|cover)\b/i,
      sets: /\b(two[- ]?piece|2[- ]?piece|matching|co[- ]?ord|coord)\b.*\b(top|shirt|blouse|vest|hoodie|sweater|cardigan|jacket|dress|skirt|shorts|pants|trousers|pajama|outfit|clothing)\b/i,
      home: /\b(blanket|pillow|rug|mat|poster|canvas|decor|coaster|towel|placemat|tablecloth|runner|cutting board|wall art|home|curtain|lamp|lighting)\b/i,
      office: /\b(desk|calendar|journal|notebook|mouse pad|mousepad|office|acrylic desk)\b/i,
      sports: /\b(yoga|sport|fitness|running|cycling|gym|racket|towel|bottle|mat)\b/i,
    };
    if (rules[slug] && !rules[slug].test(title)) return false;
    if (slug === "women" && !isWomenShelfItem(item)) return false;
    if (slug === "women" && /\b(boy|boys|kid|kids|child|children|baby|toddler)\b/i.test(title)) return false;
    if (slug === "women" && /\b(hair|clip|headband|jewelry|bag|purse|shoe|case|phone|wig|extension)\b/i.test(title)) return false;
    if (slug === "hairaccessories" && /\b(shorts|pants|trousers|jeans|shirt|tee|dress|hoodie|jacket|coat)\b/i.test(title)) return false;
    if (slug === "sets" && /\b(necklace|bracelet|earring|earrings|jewelry|jewellery|gift|bedding|sheet|duvet|toy|tool|kitchen|bath|towel|baby|toddler|kid|kids|child|children|boys?|girls?|pet|dog|cat)\b/i.test(title)) return false;
    if (slug === "home" && /\b(hair|clip|headband|handbag|purse|phone case|halloween|witch|costume)\b/i.test(title)) return false;
    return true;
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
    score += Number(window.HuntSupplierGravity?.productBoost?.(item) || 0);
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

  function mixedHomeDiscovery(shelves, limit=24) {
    const departmentMap = window.HuntCore?.departmentSubcategories || {};
    const buckets = [];
    const used = new Set();
    const departments = ["women","men","kids","beauty","accessories","tech","home","sports","pets","toys","travel","office","gifts"];
    for (const department of departments) {
      const slugs = [department,...(departmentMap[department] || [])];
      const rows = [];
      for (const slug of slugs) {
        for (const item of Array.isArray(shelves?.[slug]) ? shelves[slug] : []) {
          const key = `${item?.provider || ""}:${item?.item_id || ""}`;
          if (!item?.item_id || used.has(key) || String(item?.provider || "").toLowerCase() !== "cjdropshipping") continue;
          rows.push(item);
        }
      }
      if (rows.length) buckets.push(rows);
    }
    const rand = array => {
      const out=[...array];
      for(let i=out.length-1;i>0;i--){
        const buf=new Uint32Array(1);
        crypto.getRandomValues(buf);
        const j=buf[0]%(i+1);
        [out[i],out[j]]=[out[j],out[i]];
      }
      return out;
    };
    const shuffled=buckets.map(rand);
    const result=[];
    let cursor=0;
    while(result.length<limit && shuffled.some(x=>x.length)){
      for(const bucket of rand(shuffled)){
        if(result.length>=limit)break;
        const item=bucket.shift();
        if(!item)continue;
        const key=`${item?.provider || ""}:${item?.item_id || ""}`;
        if(used.has(key))continue;
        used.add(key);
        result.push(item);
      }
      if(++cursor>limit*2)break;
    }
    return result;
  }

  let homeFeedPool = [];
  let homeFeedCursor = 0;
  let homeFeedObserver = null;
  let homeFeedData = null;
  let homeFeedMode = "snapshot";

  function shuffleHome(items) {
    const out=[...items];
    for(let i=out.length-1;i>0;i--){
      const buf=new Uint32Array(1);
      crypto.getRandomValues(buf);
      const j=buf[0]%(i+1);
      [out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  }

  function buildRandomHomePool(shelves) {
    const seen=new Set(), rows=[];
    for(const items of Object.values(shelves||{})){
      for(const item of Array.isArray(items)?items:[]){
        const key=`${item?.provider||""}:${item?.item_id||""}`;
        if(!item?.item_id || seen.has(key)) continue;
        if(String(item?.provider||"").toLowerCase()!=="cjdropshipping") continue;
        seen.add(key);
        rows.push(item);
      }
    }
    for(const item of window.BoomNet?.merchantProducts?.()||[]){
      const key=`${item?.provider||""}:${item?.item_id||""}`;
      if(!item?.item_id || seen.has(key) || item?.promotion_eligible!==true) continue;
      seen.add(key);
      rows.push(item);
    }
    const ranked = window.BoomNet?.rankFeed ? window.BoomNet.rankFeed(rows) : shuffleHome(rows);
    return ranked;
  }

  function appendHomeFeedBatch() {
    const grid=document.querySelector("#hd-home-random-grid");
    const sentinel=document.querySelector("#hd-home-random-more");
    if(!grid || !sentinel) return;
    const batch=homeFeedPool.slice(homeFeedCursor,homeFeedCursor+48);
    if(batch.length){
      grid.insertAdjacentHTML("beforeend",batch.map(shelfCard).join(""));
      homeFeedCursor+=batch.length;
    }
    const remaining=Math.max(0,homeFeedPool.length-homeFeedCursor);
    const strong=sentinel.querySelector("strong");
    if(strong)strong.textContent=remaining? `Loading more · ${remaining.toLocaleString()} left` : "You reached the end of this mix.";
    if(!remaining){
      sentinel.classList.add("done");
      homeFeedObserver?.disconnect();
    }
  }

  function setupHomeFeedObserver() {
    const sentinel=document.querySelector("#hd-home-random-more");
    if(!sentinel || !("IntersectionObserver" in window)) return;
    homeFeedObserver?.disconnect();
    homeFeedObserver=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) appendHomeFeedBatch();
    },{rootMargin:"900px 0px"});
    homeFeedObserver.observe(sentinel);
  }

  function renderMarketShelvesData(data, mode = "live") {
    const root = $("#hd-shelves-root");
    const counter = $("#hd-shelf-count");
    const existingGrid = document.querySelector("#hd-home-random-grid");
    if (!root && !existingGrid) return false;
    const shelves = data?.shelves || {};
    const hasProducts = Object.values(shelves).some(items => Array.isArray(items) && items.length);
    if (!hasProducts) return false;

    window.HuntMarketShelves = data;
    window.dispatchEvent(new CustomEvent("hunt:shelves", {detail:data}));

    const renderedKeys = new Set();
    const limit = shelfItemLimit();
    const html = orderedShelfDepartments().map(([department, slugs]) => {
      const sections = slugs.map(slug => {
        const meta = shelfMeta[slug] || (window.HuntCore?.categoryDefs?.[slug] ? [window.HuntCore.categoryDefs[slug].title, slug] : [slug.replace(/-/g," "), slug]);
        let items = Array.isArray(shelves[slug]) ? shelves[slug].filter(item => String(item?.provider || "").toLowerCase() === "cjdropshipping" && isShelfFit(slug, item)) : [];
        if (!meta || items.length < 4) return "";
        const selected = selectShelfItems(items, limit, renderedKeys);
        const cards = selected.map(shelfCard).join("");
        const parent = window.HuntCore
          ? Object.entries(window.HuntCore.departmentSubcategories || {}).find(([,items]) => Array.isArray(items) && items.includes(slug))?.[0]
          : null;
        const categoryHref = parent
          ? `category.html?c=${encodeURIComponent(parent)}&sub=${encodeURIComponent(slug)}`
          : (window.HuntCore ? window.HuntCore.categoryUrl(meta[1]) : `category.html?c=${encodeURIComponent(meta[1])}`);
        return `<section class="hd-market-shelf"><div class="hd-market-shelf-head"><div><small>${mode === "live" ? "LIVE CATEGORY" : "VERIFIED CATALOG"}</small><h3>${esc(meta[0])}</h3><p>Real catalog picks with live product recheck before checkout.</p></div><a href="${esc(categoryHref)}">View all →</a></div><div class="hd-shelf-track" role="list" tabindex="0" aria-label="${esc(meta[0])} products">${cards}</div></section>`;
      }).filter(Boolean).join("");
      if (!sections) return "";
      return `<section class="hd-shelf-department"><div class="hd-shelf-department-head"><span>DEPARTMENT</span><h2>${esc(department)}</h2></div>${sections}</section>`;
    }).join("");

    homeFeedData=data;
    homeFeedMode=mode;
    homeFeedPool=buildRandomHomePool(shelves);
    homeFeedCursor=0;
    homeFeedObserver?.disconnect();
    if (root) {
      root.innerHTML = `
        <section class="hd-home-random-feed">
          <div class="hd-market-shelf-head">
            <div>
              <small>DISCOVER EVERYTHING</small>
              <h2>Something different every time.</h2>
              <p>Women, men, kids, beauty, tech, home, accessories and more — fully mixed for discovery.</p>
            </div>
            <button type="button" class="hd-home-remix" id="hd-home-remix">Remix</button>
          </div>
          <div class="hd-home-random-grid" id="hd-home-random-grid" role="list"></div>
          <div class="hd-home-random-more" id="hd-home-random-more" aria-live="polite"><span></span><strong>Loading more…</strong></div>
        </section>`;
    } else {
      existingGrid.innerHTML = "";
      document.querySelector("#hd-home-random-more")?.classList.remove("done");
    }
    appendHomeFeedBatch();
    setupHomeFeedObserver();
    document.querySelector("#hd-home-remix")?.addEventListener("click",()=>{
      homeFeedPool=window.BoomNet?.remix ? window.BoomNet.remix(homeFeedPool) : shuffleHome(homeFeedPool);
      homeFeedCursor=0;
      const grid=document.querySelector("#hd-home-random-grid");
      if(grid)grid.innerHTML="";
      const sentinel=document.querySelector("#hd-home-random-more");
      sentinel?.classList.remove("done");
      appendHomeFeedBatch();
      setupHomeFeedObserver();
    });
    const cjKeys = new Set();
    Object.values(shelves).forEach(rows => (Array.isArray(rows) ? rows : []).forEach(item => {
      if (String(item?.provider || "").toLowerCase() === "cjdropshipping" && item?.item_id) cjKeys.add(String(item.item_id));
    }));
    const label = mode === "live" ? "LIVE CATALOG" : "CATALOG READY";
    if (counter) {
      counter.textContent = label;
      counter.title = "HUNT curates the active catalog dynamically by relevance, freshness and country readiness.";
    }
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

  const SHELF_LKG_KEY = "hunt_cj_shelves_lkg_v1";
  const SHELF_LKG_TTL_MS = 6 * 60 * 60 * 1000;

  function readShelfLkg() {
    try {
      const row = JSON.parse(localStorage.getItem(SHELF_LKG_KEY) || "null");
      if (!row?.saved_at || !row?.data?.shelves) return null;
      if (Date.now() - Number(row.saved_at) > SHELF_LKG_TTL_MS) return null;
      return row.data;
    } catch { return null; }
  }

  function writeShelfLkg(data) {
    try {
      if (!data?.shelves || Number(data?.visible_product_count || 0) <= 0) return;
      const shelves = {};
      for (const [slug, rows] of Object.entries(data.shelves)) {
        shelves[slug] = (Array.isArray(rows) ? rows : []).slice(0, 18);
      }
      localStorage.setItem(SHELF_LKG_KEY, JSON.stringify({
        saved_at: Date.now(),
        data: {...data, shelves, _hunt_lkg:true}
      }));
    } catch {}
  }

  async function loadMarketShelves() {
    const root = $("#hd-shelves-root");
    const counter = $("#hd-shelf-count");
    const homeGrid = document.querySelector("#hd-home-random-grid");
    if (!root && !homeGrid) return;

    let renderedFallback = false;
    let snapshotData = null;
    let baseData = null;

    try {
      const snapshotRes = await fetch("cj-launch-home.json?v=30k1", {cache:"force-cache"});
      if (snapshotRes.ok) {
        snapshotData = await snapshotRes.json();
        baseData = snapshotData;
        renderedFallback = renderMarketShelvesData(snapshotData, "snapshot");
      }
    } catch {}

    if (snapshotData?.launch_authoritative === true && renderedFallback) return;

    const lkg = readShelfLkg();
    if (lkg?.shelves) {
      baseData = baseData ? mergeShelfData(baseData, lkg) : lkg;
      renderedFallback = renderMarketShelvesData(baseData, "cached") || renderedFallback;
      if (counter) counter.title = "Live refresh pending; showing the last known good catalog snapshot.";
    }

    try {
      const res = await fetchWithTimeout(publicApiUrl("hunt-storefront") + "?shelves=1", {
        cache:"no-store",
        headers: publicApiHeaders()
      }, 15000);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Market shelves unavailable");
      const merged = baseData ? mergeShelfData(baseData, data) : data;
      writeShelfLkg(merged);
      if (snapshotData && renderedFallback) {
        // Fast snapshot first, then one quality-ranked hybrid refresh when live suppliers return.
        // This keeps first paint fast without permanently hiding better live inventory.
        renderMarketShelvesData(merged, "hybrid");
        window.dispatchEvent(new CustomEvent("hunt:shelves-refreshed", {detail:merged}));
      } else {
        renderMarketShelvesData(merged, "live");
      }
    } catch (err) {
      if (renderedFallback) {
        if (counter) counter.title = "Live refresh is temporarily unavailable; showing verified catalog products.";
        return;
      }
      const msg = err?.name === "AbortError"
        ? "Live catalog is taking longer than expected. Try again shortly."
        : (err.message || "Market shelves unavailable");
      const target = root || homeGrid;
      if (target) target.innerHTML = `<div class="hd-shelf-loading glass">${esc(msg)}</div>`;
      if (counter) counter.textContent = "WAITING";
    }
  }

  function renderProviderNetwork(providers) {
    const host = $("#hd-provider-badges");
    if (!host) return;
    const items = (Array.isArray(providers) ? providers : []).filter(item => String(item?.provider || "").toLowerCase() === "cjdropshipping");
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
    const results = (data.results || []).filter(item => String(item?.provider || "").toLowerCase() === "cjdropshipping");
    searchItems = results;
    const states = (data.providers || []).map(p => p.provider + ": " + p.state).join(" · ");
    section.hidden = false;
    status.textContent = results.length
      ? "Curated discovery results · " + states
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
    const query=String(event.currentTarget.value||"").trim();
    if(query) location.href="search.html?q="+encodeURIComponent(query);
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