(() => {
  "use strict";

  const state={
    map:null,
    data:null,
    dept:"women",
    category:null,
    query:"",
    visible:{},
    taste:loadTaste()
  };
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>[...r.querySelectorAll(q)];
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const nice=(v)=>String(v||"").replace(/-/g," ").replace(/\b\w/g,m=>m.toUpperCase());

  function loadTaste(){
    try{return JSON.parse(localStorage.getItem("hunt_v18_taste")||"{}")||{};}catch{return {}}
  }
  function saveTaste(){try{localStorage.setItem("hunt_v18_taste",JSON.stringify(state.taste));}catch{}}
  function learn(key,w=1){
    if(!key)return;
    const k=String(key).toLowerCase();
    state.taste[k]=(state.taste[k]||0)+w;
    saveTaste();
  }

  function depDef(){return state.map.departments[state.dept]}
  function categories(){return depDef()?.categories||{}}
  function allCategoryName(){return "All "+(depDef()?.label||nice(state.dept))}
  function categoryShelves(name=state.category){
    if(!name||name===allCategoryName()) return [...new Set(Object.values(categories()).flat())];
    return categories()[name]||[];
  }
  function shelfKey(shelf){return state.dept+"/"+shelf}
  function rawShelfProducts(shelf){return state.data.shelves[shelfKey(shelf)]||[]}
  function shelfCount(shelf){return Number(state.data.counts[shelfKey(shelf)]||0)}

  function passesSanity(p,shelf){
    const t=String(p?.title||"").toLowerCase();
    if(!t)return false;
    if(/(weapon|gun|firearm|ammo|ammunition|vape|cigarette|nicotine|cbd|thc|porn|vibrator|dildo|steroid|diet pill)/i.test(t))return false;
    if(/shoes/.test(shelf)){
      if(/shoe (cabinet|rack|storage|organizer|horn)/.test(t))return false;
      if(!/(shoe|shoes|sneaker|boot|sandal|slipper|heel|loafer|moccasin)/.test(t))return false;
    }
    if(/^jewelry/.test(shelf)||shelf==="jewelry"){
      if(/(box|storage|display|holder|phone ring|ring holder|ring light)/.test(t))return false;
      if(!/(jewelry|jewellery|necklace|pendant|earring|bracelet|bangle|ring|anklet|brooch)/.test(t))return false;
    }
    if(shelf==="bags"||shelf==="bag-accessories"){
      if(/(tool bag|storage bag|trash bag|diaper bag)/.test(t))return false;
      if(!/(bag|handbag|purse|tote|crossbody|shoulder|strap|bag charm)/.test(t))return false;
    }
    if(/^pet-/.test(shelf)||shelf==="aquarium"){
      if(!/(pet|dog|cat|puppy|kitten|aquarium|fish|hamster|rabbit|bird)/.test(t))return false;
    }
    if(shelf==="phone-cases" && !/(phone|iphone|galaxy|smartphone|mobile).{0,40}(case|cover)|(case|cover).{0,40}(phone|iphone|galaxy|smartphone|mobile)/.test(t))return false;
    if(shelf==="wearables" && !/(smartwatch|smart watch|gps watch|ecg watch|fitness watch)/.test(t))return false;
    if(shelf==="wearable-accessories" && !/(watch|smartwatch).{0,40}(band|strap|charger|case|protector)|(band|strap|charger|case|protector).{0,40}(watch|smartwatch)/.test(t))return false;
    if(shelf==="hats" && !/(hat|cap|beanie|beret)/.test(t))return false;
    if(shelf==="sunglasses" && !/(sunglass|sunglasses|shades)/.test(t))return false;
    if(shelf==="kitchen-tools" && !/(spatula|whisk|peeler|tongs|grater|utensil|strainer|chopper|kitchen|cooking)/.test(t))return false;
    if(shelf==="audio" && !/(headphone|earbud|speaker|audio|microphone|headset)/.test(t))return false;
    return true;
  }

  function shelfProducts(shelf){
    let arr=rawShelfProducts(shelf).filter(p=>passesSanity(p,shelf));
    if(state.query){
      const q=state.query.toLowerCase();
      arr=arr.filter(p=>String(p.title||"").toLowerCase().includes(q));
    }
    return arr;
  }
  function scopeProducts(){
    const out=[];
    for(const shelf of categoryShelves()) for(const p of shelfProducts(shelf)) out.push({...p,_shelf:shelf});
    return dedupe(out);
  }
  function dedupe(arr){
    const seen=new Set();
    return arr.filter(p=>{const k=String(p.provider||"")+":"+String(p.item_id||p.image_url||p.title);if(seen.has(k))return false;seen.add(k);return true});
  }
  function categoryCount(name){
    return (name===allCategoryName()?[...new Set(Object.values(categories()).flat())]:(categories()[name]||[]))
      .reduce((n,s)=>n+shelfProducts(s).length,0);
  }

  function renderHeroDepts(){
    const featured=["women","men","kids","accessories","beauty","home","tech","pets"];
    $("#hcv18-hero-depts").innerHTML=featured.map(d=>'<a href="#hcv18-browser" data-dept="'+d+'">'+esc(state.map.departments[d].label)+'</a>').join("");
  }
  function renderDepartments(){
    $("#hcv18-dept-rail").innerHTML=Object.entries(state.map.departments).map(([slug,d])=>{
      const total=[...new Set(Object.values(d.categories).flat())].reduce((n,s)=>n+(state.data.counts[slug+"/"+s]||0),0);
      return '<button class="hcv18-dept-btn '+(slug===state.dept?"active":"")+'" type="button" data-dept="'+slug+'" aria-pressed="'+(slug===state.dept)+'">'+esc(d.label)+' <small>'+total+'</small></button>';
    }).join("");
  }
  function renderDrawer(){
    const d=depDef();
    const all=allCategoryName();
    const entries=[[all,[...new Set(Object.values(d.categories).flat())]],...Object.entries(d.categories)];
    $("#hcv18-drawer-kicker").textContent=d.label.toUpperCase()+" · EXACT DEPARTMENT";
    $("#hcv18-drawer-title").textContent=d.label;
    $("#hcv18-drawer-copy").textContent="Only "+d.label+" categories are shown here. Nothing from another department can enter this drawer.";
    $("#hcv18-lock-copy").textContent=d.label+" only";
    $("#hcv18-category-grid").innerHTML=entries.map(([name,shelves])=>{
      const count=shelves.reduce((n,s)=>n+shelfProducts(s).length,0);
      const active=name===state.category;
      return '<button type="button" class="hcv18-category-btn '+(active?"active ":"")+(count===0?"is-empty":"")+'" data-category="'+esc(name)+'" aria-pressed="'+active+'"><strong>'+esc(name)+'</strong><small>'+count+' clean preview products · '+shelves.length+' shelf'+(shelves.length===1?"":"s")+'</small></button>';
    }).join("");
  }
  function renderScope(){
    const d=depDef(),shelves=categoryShelves();
    const products=scopeProducts();
    $("#hcv18-breadcrumb").textContent=d.label+" › "+state.category;
    $("#hcv18-product-count").textContent=products.length+" clean preview products";
    $("#hcv18-shelf-count").textContent=shelves.length+" exact shelf"+(shelves.length===1?"":"s");
    $("#hcv18-feed-kicker").textContent=d.label.toUpperCase()+" · "+String(state.category).toUpperCase();
    $("#hcv18-feed-title").textContent=state.category===allCategoryName()?"Everything inside "+d.label+", separated by exact shelf.":state.category+" — exact only.";
    $("#hcv18-feed-copy").textContent="Scope lock: "+d.label+" / "+state.category+". Products outside these exact shelf keys are not rendered.";
    $("#hcv18-search-input").placeholder="Search in "+d.label+"…";

    const sections=[];
    for(const shelf of shelves){
      const all=shelfProducts(shelf);
      if(!all.length)continue;
      const visible=state.visible[shelf]||8;
      const rows=all.slice(0,visible);
      sections.push('<section class="hcv18-shelf-block" id="shelf-'+esc(shelf)+'">'+
        '<div class="hcv18-shelf-head"><div><small>EXACT SHELF · '+esc(shelf.toUpperCase())+'</small><h3>'+esc(nice(shelf))+'</h3><p>'+shelfCount(shelf)+' catalog rows · '+all.length+' clean preview rows</p></div><span class="hcv18-shelf-truth">'+esc(d.label)+' ONLY</span></div>'+
        '<div class="hcv18-products">'+rows.map(p=>card(p,shelf)).join("")+'</div>'+
        (visible<all.length?'<button class="hcv18-more" type="button" data-more="'+esc(shelf)+'">Show more in '+esc(nice(shelf))+' ↓</button>':"")+
      '</section>');
    }
    $("#hcv18-shelf-sections").innerHTML=sections.join("")||'<div class="hcv18-empty"><strong>This exact category is still being filled.</strong><p>HUNT will not borrow products from another department just to make the shelf look full.</p></div>';
    renderForYou();
    renderNext();
  }
  function card(p,shelf){
    const price=Number(p.target_retail_usd);
    return '<article class="hcv18-card" tabindex="0" data-product="'+esc(p.item_id||"")+'" data-title="'+esc(p.title)+'" data-shelf="'+esc(shelf)+'">'+
      '<button class="hcv18-save" type="button" aria-label="Save item">♡</button>'+
      '<div class="hcv18-card-media"><img loading="lazy" src="'+esc(p.image_url)+'" alt=""></div>'+
      '<div class="hcv18-card-body"><small>'+esc(nice(shelf))+' · '+esc(p.provider||"HUNT")+'</small><h4>'+esc(p.title)+'</h4><div class="hcv18-card-foot"><span>'+esc(p.profit_status||"PROFIT REVIEW")+'</span><b>'+(Number.isFinite(price)?"$"+price.toFixed(2):"Preview")+'</b></div></div>'+
    '</article>';
  }
  function tasteScore(p){
    const t=(String(p.title||"")+" "+String(p.shelf||"")).toLowerCase();
    let score=0;
    for(const [k,v] of Object.entries(state.taste)) if(t.includes(k))score+=Number(v)||0;
    return score;
  }
  function renderForYou(){
    const products=scopeProducts().sort((a,b)=>tasteScore(b)-tasteScore(a)).slice(0,6);
    $("#hcv18-for-you-grid").innerHTML=products.map(p=>card(p,p._shelf)).join("")||'<div class="hcv18-empty"><strong>No personalized rows in this exact scope yet.</strong></div>';
    const entries=Object.entries(state.taste).sort((a,b)=>b[1]-a[1]).slice(0,7);
    $("#hcv18-taste").innerHTML=entries.length?entries.map(([k,v])=>'<span>'+esc(nice(k))+' · '+Number(v).toFixed(v%1?1:0)+'</span>').join(""):'<span>Open products to teach this preview</span>';
  }
  function renderNext(){
    const d=depDef(),all=allCategoryName();
    const names=Object.keys(d.categories).filter(n=>n!==state.category);
    $("#hcv18-next-title").textContent="More inside "+d.label;
    $("#hcv18-next-grid").innerHTML=names.map(name=>'<button type="button" data-category="'+esc(name)+'">'+esc(name)+'<br><small>'+categoryCount(name)+' clean preview products</small></button>').join("");
  }
  function setDepartment(slug,scroll=true){
    if(!state.map.departments[slug])return;
    state.dept=slug;
    state.category="All "+state.map.departments[slug].label;
    state.query="";
    state.visible={};
    learn(slug,2);
    renderAll();
    if(scroll)$("#hcv18-browser").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function setCategory(name,scroll=true){
    const all=allCategoryName();
    if(name!==all && !categories()[name])return;
    state.category=name;
    state.query="";
    state.visible={};
    learn(state.dept,1);learn(name,2);
    renderDrawer();renderScope();
    if(scroll)$(".hcv18-scopebar").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function renderAll(){renderHeroDepts();renderDepartments();renderDrawer();renderScope()}
  function learnFromProduct(el){
    learn(state.dept,.5);learn(state.category,.7);
    const title=(el.dataset.title||"").toLowerCase();
    title.split(/[^a-z0-9]+/).filter(w=>w.length>4).slice(0,3).forEach(w=>learn(w,.25));
    renderForYou();
  }

  document.addEventListener("click",e=>{
    const dep=e.target.closest("[data-dept]");if(dep){e.preventDefault();setDepartment(dep.dataset.dept);return}
    const cat=e.target.closest("[data-category]");if(cat){setCategory(cat.dataset.category);return}
    const more=e.target.closest("[data-more]");if(more){const s=more.dataset.more;state.visible[s]=(state.visible[s]||8)+8;renderScope();$("#shelf-"+CSS.escape(s))?.scrollIntoView({behavior:"smooth",block:"start"});return}
    const cardEl=e.target.closest(".hcv18-card[data-product]");if(cardEl){learnFromProduct(cardEl);return}
  });
  $("#hcv18-back-categories").addEventListener("click",()=>$("#hcv18-drawer").scrollIntoView({behavior:"smooth",block:"start"}));
  $("#hcv18-search-input").addEventListener("input",e=>{state.query=e.currentTarget.value.trim();renderDrawer();renderScope()});

  Promise.all([
    fetch("hunt-cinematic-taxonomy-map-v18.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("taxonomy map unavailable");return r.json()}),
    fetch("hunt-cinematic-clean-catalog-v18.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("clean catalog unavailable");return r.json()})
  ]).then(([map,data])=>{
    state.map=map;state.data=data;
    state.category="All "+state.map.departments[state.dept].label;
    renderAll();
  }).catch(err=>{
    console.error("[HUNT V18]",err);
    $("#hcv18-browser").innerHTML='<div class="hcv18-empty"><strong>V18 data could not load.</strong><p>The preview stays empty rather than showing mixed catalog data.</p></div>';
  });
})();