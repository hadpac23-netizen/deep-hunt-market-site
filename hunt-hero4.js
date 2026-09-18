(() => {
  const H=window.HuntCore;
  const root=document.querySelector("#hunt-hero4");
  if(!root||!H)return;

  const $=q=>root.querySelector(q);
  const PROMO_DISMISS_KEY="hunt_hero4_promo_dismissed_v1";
  const DESTINATION_KEY="hunt_destination_market_v1";
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sceneButton=$("#hd-hero4-scene-next");
  const videos=[$("#hd-hero4-video-a"),$("#hd-hero4-video-b")].filter(Boolean);
  const promo=$("#hd-hero4-promo"), peek=$("#hd-hero4-peek"), status=$("#hd-hero4-status");
  const close=$("#hd-hero4-promo-close"), prev=$("#hd-hero4-prev"), next=$("#hd-hero4-next");

  const SCENES=[
    {
      id:"urban",label:"URBAN LUXE",region:"GLOBAL CITY",
      src:"https://videos.pexels.com/video-files/7062425/7062425-sd_960_540_24fps.mp4",
      poster:"assets/hunt-hero4/urban-luxe-poster.jpg",
      source:"https://www.pexels.com/video/woman-walking-on-the-city-street-at-night-7062425/"
    },
    {
      id:"dubai",label:"DUBAI",region:"MIDDLE EAST",
      src:"https://videos.pexels.com/video-files/7277163/7277163-sd_960_540_30fps.mp4",
      poster:"https://images.pexels.com/videos/7277163/city-dubai-motion-lapse-timelapse-7277163.jpeg?auto=compress&dpr=1&h=750&w=1260",
      source:"https://www.pexels.com/video/city-of-dubai-at-night-7277163/"
    },
    {
      id:"tokyo",label:"TOKYO",region:"EAST ASIA",
      src:"https://videos.pexels.com/video-files/18413833/18413833-hd_1280_720_60fps.mp4",
      poster:"https://images.pexels.com/videos/18413833/shibuya-crossing-18413833.jpeg?auto=compress&dpr=1&h=750&w=1260",
      source:"https://www.pexels.com/video/shibuya-crossing-18413833/"
    },
    {
      id:"paris",label:"PARIS",region:"EUROPE",
      src:"https://videos.pexels.com/video-files/9964385/9964385-sd_640_360_30fps.mp4",
      poster:"https://images.pexels.com/videos/9964385/4k-4k-background-4k-resolution-4k-video-9964385.jpeg?auto=compress&dpr=1&h=750&w=1260",
      source:"https://www.pexels.com/video/scenic-view-of-a-city-at-night-9964385/"
    }
  ];

  let items=[],promoIndex=0,promoTimer=null,promoPaused=false;
  let sceneOrder=[],sceneIndex=0,activeVideo=0,sceneTimer=null,sceneVisible=true,sceneToken=0;
  const esc=v=>H.esc(String(v??""));

  function destinationMarket(){
    try{
      const saved=String(localStorage.getItem(DESTINATION_KEY)||"").trim().toUpperCase();
      if(saved)return saved;
    }catch{}
    const locale=String(navigator.language||"");
    const match=locale.match(/[-_]([A-Za-z]{2})$/);
    return match?match[1].toUpperCase():"";
  }

  function preferredSceneId(){
    const country=destinationMarket();
    if(["AE","SA","QA","KW","BH","OM","IL","JO","LB","EG"].includes(country))return "dubai";
    if(["JP","KR","SG","HK","TW"].includes(country))return "tokyo";
    if(["FR","BE","CH","DE","ES","IT","NL","GB","PT","AT"].includes(country))return "paris";
    return "urban";
  }

  function buildSceneOrder(){
    const preferred=preferredSceneId();
    return [...SCENES].sort((a,b)=>(a.id===preferred?-1:b.id===preferred?1:0));
  }

  function updateSceneMeta(scene){
    root.dataset.scene=scene.id;
    root.style.setProperty("--hero-poster",`url("${scene.poster}")`);
    const label=$("#hd-hero4-scene-label"),region=$("#hd-hero4-scene-region");
    if(label)label.textContent=scene.label;
    if(region)region.textContent=scene.region;
    if(sceneButton)sceneButton.title=`${scene.label} · show next city`;
  }

  function stopSceneTimer(){if(sceneTimer){clearTimeout(sceneTimer);sceneTimer=null}}
  function scheduleScene(){
    stopSceneTimer();
    if(reduce||!sceneVisible||sceneOrder.length<2)return;
    sceneTimer=setTimeout(()=>showScene(sceneIndex+1),14000);
  }

  function prepareVideo(video,scene){
    if(!video)return;
    video.pause();
    video.poster=scene.poster;
    if(video.src!==scene.src){
      video.src=scene.src;
      video.load();
    }
  }

  function activateVideo(video,oldVideo,scene,token){
    if(token!==sceneToken)return;
    updateSceneMeta(scene);
    oldVideo?.pause();
    video.play().catch(()=>{});
    requestAnimationFrame(()=>{
      video.classList.add("is-active");
      oldVideo?.classList.remove("is-active");
    });
    setTimeout(()=>{
      if(token!==sceneToken)return;
      if(oldVideo){
        oldVideo.removeAttribute("src");
        oldVideo.load();
      }
    },1100);
    activeVideo=videos.indexOf(video);
    scheduleScene();
  }

  function showScene(nextIndex,{immediate=false}={}){
    if(!sceneOrder.length)return;
    sceneIndex=(nextIndex+sceneOrder.length)%sceneOrder.length;
    const scene=sceneOrder[sceneIndex];
    const token=++sceneToken;

    if(reduce||videos.length<2){
      updateSceneMeta(scene);
      stopSceneTimer();
      return;
    }

    const current=videos[activeVideo];
    const incoming=videos[activeVideo===0?1:0];
    prepareVideo(incoming,scene);

    let resolved=false;
    const ready=()=>{
      if(resolved)return;
      resolved=true;
      activateVideo(incoming,current,scene,token);
    };
    incoming.addEventListener("canplay",ready,{once:true});
    incoming.addEventListener("loadeddata",ready,{once:true});
    incoming.addEventListener("error",()=>{
      if(token!==sceneToken)return;
      setTimeout(()=>showScene(sceneIndex+1),900);
    },{once:true});
    setTimeout(ready,immediate?200:4200);
  }

  function initScenes(){
    sceneOrder=buildSceneOrder();
    sceneIndex=0;
    const scene=sceneOrder[0];
    updateSceneMeta(scene);
    const first=videos[0];
    if(reduce||!first)return;
    prepareVideo(first,scene);
    first.classList.add("is-active");
    first.play().catch(()=>{});
    activeVideo=0;
    scheduleScene();
  }

  function unique(rows){
    const seen=new Set();
    return (rows||[]).filter(x=>{
      const k=(x?.provider||"")+":"+(x?.item_id||"");
      if(!x?.item_id||seen.has(k))return false;
      seen.add(k);return true;
    });
  }
  function from(shelves,slugs,limit=12){return unique(slugs.flatMap(s=>Array.isArray(shelves?.[s])?shelves[s]:[])).slice(0,limit)}
  function safeImage(item){return typeof item?.image_url==="string"&&item.image_url.startsWith("https://")?item.image_url:""}
  function href(item){try{return H.productUrl(item)}catch{return "#shop"}}
  function title(item){return String(item?.title||"HUNT selection")}
  function retail(item){
    const amount=Number(item?.retail_price_amount);
    const ready=item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS"&&Number.isFinite(amount)&&amount>0;
    return ready?H.money(amount,item.retail_currency||item.currency||"USD"):"Open product to verify price";
  }

  function buildItems(shelves){
    const women=from(shelves,["women-dresses","women-tops","women-shoes","bags","jewelry-earrings"],20);
    const beauty=from(shelves,["beauty","makeup","skincare"],12);
    const signals=Object.entries(H.signals?.()||{}).sort((a,b)=>Number(b[1])-Number(a[1])).map(([s])=>s).slice(0,3);
    const personal=signals.length?from(shelves,signals.flatMap(s=>[s,...(H.departmentSubcategories?.[s]||[])]),12):women;
    const fresh=unique(Object.values(shelves||{}).flat()).filter(x=>H.isNewArrival?.(x)).slice(0,8);
    const picks=unique([personal[0],women[1],beauty[0],fresh[0],women[3]].filter(Boolean));
    return picks.map((item,i)=>({
      item,
      eyebrow:i===0&&signals.length?"FOR YOU":i===3&&H.isNewArrival?.(item)?"VERIFIED NEW":"HUNT SELECTS",
      title:title(item),
      copy:i===0&&signals.length?"Based on what you have explored on this device.":i===2?"A beauty pick from the connected catalog.":"A live catalog pick selected for this HUNT moment.",
      cta:retail(item),
      href:href(item)
    }));
  }

  function renderPromo(){
    if(!items.length)return;
    promoIndex=(promoIndex+items.length)%items.length;
    const x=items[promoIndex];
    const media=$("#hd-hero4-promo-media");
    if(media)media.innerHTML=safeImage(x.item)?'<img src="'+esc(safeImage(x.item))+'" alt="'+esc(title(x.item))+'">':"";
    $("#hd-hero4-promo-eyebrow").textContent=x.eyebrow;
    $("#hd-hero4-promo-title").textContent=x.title;
    $("#hd-hero4-promo-copy").textContent=x.copy;
    const cta=$("#hd-hero4-promo-cta");
    cta.textContent=x.cta+" →";cta.href=x.href;
    $("#hd-hero4-promo-position").textContent=(promoIndex+1)+" / "+items.length;
    $("#hd-hero4-peek-text").textContent=x.eyebrow==="FOR YOU"?"A new pick for you":"Something new in HUNT";
  }

  function setPromoState(name){
    root.dataset.promoState=name;
    const expanded=name==="open"||name==="feature";
    status?.setAttribute("aria-expanded",String(expanded));
    peek?.setAttribute("aria-expanded",String(expanded));
  }
  function stopPromo(){if(promoTimer){clearTimeout(promoTimer);promoTimer=null}}
  function later(fn,ms){stopPromo();if(reduce||promoPaused)return;promoTimer=setTimeout(fn,ms)}
  function promoCycle(){
    if(sessionStorage.getItem(PROMO_DISMISS_KEY)==="1"){setPromoState("idle");return}
    setPromoState("idle");
    later(()=>{setPromoState("peek");later(()=>{setPromoState("open");later(()=>{
      setPromoState("collapse");later(()=>{
        setPromoState("hide");
        promoIndex=(promoIndex+1)%Math.max(items.length,1);
        renderPromo();
        later(promoCycle,3200);
      },600);
    },4800)},1400)},3400);
  }
  function openPromo(){stopPromo();setPromoState("open")}
  function dismissPromo(){stopPromo();setPromoState("hide");sessionStorage.setItem(PROMO_DISMISS_KEY,"1");setTimeout(()=>setPromoState("idle"),380)}
  function manualPromo(delta){stopPromo();promoIndex=(promoIndex+delta+items.length)%items.length;renderPromo();setPromoState("open")}

  [promo,status,peek].filter(Boolean).forEach(el=>{
    el.addEventListener("mouseenter",()=>{promoPaused=true;stopPromo()});
    el.addEventListener("mouseleave",()=>{promoPaused=false;if(root.dataset.promoState==="open")later(promoCycle,6200)});
    el.addEventListener("focusin",()=>{promoPaused=true;stopPromo()});
    el.addEventListener("focusout",()=>{promoPaused=false});
  });

  status?.addEventListener("click",openPromo);
  peek?.addEventListener("click",openPromo);
  close?.addEventListener("click",dismissPromo);
  prev?.addEventListener("click",()=>manualPromo(-1));
  next?.addEventListener("click",()=>manualPromo(1));
  sceneButton?.addEventListener("click",()=>{stopSceneTimer();showScene(sceneIndex+1)});
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&(root.dataset.promoState==="open"||root.dataset.promoState==="feature"))dismissPromo();
  });

  const observer=new IntersectionObserver(entries=>{
    sceneVisible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>.18);
    if(reduce)return;
    const current=videos[activeVideo];
    if(sceneVisible){current?.play().catch(()=>{});scheduleScene()}
    else{stopSceneTimer();videos.forEach(v=>v?.pause())}
  },{threshold:[0,.18,.5]});
  observer.observe(root);

  function initPromo(data){
    items=buildItems(data?.shelves||{});
    if(!items.length)return;
    renderPromo();
    const signalEntries=Object.entries(H.signals?.()||{}).sort((a,b)=>Number(b[1])-Number(a[1]));
    const top=signalEntries[0]?.[0]||"";
    const country=destinationMarket();
    const topTitle=H.categoryDefs?.[top]?.title||top;
    const message=topTitle
      ? `HUNT is shaping your ${topTitle} edit`
      : country ? `HUNT is shaping your ${country} edit` : "HUNT is curating your next edit";
    $("#hd-hero4-status-text").textContent=message;
    if(sessionStorage.getItem(PROMO_DISMISS_KEY)!=="1")promoCycle();
  }

  initScenes();
  window.addEventListener("hunt:shelves",e=>initPromo(e.detail));
  if(window.HuntMarketShelves)initPromo(window.HuntMarketShelves);
})();