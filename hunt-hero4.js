(() => {
  const H=window.HuntCore;
  const root=document.querySelector("#hunt-hero4");
  const promoZone=document.querySelector("#hunt-lifestyle-stream");
  if(!root||!promoZone||!H)return;

  const I=window.HuntExperienceI18n;
  const t=key=>I?.t?.(key)||key;
  const q=sel=>root.querySelector(sel)||promoZone.querySelector(sel)||document.querySelector(sel);
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PROMO_DISMISS_KEY="hunt_hero421_promo_dismissed_v1";
  const DESTINATION_KEY="hunt_destination_market_v1";

  const sceneButton=q("#hd-hero4-scene-next");
  const sceneLabel=q("#hd-hero4-scene-label");
  const sceneRegion=q("#hd-hero4-scene-region");
  const sceneLayers=[q("#hd-city-scene-a"),q("#hd-city-scene-b")].filter(Boolean);
  const discover=q("#hd-hero4-discover-text");

  const promo=q("#hd-hero4-promo");
  const peek=q("#hd-hero4-peek");
  const status=q("#hd-hero4-status");
  const statusText=q("#hd-hero4-status-text");
  const close=q("#hd-hero4-promo-close");
  const prev=q("#hd-hero4-prev");
  const next=q("#hd-hero4-next");
  const stack=q("#hd-hero4-promo-stack");

  const SCENES=[
    {
      id:"dubai",label:"DUBAI",region:"MIDDLE EAST",
      poster:"https://images.pexels.com/photos/13256066/pexels-photo-13256066.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/dubai-skyline-at-night-13256066/"
    },
    {
      id:"hong-kong",label:"HONG KONG",region:"EAST ASIA",
      poster:"https://images.pexels.com/photos/5066398/pexels-photo-5066398.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/city-skyline-in-hongkong-during-night-time-5066398/"
    },
    {
      id:"new-york",label:"NEW YORK",region:"NORTH AMERICA",
      poster:"https://images.pexels.com/photos/10554403/pexels-photo-10554403.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/new-york-city-skyline-during-night-time-10554403/"
    },
    {
      id:"paris",label:"PARIS",region:"EUROPE",
      poster:"https://images.pexels.com/photos/31102296/pexels-photo-31102296.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/paris-night-skyline-captured-from-eiffel-tower-31102296/"
    },
    {
      id:"madrid",label:"MADRID",region:"EUROPE",
      poster:"https://images.pexels.com/photos/11269164/pexels-photo-11269164.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/city-skyline-at-night-11269164/"
    },
    {
      id:"london",label:"LONDON",region:"EUROPE",
      poster:"https://images.pexels.com/photos/37713883/pexels-photo-37713883.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/skyline-of-london-s-iconic-cityscape-at-night-37713883/"
    },
    {
      id:"singapore",label:"SINGAPORE",region:"SOUTHEAST ASIA",
      poster:"https://images.pexels.com/photos/18095413/pexels-photo-18095413.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/singapore-city-skyline-at-night-18095413/"
    },
    {
      id:"seoul",label:"SEOUL",region:"EAST ASIA",
      poster:"https://images.pexels.com/photos/38650647/pexels-photo-38650647.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/seoul-skyline-at-night-with-han-river-view-38650647/"
    },
    {
      id:"shanghai",label:"SHANGHAI",region:"EAST ASIA",
      poster:"https://images.pexels.com/photos/37011820/pexels-photo-37011820.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/shanghai-pudong-skyline-at-night-37011820/"
    },
    {
      id:"tokyo",label:"TOKYO",region:"EAST ASIA",
      poster:"https://images.pexels.com/photos/31558042/pexels-photo-31558042.jpeg?auto=compress&cs=tinysrgb&w=2400",
      source:"https://www.pexels.com/photo/tokyo-skyline-at-night-with-tokyo-tower-31558042/"
    }
  ];

  const CLUSTERS={
    women:["women","women-dresses","women-tops","women-bottoms","women-shoes","women-outerwear","women-knitwear"],
    beauty:["beauty","makeup","skincare","body-care","beauty-tools","hair","nails"],
    accessories:["accessories","bags","jewelry","jewelry-earrings","jewelry-necklaces","jewelry-rings","watches","sunglasses","hair-accessories"],
    tech:["tech","usefultech","phoneaccessories","phonecases","chargers","powerbanks","earbuds","gaming"],
    home:["home","lighting","kitchen","storage","bedding","cleaning","bath"],
    men:["men","suits","hoodies","jackets","tops","bottoms","shoes"],
    sports:["sports","activewear","outdoors"],
    kids:["kids","toys"]
  };
  const DEFAULT_INTERESTS=["women","beauty","accessories","home","tech","men","sports","kids"];
  const PROMO_HUES={women:334,beauty:318,accessories:280,tech:202,home:34,men:218,sports:145,kids:48};

  let sceneOrder=[],sceneIndex=0,activeSceneLayer=0,sceneTimer=null,sceneVisible=true,sceneToken=0;
  let items=[],promoIndex=0,promoTimer=null,promoPaused=false,promoVisible=false,promoStarted=false;
  let promoScrollArmed=window.scrollY>120;
  let discoverIndex=0,discoverTimer=null;
  const esc=v=>H.esc(String(v??""));

  function destinationMarket(){
    try{
      const saved=String(localStorage.getItem(DESTINATION_KEY)||"").trim().toUpperCase();
      if(saved)return saved;
    }catch{}
    const m=String(navigator.language||"").match(/[-_]([A-Za-z]{2})$/);
    return m?m[1].toUpperCase():"";
  }

  function preferredSceneId(){
    const c=destinationMarket();
    if(["AE","SA","QA","KW","BH","OM","IL","JO","LB","EG"].includes(c))return "dubai";
    if(c==="HK")return "hong-kong";
    if(["US","CA","MX"].includes(c))return "new-york";
    if(["FR","BE","CH","DE","NL","AT","IT"].includes(c))return "paris";
    if(["ES","PT"].includes(c))return "madrid";
    if(["GB","IE"].includes(c))return "london";
    if(["SG","MY"].includes(c))return "singapore";
    if(c==="KR")return "seoul";
    if(["CN","TW"].includes(c))return "shanghai";
    if(c==="JP")return "tokyo";
    return "dubai";
  }

  function buildSceneOrder(){
    const preferred=SCENES.find(x=>x.id===preferredSceneId());
    const rest=SCENES.filter(x=>x!==preferred);
    return [...(preferred?[preferred]:[]),...rest];
  }

  function setSceneMeta(scene){
    root.dataset.scene=scene.id;
    root.dataset.sceneQuality="passed";
    if(sceneLabel)sceneLabel.textContent=scene.label;
    if(sceneRegion)sceneRegion.textContent=scene.region;
    if(sceneButton){
      sceneButton.title=`${scene.label} · ${t("sceneNext")}`;
      sceneButton.setAttribute("aria-label",t("sceneNext"));
    }
  }

  function loadSceneImage(scene){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.decoding="async";
      img.onload=()=>{
        const ratio=img.naturalWidth/Math.max(img.naturalHeight,1);
        if(img.naturalWidth<1800||img.naturalHeight<900||ratio<1.35){
          reject(new Error("quality_gate"));
          return;
        }
        resolve(scene);
      };
      img.onerror=()=>reject(new Error("load_failed"));
      img.src=scene.poster;
    });
  }

  function stopSceneTimer(){if(sceneTimer){clearTimeout(sceneTimer);sceneTimer=null}}
  function scheduleScene(){
    stopSceneTimer();
    if(reduce||!sceneVisible||sceneOrder.length<2)return;
    sceneTimer=setTimeout(()=>showScene(sceneIndex+1),9200);
  }

  async function showScene(nextIndex){
    if(!sceneOrder.length||!sceneLayers.length)return;
    sceneIndex=(nextIndex+sceneOrder.length)%sceneOrder.length;
    const scene=sceneOrder[sceneIndex];
    const token=++sceneToken;
    root.dataset.sceneQuality="checking";

    try{
      await loadSceneImage(scene);
    }catch{
      if(token!==sceneToken)return;
      root.dataset.sceneQuality="rejected";
      setTimeout(()=>showScene(sceneIndex+1),120);
      return;
    }
    if(token!==sceneToken)return;

    const incoming=sceneLayers[activeSceneLayer===0?1:0]||sceneLayers[0];
    const outgoing=sceneLayers[activeSceneLayer]||null;
    incoming.style.backgroundImage=`url("${scene.poster}")`;
    incoming.dataset.scene=scene.id;
    incoming.classList.remove("is-panning");
    void incoming.offsetWidth;
    incoming.classList.add("is-active","is-panning");
    outgoing?.classList.remove("is-active","is-panning");
    activeSceneLayer=sceneLayers.indexOf(incoming);
    setSceneMeta(scene);
    scheduleScene();
  }

  function initScenes(){
    sceneOrder=buildSceneOrder();
    root.dataset.sceneOrder=sceneOrder.map(x=>x.id).join(",");
    sceneIndex=-1;
    showScene(0);
  }

  function unique(rows){
    const seen=new Set();
    return (rows||[]).filter(x=>{
      const k=(x?.provider||"")+":"+(x?.item_id||"");
      if(!x?.item_id||seen.has(k))return false;
      seen.add(k);return true;
    });
  }
  function from(shelves,slugs,limit=20){return unique((slugs||[]).flatMap(s=>Array.isArray(shelves?.[s])?shelves[s]:[])).slice(0,limit)}
  function safeImage(item){return typeof item?.image_url==="string"&&item.image_url.startsWith("https://")?item.image_url:""}
  function href(item){try{return H.productUrl(item)}catch{return "#shop"}}
  function title(item){return String(item?.title||"HUNT selection")}
  function retail(item){
    const amount=Number(item?.retail_price_amount);
    const ready=item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS"&&Number.isFinite(amount)&&amount>0;
    return ready?H.money(amount,item.retail_currency||item.currency||"USD"):"";
  }
  function uniqueStrings(rows){return [...new Set((rows||[]).filter(Boolean))]}

  function broadInterest(slug){
    if(CLUSTERS[slug])return slug;
    for(const [name,slugs] of Object.entries(CLUSTERS)){
      if(slugs.includes(slug)||(H.departmentSubcategories?.[name]||[]).includes(slug))return name;
    }
    return "";
  }

  function rankedInterests(){
    const out=[];
    for(const [slug,score] of Object.entries(H.signals?.()||{}).sort((a,b)=>Number(b[1])-Number(a[1]))){
      if(Number(score)<=0)continue;
      const broad=broadInterest(slug);
      if(broad&&!out.includes(broad))out.push(broad);
    }
    return out;
  }

  function clusterSlugs(interest){
    return uniqueStrings([interest,...(CLUSTERS[interest]||[]),...(H.departmentSubcategories?.[interest]||[])]);
  }

  function buildItems(shelves){
    const ranked=rankedInterests();
    const order=uniqueStrings([...ranked,...DEFAULT_INTERESTS]);
    const used=new Set(),stories=[];

    order.forEach((interest,orderIndex)=>{
      const rows=from(shelves,clusterSlugs(interest),18);
      const take=orderIndex<2?2:1;
      let added=0;
      for(const item of rows){
        const key=(item?.provider||"")+":"+(item?.item_id||"");
        if(!key||used.has(key))continue;
        used.add(key);
        stories.push({item,interest,personal:ranked.includes(interest),fresh:!!H.isNewArrival?.(item)});
        if(++added>=take)break;
      }
    });

    if(stories.length<8){
      const all=unique(Object.values(shelves||{}).flat());
      for(const item of all){
        const key=(item?.provider||"")+":"+(item?.item_id||"");
        if(!key||used.has(key))continue;
        used.add(key);
        stories.push({item,interest:broadInterest(String(item?.category||""))||"accessories",personal:false,fresh:!!H.isNewArrival?.(item)});
        if(stories.length>=12)break;
      }
    }
    return stories.slice(0,12);
  }

  function promoCopy(x){
    if(x.personal)return t("promoPersonal");
    if(x.interest==="beauty")return t("promoBeauty");
    if(x.interest==="tech")return t("promoTech");
    if(x.interest==="home")return t("promoHome");
    return t("promoCatalog");
  }
  function promoEyebrow(x){
    if(x.fresh)return t("promoFresh");
    if(x.personal)return t("promoForYou");
    return t("promoSelects");
  }

  function renderStack(){
    if(!stack||items.length<2){if(stack)stack.innerHTML="";return}
    stack.innerHTML=[1,2,3].filter(n=>n<items.length).map((off,slot)=>{
      const idx=(promoIndex+off)%items.length,x=items[idx],img=safeImage(x.item);
      return `<button type="button" data-promo-jump="${idx}" style="--stack-slot:${slot}" aria-label="${esc(t("maybe"))}">${img?`<img src="${esc(img)}" alt="">`:"<span>H</span>"}</button>`;
    }).join("");
  }

  function renderPromo(){
    if(!items.length)return;
    promoIndex=(promoIndex+items.length)%items.length;
    const x=items[promoIndex],img=safeImage(x.item);
    const media=q("#hd-hero4-promo-media");
    if(media)media.innerHTML=img?'<img src="'+esc(img)+'" alt="'+esc(title(x.item))+'">':"<span class=\"hd-promo-placeholder\">H</span>";
    q("#hd-hero4-promo-eyebrow").textContent=promoEyebrow(x);
    q("#hd-hero4-promo-title").textContent=title(x.item);
    q("#hd-hero4-promo-copy").textContent=promoCopy(x);
    q("#hd-hero4-promo-price").textContent=retail(x.item)||t("verifyPrice");
    const cta=q("#hd-hero4-promo-cta");
    if(cta){
      cta.href=href(x.item);
      const span=cta.querySelector("span");
      if(span)span.textContent=t("explore");
    }
    q("#hd-hero4-promo-position").textContent=(promoIndex+1)+" / "+items.length;
    if(q("#hd-hero4-peek-text"))q("#hd-hero4-peek-text").textContent=t("maybe");
    promoZone.style.setProperty("--promo-hue",String(PROMO_HUES[x.interest]||250));
    promoZone.dataset.promoInterest=x.interest||"mixed";
    root.dataset.promoInterest=x.interest||"mixed";
    renderStack();

    if(promo){
      promo.classList.remove("is-switching");
      void promo.offsetWidth;
      promo.classList.add("is-switching");
    }
  }

  function setPromoState(name){
    promoZone.dataset.promoState=name;
    root.dataset.promoState=name;
    const expanded=name==="open"||name==="feature";
    status?.setAttribute("aria-expanded",String(expanded));
    peek?.setAttribute("aria-expanded",String(expanded));
  }
  function stopPromo(){if(promoTimer){clearTimeout(promoTimer);promoTimer=null}}
  function canStartPromo(){return promoVisible&&promoScrollArmed}
  function later(fn,ms){
    stopPromo();
    if(reduce||promoPaused||!canStartPromo())return;
    promoTimer=setTimeout(fn,ms);
  }
  function promoCycle(){
    if(!canStartPromo()||!items.length)return;
    try{if(sessionStorage.getItem(PROMO_DISMISS_KEY)==="1"){setPromoState("idle");return}}catch{}
    setPromoState("peek");
    later(()=>{
      setPromoState("open");
      later(()=>{
        setPromoState("collapse");
        later(()=>{
          setPromoState("hide");
          promoIndex=(promoIndex+1)%Math.max(items.length,1);
          renderPromo();
          later(promoCycle,1800);
        },500);
      },4300);
    },900);
  }
  function startPromoIfReady(){
    if(!canStartPromo()||!items.length)return;
    promoStarted=true;
    promoCycle();
  }
  function openPromo(){stopPromo();if(promoVisible)setPromoState("open")}
  function dismissPromo(){
    stopPromo();setPromoState("hide");
    try{sessionStorage.setItem(PROMO_DISMISS_KEY,"1")}catch{}
    setTimeout(()=>setPromoState("idle"),360);
  }
  function manualPromo(delta){
    if(!items.length)return;
    stopPromo();promoIndex=(promoIndex+delta+items.length)%items.length;renderPromo();setPromoState("open");
  }

  [promo,status,peek].filter(Boolean).forEach(el=>{
    el.addEventListener("mouseenter",()=>{promoPaused=true;stopPromo()});
    el.addEventListener("mouseleave",()=>{promoPaused=false;if(promoVisible&&promoZone.dataset.promoState==="open")later(promoCycle,5600)});
    el.addEventListener("focusin",()=>{promoPaused=true;stopPromo()});
    el.addEventListener("focusout",()=>{promoPaused=false});
    el.addEventListener("touchstart",()=>{promoPaused=true;stopPromo()},{passive:true});
  });

  status?.addEventListener("click",openPromo);
  peek?.addEventListener("click",openPromo);
  close?.addEventListener("click",dismissPromo);
  prev?.addEventListener("click",()=>manualPromo(-1));
  next?.addEventListener("click",()=>manualPromo(1));
  stack?.addEventListener("click",e=>{
    const b=e.target.closest?.("[data-promo-jump]");
    if(!b)return;
    promoIndex=Number(b.dataset.promoJump)||0;
    renderPromo();setPromoState("open");stopPromo();
  });
  sceneButton?.addEventListener("click",()=>{stopSceneTimer();showScene(sceneIndex+1)});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&(promoZone.dataset.promoState==="open"||promoZone.dataset.promoState==="feature"))dismissPromo();
  });

  function updateDiscover(reset=false){
    const choices=I?.dict?.()?.discover||["Discover your HUNT","More for you below","Scroll into your world"];
    if(reset)discoverIndex=0;
    if(discover)discover.textContent=choices[discoverIndex%choices.length]||choices[0];
  }
  function startDiscover(){
    if(discoverTimer){clearInterval(discoverTimer);discoverTimer=null}
    updateDiscover(true);
    if(reduce)return;
    discoverTimer=setInterval(()=>{
      const choices=I?.dict?.()?.discover||[];
      discoverIndex=(discoverIndex+1)%Math.max(choices.length,1);
      if(discover){
        discover.classList.remove("is-changing");
        void discover.offsetWidth;
        discover.textContent=choices[discoverIndex]||"Discover your HUNT";
        discover.classList.add("is-changing");
      }
    },5200);
  }

  const sceneObserver=new IntersectionObserver(entries=>{
    sceneVisible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>.16);
    if(sceneVisible)scheduleScene();else stopSceneTimer();
  },{threshold:[0,.16,.5]});
  sceneObserver.observe(root);

  const promoObserver=new IntersectionObserver(entries=>{
    promoVisible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>.18);
    promoZone.dataset.inView=promoVisible?"true":"false";
    promoZone.dataset.scrollArmed=promoScrollArmed?"true":"false";
    if(canStartPromo()){
      startPromoIfReady();
    }else{
      stopPromo();
      setPromoState("idle");
    }
  },{threshold:[0,.18,.45]});
  promoObserver.observe(promoZone);

  addEventListener("scroll",()=>{
    const nextArmed=window.scrollY>120;
    if(nextArmed===promoScrollArmed)return;
    promoScrollArmed=nextArmed;
    promoZone.dataset.scrollArmed=promoScrollArmed?"true":"false";
    if(canStartPromo())startPromoIfReady();
    else{stopPromo();setPromoState("idle")}
  },{passive:true});

  function initPromo(data){
    const nextItems=buildItems(data?.shelves||{});
    if(!nextItems.length&&items.length)return;
    if(items.length>=8&&nextItems.length<8)return;
    items=nextItems;
    root.dataset.promoCount=String(items.length);
    root.dataset.promoQueueFirst=items[0]?.interest||"";
    root.dataset.promoReady=items.length>=8?"true":"false";
    promoZone.dataset.promoCount=String(items.length);
    if(!items.length)return;
    renderPromo();
    if(statusText)statusText.textContent=t("maybe");
    if(promoVisible)startPromoIfReady();
  }

  window.addEventListener("hunt:experience-language",()=>{
    if(items.length)renderPromo();
    if(statusText)statusText.textContent=t("maybe");
    startDiscover();
    const scene=sceneOrder[sceneIndex];
    if(scene)setSceneMeta(scene);
  });

  initScenes();
  startDiscover();
  window.addEventListener("hunt:shelves",e=>initPromo(e.detail));
  window.addEventListener("hunt:shelves-refreshed",e=>initPromo(e.detail));
  if(window.HuntMarketShelves)initPromo(window.HuntMarketShelves);
})();