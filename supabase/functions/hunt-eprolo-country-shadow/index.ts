import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PUB="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const INTERNAL_TOKEN=clean(Deno.env.get("HUNT_EPROLO_INTERNAL_TOKEN")||"");
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return reply({error:"method not allowed",production_effect:false},405);
  if((req.headers.get("apikey")||"")!==PUB)return reply({error:"unauthorized",production_effect:false},401);
  if(!INTERNAL_TOKEN)return reply({error:"server config missing",status:"HOLD",reason:"EPROLO_INTERNAL_TOKEN_MISSING",final_profit_verified:false,production_effect:false},503);
  if(clean(req.headers.get("x-hunt-internal-token"))!==INTERNAL_TOKEN)return reply({error:"unauthorized",production_effect:false},401);

  const u=new URL(req.url);
  const itemId=clean(u.searchParams.get("item_id"));
  const variantId=clean(u.searchParams.get("variant_id"));
  const country=clean(u.searchParams.get("country")).toUpperCase();
  if(!itemId)return reply({error:"item_id required",production_effect:false},400);
  if(!/^[A-Z]{2}$/.test(country))return reply({error:"country must be ISO alpha-2",production_effect:false},400);

  return reply({
    provider:"EPROLO",item_id:itemId,variant_id:variantId||null,country,
    status:"HOLD",readiness_status:"HOLD",
    reason:"EPROLO_COUNTRY_SHADOW_QUARANTINED_PENDING_SAFE_RUNTIME",
    stock_verified:false,shipping_verified:false,destination_tax_verified:false,
    final_profit_verified:false,supplier_economics_exposed:false,production_effect:false
  },503);
});
