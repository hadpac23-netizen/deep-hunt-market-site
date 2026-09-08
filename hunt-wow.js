(() => {
  const H = window.HuntCore;
  if (!H) return;

  const worlds = [
    ["women","Fashion","Women's fashion","01"],
    ["beauty","Beauty","Beauty & skincare","02"],
    ["jewelry","Jewelry","Jewelry & style","03"],
    ["home","Home","Home & living","04"],
    ["kitchen","Kitchen","Kitchen finds","05"],
    ["tech","Tech","Phone & tech","06"],
    ["gaming","Gaming","Gaming accessories","07"],
    ["travel","Travel","Travel essentials","08"],
    ["kids","Kids","Kids & youth","09"],
    ["toys","Toys","Toys & play","10"],
    ["pets","Pets","Pet finds","11"],
    ["office","Office","Office & desk","12"]
  ];

  const money = (value, currency="USD") => {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "LIVE SOURCE";
    return H.money(Number(value), currency);
  };

  function flatUnique(shelves) {
    const seen = new Set();
    const out = [];
    Object.values(shelves || {}).forEach(rows => {
      (Array.isArray(rows) ? rows : []).forEach(item => {
        const key = `${item?.provider || ""}:${item?.item_id || ""}`;
        if (!item?.item_id || seen.has(key)) return;
        seen.add(key);
        out.push(item);
      });
    });
    return out;
  }

  function productCard(item, label) {
    const href = H.productUrl(item);
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${H.esc(item.image_url)}" alt="${H.esc(item.title || "Product")}" loading="lazy">`
      : `<div class="hd-wow-image-placeholder">H</div>`;
    const hasPrice = Number.isFinite(Number(item.price_amount)) && Number(item.price_amount) > 0;
    return `<article class="hd-wow-product">
      <a class="hd-wow-product-media" href="${H.esc(href)}">
        ${image}
        <span>${H.esc(label)}</span>
      </a>
      <div class="hd-wow-product-body">
        <small>${H.esc(item.provider || "LIVE SOURCE")}</small>
        <a href="${H.esc(href)}">${H.esc(item.title || "Product")}</a>
        <div class="hd-wow-price">
          <strong>${money(item.price_amount, item.currency || "USD")}</strong>
          <em>${hasPrice ? "supplier base" : "open product"}</em>
        </div>
      </div>
    </article>`;
  }

  function render(data) {
    const shelves = data?.shelves || {};
    const all = flatUnique(shelves);
    if (!all.length) return;

    const providerCount = new Set(all.map(x => x.provider).filter(Boolean)).size;
    const categoryCount = Object.values(shelves).filter(rows => Array.isArray(rows) && rows.length).length;
    const liveCount = Number(data.visible_product_count || all.length);

    const hero = document.querySelector(".hd-hero-copy");
    if (hero && !hero.querySelector(".hd-live-proof")) {
      const proof = document.createElement("div");
      proof.className = "hd-live-proof";
      proof.innerHTML = `
        <div><strong data-wow-live>${liveCount.toLocaleString()}</strong><span>LIVE PRODUCTS</span></div>
        <div><strong data-wow-providers>${providerCount}</strong><span>LIVE SOURCES</span></div>
        <div><strong data-wow-categories>${categoryCount}</strong><span>SHOPPING WORLDS</span></div>`;
      const intro = hero.querySelector(":scope > p");
      intro?.after(proof);
    } else {
      const live = hero?.querySelector("[data-wow-live]");
      const providers = hero?.querySelector("[data-oow-providers]");
      const categories = hero?.querySelector("[data-wow-categories]");
      if (live) live.textContent = liveCount.toLocaleString();
      if (providers) providers.textContent = String(providerCount);
      if (categories) categories.textContent = String(categoryCount);
    }

    let showcase = document.querySelector("#hd-wow-showcase");
    if (!showcase) {
      showcase = document.createElement("section");
      showcase.id = "hd-wow-showcase";
      showcase.className = "hd-wow-showcase";
      document.querySelector("#live-market")?.before(showcase);
    }

    const worldCards = worlds.map(([slug,kicker,title,num]) => {
      const count = Array.isArray(shelves[slug]) ? shelves[slug].length : 0;
      if (!count) return "";
      return `<a class="hd-wow-world" href="${H.esc(H.categoryUrl(slug))}" data-world="${H.esc(slug)}">
        <span>${num}</span><small>${H.esc(kicker)}</small><strong>${H.esc(title)}</strong><em>${count} live products →</em>
      </a>`;
    }).join("");

    const cj = all.filter(x => String(x.provider).toLowerCase().includes("cj")).slice(0,10);
    const priced = all
      .filter(x => Number.isFinite(Number(x.price_amount)) && Number(x.price_amount) > 0)
      .sort((a,b) => Number(a.price_amount) - Number(b.price_amount))
      .slice(0,10);

    showcase.innerHTML = `
      <div class="hd-wow-head">
        <div>
          <div class="hd-kicker hd-kicker-small">HUNT MARKET · LIVE SUPPLIERS · REAL PRODUCTS</div>
          <h2>One marketplace. A world of real products.</h2>
          <p>Explore live supplier catalogs by world, then open any product for variants, source price and current provider data.</p>
        </div>
        <div class="hd-wow-live"><i></i>${liveCount.toLocaleString()} LIVE</div>
      </div>
      <div class="hd-wow-worlds">${worldCards}</div>
      ${cj.length ? `<div class="hd-wow-rail-head"><div><small>CONNECTED NOW</small><h3>Fresh from CJdropshipping</h3></div><span>LIVE API</span></div><div class="hd-wow-track">${cj.map(x => productCard(x,"CJ LIVE")).join("")}</div>` : ""}
      ${priced.length ? `<div class="hd-wow-rail-head value"><div><small>VALUE RADAR</small><h3>Low source-cost discoveries</h3></div><span>SUPPLIER BASE</span></div><div class="hd-wow-track">${priced.map(x => productCard(x,"VALUE FIND")).join("")}</div>` : ""}
    `;
  }

  window.addEventListener("hunt:shelves", event => render(event.detail));
  if (window.HuntMarketShelves) render(window.HuntMarketShelves);
})();