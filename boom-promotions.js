(() => {
  const H=window.HuntCore;
  if(!H)return;
  const sb=window.supabase;
  const client=window.HuntSupabaseClient || (sb?.createClient
    ? sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey)
    : null);
  if(client&&!window.HuntSupabaseClient)window.HuntSupabaseClient=client;

  let lastData=null;

  function unique(rows){
    const out=[],seen=new Set();
    for(const item of rows||[]){
      const k=`${item?.provider||""}:${item?.item_id||""}`;
      if(!item?.item_id||seen.has(k))continue;
      seen.add(k); out.push(item);
    }
    return out;
  }

  function flat(shelves,slugs=null){
    const keys=Array.isArray(slugs)?slugs:Object.keys(shelves||{});
    return unique(keys.flatMap(slug=>Array.isArray(shelves?.[slug])?shelves[slug].map(x=>({...x,_slug:slug})):[]));
  }

  function preferredSlugs(){
    const signals=Object.entries(H.signals?.()||{})
      .filter(([slug,score])=>H.categoryDefs?.[slug]&&Number(score)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1]))
      .map(([slug])=>slug)
      .slice(0,5);
    return signals.length?signals:["women","men","home","beauty","tech","kids","travel"];
  }

  function priced(items,max){
    return items.filter(x=>{
      const n=Number(x?.price_amount);
      const basis=String(x?.price_basis||"").toUpperCase();
      return basis==="MERCHANT_RETAIL"&&String(x?.currency||"USD").toUpperCase()==="USD"&&Number.isFinite(n)&&n>0&&n<=max;
    });
  }

  function money(item){
    const n=Number(item?.price_amount);
    return Number.isFinite(n)&&n>0?H.money(n,item.currency||"USD"):"View product";
  }

  function priceBasis(item){
    const basis=String(item?.price_basis||"").toUpperCase();
    if(basis==="MERCHANT_RETAIL")return "Retail price";
    if(basis==="SUPPLIER_BASE")return "Supplier price";
    return "Current catalog price";
  }

  function productCard(item){
    const href=H.productUrl(item);
    const image=typeof item.image_url==="string"&&item.image_url.startsWith("https://")
      ? `<img src="${H.esc(item.image_url)}" alt="${H.esc(item.title||"Product")}" loading="lazy">`
      : '<div class="hd-promo-placeholder">H</div>';
    return `<article class="hd-promo-product">
      <a class="hd-promo-product-media" href="${H.esc(href)}">${image}</a>
      <div class="hd-promo-product-body">
        <a href="${H.esc(href)}">${H.esc(item.title||"Product")}</a>
        <strong>${H.esc(money(item))}</strong>
        <small>${H.esc(priceBasis(item))}</small>
      </div>
    </article>`;
  }
  async function rotationPlan(){
    let country="";
    try{country=String(localStorage.getItem("hunt_destination_market_v1")||"").toUpperCase()}catch{}
    try{
      const url=new URL((H.functionsBase||"https://zszlnahjqmwozwubetkm.supabase.co/functions/v1")+"/hunt-campaign-rotation");
      if(country)url.searchParams.set("country",country);
      const res=await fetch(url,{cache:"no-store"});
      const data=await res.json();
      if(res.ok&&Array.isArray(data?.themes))return data;
    }catch{}
    return {enabled:false,country,themes:["for-you","home","tech","beauty"]};
  }

  function editorialPromos(shelves){
    const all=flat(shelves);
    const preferred=flat(shelves,preferredSlugs()).slice(0,10);

    const thresholds=[20,25,30,40,50,75];
    let under=null;
    for(const limit of thresholds){
      const picks=priced(all,limit);
      if(picks.length>=8){under={limit,picks:picks.slice(0,10)};break;}
    }

    const candidates=[
      {
        key:"for-you",
        badge:"BOOM FOR YOU",
        title:"A HUNT edit built around what you browse",
        subtitle:"Real products selected from the categories you interact with most.",
        items:preferred
      },
      {
        key:"beauty",
        badge:"HUNT EDIT",
        title:"Beauty worth a closer look",
        subtitle:"A clean beauty edit from the live catalog — no fake discount claims.",
        items:flat(shelves,["beauty","perfume"]).slice(0,10)
      },
      {
        key:"home",
        badge:"HUNT EDIT",
        title:"Refresh the home",
        subtitle:"Home, kitchen and storage picks grouped into one easier shopping edit.",
        items:flat(shelves,["home","kitchen","storage","bedding","bath","lighting"]).slice(0,10)
      },
      {
        key:"tech",
        badge:"HUNT EDIT",
        title:"Useful tech, easier to scan",
        subtitle:"Phone, gaming and everyday tech picks from the current catalog.",
        items:flat(shelves,["tech","phoneaccessories","gaming","office"]).slice(0,10)
      },
      {
        key:"sports",
        badge:"BOOM ACTIVE EDIT",
        title:"Move, train, get outside",
        subtitle:"Fitness, cycling and outdoor picks rotated from the live catalog.",
        items:flat(shelves,["fitness","fitness-accessories","active-bottoms","sports-gear","cycling","outdoors"]).slice(0,10)
      },
      {
        key:"travel",
        badge:"BOOM TRAVEL EDIT",
        title:"Ready for the next trip",
        subtitle:"Travel, luggage and useful carry picks selected from live HUNT shelves.",
        items:flat(shelves,["travel","luggage","bags"]).slice(0,10)
      },
      {
        key:"kids",
        badge:"BOOM FAMILY EDIT",
        title:"Kids & baby picks",
        subtitle:"A rotating edit across clothing, shoes, accessories and toys.",
        items:flat(shelves,["kids","kids-clothing","kids-shoes","kids-accessories","baby","baby-clothing","baby-shoes","toys"]).slice(0,10)
      }
    ];
    if(under)candidates.splice(1,0,{
      key:"under",
      badge:"REAL PRICE EDIT",
      title:`Good finds under ${H.money(under.limit,"USD")}`,
      subtitle:"Current catalog prices only. No crossed-out prices or invented savings.",
      items:under.picks
    });

    return candidates.filter(x=>x.items.length>=4);
  }

  async function liveVerifiedDeals(){
    try{
      const res=await fetch((H.functionsBase||"https://zszlnahjqmwozwubetkm.supabase.co/functions/v1")+"/hunt-deal-engine",{cache:"no-store"});
      const data=await res.json();
      if(!res.ok||!Array.isArray(data?.deals))return [];
      return data.deals.map(deal=>({
        ...deal,
        items:[{
          provider:deal.provider,
          item_id:deal.item_id,
          title:deal.title_snapshot||"Verified deal",
          image_url:null,
          price_amount:deal.current_price,
          currency:deal.currency||"USD"
        }]
      }));
    }catch{return [];}
  }

  async function liveSponsored(){
    if(!client)return [];
    const {data:campaigns,error}=await client.from("hunt_promotion_campaigns")
      .select("id,title,subtitle,badge,placement,category_slug,audience_mode,audience_value,sponsored,disclosure,status,starts_at,ends_at")
      .eq("status","live")
      .eq("sponsored",true)
      .in("placement",["home_feature","home_strip","sponsored_collection"])
      .limit(12);
    if(error||!campaigns?.length)return [];

    const ids=campaigns.map(x=>x.id);
    const {data:items}=await client.from("hunt_promotion_items")
      .select("campaign_id,provider,item_id,title_snapshot,image_url_snapshot,price_amount_snapshot,currency,rank")
      .in("campaign_id",ids)
      .order("rank",{ascending:true});

    const grouped=new Map();
    for(const item of items||[]){
      if(!grouped.has(item.campaign_id))grouped.set(item.campaign_id,[]);
      grouped.get(item.campaign_id).push({
        provider:item.provider,item_id:item.item_id,title:item.title_snapshot,
        image_url:item.image_url_snapshot,price_amount:item.price_amount_snapshot,
        currency:item.currency||"USD"
      });
    }
    return campaigns.map(c=>({...c,items:grouped.get(c.id)||[]})).filter(c=>c.items.length);
  }
  function promoBlock(promo,{sponsored=false}={}){
    const disclosure=sponsored
      ? `<p class="hd-promo-disclosure">${H.esc(promo.disclosure||"Sponsored placement.")}</p>`
      : "";
    return `<section class="hd-promo-block ${sponsored?"sponsored":""}">
      <div class="hd-promo-copy">
        <small>${H.esc(sponsored?"SPONSORED":promo.badge||"HUNT EDIT")}</small>
        <h3>${H.esc(promo.title||"HUNT Edit")}</h3>
        <p>${H.esc(promo.subtitle||"")}</p>
        ${disclosure}
      </div>
      <div class="hd-promo-track" role="list">${(promo.items||[]).slice(0,10).map(productCard).join("")}</div>
    </section>`;
  }

  async function render(data){
    lastData=data;
    const shelves=data?.shelves||{};
    if(!Object.keys(shelves).length)return;

    let host=document.querySelector("#hd-boom-promotions");
    if(!host){
      host=document.createElement("section");
      host.id="hd-boom-promotions";
      host.className="hd-boom-promotions";
      const anchor=document.querySelector("#deals") || document.querySelector("#shop");
      if(anchor)anchor.after(host);
      else document.querySelector("main")?.append(host);
    }

    const editorialAll=editorialPromos(shelves);
    const [sponsored,deals,rotation]=await Promise.all([liveSponsored(),liveVerifiedDeals(),rotationPlan()]);
    const chosen=sponsored.length?sponsored.slice(0,1):[];
    const byKey=new Map(editorialAll.map(x=>[x.key,x]));
    const editorial=[];
    for(const key of rotation.themes||[]){
      const item=byKey.get(key);
      if(item&&!editorial.includes(item))editorial.push(item);
    }
    const under=byKey.get("under");
    if(under&&!editorial.includes(under))editorial.splice(Math.min(1,editorial.length),0,under);
    for(const item of editorialAll){
      if(!editorial.includes(item))editorial.push(item);
    }
    const dealBlocks=deals.slice(0,1).map(deal=>`<section class="hd-promo-block verified-deal">
      <div class="hd-promo-copy">
        <small>VERIFIED PRICE DROP</small>
        <h3>${H.esc(deal.title_snapshot||"Verified HUNT deal")}</h3>
        <p>${H.esc(String(deal.discount_percent||0))}% verified drop · reference ${H.esc(H.money(Number(deal.reference_price||0),deal.currency||"USD"))} · now ${H.esc(H.money(Number(deal.current_price||0),deal.currency||"USD"))}</p>
        <p class="hd-promo-disclosure">Verified price history + Profit Gate + owner approval.</p>
      </div>
      <div class="hd-promo-track" role="list">${deal.items.map(productCard).join("")}</div>
    </section>`);
    const blocks=[
      ...dealBlocks,
      ...chosen.map(x=>promoBlock(x,{sponsored:true})),
      ...editorial.map(x=>promoBlock(x))
    ].slice(0,3);

    host.innerHTML=`
      <div class="hd-promo-head">
        <div><small>BOOM PROMOTION STUDIO</small><h2>Offers made to fit the shopper — not shout at them.</h2>
        <p>Personalized edits use real catalog data. Sponsored placements are always labeled. Daily rotation: ${H.esc(rotation?.season||"live")}${rotation?.country?" · "+H.esc(rotation.country):""}.</p></div>
        <a href="sell.html">Advertise on HUNT →</a>
      </div>
      ${blocks.join("")}`;
  }

  window.addEventListener("hunt:shelves",event=>render(event.detail));
  window.addEventListener("hunt:shopping-action",()=>lastData&&render(lastData));
  if(window.HuntMarketShelves)render(window.HuntMarketShelves);
})();