(() => {
  "use strict";
  const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
  const KEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const clean=v=>String(v??"").trim();
  const n=v=>Number.isFinite(Number(v))?Number(v):null;

  function preferredCountry(){
    if(typeof localStorage!=="undefined"){
      for(const key of ["hunt_destination_country","hunt_country","country_code"]){
        const v=clean(localStorage.getItem(key)).toUpperCase();
        if(/^[A-Z]{2}$/.test(v))return v;
      }
    }
    return "US";
  }

  function selectVariant(product={}){
    const variants=Array.isArray(product.variants)?product.variants:[];
    const eligible=variants.filter(v=>
      clean(v?.variant_id) &&
      v?.availability_verified===true &&
      Number(v?.stock_quantity||0)>0 &&
      v?.retail_price_verified===true &&
      clean(v?.profit_gate_status).toUpperCase()==="PASS" &&
      Number(v?.price_amount||0)>0 &&
      Number(v?.retail_price_amount||0)>0
    );
    eligible.sort((a,b)=>
      Number(b?.stock_quantity||0)-Number(a?.stock_quantity||0) ||
      Number(a?.retail_price_amount||Infinity)-Number(b?.retail_price_amount||Infinity)
    );
    return eligible[0]||null;
  }

  function summarize(product={},variant={},quote={},country=""){
    const shipping=Array.isArray(quote?.shipping_options)?quote.shipping_options[0]:null;
    const supplierCost=n(variant?.price_amount);
    const retail=n(variant?.retail_price_amount);
    const shippingCost=n(shipping?.price_usd);
    const detailReady=
      clean(product?.provider).toLowerCase().includes("cj") &&
      clean(product?.item_id) &&
      clean(variant?.variant_id) &&
      variant?.availability_verified===true &&
      variant?.retail_price_verified===true &&
      clean(variant?.profit_gate_status).toUpperCase()==="PASS" &&
      quote?.stock_verified===true &&
      quote?.stock_available===true &&
      quote?.shipping_verified===true &&
      shippingCost!==null;

    return Object.freeze({
      status:detailReady?"DETAIL_SAMPLE_VERIFIED":"DETAIL_RECHECK_REQUIRED",
      generated_at:new Date().toISOString(),
      production_effect:false,
      source_data_mutated:false,
      source:"hunt-storefront + hunt-cj-quote",
      provider:clean(product?.provider),
      item_id:clean(product?.item_id),
      title:clean(product?.title),
      country_code:clean(country).toUpperCase(),
      variant_id:clean(variant?.variant_id),
      variant_title:clean(variant?.title),
      color:clean(variant?.color),
      size:clean(variant?.size),
      stock_quantity:n(variant?.stock_quantity),
      stock_verified:quote?.stock_verified===true,
      stock_available:quote?.stock_available===true,
      shipping_verified:quote?.shipping_verified===true,
      shipping_method:clean(shipping?.name),
      shipping_cost_usd:shippingCost,
      shipping_aging:clean(shipping?.aging),
      supplier_cost_usd:supplierCost,
      retail_price_usd:retail,
      retail_price_verified:variant?.retail_price_verified===true,
      profit_gate_status:clean(variant?.profit_gate_status).toUpperCase(),
      projected_product_profit:n(variant?.projected_product_profit),
      projected_product_margin:n(variant?.projected_product_margin),
      detail_truth_ready:detailReady,
      portfolio_truth_ready:false,
      decision_effect:"PRIORITY_DETAIL_EVIDENCE",
      gaps:Object.freeze(detailReady?[
        "This verifies one variant for one destination only.",
        "Portfolio-wide priority product coverage is still required before Product Truth can be fully READY."
      ]:[
        "Variant/stock/shipping/profit evidence is incomplete."
      ])
    });
  }

  async function getJson(url){
    const res=await fetch(url,{cache:"no-store",headers:{apikey:KEY,Accept:"application/json"}});
    const raw=await res.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch{data={error:raw||("HTTP_"+res.status)}}
    if(!res.ok)throw new Error(data?.error||("HTTP_"+res.status));
    return data;
  }

  async function verifyItem(itemId,country=preferredCountry()){
    const id=clean(itemId);
    const cc=clean(country).toUpperCase();
    if(!id)throw new Error("ITEM_ID_REQUIRED");
    if(!/^[A-Z]{2}$/.test(cc))throw new Error("COUNTRY_CODE_REQUIRED");

    const productUrl=new URL(BASE+"/hunt-storefront");
    productUrl.searchParams.set("provider","CJdropshipping");
    productUrl.searchParams.set("product_id",id);
    productUrl.searchParams.set("country_code",cc);
    const productBody=await getJson(productUrl.toString());
    const product=productBody?.product;
    if(!product)throw new Error("PRODUCT_RECHECK_FAILED");

    const variant=selectVariant(product);
    if(!variant)throw new Error("NO_VERIFIED_PROFITABLE_VARIANT");

    const quoteUrl=new URL(BASE+"/hunt-cj-quote");
    quoteUrl.searchParams.set("vid",variant.variant_id);
    quoteUrl.searchParams.set("country_code",cc);
    quoteUrl.searchParams.set("quantity","1");
    const quote=await getJson(quoteUrl.toString());

    return summarize(product,variant,quote,cc);
  }

  async function verifyFromDiscovery(opts={}){
    const discovery=window.DRAGON_PRODUCT_LIVE_REFRESH_STATE||window.DragonProductLiveRefresh?.readCached?.();
    const samples=Array.isArray(discovery?.sample_products)?discovery.sample_products:[];
    const chosen=samples.find(x=>clean(x?.item_id));
    if(!chosen)throw new Error("RUN_DISCOVERY_REFRESH_FIRST");
    return verifyItem(chosen.item_id,opts.country_code||preferredCountry());
  }

  async function runBrowser(opts={}){
    if(typeof window==="undefined")return null;
    const starting=Object.freeze({
      status:"VERIFYING",production_effect:false,source_data_mutated:false,
      country_code:clean(opts.country_code||preferredCountry()).toUpperCase()
    });
    window.DRAGON_PRODUCT_DETAIL_SHADOW_STATE=starting;
    window.dispatchEvent(new CustomEvent("dragon:product-detail-shadow",{detail:starting}));
    try{
      const result=await verifyFromDiscovery(opts);
      window.DRAGON_PRODUCT_DETAIL_SHADOW_STATE=result;
      try{sessionStorage.setItem("dragon_product_detail_shadow_v1",JSON.stringify(result));}catch{}
      window.dispatchEvent(new CustomEvent("dragon:product-detail-shadow",{detail:result}));
      return result;
    }catch(error){
      const blocked=Object.freeze({
        status:"BLOCKED",error:String(error?.message||error),
        production_effect:false,source_data_mutated:false,
        detail_truth_ready:false,portfolio_truth_ready:false,
        decision_effect:"NONE"
      });
      window.DRAGON_PRODUCT_DETAIL_SHADOW_STATE=blocked;
      window.dispatchEvent(new CustomEvent("dragon:product-detail-shadow",{detail:blocked}));
      return blocked;
    }
  }

  function readCached(){
    if(typeof sessionStorage==="undefined")return null;
    try{return JSON.parse(sessionStorage.getItem("dragon_product_detail_shadow_v1")||"null")}catch{return null}
  }

  const api=Object.freeze({preferredCountry,selectVariant,summarize,verifyItem,verifyFromDiscovery,runBrowser,readCached});
  if(typeof window!=="undefined"){
    window.DragonProductDetailShadow=api;
    const cached=readCached();
    if(cached){
      window.DRAGON_PRODUCT_DETAIL_SHADOW_STATE=cached;
      setTimeout(()=>window.dispatchEvent(new CustomEvent("dragon:product-detail-shadow",{detail:cached})),30);
    }
  }
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();