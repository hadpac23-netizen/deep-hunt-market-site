(() => {
  const H = window.HuntCore;
  if (!H) return;

  const ACTIONS_KEY = "hunt_local_product_actions_v1";
  const PROGRESS_KEY = "hunt_attraction_progress_v1";
  const PRICE_KEY = "hunt_price_watch_v1";
  const CHALLENGE_KEY = "hunt_challenge_v1";
  const blockedSurface = /\b(sexy|thong|g-string|lingerie|adult|erotic)\b/i;
  let latestData = null;

  const safeJson = (key, fallback = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const itemKey = item => `${item?.provider || ""}:${item?.item_id || ""}`;
  const hasImage = item => typeof item?.image_url === "string" && item.image_url.startsWith("https://");
  const hasPrice = item => Number.isFinite(Number(item?.price_amount)) && Number(item.price_amount) > 0;
  const allowedItem = item => Boolean(item?.item_id && item?.title && hasImage(item) && hasPrice(item) && !blockedSurface.test(item.title));
  function flatUnique(shelves) {
    const seen = new Set(), out = [];
    Object.values(shelves || {}).forEach(rows => {
      (Array.isArray(rows) ? rows : []).forEach(item => {
        const key = itemKey(item);
        if (!allowedItem(item) || seen.has(key)) return;
        seen.add(key);
        out.push(item);
      });
    });
    return out;
  }

  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i++) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function dayKey() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  }
  function productCard(item, badge) {
    const verified = item?.availability_verified === true;
    const basis = String(item?.price_basis || "").toUpperCase();
    const priceNote = basis === "SUPPLIER_BASE" ? "supplier base" : basis === "MARKETPLACE_RETAIL" ? "marketplace price" : "source price";
    return `<article class="hd-attract-product" role="listitem">
      <a class="hd-attract-media" href="${H.esc(H.productUrl(item))}">
        <img src="${H.esc(item.image_url)}" alt="${H.esc(item.title)}" loading="lazy">
        <span>${H.esc(badge)}</span>
      </a>
      <div class="hd-attract-product-copy">
        <small>${H.esc(item.provider || "SOURCE")} · ${verified ? "VERIFIED" : "CATALOG"}</small>
        <a href="${H.esc(H.productUrl(item))}">${H.esc(item.title)}</a>
        <div><strong>${H.money(Number(item.price_amount), item.currency || "USD")}</strong><em>${H.esc(priceNote)}</em></div>
      </div>
    </article>`;
  }

  function pickDaily(shelves, limit = 8) {
    const priority = ["swimwear","women","dresses","bags","shoes","beauty","skincare","accessories","jewelry"];
    const pool = [];
    const seen = new Set();
    priority.forEach(slug => {
      (shelves?.[slug] || []).forEach(item => {
        const key = itemKey(item);
        if (!allowedItem(item) || seen.has(key)) return;
        seen.add(key);
        pool.push(item);
      });
    });
    flatUnique(shelves).forEach(item => {
      const key = itemKey(item);
      if (!seen.has(key)) pool.push(item);
    });
    return pool
      .map(item => ({item, rank: hash(dayKey() + "|" + itemKey(item))}))
      .sort((a,b) => a.rank - b.rank)
      .slice(0, limit)
      .map(row => row.item);
  }

  function words(value) {
    const stop = new Set(["find","me","show","want","under","below","best","for","with","the","and","a","an","my","please","usd","dollar","dollars"]);
    return String(value || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(x => x.length > 2 && !stop.has(x));
  }

  function parseBudget(value) {
    const hits = String(value || "").match(/(?:\$|usd\s*)?(\d{1,5}(?:\.\d{1,2})?)/i);
    return hits ? Number(hits[1]) : null;
  }
  function challengePicks(query, shelves) {
    const tokens = words(query);
    const budget = parseBudget(query);
    const rows = flatUnique(shelves).map(item => {
      const title = String(item.title || "").toLowerCase();
      const category = String(H.inferCategory?.(item) || item.category || "").toLowerCase();
      const price = Number(item.price_amount);
      let score = item.availability_verified === true ? 6 : 0;
      tokens.forEach(token => {
        if (title.includes(token)) score += 10;
        if (category.includes(token)) score += 7;
      });
      if (budget !== null) score += price <= budget ? 8 : -Math.min(18, Math.round((price - budget) / Math.max(1, budget) * 20));
      if (String(item.gender || "").toLowerCase() === "women") score += 1;
      return {item, score, price};
    }).filter(row => row.score > 0).sort((a,b) => b.score - a.score || a.price - b.price);

    const best = rows[0]?.item;
    const within = rows.filter(row => budget === null || row.price <= budget);
    const value = [...within].sort((a,b) => a.price - b.price || b.score - a.score).find(row => itemKey(row.item) !== itemKey(best))?.item;
    const verified = rows.find(row => row.item.availability_verified === true && ![best,value].some(x => itemKey(x) === itemKey(row.item)))?.item;
    return [best, value, verified || rows.find(row => ![best,value].some(x => itemKey(x) === itemKey(row.item)))?.item].filter(Boolean);
  }
  function readProgress() {
    return {...{challenges:0, searches:0, saves:0}, ...safeJson(PROGRESS_KEY, {})};
  }

  function writeProgress(next) {
    saveJson(PROGRESS_KEY, next);
    renderLevel();
  }

  function levelInfo() {
    const p = readProgress();
    const actions = Math.min(5, p.searches || 0) + Math.min(10, p.challenges || 0) + Math.min(10, p.saves || 0);
    if (actions >= 20) return {name:"Elite", floor:20, ceil:20, score:actions};
    if (actions >= 10) return {name:"Insider", floor:10, ceil:20, score:actions};
    if (actions >= 4) return {name:"Hunter", floor:4, ceil:10, score:actions};
    return {name:"Explorer", floor:0, ceil:4, score:actions};
  }

  function renderLevel() {
    const host = document.querySelector("#hd-attract-level");
    if (!host) return;
    const info = levelInfo();
    const pct = info.ceil === info.floor ? 100 : Math.max(0, Math.min(100, ((info.score - info.floor) / (info.ceil - info.floor)) * 100));
    const next = info.name === "Explorer" ? "Hunter" : info.name === "Hunter" ? "Insider" : info.name === "Insider" ? "Elite" : "Top discovery level";
    host.innerHTML = `<small>HUNT LEVEL</small><strong>${H.esc(info.name)}</strong>
      <p>Discovery level based on searches, saves and challenges — never on how much you spend.</p>
      <div class="hd-attract-progress" aria-label="Progress toward ${H.esc(next)}"><i style="width:${pct.toFixed(0)}%"></i></div>
      <span>${info.name === "Elite" ? "Top discovery level reached" : `${Math.max(0, info.ceil - info.score)} actions to ${next}`}</span>`;
  }
  function priceWatchRows(shelves) {
    const actions = safeJson(ACTIONS_KEY, {});
    const watch = safeJson(PRICE_KEY, {});
    const products = new Map(flatUnique(shelves).map(item => [itemKey(item), item]));
    const drops = [];
    Object.entries(actions).forEach(([key, row]) => {
      if (!row?.saved) return;
      const item = products.get(key);
      if (!item || !hasPrice(item)) return;
      const current = Number(item.price_amount);
      const currency = item.currency || "USD";
      const previous = watch[key];
      if (previous && previous.currency === currency && Number(previous.last_price) > current) {
        drops.push({item, from:Number(previous.last_price), to:current, currency});
      }
      watch[key] = {last_price:current, currency, seen_at:new Date().toISOString()};
    });
    saveJson(PRICE_KEY, watch);
    return drops.sort((a,b) => (b.from - b.to) - (a.from - a.to)).slice(0,3);
  }

  function renderPriceWatch(shelves) {
    const host = document.querySelector("#hd-attract-price");
    if (!host) return;
    const drops = priceWatchRows(shelves);
    if (!drops.length) {
      host.innerHTML = `<small>PRICE WATCH</small><strong>No tracked source-price change yet</strong>
        <p>Save products and HUNT will compare their source prices on future visits. We do not invent discounts.</p>
        <a href="#for-you">Browse & save →</a>`;
      return;
    }
    host.innerHTML = `<small>PRICE WATCH</small><strong>${drops.length} saved price ${drops.length === 1 ? "move" : "moves"}</strong>
      <p>Observed from the same source and currency since your earlier visit.</p>
      <div class="hd-attract-drops">${drops.map(row => `
        <a href="${H.esc(H.productUrl(row.item))}">
          <span>${H.esc(row.item.title)}</span>
          <b><s>${H.money(row.from,row.currency)}</s> ${H.money(row.to,row.currency)}</b>
        </a>`).join("")}</div>`;
  }

  function ensureHost() {
    let host = document.querySelector("#hd-attraction-engine");
    if (host) return host;
    host = document.createElement("section");
    host.id = "hd-attraction-engine";
    host.className = "hd-attraction-engine";
    host.setAttribute("aria-labelledby","hd-attraction-title");
    const anchor = document.querySelector("#hd-wow-showcase") || document.querySelector("#shop");
    anchor?.before(host);
    return host;
  }

  function shellHtml(drop) {
    return `<div class="hd-attract-head">
      <div><small>HUNT PULSE · HONEST DISCOVERY</small><h2 id="hd-attraction-title">A reason to come back — without fake urgency.</h2>
      <p>Daily curation, smart challenges, truthful price watching and lightweight discovery levels.</p></div>
      <span>NO SPIN · NO FAKE COUNTDOWN</span>
    </div>
    <section class="hd-attract-drop" aria-labelledby="hd-drop-title">
      <div class="hd-attract-section-head"><div><small>HUNT DROP · ${H.esc(dayKey())}</small><h3 id="hd-drop-title">Today's curated finds</h3>
      <p>A stable daily edit from the current catalog. Availability is labeled per product.</p></div><a href="category.html?c=women">Shop Women →</a></div>
      <div class="hd-attract-track" role="list">${drop.map(item => productCard(item, "DAILY DROP")).join("")}</div>
    </section>
    <div class="hd-attract-grid">
      <section class="hd-attract-challenge">
        <small>HUNT CHALLENGE</small><h3>Tell HUNT what you want.</h3>
        <p>Example: “black bag under $50” or “swim cover-up under $30”.</p>
        <form id="hd-attract-form"><input id="hd-attract-query" maxlength="120" placeholder="What should HUNT find?" aria-label="Shopping challenge"><button type="submit">HUNT it</button></form>
        <div id="hd-attract-results" class="hd-attract-results" aria-live="polite"></div>
      </section>
      <section id="hd-attract-price" class="hd-attract-side"></section>
      <section id="hd-attract-level" class="hd-attract-side"></section>
    </div>`;
  }

  function renderChallenge(query, shelves) {
    const host = document.querySelector("#hd-attract-results");
    if (!host) return;
    const picks = challengePicks(query, shelves);
    if (!picks.length) {
      host.innerHTML = "<p class=\"hd-attract-empty\">No strong catalog match yet. Try a product type, style or budget.</p>";
      return;
    }
    const labels = ["BEST MATCH","BEST VALUE","STRONG ALTERNATIVE"];
    host.innerHTML = `<div class="hd-attract-result-note">Prototype ranking uses current catalog facts and your words — no fabricated AI confidence.</div>
      <div class="hd-attract-result-grid">${picks.map((item,index) => productCard(item, labels[index] || "MATCH")).join("")}</div>`;
  }

  function bind(shelves) {
    const form = document.querySelector("#hd-attract-form");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "true";
      const input = document.querySelector("#hd-attract-query");
      const saved = safeJson(CHALLENGE_KEY, null);
      if (saved?.query && input) input.value = saved.query;
      form.addEventListener("submit", event => {
        event.preventDefault();
        const query = String(input?.value || "").trim().slice(0,120);
        if (!query) return;
        saveJson(CHALLENGE_KEY,{query,updated_at:new Date().toISOString()});
        const p = readProgress();
        p.challenges = Number(p.challenges || 0) + 1;
        writeProgress(p);
        renderChallenge(query, shelves);
        window.dispatchEvent(new CustomEvent("hunt:challenge",{detail:{query}}));
      });
      if (saved?.query) renderChallenge(saved.query, shelves);
    }
  }

  function render(data) {
    latestData = data;
    const shelves = data?.shelves || {};
    const drop = pickDaily(shelves);
    if (!drop.length) return;
    const host = ensureHost();
    host.innerHTML = shellHtml(drop);
    bind(shelves);
    renderPriceWatch(shelves);
    renderLevel();
  }
  window.addEventListener("hunt:shelves", event => render(event.detail));
  window.addEventListener("hunt:shopping-action", event => {
    if (event.detail?.saved) {
      const p = readProgress();
      p.saves = Number(p.saves || 0) + 1;
      writeProgress(p);
    }
    if (latestData) renderPriceWatch(latestData.shelves || {});
  });
  window.addEventListener("hunt:search", () => {
    const p = readProgress();
    p.searches = Number(p.searches || 0) + 1;
    writeProgress(p);
  });

  if (window.HuntMarketShelves) render(window.HuntMarketShelves);
})();