(() => {
  const pulse=document.querySelector("#hd-product-pulse");
  const endless=document.querySelector("#hd-endless-discovery");
  if(!pulse||!endless)return;
  const close=pulse.querySelector("[data-product-pulse-close]");
  const media=pulse.querySelector("[data-product-pulse-media]");
  const title=pulse.querySelector("[data-product-pulse-title]");
  const link=pulse.querySelector("[data-product-pulse-link]");
  const dismissedKey="hunt_product_pulse_dismissed_v1";
  let dismissed=false,hasRelated=false,impressionSent=false;

  try{dismissed=sessionStorage.getItem(dismissedKey)==="1"}catch{}
  const hide=()=>pulse.classList.remove("is-visible");
  const show=()=>{
    if(dismissed)return;
    const er=endless.getBoundingClientRect();
    const nearEnd=er.top<window.innerHeight*.88;
    const enough=window.scrollY>Math.min(360,window.innerHeight*.32);
    const visible=enough&&!nearEnd&&hasRelated;
    pulse.classList.toggle("is-visible",visible);
    if(visible&&!impressionSent){
      impressionSent=true;
      window.HuntAnalytics?.experience?.("product_pulse_impression",{related:true});
    }
  };

  function syncRelated(){
    const card=document.querySelector("#hd-endless-grid .hd-shelf-card");
    if(!card)return;
    const img=card.querySelector("img"),a=card.querySelector("a[href*='product.html']");
    const label=card.querySelector(".hd-shelf-title,.hd-market-card-title,a[href*='product.html']");
    if(img&&media){
      media.src=img.currentSrc||img.src||"";
      media.alt=img.alt||"Related product";
      media.hidden=!media.src;
    }
    if(title&&label)title.textContent=(label.textContent||"").trim().slice(0,72);
    if(link&&a)link.href=a.href;
    hasRelated=Boolean(a);
    show();
  }

  const mo=new MutationObserver(syncRelated);
  const grid=document.querySelector("#hd-endless-grid");
  if(grid)mo.observe(grid,{childList:true,subtree:true});
  syncRelated();

  close?.addEventListener("click",()=>{
    dismissed=true;hide();
    try{sessionStorage.setItem(dismissedKey,"1")}catch{}
  });
  link?.addEventListener("click",()=>{
    window.HuntAnalytics?.experience?.("product_pulse_click",{related:hasRelated});
    if((link.getAttribute("href")||"").startsWith("#")) endless.scrollIntoView({behavior:"smooth",block:"start"});
  });
  addEventListener("scroll",show,{passive:true});
  addEventListener("resize",show,{passive:true});
  show();
})();