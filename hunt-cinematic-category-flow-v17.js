(() => {
  "use strict";

  const DEPARTMENTS = {
    women:["Dresses","Tops","Bottoms","Outerwear","Shoes","Underwear & Sleep","Swim","Occasion"],
    men:["Shirts","Tops","Bottoms","Outerwear","Shoes","Underwear","Swim","Tailoring"],
    kids:["Baby","Girls","Boys","Clothing","Shoes","School","Sleep","Occasion"],
    accessories:["Bags","Jewelry","Watches","Sunglasses","Hats","Belts & Scarves","Hair Accessories","Socks"],
    beauty:["Makeup","Skincare","Hair","Nails","Body Care","Fragrance","Beauty Tools"],
    home:["Furniture","Bedding","Bath","Decor","Storage","Rugs & Windows","Lighting","Cleaning"],
    kitchen:["Cookware","Kitchen Tools","Tableware","Drinkware","Storage","Bakeware"],
    tech:["Phones","Charging","Audio","Wearables","Gaming","Cameras","Computing","Smart Home"],
    electrical:["Small Appliances","Heating & Cooling","Cleaning Appliances","Personal Appliances","Power"],
    sports:["Activewear","Fitness","Yoga","Running","Team Sports","Sports Gear"],
    camping:["Tents","Sleep","Lighting","Camp Cooking","Camp Furniture","Outdoor Gear"],
    pets:["Beds & Houses","Clothing","Feeding","Grooming","Toys","Walking","Aquarium","Accessories"],
    toys:["Educational","Building","Pretend Play","Dolls & Figures","Vehicles & RC","Puzzles & Games","Arts & Crafts","Plush"],
    garden:["Planters","Watering","Garden Tools","Outdoor Living","Garden Decor","Plant Care"],
    office:["Stationery","Writing","Filing","Desk Accessories","Office Furniture","Notebooks"],
    travel:["Luggage","Travel Bags","Organizers","Accessories","Toiletry","Documents"],
    gifts:["Gift Decor","Party","Gift Wrap","Cards","Gift Bags & Boxes"]
  };

  const LABELS = Object.keys(DEPARTMENTS);
  const state = {
    department:"women",
    category:"Dresses",
    catalog:null,
    visible:12,
    chapter:0,
    taste:loadTaste()
  };

  const $ = (q,root=document)=>root.querySelector(q);
  const esc = (v)=>String(v??"").replace(/[&<>"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const nice = (v)=>String(v||"").replace(/-/g," ").replace(/\b\w/g,(m)=>m.toUpperCase());

  function loadTaste(){
    try{return JSON.parse(localStorage.getItem("hunt_cinematic_v17_taste")||"{}")||{};}catch{return {};}
  }
  function saveTaste(){
    try{localStorage.setItem("hunt_cinematic_v17_taste",JSON.stringify(state.taste));}catch{}
  }
  function learn(key,weight=1){
    if(!key)return;
    const k=String(key).toLowerCase();
    state.taste[k]=(state.taste[k]||0)+weight;
    saveTaste();
    renderTaste();
  }

  function flattenShelves(){
    const shelves=state.catalog?.shelves||{};
    return Object.entries(shelves).flatMap(([shelf,items])=>(items||[]).map((p)=>({...p,_shelf:shelf})));
  }
  function deptProducts(dept=state.department){
    return (state.catalog?.shelves?.[dept]||[]).filter(validProduct);
  }
  function validProduct(p){
    if(!p||!p.image_url||!p.title)return false;
    return !/(weapon|gun|firearm|ammo|knife|blade|vape|cigarette|nicotine|cbd|thc|adult|porn|vibrator|dildo|steroid|diet pill)/i.test(String(p.title));
  }

  const FILTERS = {
    "dresses":/\b(dress|gown|maxi|midi|mini dress)\b/i,
    "tops":/\b(top|shirt|blouse|tee|t-shirt|tank)\b/i,
    "bottoms":/\b(pants|trousers|jeans|skirt|shorts|leggings)\b/i,
    "outerwear":/\b(jacket|coat|blazer|cardigan|outerwear)\b/i,
    "shoes":/\b(shoe|sneaker|boot|sandal|heel|slipper)\b/i,
    "underwear & sleep":/\b(underwear|bra|brief|sleep|nightwear|pajama|pyjama|lounge)\b/i,
    "swim":/\b(swim|swimsuit|bikini|beachwear)\b/i,
    "occasion":/\b(evening|occasion|party|formal|gown|wedding)\b/i,
    "bags":/\b(handbag|purse|tote|crossbody|shoulder bag|bag)\b/i,
    "jewelry":/\b(necklace|earring|bracelet|ring|jewelry|jewellery|pendant)\b/i,
    "watches":/\b(watch|wristwatch)\b/i,
    "sunglasses":/\b(sunglass|sunglasses|shades)\b/i,
    "hats":/\b(hat|cap|beanie|beret)\b/i,
    "makeup":/\b(makeup|cosmetic|lipstick|mascara|eyelash|foundation)\b/i,
    "skincare":/\b(skincare|serum|facial|face cream|sunscreen|acne)\b/i,
    "hair":/\b(hair|wig|extension)\b/i,
    "nails":/\b(nail|manicure|pedicure)\b/i,
    "furniture":/\b(chair|table|sofa|cabinet|furniture|shelf)\b/i,
    "bedding":/\b(bedding|duvet|sheet|pillow|blanket)\b/i,
    "bath":/\b(bath|bathroom|shower|toilet)\b/i,
    "decor":/\b(decor|mirror|wall art|vase|ornament)\b/i,
    "storage":/\b(storage|organizer|cabinet|drawer|box)\b/i,
    "cookware":/\b(pan|pot|cookware|frying|casserole)\b/i,
    "kitchen tools":/\b(spatula|whisk|peeler|tongs|grater|utensil|strainer|chopper)\b/i,
    "tableware":/\b(plate|bowl|tableware|dinnerware|cutlery)\b/i,
    "drinkware":/\b(cup|mug|glass|bottle|drinkware)\b/i,
    "phones":/\b(phone|iphone|galaxy|smartphone|mobile)\b/i,
    "charging":/\b(charger|charging|cable|adapter|power bank|usb)\b/i,
    "audio":/\b(headphone|earbud|speaker|audio|microphone)\b/i,
    "wearables":/\b(smartwatch|smart watch|wearable|watch band|watch strap)\b/i,
    "gaming":/\b(gaming|gamepad|controller|mouse|keyboard)\b/i,
    "cameras":/\b(camera|webcam|dash cam)\b/i,
    "activewear":/\b(activewear|sportswear|gym|fitness|workout|yoga)\b/i,
    "fitness":/\b(fitness|gym|workout|resistance|exercise)\b/i,
    "tents":/\b(tent|shelter|canopy)\b/i,
    "sleep":/\b(sleeping bag|sleep mat|sleep|pajama|nightwear)\b/i,
    "beds & houses":/\b(pet bed|dog bed|cat bed|kennel|pet house|cat house)\b/i,
    "feeding":/\b(feeder|pet bowl|feeding|water fountain)\b/i,
    "grooming":/\b(groom|brush|comb|deshedding|hair remover)\b/i,
    "walking":/\b(leash|collar|harness|walking)\b/i,
    "stationery":/\b(pen|pencil|notebook|paper|folder|stationery|marker)\b/i,
    "luggage":/\b(luggage|suitcase|carry-on|travel bag)\b/i,
    "party":/\b(party|balloon|banner|confetti|decoration)\b/i
  };

  function categoryProducts(category=state.category,dept=state.department){
    const list=deptProducts(dept);
    const rx=FILTERS[String(category).toLowerCase()];
    let filtered=rx?list.filter((p)=>rx.test(p.title)):list;
    if(filtered.length<8){
      const fallback=list.filter((p)=>!filtered.some((x)=>x.item_id===p.item_id));
      filtered=filtered.concat(fallback);
    }
    return rankByTaste(filtered);
  }

  function rankByTaste(list){
    return [...list].sort((a,b)=>tasteScore(b)-tasteScore(a));
    function tasteScore(p){
      const t=String(p.title||"").toLowerCase();
      let s=0;
      for(const [k,v] of Object.entries(state.taste)) if(t.includes(k)) s+=Number(v)||0;
      if(t.includes(String(state.category).toLowerCase()))s+=2;
      return s;
    }
  }

  function card(p,kind="catalog"){
    const title=esc(p.title);
    const provider=esc(p.provider||"HUNT catalog");
    return '<article class="hcv17-product-card" tabindex="0" data-item="'+esc(p.item_id||title)+'" data-title="'+title+'" data-kind="'+kind+'">'+
      '<button class="hcv17-heart" type="button" aria-label="Save item">♡</button>'+
      '<div class="hcv17-product-media"><img loading="lazy" src="'+esc(p.image_url)+'" alt=""></div>'+
      '<div class="hcv17-product-body"><small>'+provider+'</small><h3>'+title+'</h3><p>Explore in HUNT →</p></div>'+
    '</article>';
  }

  function renderDepartments(){
    $("#hcv17-dept-rail").innerHTML=LABELS.map((d)=>'<button type="button" class="'+(d===state.department?"active":"")+'" data-dept="'+d+'">'+nice(d)+'</button>').join("");
  }
  function renderDrawer(){
    const families=DEPARTMENTS[state.department]||[];
    if(!families.includes(state.category))state.category=families[0]||"All";
    $("#hcv17-family-grid").innerHTML=families.map((f)=>'<button type="button" class="'+(f===state.category?"active":"")+'" data-family="'+esc(f)+'">'+esc(f)+'</button>').join("");
    $("#hcv17-drawer-kicker").textContent=nice(state.department).toUpperCase()+" · OPEN WORLD";
    $("#hcv17-drawer-title").textContent=nice(state.department);
    $("#hcv17-drawer-feature-title").textContent=state.category;
    $("#hcv17-breadcrumb").textContent=nice(state.department)+" › "+state.category;
    $("#hcv17-world-kicker").textContent="YOUR WORLD · "+nice(state.department).toUpperCase();
  }

  function renderPrimary(){
    const list=categoryProducts().slice(0,state.visible);
    $("#hcv17-primary-kicker").textContent=nice(state.department).toUpperCase()+" · "+state.category.toUpperCase();
    $("#hcv17-primary-title").textContent=state.category+" that keep the story moving.";
    $("#hcv17-primary-status").textContent=list.length+" products in this preview";
    $("#hcv17-primary-grid").innerHTML=list.map((p)=>card(p,"primary")).join("")||emptyCard();
  }
  function renderRelated(){
    const families=(DEPARTMENTS[state.department]||[]).filter((x)=>x!==state.category);
    const picks=[];
    for(const f of families.slice(0,4)) picks.push(...categoryProducts(f,state.department).slice(0,3));
    $("#hcv17-related-title").textContent="More from "+nice(state.department)+".";
    $("#hcv17-related-grid").innerHTML=dedupe(picks).slice(0,12).map((p)=>card(p,"related")).join("")||emptyCard();
  }
  function renderLook(){
    const pools=[];
    if(state.department==="women"||state.department==="men"||state.department==="kids"){
      pools.push(...categoryProducts("Shoes",state.department).slice(0,4));
      pools.push(...filterGlobal("bags").slice(0,4));
      pools.push(...filterGlobal("jewelry").slice(0,4));
    }else{
      pools.push(...deptProducts("accessories").slice(0,6));
      pools.push(...deptProducts("beauty").slice(0,4));
    }
    $("#hcv17-look-grid").innerHTML=dedupe(pools).slice(0,7).map((p)=>card(p,"look")).join("")||emptyCard();
  }
  function filterGlobal(type){
    const rx=FILTERS[type];
    return rankByTaste(flattenShelves().filter(validProduct).filter((p)=>rx?rx.test(p.title):true));
  }
  function renderForYou(){
    let pool=flattenShelves().filter(validProduct);
    pool=rankByTaste(pool);
    $("#hcv17-for-you-grid").innerHTML=pool.slice(0,9).map((p)=>card(p,"for-you")).join("")||emptyCard();
    renderTaste();
  }
  function renderTaste(){
    const entries=Object.entries(state.taste).sort((a,b)=>b[1]-a[1]).slice(0,7);
    $("#hcv17-taste-chips").innerHTML=entries.length?entries.map(([k,v])=>'<span>'+esc(nice(k))+' · '+v+'</span>').join(""):'<span>Start browsing to shape this chapter</span>';
    $("#hcv17-learning-copy").textContent=entries.length?"Learning from "+entries.length+" active taste signals.":"Browsing signals stay in this preview.";
  }
  function renderAll(){
    renderDepartments();renderDrawer();renderPrimary();renderRelated();renderLook();renderForYou();
  }

  function setDepartment(dept){
    state.department=dept;
    state.category=(DEPARTMENTS[dept]||[])[0]||"All";
    state.visible=12;
    learn(dept,2);
    renderAll();
    $("#hcv17-drawer-wrap").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function setCategory(cat,scroll=true){
    state.category=cat;
    state.visible=12;
    learn(cat,3);
    renderDrawer();renderPrimary();renderRelated();renderLook();renderForYou();
    if(scroll)$("#hcv17-scope-bar").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function dedupe(items){
    const seen=new Set();
    return items.filter((p)=>{const k=String(p.item_id||p.image_url||p.title);if(seen.has(k))return false;seen.add(k);return true;});
  }
  function emptyCard(){
    return '<article class="hcv17-product-card"><div class="hcv17-product-media"></div><div class="hcv17-product-body"><small>HUNT PREVIEW</small><h3>This category is still being filled.</h3><p>Taxonomy truth stays more important than visual density.</p></div></article>';
  }

  function addChapter(){
    state.chapter++;
    const families=DEPARTMENTS[state.department]||[];
    const cat=families[(families.indexOf(state.category)+state.chapter)%Math.max(1,families.length)]||state.category;
    const picks=categoryProducts(cat,state.department).slice(0,8);
    const node=document.createElement("section");
    node.className="hcv17-chapter";
    node.innerHTML='<small>'+nice(state.department).toUpperCase()+' · NEXT CHAPTER</small><h3>'+esc(cat)+' — keep exploring</h3><div class="hcv17-product-grid">'+picks.map((p)=>card(p,"chapter")).join("")+'</div>';
    $("#hcv17-chapters").appendChild(node);
    learn(cat,1);
    node.scrollIntoView({behavior:"smooth",block:"start"});
  }

  document.addEventListener("click",(e)=>{
    const dept=e.target.closest("[data-dept]");
    if(dept){setDepartment(dept.dataset.dept);return;}
    const family=e.target.closest("[data-family]");
    if(family){setCategory(family.dataset.family);return;}
    const jump=e.target.closest("[data-jump-category]");
    if(jump){setCategory(jump.dataset.jumpCategory);return;}
    const scroll=e.target.closest("[data-scroll-to]");
    if(scroll){$("#"+scroll.dataset.scrollTo)?.scrollIntoView({behavior:"smooth"});return;}
    const product=e.target.closest(".hcv17-product-card[data-title]");
    if(product){
      const title=product.dataset.title||"";
      learn(state.department,1);learn(state.category,1);
      for(const word of title.toLowerCase().split(/[^a-z0-9]+/).filter((w)=>w.length>4).slice(0,3))learn(word,.35);
      if(product.animate) product.animate([{transform:"scale(1)"},{transform:"scale(.985)"},{transform:"scale(1)"}],{duration:260});
      renderForYou();
    }
  });

  $("#hcv17-open-active").addEventListener("click",()=>setCategory(state.category,true));
  $("#hcv17-change-category").addEventListener("click",()=>$("#hcv17-drawer-wrap").scrollIntoView({behavior:"smooth",block:"start"}));
  $("#hcv17-personalize").addEventListener("click",()=>$("#hcv17-boom-chapter").scrollIntoView({behavior:"smooth",block:"start"}));
  $("#hcv17-load-chapter").addEventListener("click",addChapter);
  $("#hcv17-search").addEventListener("keydown",(e)=>{
    if(e.key!=="Enter")return;
    e.preventDefault();
    const q=e.currentTarget.value.trim();
    if(!q)return;
    learn(q,2);
    const pool=flattenShelves().filter(validProduct).filter((p)=>String(p.title||"").toLowerCase().includes(q.toLowerCase()));
    $("#hcv17-primary-title").textContent='Search: “'+q+'”';
    $("#hcv17-primary-grid").innerHTML=pool.slice(0,16).map((p)=>card(p,"search")).join("")||emptyCard();
    $("#hcv17-scope-bar").scrollIntoView({behavior:"smooth",block:"start"});
  });

  fetch("catalog-home.json",{cache:"no-store"})
    .then((r)=>{if(!r.ok)throw new Error("Catalog unavailable");return r.json();})
    .then((data)=>{
      state.catalog=data;
      renderAll();
      learn("women",.2);learn("dresses",.2);
    })
    .catch((err)=>{
      console.warn("[HUNT V17] catalog load failed",err);
      state.catalog={shelves:{}};
      renderAll();
      $("#hcv17-primary-status").textContent="Preview structure loaded · catalog unavailable";
    });
})();