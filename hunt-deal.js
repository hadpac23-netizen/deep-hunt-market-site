(() => {
  let dict = HuntI18n.start("deal");
  let allDeals = [];
  let activeCategory = "all";
  let providerCheckout = {};
  let checkoutPolicy = {mode:"ONSITE_FIRST", public_checkout_enabled:false};

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
    const cta = canCheckoutHere
      ? `<a class="hd-retailer" href="/checkout/${encodeURIComponent(deal.id)}">${esc(dict.onsiteCheckout || "Buy on HUNT DEAL")} →</a>`
      : `<button class="hd-retailer" type="button" disabled title="${esc(checkout.note || checkoutPolicy.rule || "")}">${esc(dict.onsitePending || "On-site checkout pending")}</button>`;
    return `
      <article class="hd-deal-card" data-category="${category}" data-search="${esc((c.title||"")+" "+(c.provider||""))}">
        <div class="hd-deal-top"><span class="hd-verdict ${verdict==="SELL"?"sell":""}">${esc(verdict)}</span><span class="hd-heart">♡</span></div>
        <div class="hd-product-visual" aria-hidden="true">${esc(glyphFor(c.provider))}</div>
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
    count.textContent = items.length ? items.length + " LIVE" : "WAITING";
    grid.innerHTML = items.map(item => {
      const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
        ? `<img class="hd-catalog-image" src="${esc(item.image_url)}" alt="${esc(item.title || "Catalog product")}" loading="lazy">`
        : '<div class="hd-catalog-image hd-catalog-placeholder">◇</div>';
      const base = item.price_amount == null ? "—" : money(item.price_amount, item.currency || "USD");
      const gaps = (item.gaps || []).slice(0,2).map(x => `<li>${esc(x)}</li>`).join("");
      return `
        <article class="hd-catalog-card glass">
          <div class="hd-catalog-media">${image}<span class="hd-catalog-badge">${esc(item.verdict || "CATALOG")}</span></div>
          <div class="hd-catalog-body">
            <div class="hd-provider">${esc(item.provider || "Provider")} · LIVE CATALOG</div>
            <h3>${esc(item.title || "Catalog product")}</h3>
            <div class="hd-catalog-price"><small>${esc(dict.catalogBase || "Supplier base")}</small><strong>${base}</strong></div>
            <ul class="hd-catalog-gaps">${gaps}</ul>
            <button class="hd-retailer" type="button" disabled>${esc(dict.catalogPending || "Checkout activation pending")}</button>
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
        body: JSON.stringify({query: clean, limit: 8})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Live search unavailable");
      renderLiveSearch(data);
    } catch (err) {
      if (status) status.textContent = err.message || "Live search unavailable";
      const grid = $("#hd-search-grid");
      if (grid) grid.innerHTML = "";
    }
  }

  document.querySelectorAll("[data-hunt-query]").forEach(btn => {
    btn.addEventListener("click", () => {
      const query = String(btn.dataset.huntQuery || "").trim();
      if (!query) return;
      const input = $("#hd-search-input");
      if (input) input.value = query;
      runLiveSearch(query);
      window.setTimeout(() => {
        $("#live-search")?.scrollIntoView({behavior:"smooth", block:"start"});
      }, 80);
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

  load().catch(err => {
    const empty = $("#hd-empty");
    if (empty) { empty.hidden = false; empty.querySelector("p").textContent = err.message; }
  });
})();