(() => {
  "use strict";

  const PREFIX="hunt_browse_position_v1:";
  const MAX_AGE_MS=30*60*1000;
  const key=PREFIX+location.pathname+location.search;

  function ensureReturnAnchorStyle(){
    if(document.getElementById("hunt-browse-continuity-style"))return;
    const style=document.createElement("style");
    style.id="hunt-browse-continuity-style";
    style.textContent='[data-hunt-return-anchor="true"]{outline:2px solid var(--shop-accent,#5b7cff);outline-offset:3px;transition:outline-color .2s ease}[data-hunt-return-anchor="true"] .hd-market-card-media{filter:saturate(1.03)}@media(prefers-reduced-motion:reduce){[data-hunt-return-anchor="true"]{transition:none}}';
    document.head.appendChild(style);
  }

  function read(){
    try{
      const value=JSON.parse(sessionStorage.getItem(key)||"null");
      if(!value||!Number.isFinite(Number(value.y)))return null;
      if(Date.now()-Number(value.saved_at||0)>MAX_AGE_MS)return null;
      return value;
    }catch{return null;}
  }

  function save(link){
    try{
      const rect=link?.getBoundingClientRect?.();
      sessionStorage.setItem(key,JSON.stringify({
        y:Math.max(0,Math.round(window.scrollY||0)),
        saved_at:Date.now(),
        product_href:String(link?.href||"").slice(0,600),
        viewport_top:Number.isFinite(rect?.top)?Math.round(rect.top):null,
        current_floor:document.body.dataset.huntCurrentFloor||""
      }));
    }catch{}
  }

  function isProductLink(link){
    if(!link)return false;
    try{
      const url=new URL(link.href,location.href);
      return url.origin===location.origin&&/\/product\.html$/.test(url.pathname);
    }catch{return false;}
  }

  document.addEventListener("click",event=>{
    const link=event.target.closest?.("a[href]");
    if(isProductLink(link))save(link);
  },true);

  function navigationType(){
    return performance.getEntriesByType?.("navigation")?.[0]?.type||"";
  }

  function matchingProductLink(saved){
    if(!saved?.product_href)return null;
    const floor=saved.current_floor?document.getElementById(saved.current_floor):null;
    const candidates=floor?[...floor.querySelectorAll("a[href]")]:[...document.querySelectorAll("a[href]")];
    const match=candidates.find(link=>{
      try{return new URL(link.href,location.href).href===saved.product_href;}
      catch{return false;}
    });
    if(match)return match;
    if(floor){
      return [...document.querySelectorAll("a[href]")].find(link=>{
        try{return new URL(link.href,location.href).href===saved.product_href;}
        catch{return false;}
      })||null;
    }
    return null;
  }

  function restore(force=false){
    if(!force&&navigationType()!=="back_forward")return;
    const saved=read();
    if(!saved)return;

    let tries=0,stable=0;
    const attempt=()=>{
      tries+=1;
      const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
      let desired=Number(saved.y)||0;
      const anchor=matchingProductLink(saved);
      const viewportTop=Number(saved.viewport_top);

      if(anchor&&Number.isFinite(viewportTop)){
        const rect=anchor.getBoundingClientRect();
        desired=window.scrollY+rect.top-viewportTop;
      }

      const target=Math.max(0,Math.min(desired,maxY));
      const enoughHeight=maxY>=Math.max(0,target-80);

      if(enoughHeight&&Math.abs(window.scrollY-target)>35){
        window.scrollTo({top:target,left:0,behavior:"auto"});
      }

      const closeEnough=Math.abs(window.scrollY-target)<=45;
      stable=closeEnough?stable+1:0;

      if((stable>=2&&tries>=5)||tries>=16){
        if(anchor){
          ensureReturnAnchorStyle();
          const card=anchor.closest?.(".hd-home3-card,.hd-market-product-card");
          if(card){
            card.dataset.huntReturnAnchor="true";
            setTimeout(()=>{delete card.dataset.huntReturnAnchor;},1800);
          }
        }
        window.dispatchEvent(new CustomEvent("hunt:browse-position-restored",{detail:{
          y:Math.round(window.scrollY||0),
          requested_y:Number(saved.y)||0,
          anchored:Boolean(anchor),
          current_floor:saved.current_floor||""
        }}));
        return;
      }
      setTimeout(attempt,110+tries*40);
    };

    requestAnimationFrame(()=>requestAnimationFrame(attempt));
  }

  window.HuntBrowseContinuity=Object.freeze({save,restore,read});
  window.addEventListener("pageshow",event=>setTimeout(()=>restore(event.persisted===true),80));
})();
