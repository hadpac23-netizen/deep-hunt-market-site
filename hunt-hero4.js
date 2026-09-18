(() => {
  const H=window.HuntCore;
  const root=document.querySelector("#hunt-hero4");
  if(!root||!H)return;
  const $=q=>root.querySelector(q);
  const stateKey="hunt_hero4_promo_dismissed_v1";
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const video=$("#hd-hero4-video");
  const promo=$("#hd-hero4-promo"), peek=$("#hd-hero4-peek"), status=$("#hd-hero4-status");
  const close=$("#hd-hero4-promo-close"), prev=$("#hd-hero4-prev"), next=$("#hd-hero4-next");
  let items=[],index=0,timer=null,paused=false;
  const esc=v=>H.esc(String(v??""));

  function unique(rows){const seen=new Set();return (rows||[]).filter(x=>{const k=(x?.provider||"")+":"+(x?.item_id||"");if(!x?.item_id||seen.has(k))return false;seen.add(k);return true})}
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

  function render(){
    if(!items.length)return;
    index=(index+items.length)%items.length;
    const x=items[index];
    const media=$("#hd-hero4-promo-media");
    media.innerHTML=safeImage(x.item)?'<img src="'+esc(safeImage(x.item))+'" alt="'+esc(title(x.item))+'">':"";
    $("#hd-hero4-promo-eyebrow").textContent=x.eyebrow;
    $("#hd-hero4-promo-title").textContent=x.title;
    $("#hd-hero4-promo-copy").textContent=x.copy;
    const cta=$("#hd-hero4-promo-cta");cta.textContent=x.cta+" →";cta.href=x.href;
    $("#hd-hero4-promo-position").textContent=(index+1)+" / "+items.length;
    $("#hd-hero4-peek-text").textContent=x.eyebrow==="FOR YOU"?"A new pick for you":"Something new in HUNT";
  }

  function setState(name){
    root.dataset.promoState=name;
    const expanded=name==="open"||name==="feature";
    status?.setAttribute("aria-expanded",String(expanded));peek?.setAttribute("aria-expanded",String(expanded));
  }
  function stop(){if(timer){clearTimeout(timer);timer=null}}
  function later(fn,ms){stop();if(reduce||paused)return;timer=setTimeout(fn,ms)}
  function cycle(){
    if(sessionStorage.getItem(stateKey)==="1"){setState("idle");return}
    setState("idle");
    later(()=>{setState("peek");later(()=>{setState("open");later(()=>{
      setState("collapse");later(()=>{setState("hide");index=(index+1)%Math.max(items.length,1);render();later(cycle,2600)},700)
    },5600)},1700)},2600);
  }
  function openNow(){stop();setState("open")}
  function dismiss(){stop();setState("hide");sessionStorage.setItem(stateKey,"1");setTimeout(()=>setState("idle"),450)}
  function manual(delta){stop();index=(index+delta+items.length)%items.length;render();setState("open")}

  [promo,status,peek].filter(Boolean).forEach(el=>{
    el.addEventListener("mouseenter",()=>{paused=true;stop()});
    el.addEventListener("mouseleave",()=>{paused=false;if(root.dataset.promoState==="open")later(cycle,6500)});
    el.addEventListener("focusin",()=>{paused=true;stop()});
    el.addEventListener("focusout",()=>{paused=false});
  });
  status?.addEventListener("click",openNow);peek?.addEventListener("click",openNow);close?.addEventListener("click",dismiss);
  prev?.addEventListener("click",()=>manual(-1));next?.addEventListener("click",()=>manual(1));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&(root.dataset.promoState==="open"||root.dataset.promoState==="feature"))dismiss()});

  const observer=new IntersectionObserver(entries=>{
    const visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>.18);
    if(!video||reduce)return;
    if(visible)video.play().catch(()=>{});else video.pause();
  },{threshold:[0,.18,.5]});
  observer.observe(root);
  if(reduce)video?.pause();

  function init(data){
    items=buildItems(data?.shelves||{});
    if(!items.length)return;
    render();
    $("#hd-hero4-status-text").textContent=Object.keys(H.signals?.()||{}).length?"HUNT updated your edit":"HUNT is curating your next edit";
    if(sessionStorage.getItem(stateKey)!=="1")cycle();
  }
  window.addEventListener("hunt:shelves",e=>init(e.detail));
  if(window.HuntMarketShelves)init(window.HuntMarketShelves);
})();