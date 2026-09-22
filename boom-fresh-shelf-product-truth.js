(() => {
  "use strict";
  if(window.BoomFreshShelfProductTruth?.version)return;
  const version="BOOM-FRESH-SHELF-PRODUCT-TRUTH-V1";
  const runtime=()=>window.BoomRuntime;
  const clean=v=>String(v??"").trim();
  const allowedShelfMarket=new Set(["recheck_before_checkout","eligible","allowed"]);
  const readyMarket=new Set(["eligible","allowed"]);
  const truthy=v=>v===true||String(v).toLowerCase()==="true";
  const recent=(ts,hours)=>{const n=Date.parse(ts||"");return Number.isFinite(n)&&Date.now()-n<=hours*3600000&&Date.now()>=n;};

  function evaluateProduct(product={},observations=[],country="IL",hours=24){
    const obs=(observations||[]).filter(x=>clean(x.provider)===clean(product.provider)&&clean(x.item_id)===clean(product.item_id)&&recent(x.observed_at,hours));
    const price=obs.find(x=>x.observation_type==="price"&&x.availability_verified===true&&Number(x.price_amount)>0&&truthy(x.payload?.retail_verified)&&clean(x.payload?.profit_gate_status).toUpperCase()==="PASS");
    const stock=obs.find(x=>x.observation_type==="stock"&&x.availability_verified===true&&truthy(x.payload?.stock_verified)&&truthy(x.payload?.stock_available));
    const shipping=obs.find(x=>x.observation_type==="shipping"&&x.availability_verified===true&&clean(x.destination_country).toUpperCase()===clean(country).toUpperCase()&&Number.isFinite(Number(x.shipping_amount))&&truthy(x.payload?.shipping_verified));
    const market=clean(product.market_eligibility_status).toLowerCase();
    const base=product.availability_verified===true&&Number(product.price_amount)>0&&clean(product.image_url)!==""&&allowedShelfMarket.has(market);
    const shelf=Boolean(base&&price&&stock&&shipping);
    return {
      provider:product.provider||null,item_id:product.item_id||null,category:product.category||null,
      state:shelf?(readyMarket.has(market)?"FRESH_SHELF_VERIFIED":"CHECKOUT_RECHECK_REQUIRED"):"STALE_OR_UNVERIFIED",
      fresh_shelf_verified:shelf,
      checkout_live_verified:false,
      market_status:market||null,
      evidence:{
        price:Boolean(price),stock:Boolean(stock),shipping:Boolean(shipping),
        newest:[price?.observed_at,stock?.observed_at,shipping?.observed_at].filter(Boolean).sort().pop()||null
      },
      first_blocker:!base?"CATALOG_BASE_TRUTH":(!price?"FRESH_PRICE":(!stock?"FRESH_STOCK":(!shipping?"FRESH_SHIPPING":(readyMarket.has(market)?"CHECKOUT_QUOTE_REQUIRED":"MARKET_RECHECK_REQUIRED"))))
    };
  }

  async function adminClient(){
    const rt=runtime();
    if(!rt?.adminReady)throw new Error("BOOM_RUNTIME_UNAVAILABLE");
    const gate=await rt.adminReady();
    if(!gate?.ok)throw new Error(gate?.reason||"ADMIN_REQUIRED");
    const c=rt.getSupabaseClient?.();
    if(!c)throw new Error("SUPABASE_UNAVAILABLE");
    return c;
  }

  async function snapshot({country="IL",hours=24,provider="CJdropshipping"}={}){
    const c=await adminClient();
    const cutoff=new Date(Date.now()-Math.max(1,Math.min(168,Number(hours)||24))*3600000).toISOString();
    const [catalogRes,obsRes]=await Promise.all([
      c.from("hunt_catalog_products")
        .select("provider,item_id,category,title,image_url,price_amount,currency,availability_verified,market_eligibility_status,source_fresh_at,last_stock_check_at")
        .eq("provider",provider)
        .limit(1000),
      c.from("hunt_product_observations")
        .select("provider,item_id,observation_type,price_amount,currency,availability_verified,shipping_amount,destination_country,payload,observed_at")
        .eq("provider",provider)
        .gte("observed_at",cutoff)
        .limit(5000)
    ]);
    if(catalogRes.error)throw catalogRes.error;
    if(obsRes.error)throw obsRes.error;
    const catalog=catalogRes.data||[], observations=obsRes.data||[];
    const rows=catalog.map(p=>evaluateProduct(p,observations,country,hours));
    return {
      version,mode:"SHADOW",country:clean(country).toUpperCase(),freshness_hours:hours,
      total_catalog:catalog.length,
      fresh_shelf_verified:rows.filter(x=>x.fresh_shelf_verified).length,
      checkout_live_verified:rows.filter(x=>x.checkout_live_verified).length,
      checkout_recheck_required:rows.filter(x=>x.state==="CHECKOUT_RECHECK_REQUIRED").length,
      stale_or_unverified:rows.filter(x=>x.state==="STALE_OR_UNVERIFIED").length,
      rows,
      material_action_authorized:false
    };
  }

  window.BoomFreshShelfProductTruth={version,evaluateProduct,snapshot};
})();