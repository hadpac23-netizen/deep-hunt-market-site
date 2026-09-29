import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import { createHash } from "node:crypto";

const API="https://openapi.eprolo.com/";
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const reply=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});

function sig(k:string,s:string){
  const timestamp=String(Date.now());
  return {timestamp,sign:createHash("md5").update(k+timestamp+s).digest("hex")};
}
async function apiGet(k:string,s:string,path:string,params:Record<string,string|number>){
  const a=sig(k,s),u=new URL(path,API);
  for(const [x,v] of Object.entries(params))u.searchParams.set(x,String(v));
  u.searchParams.set("timestamp",a.timestamp);u.searchParams.set("sign",a.sign);
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-VARIANT-COUNTRY-AUDIT/1.0"},signal:AbortSignal.timeout(20000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function variantIdOf(v:any){
  return [v?.id,v?.variantsid,v?.variantId,v?.variant_id,v?.variants_id,v?.sku].map((x:any)=>String(x??"")).find(Boolean)||"";
}
function shippingOptions(v:any){
  const out:any[]=[];
  for(const l of (v?.logistics_cost_list||[]))for(const x of (l?.cost_list||[])){
    const cost=num(x?.cost);
    if(cost===null||cost<0)continue;
    const tax=num(x?.taxesFee ?? x?.tax_fee ?? x?.tax ?? x?.taxes);
    out.push({
      shipping_usd:Math.round(cost*100)/100,
      method:String(x?.ship_method||""),
      eta:String(x?.shiptime||""),
      tax_usd:tax===null?null:Math.round(tax*100)/100
    });
  }
  out.sort((a,b)=>a.shipping_usd-b.shipping_usd);
  return out;
}
function economics(p:any,sale:number,cost:number,ship:number,tax:number){
  const payment=Math.max(0,Number(p?.payment_rate||0.04));
  const refund=Math.max(0,Number(p?.refund_reserve_rate||0.05));
  const variable=Math.max(0,Number(p?.platform_variable_rate||0));
  const fixed=Math.max(0,Number(p?.platform_fixed_per_order||0));
  const minC=Math.max(0,Number(p?.min_contribution_per_unit||4));
  const minM=Math.max(0,Number(p?.min_margin_rate||0.20));
  const r=payment+refund+variable;
  const gross=sale+ship;
  const contribution=gross-cost-ship-tax-(gross*r)-fixed;
  const margin=sale>0?contribution/sale:0;
  return {
    payment_reserve_rate:payment,
    refund_reserve_rate:refund,
    platform_variable_rate:variable,
    platform_fixed_per_order:fixed,
    contribution:Number(contribution.toFixed(2)),
    margin:Number(margin.toFixed(4)),
    min_required_contribution:minC,
    min_required_margin:minM,
    gate:contribution>=minC&&margin>=minM?"PASS":contribution>0?"REVIEW":"BLOCK"
  };
}
function retailFloor(p:any,cost:number,ship:number,tax:number){
  const payment=Math.max(0,Number(p?.payment_rate||0.04));
  const refund=Math.max(0,Number(p?.refund_reserve_rate||0.05));
  const variable=Math.max(0,Number(p?.platform_variable_rate||0));
  const fixed=Math.max(0,Number(p?.platform_fixed_per_order||0));
  const minC=Math.max(0,Number(p?.min_contribution_per_unit||4));
  const minM=Math.max(0,Number(p?.min_margin_rate||0.20));
  const r=payment+refund+variable;
  const c=cost+tax+fixed+r*ship;
  const contributionFloor=(minC+c)/(1-r);
  const marginDenom=1-r-minM;
  const marginFloor=marginDenom>0?c/marginDenom:Infinity;
  const floor=Math.max(contributionFloor,marginFloor);
  const whole=Math.ceil(floor+0.01);
  const charm=Number((whole-0.01).toFixed(2));
  return charm+1e-9>=floor?charm:Number((whole+0.99).toFixed(2));
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return reply({error:"GET required"},405);
  const db=Deno.env.get("SUPABASE_DB_URL");
  if(!db)return reply({error:"server config missing"},500);
  const sql=postgres(db,{prepare:false,max:1,connect_timeout:20,idle_timeout:3,max_lifetime:60});
  try{
    const secRows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_underwear_catalog_token','hunt_eprolo_api_key','hunt_eprolo_api_secret')`;
    const sec=Object.fromEntries(secRows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(!sec.hunt_underwear_catalog_token || req.headers.get("x-hunt-internal-token")!==String(sec.hunt_underwear_catalog_token)){
      return reply({error:"unauthorized"},401);
    }
    const u=new URL(req.url);
    const itemId=clean(u.searchParams.get("item_id"));
    const variantId=clean(u.searchParams.get("variant_id"));
    const country=clean(u.searchParams.get("country")).toUpperCase();
    if(!itemId||!variantId||!/^[A-Z]{2}$/.test(country))return reply({error:"item_id, variant_id and ISO country required"},400);

    const cand=await sql`select title from public.hunt_shelf_candidates where provider='EPROLO' and item_id=${itemId} limit 1`;
    if(!cand?.[0])return reply({item_id:itemId,variant_id:variantId,country,status:"HOLD",reason:"CANDIDATE_NOT_FOUND",production_effect:false},404);

    const profileRows=await sql`select * from public.hunt_profit_profiles where status='active' and owner_approved=true order by updated_at desc limit 1`;
    if(!profileRows?.[0])return reply({error:"PROFIT_PROFILE_NOT_ACTIVE",production_effect:false},500);

    const q=await apiGet(String(sec.hunt_eprolo_api_key||""),String(sec.hunt_eprolo_api_secret||""),"get_product_shiping_fees.html",{productid:itemId,variantId,countrycode:country});
    if(q.http!==200||String(q.body?.code)!=="0"){
      return reply({provider:"EPROLO",item_id:itemId,variant_id:variantId,country,status:"HOLD",reason:"UPSTREAM_UNAVAILABLE",http:q.http,code:q.body?.code??null,production_effect:false});
    }

    const list=Array.isArray(q.body?.data?.variantlist)?q.body.data.variantlist:[];
    const v=list.find((x:any)=>variantIdOf(x)===variantId);
    if(!v)return reply({provider:"EPROLO",item_id:itemId,variant_id:variantId,country,status:"HOLD",reason:"EXACT_VARIANT_NOT_RETURNED",production_effect:false});

    const inventory=Math.max(0,Number(v?.inventory_quantity||0));
    const cost=num(v?.cost);
    if(!(cost!==null&&cost>0))return reply({provider:"EPROLO",item_id:itemId,variant_id:variantId,country,status:"HOLD",reason:"NO_VARIANT_COST",inventory_quantity:inventory,production_effect:false});
    if(inventory<1)return reply({provider:"EPROLO",item_id:itemId,variant_id:variantId,country,status:"OUT_OF_STOCK",reason:"EXACT_VARIANT_ZERO_INVENTORY",supplier_cost_usd:cost,inventory_quantity:inventory,production_effect:false});

    const options=shippingOptions(v);
    const ship=options[0]||null;
    if(!ship)return reply({provider:"EPROLO",item_id:itemId,variant_id:variantId,country,status:"HOLD",reason:"NO_VERIFIED_SHIPPING",supplier_cost_usd:cost,inventory_quantity:inventory,production_effect:false});

    const taxesVerified=ship.tax_usd!==null;
    const tax=taxesVerified?Number(ship.tax_usd):0;
    const p=profileRows[0];
    const sale=retailFloor(p,cost,ship.shipping_usd,tax);
    const econ=economics(p,sale,cost,ship.shipping_usd,tax);
    const finalProfitVerified=taxesVerified && econ.gate==="PASS";

    return reply({
      checked_at:new Date().toISOString(),
      provider:"EPROLO",
      source_truth:"EPROLO_EXACT_VARIANT_SHIPPING_API",
      product_title:cand[0].title,
      item_id:itemId,
      variant_id:variantId,
      variant_title:v?.title||null,
      color:v?.option1||null,
      size:v?.option2||null,
      country,
      stock_verified:true,
      inventory_quantity:inventory,
      stock_available:inventory>0,
      supplier_cost_usd:cost,
      shipping_verified:true,
      shipping_method:ship.method||null,
      shipping_usd:ship.shipping_usd,
      shipping_eta:ship.eta||null,
      taxes_verified:taxesVerified,
      tax_usd:ship.tax_usd,
      shadow_retail_floor_usd:sale,
      economics:econ,
      final_profit_verified:finalProfitVerified,
      readiness_status:finalProfitVerified?"COUNTRY_PASS":"PROFIT_REVIEW",
      missing_for_final_profit:taxesVerified?[]:["DESTINATION_TAX_NOT_VERIFIED"],
      production_effect:false,
      sellable:false
    });
  }catch(e){
    return reply({ok:false,error:e instanceof Error?e.message:String(e),production_effect:false,sellable:false},500);
  }finally{
    await sql.end({timeout:1}).catch(()=>{});
  }
});