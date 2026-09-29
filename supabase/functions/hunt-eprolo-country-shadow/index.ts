import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHash } from "node:crypto";
import postgres from "npm:postgres@3.4.5";

const API="https://openapi.eprolo.com/";
const BASE=Deno.env.get("SUPABASE_URL")||"";
const PUB="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const reply=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
const clean=(v:any)=>typeof v==="string"?v.trim():"";
const num=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n:null};

let sqlClientInstance:ReturnType<typeof postgres>|null=null;
function dbUrl(){
  return clean(Deno.env.get("SUPABASE_DB_POOLER_URL")||Deno.env.get("SUPABASE_DB_URL")||"");
}
function dbConnectionMode(){
  if(clean(Deno.env.get("SUPABASE_DB_POOLER_URL")||""))return "transaction_pooler";
  if(clean(Deno.env.get("SUPABASE_DB_URL")||""))return "fallback_direct_or_session";
  return "missing";
}
function sqlClient(){
  if(sqlClientInstance)return sqlClientInstance;
  const url=dbUrl();
  if(!url)throw new Error("SERVER_CONFIG_DB_URL");
  sqlClientInstance=postgres(url,{prepare:false,max:1,connect_timeout:10,idle_timeout:20,max_lifetime:600});
  return sqlClientInstance;
}

