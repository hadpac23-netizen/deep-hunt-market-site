(() => {
  const H = window.HuntCore;
  const params = new URLSearchParams(location.search);
  const requested = params.get("c") || "women";
  const slug = H.categoryDefs[requested] ? requested : "women";
  const sub = params.get("sub") || "";
  const def = H.categoryDefs[slug];
  const mainCategories = ["women","men","kids","beauty","home","kitchen","tech","sports","gifts"];
  let rawResults = [];
  let resultOrder = new Map();
  const viewKey = "hunt_market_view_v1";
  let viewMode = localStorage.getItem(viewKey) || "comfortable";
  let visibleLimit = 48;
  const pageSize = 48;
  let gridObserver = null;

  const $ = q => document.querySelector(q);
  const productKey = p => `${p.provider || ""}:${p.item_id || ""}`;

  function productCard(product) {
    const score = H.personalScore(product);
    const image = product.image_url?.startsWith("https://")
      ? `<img src="${H.esc(product.image_url)}" alt="${H.esc(product.title || "Product")}" loading="lazy">`
      : `<div class="hd-market-card-placeholder">◇</div>`;
    const badge = score > 0 ? `<span class="hd-market-for-you">FOR YOU</span>` : `<span class="hd-market-source">${H.esc(product.provider || "LIVE")}</span>`;
    const hasPrice = Number.isFinite(Number(product.price_amount)) && Number(product.price_amount) > 0;
    const price = hasPrice ? H.money(product.price_amount, product.currency || "USD") : "Open product";
    const productUrl = H.productUrl(product);
    return `<article class="hd-market-product-card" data-category="${H.esc(H.inferCategory(product) || product.category || slug)}" data-key="${H.esc(productKey(product))}" data-price="${Number(product.price_amount)||0}" data-score="${score}">
      <a class="hd-market-card-media" href="${H.esc(productUrl)}" data-product-view="${H.esc(productKey(product))}">${image}${badge}</a>
      <div class="hd-market-card-body">
        <small>${H.esc(product.provider || "Provider")} · ${H.esc(product.availability_verified ? "AVAILABLE" : "DISCOVERY")}</small>
        <a href="${H.esc(productUrl)}" class="hd-market-card-title" data-product-view="${H.esc(productKey(product))}">${H.esc(product.title || "Product")}</a>
        <div class="hd-market-card-price"><strong>${price}</strong><span>${H.esc(hasPrice ? (product.price_basis || "SOURCE PRICE") : "DETAIL PRICE")}</span></div>
        <p>${H.esc(score > 0 ? H.personalReason(product) : "Open the product to inspect images, variants and availability.")}</p>
        <a class="hd-btn hd-market-view" href="${H.esc(productUrl)}" data-product-view="${H.esc(productKey(product))}">View product →</a>
      </div>
    </article>`;
  }

  function applyViewMode(mode) {
    const allowed = new Set(["compact", "comfortable", "large"]);
    viewMode = allowed.has(mode) ? mode : "comfortable";
    const grid = $("#hd-category-grid");
    if (grid) grid.dataset.view = viewMode;
    document.querySelectorAll("[data-view-mode]").forEach(button => {
      button.classList.toggle("active", button.dataset.viewMode === viewMode);
      button.setAttribute("aria-pressed", String(button.dataset.viewMode === viewMode));
    });
    localStorage.setItem(viewKey, viewMode);
  }

  function renderCategories() {
    const entries = mainCategories.map(key => [key,H.categoryDefs[key]]).filter(([,value]) => value);
    const chips = entries
      .map(([key,value]) => `<a class="${key===slug?"active":""}" href="${H.categoryUrl(key)}">${value.icon} ${H.esc(value.title)}</a>`)
      .join("");
    $("#hd-category-strip").innerHTML = chips;

    const groups = Array.isArray(H.categoryGroups) ? H.categoryGroups : [];
    $("#hd-category-side-links").innerHTML = groups.map(group => {
      const links = group.items
        .filter(key => H.categoryDefs[key])
        .map(key => {
          const value = H.categoryDefs[key];
          const genderSub = ["women","men"].includes(slug) && ["dresses","tops","bottoms","hoodies","jackets","knitwear","activewear","swimwear","shoes","bags","jewelry","accessories","hats"].includes(key);
          const href = genderSub ? `category.html?c=${encodeURIComponent(slug)}&sub=${encodeURIComponent(key)}` : H.categoryUrl(key);
          const active = genderSub ? sub===key : key===slug;
          return `<a class="${active?"active":""}" href="${href}">${value.icon} ${H.esc(value.title)}</a>`;
        }).join("");
      return `<section class="hd-category-side-group"><strong>${H.esc(group.title)}</strong><div>${links}</div></section>`;
    }).join("");
  }

  function matchesSub(product) {
    if (!sub || !["women","men"].includes(slug)) return true;
    const title = String(product?.title || "").toLowerCase();
    const patterns = {
      tops:/shirt|tee|t-shirt|top|tank|polo|blouse/,
      bottoms:/pants|trouser|shorts|jeans|joggers|leggings/,
      hoodies:/hoodie|sweatshirt/,
      jackets:/jacket|coat|windbreaker|outerwear|blazer/,
      knitwear:/sweater|cardigan|knit/,
      activewear:/sport|athletic|fitness|yoga|running|rash guard/,
      swimwear:/swim|swimsuit|bikini|board shorts/,
      shoes:/shoe|sneaker|heel|loafer|boot|sandal|slide/,
      bags:/bag|handbag|purse|crossbody|tote|backpack/,
      jewelry:/jewelry|jewellery|necklace|bracelet|earring|pendant|ring/,
      accessories:/accessor|wallet|belt|scarf|sunglass/,
      hats:/hat|cap|beanie/,
      beauty:/beauty|skincare|makeup|cosmetic|serum|cream/,
      perfume:/perfume|fragrance|eau de|parfum/
    };
    return patterns[sub] ? patterns[sub].test(title) : true;
  }

  function matchesGenderScope(product) {
    if (!["women","men"].includes(slug)) return true;
    const title=String(product?.title||"").toLowerCase();
    const gender=String(product?.gender||"").toLowerCase();
    const kids=/\b(baby|newborn|toddler|kid|kids|child|children|boys?|girls?|youth|infant)\b/.test(title);
    const hasWomen=/\b(women(?:'s)?|woman|female|ladies)\b/.test(title);
    const hasMen=/\b(men(?:'s)?|man|male|gentlemen)\b/.test(title);
    if (kids || /\bunisex\b/.test(title)) return false;
    if (slug==="women") {
      if (hasMen) return false;
      if (hasWomen) return true;
      return gender==="women";
    }
    if (hasWomen) return false;
    if (hasMen) return true;
    return gender==="men";
  }

  function matchesCategoryTruth(product) {
    const title = String(product?.title || "").toLowerCase();
    if (!title) return false;
    const inferred = H.inferCategory(product);
    if (["women","men"].includes(slug)) {
      const allowed = new Set(["women","men","dresses","tops","bottoms","hoodies","knitwear","jackets","activewear","swimwear","bags","shoes","accessories","jewelry","hats","socks"]);
      if (!allowed.has(inferred)) return false;
      if (sub && inferred !== sub) return false;
      if (slug === "women" && /\b(baby|newborn|toddler|kid|kids|child|children|boys?|youth|infant)\b/.test(title)) return false;
      if (slug === "men" && /\b(women|woman|female|ladies|girls?)\b/.test(title)) return false;
      return true;
    }
    return inferred === slug;
  }

  function listingReadiness(product) {
    let score=0;
    const title=String(product?.title||"").trim();
    const image=String(product?.image_url||"");
    const price=Number(product?.price_amount);
    if(image.startsWith("https://")) score+=4;
    if(title.length>=12 && title.length<=180) score+=3;
    else if(title.length>=5) score+=1;
    if(Number.isFinite(price)&&price>0) score+=2;
    if(product?.availability_verified===true) score+=2;
    if(String(product?.price_basis||"").toUpperCase()==="MERCHANT_RETAIL") score+=1;
    if(product?.source_fresh_at){
      const age=Date.now()-Date.parse(product.source_fresh_at);
      if(Number.isFinite(age) && age>=0 && age<45*86400000) score+=1;
    }
    return score;
  }

  function fragranceConcentration(product) {
    const text=String(product?.title||"").toLowerCase();
    if(/\b(extrait|extract)\b/.test(text))return "Extrait";
    if(/\b(edp|eau de parfum)\b/.test(text))return "EDP";
    if(/\b(edt|eau de toilette)\b/.test(text))return "EDT";
    if(/\b(edc|eau de cologne|cologne)\b/.test(text))return "Cologne";
    if(/\bparfum\b/.test(text))return "Parfum";
    return "";
  }

  function fragranceVolume(product) {
    const text=String(product?.title||"");
    const match=text.match(/\b(\d{1,4}(?:\.\d+)?)\s*ml\b/i);
    return match ? `${Number(match[1])} ml` : "";
  }

  function smartFilterValue(id) {
    return String(document.querySelector(id)?.value||"").trim();
  }

  function smartFilterMatches(product) {
    const provider=smartFilterValue("#hd-filter-provider");
    const brand=smartFilterValue("#hd-filter-brand");
    const type=smartFilterValue("#hd-filter-type");
    const concentration=smartFilterValue("#hd-filter-concentration");
    const volume=smartFilterValue("#hd-filter-volume");
    const available=smartFilterValue("#hd-filter-available");
    if(provider && String(product?.provider||"")!==provider)return false;
    if(brand && String(H.detectBrand?.(product)||"")!==brand)return false;
    if(type && String(H.inferCategory(product)||"")!==type)return false;
    if(concentration && fragranceConcentration(product)!==concentration)return false;
    if(volume && fragranceVolume(product)!==volume)return false;
    if(available==="verified" && product?.availability_verified!==true)return false;
    return true;
  }

  function smartSelect(id,label,values) {
    const unique=[...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
    if(unique.length<2)return "";
    const options=unique.map(value=>`<option value="${H.esc(value)}">${H.esc(value)}</option>`).join("");
    return `<label>${H.esc(label)}<select id="${id}"><option value="">All</option>${options}</select></label>`;
  }

  function renderSmartFilters() {
    const host=$("#hd-smart-filters");
    if(!host)return;
    const eligible=rawResults.filter(p=>matchesCategoryTruth(p)&&matchesGenderScope(p)&&matchesSub(p));
    const providers=eligible.map(p=>String(p?.provider||"")).filter(Boolean);
    const brands=eligible.map(p=>H.detectBrand?.(p)||"").filter(Boolean);
    const types=eligible.map(p=>H.inferCategory(p)).filter(Boolean);
    const concentrations=slug==="perfume" ? eligible.map(fragranceConcentration).filter(Boolean) : [];
    const volumes=slug==="perfume" ? eligible.map(fragranceVolume).filter(Boolean) : [];
    const hasVerified=eligible.some(p=>p?.availability_verified===true);
    const hasUnverified=eligible.some(p=>p?.availability_verified!==true);
    const parts=[
      smartSelect("hd-filter-provider","Source",providers),
      smartSelect("hd-filter-brand","Brand",brands),
      ["women","men"].includes(slug) ? smartSelect("hd-filter-type","Type",types) : "",
      concentrations.length ? smartSelect("hd-filter-concentration","Concentration",concentrations) : "",
      volumes.length ? smartSelect("hd-filter-volume","Size",volumes) : "",
      hasVerified && hasUnverified ? '<label>Availability<select id="hd-filter-available"><option value="">All</option><option value="verified">Verified available</option></select></label>' : ""
    ].filter(Boolean);
    host.innerHTML=parts.join("");
    host.hidden=!parts.length;
  }

  function filteredSorted() {
    const min = Number($("#hd-price-min").value || 0);
    const maxRaw = $("#hd-price-max").value.trim();
    const max = maxRaw ? Number(maxRaw) : Infinity;
    const sort = $("#hd-cat-sort").value;
    const hasPriceFilter = min > 0 || Number.isFinite(max);
    const items = rawResults.filter(p => {
      const price = Number(p.price_amount);
      const priced = Number.isFinite(price) && price > 0;
      const priceMatch = hasPriceFilter ? priced && price >= min && price <= max : true;
      return matchesCategoryTruth(p) && matchesGenderScope(p) && matchesSub(p) && priceMatch && smartFilterMatches(p);
    });
    if (sort === "price-low") items.sort((a,b)=>(Number(a.price_amount)||Infinity)-(Number(b.price_amount)||Infinity));
    else if (sort === "price-high") items.sort((a,b)=>(Number(b.price_amount)||0)-(Number(a.price_amount)||0));
    else if (sort === "for-you") items.sort((a,b)=>
      H.personalScore(b)-H.personalScore(a) ||
      listingReadiness(b)-listingReadiness(a) ||
      (resultOrder.get(productKey(a))||0)-(resultOrder.get(productKey(b))||0)
    );
    else items.sort((a,b)=>
      (resultOrder.get(productKey(a))||0)-(resultOrder.get(productKey(b))||0)
    );
    return items;
  }

  function renderGrid({reset=false}={}) {
    if (reset) visibleLimit = pageSize;
    const items = filteredSorted();
    const visible = items.slice(0,visibleLimit);
    $("#hd-cat-count").textContent = `${items.length} products · showing ${visible.length}`;
    $("#hd-category-grid").innerHTML = visible.map(productCard).join("");
    $("#hd-category-empty").hidden = items.length > 0;
    visible.forEach(p => { try { sessionStorage.setItem(`hunt_product_${productKey(p)}`, JSON.stringify(p)); } catch {} });
    const sentinel=$("#hd-category-more");
    if(sentinel){
      const hasMore=visible.length<items.length;
      sentinel.hidden=!hasMore;
      const strong=sentinel.querySelector("strong");
      if(strong)strong.textContent=hasMore?`Load more · ${items.length-visible.length} remaining`:"All products loaded";
    }
  }

  function loadMore() {
    const total=filteredSorted().length;
    if(visibleLimit>=total)return;
    visibleLimit=Math.min(total,visibleLimit+pageSize);
    renderGrid();
  }

  function setupGridObserver() {
    const sentinel=$("#hd-category-more");
    if(!sentinel || !("IntersectionObserver" in window))return;
    gridObserver?.disconnect();
    gridObserver=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting))loadMore();
    },{rootMargin:"850px 0px"});
    gridObserver.observe(sentinel);
  }

  async function load() {
    const subDef = sub && H.categoryDefs[sub] ? H.categoryDefs[sub] : null;
    const pageTitle = subDef && ["women","men"].includes(slug) ? `${def.title} · ${subDef.title}` : def.title;
    document.title = `${pageTitle} — HUNT DEAL`;
    $("#hd-cat-title").textContent = pageTitle;
    $("#hd-cat-breadcrumb").textContent = pageTitle;
    $("#hd-cat-copy").textContent = subDef && ["women","men"].includes(slug) ? `${subDef.title} filtered inside ${def.title}.` : def.description;
    renderCategories();
    applyViewMode(viewMode);
    H.recordSignal(slug,"category");
    const score = Number(H.signals()[slug] || 0);
    $("#hd-boom-reason").textContent = score > 2 ? `This category has a ${score}-point local interest signal.` : "Learning locally from category visits, product views and cart actions.";
    H.updateCartBadges();
    setupGridObserver();

    const sourceSlug = sub && ["women","men"].includes(slug) && H.categoryDefs[sub] ? sub : slug;

    const mergeProductRecord = (base, fresh) => {
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
    };

    const applyRows = (rows, label, {merge=false}={}) => {
      const incoming = (Array.isArray(rows) ? rows : []).filter(product => {
        if (slug !== "men") return true;
        const text = String(product?.title || "").toLowerCase();
        return !/\b(women(?:'s|s)?|woman|female|unisex)\b/.test(text);
      });
      if (merge && rawResults.length) {
        const merged = new Map(rawResults.map(product => [productKey(product), product]));
        for (const product of incoming) {
          const k = productKey(product);
          merged.set(k, mergeProductRecord(merged.get(k), product));
        }
        rawResults = [...merged.values()];
      } else {
        rawResults = [...incoming].sort((a,b)=>listingReadiness(b)-listingReadiness(a));
      }
      const providers = [...new Set(rawResults.map(p=>p.provider).filter(Boolean))];
      $("#hd-cat-provider-state").textContent = rawResults.length
        ? `${rawResults.length} catalog products ready · ${providers.join(" + ")}${label==="live"?" · live refresh merged":""}`
        : "No connected provider returned a product for this category yet.";
      resultOrder = new Map(rawResults.map((p,i)=>[productKey(p),i]));
      renderSmartFilters();
      window.HuntAnalytics?.category(slug, rawResults.length);
      renderGrid();
    };

    let rendered = false;
    let shardLoaded = false;
    try {
      const shardRes = await fetch(`catalog-shards/${encodeURIComponent(sourceSlug)}.json?v=catalog30k1`, {cache:"force-cache"});
      if (shardRes.ok) {
        const shard = await shardRes.json();
        const shardRows = Array.isArray(shard?.products) ? shard.products : [];
        if (shardRows.length) {
          applyRows(shardRows, "expanded");
          rendered = true;
          shardLoaded = true;
        }
      }
    } catch {}

    if (!shardLoaded) {
      try {
        const snapshotRes = await fetch("catalog-snapshot.json?v=catalog5k1", {cache:"force-cache"});
        if (snapshotRes.ok) {
          const snapshot = await snapshotRes.json();
          const snapshotRows = Array.isArray(snapshot?.shelves?.[sourceSlug]) ? snapshot.shelves[sourceSlug] : [];
          if (snapshotRows.length) {
            applyRows(snapshotRows, "verified");
            rendered = true;
          }
        }
      } catch {}
    }

    try {
      const liveData = await Promise.race([
        H.storefront({shelves:1}),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Live catalog timeout")), 15000))
      ]);
      const liveRows = Array.isArray(liveData?.shelves?.[sourceSlug]) ? liveData.shelves[sourceSlug] : [];
      if (liveRows.length) {
        applyRows(liveRows, "live", {merge:true});
        rendered = true;
      }
    } catch {}

    if (!rendered) {
      const data = await H.search(def.query,24);
      const results = Array.isArray(data.results) ? data.results : [];
      applyRows(results, "discovery");
    }
  }

  $("#hd-cat-apply")?.addEventListener("click",()=>renderGrid({reset:true}));
  $("#hd-cat-sort")?.addEventListener("change",()=>renderGrid({reset:true}));
  $("#hd-smart-filters")?.addEventListener("change",()=>renderGrid({reset:true}));
  document.querySelectorAll("[data-view-mode]").forEach(button => {
    button.addEventListener("click", () => applyViewMode(button.dataset.viewMode));
  });
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
