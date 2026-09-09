(() => {
  const H = window.HuntCore;
  if (!H) return;

  const $ = q => document.querySelector(q);
  const modeKey = "hunt_shop_mode_v2";
  let lastData = null;
  let recentSearchTerms = [];
  const recentActionKeys = new Set();

  const departments = [
    {title:"Women · Clothing", slug:"women", href:"category.html?c=women", items:["women","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","socks","swimwear"], womenOnly:true},
    {title:"Women · Shoes & Accessories", slug:"women", href:"category.html?c=women&sub=shoes", items:["shoes","bags","jewelry","accessories","hats"], womenOnly:true},
    {title:"Beauty & Fragrance", slug:"beauty", href:"category.html?c=beauty", items:["beauty","perfume"]},
    {title:"Men", slug:"men", items:["men","suits","underwear","socks"]},
    {title:"Kids", slug:"kids", items:["kids","toys"]},
    {title:"Home & Living", slug:"home", items:["home","kitchen","storage","bedding","bath","lighting","cleaning"]},
    {title:"Tech & Gaming", slug:"tech", items:["tech","phoneaccessories","gaming"]},
    {title:"Sports & Travel", slug:"sports", items:["sports","outdoors","travel"]},
    {title:"Gifts & More", slug:"gifts", items:["gifts","party","crafts","office","stationery","pets"]}
  ];

  const megaGroups = [
    ["Women · Clothing", "women", ["dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","socks","swimwear"]],
    ["Women · Shoes & Accessories", "women", ["shoes","bags","jewelry","accessories","hats"]],
    ["Beauty & Fragrance", null, ["beauty","perfume"]],
    ["Men", "men", ["tops","bottoms","hoodies","jackets","knitwear","activewear","suits","underwear","socks"]],
    ["Home & Living", null, ["home","kitchen","storage","bedding","bath","lighting","cleaning","pillows","blankets","wallart","drinkware"]],
    ["Tech", null, ["tech","phoneaccessories","gaming","office"]],
    ["Kids & Pets", null, ["kids","toys","pets"]],
    ["Sports & Travel", null, ["sports","outdoors","travel"]],
    ["Gifts & Creative", null, ["gifts","party","crafts","stationery","ornaments"]]
  ];

  function flatUnique(shelves) {
    const out = [];
    const seen = new Set();
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

  function linkFor(groupSlug, subSlug) {
    if (groupSlug === "women" || groupSlug === "men") {
      return `category.html?c=${encodeURIComponent(groupSlug)}&sub=${encodeURIComponent(subSlug)}`;
    }
    return H.categoryUrl(subSlug);
  }

  function megaMenuHtml() {
    return megaGroups.map(([title, groupSlug, items]) => {
      const links = items.filter(slug => H.categoryDefs[slug]).map(slug => {
        const def = H.categoryDefs[slug];
        return `<a href="${H.esc(linkFor(groupSlug, slug))}">${H.esc(def.title)}</a>`;
      }).join("");
      const allLink = groupSlug ? H.categoryUrl(groupSlug) : H.categoryUrl(items[0]);
      return `<section><h3><a href="${H.esc(allLink)}">${H.esc(title)}</a></h3><div>${links}</div></section>`;
    }).join("");
  }

  function setupMegaMenu() {
    const button = $("#hd-all-categories");
    const menu = $("#hd-mega-menu");
    if (!button || !menu) return;
    menu.innerHTML = megaMenuHtml();
    const close = () => {
      menu.hidden = true;
      button.setAttribute("aria-expanded","false");
    };    const open = () => {
      menu.hidden = false;
      button.setAttribute("aria-expanded","true");
      menu.querySelector("a")?.focus();
    };
    button.addEventListener("click", () => menu.hidden ? open() : close());
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !menu.hidden) {
        close();
        button.focus();
      }
    });
    document.addEventListener("click", event => {
      if (menu.hidden) return;
      if (menu.contains(event.target) || button.contains(event.target)) return;
      close();
    });
  }

  function mode() {
    const value = localStorage.getItem(modeKey) || "for-you";
    return ["for-you","women","men","home","tech"].includes(value) ? value : "for-you";
  }

  function modeSlugs(value) {
    if (value === "women") return ["women","dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","swimwear","shoes","bags","jewelry","accessories","hats","beauty","perfume"];
    if (value === "men") return ["men"];
    if (value === "home") return ["home","kitchen","storage","bedding","bath","lighting"];
    if (value === "tech") return ["tech","phoneaccessories","gaming","office"];
    const signals = H.signals();
    const ranked = Object.entries(signals)
      .filter(([slug,score]) => H.categoryDefs[slug] && Number(score) > 0)
      .sort((a,b) => Number(b[1]) - Number(a[1]))
      .map(([slug]) => slug)
      .slice(0,5);
    return ranked.length ? ranked : ["women","men","home","beauty","tech","kids","travel"];
  }

  function pickProducts(shelves, slugs, limit=16) {
    const out = [];
    const seen = new Set();
    for (const slug of slugs) {
      for (const item of Array.isArray(shelves?.[slug]) ? shelves[slug] : []) {
        const key = `${item?.provider || ""}:${item?.item_id || ""}`;
        if (!item?.item_id || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
        if (out.length >= limit) return out;
      }
    }
    return out;
  }  function productCard(item, label="LIVE") {
    const href = H.productUrl(item);
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${H.esc(item.image_url)}" alt="${H.esc(item.title || "Product")}" loading="lazy">`
      : '<div class="hd-wow-image-placeholder" aria-hidden="true">H</div>';
    const price = Number.isFinite(Number(item.price_amount)) && Number(item.price_amount) > 0
      ? H.money(Number(item.price_amount), item.currency || "USD")
      : "Open product";
    return `<article class="hd-wow-product" role="listitem" data-category="${H.esc(item.category || "")}">
      <a class="hd-wow-product-media" href="${H.esc(href)}">${image}<span>${H.esc(label)}</span></a>
      <div class="hd-wow-product-body">
        <small>${H.esc(item.provider || "LIVE SOURCE")}</small>
        <a href="${H.esc(href)}">${H.esc(item.title || "Product")}</a>
        <div class="hd-wow-price"><strong>${price}</strong><em>${item.price_amount ? "supplier base" : "details"}</em></div>
      </div>
    </article>`;
  }

  function isWomenItem(item) {
    const title=String(item?.title||"").toLowerCase();
    if (String(item?.gender||"").toLowerCase()==="women") return true;
    if (/\bunisex\b/.test(title)) return false;
    const hasWomen=/\b(women(?:'s)?|woman|female|ladies)\b/.test(title);
    const hasMen=/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title);
    return hasWomen && !hasMen;
  }

  function departmentCard(dep, shelves) {
    let products = pickProducts(shelves, dep.items, dep.womenOnly ? 100 : 30);
    if (dep.womenOnly) products = products.filter(isWomenItem).slice(0,30);
    const rep = products.find(x => typeof x.image_url === "string" && x.image_url.startsWith("https://"));
    const uniqueCount = products.length;
    const image = rep
      ? `<img src="${H.esc(rep.image_url)}" alt="" loading="lazy">`
      : '<div class="hd-dept-placeholder" aria-hidden="true">H</div>';
    return `<a class="hd-dept-card" href="${H.esc(dep.href || H.categoryUrl(dep.slug))}">
      <div class="hd-dept-image">${image}</div>
      <div><strong>${H.esc(dep.title)}</strong><span>${uniqueCount ? uniqueCount + "+ live picks" : "Open department"}</span></div>
    </a>`;
  }

  function behaviorScore(item) {
    const key=`${item?.provider||""}:${item?.item_id||""}`;
    const title=String(item?.title||"").toLowerCase();
    const searchBoost=recentSearchTerms.reduce((sum,term)=>sum+(title.includes(term)?18:0),0);
    const actionBoost=recentActionKeys.has(key)?90:0;
    const completeness=(item?.image_url?2:0)+(Number(item?.price_amount)>0?2:0);
    return H.personalScore(item)*10 + searchBoost + actionBoost + completeness;
  }

  function personalizedLimit() {
    return window.matchMedia?.("(max-width: 760px)")?.matches ? 8 : 12;
  }

  function renderPersonalized(shelves) {
    const value = mode();
    const limit = personalizedLimit();
    let products;
    if(value === "for-you"){
      const allowed=new Set(modeSlugs(value));
      products=flatUnique(shelves)
        .filter(item=>allowed.has(H.inferCategory(item)||item?.category))
        .sort((a,b)=>behaviorScore(b)-behaviorScore(a))
        .slice(0,limit);
    } else {
      products = pickProducts(shelves, modeSlugs(value), value === "women" ? 100 : limit);
    }
    if (value === "women") products = products.filter(isWomenItem).slice(0,limit);
    const host = $("#hd-for-you-products");
    if (!host) return;
    host.innerHTML = products.map(item => productCard(item, value === "for-you" ? "FOR YOU" : value.toUpperCase())).join("");
    host.setAttribute("role","list");
    document.querySelectorAll("[data-shop-mode]").forEach(button => {
      const active = button.dataset.shopMode === value;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const copy = $("#hd-for-you-copy");
    if (copy) {
      if(value === "for-you"){
        const top=Object.entries(H.signals()).filter(([slug,score])=>H.categoryDefs[slug]&&Number(score)>0).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,2).map(([slug])=>H.categoryDefs[slug]?.title||slug);
        copy.textContent = recentSearchTerms.length
          ? `Updated from your latest search and shopping actions${top.length ? " · " + top.join(" + ") : ""}.`
          : recentActionKeys.size ? `Updated from your latest Like / Save actions${top.length ? " · " + top.join(" + ") : ""}.`
          : top.length ? `Learning from your recent activity · ${top.join(" + ")}.` : "A balanced mix while HUNT learns what you browse.";
      } else copy.textContent=`Showing ${value} picks by your choice.`;
    }
  }  function render(data) {
    lastData = data;
    const shelves = data?.shelves || {};
    const all = flatUnique(shelves);
    if (!all.length) return;

    const liveCount = Number(data.visible_product_count || all.length);
    const providerCount = new Set(all.map(x => x.provider).filter(Boolean)).size;
    const categoryCount = Object.values(shelves).filter(rows => Array.isArray(rows) && rows.length).length;

    const hero = $(".hd-hero-copy");
    let proof = hero?.querySelector(".hd-live-proof");
    if (hero && !proof) {
      proof = document.createElement("div");
      proof.className = "hd-live-proof";
      proof.setAttribute("aria-label","Live marketplace summary");
      hero.querySelector(":scope > p")?.after(proof);
    }
    if (proof) proof.innerHTML = `
      <div><strong>${liveCount.toLocaleString()}</strong><span>UNIQUE LIVE PRODUCTS</span></div>
      <div><strong>${providerCount}</strong><span>LIVE CATALOG SOURCES</span></div>
      <div><strong>${categoryCount}</strong><span>LIVE CATEGORIES</span></div>`;

    let showcase = $("#hd-wow-showcase");
    if (!showcase) {
      showcase = document.createElement("section");
      showcase.id = "hd-wow-showcase";
      showcase.className = "hd-wow-showcase";
      $("#shop")?.before(showcase);
    }

    const cjLimit = window.matchMedia?.("(max-width: 760px)")?.matches ? 6 : 8;
    const cj = all.filter(x => String(x.provider).toLowerCase().includes("cj")).slice(0,cjLimit);
    showcase.innerHTML = `
      <div class="hd-wow-head">
        <div><div class="hd-kicker hd-kicker-small">SHOP BY DEPARTMENT</div><h2>Everything is easier to find now.</h2>
        <p>Large departments first, detailed subcategories inside. Real images come from the live supplier catalog.</p></div>
        <span class="hd-wow-live" aria-live="polite"><i></i>${liveCount.toLocaleString()} LIVE</span>
      </div>
      <div class="hd-dept-grid">${departments.map(dep => departmentCard(dep,shelves)).join("")}</div>
      <section class="hd-for-you" id="for-you" aria-labelledby="hd-for-you-title">
        <div class="hd-for-you-head"><div><small>PERSONALIZED SHOPPING</small><h3 id="hd-for-you-title">For You</h3><p id="hd-for-you-copy"></p></div>
          <div class="hd-mode-switch" aria-label="Choose shopping view">
            <button type="button" data-shop-mode="for-you">For You</button><button type="button" data-shop-mode="women">Women</button>
            <button type="button" data-shop-mode="men">Men</button><button type="button" data-shop-mode="home">Home</button><button type="button" data-shop-mode="tech">Tech</button>
          </div>
        </div>
        <div class="hd-wow-track" id="hd-for-you-products"></div>
      </section>
      ${cj.length ? `<section class="hd-fresh-source"><div class="hd-wow-rail-head"><div><small>FRESH SOURCE</small><h3>New from CJdropshipping</h3></div><span>LIVE API</span></div><div class="hd-wow-track" role="list">${cj.map(x => productCard(x,"CJ LIVE")).join("")}</div></section>` : ""}`;
    renderPersonalized(shelves);
  }  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-shop-mode]");
    if (!button) return;
    localStorage.setItem(modeKey, button.dataset.shopMode || "for-you");
    if (lastData) renderPersonalized(lastData.shelves || {});
  });

  setupMegaMenu();
  window.addEventListener("hunt:shopping-survey", () => { if (lastData) renderPersonalized(lastData.shelves || {}); });
  window.addEventListener("hunt:shopping-action", event => {
    const detail=event.detail||{};
    const key=`${detail.provider||""}:${detail.item_id||""}`;
    if(detail.liked||detail.saved)recentActionKeys.add(key); else recentActionKeys.delete(key);
    if(lastData)renderPersonalized(lastData.shelves||{});
  });
  window.addEventListener("hunt:search", event => {
    const query=String(event.detail?.query||"").toLowerCase();
    recentSearchTerms=query.split(/\s+/).map(x=>x.trim()).filter(x=>x.length>2).slice(0,4);
    if(lastData)renderPersonalized(lastData.shelves||{});
  });
    window.addEventListener("hunt:shelves", event => render(event.detail));
  if (window.HuntMarketShelves) render(window.HuntMarketShelves);
})();