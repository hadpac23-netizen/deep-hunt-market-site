(() => {
  const H=window.HuntCore;
  if(!H)return;
  const sb=window.supabase;
  const client=sb?.createClient
    ? sb.createClient("https://zszlnahjqmwozwubetkm.supabase.co",H.publishableKey)
    : null;

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
    return signals.length?signals:["women","men","home","beauty","perfume","tech","kids","travel"];
  }

  function priced(items,max){
    return items.filter(x=>{
      const n=Number(x?.price_amount);
      const basis=String(x?.price_basis||"").toUpperCase();
      return ["MERCHANT_RETAIL","MARKETPLACE_RETAIL"].includes(basis)&&String(x?.currency||"USD").toUpperCase()==="USD"&&Number.isFinite(n)&&n>0&&n<=max;
    });
  }

  function money(item){
    const n=Number(item?.price_amount);
    return Number.isFinite(n)&&n>0?H.money(n,item.currency||"USD"):"View product";
  }

  function priceBasis(item){
    const basis=String(item?.price_basis||"").toUpperCase();
    if(basis==="MERCHANT_RETAIL")return "Retail price";
    if(basis==="MARKETPLACE_RETAIL")return "Marketplace price";
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
  function firstDistinct(shelves, specs, limit=6){
    const out=[],seen=new Set();
    for(const spec of specs){
      const rows=flat(shelves,[spec.slug]).filter(item=>{
        const title=String(item?.title||"");
        const n=Number(item?.price_amount);
        return (!spec.pattern || spec.pattern.test(title)) &&
          typeof item?.image_url==="string" && item.image_url.startsWith("https://") &&
          Number.isFinite(n) && n>0;
      });
      for(const item of rows){
        const key=String(item?.provider||"")+":"+String(item?.item_id||"");
        if(seen.has(key))continue;
        seen.add(key);out.push(item);break;
      }
      if(out.length>=limit)break;
    }
    return out;
  }

  function smartSets(shelves){
    const complete=firstDistinct(shelves,[
      {slug:"bags"},{slug:"jewelry"},{slug:"accessories"},{slug:"shoes"}
    ],4);
    const phone=firstDistinct(shelves,[
      {slug:"phoneaccessories",pattern:/crossbody|shoulder strap|neck strap/i},
      {slug:"phoneaccessories",pattern:/wrist strap|wristband/i},
      {slug:"phoneaccessories",pattern:/kickstand|ring stand/i},
      {slug:"phoneaccessories",pattern:/magsafe|magnetic/i}
    ],4);
    return [
      complete.length>=3 ? {
        key:"complete-look",badge:"BOOM SMART SET",title:"Complete the look",
        subtitle:"A bag, jewelry and accessories that work together. Shop pieces individually; a bundle saving appears only when a supplier-funded price is verified.",
        items:complete
      } : null,
      phone.length>=3 ? {
        key:"phone-setup",badge:"BOOM SMART SET",title:"Build your phone setup",
        subtitle:"Carry, protect and stand options selected together. Choose only what you need; verified bundle pricing will appear when available.",
        items:phone
      } : null
    ].filter(Boolean);
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

    const perfumeInterest=Number(H.signals?.()?.perfume||0)>0;
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
        badge:perfumeInterest?"BOOM FRAGRANCE EDIT":"HUNT EDIT",
        title:perfumeInterest?"Fragrance & beauty matched to your recent search":"Beauty worth a closer look",
        subtitle:perfumeInterest?"Real perfume and beauty catalog items ranked from your current shopping signals.":"A clean beauty edit from the live catalog — no fake discount claims.",
        items:flat(shelves,perfumeInterest?["perfume","beauty"]:["beauty","perfume"]).slice(0,10)
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
      }
    ];
    if(under)candidates.splice(1,0,{
      key:"under",
      badge:"REAL PRICE EDIT",
      title:`Good finds under ${H.money(under.limit,"USD")}`,
      subtitle:"Current catalog prices only. No crossed-out prices or invented savings.",
      items:under.picks
    });

    return candidates.filter(x=>x.items.length>=4).slice(0,3);
  }

  async function liveVerifiedPriceDrops(shelves){
    if(!client)return [];
    const {data:rows,error}=await client.from("hunt_verified_deals")
      .select("*")
      .eq("status","approved")
      .order("verified_at",{ascending:false})
      .limit(12);
    if(error||!rows?.length)return [];
    const products=new Map(flat(shelves).map(item=>[
      String(item?.provider||"")+":"+String(item?.item_id||""),item
    ]));
    return rows.map(row=>{
      const current=Number(row.current_price);
      const reference=Number(row.reference_price);
      const verifiedAt=Date.parse(String(row.verified_at||""));
      if(!Number.isFinite(current)||current<=0||!Number.isFinite(reference)||reference<=current)return null;
      if(!String(row.source_url||"").startsWith("https://"))return null;
      if(!Number.isFinite(verifiedAt)||Date.now()-verifiedAt>7*24*60*60*1000)return null;
      const item=products.get(String(row.provider||"")+":"+String(row.item_id||""))||{
        provider:row.provider,item_id:row.item_id,title:row.title_snapshot,
        price_amount:current,currency:row.currency||"USD"
      };
      return {...row,item:{...item,price_amount:current,currency:row.currency||item.currency||"USD"},
        computed_percent:Math.round((1-current/reference)*1000)/10};
    }).filter(Boolean);
  }

  function verifiedPriceDropBlock(row){
    const current=H.money(Number(row.current_price),row.currency||"USD");
    const reference=H.money(Number(row.reference_price),row.currency||"USD");
    const when=row.verified_at?new Date(row.verified_at).toLocaleString():"";
    return '<section class="hd-promo-block verified-deal">'+
      '<div class="hd-promo-copy">'+
        '<small>VERIFIED PRICE DROP</small>'+
        '<h3>'+H.esc(row.title_snapshot||row.item?.title||"Verified deal")+'</h3>'+
        '<p>Current '+H.esc(current)+' · reference '+H.esc(reference)+
          (Number.isFinite(Number(row.computed_percent))?' · '+H.esc(String(row.computed_percent))+'% lower':'')+'.</p>'+
        '<p class="hd-promo-disclosure">Source-verified'+(when?' · '+H.esc(when):'')+'. Reference price is evidence-based, not an invented MSRP.</p>'+
      '</div>'+
      '<div class="hd-promo-track" role="list">'+productCard(row.item)+'</div>'+
    '</section>';
  }

  async function liveSponsored(){
    if(!client)return [];
    const {data:campaigns,error}=await client.from("hunt_promotion_campaigns")
      .select("*")
      .eq("status","live")
      .eq("sponsored",true)
      .in("placement",["home_feature","home_strip","sponsored_collection"])
      .limit(12);
    if(error||!campaigns?.length)return [];

    const ids=campaigns.map(x=>x.id);
    const {data:items}=await client.from("hunt_promotion_items")
      .select("*")
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

  async function liveVerifiedPromotions(){
    if(!client||!window.HuntPromotionTruth)return [];
    const {data:campaigns,error}=await client.from("hunt_promotion_campaigns")
      .select("*")
      .eq("status","live")
      .limit(24);
    if(error||!campaigns?.length)return [];
    const verified=campaigns.filter(c=>!c.sponsored&&window.HuntPromotionTruth.verified(c));
    if(!verified.length)return [];
    const ids=verified.map(x=>x.id);
    const {data:items}=await client.from("hunt_promotion_items")
      .select("*")
      .in("campaign_id",ids)
      .order("rank",{ascending:true});
    const grouped=new Map();
    for(const item of items||[]){
      if(!grouped.has(item.campaign_id))grouped.set(item.campaign_id,[]);
      grouped.get(item.campaign_id).push({
        provider:item.provider,item_id:item.item_id,title:item.title_snapshot,
        image_url:item.image_url_snapshot,price_amount:item.price_amount_snapshot,
        currency:item.currency||"USD",promotion_role:item.promotion_role||"featured"
      });
    }
    return verified.map(c=>({...c,items:grouped.get(c.id)||[]})).filter(c=>c.items.length);
  }

  function promoItemLimit(){
    return window.matchMedia?.("(max-width: 760px)")?.matches ? 4 : 6;
  }

  function promoBlockLimit(){
    return window.matchMedia?.("(max-width: 760px)")?.matches ? 2 : 3;
  }

  function dealBlock(promo){
    const truth=window.HuntPromotionTruth;
    const label=truth?.label?.(promo)||"VERIFIED DEAL";
    const eq=truth?.equivalentPercent?.(promo);
    const verification=promo.verified_at?new Date(promo.verified_at).toLocaleString():"";
    const coupon=promo.coupon_code?'<span class="hd-promo-code">Code: '+H.esc(promo.coupon_code)+'</span>':"";
    const value=Number.isFinite(Number(eq))?'<span>Equivalent same-item value: '+H.esc(Number(eq).toFixed(1))+'%</span>':"";
    const passport=window.HuntDealPassport?.html?.(promo)||"";
    return '<section class="hd-promo-block verified-deal">'+
      '<div class="hd-promo-copy">'+
        '<small>'+H.esc(label)+'</small>'+
        '<h3>'+H.esc(promo.title||label)+'</h3>'+
        '<p>'+H.esc(promo.subtitle||promo.terms_text||"Checkout-verified promotion.")+'</p>'+
        '<p class="hd-promo-disclosure">Verified at checkout'+(verification?' · '+H.esc(verification):'')+'.</p>'+
        '<div class="hd-promo-proof">'+coupon+value+'</div>'+
        passport+
      '</div>'+
      '<div class="hd-promo-track" role="list">'+(promo.items||[]).slice(0,promoItemLimit()).map(productCard).join("")+'</div>'+
    '</section>';
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
      <div class="hd-promo-track" role="list">${(promo.items||[]).slice(0,promoItemLimit()).map(productCard).join("")}</div>
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
      document.querySelector("#hd-wow-showcase")?.after(host);
      if(!host.isConnected)document.querySelector("#shop")?.before(host);
    }

    const editorial=editorialPromos(shelves);
    const sets=smartSets(shelves);
    const priceDrops=await liveVerifiedPriceDrops(shelves);
    const verifiedDeals=await liveVerifiedPromotions();
    const chess=window.HuntDealChess?.compare?.(verifiedDeals) || null;
    const rankedSingles=Array.isArray(chess?.ranked)
      ? chess.ranked.filter(row=>row?.kind==="single").map(row=>row.promos?.[0]).filter(Boolean)
      : [];
    const orderedVerified=rankedSingles.length
      ? [...rankedSingles,...verifiedDeals.filter(p=>!rankedSingles.includes(p))]
      : verifiedDeals;
    const chessCopy=chess?.winner
      ? '<div class="hd-deal-chess-summary"><small>DEAL CHESS · BEST VERIFIED MOVE</small><strong>'+H.esc(window.HuntDealChess.explain(chess))+'</strong><span>'+H.esc(chess.reason||"")+'</span></div>'
      : '';
    const sponsored=await liveSponsored();
    const chosen=sponsored.length?sponsored.slice(0,1):[];
    const blocks=[
      ...priceDrops.slice(0,2).map(verifiedPriceDropBlock),
      ...orderedVerified.slice(0,2).map(dealBlock),
      ...chosen.map(x=>promoBlock(x,{sponsored:true})),
      ...sets.slice(0,1).map(x=>promoBlock(x)),
      ...editorial.map(x=>promoBlock(x))
    ].slice(0,promoBlockLimit());

    host.innerHTML=`
      <div class="hd-promo-head">
        <div><small>HUNT DEALS · BOOM CURATION</small><h2>Good combinations. Real offers.</h2>
        <p>1+1, Buy X Get Y, bundles, coupons and shipping offers appear as deals only after checkout verification. Sponsored placements stay labeled.</p></div>
        <a href="sell.html">Advertise on HUNT →</a>
      </div>
      ${chessCopy}
      ${blocks.join("")}`;
  }

  window.addEventListener("hunt:shelves",event=>render(event.detail));
  window.addEventListener("hunt:shopping-action",()=>lastData&&render(lastData));
  window.addEventListener("hunt:search",()=>lastData&&render(lastData));
  if(window.HuntMarketShelves)render(window.HuntMarketShelves);
})();