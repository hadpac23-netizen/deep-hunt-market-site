(() => {
  const H=window.HuntCore;
  if(!H)return;
  const $=q=>document.querySelector(q);
  const params=new URLSearchParams(location.search);
  const S={results:[],visible:0,observer:null,mission:null,missionOffset:0,clarifyUsed:false};

  const map=[
    [/שמלה|שמלות|فستان|فساتين/gi," dress "],
    [/גבר|גברים|رجال|رجالي|رجل/gi," men "],
    [/אישה|נשים|نسائي|نساء|امرأة/gi," women "],
    [/ילד|ילדים|طفل|أطفال|اطفال/gi," kids "],
    [/נעל|נעליים|حذاء|أحذية|احذية/gi," shoes "],
    [/תיק|תיקים|حقيبة|حقائب/gi," bag "],
    [/איפור|مكياج/gi," makeup "],
    [/טיפוח|עור|بشرة|عناية بالبشرة/gi," skincare "],
    [/כיסוי|מגן|جراب|غطاء/gi," phone case "],
    [/אייפון|ايفون|آيفون/gi," iphone "],
    [/שחור|שחורה|أسود|اسود|سوداء/gi," black "],
    [/לבן|לבנה|أبيض|ابيض|بيضاء/gi," white "],
    [/אדום|אדומה|أحمر|احمر|حمراء/gi," red "],
    [/כחול|כחולה|أزرق|ازرق|زرقاء/gi," blue "],
    [/ירוק|ירוקה|أخضر|اخضر|خضراء/gi," green "],
    [/ורוד|ורודה|وردي/gi," pink "],
    [/חתונה|זفاف|عرס/gi," wedding "],
    [/אלגנטי|אלגנטית|أنيق|انيق/gi," elegant "],
    [/מתחת|עד|תחת|تحت|اقل من|أقل من/gi," under "],
    [/ג׳ינס|גינס|جينز/gi," jeans "],
    [/חולצה|חולצות|قميص|قمصان|تيشيرت|تي شيرت/gi," shirt "],
    [/מכנס|מכנסיים|بنطلون|بناطيل/gi," pants "],
    [/הלבשה תחתונה|תחתונים|ملابس داخلية|بوكسر|بوكسير/gi," underwear "],
    [/בגד ים|בגדי ים|ملابس سباحة|مايوه/gi," swimwear "],
    [/תכשיט|תכשיטים|مجوهرات|اكسسوارات/gi," jewelry "],
    [/בית|לבית|منزل|للمنزل/gi," home "],
    [/טכנולוגיה|אלקטרוניקה|تقنية|الكترونيات|إلكترونيات/gi," tech "],
    [/טלפון|סמארטפון|هاتف|موبايل/gi," phone "],
    [/יוקרתי|יוקרה|فاخر|فخم/gi," luxury "],
    [/קלאסי|كلاسيكي/gi," classic "],
    [/רטרו|ريترو/gi," retro "],
    [/קיץ|קיצי|صيف|صيفي/gi," summer "],
    [/חורף|חורפי|شتاء|شتوي/gi," winter "],
    [/רשמי|פורמלי|رسمي/gi," formal "],
    [/זול|תקציבי|رخيص|اقتصادي/gi," budget "]
  ];
  const colors=["black","white","red","blue","green","pink","purple","brown","beige","gray","grey","gold","silver","orange","yellow","khaki","navy"];
  const styles=["elegant","vintage","street","casual","luxury","minimal","sport","formal","wedding","summer","winter","oversized","classic","retro"];
  const brandStyle={gucci:["luxury","statement","vintage"],prada:["minimal","luxury"],chanel:["classic","elegant","luxury"],zara:["modern","minimal","casual"],dior:["elegant","luxury","classic"],versace:["luxury","statement"],armani:["formal","classic","minimal"],balenciaga:["street","oversized","statement"],nike:["sport","street"],adidas:["sport","street"]};
  const missionRules=[
    {type:"trip",name:"Weekend Escape",re:/weekend|trip|travel|vacation|סופ.?ש|נסיעה|טיול|رحلة|سفر/i,cats:["travel","bags","phoneaccessories","drinkware"]},
    {type:"setup",name:"Home Office",re:/home office|workspace|desk setup|משרד ביתי|עמדת עבודה|مكتب منزلي|مكتب/i,cats:["office","lighting","computer-accessories","drinkware"]},
    {type:"event",name:"Wedding Ready",re:/wedding|חתונה|אירוע|زفاف|عرس/i,cats:["dresses","bags","jewelry","shoes","makeup"]},
    {type:"setup",name:"Gym Reset",re:/gym|fitness|workout|חדר כושר|אימון|لياقة|رياضة/i,cats:["activewear","fitness","fitness-accessories","sports-bags","drinkware"]},
    {type:"setup",name:"Pet Home",re:/\bpet\b|dog|cat|כלב|חתול|حيوان|كلب|قط/i,cats:["pet-accessories","pet-toys","pet-feeding","pet-beds"]},
    {type:"setup",name:"Phone Upgrade",re:/phone upgrade|iphone setup|galaxy setup|שדרוג טלפון|אייפון|ترقية هاتف|ايفون/i,cats:["phone-cases","chargers-cables","power-banks","stands-holders","audio"]},
    {type:"setup",name:"New Home",re:/new home|new apartment|בית חדש|דירה חדשה|منزل جديد|شقة جديدة/i,cats:["home-storage","lighting","bedding","kitchen","home-decor"]}
  ];
  function missionIntent(raw){
    const rule=missionRules.find(x=>x.re.test(String(raw||"")));
    if(!rule)return null;
    const gender=/\bmen\b|גבר|رجال|رجالي/i.test(String(raw||""))?"men":/\bwomen\b|אישה|נשים|نساء|نسائي/i.test(String(raw||""))?"women":null;
    let cats=[...rule.cats];
    if(rule.name==="Wedding Ready"&&gender==="men")cats=["men-suits","men-shoes","watches","men-accessories"];
    return {type:rule.type,name:rule.name,cats:[...new Set(cats)].filter(x=>H.categoryDefs?.[x])};
  }
  function missionType(raw,mission,max){
    const q=String(raw||"");
    if(/\bcompare\b|\bvs\.?\b|versus|difference|השוו?ה|לעומת|مقارن|مقارنة|مقابل/i.test(q))return "compare";
    if(/replace|replacement|substitute|compatible replacement|תחליף|החלפה|במקום|بديل|استبدال/i.test(q))return "replace";
    if(/refill|reorder|restock|buy again|repeat purchase|מילוי|לקנות שוב|הזמנה חוזרת|اعادة شراء|إعادة شراء|تعبئة/i.test(q))return "replenish";
    if(/gift|present|מתנה|هدية/i.test(q))return "gift";
    if(/complete look|full look|outfit|look for me|לוק שלם|סט שלם|אאוטפיט|اطلالة كاملة|إطلالة كاملة|طقم كامل/i.test(q))return "outfit";
    if(mission?.type)return mission.type;
    if(Number.isFinite(Number(max))&&Number(max)>0)return "budget";
    return "";
  }

  function norm(q){
    let t=String(q||"").toLowerCase();
    map.forEach(([re,v])=>t=t.replace(re,v));
    return t.replace(/[^\w\u0590-\u05ff\u0600-\u06ff$€£.\-\s]/g," ").replace(/\s+/g," ").trim();
  }
  function budget(q){
    const match=q.match(/(?:under|below|max|up to)\s*([$€£])?\s*(\d+(?:\.\d+)?)/i)||q.match(/([$€£])\s*(\d+(?:\.\d+)?)/i);
    if(!match)return null;
    const symbol=match[1]||"$";
    const amount=Number(match[2]);
    if(!Number.isFinite(amount)||amount<=0)return null;
    return {amount,currency:symbol==="€"?"EUR":symbol==="£"?"GBP":"USD"};
  }
  function catScore(slug,q){
    const d=H.categoryDefs?.[slug]; if(!d)return 0;
    const hay=(slug+" "+d.title+" "+(d.query||"")).toLowerCase();
    return q.split(" ").filter(x=>x.length>1).reduce((n,t)=>n+(hay.includes(t)?(t.length>5?5:3):0),0);
  }
  function intent(raw){
    const q=norm(raw), budgetInfo=budget(q), max=budgetInfo?.amount??null, currency=budgetInfo?.currency||null, c=colors.filter(x=>q.includes(x));
    let st=styles.filter(x=>q.includes(x));
    const brandHints=[];
    for(const [b,a] of Object.entries(brandStyle))if(q.includes(b)){brandHints.push(b);st=[...new Set([...st,...a])];}
    const deps=Object.keys(H.departmentSubcategories||{});
    const leaves=Object.keys(H.categoryDefs||{}).filter(x=>!deps.includes(x));
    const scored=leaves.map(x=>[x,catScore(x,q)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    const mission=missionIntent(raw);
    const mission_type=missionType(raw,mission,max);
    try{sessionStorage.setItem("hunt_shopping_mission_v1",mission_type||"none")}catch{}
    const cats=mission?.cats?.length ? [...new Set([...mission.cats,...scored])].slice(0,6) : scored;
    const size=(q.match(/\b(?:size|מידה|مقاس)\s*[:=-]?\s*([a-z0-9.+-]{1,8})\b/i)||[])[1]||"";
    const device=(q.match(/\b(?:iphone|galaxy|pixel|redmi|xiaomi|oneplus|motorola|oppo|vivo)\s*[a-z0-9 +.-]*/i)||[])[0]||"";
    return {q,max,currency,colors:c,styles:st,brandHints,size,device,mission,mission_type,cats:cats.length?cats:[H.slugFromQuery?.(q)||"women"]};
  }
  function score(p,i){
    const title=String(p.title||"").toLowerCase();
    let n=i.cats.includes(p.category)?8:0;
    i.q.split(" ").filter(x=>x.length>2).forEach(t=>{if(title.includes(t))n+=4;});
    i.colors.forEach(t=>{if(title.includes(t))n+=5;});
    i.styles.forEach(t=>{if(title.includes(t))n+=2;});
    if(i.size&&title.includes(i.size.toLowerCase()))n+=2;
    if(i.device&&title.includes(i.device.toLowerCase()))n+=8;
    return n;
  }
  function priceOK(p,i){
    if(!i.max)return true;
    const v=Number(p.retail_price_amount);
    const currency=String(p.retail_currency||p.currency||"USD").toUpperCase();
    return currency===String(i.currency||"USD").toUpperCase()&&Number.isFinite(v)&&v>0&&v<=i.max;
  }
  function card(p){
    const img=typeof p.image_url==="string"&&p.image_url.startsWith("http")?`<img src="${H.esc(p.image_url)}" alt="${H.esc(p.title||"Product")}" loading="lazy">`:"";
    const v=Number(p.retail_price_amount);
    const pt=Number.isFinite(v)&&v>0?`From ${H.money(v,p.retail_currency||"USD")}`:"Price on product";
    const newBadge=H.isNewArrival?.(p)?`<b class="hd-new-pulse">NEW</b>`:"";
    return `<article class="hd-market-product-card"><a class="hd-market-card-media" href="${H.esc(H.productUrl(p))}">${img}${newBadge}</a><div class="hd-market-card-body"><a class="hd-market-card-title" href="${H.esc(H.productUrl(p))}">${H.esc(p.title||"Product")}</a><div class="hd-market-card-price"><strong>${H.esc(pt)}</strong></div></div></article>`;
  }
  function missionProductCard(p){
    const img=typeof p.image_url==="string"&&p.image_url.startsWith("http")?`<img src="${H.esc(p.image_url)}" alt="${H.esc(p.title||"Product")}" loading="lazy">`:"";
    const amount=Number(p.retail_price_amount);
    const price=Number.isFinite(amount)&&amount>0?H.money(amount,p.retail_currency||"USD"):"Price on product";
    const fresh=H.isNewArrival?.(p)?`<b class="hd-new-pulse">NEW</b>`:"";
    return `<article class="hd-mission-item">
      <a class="hd-mission-media" href="${H.esc(H.productUrl(p))}">${img}${fresh}</a>
      <small>${H.esc(H.categoryDefs?.[p.category]?.title||p.category||"Pick")}</small>
      <a href="${H.esc(H.productUrl(p))}">${H.esc(p.title||"Product")}</a>
      <strong>${H.esc(price)}</strong>
    </article>`;
  }

  function buildMissionSet(i){
    if(!i?.mission)return [];
    const picked=[],used=new Set();
    let setCurrency=i.currency||null;
    let remaining=Number.isFinite(Number(i.max))&&Number(i.max)>0?Number(i.max):Infinity;
    for(const cat of i.mission.cats){
      const candidates=S.results.filter(p=>{
        const key=String(p.item_id||"");
        if(!key||used.has(key))return false;
        const exact=String(p.category||"")===cat;
        const inferred=H.inferCategory?.(p)===cat;
        const price=Number(p.retail_price_amount);
        const currency=String(p.retail_currency||p.currency||"USD").toUpperCase();
        if(setCurrency&&currency!==String(setCurrency).toUpperCase())return false;
        return (exact||inferred)&&Number.isFinite(price)&&price>0&&price<=remaining;
      });
      if(!candidates.length)continue;
      const index=Math.min(S.missionOffset,candidates.length-1);
      const choice=candidates[index]||candidates[0];
      if(!setCurrency)setCurrency=String(choice.retail_currency||choice.currency||"USD").toUpperCase();
      picked.push(choice);
      used.add(String(choice.item_id||""));
      remaining-=Number(choice.retail_price_amount)||0;
      if(remaining<=0)break;
    }
    return picked;
  }

  function renderMission(i){
    const panel=$("#hd-mission-panel");
    if(!panel)return;
    if(!i?.mission){panel.hidden=true;return;}
    const set=buildMissionSet(i);
    panel.hidden=false;
    $("#hd-mission-title").textContent=i.mission.name;
    $("#hd-mission-copy").textContent=i.max
      ? `A multi-category set built to stay within about ${H.money(i.max,i.currency||"USD")} before shipping and final verification.`
      : "A multi-category set built from your mission. Final shipping and price are verified before checkout.";
    $("#hd-mission-grid").innerHTML=set.length?set.map(missionProductCard).join(""):"<p>No complete mission set is available from the current catalog yet.</p>";
    const total=set.reduce((sum,p)=>sum+(Number(p.retail_price_amount)||0),0);
    $("#hd-mission-total").textContent=set.length?H.money(total,set[0]?.retail_currency||"USD"):"—";
  }

  function clarificationConfig(i){
    const mode=window.BoomCommerceBrain?.plan?.()?.clarify_mode||window.BoomCommerceBrain?.decisionSupport?.()?.clarify_mode||"none";
    if(S.clarifyUsed||mode!=="ask-one")return null;
    if(i?.mission_type==="gift")return {question:"What kind of gift should I narrow toward?",options:[["Fashion","fashion"],["Beauty","beauty"],["Tech","tech"],["Home","home"]]};
    if(i?.mission_type==="replace")return {question:"What must the replacement fit?",options:[["Add model / device","__focus_device"],["Add size","__focus_size"]]};
    return {question:"Which area should I focus on?",options:[["Fashion","fashion"],["Beauty","beauty"],["Tech","tech"],["Home","home"]]};
  }
  function renderClarifier(i,raw){
    const panel=$("#hd-clarify-panel");if(!panel)return;
    const cfg=clarificationConfig(i);
    if(!cfg){panel.hidden=true;return;}
    panel.hidden=false;
    $("#hd-clarify-question").textContent=cfg.question;
    $("#hd-clarify-options").innerHTML=cfg.options.map(([label,value])=>`<button type="button" data-clarify="${H.esc(value)}">${H.esc(label)}</button>`).join("");
    panel.dataset.query=String(raw||"");
  }

  async function load(i){
    const m=await fetch("catalog-manifest.json",{cache:"no-store"}).then(r=>r.json());
    const pages=[];
    const firstPass=i.cats.map(c=>(m.categories?.[c]?.pages||[])[0]).filter(Boolean);
    const extras=[];
    i.cats.forEach(c=>(m.categories?.[c]?.pages||[]).slice(1,3).forEach(p=>extras.push(p)));
    [...firstPass,...extras].forEach(p=>{if(!pages.includes(p))pages.push(p);});
    if(!pages.length)(m.categories?.women?.pages||[]).slice(0,2).forEach(p=>pages.push(p));
    const docs=await Promise.all(pages.slice(0,12).map(p=>fetch(p,{cache:"force-cache"}).then(r=>r.json()).catch(()=>({products:[]}))));
    const seen=new Set(),rows=[];
    docs.flatMap(x=>x.products||[]).forEach(p=>{
      const id=String(p.item_id||"");
      const qualitySlug=String(p.category||i.cats[0]||"");
      if(!id||seen.has(id)||String(p.provider||"").toLowerCase()!=="cjdropshipping"||!priceOK(p,i)||window.HuntCatalogQuality?.fit?.(qualitySlug,p)===false)return;
      seen.add(id); rows.push({...p,_score:score(p,i)});
    });
    rows.sort((a,b)=>(b._score-a._score)||(Number(b.cj_listed_num||0)-Number(a.cj_listed_num||0)));
    return rows;
  }
  function more(){
    const next=S.results.slice(S.visible,S.visible+36);
    if(!next.length){$("#hd-ai-sentinel strong").textContent=S.results.length?"No more matching products.":"No matching products found.";S.observer?.disconnect();return;}
    $("#hd-ai-results-grid").insertAdjacentHTML("beforeend",next.map(card).join(""));
    S.visible+=next.length;
    $("#hd-ai-sentinel strong").textContent=S.visible<S.results.length?"Loading more…":"End of matching results.";
  }
  function observe(){
    S.observer?.disconnect();
    S.observer=new IntersectionObserver(e=>{if(e.some(x=>x.isIntersecting))more();},{rootMargin:"800px 0px"});
    S.observer.observe($("#hd-ai-sentinel"));
  }
  async function run(raw){
    const q=String(raw||"").trim(); if(!q)return;
    const i=intent(q); S.visible=0; S.mission=i; S.missionOffset=0; $("#hd-ai-results-grid").innerHTML="";
    if(!i.mission){const panel=$("#hd-mission-panel");if(panel)panel.hidden=true;}
    $("#hd-ai-intent-title").textContent=`Searching: ${q}`;
    $("#hd-ai-intent-copy").textContent=[
      `Categories: ${i.cats.map(x=>H.categoryDefs?.[x]?.title||x).join(", ")}`,
      i.colors.length?`Colors: ${i.colors.join(", ")}`:"",
      i.max?`Budget: up to ${H.money(i.max,i.currency||"USD")}`:"",
      i.styles.length?`Style: ${i.styles.join(", ")}`:"",
      i.size?`Size: ${i.size}`:"",
      i.device?`Device: ${i.device}`:"",
      i.brandHints.length?`Style reference only: ${i.brandHints.join(", ")} — results are not claimed as those brands.`:""
    ].filter(Boolean).join(" · ");
    $("#hd-ai-sentinel strong").textContent="Finding products…";
    H.recordSignal?.(i.cats[0]||"women","search");
    window.dispatchEvent(new CustomEvent("hunt:search-intent",{detail:{
      categories:i.cats.slice(0,6),
      mission:Boolean(i.mission),
      mission_type:i.mission_type||"none",
      has_budget:Boolean(i.max),
      has_device:Boolean(i.device),
      has_size:Boolean(i.size),
      style_count:i.styles.length,
      color_count:i.colors.length
    }}));
    renderClarifier(i,q);
    try{S.results=await load(i);window.HuntAnalytics?.search?.({category:i.cats[0]||"",resultCount:S.results.length,missionType:i.mission_type||"none"});$("#hd-ai-intent-title").textContent=S.results.length?"Curated matches":"No matching products";renderMission(i);more();observe();}
    catch(e){$("#hd-ai-intent-title").textContent="Search unavailable";$("#hd-ai-intent-copy").textContent=e?.message||"Try again.";}
    history.replaceState(null,"","search.html?q="+encodeURIComponent(q));
  }
  $("#hd-ai-search-form")?.addEventListener("submit",e=>{e.preventDefault();run($("#hd-ai-search-input").value);});
  $("#hd-clarify-options")?.addEventListener("click",e=>{
    const button=e.target.closest?.("[data-clarify]");if(!button)return;
    const value=String(button.dataset.clarify||"");S.clarifyUsed=true;$("#hd-clarify-panel").hidden=true;
    const input=$("#hd-ai-search-input");
    if(value.startsWith("__focus_")){input?.focus();input?.setSelectionRange?.(input.value.length,input.value.length);return;}
    const base=String($("#hd-clarify-panel")?.dataset.query||input?.value||"").trim();
    input.value=(base+" "+value).trim();run(input.value);
  });
  $("#hd-clarify-skip")?.addEventListener("click",()=>{S.clarifyUsed=true;$("#hd-clarify-panel").hidden=true;});
  $("#hd-mission-rebuild")?.addEventListener("click",()=>{if(!S.mission?.mission)return;S.missionOffset+=1;renderMission(S.mission);});
  document.querySelectorAll("[data-example]").forEach(b=>b.addEventListener("click",()=>{$("#hd-ai-search-input").value=b.dataset.example;run(b.dataset.example);}));
  H.updateCartBadges?.();
  const initial=params.get("q")||""; if(initial){$("#hd-ai-search-input").value=initial;run(initial);}
})();