function sig(k:string,s:string){
  const timestamp=String(Date.now());
  return {timestamp,sign:createHash("md5").update(k+timestamp+s).digest("hex")};
}
async function apiGet(k:string,s:string,path:string,params:Record<string,string|number>){
  const a=sig(k,s),u=new URL(path,API);
  for(const [x,v] of Object.entries(params))u.searchParams.set(x,String(v));
  u.searchParams.set("timestamp",a.timestamp);
  u.searchParams.set("sign",a.sign);
  const r=await fetch(u,{
    headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-GLOBAL/1.0"},
    signal:AbortSignal.timeout(20000)
  });
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function cheapest(body:any){
  const a:any[]=[];
  for(const v of (body?.data?.variantlist||[]))
    for(const l of (v?.logistics_cost_list||[]))
      for(const x of (l?.cost_list||[])){
        const c=num(x?.cost);
        if(c===null||c<0)continue;
        const tax=num(x?.taxesFee ?? x?.tax_fee ?? x?.tax ?? x?.taxes);
        a.push({
          cost_usd:Math.round(c*100)/100,
          tax_usd:tax===null?null:Math.round(tax*100)/100,
          method:String(x?.ship_method||""),
          eta:String(x?.shiptime||"")
        });
      }
  a.sort((x,y)=>x.cost_usd-y.cost_usd);
  return a[0]||null;
}
async function loadInputs(itemId:string){
  const sql=sqlClient();
  const cand=await sql`
      select item_id,supplier_cost,verified_inventory,source_payload
      from public.hunt_shelf_candidates
      where provider='EPROLO' and item_id=${itemId}
      limit 1
    `;
    const c=cand?.[0]||null;
    if(!c)return {candidate:null};

    const prof=await sql`
      select payment_rate,refund_reserve_rate,platform_variable_rate,
             platform_fixed_per_order,min_contribution_per_unit,min_margin_rate
      from public.hunt_profit_profiles
      where status='active' and owner_approved=true
      order by updated_at desc
      limit 1
    `;
    const secrets=await sql`
      select name,decrypted_secret
      from vault.decrypted_secrets
      where name in ('hunt_eprolo_api_key','hunt_eprolo_api_secret')
    `;
    const sec=Object.fromEntries((secrets||[]).map((x:any)=>[String(x.name),String(x.decrypted_secret||"")]));
    return {
      candidate:{
        item_id:String(c.item_id||""),
        supplier_cost:c.supplier_cost,
        verified_inventory:c.verified_inventory,
        variant_id:c.source_payload?.variant_id||null
      },
      profile:prof?.[0]||null,
      eprolo_api_key:sec.hunt_eprolo_api_key||"",
      eprolo_api_secret:sec.hunt_eprolo_api_secret||""
    };
}
function price(p:any,c:number,s:number,tax:number){
  const pay=Math.max(0,Number(p?.payment_rate||0.04));
  const ref=Math.max(0,Number(p?.refund_reserve_rate||0.05));
  const vr=Math.max(0,Number(p?.platform_variable_rate||0));
  const fixed=Math.max(0,Number(p?.platform_fixed_per_order||0));
  const minC=Math.max(0,Number(p?.min_contribution_per_unit||4));
  const minM=Math.max(0,Number(p?.min_margin_rate||0.20));
  const r=pay+ref+vr,cf=(minC+c+tax+r*s+fixed)/(1-r),md=1-r-minM,mf=md>0?(c+tax+r*s+fixed)/md:Infinity;
  const floor=Math.max(cf,mf),whole=Math.ceil(floor+0.01),ret=Number((whole-0.01).toFixed(2));
  const sale=ret+1e-9>=floor?ret:Number((whole+0.99).toFixed(2));
  const contribution=(1-r)*sale-c-tax-r*s-fixed,margin=sale>0?contribution/sale:0;
  return {sale,contribution:Number(contribution.toFixed(2)),margin:Number(margin.toFixed(4)),gate:contribution>=minC&&margin>=minM?"PASS":contribution>0?"REVIEW":"BLOCK"};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return reply({error:"method not allowed"},405);
  if((req.headers.get("apikey")||"")!==PUB)return reply({error:"unauthorized"},401);

  const u=new URL(req.url);
  const itemId=clean(u.searchParams.get("item_id"));
  const country=clean(u.searchParams.get("country")).toUpperCase();
  const requested=clean(u.searchParams.get("variant_id"));
  if(!itemId)return reply({error:"item_id required"},400);
  if(!/^[A-Z]{2}$/.test(country))return reply({error:"country must be ISO alpha-2"},400);

  let inputs:any;
  try{
    inputs=await loadInputs(itemId);
  }catch(e){
    console.error("EPROLO_COUNTRY_DB_INPUT_READ_FAILED",{
      mode:dbConnectionMode(),
      name:e instanceof Error?e.name:"unknown"
    });
    return reply({error:"DB_INPUT_READ_FAILED",production_effect:false},503);
  }

  try{
    const row:any=inputs?.candidate;
    if(!row)return reply({item_id:itemId,country,status:"HOLD",reason:"CANDIDATE_NOT_FOUND",production_effect:false},404);
    if(!inputs?.profile)return reply({error:"PROFIT_PROFILE_NOT_ACTIVE",production_effect:false},500);
    const apiKey=String(inputs?.eprolo_api_key||"");
    const apiSecret=String(inputs?.eprolo_api_secret||"");
    if(!apiKey||!apiSecret)return reply({error:"EPROLO_SECRETS_MISSING",production_effect:false},500);

    const variantId=requested||String(row?.variant_id||"");
    if(!variantId)return reply({item_id:itemId,country,status:"HOLD",reason:"EXACT_VARIANT_MISSING",production_effect:false},400);
    if(requested&&requested!==String(row?.variant_id||""))
      return reply({item_id:itemId,country,status:"HOLD",reason:"REQUESTED_VARIANT_MISMATCH",production_effect:false},400);

    const q=await apiGet(apiKey,apiSecret,"get_product_shiping_fees.html",{productid:itemId,variantId,countrycode:country});
    if(q.http!==200||String(q.body?.code)!=="0"){
      return reply({
        provider:"EPROLO",item_id:itemId,country,variant_id:variantId,status:"HOLD",
        reason:"UPSTREAM_UNAVAILABLE",upstream_http:q.http,upstream_code:q.body?.code??null,
        stock_verified:false,stock_available:false,shipping_verified:false,production_effect:false
      });
    }

    const variantList=Array.isArray(q.body?.data?.variantlist)?q.body.data.variantlist:[];
    const exact=variantList.find((v:any)=>
      [v?.id,v?.variantsid,v?.variantId,v?.variant_id,v?.variants_id,v?.sku]
        .map((x:any)=>String(x??"")).includes(variantId)
    );
    if(!exact){
      return reply({
        provider:"EPROLO",item_id:itemId,country,variant_id:variantId,status:"HOLD",
        reason:"EXACT_VARIANT_NOT_RETURNED",stock_verified:false,stock_available:false,
        shipping_verified:false,production_effect:false
      });
    }

    const cost=Number(exact?.cost);
    const stock=Math.max(0,Number(exact?.inventory_quantity||0));
    if(!(cost>0)){
      return reply({
        provider:"EPROLO",item_id:itemId,country,variant_id:variantId,status:"HOLD",
        reason:"NO_VARIANT_COST",stock_verified:true,stock_available:stock>0,
        inventory_quantity:stock,shipping_verified:false,production_effect:false
      });
    }
    if(stock<1){
      return reply({
        provider:"EPROLO",item_id:itemId,country,variant_id:variantId,status:"OUT_OF_STOCK",
        reason:"EXACT_VARIANT_ZERO_INVENTORY",supplier_cost_usd:cost,
        stock_verified:true,stock_available:false,inventory_quantity:stock,
        shipping_verified:false,production_effect:false
      });
    }

    const sh=cheapest({data:{variantlist:[exact]}});
    if(!sh)return reply({
      provider:"EPROLO",item_id:itemId,country,variant_id:variantId,status:"HOLD",
      reason:"NO_VERIFIED_SHIPPING",upstream_http:q.http,upstream_code:q.body?.code??null,
      supplier_cost_usd:cost,stock_verified:true,stock_available:true,inventory_quantity:stock,
      shipping_verified:false,production_effect:false
    });

    const destinationTaxVerified=sh.tax_usd!==null;
    const destinationTaxUsd=sh.tax_usd??0;
    const econ=price(inputs.profile,cost,sh.cost_usd,destinationTaxUsd);
    return reply({
      provider:"EPROLO",source_truth:"EPROLO_EXACT_VARIANT_SHIPPING_API",
      item_id:itemId,country,variant_id:variantId,canonical_variant_enforced:true,
      supplier_cost_usd:cost,stock_verified:true,stock_available:true,inventory_quantity:stock,
      fresh_variant_truth:true,source_checked_at:new Date().toISOString(),
      shipping_verified:true,shipping_method:sh.method,shipping_usd:sh.cost_usd,aging:sh.eta,
      destination_tax_usd:sh.tax_usd,destination_tax_verified:destinationTaxVerified,
      final_profit_verified:destinationTaxVerified && econ.gate==="PASS",
      shadow_retail_floor_usd:econ.sale,
      economics:{contribution:econ.contribution,margin:econ.margin,gate:econ.gate,tax_included:destinationTaxVerified},
      readiness_status:econ.gate==="PASS"&&destinationTaxVerified?"COUNTRY_PASS":"HOLD",
      production_effect:false
    });
  }catch(e){
    return reply({error:e instanceof Error?e.message:"eprolo country failed",production_effect:false},500);
  }
});