(() => {
  const H=window.HuntCore;
  if(!H)return;
  const $=q=>document.querySelector(q);
  const params=new URLSearchParams(location.search);
  const S={results:[],visible:0,observer:null};

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

  function norm(q){
    let t=String(q||"").toLowerCase();
    map.forEach(([re,v])=>t=t.replace(re,v));
    return t.replace(/[^\w\u0590-\u05ff\u0600-\u06ff$€£.\-\s]/g," ").replace(/\s+/g," ").trim();
  }
  function budget(q){
    for(const re of [/(?:under|below|max|up to)\s*[$€£]?\s*(\d+(?:\.\d+)?)/i,/[$€£]\s*(\d+(?:\.\d+)?)/i]){
      const m=q.match(re); if(m)return Number(m[1]);
    }
    return null;
  }
  function catScore(slug,q){
    const d=H.categoryDefs?.[slug]; if(!d)return 0;
    const hay=(slug+" "+d.title+" "+(d.query||"")).toLowerCase();
    return q.split(" ").filter(x=>x.length>1).reduce((n,t)=>n+(hay.includes(t)?(t.length>5?5:3):0),0);
  }
  function intent(raw){
    const q=norm(raw), max=budget(q), c=colors.filter(x=>q.includes(x));
    let st=styles.filter(x=>q.includes(x));
    const brandHints=[];
    for(const [b,a] of Object.entries(brandStyle))if(q.includes(b)){brandHints.push(b);st=[...new Set([...st,...a])];}
    const deps=Object.keys(H.departmentSubcategories||{});
    const leaves=Object.keys(H.categoryDefs||{}).filter(x=>!deps.includes(x));
    const cats=leaves.map(x=>[x,catScore(x,q)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
    const size=(q.match(/\b(?:size|מידה|مقاس)\s*[:=-]?\s*([a-z0-9.+-]{1,8})\b/i)||[])[1]||"";
    const device=(q.match(/\b(?:iphone|galaxy|pixel|redmi|xiaomi|oneplus|motorola|oppo|vivo)\s*[a-z0-9 +.-]*/i)||[])[0]||"";
    return {q,max,colors:c,styles:st,brandHints,size,device,cats:cats.length?cats:[H.slugFromQuery?.(q)||"women"]};
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
    return Number.isFinite(v)&&v>0&&v<=i.max;
  }
  function card(p){
    const img=typeof p.image_url==="string"&&p.image_url.startsWith("http")?`<img src="${H.esc(p.image_url)}" alt="${H.esc(p.title||"Product")}" loading="lazy">`:"";
    const v=Number(p.retail_price_amount);
    const pt=Number.isFinite(v)&&v>0?`From ${H.money(v,p.retail_currency||"USD")}`:"Price on product";
    return `<article class="hd-market-product-card"><a class="hd-market-card-media" href="${H.esc(H.productUrl(p))}">${img}</a><div class="hd-market-card-body"><a class="hd-market-card-title" href="${H.esc(H.productUrl(p))}">${H.esc(p.title||"Product")}</a><div class="hd-market-card-price"><strong>${H.esc(pt)}</strong></div></div></article>`;
  }
  async function load(i){
    const m=await fetch("catalog-manifest.json",{cache:"no-store"}).then(r=>r.json());
    const pages=[];
    i.cats.forEach(c=>(m.categories?.[c]?.pages||[]).slice(0,3).forEach(p=>pages.push(p)));
    if(!pages.length)(m.categories?.women?.pages||[]).slice(0,2).forEach(p=>pages.push(p));
    const docs=await Promise.all(pages.slice(0,8).map(p=>fetch(p,{cache:"force-cache"}).then(r=>r.json()).catch(()=>({products:[]}))));
    const seen=new Set(),rows=[];
    docs.flatMap(x=>x.products||[]).forEach(p=>{
      const id=String(p.item_id||"");
      if(!id||seen.has(id)||String(p.provider||"").toLowerCase()!=="cjdropshipping"||!priceOK(p,i))return;
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
    const i=intent(q); S.visible=0; $("#hd-ai-results-grid").innerHTML="";
    $("#hd-ai-intent-title").textContent=`Searching: ${q}`;
    $("#hd-ai-intent-copy").textContent=[
      `Categories: ${i.cats.map(x=>H.categoryDefs?.[x]?.title||x).join(", ")}`,
      i.colors.length?`Colors: ${i.colors.join(", ")}`:"",
      i.max?`Budget: up to $${i.max}`:"",
      i.styles.length?`Style: ${i.styles.join(", ")}`:"",
      i.size?`Size: ${i.size}`:"",
      i.device?`Device: ${i.device}`:"",
      i.brandHints.length?`Style reference only: ${i.brandHints.join(", ")} — results are not claimed as those brands.`:""
    ].filter(Boolean).join(" · ");
    $("#hd-ai-sentinel strong").textContent="Finding products…";
    H.recordSignal?.(i.cats[0]||"women","search");
    try{S.results=await load(i);$("#hd-ai-intent-title").textContent=`${S.results.length} matches`;more();observe();}
    catch(e){$("#hd-ai-intent-title").textContent="Search unavailable";$("#hd-ai-intent-copy").textContent=e?.message||"Try again.";}
    history.replaceState(null,"","search.html?q="+encodeURIComponent(q));
  }
  $("#hd-ai-search-form")?.addEventListener("submit",e=>{e.preventDefault();run($("#hd-ai-search-input").value);});
  document.querySelectorAll("[data-example]").forEach(b=>b.addEventListener("click",()=>{$("#hd-ai-search-input").value=b.dataset.example;run(b.dataset.example);}));
  H.updateCartBadges?.();
  const initial=params.get("q")||""; if(initial){$("#hd-ai-search-input").value=initial;run(initial);}
})();