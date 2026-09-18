(() => {
  "use strict";

  const H=window.HuntCore;
  const Core=window.Hunt2037FlowCore;
  const Memory=window.HuntExperienceMemory;
  if(!H||!Core)return;

  const FLAG_KEY="hunt_2037_flow_enabled";
  const $=q=>document.querySelector(q);
  const clean=v=>String(v??"").trim();

  function enabled(){
    const url=new URL(location.href);
    if(url.searchParams.get("hunt2037")==="1")return true;
    if(url.searchParams.get("hunt2037")==="0")return false;
    return localStorage.getItem(FLAG_KEY)==="1";
  }

  function setFlag(on){
    localStorage.setItem(FLAG_KEY,on?"1":"0");
    return on;
  }

  function productUrl(item){
    return H.productUrl?.(item)||`product.html?provider=${encodeURIComponent(item.provider||"")}&id=${encodeURIComponent(item.item_id||"")}`;
  }

  function productCard(row){
    const item=row.item||{};
    const href=productUrl(item);
    const image=clean(item.image_url);
    const media=image.startsWith("https://")
      ? `<img src="${H.esc(image)}" alt="${H.esc(item.title||"Product")}" loading="lazy">`
      : `<div class="hunt2037-placeholder" aria-hidden="true">H</div>`;
    const amount=Number(item.retail_price_amount);
    const verified=item.retail_price_verified===true&&Number.isFinite(amount)&&amount>0;
    const price=verified?H.money(amount,item.retail_currency||item.currency||"USD"):"Verify on product";
    return `<article class="hunt2037-product hd-wow-product" data-category="${H.esc(item.category||item._shelf_slug||"")}">
      <a class="hunt2037-product-media hd-wow-product-media" href="${H.esc(href)}">
        ${media}<span>${H.esc(Core.laneLabel(row.lane))}</span>
      </a>
      <div class="hunt2037-product-body hd-wow-product-body">
        <small>${H.esc(item.provider||"CATALOG")}</small>
        <a href="${H.esc(href)}">${H.esc(item.title||"Product")}</a>
        <div class="hunt2037-price"><strong>${H.esc(price)}</strong><em>${verified?"HUNT retail":"live recheck"}</em></div>
        <small class="hunt2037-why">Why this: ${H.esc(row.reason||Core.reasonFor?.(item,row.lane,{})||"Discovery pick")}</small>
        <button class="hunt2037-share" type="button" data-hunt2037-share data-share-url="${H.esc(href)}" data-provider="${H.esc(item.provider||"")}" data-item-id="${H.esc(item.item_id||"")}" data-category="${H.esc(item.category||item._shelf_slug||"")}">Share</button>
      </div>
    </article>`;
  }

  function worldSection(world,index){
    return `<section class="hunt2037-world" data-world="${H.esc(world.id)}">
      <div class="hunt2037-world-head">
        <div><small>HUNT WORLD ${String(index+1).padStart(2,"0")}</small><h2>${H.esc(world.title)}</h2><p>${H.esc(world.copy)}</p></div>
        <button class="hunt2037-world-enter" type="button" data-world-enter="${H.esc(world.id)}" aria-pressed="false">Enter world</button>
      </div>
      <div class="hunt2037-track" role="list">${world.products.map(productCard).join("")}</div>
    </section>`;
  }

  function recentSection(shelves,context){
    const keys=context.recent_product_keys||[];
    if(!keys.length)return "";
    const all=Core.uniqueProducts(shelves);
    const rows=[];
    for(const key of keys){
      const parts=String(key).split(":");
      const prefix=(parts[0]||"").toLowerCase()+":"+(parts[1]||"");
      const item=all.find(x=>String(x.provider||"").toLowerCase()+":"+String(x.item_id||"")===prefix);
      if(item&&!rows.some(r=>String(r.item.item_id)===String(item.item_id)))rows.push({item,lane:"personalized",score:100});
      if(rows.length>=10)break;
    }
    if(!rows.length)return "";
    return `<section class="hunt2037-lane hunt2037-recent" data-lane="recent"><div class="hunt2037-lane-head"><small>HUNT MEMORY</small><h3>Recently explored</h3></div><div class="hunt2037-track" role="list">${rows.map(productCard).join("")}</div></section>`;
  }

  function laneSection(unit){
    return `<section class="hunt2037-lane" data-lane="${H.esc(unit.lane)}">
      <div class="hunt2037-lane-head"><small>BOOM DISCOVERY</small><h3>${H.esc(unit.title)}</h3></div>
      <div class="hunt2037-track" role="list">${unit.products.map(productCard).join("")}</div>
    </section>`;
  }

  function render(data){
    if(!enabled())return;
    const root=$("#hunt-2037-flow");
    if(!root)return;
    const shelves=data?.shelves||{};
    const context=Memory?.decisionContext?.()||{};
    const model=Core.buildUnits({shelves,context,sessionSeed:String(Date.now()).slice(0,8)});
    if(!model.total_products)return;

    document.body.classList.add("hunt2037-active");
    root.hidden=false;
    root.innerHTML=`
      <section class="hunt2037-intro">
        <div><small>HUNT 2037 ALPHA</small><h1>Shopping that keeps changing with you.</h1><p>Dynamic worlds, real catalog products, memory-aware discovery.</p><div class="hunt2037-alpha-links"><a class="hunt2037-mirror-link" href="history.html?hunt2037=1">Open HUNT History</a><a class="hunt2037-mirror-link" href="stylist.html?hunt2037=1">Open BOOM Stylist</a><a class="hunt2037-mirror-link" href="mirror.html?hunt2037=1">Open BOOM Mirror</a></div></div>
        <div class="hunt2037-stats"><span><b>${model.worlds.length}</b> WORLDS</span><span><b>DYNAMIC</b> CATALOG</span></div>
      </section>
      <div class="hunt2037-world-mode-bar" id="hunt2037-world-mode-bar" hidden><div><small>ACTIVE WORLD</small><strong id="hunt2037-active-world-title">HUNT World</strong></div><div class="hunt2037-world-mode-actions"><a id="hunt2037-style-world" href="stylist.html?hunt2037=1">Style this world</a><button type="button" data-world-exit>Back to all worlds</button></div></div>
      ${recentSection(shelves,context)}
      ${model.worlds.slice(0,3).map(worldSection).join("")}
      <section class="hunt2037-discovery">
        <div class="hunt2037-discovery-head"><small>DISCOVERY ENGINE</small><h2>Keep moving.</h2></div>
        ${model.units.map(laneSection).join("")}
      </section>`;
    window.HuntShoppingActions?.rescan?.();
  }

  function setWorldMode(worldId){
    const root=$("#hunt-2037-flow");
    const bar=$("#hunt2037-world-mode-bar");
    const title=$("#hunt2037-active-world-title");
    const styleLink=$("#hunt2037-style-world");
    const world=Core.WORLDS.find(x=>x.id===worldId)||null;
    if(!root)return;
    root.dataset.activeWorld=world?.id||"";
    document.body.classList.toggle("hunt2037-world-mode",Boolean(world));
    root.querySelectorAll(".hunt2037-world").forEach(section=>section.classList.toggle("hunt2037-world-selected",Boolean(world&&section.dataset.world===world.id)));
    root.querySelectorAll("[data-world-enter]").forEach(btn=>btn.setAttribute("aria-pressed",String(Boolean(world&&btn.dataset.worldEnter===world.id))));
    if(bar)bar.hidden=!world;
    if(title)title.textContent=world?.title||"HUNT World";
    if(styleLink){
      const q=new URLSearchParams({hunt2037:"1",world:world?.id||"",occasion:world?.id==="travel"?"travel":"everyday"});
      styleLink.href="stylist.html?"+q.toString();
    }
    window.dispatchEvent(new CustomEvent("hunt:world-mode",{detail:{active:Boolean(world),world:world?.id||"",title:world?.title||""}}));
  }

  document.addEventListener("click",async event=>{
    const share=event.target.closest?.("[data-hunt2037-share]");
    if(share){
      event.preventDefault();
      event.stopPropagation();
      const href=new URL(share.dataset.shareUrl||"./",location.href).href;
      const payload={title:"HUNT",text:"Look what I found on HUNT",url:href};
      try{
        if(navigator.share)await navigator.share(payload);
        else if(navigator.clipboard)await navigator.clipboard.writeText(href);
        const shareDetail={url:href,provider:share.dataset.provider||"",item_id:share.dataset.itemId||"",category:share.dataset.category||"",source:"hunt2037-flow"};
        Memory?.record?.({type:"share",...shareDetail});
        window.dispatchEvent(new CustomEvent("hunt:share",{detail:shareDetail}));
      }catch{}
      return;
    }

    const exit=event.target.closest?.("[data-world-exit]");
    if(exit){
      setWorldMode("");
      document.querySelector(".hunt2037-intro")?.scrollIntoView({behavior:"smooth",block:"start"});
      return;
    }

    const enter=event.target.closest?.("[data-world-enter]");
    if(enter){
      const world=clean(enter.dataset.worldEnter);
      setWorldMode(world);
      Memory?.record?.({type:"world_enter",world,source:"hunt2037-flow"});
      document.querySelector(`[data-world="${CSS.escape(world)}"]`)?.scrollIntoView({behavior:"smooth",block:"start"});
      return;
    }

    const card=event.target.closest?.(".hunt2037-product");
    if(card&&event.target.closest?.("a[href*='product.html']")){
      const link=event.target.closest("a[href*='product.html']");
      try{
        const u=new URL(link.href,location.href);
        Memory?.record?.({
          type:"product_view",
          provider:u.searchParams.get("provider")||"",
          item_id:u.searchParams.get("id")||u.searchParams.get("product_id")||"",
          category:card.dataset.category||"",
          title:card.querySelector(".hunt2037-product-body>a")?.textContent?.trim()||"",
          image_url:card.querySelector("img")?.src||"",
          url:link.href,
          source:"hunt2037-flow"
        });
      }catch{}
    }
  });

  window.Hunt2037Flow=Object.freeze({enabled,setFlag,render,setWorldMode});

  if(enabled()){
    window.addEventListener("hunt:shelves",event=>render(event.detail));
    if(window.HuntMarketShelves)render(window.HuntMarketShelves);
  }
})();
