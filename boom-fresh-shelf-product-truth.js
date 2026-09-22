(() => {
  "use strict";
  if(window.BoomFreshShelfProductTruth?.version)return;
  const version="BOOM-FRESH-SHELF-PRODUCT-TRUTH-V1.1-SCAN-AWARE";
  const runtime=()=>window.BoomRuntime;
  const clean=v=>String(v??"").trim();
  const allowedShelfMarket=new Set(["recheck_before_checkout","eligible","allowed"]);
  const readyMarket=new Set(["eligible","allowed"]);
  const truthy=v=>v===true||String(v).toLowerCase()==="true";
  const recent=(ts,hours)=>{const n=Date.parse(ts||"");return Number.isFinite(n)&&Date.now()-n<=hours*3600000&&Date.now()>=n;};
  const newest=rows=>[...(rows||[])].sort((a,b)=>Date.parse(b?.observed_at||0)-Date.parse(a?.observed_at||0))[0]||null;

  function evaluateProduct(product={},observations=[],country="IL",hours=24){
    const countryCode=clean(country).toUpperCase();
    const obs=(observations||[]).filter(x=>clean(x.provider)===clean(product.provider)&&clean(x.item_id)===clean(product.item_id)&&recent(x.observed_at,hours));
    const scan=newest(obs.filter(x=>x.observation_type==="product"&&clean(x.payload?.source)==="controlled-cj-refresh"&&clean(x.payload?.destination_country).toUpperCase()===countryCode));
    const scanState=clean(scan?.payload?.refresh_state).toUpperCase();
    const scanVerified=Boolean(scan&&scan.availability_verified===true&&scanState==="VERIFIED"&&clean(scan.payload?.scan_id));
    const variantId=clean(scan?.payload?.variant_id);
    const sameVariant=x=>!variantId||clean(x?.payload?.variant_id)===variantId;

    const price=newest(obs.filter(x=>x.observation_type==="price"&&sameVariant(x)&&x.availability_verified===true&&Number(x.price_amount)>0&&truthy(x.payload?.retail_verified)&&clean(x.payload?.profit_gate_status).toUpperCase()==="PASS"));
    const stock=newest(obs.filter(x=>x.observation_type==="stock"&&sameVariant(x)&&x.availability_verified===true&&truthy(x.payload?.stock_verified)&&truthy(x.payload?.stock_available)));
    const shipping=newest(obs.filter(x=>x.observation_type==="shipping"&&sameVariant(x)&&x.availability_verified===true&&clean(x.destination_country).toUpperCase()===countryCode&&Number.isFinite(Number(x.shipping_amount))&&truthy(x.payload?.shipping_verified)));

    const market=clean(product.market_eligibility_status).toLowerCase();
    const base=product.availability_verified===true&&Number(product.price_amount)>0&&clean(product.image_url)!==""&&allowedShelfMarket.has(market);
    const shelf=Boolean(base&&scanVerified&&price&&stock&&shipping);
    return {
      provider:product.provider||null,item_id:product.item_id||null,category:product.category||null,
      state:shelf?(readyMarket.has(market)?"FRESH_SHELF_VERIFIED":"CHECKOUT_RECHECK_REQUIRED"):"STALE_OR_UNVERIFIED",
      fresh_shelf_verified:shelf,
      checkout_live_verified:false,
      market_status:market||null,
      scan:{verified:scanVerified,state:scanState||null,scan_id:scan?.payload?.scan_id||null,variant_id:variantId||null,observed_at:scan?.observed_at||null},
      evidence:{
        price:Boolean(price),stock:Boolean(stock),shipping:Boolean(shipping),
        newest:[scan?.observed_at,price?.observed_at,stock?.observed_at,shipping?.observed_at].filter(Boolean).sort().pop()||null
      },
      first_blocker:!base?"CATALOG_BASE_TRUTH":(!scanVerified?"CONTROLLED_SCAN_VERIFIED":(!price?"FRESH_PRICE_SAME_VARIANT":(!stock?"FRESH_STOCK_SAME_VARIANT":(!shipping?"FRESH_SHIPPING_SAME_VARIANT":(readyMarket.has(market)?"CHECKOUT_QUOTE_REQUIRED":"MARKET_RECHECK_REQUIRED")))))
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
    const scanStates=rows.reduce((m,x)=>{const k=x.scan?.state||"NO_CONTROLLED_SCAN";m[k]=(m[k]||0)+1;return m;},{});
    return {
      version,mode:"SHADOW",country:clean(country).toUpperCase(),freshness_hours:hours,
      total_catalog:catalog.length,
      fresh_shelf_verified:rows.filter(x=>x.fresh_shelf_verified).length,
      checkout_live_verified:rows.filter(x=>x.checkout_live_verified).length,
      checkout_recheck_required:rows.filter(x=>x.state==="CHECKOUT_RECHECK_REQUIRED").length,
      stale_or_unverified:rows.filter(x=>x.state==="STALE_OR_UNVERIFIED").length,
      scan_states:scanStates,
      rows,
      material_action_authorized:false
    };
  }

  window.BoomFreshShelfProductTruth={version,evaluateProduct,snapshot};
})();