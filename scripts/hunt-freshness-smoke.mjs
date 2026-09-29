const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1";
const APIKEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const COUNTRY="IL";
const SAMPLE=[
  {provider:"CJdropshipping",item_id:"09AA8DA5-1F05-4198-B504-8532D2DC0CD2",variant_id:"03B6EE1C-27CB-48E1-982A-18209D5E4C4A",retail_usd:5.99},
  {provider:"CJdropshipping",item_id:"1369595750064984064",variant_id:"1369595751386189824",retail_usd:5.99},
  {provider:"CJdropshipping",item_id:"1402815850569928704",variant_id:"1402856273678045184",retail_usd:14.99},
  {provider:"CJdropshipping",item_id:"1412274952509460480",variant_id:"1412274953969078272",retail_usd:58.99},
  {provider:"CJdropshipping",item_id:"1417723948015161344",variant_id:"1417723949504139264",retail_usd:6.99},
  {provider:"EPROLO",item_id:"10317303",variant_id:"291493820",retail_usd:6.99},
  {provider:"EPROLO",item_id:"10695271",variant_id:"310693955",retail_usd:5.99},
  {provider:"EPROLO",item_id:"10709910",variant_id:"311421926",retail_usd:6.99},
  {provider:"EPROLO",item_id:"10709916",variant_id:"311424369",retail_usd:11.99},
  {provider:"EPROLO",item_id:"10719093",variant_id:"311869380",retail_usd:13.99}
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(path,params){
  const u=new URL(BASE+"/"+path);
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
  const res=await fetch(u,{headers:{apikey:APIKEY,accept:"application/json"},signal:AbortSignal.timeout(25000)});
  return {http:res.status,body:await res.json().catch(()=>({}))};
}
const results=[];
for(const row of SAMPLE){
  if(row.provider==="CJdropshipping"){
    const detail=await get("hunt-storefront",{provider:"CJdropshipping",product_id:row.item_id});
    const quote=await get("hunt-cj-quote",{vid:row.variant_id,country_code:COUNTRY,quantity:1});
    const variants=Array.isArray(detail.body?.product?.variants)?detail.body.product.variants:[];
    const exact=variants.find(v=>String(v?.variant_id||"")===row.variant_id)||null;
    const shipping=Array.isArray(quote.body?.shipping_options)?quote.body.shipping_options:[];
    const fresh=detail.http===200&&quote.http===200&&quote.body?.stock_verified===true;
    const classification=!fresh?"RETRY":
      quote.body?.stock_available!==true?"HOLD_OUT_OF_STOCK":
      quote.body?.shipping_verified!==true||!shipping.length?"HOLD_NO_SHIPPING":
      !(Number(exact?.price_amount)>0)?"RETRY_COST":
      "FRESH_SOURCE_PASS";
    results.push({
      ...row,classification,
      detail_http:detail.http,quote_http:quote.http,
      supplier_cost_usd:Number(exact?.price_amount)||null,
      stock_verified:quote.body?.stock_verified===true,
      stock_available:quote.body?.stock_available===true,
      shipping_verified:quote.body?.shipping_verified===true&&shipping.length>0,
      shipping_usd:shipping.length?Number(shipping[0]?.price_usd)||null:null
    });
  }else{
    const r=await get("hunt-eprolo-country-shadow",{item_id:row.item_id,variant_id:row.variant_id,country:COUNTRY});
    const b=r.body||{};
    const classification=r.http!==200?"RETRY":
      b.fresh_variant_truth!==true?"RETRY_REQUIRES_PATCH_DEPLOY":
      b.stock_available!==true?"HOLD_OUT_OF_STOCK":
      b.shipping_verified!==true?"HOLD_NO_SHIPPING":
      "FRESH_SOURCE_PASS";
    results.push({
      ...row,classification,http:r.http,
      fresh_variant_truth:b.fresh_variant_truth===true,
      supplier_cost_usd:Number(b.supplier_cost_usd)||null,
      stock_verified:b.stock_verified===true,
      stock_available:b.stock_available===true,
      shipping_verified:b.shipping_verified===true,
      shipping_usd:Number(b.shipping_usd)||null,
      reason:b.reason||null
    });
  }
  await sleep(250);
}
const summary={
  total:results.length,
  fresh_source_pass:results.filter(x=>x.classification==="FRESH_SOURCE_PASS").length,
  hold:results.filter(x=>x.classification.startsWith("HOLD_")).length,
  retry:results.filter(x=>x.classification.startsWith("RETRY")).length,
  cj:results.filter(x=>x.provider==="CJdropshipping"),
  eprolo:results.filter(x=>x.provider==="EPROLO")
};
console.log("HUNT_FRESHNESS_SMOKE_JSON="+JSON.stringify(summary));
