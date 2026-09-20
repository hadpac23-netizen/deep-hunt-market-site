(() => {
  const H = window.HuntCore;
  const PROD_ORIGIN = "https://deep-hunt-market.netlify.app";
  const params = new URLSearchParams(location.search);
  const requested = params.get("c") || "women";
  const slug = H.categoryDefs[requested] ? requested : "women";
  const sub = params.get("sub") || "";
  const def = H.categoryDefs[slug];
  const mainCategories = ["women","men","kids","beauty","accessories","tech","home","sports","pets","toys","travel","office","gifts"];
  let rawResults = [];
  let resultOrder = new Map();
  const viewKey = "hunt_market_view_v1";
  let viewMode = localStorage.getItem(viewKey) || "comfortable";
  let visibleLimit = 48;
  const pageSize = 48;
  let gridObserver = null;
  let catalogPages = [];
  let nextCatalogPageIndex = 0;
  let catalogPageLoading = false;
  let catalogTotalCount = 0;

  const $ = q => document.querySelector(q);
  const productKey = p => `${p.provider || ""}:${p.item_id || ""}`;

  async function ensureCompareRuntime(){
    if(window.HuntCompare)return true;
    return new Promise(resolve=>{
      const existing=document.querySelector('script[data-hunt-compare-retry]');
      if(existing){
        existing.addEventListener("load",()=>resolve(Boolean(window.HuntCompare)),{once:true});
        existing.addEventListener("error",()=>resolve(false),{once:true});
        return;
      }
      const script=document.createElement("script");
      script.src="hunt-compare.js?v=2&retry=1";
      script.dataset.huntCompareRetry="true";
      script.onload=()=>resolve(Boolean(window.HuntCompare));
      script.onerror=()=>resolve(false);
      document.head.appendChild(script);
    });
  }


  function retailState(product) {
    const amount = Number(product?.retail_price_amount);
    const currency = String(product?.retail_currency || product?.currency || "USD");
    const ready = product?.retail_price_verified === true
      && String(product?.profit_gate_status || "").toUpperCase() === "PASS"
      && Number.isFinite(amount)
      && amount > 0;
    const estimated = !ready && Number.isFinite(amount) && amount > 0;
    return {ready, estimated, amount: (ready || estimated) ? amount : null, currency};
  }

  function categoryFacts(product) {
    const facts=[];
    const world=String(slug||"");
    const category=String(product?.category||"");

    const add=(label,value)=>{
      if(value===null||value===undefined||value==="")return;
      const text=String(value).trim();
      if(!text)return;
      if(facts.some(x=>x.label===label&&x.value===text))return;
      facts.push({label,value:text});
    };

    const variants=Number(product?.variant_count||0);
    const fashion=/^(women|men|kids|accessories)$/.test(world)||/^(women-|men-|kids-|baby-)/.test(category);
    const specDriven=/^(tech|office)$/.test(world)||/(phone|computer|electronics|gaming|camera|audio)/.test(category);
    const home=/^(home)$/.test(world)||/(home|lighting|kitchen|bedding|bath)/.test(category);
    const beauty=/^(beauty)$/.test(world)||/(skincare|makeup|beauty|hair|nails|body-care)/.test(category);

    if(specDriven){
      add("Model",product?.model);
      add("Brand",product?.brand);
      if(variants>1)add("Options",variants);
      add("Type",product?.type_name);
    }else if(fashion){
      add("Brand",product?.brand);
      if(variants>1)add("Options",variants);
      add("Type",product?.type_name);
    }else if(beauty){
      add("Brand",product?.brand);
      add("Type",product?.type_name);
      add("Origin",product?.origin_country);
    }else if(home){
      add("Type",product?.type_name);
      if(variants>1)add("Options",variants);
      add("Origin",product?.origin_country);
    }else{
      add("Brand",product?.brand);
      if(variants>1)add("Options",variants);
      add("Type",product?.type_name);
    }

    if(facts.length<2&&product?.availability_verified===true)add("Stock","loaded");
    return facts.slice(0,2);
  }

  function productCard(product) {
    const score = H.personalScore(product);
    const image = product.image_url?.startsWith("https://")
      ? `<img src="${H.esc(product.image_url)}" alt="${H.esc(product.title || "Product")}" loading="lazy">`
      : `<div class="hd-market-card-placeholder">◇</div>`;
    const badge = score > 0 ? `<span class="hd-market-for-you">FOR YOU</span>` : `<span class="hd-market-source">${H.esc(product.provider || "CATALOG")}</span>`;
    const newBadge = H.isNewArrival?.(product) ? `<b class="hd-new-pulse">NEW</b>` : "";
    const retail = retailState(product);
    const price = retail.ready ? H.money(retail.amount, retail.currency) : (retail.estimated ? `From ${H.money(retail.amount, retail.currency)}` : "Price pending");
    const quoteVerified = String(product?.quote_verification_status || "").toUpperCase() === "PASS";
    const stateLabel = quoteVerified
      ? "QUOTE VERIFIED"
      : retail.ready
        ? "HUNT RETAIL · QUOTE REQUIRED"
        : (retail.estimated ? "HUNT ESTIMATE · LIVE DETAIL REQUIRED" : (product.availability_verified === true ? "CATALOG" : "DISCOVERY"));
    const productUrl = H.productUrl(product);
    const facts=categoryFacts(product);
    const factsHtml=facts.length?`<div class="hd-card-specific-facts" aria-label="Product facts">${facts.map(f=>`<span><b>${H.esc(f.label)}:</b> ${H.esc(f.value)}</span>`).join("")}</div>`:"";
    const reason=score>0?`<p>${H.esc(H.personalReason(product))}</p>`:"";
    const compare=window.HuntCompare?.button?.(product)||"";
    return `<article class="hd-market-product-card" data-category="${H.esc(product.category || slug)}" data-key="${H.esc(productKey(product))}" data-price="${retail.amount || 0}" data-score="${score}">
      <a class="hd-market-card-media" href="${H.esc(productUrl)}" data-product-view="${H.esc(productKey(product))}">${image}${badge}${newBadge}</a>
      <div class="hd-market-card-body">
        <small>${H.esc(product.provider || "Provider")} · ${H.esc(stateLabel)}</small>
        <a href="${H.esc(productUrl)}" class="hd-market-card-title" data-product-view="${H.esc(productKey(product))}">${H.esc(product.title || "Product")}</a>
        <div class="hd-market-card-price"><strong>${price}</strong><span>${retail.ready ? "HUNT RETAIL" : (retail.estimated ? "VERIFY ON PRODUCT" : "PRICE PENDING")}</span></div>
        ${factsHtml}
        ${reason}
        ${compare}
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

    const subKeys = H.departmentSubcategories?.[slug] || [];
    const subbar = $("#hd-gender-subcategories");
    if (subbar) {
      subbar.hidden = !subKeys.length;
      subbar.innerHTML = subKeys.map(key => {
        const value = H.categoryDefs[key];
        if (!value) return "";
        const href = `category.html?c=${encodeURIComponent(slug)}&sub=${encodeURIComponent(key)}`;
        return `<a class="${sub===key?"active":""}" href="${href}" data-sub-key="${H.esc(key)}">${H.esc(value.title)} <span class="hd-category-subcount" data-sub-count="${H.esc(key)}"></span></a>`;
      }).join("");
    }

    const groups = Array.isArray(H.categoryGroups) ? H.categoryGroups : [];
    $("#hd-category-side-links").innerHTML = groups.map(group => {
      const links = group.items
        .filter(key => H.categoryDefs[key])
        .map(key => {
          const value = H.categoryDefs[key];
          const departmentSub = (H.departmentSubcategories?.[slug] || []).includes(key);
          const href = departmentSub ? `category.html?c=${encodeURIComponent(slug)}&sub=${encodeURIComponent(key)}` : H.categoryUrl(key);
          const active = departmentSub ? sub===key : key===slug;
          return `<a class="${active?"active":""}" href="${href}">${value.icon} ${H.esc(value.title)}</a>`;
        }).join("");
      return `<section class="hd-category-side-group"><strong>${H.esc(group.title)}</strong><div>${links}</div></section>`;
    }).join("");
  }

  function renderAppliedFilters() {
    const shell=$("#hd-applied-filters"), host=$("#hd-applied-filter-chips");
    if(!shell||!host)return;
    const chips=[];
    const minRaw=$("#hd-price-min")?.value?.trim()||"";
    const maxRaw=$("#hd-price-max")?.value?.trim()||"";

    if(sub&&H.categoryDefs?.[sub]){
      chips.push({key:"sub",label:`Section: ${H.categoryDefs[sub].title}`});
    }
    if(minRaw){
      chips.push({key:"min",label:`Min price: ${minRaw}`});
    }
    if(maxRaw){
      chips.push({key:"max",label:`Max price: ${maxRaw}`});
    }

    shell.hidden=chips.length===0;
    host.innerHTML=chips.map(chip=>`<button type="button" class="hd-filter-chip" data-clear-filter="${chip.key}">${H.esc(chip.label)} <span aria-hidden="true">×</span></button>`).join("");
  }

  function updateSubcategoryCounts() {
    const counts=new Map();
    const children=H.departmentSubcategories?.[slug]||[];
    if(!children.length)return;
    rawResults.forEach(product=>{
      const category=String(product?.category||"");
      if(!children.includes(category))return;
      const qualityMatch=window.HuntCatalogQuality?.fit?.(category,product)!==false;
      if(!qualityMatch)return;
      counts.set(category,(counts.get(category)||0)+1);
    });
    document.querySelectorAll("[data-sub-count]").forEach(node=>{
      const count=counts.get(node.dataset.subCount||"")||0;
      node.textContent=count?`(${count})`:"";
    });
  }

  function clearFilter(key) {
    if(key==="sub"){
      location.href=H.categoryUrl(slug);
      return;
    }
    if(key==="min"&&$("#hd-price-min"))$("#hd-price-min").value="";
    if(key==="max"&&$("#hd-price-max"))$("#hd-price-max").value="";
    scheduleRenderGrid({reset:true});
  }

  let renderScheduled=false;
  function scheduleRenderGrid({reset=false,button=null}={}) {
    if(renderScheduled)return;
    renderScheduled=true;
    const grid=$("#hd-category-grid");
    if(grid)grid.setAttribute("aria-busy","true");
    if(button)button.dataset.busy="true";
    requestAnimationFrame(()=>{
      setTimeout(()=>{
        try{renderGrid({reset});}
        finally{
          renderScheduled=false;
          grid?.removeAttribute("aria-busy");
          if(button)delete button.dataset.busy;
        }
      },0);
    });
  }

  function matchesSub(product) {
    if (!sub) return true;
    const validSubs = H.departmentSubcategories?.[slug] || [];
    if (!validSubs.includes(sub)) return true;
    return String(product?.category || "") === sub;
  }

  function matchesCategoryTruth(product) {
    const category = String(product?.category || "");
    const department = String(product?.department || "");
    const children = H.departmentSubcategories?.[slug] || [];
    if (children.length) {
      if (department) return department === slug;
      return category === slug || children.includes(category);
    }
    if (category === slug) return true;
    try { return H.inferCategory(product) === slug; } catch { return false; }
  }

  function matchesGenderScope(product) {
    const department = String(product?.department || "");
    if (department && H.departmentSubcategories?.[slug]) return department === slug;
    return true;
  }

  function listingReadiness(product) {
    let score=0;
    const title=String(product?.title||"").trim();
    const image=String(product?.image_url||"");
    const retail=retailState(product);
    if(image.startsWith("https://")) score+=4;
    if(title.length>=12 && title.length<=180) score+=3;
    else if(title.length>=5) score+=1;
    if(retail.ready) score+=2;
    if(product?.availability_verified===true) score+=2;
    if(retail.ready) score+=1;
    if(product?.source_fresh_at){
      const age=Date.now()-Date.parse(product.source_fresh_at);
      if(Number.isFinite(age) && age>=0 && age<45*86400000) score+=1;
    }
    return score;
  }

  function filteredSorted() {
    const min = Number($("#hd-price-min").value || 0);
    const maxRaw = $("#hd-price-max").value.trim();
    const max = maxRaw ? Number(maxRaw) : Infinity;
    const sort = $("#hd-cat-sort").value;
    const hasPriceFilter = min > 0 || Number.isFinite(max);
    const items = rawResults.filter(p => {
      const retail = retailState(p);
      const priceMatch = hasPriceFilter ? retail.ready && retail.amount >= min && retail.amount <= max : true;
      const qualitySlug = sub || String(p?.category || "") || slug;
      const qualityMatch = window.HuntCatalogQuality?.fit?.(qualitySlug,p) !== false;
      return qualityMatch && matchesCategoryTruth(p) && matchesGenderScope(p) && matchesSub(p) && priceMatch;
    });
    if (sort === "price-low") items.sort((a,b)=>(retailState(a).amount??Infinity)-(retailState(b).amount??Infinity));
    else if (sort === "price-high") items.sort((a,b)=>(retailState(b).amount??-Infinity)-(retailState(a).amount??-Infinity));
    else if (sort === "for-you") items.sort((a,b)=>
      H.personalScore(b)-H.personalScore(a) ||
      Number(window.BoomCommerceBrain?.scoreProduct?.(b)||0)-Number(window.BoomCommerceBrain?.scoreProduct?.(a)||0) ||
      Number(window.HuntCountry?.score?.(b)||0)-Number(window.HuntCountry?.score?.(a)||0) ||
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
    window.HuntCompare?.register?.(visible);
    $("#hd-category-grid").innerHTML = visible.map(productCard).join("");
    $("#hd-category-empty").hidden = items.length > 0;
    renderAppliedFilters();
    visible.forEach(p => { try { sessionStorage.setItem(`hunt_product_${productKey(p)}`, JSON.stringify(p)); } catch {} });
    const sentinel=$("#hd-category-more");
    if(sentinel){
      const hasLoadedMore=visible.length<items.length;
      const hasRemoteMore=nextCatalogPageIndex<catalogPages.length;
      const hasMore=hasLoadedMore||hasRemoteMore;
      sentinel.hidden=!hasMore;
      const strong=sentinel.querySelector("strong");
      const remaining=Math.max(0,catalogTotalCount-visible.length);
      if(strong)strong.textContent=hasMore?`Load more · ${remaining.toLocaleString()} remaining`:"All products loaded";
    }
  }

  async function loadMore() {
    const total=filteredSorted().length;
    if(visibleLimit<total){
      visibleLimit=Math.min(total,visibleLimit+pageSize);
      renderGrid();
      return;
    }
    if(catalogPageLoading || nextCatalogPageIndex>=catalogPages.length) return;
    catalogPageLoading=true;
    try{
      const pagePath=catalogPages[nextCatalogPageIndex];
      const res=await fetch(pagePath+"?v=30k1",{cache:"force-cache"});
      if(!res.ok) throw new Error("Catalog page unavailable");
      const page=await res.json();
      const rows=Array.isArray(page?.products)?page.products:[];
      nextCatalogPageIndex+=1;
      applyRows(rows,"CJ paged",{merge:true});
      visibleLimit=Math.min(filteredSorted().length,visibleLimit+pageSize);
      renderGrid();
    }catch(err){
      console.warn("HUNT catalog page load failed",err);
    }finally{
      catalogPageLoading=false;
    }
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
    await ensureCompareRuntime();
    const subDef = sub && H.categoryDefs[sub] ? H.categoryDefs[sub] : null;
    const pageTitle = subDef ? `${def.title} · ${subDef.title}` : def.title;
    document.title = `${pageTitle} — HUNT`;

    const canonicalUrl = new URL("/category.html", PROD_ORIGIN);
    canonicalUrl.searchParams.set("c", slug);
    if (subDef) canonicalUrl.searchParams.set("sub", sub);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl.toString();

    let jsonLd = document.querySelector("#hd-category-jsonld");
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.type = "application/ld+json";
      jsonLd.id = "hd-category-jsonld";
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context":"https://schema.org",
      "@type":"CollectionPage",
      name:pageTitle,
      url:canonicalUrl.toString(),
      description:subDef ? `${subDef.title} inside ${def.title} on HUNT.` : String(def.description || pageTitle)
    });

    $("#hd-cat-title").textContent = pageTitle;
    $("#hd-cat-breadcrumb").textContent = pageTitle;
    $("#hd-cat-copy").textContent = subDef ? `${subDef.title} inside ${def.title}. CJ-only products, organized without category mixing.` : def.description;
    renderCategories();
    applyViewMode(viewMode);
    H.recordSignal(slug,"category");
    const score = Number(H.signals()[slug] || 0);
    $("#hd-boom-reason").textContent = score > 2 ? `This category has a ${score}-point local interest signal.` : "Learning locally from category visits, product views and cart actions.";
    H.updateCartBadges();
    setupGridObserver();

    const sourceSlug = sub && (H.departmentSubcategories?.[slug] || []).includes(sub) && H.categoryDefs[sub] ? sub : slug;

    const mergeProductRecord = (base, fresh) => {
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
    };

    const applyRows = (rows, label, {merge=false}={}) => {
      const incoming = (Array.isArray(rows) ? rows : []).filter(product => {
        if (String(product?.provider || "").toLowerCase() !== "cjdropshipping") return false;
        if (product?.department && String(product.department) !== slug) return false;
        if (sub && String(product?.category || "") !== sub) return false;
        return true;
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
        ? "Curated CJ catalog · live variants, stock and shipping rechecked on product open"
        : "No connected provider returned a product for this category yet.";
      resultOrder = new Map(rawResults.map((p,i)=>[productKey(p),i]));
      window.HuntCompare?.register?.(rawResults);
      updateSubcategoryCounts();
      window.HuntAnalytics?.category(slug, rawResults.length);
      renderGrid();
    };

    let rendered = false;
    let shardLoaded = false;
    try {
      const manifestRes = await fetch("catalog-manifest.json?v=30k1",{cache:"force-cache"});
      if(manifestRes.ok){
        const manifest=await manifestRes.json();
        const info=manifest?.categories?.[sourceSlug];
        catalogPages=Array.isArray(info?.pages)?info.pages:[];
        catalogTotalCount=Number(info?.count||0);
        nextCatalogPageIndex=0;
        if(catalogPages.length){
          const firstPath=catalogPages[0];
          const firstRes=await fetch(firstPath+"?v=30k1",{cache:"force-cache"});
          if(firstRes.ok){
            const first=await firstRes.json();
            const rows=Array.isArray(first?.products)?first.products:[];
            nextCatalogPageIndex=1;
            applyRows(rows,"CJ paged");
            rendered=true;
            shardLoaded=true;
          }
        } else if(info && Number(info.count)===0){
          applyRows([],"CJ paged");
          rendered=true;
          shardLoaded=true;
        }
      }
    } catch(err) {
      console.warn("HUNT manifest load failed",err);
    }

    if (shardLoaded) return;

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

  $("#hd-cat-apply")?.addEventListener("click",event=>scheduleRenderGrid({reset:true,button:event.currentTarget}));
  $("#hd-cat-sort")?.addEventListener("change",()=>scheduleRenderGrid({reset:true}));
  $("#hd-applied-filter-chips")?.addEventListener("click",event=>{
    const chip=event.target.closest?.("[data-clear-filter]");
    if(chip)clearFilter(chip.dataset.clearFilter||"");
  });
  $("#hd-filter-clear-all")?.addEventListener("click",()=>{
    if(sub){location.href=H.categoryUrl(slug);return;}
    if($("#hd-price-min"))$("#hd-price-min").value="";
    if($("#hd-price-max"))$("#hd-price-max").value="";
    scheduleRenderGrid({reset:true});
  });
  document.querySelectorAll("[data-view-mode]").forEach(button => {
    button.addEventListener("click", () => applyViewMode(button.dataset.viewMode));
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("[data-product-view]");
    if (!link) return;
    const product = rawResults.find(p=>productKey(p)===link.dataset.productView);
    if (product) H.recordSignal(product,"view");
  });

  window.addEventListener("hunt:personalization-ready",()=>{if(rawResults.length)renderGrid({reset:true})});
  window.addEventListener("hunt:country-changed",()=>{if(rawResults.length)renderGrid({reset:true})});
  window.addEventListener("hunt:experience-language",()=>{if(rawResults.length)renderGrid()});

  load().catch(err=>{
    $("#hd-cat-provider-state").textContent = err.message || "Category unavailable";
    $("#hd-category-empty").hidden = false;
  });
})();
