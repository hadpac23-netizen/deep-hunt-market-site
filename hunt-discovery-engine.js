(() => {
  const H=window.HuntCore;
  const root=document.querySelector("#hunt-now");
  if(!H||!root)return;

  const Q=window.HuntCatalogQuality;
  const C=window.HuntCountry;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $=q=>root.querySelector(q);
  const esc=v=>H.esc(String(v??""));
  const grid=$("#hd-discovery-grid");
  const title=$("#hd-discovery-title");
  const copy=$("#hd-discovery-copy");
  const status=$("#hd-discovery-status-text");
  const modebar=$("#hd-discovery-modes");
  const dots=$("#hd-discovery-dots");

  const COPY={
    en:{kicker:"HUNT NOW · LIVING DISCOVERY",title:"The catalog should move with you.",copy:"A quieter kind of energy: personalized edits, fresh catalog turns and complementary products — using real HUNT inventory only.",forYou:"For You Now",fresh:"Fresh Mix",look:"Complete the Look",explore:"Switch the Vibe",verified:"Verified Picks",local:"Ships to your market",truth:"Real catalog · country-aware only when verified",live:"Live discovery"},
    he:{kicker:"HUNT NOW · גילוי חי",title:"הקטלוג צריך לזוז איתך.",copy:"אנרגיה חכמה ושקטה יותר: בחירות אישיות, מיקס מתחלף ומוצרים משלימים — רק ממלאי HUNT אמיתי.",forYou:"בשבילך עכשיו",fresh:"מיקס חדש",look:"השלם את הלוק",explore:"החלף אווירה",verified:"בחירות מאומתות",local:"משלוח לשוק שלך",truth:"קטלוג אמיתי · התאמת מדינה רק כשמאומת",live:"גילוי חי"},
    ar:{kicker:"HUNT NOW · اكتشاف حي",title:"الكتالوج لازم يتحرك معك.",copy:"طاقة أهدأ وأذكى: اختيارات شخصية، مزيج متجدد ومنتجات مكملة — فقط من كتالوج HUNT الحقيقي.",forYou:"إلك الآن",fresh:"مزيج جديد",look:"كمّل اللوك",explore:"غيّر الجو",verified:"اختيارات موثّقة",local:"يشحن لسوقك",truth:"كتالوج حقيقي · حسب البلد فقط عند التحقق",live:"اكتشاف حي"},
    es:{kicker:"HUNT NOW · DESCUBRIMIENTO VIVO",title:"El catálogo debe moverse contigo.",copy:"Energía más calmada: selecciones personales, mezclas frescas y productos complementarios usando inventario real.",forYou:"Para ti ahora",fresh:"Mezcla fresca",look:"Completa el look",explore:"Cambia el estilo",verified:"Selección verificada",local:"Envío a tu mercado",truth:"Catálogo real · país solo cuando está verificado",live:"Descubrimiento vivo"},
    fr:{kicker:"HUNT NOW · DÉCOUVERTE VIVANTE",title:"Le catalogue doit évoluer avec vous.",copy:"Une énergie plus calme : sélections personnelles, mélanges frais et produits complémentaires, uniquement avec le vrai catalogue HUNT.",forYou:"Pour vous maintenant",fresh:"Mix frais",look:"Compléter le look",explore:"Changer d’univers",verified:"Sélections vérifiées",local:"Livraison vers votre marché",truth:"Catalogue réel · pays uniquement si vérifié",live:"Découverte vivante"},
    ja:{kicker:"HUNT NOW · ライブディスカバリー",title:"カタログもあなたと一緒に動く。",copy:"パーソナルな編集、フレッシュな組み合わせ、相性のよい商品を、実在するHUNT商品だけで静かに切り替えます。",forYou:"今のおすすめ",fresh:"フレッシュミックス",look:"ルックを完成",explore:"雰囲気を変える",verified:"確認済み",local:"あなたの地域へ配送",truth:"実在カタログ · 国別表示は確認済みの場合のみ",live:"ライブディスカバリー"},
    zh:{kicker:"HUNT NOW · 动态发现",title:"让目录跟着你一起变化。",copy:"更安静、更聪明的动态体验：个性精选、新鲜组合与搭配商品，只使用真实的HUNT目录。",forYou:"现在为你推荐",fresh:"新鲜组合",look:"完成整套搭配",explore:"切换风格",verified:"已验证精选",local:"可配送到你的市场",truth:"真实目录 · 仅在验证后按国家展示",live:"动态发现"}
  };

  const EXTRA={
    en:{open:"Open the full HUNT catalog ↓",forYou:"FOR YOU",start:"START HERE",match:"MATCH",fresh:"NEW",verified:"VERIFIED"},
    he:{open:"פתח את כל קטלוג HUNT ↓",forYou:"בשבילך",start:"מתחילים כאן",match:"מתאים",fresh:"חדש",verified:"מאומת"},
    ar:{open:"افتح كتالوج HUNT الكامل ↓",forYou:"إلك",start:"ابدأ من هون",match:"مكمل",fresh:"جديد",verified:"موثّق"},
    es:{open:"Abrir todo el catálogo HUNT ↓",forYou:"PARA TI",start:"EMPIEZA AQUÍ",match:"COMBINA",fresh:"NUEVO",verified:"VERIFICADO"},
    fr:{open:"Ouvrir tout le catalogue HUNT ↓",forYou:"POUR VOUS",start:"COMMENCER ICI",match:"ASSOCIÉ",fresh:"NOUVEAU",verified:"VÉRIFIÉ"},
    ja:{open:"HUNTカタログをすべて見る ↓",forYou:"あなたへ",start:"ここから",match:"マッチ",fresh:"NEW",verified:"確認済み"},
    zh:{open:"打开完整HUNT目录 ↓",forYou:"为你推荐",start:"从这里开始",match:"搭配",fresh:"新品",verified:"已验证"}
  };

  const MODE_ORDER=["for-you","fresh","look","explore","verified","local"];
  let shelves={},mode="for-you",visible=false,paused=false,timer=null,exploreIndex=0;

  function lang(){return window.HuntExperienceI18n?.current?.()||"en"}
  function words(){return COPY[lang()]||COPY.en}
  function extra(){return EXTRA[lang()]||EXTRA.en}
  function unique(rows){
    const seen=new Set(),out=[];
    for(const item of rows||[]){
      const key=(item?.provider||"")+":"+(item?.item_id||"");
      if(!item?.item_id||seen.has(key))continue;
      seen.add(key);out.push(item);
    }
    return out;
  }
  function slugsFor(slug){return [slug,...(H.departmentSubcategories?.[slug]||[])]}
  function allRows(){
    const rows=unique(Object.values(shelves||{}).flat());
    return (C?.rank?.(rows)||rows).filter(item=>Q?.fit?.(String(item?.category||""),item)!==false);
  }
  function fromSlugs(slugs,limit=40){
    const rows=unique((slugs||[]).flatMap(slug=>Array.isArray(shelves?.[slug])?shelves[slug]:[]))
      .filter(item=>Q?.fit?.(String(item?.category||slugs?.[0]||""),item)!==false);
    return (C?.rank?.(rows)||rows).slice(0,limit);
  }
  function topInterests(){
    const explicit=H.shoppingPreferences?.().categories||[];
    const behavioral=Object.entries(H.signals?.()||{})
      .filter(([slug,score])=>H.categoryDefs?.[slug]&&Number(score)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1]))
      .map(([slug])=>slug);
    return [...new Set([...explicit,...behavioral])].slice(0,6);
  }
  function verifiedRows(){
    return allRows().filter(item=>item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS");
  }
  function localRows(){
    return allRows().filter(item=>C?.readiness?.(item)==="verified_match");
  }
  function freshRows(){
    return allRows().filter(item=>H.isNewArrival?.(item));
  }

  function complementaryRows(){
    const top=topInterests()[0]||"women";
    const maps={
      women:["women-dresses","women-shoes","bags","jewelry-earrings","makeup","sunglasses"],
      men:["men-tops","men-shoes","watches","men-accessories","grooming"],
      beauty:["makeup","skincare","hair","nails","beauty-tools","accessories"],
      tech:["phone-cases","chargers-cables","power-banks","audio","wearables","computer-accessories"],
      home:["home-storage","lighting","kitchen","bedding","home-decor","drinkware"],
      accessories:["bags","jewelry-earrings","jewelry-necklaces","watches","sunglasses","hair-accessories"],
      sports:["activewear","fitness-equipment","outdoors","sports-accessories"],
      kids:["kids","toys","kids-shoes","kids-accessories"]
    };
    const slugs=maps[top]||maps.women;
    const picks=[];
    for(const slug of slugs){
      const item=fromSlugs([slug],12)[0];
      if(item)picks.push(item);
    }
    return unique(picks);
  }

  function exploreRows(){
    const worlds=["beauty","tech","home","accessories","women","men","sports","kids"];
    const world=worlds[exploreIndex%worlds.length];
    exploreIndex=(exploreIndex+1)%worlds.length;
    root.dataset.exploreWorld=world;
    return fromSlugs(slugsFor(world),24);
  }

  function forYouRows(){
    const interests=topInterests();
    const slugs=interests.length?interests.flatMap(slugsFor):[
      ...slugsFor("women"),...slugsFor("beauty"),...slugsFor("accessories"),...slugsFor("tech")
    ];
    return fromSlugs(slugs,36);
  }

  function modeRows(nextMode){
    if(nextMode==="fresh"){
      const fresh=freshRows();
      root.dataset.freshTruth=fresh.length?"verified-new":"rotation";
      return fresh.length>=4?fresh:unique([...fresh,...allRows()]);
    }
    if(nextMode==="look")return complementaryRows();
    if(nextMode==="explore")return exploreRows();
    if(nextMode==="verified")return verifiedRows();
    if(nextMode==="local")return localRows();
    return forYouRows();
  }

  function availableModes(){
    const modes=["for-you","fresh","look","explore"];
    if(verifiedRows().length>=4)modes.push("verified");
    if(localRows().length>=4)modes.push("local");
    return modes;
  }

  function retail(item){
    const amount=Number(item?.retail_price_amount);
    const ready=item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS"&&Number.isFinite(amount)&&amount>0;
    return ready?H.money(amount,item.retail_currency||item.currency||"USD"):(window.HuntExperienceI18n?.t?.("verifyPrice")||"Live price check");
  }
  function badge(item,nextMode,index){
    const x=extra();
    if(nextMode==="verified")return x.verified;
    if(nextMode==="local")return C?.meta?.()?.code||"LOCAL";
    if(nextMode==="fresh"&&H.isNewArrival?.(item))return x.fresh;
    if(nextMode==="look")return index===0?x.start:x.match;
    if(nextMode==="for-you")return x.forYou;
    const c=String(item?.category||"").replace(/-/g," ").toUpperCase();
    return c.slice(0,20)||"DISCOVER";
  }
  function countryChip(item){
    if(C?.readiness?.(item)!=="verified_match")return "";
    const meta=C.meta?.();
    return meta?.code?'<span class="hd-discovery-country">✓ '+esc(meta.code)+'</span>':"";
  }
  function card(item,index,nextMode){
    const image=typeof item?.image_url==="string"&&item.image_url.startsWith("https://")
      ?'<img src="'+esc(item.image_url)+'" alt="'+esc(item.title||"Product")+'" loading="lazy">'
      :'<div class="hd-discovery-placeholder">H</div>';
    const href=H.productUrl(item);
    return '<article class="hd-market-product-card hd-discovery-card" data-category="'+esc(item.category||"")+'" style="--i:'+index+'">'+
      '<a class="hd-market-card-media hd-discovery-media" href="'+esc(href)+'">'+image+'</a>'+
      '<span class="hd-discovery-badge">'+esc(badge(item,nextMode,index))+'</span>'+countryChip(item)+
      '<div class="hd-discovery-body">'+
        '<a class="hd-market-card-title hd-discovery-title" href="'+esc(href)+'">'+esc(item.title||"Product")+'</a>'+
        '<span class="hd-discovery-price">'+esc(retail(item))+'</span>'+
      '</div></article>';
  }

  function updateCopy(nextMode,rows){
    const c=words();
    const modeLabels={"for-you":c.forYou,fresh:c.fresh,look:c.look,explore:c.explore,verified:c.verified,local:c.local};
    $("#hd-discovery-kicker").textContent=c.kicker;
    title.textContent=nextMode==="for-you"?c.title:modeLabels[nextMode]||c.title;
    copy.textContent=c.copy;
    status.innerHTML='<strong>'+esc(modeLabels[nextMode]||c.live)+'</strong> · '+rows.length;
    $("#hd-discovery-truth").textContent=c.truth;
    const open=$("#hd-discovery-open");
    if(open)open.textContent=extra().open;
    modebar.querySelectorAll("[data-discovery-mode]").forEach(btn=>{
      const key=btn.dataset.discoveryMode;
      btn.textContent=modeLabels[key]||key;
      btn.classList.toggle("active",key===nextMode);
      btn.setAttribute("aria-selected",String(key===nextMode));
    });
  }

  function renderDots(modes){
    dots.innerHTML=modes.map(key=>'<i class="'+(key===mode?"active":"")+'" aria-hidden="true"></i>').join("");
  }

  function render(nextMode=mode,{manual=false}={}){
    const modes=availableModes();
    if(!modes.includes(nextMode))nextMode=modes[0]||"for-you";
    mode=nextMode;
    root.dataset.discoveryMode=mode;
    root.classList.remove("is-switching");
    void root.offsetWidth;
    root.classList.add("is-switching");

    const rows=modeRows(mode).slice(0,6);
    updateCopy(mode,rows);
    renderDots(modes);
    modebar.querySelector('[data-discovery-mode="verified"]')?.toggleAttribute("hidden",!modes.includes("verified"));
    modebar.querySelector('[data-discovery-mode="local"]')?.toggleAttribute("hidden",!modes.includes("local"));

    grid.classList.remove("is-live");
    grid.innerHTML=rows.length?rows.map((item,index)=>card(item,index,mode)).join(""):
      '<div class="hd-discovery-empty"><div><strong>HUNT</strong><br>Discovery is waiting for qualified catalog products.</div></div>';
    requestAnimationFrame(()=>grid.classList.add("is-live"));

    window.HuntAnalytics?.experience?.("discovery_mode_impression",{mode,count:rows.length,manual});
  }

  function stop(){if(timer){clearTimeout(timer);timer=null}}
  function schedule(){
    stop();
    if(reduce||paused||!visible)return;
    timer=setTimeout(()=>{
      const modes=availableModes();
      const next=modes[(Math.max(0,modes.indexOf(mode))+1)%modes.length]||"for-you";
      render(next);
      schedule();
    },10400);
  }

  modebar.addEventListener("click",event=>{
    const btn=event.target.closest?.("[data-discovery-mode]");
    if(!btn||btn.hidden)return;
    paused=true;stop();render(btn.dataset.discoveryMode,{manual:true});
    setTimeout(()=>{paused=false;schedule()},6500);
  });
  grid.addEventListener("click",event=>{
    const link=event.target.closest?.("a[href*='product.html']");
    if(!link)return;
    window.HuntAnalytics?.experience?.("discovery_product_click",{mode});
  });
  root.addEventListener("mouseenter",()=>{paused=true;stop()});
  root.addEventListener("mouseleave",()=>{paused=false;schedule()});
  root.addEventListener("focusin",()=>{paused=true;stop()});
  root.addEventListener("focusout",()=>{paused=false;schedule()});

  const io=new IntersectionObserver(entries=>{
    visible=entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>.22);
    root.dataset.inView=visible?"true":"false";
    visible?schedule():stop();
  },{threshold:[0,.22,.5]});
  io.observe(root);

  function setShelves(data){
    shelves=data?.shelves||shelves||{};
    if(!Object.values(shelves).some(rows=>Array.isArray(rows)&&rows.length))return;
    render(mode);
    schedule();
  }

  function setupExistingSectionMotion(){
    const sections=document.querySelectorAll("#women-edit,.hd-home3-duo,#for-you,#look-builder,#fresh-in-hunt,#shop,#deals");
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting&&entry.intersectionRatio>.08){
          entry.target.classList.add("is-alive-visible");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:[.08]});
    sections.forEach(section=>{section.classList.add("hd-alive-section");observer.observe(section)});
  }

  window.addEventListener("hunt:shelves",event=>setShelves(event.detail));
  window.addEventListener("hunt:shelves-refreshed",event=>setShelves(event.detail));
  window.addEventListener("hunt:personalization-ready",()=>{if(Object.keys(shelves).length)render("for-you")});
  window.addEventListener("hunt:country-changed",()=>{if(Object.keys(shelves).length)render(mode)});
  window.addEventListener("hunt:experience-language",()=>{if(Object.keys(shelves).length)render(mode)});
  window.addEventListener("boom:plan",event=>{
    const next=String(event.detail?.plan?.discovery_mode||"");
    if(!Object.keys(shelves).length||!next)return;
    const modes=availableModes();
    if(!modes.includes(next))return;
    mode=next;render(next);schedule();
  });

  setupExistingSectionMotion();
  if(window.HuntMarketShelves)setShelves(window.HuntMarketShelves);
})();