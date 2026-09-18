(() => {
  const root=document.querySelector("#hunt-night-edit");
  const H=window.HuntCore,Q=window.HuntCatalogQuality,C=window.HuntCountry;
  if(!root||!H)return;
  const grid=root.querySelector("#hd-night-edit-grid");
  const worldsHost=root.querySelector("#hd-night-edit-worlds");
  const title=root.querySelector("#hd-night-edit-title");
  const sub=root.querySelector("#hd-night-edit-copy");
  const truth=root.querySelector("#hd-night-edit-truth");
  const next=root.querySelector("#hd-night-edit-next");
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WORLDS=["women","beauty","accessories","tech","home","men"];
  const COPY={
    en:{k:"HUNT NIGHT EDIT",t:"A darker, sharper way to discover.",c:"Three real catalog picks at a time — just an editorial switch of mood.",next:"Switch edit →",truth:"Real products · editorial presentation only"},
    he:{k:"HUNT NIGHT EDIT",t:"דרך כהה וחדה יותר לגלות.",c:"שלוש בחירות אמיתיות בכל פעם — רק החלפת אווירה עריכתית.",next:"החלף עריכה →",truth:"מוצרים אמיתיים · תצוגה עריכתית בלבד"},
    ar:{k:"HUNT NIGHT EDIT",t:"طريقة أغمق وأقوى للاكتشاف.",c:"ثلاث اختيارات حقيقية كل مرة — بس تغيير مزاج بصري أنيق.",next:"غيّر الاختيار →",truth:"منتجات حقيقية · عرض تحريري فقط"}
  };
  let shelves={},worldIndex=0,timer=null,visible=false,paused=false;

  const esc=v=>H.esc(String(v??""));
  const lang=()=>window.HuntExperienceI18n?.current?.()||"en";
  const words=()=>COPY[lang()]||COPY.en;
  function unique(rows){const s=new Set();return (rows||[]).filter(x=>{const k=(x?.provider||"")+":"+(x?.item_id||"");if(!x?.item_id||s.has(k))return false;s.add(k);return true})}
  function slugsFor(world){return [world,...(H.departmentSubcategories?.[world]||[])]}
  function topWorld(){
    const explicit=H.shoppingPreferences?.().categories||[];
    const behavior=Object.entries(H.signals?.()||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0)).map(([x])=>x);
    return [...explicit,...behavior].find(x=>WORLDS.includes(x))||"women";
  }
  function rowsFor(world){
    const rows=unique(slugsFor(world).flatMap(slug=>Array.isArray(shelves?.[slug])?shelves[slug]:[]))
      .filter(item=>Q?.fit?.(String(item?.category||world),item)!==false);
    return (C?.rank?.(rows)||rows).slice(0,3);
  }
  function price(item){
    const n=Number(item?.retail_price_amount);
    const ready=item?.retail_price_verified===true&&String(item?.profit_gate_status||"").toUpperCase()==="PASS"&&Number.isFinite(n)&&n>0;
    return ready?H.money(n,item.retail_currency||item.currency||"USD"):(window.HuntExperienceI18n?.t?.("verifyPrice")||"Live price check");
  }
  function card(item,i,world){
    const href=H.productUrl(item);
    const image=String(item?.image_url||"").startsWith("https://")
      ?'<img src="'+esc(item.image_url)+'" alt="'+esc(item.title||"Product")+'" loading="lazy">'
      :'<div class="hd-discovery-placeholder">H</div>';
    return '<article class="hd-market-product-card hd-night-card" style="--night-i:'+i+'" data-category="'+esc(item.category||world)+'">'+
      '<a class="hd-market-card-media hd-night-card-media" href="'+esc(href)+'">'+image+'</a>'+
      '<span class="hd-night-index">0'+(i+1)+'</span>'+
      '<div class="hd-night-card-copy"><small>'+esc((H.categoryDefs?.[item.category]?.title||world).toUpperCase())+'</small>'+
      '<a class="hd-market-card-title" href="'+esc(href)+'"><strong>'+esc(item.title||"Product")+'</strong></a>'+
      '<span class="hd-night-card-price">'+esc(price(item))+'</span></div></article>';
  }
  function renderWorld(world,{manual=false}={}){
    const rows=rowsFor(world);
    if(rows.length<2){
      const nextWorld=WORLDS[(WORLDS.indexOf(world)+1)%WORLDS.length];
      if(nextWorld!==world)return renderWorld(nextWorld,{manual});
    }
    root.dataset.world=world;
    root.dataset.switching="true";
    setTimeout(()=>root.dataset.switching="false",720);
    worldsHost.querySelectorAll("[data-night-world]").forEach(btn=>{
      btn.classList.toggle("active",btn.dataset.nightWorld===world);
      btn.setAttribute("aria-pressed",String(btn.dataset.nightWorld===world));
    });
    grid.classList.remove("is-live");
    grid.innerHTML=rows.map((item,i)=>card(item,i,world)).join("");
    requestAnimationFrame(()=>grid.classList.add("is-live"));
    const c=words();
    root.querySelector("#hd-night-edit-kicker").textContent=c.k;
    title.textContent=c.t;
    sub.textContent=c.c;
    truth.textContent=c.truth;
    next.textContent=c.next;
    window.HuntAnalytics?.experience?.("night_edit_impression",{world,count:rows.length,manual});
  }
  function stop(){if(timer){clearTimeout(timer);timer=null}}
  function schedule(){
    stop();if(reduce||paused||!visible)return;
    timer=setTimeout(()=>{
      worldIndex=(worldIndex+1)%WORLDS.length;
      renderWorld(WORLDS[worldIndex]);
      schedule();
    },12400);
  }
  function setShelves(data){
    shelves=data?.shelves||shelves;
    if(!Object.values(shelves).some(x=>Array.isArray(x)&&x.length))return;
    const first=topWorld();
    worldIndex=Math.max(0,WORLDS.indexOf(first));
    renderWorld(first);
    schedule();
  }
  worldsHost.addEventListener("click",e=>{
    const btn=e.target.closest?.("[data-night-world]");if(!btn)return;
    worldIndex=Math.max(0,WORLDS.indexOf(btn.dataset.nightWorld));
    paused=true;stop();renderWorld(btn.dataset.nightWorld,{manual:true});
    setTimeout(()=>{paused=false;schedule()},6500);
  });
  next.addEventListener("click",()=>{
    worldIndex=(worldIndex+1)%WORLDS.length;
    paused=true;stop();renderWorld(WORLDS[worldIndex],{manual:true});
    setTimeout(()=>{paused=false;schedule()},6500);
  });
  root.addEventListener("mouseenter",()=>{paused=true;stop()});
  root.addEventListener("mouseleave",()=>{paused=false;schedule()});
  root.addEventListener("focusin",()=>{paused=true;stop()});
  root.addEventListener("focusout",()=>{paused=false;schedule()});
  const io=new IntersectionObserver(entries=>{
    visible=entries.some(x=>x.isIntersecting&&x.intersectionRatio>.2);
    visible?schedule():stop();
  },{threshold:[0,.2,.5]});io.observe(root);
  window.addEventListener("hunt:shelves",e=>setShelves(e.detail));
  window.addEventListener("hunt:shelves-refreshed",e=>setShelves(e.detail));
  window.addEventListener("hunt:personalization-ready",()=>{if(Object.keys(shelves).length)setShelves({shelves})});
  window.addEventListener("hunt:country-changed",()=>{if(Object.keys(shelves).length)renderWorld(WORLDS[worldIndex])});
  window.addEventListener("hunt:experience-language",()=>{if(Object.keys(shelves).length)renderWorld(WORLDS[worldIndex])});
  window.addEventListener("boom:plan",event=>{
    const world=String(event.detail?.plan?.night_world||"");
    if(!WORLDS.includes(world)||!Object.keys(shelves).length)return;
    if(rowsFor(world).length<2)return;
    worldIndex=Math.max(0,WORLDS.indexOf(world));
    renderWorld(world);schedule();
  });
  if(window.HuntMarketShelves)setShelves(window.HuntMarketShelves);
})();