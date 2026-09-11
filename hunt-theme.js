(() => {
  const THEME_KEY = "hunt_theme_v1";
  const root = document.documentElement;

  function currentTheme() {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    const value = theme === "dark" ? "dark" : "light";
    root.dataset.huntTheme = value;
    localStorage.setItem(THEME_KEY, value);
    document.querySelectorAll("[data-hunt-theme-toggle]").forEach(btn => {
      btn.textContent = value === "dark" ? "☀" : "☾";
      btn.setAttribute("aria-label", value === "dark" ? "Use light theme" : "Use dark theme");
      btn.title = value === "dark" ? "Light mode" : "Dark mode";
    });
  }

  function installToggle() {
    document.querySelectorAll(".hd-tools").forEach(host => {
      if (host.querySelector("[data-hunt-theme-toggle]")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hd-theme-toggle";
      btn.dataset.huntThemeToggle = "1";
      btn.addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));
      const lang = host.querySelector(".hd-lang");
      if (lang) lang.after(btn);
      else host.prepend(btn);
    });
    applyTheme(currentTheme());
  }  function uniqueProducts(shelves) {
    const seen = new Set();
    const out = [];
    Object.entries(shelves || {}).forEach(([slug, rows]) => {
      (Array.isArray(rows) ? rows : []).forEach(item => {
        const key = `${item?.provider || ""}:${item?.item_id || ""}`;
        const title = String(item?.title || "");
        if (!item?.item_id || seen.has(key) || !title) return;
        if (/\b(temu\s*&\s*tk|tmeu|tk\s*only|supports?\s+pickup|self[- ]?pickup|shipment\s+from\s+walmart|logistics\s+only|no provide self pick-up)\b/i.test(title)) return;
        const curatedCategory = item?.curation_source && item?.category ? String(item.category) : "";
        const inferred = curatedCategory || window.HuntCore?.inferCategory?.(item) || item?.category || "";
        if (inferred && !["women","men","kids"].includes(slug) && inferred !== slug) return;
        if (slug === "kids" && !/\b(baby|newborn|toddler|kids?|child|children|boys?|girls?|youth|infant)\b/i.test(title)) return;
        seen.add(key);
        out.push({...item, _slug: slug});
      });
    });
    return out;
  }

  function money(item) {
    const value = Number(item?.price_amount);
    if (!Number.isFinite(value) || value <= 0) return "View product";
    return window.HuntCore?.money(value, item.currency || "USD") || `$${value.toFixed(2)}`;
  }

  function card(item) {
    const H = window.HuntCore;
    if (!H) return "";
    const href = H.productUrl(item);
    const img = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${H.esc(item.image_url)}" alt="${H.esc(item.title || "Product")}" loading="lazy">`
      : '<div class="hd-wow-image-placeholder">H</div>';
    const meta = H.categoryDefs?.[item._slug]?.title || item.provider || "";
    return `<article class="hd-shop-card">
      <a class="hd-shop-card-media" href="${H.esc(href)}">${img}</a>
      <div class="hd-shop-card-body">
        <a class="hd-shop-card-title" href="${H.esc(href)}">${H.esc(item.title || "Product")}</a>
        <div class="hd-shop-card-price">${H.esc(money(item))}</div>
        <div class="hd-shop-card-meta">${H.esc(meta)}</div>
      </div>
    </article>`;
  }  function renderMore(data) {
    const shelves = data?.shelves || {};
    const all = uniqueProducts(shelves);
    if (!all.length) return;

    let host = document.querySelector("#hd-shop-more");
    if (!host) {
      host = document.createElement("section");
      host.id = "hd-shop-more";
      host.className = "hd-shop-more";
      document.querySelector("#shop")?.after(host);
    }

    const picks = [];
    const bySlug = new Map();
    all.forEach(item => {
      if (!bySlug.has(item._slug)) bySlug.set(item._slug, []);
      bySlug.get(item._slug).push(item);
    });

    const order = [
      "women","men","beauty","home","tech","kids","shoes","bags","jewelry",
      "kitchen","travel","pets","sports","office","toys"
    ];
    const limit = window.matchMedia?.("(max-width: 760px)")?.matches ? 8 : 12;
    for (let round = 0; round < 3 && picks.length < limit; round += 1) {
      for (const slug of order) {
        const row = bySlug.get(slug)?.[round];
        if (row) picks.push(row);
        if (picks.length >= limit) break;
      }
    }

    host.innerHTML = `
      <div class="hd-shop-more-head">
        <div>
          <small>MORE TO EXPLORE</small>
          <h3>Keep discovering</h3>
          <p>More real products from the connected catalog.</p>
        </div>
      </div>
      <div class="hd-shop-more-grid">${picks.map(card).join("")}</div>`;
  }  function simplifyCopy() {
    const h1 = document.querySelector(".hd-hero h1");
    if (h1) h1.innerHTML = 'Shop normally.<br><em>Or let HUNT hunt for you.</em>';

    const heroCopy = document.querySelector(".hd-hero-copy>p");
    if (heroCopy) {
      heroCopy.textContent = "Browse verified products as a normal store, or give BOOM a shopping mission and let HUNT compare real offers, promotions, and better market options.";
    }

    const kicker = document.querySelector(".hd-hero .hd-kicker");
    if (kicker) kicker.textContent = "HUNT DEAL · STORE + DECISION INTELLIGENCE";

    const mainHead = document.querySelector("#shop .hd-section-head h2");
    if (mainHead) mainHead.textContent = "Popular departments";

    const mainCopy = document.querySelector("#shop .hd-section-head p");
    if (mainCopy) mainCopy.textContent = "Browse real products by category. Open any item for details and options.";
  }

  applyTheme(currentTheme());

  document.addEventListener("DOMContentLoaded", () => {
    installToggle();
    simplifyCopy();
  });

  if (document.readyState !== "loading") {
    installToggle();
    simplifyCopy();
  }

  window.addEventListener("hunt:shelves", event => renderMore(event.detail));
  if (window.HuntMarketShelves) renderMore(window.HuntMarketShelves);
})();