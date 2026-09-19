(() => {
  const H = window.HuntCore;
  if (!H) return;
  const $ = q => document.querySelector(q);
  const esc = v => H.esc(String(v ?? ""));
  const HOME_MODE_KEY = "hunt_home3_mode_v1";
  let latestShelves = null;

  const departmentOrder = ["women","men","kids","beauty","accessories","tech","home","sports","pets","toys","travel","office","gifts"];

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
    const rows=unique(out);
    return (window.HuntCountry?.rank?.(rows)||rows).slice(0,limit);
  }

  function broadDepartmentForItem(item) {
    const slug=H.inferCategory?.(item)||String(item?.category||"");
    if(H.departmentSubcategories?.[slug])return slug;
    for(const [parent,children] of Object.entries(H.departmentSubcategories||{}))if((children||[]).includes(slug))return parent;
    return slug;
  }

  function balancedItems(items,departments,limit=24) {
    const groups=new Map(departments.map(dep=>[dep,[]])), other=[];
    for(const item of unique(items||[])){
      const group=groups.get(broadDepartmentForItem(item));
      if(group)group.push(item); else other.push(item);
    }
    const out=[];let moved=true;
    while(moved&&out.length<limit){
      moved=false;
      for(const dep of departments){
        const group=groups.get(dep);
        if(group?.length&&out.length<limit){out.push(group.shift());moved=true;}
      }
    }
    return unique([...out,...other]).slice(0,limit);
  }

  function balancedDepartmentMix(shelves,departments,perDepartment=2,limit=24) {
    const groups=departments.map(dep=>fromSlugs(shelves,slugsFor(dep),24).slice(0,perDepartment));
    const out=[];
    for(let i=0;i<perDepartment;i++){
      for(const group of groups)if(group[i])out.push(group[i]);
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
    const menuGroups=[
      {key:"style",title:"STYLE",departments:["women","men","kids","beauty","accessories"]},
      {key:"living",title:"LIVING",departments:["home","sports","travel","pets"]},
      {key:"tech-play",title:"TECH & PLAY",departments:["tech","toys","office","gifts"]}
    ];
    const departmentSection=slug=>{
      const def=H.categoryDefs?.[slug];
      if(!def)return "";
      const subs=(H.departmentSubcategories?.[slug]||[]).slice(0,6);
      return `<section><h3><a href="${esc(H.categoryUrl(slug))}">${esc(def.title)}</a></h3><div>${subs.map(sub=>{
        const subDef=H.categoryDefs?.[sub];
        return subDef?`<a href="category.html?c=${encodeURIComponent(slug)}&sub=${encodeURIComponent(sub)}">${esc(subDef.title)}</a>`:"";
      }).join("")}</div></section>`;
    };
    const build=()=>menuGroups.map(group=>`<div class="hd-mega-cluster" data-menu-zone="${group.key}"><div class="hd-mega-cluster-label">${group.title}</div><div class="hd-mega-cluster-grid">${group.departments.map(departmentSection).join("")}</div></div>`).join("");
    const open=()=>{menu.innerHTML=build();menu.hidden=false;btn.setAttribute("aria-expanded","true")};
    const close=()=>{menu.hidden=true;btn.setAttribute("aria-expanded","false")};
    const toggle=()=>menu.hidden?open():close();
    btn.addEventListener("click",toggle);
    document.querySelectorAll("[data-open-categories]").forEach(trigger=>trigger.addEventListener("click",event=>{
      event.preventDefault();
      document.querySelector("#departments")?.scrollIntoView({behavior:"smooth",block:"start"});
      open();
    }));
    document.addEventListener("click",e=>{if(!menu.hidden&&!menu.contains(e.target)&&!btn.contains(e.target)&&!e.target.closest?.("[data-open-categories]"))close()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }

  function renderHero(shelves) {
    const host=$("#hd-home3-hero-mosaic");
    if(!host)return;
    const broad=["women","men","kids","beauty","tech","home","sports","accessories"];
    const balanced=balancedDepartmentMix(shelves,broad,1,8);
    const fallback=balancedItems(unique(Object.values(shelves||{}).flat()),broad,8);
    const picks=unique([...balanced,...fallback]).slice(0,5);
    host.innerHTML=picks.map(heroTile).join("") || `<div class="hd-home3-loading">Catalog imagery is loading.</div>`;
  }

  function renderWomen(shelves) {
    const host=$("#hd-home3-women");
    if(!host)return;
    const rows=fromSlugs(shelves,[
      "women-dresses","women-tops","women-bottoms","women-shoes","women-outerwear","women-knitwear"
    ],90).filter(isWomen).slice(0,6);
    host.innerHTML=rows.map((item,index)=>card(item,{label:index===0?"WOMEN":""})).join("");
  }

  function renderMiniWorld(hostId,shelves,slugs,label) {
    const host=$(hostId);
    if(!host)return;
    const rows=fromSlugs(shelves,slugs,12).slice(0,4);
    host.innerHTML=rows.map((item,index)=>card(item,{className:index===0?"mini-lead":"",label:index===0?label:""})).join("");
  }

  function signalSlugs() {
    const explicit=H.shoppingPreferences?.().categories||[];
    const ranked=Object.entries(H.signals?.()||{})
      .filter(([slug,score])=>H.categoryDefs?.[slug]&&Number(score)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1]))
      .map(([slug])=>slug).slice(0,5);
    const combined=[...new Set([...explicit,...ranked])].slice(0,6);
    return combined.length ? combined.flatMap(slug=>slugsFor(slug)) : [
      ...slugsFor("women"),...slugsFor("men"),...slugsFor("kids"),...slugsFor("beauty"),
      ...slugsFor("tech"),...slugsFor("home"),...slugsFor("sports"),...slugsFor("accessories")
    ];
  }

  const priorityDepartments=["women","men","beauty","tech","home","accessories","sports","kids"];

  function destinationMarket() {
    return window.HuntCountry?.market?.() || (()=>{try{return String(localStorage.getItem("hunt_destination_market_v1")||"").toUpperCase()}catch{return ""}})();
  }

  function broadPriority(slug) {
    if(priorityDepartments.includes(slug)) return slug;
    return priorityDepartments.find(parent => (H.departmentSubcategories?.[parent]||[]).includes(slug)) || "";
  }

  function topPreference() {
    const explicit=H.shoppingPreferences?.().categories||[];
    for(const slug of explicit){
      const broad=broadPriority(slug);
      if(broad)return broad;
    }
    const ranked=Object.entries(H.signals?.()||{})
      .filter(([slug,score])=>H.categoryDefs?.[slug]&&Number(score)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1]));
    for(const [slug] of ranked){
      const broad=broadPriority(slug);
      if(broad)return broad;
    }
    return "";
  }

  function applyPersonalLayout() {
    const top=topPreference();
    document.body.dataset.huntPriority=top||"balanced";
    applyBuildingOrder();
  }

  function renderForYou(shelves) {
    const mode=localStorage.getItem(HOME_MODE_KEY)||"for-you";
    const buttons=[...document.querySelectorAll("[data-home3-mode]")];
    buttons.forEach(btn=>btn.classList.toggle("active",btn.dataset.home3Mode===mode));
    const slugs=mode==="for-you"?signalSlugs():slugsFor(mode);
    const broad=["women","men","kids","beauty","tech","home","accessories","sports"];
    const hasPersonalSignals=(H.shoppingPreferences?.().categories||[]).length>0||Object.values(H.signals?.()||{}).some(score=>Number(score)>0);
    let rows;
    if(mode==="for-you"){
      const balanced=balancedDepartmentMix(shelves,broad,1,8);
      const personal=hasPersonalSignals?fromSlugs(shelves,slugs,12).slice(0,2):[];
      rows=unique([...personal,...balanced]).slice(0,6);
    }else{
      rows=fromSlugs(shelves,slugs,30);
    }
    if(mode==="women")rows=rows.filter(isWomen);
    rows=rows.slice(0,6);
    const host=$("#hd-home3-for-you");
    if(host)host.innerHTML=rows.map(item=>card(item,{label:mode==="for-you"?"FOR YOU":""})).join("");
    const copy=$("#hd-home3-for-you-copy");
    if(copy){
      const t=window.HuntExperienceI18n?.t;
      if(mode==="for-you") copy.textContent=t?.("forYouCopy")||"A balanced mix while HUNT learns what you browse.";
      else copy.textContent=(H.categoryDefs?.[mode]?.title||mode);
    }
  }

  function renderLook(shelves) {
    const top=topPreference()||"tech";
    const configs={
      women:{title:"Build a complete look.",copy:"Start from one fashion piece and explore real complementary products around it.",primary:["women-dresses","women-tops"],companions:[["bags"],["jewelry-earrings","jewelry-necklaces"],["women-shoes"]]},
      men:{title:"Build a complete men's edit.",copy:"Start from one piece and connect shoes, accessories and practical complements.",primary:["men-tops","men-suits"],companions:[["men-shoes"],["watches"],["men-accessories","men-bags"]]},
      kids:{title:"Build a practical kids set.",copy:"Start from clothing and add useful shoes, accessories or toys from the live catalog.",primary:["kids-clothing","baby-clothing"],companions:[["kids-shoes","baby-shoes"],["kids-accessories"],["toys"]]},
      beauty:{title:"Build a beauty routine.",copy:"Start from one care or makeup product and explore complementary tools and categories.",primary:["skincare","makeup"],companions:[["beauty-tools"],["hair"],["nails","body-care"]]},
      home:{title:"Build a room edit.",copy:"Start from one home piece and connect lighting, organization and useful everyday additions.",primary:["lighting","home-decor"],companions:[["home-storage"],["kitchen"],["bedding","drinkware"]]},
      sports:{title:"Build a training set.",copy:"Start from fitness gear and add accessories, bags and practical hydration products.",primary:["fitness","sports-gear"],companions:[["fitness-accessories"],["sports-bags"],["drinkware"]]},
      accessories:{title:"Build an accessories edit.",copy:"Start from one accessory and explore complementary jewelry, bags and watches.",primary:["bags","watches"],companions:[["jewelry-earrings"],["jewelry-necklaces"],["jewelry-rings"]]},
      tech:{title:"Build a smarter setup.",copy:"Start from one useful device accessory and connect power, audio and desk essentials.",primary:["phone-cases","computer-accessories"],companions:[["chargers-cables"],["power-banks"],["audio","stands-holders"]]}
    };
    const cfg=configs[top]||configs.tech;
    const primary=fromSlugs(shelves,cfg.primary,20)[0];
    const companions=cfg.companions.map(slugs=>fromSlugs(shelves,slugs,20)[0]);
    const picks=unique([primary,...companions].filter(Boolean));
    const host=$("#hd-home3-look-products");
    if(host)host.innerHTML=picks.map((item,index)=>card(item,{label:index===0?"START HERE":"MATCH"})).join("");
    const copy=$("#look-builder .hd-home3-look-copy");
    if(copy){
      const small=copy.querySelector("small"), title=copy.querySelector("h2"), paragraph=copy.querySelector("p");
      if(small)small.textContent="PENTHOUSE · BOOM MISSION BUILDER";
      if(title)title.textContent=cfg.title;
      if(paragraph)paragraph.textContent=cfg.copy+" Price, stock, shipping and Profit Gate remain authoritative at checkout.";
    }
    const cta=$("#hd-home3-look-cta");
    if(cta&&primary){cta.href=H.productUrl(primary);cta.textContent="Start this mission →";}
  }

  function renderFresh(shelves) {
    const all=unique(Object.values(shelves||{}).flat());
    const broad=["women","men","kids","beauty","tech","home","sports","accessories"];
    const newRows=all.filter(item=>H.isNewArrival?.(item));
    let rows=balancedItems(newRows,broad,6);
    const trulyNew=rows.length>0;
    if(!rows.length){
      rows=balancedDepartmentMix(shelves,broad,1,6);
    }
    const label=$("#hd-home3-fresh-label"), title=$("#hd-home3-fresh-title");
    if(label)label.textContent=trulyNew?"VERIFIED NEW ARRIVALS":"FRESH CATALOG ROTATION";
    if(title)title.textContent=trulyNew?"New in HUNT.":"A fresh way through HUNT.";
    const host=$("#hd-home3-fresh");
    if(host)host.innerHTML=rows.map(item=>card(item,{label:trulyNew?"NEW":""})).join("");
  }

  function renderDepartmentFloor(hostId,shelves,department,label,limit=6) {
    const host=$(hostId);
    if(!host)return;
    const rows=fromSlugs(shelves,slugsFor(department),60).slice(0,limit);
    host.innerHTML=rows.map((item,index)=>card(item,{label:index===0?label:""})).join("");
  }

  function renderAiMediaFloor(shelves) {
    const host=$("#hd-building-ai-media");
    if(!host)return;
    const all=unique(Object.values(shelves||{}).flat());
    const approved=all.map(item=>({item,url:window.HuntCreative?.approvedVideo?.({item})||""})).filter(x=>x.url).slice(0,3);
    if(!approved.length){
      host.innerHTML='<div class="hd-building-media-empty"><span>AI MEDIA STUDIO</span><strong>No approved product-linked video is available yet.</strong><p>This floor is reserved for verified HUNT/BOOM video stories. HUNT will not show unrelated or invented product video.</p></div>';
      return;
    }
    host.innerHTML=approved.map(({item,url})=>{
      const poster=typeof item.image_url==="string"&&item.image_url.startsWith("https://")?item.image_url:"";
      return '<article class="hd-building-video-card"><video controls preload="metadata" '+(poster?'poster="'+esc(poster)+'" ':'')+'src="'+esc(url)+'"></video><div><small>APPROVED PRODUCT MEDIA</small><strong>'+esc(item.title||"Product story")+'</strong><a href="'+esc(H.productUrl(item))+'">Open product →</a></div></article>';
    }).join("");
  }

  function buildingFloor({id,floor,title,copy,slug,host}) {
    const section=document.createElement("section");
    section.id=id;
    section.className="hd-building-floor hd-home3-personal";
    section.innerHTML='<div class="hd-home3-section-head"><div><small>'+esc(floor)+'</small><h2>'+esc(title)+'</h2><p>'+esc(copy)+'</p></div><a href="'+esc(H.categoryUrl(slug))+'">Explore department →</a></div><div class="hd-home3-product-grid hd-building-grid" id="'+esc(host)+'"></div>';
    return section;
  }

  function ensureBuildingStructure() {
    const main=$("#main-content"), departments=$("#departments");
    if(!main||!departments)return;
    document.body.classList.add("hd-building-mode");

    if(!$("#hd-building-floor-nav")){
      const nav=document.createElement("nav");
      nav.id="hd-building-floor-nav";
      nav.className="hd-building-floor-nav";
      nav.setAttribute("aria-label","HUNT building floors");
      nav.innerHTML=[
        ["#for-you","Lobby"],["#women-edit","Women"],["#hunt-men-floor","Men"],["#hunt-kids-floor","Kids"],
        ["#hunt-beauty-floor","Beauty"],["#hunt-tech-floor","Tech"],["#hunt-home-floor","Home"],
        ["#hunt-active-floor","Move"],["#hunt-fresh-floor","Fresh"],["#hunt-market-hall","Market"],["#hunt-advertising-floor","Ads"],
        ["#hunt-ai-floor","AI"],["#hunt-ai-media-floor","Media"],["#hunt-penthouse","Penthouse"]
      ].map(([href,label],i)=>'<a href="'+href+'"><span>'+String(i).padStart(2,"0")+'</span>'+label+'</a>').join("");
      departments.after(nav);
    }

    const floors=[
      ["hunt-men-floor","FLOOR 03 · MEN","Men, with equal space.","Clothing, shoes and accessories from the same live catalog — not a secondary shelf.","men","hd-building-men"],
      ["hunt-kids-floor","FLOOR 04 · KIDS & BABY","Kids & Baby.","Clear, practical discovery across clothing, shoes and everyday essentials.","kids","hd-building-kids"],
      ["hunt-tech-floor","FLOOR 06 · PHONE & TECH","Useful tech, clearly grouped.","Phone, charging, audio, wearables and computer accessories.","tech","hd-building-tech"],
      ["hunt-home-floor","FLOOR 07 · HOME & LIVING","A calmer home floor.","Kitchen, lighting, storage, bedding and useful living products.","home","hd-building-home"]
    ];
    floors.forEach(([id,floor,title,copy,slug,host])=>{if(!$("#"+id))main.appendChild(buildingFloor({id,floor,title,copy,slug,host}));});

    const duo=document.querySelector(".hd-home3-duo");
    if(duo){
      duo.id="hunt-beauty-floor";
      duo.classList.add("hd-building-floor","hd-building-duo-floor");
      if(!duo.querySelector(".hd-building-floor-head"))duo.insertAdjacentHTML("afterbegin",'<div class="hd-building-floor-head"><small>FLOOR 05 · BEAUTY & ACCESSORIES</small><h2>Two worlds, one clean floor.</h2><p>Beauty and accessories stay together without interrupting the rest of the building.</p></div>');
    }

    if(!$("#hunt-active-floor")){
      const active=document.createElement("section");
      active.id="hunt-active-floor";
      active.className="hd-building-floor hd-building-triple-floor";
      active.innerHTML='<div class="hd-home3-section-head"><div><small>FLOOR 08 · MOVE, TRAVEL & PETS</small><h2>Life beyond the wardrobe.</h2><p>Sports, travel and pets each get a clear zone instead of being buried in the endless feed.</p></div></div><div class="hd-building-triple"><article><div class="hd-building-mini-head"><span>SPORTS</span><a href="category.html?c=sports">View all →</a></div><div class="hd-home3-product-grid" id="hd-building-sports"></div></article><article><div class="hd-building-mini-head"><span>TRAVEL</span><a href="category.html?c=travel">View all →</a></div><div class="hd-home3-product-grid" id="hd-building-travel"></div></article><article><div class="hd-building-mini-head"><span>PETS</span><a href="category.html?c=pets">View all →</a></div><div class="hd-home3-product-grid" id="hd-building-pets"></div></article></div>';
      main.appendChild(active);
    }

    if(!$("#hunt-fresh-floor")){
      const freshFloor=document.createElement("section");
      freshFloor.id="hunt-fresh-floor";
      freshFloor.className="hd-building-special-floor hd-building-fresh-floor";
      freshFloor.innerHTML='<div class="hd-building-special-head"><small>FLOOR 09 · FRESH MARKET</small><h2>What is new gets breathing room.</h2><p>Fresh arrivals stay visible without being mixed into the long market feed.</p></div><div class="hd-building-fresh-stage"></div>';
      main.appendChild(freshFloor);
      const fresh=$("#fresh-in-hunt"); if(fresh)freshFloor.querySelector(".hd-building-fresh-stage").appendChild(fresh);
    }

    if(!$("#hunt-market-hall")){
      const market=document.createElement("section");
      market.id="hunt-market-hall";
      market.className="hd-building-special-floor hd-building-market-hall";
      market.innerHTML='<div class="hd-building-special-head"><small>FLOOR 10 · MARKET HALL</small><h2>One mixed market. Controlled discovery.</h2><p>The broader catalog and qualified deals continue here in measured batches instead of an endless wall.</p></div><div class="hd-building-market-stage"></div>';
      main.appendChild(market);
      const stage=market.querySelector(".hd-building-market-stage");
      const shop=$("#shop"), live=$("#live-search"), deals=$("#deals");
      if(shop)stage.appendChild(shop);
      if(live)stage.appendChild(live);
      if(deals)stage.appendChild(deals);
    }

    if(!$("#hunt-advertising-floor")){
      const ad=document.createElement("section");
      ad.id="hunt-advertising-floor";
      ad.className="hd-building-special-floor hd-building-ad-floor";
      ad.innerHTML='<div class="hd-building-special-head"><small>FLOOR 11 · DYNAMIC ADVERTISING</small><h2>Campaigns have their own address.</h2><p>Dynamic promotions live on one dedicated floor instead of interrupting product departments.</p></div><div class="hd-building-special-stage"></div>';
      main.appendChild(ad);
      const lifestyle=$("#hunt-lifestyle-stream"); if(lifestyle)ad.querySelector(".hd-building-special-stage").appendChild(lifestyle);
    }

    if(!$("#hunt-ai-floor")){
      const ai=document.createElement("section");
      ai.id="hunt-ai-floor";
      ai.className="hd-building-special-floor hd-building-ai-floor";
      ai.innerHTML='<div class="hd-building-special-head"><small>FLOOR 12 · BOOM AI DISCOVERY</small><h2>Intelligence gets its own floor.</h2><p>Mission-aware discovery and HUNT NOW stay together here, separate from advertising and ordinary product shelves.</p></div><div class="hd-building-ai-stage"></div>';
      main.appendChild(ai);
      const huntNow=$("#hunt-now"); if(huntNow)ai.querySelector(".hd-building-ai-stage").appendChild(huntNow);
    }

    if(!$("#hunt-ai-media-floor")){
      const media=document.createElement("section");
      media.id="hunt-ai-media-floor";
      media.className="hd-building-special-floor hd-building-ai-media-floor";
      media.innerHTML='<div class="hd-building-special-head"><small>FLOOR 13 · BOOM AI MEDIA</small><h2>AI video gets a real studio.</h2><p>Only product-linked, approved media appears here. No unrelated video and no invented claims.</p></div><div class="hd-building-ai-media" id="hd-building-ai-media"></div>';
      main.appendChild(media);
    }

    if(!$("#hunt-penthouse")){
      const pent=document.createElement("section");
      pent.id="hunt-penthouse";
      pent.className="hd-building-special-floor hd-building-penthouse";
      pent.innerHTML='<div class="hd-building-special-head"><small>PENTHOUSE · HUNT SIGNATURE</small><h2>The quietest, sharpest layer.</h2><p>Premium editorial discovery and BOOM mission building live at the top.</p></div><div class="hd-building-penthouse-stage"></div>';
      main.appendChild(pent);
      const stage=pent.querySelector(".hd-building-penthouse-stage");
      const night=$("#hunt-night-edit"), look=$("#look-builder");
      if(night)stage.appendChild(night);
      if(look)stage.appendChild(look);
    }

    const personal=$("#for-you"), women=$("#women-edit"), fresh=$("#fresh-in-hunt"), shop=$("#shop");
    personal?.querySelector(".hd-home3-section-head small")&&(personal.querySelector(".hd-home3-section-head small").textContent="FLOOR 01 · FEATURED LOBBY");
    women?.querySelector(".hd-home3-section-head small")&&(women.querySelector(".hd-home3-section-head small").textContent="FLOOR 02 · WOMEN");
    const womenGrid=$("#hd-home3-women"); if(womenGrid)womenGrid.className="hd-home3-product-grid hd-building-grid";
    fresh?.querySelector(".hd-home3-section-head small")&&(fresh.querySelector(".hd-home3-section-head small").textContent="FRESH ARRIVALS");
    const shopSmall=shop?.querySelector(".hd-section-head small"); if(shopSmall)shopSmall.textContent="MIXED MARKET · CONTROLLED DISCOVERY";
  }

  function movePromotionsIntoAdFloor() {
    const promo=$("#hd-boom-promotions"), stage=$("#hunt-advertising-floor .hd-building-special-stage");
    if(promo&&stage&&!stage.contains(promo))stage.appendChild(promo);
  }

  function applyBuildingOrder() {
    ensureBuildingStructure();
    const main=$("#main-content"); if(!main)return;
    const order=["#hunt-hero4","#departments","#hd-building-floor-nav","#for-you","#women-edit","#hunt-men-floor","#hunt-kids-floor","#hunt-beauty-floor","#hunt-tech-floor","#hunt-home-floor","#hunt-active-floor","#hunt-fresh-floor","#hunt-market-hall","#hunt-advertising-floor","#hunt-ai-floor","#hunt-ai-media-floor","#hunt-penthouse"];
    order.forEach(selector=>{const node=$(selector);if(node)main.appendChild(node);});
    movePromotionsIntoAdFloor();
  }

  function renderBuildingFloors(shelves) {
    renderDepartmentFloor("#hd-building-men",shelves,"men","MEN");
    renderDepartmentFloor("#hd-building-kids",shelves,"kids","KIDS");
    renderDepartmentFloor("#hd-building-tech",shelves,"tech","TECH");
    renderDepartmentFloor("#hd-building-home",shelves,"home","HOME");
    renderDepartmentFloor("#hd-building-sports",shelves,"sports","SPORTS",3);
    renderDepartmentFloor("#hd-building-travel",shelves,"travel","TRAVEL",3);
    renderDepartmentFloor("#hd-building-pets",shelves,"pets","PETS",3);
    renderAiMediaFloor(shelves);
  }

  function render(data) {
    latestShelves=data?.shelves||{};
    if(!Object.values(latestShelves).some(rows=>Array.isArray(rows)&&rows.length))return;
    ensureBuildingStructure();
    renderHero(latestShelves);
    renderWomen(latestShelves);
    renderBuildingFloors(latestShelves);
    renderMiniWorld("#hd-home3-accessories",latestShelves,[
      "bags","jewelry-earrings","jewelry-necklaces","jewelry-rings","watches","hair-accessories"
    ],"ACCESSORIES");
    renderMiniWorld("#hd-home3-beauty",latestShelves,[
      "makeup","skincare","body-care","beauty-tools","hair","nails"
    ],"BEAUTY");
    renderForYou(latestShelves);
    renderLook(latestShelves);
    renderFresh(latestShelves);
    applyPersonalLayout();
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest?.("[data-home3-mode]");
    if(!button)return;
    localStorage.setItem(HOME_MODE_KEY,button.dataset.home3Mode||"for-you");
    if(latestShelves)renderForYou(latestShelves);
  });

  ensureBuildingStructure();
  applyBuildingOrder();
  setupMegaMenu();
  const buildingObserver=new MutationObserver(()=>movePromotionsIntoAdFloor());
  buildingObserver.observe(document.querySelector("#main-content"),{childList:true});
  window.addEventListener("hunt:shelves",event=>render(event.detail));
  window.addEventListener("hunt:personalization-ready",()=>{if(latestShelves)render({shelves:latestShelves})});
  window.addEventListener("hunt:country-changed",()=>{if(latestShelves)render({shelves:latestShelves})});
  window.addEventListener("hunt:experience-language",()=>{if(latestShelves)render({shelves:latestShelves})});
  if(window.HuntMarketShelves)render(window.HuntMarketShelves);
})();