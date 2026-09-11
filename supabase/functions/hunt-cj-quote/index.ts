const PUBLIC_KEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const ALLOWED_ORIGINS=new Set([
  "https://hadpac23-netizen.github.io",
  "https://deep-hunt-market.netlify.app",
  "http://127.0.0.1:8767",
  "http://localhost:8767"
]);
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const json=(data:unknown,status=200,headers:Record<string,string>={})=>
  new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...headers}});
function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  return {
    "Access-Control-Allow-Origin":ALLOWED_ORIGINS.has(origin)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, content-type",
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Vary":"Origin"
  };
}
let tokenCache={token:"",expiresAt:0};
const quoteCache=new Map<string,{expiresAt:number,value:any}>();
const rate=new Map<string,number>();
async function cjToken(){
  const direct=Deno.env.get("CJ_ACCESS_TOKEN")||"";
  if(direct)return direct;
  const apiKey=Deno.env.get("CJ_API_KEY")||"";
  if(!apiKey)return "";
  if(tokenCache.token&&tokenCache.expiresAt>Date.now())return tokenCache.token;
  const res=await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",{
    method:"POST",
    headers:{"content-type":"application/json","accept":"application/json"},
    body:JSON.stringify({apiKey})
  });
  if(!res.ok)return "";
  const body=await res.json().catch(()=>({}));
  const token=clean(body?.data?.accessToken);
  if(token)tokenCache={token,expiresAt:Date.now()+12*60*60*1000};
  return token;
}
Deno.serve(async(req:Request)=>{
  const headers=cors(req);
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(req.method!=="GET")return json({error:"method not allowed"},405,headers);
  if((req.headers.get("apikey")||"")!==PUBLIC_KEY)return json({error:"unauthorized"},401,headers);
  const url=new URL(req.url);
  const vid=clean(url.searchParams.get("vid"));
  const country=clean(url.searchParams.get("country_code")).toUpperCase();
  const originRequested=clean(url.searchParams.get("origin_code")).toUpperCase();
  const quantity=Math.max(1,Math.min(5,Number(url.searchParams.get("quantity")||1)||1));
  if(!/^[A-Za-z0-9-]{8,200}$/.test(vid))return json({error:"invalid variant"},400,headers);
  if(country&&!/^[A-Z]{2}$/.test(country))return json({error:"invalid country code"},400,headers);
  if(originRequested&&!/^[A-Z]{2}$/.test(originRequested))return json({error:"invalid origin code"},400,headers);
  const cacheKey=[vid,country,originRequested,quantity].join("|");
  const cached=quoteCache.get(cacheKey);
  if(cached&&cached.expiresAt>Date.now())return json({...cached.value,cached:true},200,headers);
  const ip=(req.headers.get("x-forwarded-for")||"").split(",")[0].trim()||"unknown";
  const rateKey=ip+"|"+vid;
  const last=rate.get(rateKey)||0;
  if(Date.now()-last<1500)return json({error:"rate limited"},429,headers);
  rate.set(rateKey,Date.now());
  const token=await cjToken();
  if(!token)return json({error:"CJ unavailable"},503,headers);
  const stockUrl=new URL("https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid");
  stockUrl.searchParams.set("vid",vid);
  const stockRes=await fetch(stockUrl,{headers:{"CJ-Access-Token":token,"accept":"application/json"}});
  const stockBody=await stockRes.json().catch(()=>({}));
  const rawStock=Array.isArray(stockBody?.data)?stockBody.data:[];
  const origins=rawStock.map((row:any)=>({
    country_code:clean(row?.countryCode).toUpperCase(),
    area:clean(row?.areaEn),
    area_id:clean(String(row?.areaId??"")),
    storage_num:Math.max(0,Number(row?.storageNum||0)),
    total_inventory:Math.max(0,Number(row?.totalInventoryNum||0))
  })).filter((row:any)=>row.country_code&&row.total_inventory>0)
    .sort((a:any,b:any)=>b.total_inventory-a.total_inventory);
  const chosen=(originRequested?origins.find((x:any)=>x.country_code===originRequested):null)||origins[0]||null;
  const result:any={
    provider:"CJdropshipping",
    variant_id:vid,
    quantity,
    stock_verified:stockRes.ok&&Number(stockBody?.code||200)===200,
    stock_available:Boolean(chosen&&chosen.total_inventory>=quantity),
    origins,
    selected_origin:chosen,
    destination_country:country||null,
    shipping_options:[]
  };
  if(country&&result.stock_available){
    const freightRes=await fetch("https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate",{
      method:"POST",
      headers:{"CJ-Access-Token":token,"content-type":"application/json","accept":"application/json"},
      body:JSON.stringify({
        startCountryCode:chosen.country_code,
        endCountryCode:country,
        products:[{quantity,vid}]
      })
    });
    const freightBody=await freightRes.json().catch(()=>({}));
    const methods=Array.isArray(freightBody?.data)?freightBody.data:[];
    result.shipping_verified=freightRes.ok&&Number(freightBody?.code||200)===200;
    result.shipping_options=methods.map((m:any)=>({

      name:clean(m?.logisticName),
      price_usd:Number.isFinite(Number(m?.totalPostageFee))?Number(m.totalPostageFee):
        (Number.isFinite(Number(m?.logisticPrice))?Number(m.logisticPrice):null),
      base_price_usd:Number.isFinite(Number(m?.logisticPrice))?Number(m.logisticPrice):null,
      taxes_usd:Number.isFinite(Number(m?.taxesFee))?Number(m.taxesFee):null,
      clearance_fee_usd:Number.isFinite(Number(m?.clearanceOperationFee))?Number(m.clearanceOperationFee):null,
      aging:clean(m?.logisticAging)
    })).filter((m:any)=>m.name&&m.price_usd!==null)
      .sort((a:any,b:any)=>a.price_usd-b.price_usd).slice(0,12);
  }
  quoteCache.set(cacheKey,{expiresAt:Date.now()+5*60*1000,value:result});
  return json(result,200,headers);
});