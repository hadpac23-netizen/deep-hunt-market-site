(() => {
  const H = window.HuntCore;
  if (!H) return;
  const $ = q => document.querySelector(q);
  const esc = v => H.esc(String(v ?? ""));
  const HOME_MODE_KEY = "hunt_home3_mode_v1";
  let latestShelves = null;

  const departmentOrder = ["women","accessories","beauty","shoes","men","kids","home","tech","sports","pets","toys","travel","office","gifts"];

  function unique(items) {
    const seen = new Set(), out = [];
    for (const item of items || []) {
      const key = `${item?.provider || ""}:${item?.item_id || ""}`;
      if (!item?.item_id || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }

  function slugsFor(department) {
    return [department,...(H.departmentSubcategories?.[department] || [])];
  }

  function fromSlugs(shelves, slugs, limit=30) {
    const out = [];
    for (const slug of slugs) {
      for (const item of Array.isArray(shelves?.[slug]) ? shelves[slug] : []) out.push(item);
    }
    return unique(out).slice(0,limit);
  }

  function isWomen(item) {
    const category = String(item?.category || "").toLowerCase();
    const title = String(item?.title || "").toLowerCase();
    if (category.startsWith("women-")) return true;
    if (/\bunisex\b/.test(title)) return false;
    return /\b(women(?:'s)?|woman|female|ladies|girl)\b/.test(title) && !/\b(men(?:'s)?|male|gentlemen)\b/.test(title);
  }

  function retail(item) {
    const amount = Number(item?.retail_price_amount);
    const ready = item?.retail_price_verified === true
      && String(item?.profit_gate_status || "").toUpperCase() === "PASS"
      && Number.isFinite(amount) && amount > 0;
    return ready ? H.money(amount,item.retail_currency || item.currency || "USD") : "Price checked on product";
  }

  function card(item,{className="",label=""}={}) {
    if (!item) return "";
    const href = H.productUrl(item);
    const image = typeof item.image_url === "string" && item.image_url.startsWith("https://")
      ? `<img src="${esc(item.image_url)}" alt="${esc(item.title || "Product")}" loading="lazy">`
      : `<div class="hd-home3-placeholder">H</div>`;
    const badge = label ? `<span class="hd-home3-card-label">${esc(label)}</span>` : "";
    return `<article class="hd-market-product-card hd-home3-card ${esc(className)}" data-category="${esc(item.category || "")}">
      <a class="hd-market-card-media hd-home3-media" href="${esc(href)}">${image}${badge}</a>
      <div class="hd-market-card-body hd-home3-card-body">
        <a class="hd-market-card-title hd-home3-title" href="${esc(href)}">${esc(item.title || "Product")}</a>
        <div class="hd-market-card-price"><strong>${esc(retail(item))}</strong></div>
      </div>
    </article>`;
  }

  function heroTile(item,index) {
    const classes = index===0 ? "hero-main" : index===1 ? "hero-tall" : "hero-small";
    return card(item,{className:`hd-home3-hero-tile ${classes}`,label:index===0?"HUNT EDIT":""});
  }

  function setupMegaMenu() {
    const btn=$("#hd-all-categories"), menu=$("#hd-mega-menu");
    if(!btn||!menu)return;
    const build=()=>departmentOrder.map(slug=>{
      const def=H.categoryDefs?.[slug];
      if(!def)return "";
      const subs=(H.departmentSubcategories?.[slug]||[]).slice(0,7);
      return `<section><h3><a href="${esc(H.categoryUrl(slug))}">${esc(def.title)}</a></h3><div>${subs.map(sub=>{
        const subDef=H.categoryDefs?.[sub];
        return subDef?`<a href="category.html?c=${encodeURIComponent(slug)}&sub=${encodeURIComponent(sub)}">${esc(subDef.title)}</a>`:"";
      }).join("")}</div></section>`;
    }).join("");
    const open=()=>{menu.innerHTML=build();menu.hidden=false;btn.setAttribute("aria-expanded","true")};
    const close=()=>{menu.hidden=true;btn.setAttribute("aria-expanded","false")};
    btn.addEventListener("click",()=>menu.hidden?open():close());
    document.addEventListener("click",e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==btn)close()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }

  function renderHero(shelves) {
    const host=$("#hd-home3-hero-mosaic");
    if(!host)return;
    const women=fromSlugs(shelves,[
      "women-dresses","women-tops","women-shoes","women-bottoms","women-outerwear","bags","jewelry-earrings"
    ],80).filter(isWomen);
    const fallback=unique(Object.values(shelves||{}).flat()).slice(0,20);
    const picks=unique([...women,...fallback]).slice(0,5);
    host.innerHTML=picks.map(heroTile).join("") || `<div class="hd-home3-loading">Catalog imagery is loading.</div>`;
  }

  function renderWomen(shelves) {
    const host=$("#hd-home3-women");
    if(!host)return;
    const rows=fromSlugs(shelves,[
      "women-dresses","women-tops","women-bottoms","women-shoes","women-outerwear","women-knitwear"
    ],90).filter(isWomen).slice(0,7);
    host.innerHTML=rows.map((item,index)=>card(item,{className:index===0?"editorial-lead":"",label:index===0?"WOMEN EDIT":""})).join("");
  }

  function renderMiniWorld(hostId,shelves,slugs,label) {
    const host=$(hostId);
    if(!host)return;
    const rows=fromSlugs(shelves,slugs,12).slice(0,4);
    host.innerHTML=rows.map((item,index)=>card(item,{className:index===0?"mini-lead":"",label:index===0?label:""})).join("");
  }

  function signalSlugs() {
    const ranked=Object.entries(H.signals?.()||{})
      .filter(([slug,score])=>H.categoryDefs?.[slug]&&Number(score)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1]))
      .map(([slug])=>slug).slice(0,5);
    return ranked.length ? ranked.flatMap(slug=>slugsFor(slug)) : [
      ...slugsFor("women"),...slugsFor("accessories"),...slugsFor("beauty"),...slugsFor("home")
    ];
  }

  function renderForYou(shelves) {
    const mode=localStorage.getItem(HOME_MODE_KEY)||"for-you";
    const buttons=[...document.querySelectorAll("[data-home3-mode]")];
    buttons.forEach(btn=>btn.classList.toggle("active",btn.dataset.home3Mode===mode));
    const slugs=mode==="for-you"?signalSlugs():slugsFor(mode);
    let rows=fromSlugs(shelves,slugs,30);
    if(mode==="women")rows=rows.filter(isWomen);
    rows=rows.slice(0,12);
    const host=$("#hd-home3-for-you");
    if(host)host.innerHTML=rows.map(item=>card(item,{label:mode==="for-you"?"FOR YOU":""})).join("");
    const copy=$("#hd-home3-for-you-copy");
    if(copy)copy.textContent=mode==="for-you"
      ? (Object.keys(H.signals?.()||{}).length?"Based on categories you opened, liked or saved on this device.":"A balanced mix while HUNT learns what you browse.")
      : `Showing ${mode} because you chose it.`;
  }

  function renderLook(shelves) {
    const primary=fromSlugs(shelves,["women-dresses"],20).filter(isWomen)[0];
    const bag=fromSlugs(shelves,["bags","women-wallets"],20)[0];
    const jewelry=fromSlugs(shelves,["jewelry-earrings","jewelry-necklaces","jewelry"],20)[0];
    const shoe=fromSlugs(shelves,["women-shoes"],20).filter(isWomen)[0];
    const picks=unique([primary,bag,jewelry,shoe].filter(Boolean));
    const host=$("#hd-home3-look-products");
    if(host)host.innerHTML=picks.map((item,index)=>card(item,{label:index===0?"START HERE":"MATCH"})).join("");
    const cta=$("#hd-home3-look-cta");
    if(cta&&primary)cta.href=H.productUrl(primary);
  }

  function renderFresh(shelves) {
    const all=unique(Object.values(shelves||{}).flat());
    let rows=all.filter(item=>H.isNewArrival?.(item)).slice(0,12);
    const trulyNew=rows.length>0;
    if(!rows.length){
      const rotation=[
        ...fromSlugs(shelves,slugsFor("women"),8),
        ...fromSlugs(shelves,slugsFor("accessories"),8),
        ...fromSlugs(shelves,slugsFor("beauty"),8),
        ...fromSlugs(shelves,slugsFor("tech"),8)
      ];
      rows=unique(rotation).slice(0,12);
    }
    const label=$("#hd-home3-fresh-label"), title=$("#hd-home3-fresh-title");
    if(label)label.textContent=trulyNew?"VERIFIED NEW ARRIVALS":"FRESH CATALOG ROTATION";
    if(title)title.textContent=trulyNew?"New in HUNT.":"A fresh way through HUNT.";
    const host=$("#hd-home3-fresh");
    if(host)host.innerHTML=rows.map(item=>card(item,{label:trulyNew?"NEW":""})).join("");
  }

  function render(data) {
    latestShelves=data?.shelves||{};
    if(!Object.values(latestShelves).some(rows=>Array.isArray(rows)&&rows.length))return;
    renderHero(latestShelves);
    renderWomen(latestShelves);
    renderMiniWorld("#hd-home3-accessories",latestShelves,[
      "bags","jewelry-earrings","jewelry-necklaces","jewelry-rings","watches","hair-accessories"
    ],"ACCESSORIES");
    renderMiniWorld("#hd-home3-beauty",latestShelves,[
      "makeup","skincare","body-care","beauty-tools","hair","nails"
    ],"BEAUTY");
    renderForYou(latestShelves);
    renderLook(latestShelves);
    renderFresh(latestShelves);
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-home3-mode]");
    if(!button)return;
    localStorage.setItem(HOME_MODE_KEY,button.dataset.home3Mode||"for-you");
    if(latestShelves)renderForYou(latestShelves);
  });

  setupMegaMenu();
  window.addEventListener("hunt:shelves",event=>render(event.detail));
  if(window.HuntMarketShelves)render(window.HuntMarketShelves);
})();