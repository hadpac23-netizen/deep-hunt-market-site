(() => {
  "use strict";
  const clean=(v,max=180)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const money=(v,c="USD")=>Number.isFinite(Number(v))?new Intl.NumberFormat("en",{style:"currency",currency:c}).format(Number(v)):"";
  function draftsForDeal(row={}){
    if(!row?.boom?.eligibleForPromotion)return [];
    const title=clean(row.title_snapshot||row.item_id||"HUNT find",180);
    const verified=/verified|truth|confirmed/i.test(String(row.truth_status||""));
    const discount=Number(row.discount_percent||0);
    const price=money(row.current_price,row.currency||"USD");
    const valueLine=verified&&discount>0
      ? discount.toFixed(0)+"% verified price drop"+(price?" · "+price:"")
      : (price?"Current verified price "+price:"Verified HUNT product");
    const base={provider:clean(row.provider,80),itemId:clean(row.item_id,180),verifiedProductRelation:true};
    return [
      {...base,channel:"organic_social",format:"9:16",hook:"A HUNT find worth a closer look",headline:title,body:valueLine+". See product details, variants and shipping checks on HUNT.",cta:"See the HUNT find"},
      {...base,channel:"pinterest",format:"2:3",hook:"Save this HUNT find",headline:title,body:valueLine+". Product facts stay visible before checkout.",cta:"View product"},
      {...base,channel:"seo",format:"search_copy",hook:"",headline:title+" | HUNT",body:"Explore "+title+" on HUNT with source, product details and verified deal evidence when available.",cta:"Explore"},
      {...base,channel:"onsite",format:"onsite_card",hook:"BOOM PICK",headline:title,body:valueLine,cta:"View details"}
    ].map(x=>Object.freeze(x));
  }
  const api=Object.freeze({draftsForDeal});
  if(typeof window!=="undefined")window.BoomCreativeBrain=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();