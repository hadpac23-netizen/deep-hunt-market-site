(() => {
  const H = window.HuntCore;
  if (!H) return;

  const $ = q => document.querySelector(q);
  const modeKey = "hunt_shop_mode_v2";
  let lastData = null;

  const departmentOrder = ["women","men","kids","beauty","accessories","tech","home","sports","pets","toys","travel","office","gifts"];
  const departments = departmentOrder.map(slug => ({
    title:H.categoryDefs?.[slug]?.title || slug.replace(/-/g," "),
    slug,
    href:H.categoryUrl(slug),
    items:[slug,...(H.departmentSubcategories?.[slug] || [])]
  }));

  function linkFor(groupSlug, subSlug) {
    if (groupSlug && (H.departmentSubcategories?.[groupSlug] || []).includes(subSlug)) {
      return `category.html?c=${encodeURIComponent(groupSlug)}&sub=${encodeURIComponent(subSlug)}`;
    }
    return H.categoryUrl(subSlug || groupSlug);
  }

  function chunks(items,size=7){
    const out=[];
    for(let i=0;i<items.length;i+=size)out.push(items.slice(i,i+size));
    return out;
  }

  function flatUnique(shelves){
    const out=[],seen=new Set();
    for(const rows of Object.values(shelves||{})){
      for(const item of Array.isArray(rows)?rows:[]){
        const key=String(item?.provider||"")+":"+String(item?.item_id||"");
        if(!item?.item_id||seen.has(key))continue;
        seen.add(key);
        out.push(item);
      }
    }
    return out;
  }

  function menuGroups(slug,items){
    const rules={
      women:[
        ["Clothing",/women-(?:dresses|evening|suits|tops|jeans|bottoms|skirts|knitwear|outerwear|hoodies|clothing)/],
        ["Intimates & Leisure",/women-(?:underwear|sleepwear|swim|socks)/],
        ["Shoes & Accessories",/women-(?:shoes|wallets)/]
      ],
      men:[
        ["Clothing",/men-(?:tops|suits|jeans|bottoms|outerwear|knitwear|hoodies|clothing)/],
        ["Underwear & Leisure",/men-(?:boxers|underwear|sleepwear|socks)/],
        ["Shoes & Accessories",/men-(?:shoes|bags|wallets|accessories)/]
      ],
      kids:[["Kids",/^kids-/],["Baby",/^baby(?:-|$)/]],
      beauty:[["Beauty",/^(?:makeup|skincare|body-care|nails|hair|beauty-tools)$/]],
      accessories:[["Jewelry",/^jewelry/],["Bags & Style",/^(?:bags|watches|hats|belts|scarves|gloves|hair-accessories|bag-accessories|keychains|socks)$/]],
      tech:[["Phone",/^(?:phone-cases|chargers-cables|power-banks|stands-holders)$/],["Electronics",/^(?:audio|wearables|wearable-accessories|smart-home|cameras|computer-accessories|electronics|gaming)$/]],
      home:[["Home",/^(?:home-storage|home-decor|bedding|bath|lighting)$/],["Kitchen & Utility",/^(?:kitchen|drinkware|cleaning|small-appliances|tools-diy)$/]]
    };
    const remaining=new Set(items),out=[];
    for(const [label,re] of (rules[slug]||[])){
      const rows=items.filter(x=>remaining.has(x)&&re.test(x));
      rows.forEach(x=>remaining.delete(x));
      if(rows.length)out.push([label,rows]);
    }
    const rest=[...remaining];
    if(rest.length)chunks(rest,7).forEach((rows,i)=>out.push([i?"More":"Shop by category",rows]));
    return out;
  }

  function departmentMenuHtml(slug){
    const title=H.categoryDefs?.[slug]?.title || slug.replace(/-/g," ");
    const items=H.departmentSubcategories?.[slug] || [];
    const sections=menuGroups(slug,items).map(([label,group],index)=>{
      const links=group.map(sub=>{
        const def=H.categoryDefs?.[sub];
        if(!def)return "";
        return `<a href="${H.esc(linkFor(slug,sub))}">${H.esc(def.title)}</a>`;
      }).join("");
      const shopAll=index===0 ? `<a class="hd-mega-shop-all" href="${H.esc(H.categoryUrl(slug))}">Shop all ${H.esc(title)} →</a>` : "";
      return `<section><h3>${H.esc(label)}</h3>${shopAll}<div>${links}</div></section>`;
    }).join("");
    return sections || `<section><h3>${H.esc(title)}</h3><a class="hd-mega-shop-all" href="${H.esc(H.categoryUrl(slug))}">Shop all →</a></section>`;
  }

  function allDepartmentsMenuHtml(){
    return departmentOrder.map(slug=>{
      const title=H.categoryDefs?.[slug]?.title || slug.replace(/-/g," ");
      const items=(H.departmentSubcategories?.[slug] || []).slice(0,8);
      const links=items.map(sub=>{
        const def=H.categoryDefs?.[sub];
        return def ? `<a href="${H.esc(linkFor(slug,sub))}">${H.esc(def.title)}</a>` : "";
      }).join("");
      return `<section><h3><a href="${H.esc(H.categoryUrl(slug))}">${H.esc(title)}</a></h3><div>${links}</div></section>`;
    }).join("");
  }

  function setupMegaMenu() {
    const button = $("#hd-all-categories");
    const menu = $("#hd-mega-menu");
    if (!menu) return;
    const navLinks=[...document.querySelectorAll('.hd-nav a[href*="category.html?c="], .hd-department-bar a[href*="category.html?c="]')];
    let closeTimer=null;
    let activeTrigger=null;
    const clearTimer=()=>{if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}};
    const close=()=>{
      clearTimer();
      menu.hidden=true;
      menu.removeAttribute("data-department");
      button?.setAttribute("aria-expanded","false");
      navLinks.forEach(link=>link.setAttribute("aria-expanded","false"));
      activeTrigger=null;
    };
    const open=(slug="",trigger=button)=>{
      clearTimer();
      menu.innerHTML=slug ? departmentMenuHtml(slug) : allDepartmentsMenuHtml();
      if(slug)menu.dataset.department=slug; else menu.removeAttribute("data-department");
      menu.hidden=false;
      button?.setAttribute("aria-expanded",String(!slug));
      navLinks.forEach(link=>link.setAttribute("aria-expanded",String(link===trigger)));
      activeTrigger=trigger;
    };
    const scheduleClose=()=>{clearTimer();closeTimer=setTimeout(close,180);};

    if(button){
      button.setAttribute("aria-haspopup","true");
      button.addEventListener("click",()=>menu.hidden||menu.dataset.department?open("",button):close());
      button.addEventListener("pointerenter",()=>open("",button));
      button.addEventListener("focus",()=>open("",button));
      button.addEventListener("pointerleave",scheduleClose);
    }

    navLinks.forEach(link=>{
      let slug="";
      try{slug=new URL(link.href,location.href).searchParams.get("c")||"";}catch{}
      if(!slug || !H.departmentSubcategories?.[slug])return;
      link.setAttribute("aria-haspopup","true");
      link.setAttribute("aria-expanded","false");
      link.addEventListener("pointerenter",()=>open(slug,link));
      link.addEventListener("focus",()=>open(slug,link));
      link.addEventListener("click",event=>{
        const inDepartmentBar=Boolean(link.closest(".hd-department-bar"));
        const touchLike=window.matchMedia?.("(pointer: coarse)")?.matches || window.innerWidth<=900;
        if((inDepartmentBar || touchLike) && (menu.hidden || menu.dataset.department!==slug)){
          event.preventDefault();
          open(slug,link);
        }
      });
    });

    document.querySelector(".hd-nav")?.addEventListener("pointerleave",scheduleClose);
    document.querySelector(".hd-department-bar")?.addEventListener("pointerleave",scheduleClose);
    menu.addEventListener("pointerenter",clearTimer);
    menu.addEventListener("pointerleave",scheduleClose);

    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!menu.hidden){
        const trigger=activeTrigger;
        close();
        trigger?.focus?.();
      }
    });
    document.addEventListener("click",event=>{
      if(menu.hidden)return;
      if(menu.contains(event.target)||button?.contains(event.target)||navLinks.some(link=>link.contains(event.target)))return;
      close();
    });
  }

  const livingWorlds=[
    {name:"Weekend Escape",copy:"Travel-ready picks that work together.",slugs:["luggage","bags","phone-cases","power-banks","drinkware"]},
    {name:"Gym Reset",copy:"Fitness and everyday training picks in one place.",slugs:["fitness","fitness-accessories","active-bottoms","sports-bags","drinkware"]},
    {name:"Phone Upgrade",copy:"A cleaner phone setup with useful add-ons.",slugs:["phone-cases","chargers-cables","power-banks","stands-holders","audio"]},
    {name:"Pet Home",copy:"Useful picks for pets and the home around them.",slugs:["pet-accessories","pet-toys","pet-feeding","pet-beds"]},
    {name:"Home Refresh",copy:"Small changes that make a room feel new.",slugs:["home-decor","lighting","home-storage","bedding","kitchen"]},
    {name:"Beauty Edit",copy:"Beauty discovery across care, tools and makeup.",slugs:["skincare","makeup","beauty-tools","hair"]},
    {name:"Everyday Carry",copy:"Compact essentials for the bag, pocket and phone.",slugs:["bags","wallets","keychains","phone-cases","power-banks"]},
    {name:"Desk Upgrade",copy:"Useful pieces for a cleaner everyday workspace.",slugs:["computer-accessories","lighting","stationery","stands-holders","drinkware"]},
    {name:"Style Mix",copy:"Fashion and accessories built for browsing together.",slugs:["women-tops","women-bottoms","bags","jewelry","women-shoes"]},
    {name:"Gift Run",copy:"Easy-to-browse ideas across accessories, home and fun.",slugs:["jewelry","home-decor","toys","drinkware","party"]},
    {name:"Kids Day",copy:"A practical mix for kids, baby and play.",slugs:["kids-clothing","kids-shoes","kids-accessories","baby","toys"]}
  ];

  function livingWorldsForSession(count=2) {
    const key="hunt_living_worlds_v2";
    let indexes=[];
    try{indexes=JSON.parse(sessionStorage.getItem(key)||"[]")}catch{}
    indexes=(Array.isArray(indexes)?indexes:[]).filter((x,i,a)=>Number.isInteger(x)&&x>=0&&x<livingWorlds.length&&a.indexOf(x)===i);
    while(indexes.length<Math.min(count,livingWorlds.length)){
      const seed=new Uint32Array(1);
      crypto.getRandomValues(seed);
      const index=seed[0]%livingWorlds.length;
      if(!indexes.includes(index))indexes.push(index);
    }
    indexes=indexes.slice(0,count);
    sessionStorage.setItem(key,JSON.stringify(indexes));
    return indexes.map(index=>livingWorlds[index]);
  }

  function mode() {
    const value = localStorage.getItem(modeKey) || "for-you";
    return ["for-you","women","men","home","tech"].includes(value) ? value : "for-you";
  }

  function modeSlugs(value) {
    const expand=slug=>[slug,...(H.departmentSubcategories?.[slug] || [])];
    if (value === "women") return expand("women");
    if (value === "men") return expand("men");
    if (value === "home") return expand("home");
    if (value === "tech") return expand("tech");
    const signals = H.signals();
    const ranked = Object.entries(signals)
      .filter(([slug,score]) => H.categoryDefs[slug] && Number(score) > 0)
      .sort((a,b) => Number(b[1]) - Number(a[1]))
      .map(([slug]) => slug)
      .slice(0,5);
    if (ranked.length) return [...new Set(ranked.flatMap(expand))];
    return [...new Set(["women","men","home","beauty","tech","kids","travel"].flatMap(expand))];
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
    const retailAmount = Number(item?.retail_price_amount);
    const retailReady = item?.retail_price_verified === true
      && String(item?.profit_gate_status || "").toUpperCase() === "PASS"
      && Number.isFinite(retailAmount)
      && retailAmount > 0;
    const retailEstimated = !retailReady && Number.isFinite(retailAmount) && retailAmount > 0;
    const price = retailReady ? H.money(retailAmount, item.retail_currency || item.currency || "USD") : (retailEstimated ? `From ${H.money(retailAmount,item.retail_currency || item.currency || "USD")}` : "Price pending");
    const newBadge=H.isNewArrival?.(item)?`<b class="hd-new-pulse">NEW</b>`:"";
    return `<article class="hd-wow-product" role="listitem" data-category="${H.esc(item.category || "")}">
      <a class="hd-wow-product-media" href="${H.esc(href)}">${image}<span>${H.esc(label)}</span>${newBadge}</a>
      <div class="hd-wow-product-body">
        <small>${H.esc(item.provider || "CATALOG SOURCE")}</small>
        <a href="${H.esc(href)}">${H.esc(item.title || "Product")}</a>
        <div class="hd-wow-price"><strong>${price}</strong><em>${retailReady ? "HUNT retail" : (retailEstimated ? "verify on product" : "price pending")}</em></div>
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
    const image = rep
      ? `<img src="${H.esc(rep.image_url)}" alt="" loading="lazy">`
      : '<div class="hd-dept-placeholder" aria-hidden="true">H</div>';
    return `<a class="hd-dept-card" href="${H.esc(dep.href || H.categoryUrl(dep.slug))}">
      <div class="hd-dept-image">${image}</div>
      <div><strong>${H.esc(dep.title)}</strong><span>Explore department</span></div>
    </a>`;
  }

  function renderPersonalized(shelves) {
    const value = mode();
    let products = pickProducts(shelves, modeSlugs(value), value === "women" ? 100 : 16);
    if (value === "women") products = products.filter(isWomenItem).slice(0,16);
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
    if (copy) copy.textContent = value === "for-you"
      ? (Object.keys(H.signals()).length ? "Based on categories you viewed on this device." : "A balanced mix while HUNT learns what you browse.")
      : `Showing ${value} picks by your choice.`;
  }  function render(data) {
    lastData = data;
    const shelves = data?.shelves || {};
    const all = flatUnique(shelves);
    if (!all.length) return;

    const hero = $(".hd-hero-copy");
    let proof = hero?.querySelector(".hd-live-proof");
    if (hero && !proof) {
      proof = document.createElement("div");
      proof.className = "hd-live-proof";
      proof.setAttribute("aria-label","Marketplace catalog qualities");
      hero.querySelector(":scope > p")?.after(proof);
    }
    if (proof) proof.innerHTML = `
      <div><strong>Curated</strong><span>DYNAMIC PRODUCT MIX</span></div>
      <div><strong>Country-aware</strong><span>SHIPPING + PROFIT GATES</span></div>
      <div><strong>Live recheck</strong><span>PRICE · STOCK · SHIPPING</span></div>`;

    let showcase = $("#hd-wow-showcase");
    if (!showcase) {
      showcase = document.createElement("section");
      showcase.id = "hd-wow-showcase";
      showcase.className = "hd-wow-showcase";
      $("#shop")?.before(showcase);
    }

    const worlds=livingWorldsForSession(2);
    const worldSections=worlds.map((world,index)=>{
      let worldProducts=pickProducts(shelves,world.slugs,12);
      if(worldProducts.length<6)worldProducts=[...worldProducts,...all.filter(x=>!worldProducts.some(y=>String(y.item_id)===String(x.item_id))).slice(0,12-worldProducts.length)];
      return `<section class="hd-living-world" aria-labelledby="hd-living-world-title-${index}">
        <div class="hd-for-you-head"><div><small>BOOM LIVING WORLD</small><h3 id="hd-living-world-title-${index}">${H.esc(world.name)}</h3><p>${H.esc(world.copy)} The mix changes between browsing sessions.</p></div><a class="hd-btn" href="search.html?q=${encodeURIComponent(world.name)}">Explore mission</a></div>
        <div class="hd-wow-track" role="list">${worldProducts.map(x=>productCard(x,"WORLD PICK")).join("")}</div>
      </section>`;
    }).join("");
    const cjAll = all.filter(x => String(x.provider).toLowerCase().includes("cj"));
    const cjNew = cjAll.filter(x => H.isNewArrival?.(x)).slice(0,12);
    const cj = (cjNew.length ? cjNew : cjAll).slice(0,12);
    const cjTitle = cjNew.length ? "New arrivals from CJdropshipping" : "More from CJdropshipping";
    const cjLabel = cjNew.length ? "NEW ARRIVALS" : "SOURCE PICKS";
    showcase.innerHTML = `
      <div class="hd-wow-head">
        <div><div class="hd-kicker hd-kicker-small">SHOP BY DEPARTMENT</div><h2>Everything is easier to find now.</h2>
        <p>Large departments first, detailed subcategories inside. The visible mix changes by relevance and freshness, not catalog size.</p></div>
        <span class="hd-wow-live" aria-live="polite"><i></i>FRESH NOW</span>
      </div>
      <div class="hd-dept-grid">${departments.map(dep => departmentCard(dep,shelves)).join("")}</div>
      ${worldSections}
      <section class="hd-for-you" id="for-you" aria-labelledby="hd-for-you-title">
        <div class="hd-for-you-head"><div><small>PERSONALIZED SHOPPING</small><h3 id="hd-for-you-title">For You</h3><p id="hd-for-you-copy"></p></div>
          <div class="hd-mode-switch" aria-label="Choose shopping view">
            <button type="button" data-shop-mode="for-you">For You</button><button type="button" data-shop-mode="women">Women</button>
            <button type="button" data-shop-mode="men">Men</button><button type="button" data-shop-mode="home">Home</button><button type="button" data-shop-mode="tech">Tech</button>
          </div>
        </div>
        <div class="hd-wow-track" id="hd-for-you-products"></div>
      </section>
      ${cj.length ? `<section class="hd-fresh-source"><div class="hd-wow-rail-head"><div><small>${cjLabel}</small><h3>${cjTitle}</h3></div><span>LIVE API</span></div><div class="hd-wow-track" role="list">${cj.map(x => productCard(x,cjNew.length?"NEW":"CJ LIVE")).join("")}</div></section>` : ""}`;
    renderPersonalized(shelves);
  }  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-shop-mode]");
    if (!button) return;
    localStorage.setItem(modeKey, button.dataset.shopMode || "for-you");
    if (lastData) renderPersonalized(lastData.shelves || {});
  });

  setupMegaMenu();
    window.addEventListener("hunt:shelves", event => render(event.detail));
  if (window.HuntMarketShelves) render(window.HuntMarketShelves);
})();