(()=>{
  const LIVE_URL="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-cinematic-shadow-catalog";
  const PUBLIC_KEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const FALLBACK_URL="./evidence/HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT-2026-09-27.json";
  const blocked=/\b(weapon|gun|firearm|ammo|ammunition|knife|blade|dagger|sword|machete|taser|pepper spray|mace|vape|cigarette|nicotine|cbd|thc|cannabis|marijuana|adult|porn|erotic|fetish|sex toy|sexy lingerie|sexy underwear|steroid|diet pill|laxative)\b/i;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const titleFromSlug=s=>String(s||"").replace(/^(women|men)-/,"").split("-").filter(Boolean).map(x=>x[0]?.toUpperCase()+x.slice(1)).join(" ");

  let shelves={};
  let mode="women";
  let shelf="";
  let query="";
  let sort="featured";
  let sourceMode="loading";
  const initialParams=new URLSearchParams(location.search);
  const requestedDept=String(initialParams.get("dept")||"").trim().toLowerCase();
  const requestedShelf=String(initialParams.get("shelf")||"").trim();
  const requestedQuery=String(initialParams.get("q")||"").trim();
  if(requestedDept)mode=requestedDept;
  if(requestedShelf)shelf=requestedShelf;
  if(requestedQuery)query=requestedQuery;

  const primary=[
    ["Women","women"],["Men","men"],["Shoes","shoes"],["Beauty","beauty"],
    ["Accessories","accessories"],["Home","home"],["Kids","kids"],["More","more"]
  ];
  const sourceProviders={h1:"CJdropshipping",h2:"EPROLO",h3:"Printful",h4:"Gooten"};

  function safeProduct(p){
    return p&&p.item_id&&p.image_url&&!blocked.test(String(p.title||""));
  }
  function allRows(){
    const out=[];
    for(const [route,rows] of Object.entries(shelves||{})){
      for(const p of rows||[])if(safeProduct(p))out.push({route,p});
    }
    return out;
  }
  function text(route,p){
    return (route+" "+String(p.title||"")+" "+String(p.category||"")+" "+String(p.category_title||"")+" "+String(p.brand||"")).toLowerCase();
  }
  function routeMatches(route,p,key){
    const t=text(route,p);
    if(key==="women"||key==="men"||key==="home"||key==="kids"||key==="accessories")return route.startsWith(key+"/");
    if(key==="shoes")return /shoe|sneaker|boot|sandal|loafer|heel/.test(t);
    if(key==="beauty")return /beauty|fragrance|perfume|cosmetic|skin|serum|cream|makeup/.test(t);
    if(key==="more"){
      const dept=String(route||"").split("/")[0];
      return !["women","men","home","kids","accessories"].includes(dept)
        && !/shoe|sneaker|boot|sandal|loafer|heel|beauty|fragrance|perfume|cosmetic|skin|serum|cream|makeup/.test(t);
    }
    return true;
  }
  function visibleRows(){
    let rows=allRows().filter(({route,p})=>{
      if(query)return text(route,p).includes(query.toLowerCase());
      if(shelf)return route===shelf;
      return routeMatches(route,p,mode);
    });
    const seen=new Set();
    rows=rows.filter(({p})=>{
      const d=detailIdentity(p);const k=d.src+":"+d.id;
      if(seen.has(k))return false;seen.add(k);return true;
    });
    if(sort==="price-low")rows.sort((a,b)=>(priceNumber(a.p)??1e9)-(priceNumber(b.p)??1e9));
    if(sort==="price-high")rows.sort((a,b)=>(priceNumber(b.p)??-1)-(priceNumber(a.p)??-1));
    return rows;
  }
  function priceNumber(p){
    const n=Number(p.target_retail_usd ?? p.profit_truth?.target_retail_usd ?? p.retail_price_usd ?? p.price_amount ?? p.price);
    return Number.isFinite(n)&&n>0?n:null;
  }
  function priceLabel(p){
    const n=priceNumber(p);
    return n===null?"":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:n>=100?0:2}).format(n);
  }
  function departmentRoutes(key){
    const set=new Map();
    for(const route of Object.keys(shelves||{})){
      const [dept,cat]=route.split("/");
      if(!cat)continue;
      const sample=(shelves[route]||[]).find(safeProduct);
      if(!sample)continue;
      if(routeMatches(route,sample,key))set.set(route,titleFromSlug(cat));
    }
    return [...set.entries()].slice(0,11);
  }
  function firstImage(key){
    return allRows().find(({route,p})=>routeMatches(route,p,key))?.p?.image_url||"";
  }
  function sourceAlias(provider){
    const v=String(provider||"").toLowerCase();
    if(v.includes("cj"))return"h1";
    if(v.includes("eprolo"))return"h2";
    if(v.includes("printful"))return"h3";
    if(v.includes("gooten"))return"h4";
    return"h0";
  }
  function detailIdentity(p){
    const src=String(p.detail_src||sourceAlias(p.provider)||"h0");
    const id=String(p.detail_id||p.item_id||"");
    const provider=sourceProviders[src]||String(p.provider||"");
    return {src,id,provider};
  }
  function cardHref(p){
    const d=detailIdentity(p);
    return "product-v16.html?src="+encodeURIComponent(d.src)+"&id="+encodeURIComponent(d.id);
  }
  function cacheProduct(route,p){
    const [dept,cat]=String(route||"").split("/");
    const d=detailIdentity(p);
    const target=priceNumber(p);
    const cached={...p,
      provider:d.provider,
      item_id:d.id,
      target_retail_usd:target,
      retail_currency:String(p.retail_currency||"USD"),
      sizes:Array.isArray(p.sizes)?p.sizes:[],
      colors:Array.isArray(p.colors)?p.colors:[],
      hunt_department:dept||p.hunt_department||"",
      hunt_shelf:cat||p.hunt_shelf||"",
      canonical_department:dept||p.canonical_department||"",
      canonical_shelf:cat||p.canonical_shelf||""
    };
    try{sessionStorage.setItem("hunt_product_"+d.provider+":"+d.id,JSON.stringify(cached))}catch{}
  }
  function renderCartCount(){
    try{
      const candidates=["hunt_cart_v1","hunt_cart","hunt_cart_items"];
      let count=0;
      for(const key of candidates){
        const v=JSON.parse(localStorage.getItem(key)||"null");
        if(Array.isArray(v)){count=v.reduce((s,x)=>s+Math.max(1,Number(x?.qty)||1),0);break}
      }
      document.querySelectorAll("[data-cart-count]").forEach(x=>x.textContent=String(count));
    }catch{}
  }
  function renderNav(){
    $("#primary-nav").innerHTML=primary.map(([label,key])=>'<button type="button" data-mode="'+key+'" class="'+(mode===key&&!query&&!shelf?"active":"")+'">'+label+'</button>').join("");
    const rows=departmentRoutes(mode);
    $("#secondary-nav").innerHTML=rows.map(([route,label])=>'<button type="button" data-shelf="'+esc(route)+'" class="'+(shelf===route?"active":"")+'">'+esc(label)+'</button>').join("")+
      '<button type="button" data-all>Shop All</button>';
  }
  function renderShortcuts(){
    const labels=["Women","Men","Shoes","Beauty","Accessories","Home","Kids"];
    $("#department-shortcuts").innerHTML=labels.map(label=>{
      const key=label.toLowerCase(),img=firstImage(key);
      return '<button type="button" class="shortcut" data-mode="'+key+'"><span class="shortcut-media">'+(img?'<img loading="lazy" src="'+esc(img)+'" alt="">':"")+'</span><span class="shortcut-label"><b>'+label+'</b><span>→</span></span></button>';
    }).join("")+'<button type="button" class="shortcut special" data-new><span class="special-title">New<br>Arrivals</span><span class="special-link">Shop Now →</span></button>';
  }
  function renderProducts(){
    const rows=visibleRows();
    const title=query?'Search results':shelf?titleFromSlug(shelf.split("/")[1]):mode==="women"?'Trending Now':primary.find(x=>x[1]===mode)?.[0]||"Discover";
    $("#catalog-title").textContent=title;
    $("#catalog-subtitle").textContent=query?rows.length+' matching products':sourceMode==="live"?"Live HUNT Shadow catalog":"HUNT Shadow fallback";
    $("#product-grid").innerHTML=rows.slice(0,mode==="women"&&!shelf&&!query?8:48).map(({route,p})=>
      '<a class="product-card" href="'+cardHref(p)+'" data-product-key="'+esc(String(p.provider||"")+":"+String(p.item_id||""))+'" data-route="'+esc(route)+'">'+
        '<div class="product-media"><img loading="lazy" src="'+esc(p.image_url)+'" alt="'+esc(p.title||"Product")+'"><span class="save-dot" aria-hidden="true">♡</span></div>'+
        '<h3>'+esc(p.title||"Product")+'</h3>'+
        '<div class="product-price">'+esc(priceLabel(p))+'</div>'+
        '<div class="product-meta">'+esc((Array.isArray(p.colors)&&p.colors.length? p.colors.length+" colors · ":"")+(Array.isArray(p.sizes)&&p.sizes.length? p.sizes.length+" sizes · ":"")+titleFromSlug(route.split("/")[1]||""))+'</div>'+
      '</a>'
    ).join("") || '<div class="empty-state">No products are available in this view yet.</div>';
    $("#product-grid").querySelectorAll(".product-card").forEach((el,i)=>{
      el.addEventListener("click",()=>{
        const row=rows[i];if(row)cacheProduct(row.route,row.p);
      });
    });
  }
  function render(){
    renderNav();renderShortcuts();renderProducts();renderCartCount();
  }
  async function loadCatalog(){
    let live=null;
    try{
      const r=await fetch(LIVE_URL,{headers:{apikey:PUBLIC_KEY,accept:"application/json"},cache:"no-store"});
      if(r.ok){
        const j=await r.json();
        if(j&&j.shelves&&Object.keys(j.shelves).length)live=j;
      }
    }catch{}
    if(live){
      shelves=live.shelves;sourceMode="live";render();return;
    }
    try{
      const r=await fetch(FALLBACK_URL,{cache:"no-store"});
      const j=await r.json();
      shelves=j?.shelves||{};sourceMode="fallback";render();
    }catch{
      shelves={};sourceMode="error";render();
    }
  }

  $("#primary-nav").addEventListener("click",e=>{
    const b=e.target.closest("[data-mode]");if(!b)return;
    mode=b.dataset.mode;shelf="";query="";$("#search-input").value="";render();
  });
  $("#secondary-nav").addEventListener("click",e=>{
    const s=e.target.closest("[data-shelf]");
    if(s){shelf=s.dataset.shelf;query="";$("#search-input").value="";render();return}
    if(e.target.closest("[data-all]")){shelf="";query="";$("#search-input").value="";render();return}
    const m=e.target.closest("[data-mode]");if(m){mode=m.dataset.mode;shelf="";query="";render()}
  });
  $("#department-shortcuts").addEventListener("click",e=>{
    const m=e.target.closest("[data-mode]");
    if(m){mode=m.dataset.mode;shelf="";query="";$("#search-input").value="";render();return}
    if(e.target.closest("[data-new]")){mode="women";shelf="";query="";render();document.querySelector(".catalog-section").scrollIntoView()}
  });
  $("#search-form").addEventListener("submit",e=>{
    e.preventDefault();query=String($("#search-input").value||"").trim();shelf="";render();
  });
  $("#sort-select").addEventListener("change",e=>{sort=e.target.value;renderProducts()});
  $("#hero-shop").addEventListener("click",()=>{mode="women";shelf="";query="";render();document.querySelector(".catalog-section").scrollIntoView()});
  $("#hero-home").addEventListener("click",()=>{mode="home";shelf="";query="";render();document.querySelector(".catalog-section").scrollIntoView()});
  $("#view-all").addEventListener("click",()=>{shelf="";query="";render()});

  if(query)$("#search-input").value=query;
  renderCartCount();
  loadCatalog();
})();