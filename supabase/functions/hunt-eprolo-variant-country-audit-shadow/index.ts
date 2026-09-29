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
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-VARIANT-COUNTRY-AUDIT/2.0"},signal:AbortSignal.timeout(20000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function variantIdOf(v:any){
  return [v?.id,v?.variantsid,v?.variantId,v?.variant_id,v?.variants_id,v?.sku].map((x:any)=>String(x??"")).find(Boolean)||"";
}
function shippingOptions(v:any){
  const out:any[]=[];
  for(const l of (v?.logistics_cost_list||[]))for(const x of (l?.cost_list||[])){
    const cost=num(x?.cost); if(cost===null||cost<0)continue;
    const raw=x?.taxesFee ?? x?.tax_fee ?? x?.tax ?? x?.taxes;
    const tax=raw===undefined||raw===null||raw===""?null:num(raw);
    out.push({shipping_usd:Math.round(cost*100)/100,method:String(x?.ship_method||""),eta:String(x?.shiptime||""),tax_usd:tax===null?null:Math.round(tax*100)/100});
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
  const r=payment+refund+variable,gross=sale+ship;
  const contribution=gross-cost-ship-tax-(gross*r)-fixed;
  const margin=sale>0?contribution/sale:0;
  return {contribution:Number(contribution.toFixed(2)),margin:Number(margin.toFixed(4)),min_required_contribution:minC,min_required_margin:minM,gate:contribution>=minC&&margin>=minM?"PASS":contribution>0?"REVIEW":"BLOCK"};
}
function retailFloor(p:any,cost:number,ship:number,tax:number){
  const payment=Math.max(0,Number(p?.payment_rate||0.04));
  const refund=Math.max(0,Number(p?.refund_reserve_rate||0.05));
  const variable=Math.max(0,Number(p?.platform_variable_rate||0));
  const fixed=Math.max(0,Number(p?.platform_fixed_per_order||0));
  const minC=Math.max(0,Number(p?.min_contribution_per_unit||4));
  const minM=Math.max(0,Number(p?.min_margin_rate||0.20));
  const r=payment+refund+variable,c=cost+tax+fixed+r*ship;
  const contributionFloor=(minC+c)/(1-r),marginDenom=1-r-minM,marginFloor=marginDenom>0?c/marginDenom:Infinity;
  const floor=Math.max(contributionFloor,marginFloor),whole=Math.ceil(floor+0.01),charm=Number((whole-0.01).toFixed(2));
  return charm+1e-9>=floor?charm:Number((whole+0.99).toFixed(2));
}
function taxonomyConflict(title:string,shelf:string){
  const t=title.toLowerCase(),s=shelf.toLowerCase();
  const phone=(/\b(iphone.{0,24}case|phone case|samsung.{0,24}case|galaxy.{0,24}case)\b/i.test(t)&&!/\b(key\s?chain|keychain|bag pendant|passport|document case|card holder)\b/i.test(t));
  if(phone&&!/phone[- ]?(cases|accessories)|mobile[- ]?accessories/i.test(s))return true;
  const footwear=/\b(shoe|shoes|sandal|sandals|loafer|loafers|slipper|slippers|boot|boots|sneaker|sneakers|insole)\b/i.test(t);
  if(footwear&&/\b(cushions?|throws?|pets?|pet-houses?|mirrors?)\b/i.test(s))return true;
  const toy=/\b(montessori|toy|toys|play house|pretend play|educational game)\b/i.test(t);
  if(toy&&/\b(pets?|pet-houses?)\b/i.test(s))return true;
  const watch=/\b(watch|wristwatch|wristwatches)\b/i.test(t);
  if(watch&&/\b(jewelry-bracelets|bracelets|necklaces|earrings|rings)\b/i.test(s))return true;
  const apparel=/\b(t[- ]?shirt|shirt|hoodie|sweatshirt|jacket|pants|trousers)\b/i.test(t);
  if(apparel&&/\b(pets?|pet-houses?|cushions?|throws?)\b/i.test(s))return true;
  return false;
}
async function workerPool<T,R>(items:T[],concurrency:number,fn:(x:T)=>Promise<R>){
  const out:R[]=new Array(items.length);let cursor=0;
  async function worker(){while(true){const i=cursor++;if(i>=items.length)break;out[i]=await fn(items[i]);}}
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},()=>worker()));
  return out;
}
async function auditOne(row:any,country:string,p:any,key:string,secret:string){
  const itemId=clean(row.item_id),variantId=clean(row.variant_id),retail=num(row.retail_usd);
  const base={provider:"EPROLO",item_id:itemId,variant_id:variantId,country,production_effect:false,sellable:false};
  try{
    const q=await apiGet(key,secret,"get_product_shiping_fees.html",{productid:itemId,variantId,countrycode:country});
    if(q.http!==200||String(q.body?.code)!=="0")return {...base,status:"RETRY",reason:"UPSTREAM_UNAVAILABLE",http:q.http,code:q.body?.code??null};
    const list=Array.isArray(q.body?.data?.variantlist)?q.body.data.variantlist:[];
    const v=list.find((x:any)=>variantIdOf(x)===variantId);
    if(!v)return {...base,status:"HOLD",reason:"EXACT_VARIANT_NOT_RETURNED"};
    const inventory=Math.max(0,Number(v?.inventory_quantity||0)),cost=num(v?.cost);
    if(!(cost!==null&&cost>0))return {...base,status:"HOLD",reason:"NO_VARIANT_COST",inventory_quantity:inventory};
    if(inventory<1)return {...base,status:"OUT_OF_STOCK",reason:"EXACT_VARIANT_ZERO_INVENTORY",supplier_cost_usd:cost,inventory_quantity:inventory};
    const opts=shippingOptions(v),ship=opts[0]||null;
    if(!ship)return {...base,status:"HOLD",reason:"NO_VERIFIED_SHIPPING",supplier_cost_usd:cost,inventory_quantity:inventory};
    const taxesVerified=ship.tax_usd!==null,tax=taxesVerified?Number(ship.tax_usd):0;
    const floor=retailFloor(p,cost,ship.shipping_usd,tax);
    if(!(retail!==null&&retail>0))return {...base,status:"HOLD",reason:"RETAIL_PRICE_UNVERIFIED",supplier_cost_usd:cost,inventory_quantity:inventory,shipping_usd:ship.shipping_usd,tax_usd:ship.tax_usd,shadow_retail_floor_usd:floor};
    const econ=economics(p,retail,cost,ship.shipping_usd,tax);
    const finalProfit=taxesVerified&&econ.gate==="PASS";
    return {...base,checked_at:new Date().toISOString(),product_title:row.title||null,current_retail_usd:retail,variant_title:v?.title||null,color:v?.option1||null,size:v?.option2||null,stock_verified:true,inventory_quantity:inventory,stock_available:true,supplier_cost_usd:cost,shipping_verified:true,shipping_method:ship.method||null,shipping_usd:ship.shipping_usd,shipping_eta:ship.eta||null,taxes_verified:taxesVerified,tax_usd:ship.tax_usd,shadow_retail_floor_usd:floor,economics:econ,final_profit_verified:finalProfit,readiness_status:finalProfit?"COUNTRY_PASS":"PROFIT_REVIEW",status:finalProfit?"FRESH_FINAL_PASS":"HOLD",reason:finalProfit?null:(taxesVerified?(econ.gate==="REVIEW"?"PROFIT_REVIEW":"PROFIT_BLOCK"):"DESTINATION_TAX_NOT_VERIFIED")};
  }catch(e){return {...base,status:"RETRY",reason:"AUDIT_EXCEPTION",error:clean(e instanceof Error?e.message:String(e))};}
}

Deno.serve(async(req:Request)=>{
  if(!["GET","POST"].includes(req.method))return reply({error:"GET or POST required"},405);
  const db=clean(Deno.env.get("SUPABASE_DB_POOLER_URL")||Deno.env.get("SUPABASE_DB_URL"));
  if(!db)return reply({error:"server config missing"},500);
  const sql=postgres(db,{prepare:false,max:1,connect_timeout:10,idle_timeout:10,max_lifetime:180});
  try{
    const secRows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_underwear_catalog_token','hunt_eprolo_api_key','hunt_eprolo_api_secret')`;
    const sec=Object.fromEntries(secRows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(!sec.hunt_underwear_catalog_token||req.headers.get("x-hunt-internal-token")!==String(sec.hunt_underwear_catalog_token))return reply({error:"unauthorized"},401);
    const profile=(await sql`select * from public.hunt_profit_profiles where status='active' and owner_approved=true order by updated_at desc limit 1`)?.[0]||null;
    if(!profile)return reply({error:"PROFIT_PROFILE_NOT_ACTIVE",production_effect:false},500);

    if(req.method==="GET"){
      const u=new URL(req.url),itemId=clean(u.searchParams.get("item_id")),variantId=clean(u.searchParams.get("variant_id")),country=clean(u.searchParams.get("country")).toUpperCase();
      if(!itemId||!variantId||!/^[A-Z]{2}$/.test(country))return reply({error:"item_id, variant_id and ISO country required"},400);
      const row=(await sql`select item_id,title,source_payload->>'variant_id' as variant_id,source_payload->'profit_gate_v2'->>'target_retail_usd' as retail_usd from public.hunt_shelf_candidates where provider='EPROLO' and item_id=${itemId} limit 1`)?.[0];
      if(!row)return reply({item_id:itemId,variant_id:variantId,country,status:"HOLD",reason:"CANDIDATE_NOT_FOUND",production_effect:false},404);
      row.variant_id=variantId;
      return reply(await auditOne(row,country,profile,String(sec.hunt_eprolo_api_key||""),String(sec.hunt_eprolo_api_secret||"")));
    }

    const body=await req.json().catch(()=>({})),offset=Math.max(0,Number(body?.offset||0)||0),batchSize=Math.max(1,Math.min(25,Number(body?.batch_size||25)||25)),country=(clean(body?.country)||"IL").toUpperCase();
    if(!/^[A-Z]{2}$/.test(country))return reply({error:"ISO country required"},400);
    const rows=await sql`
      with latest_qa as (
        select distinct on (provider,item_id) provider,item_id,qa_status,http_status,variant_count,availability_verified,retail_price_verified
        from private.hunt_pdp_qa_runs where provider='EPROLO'
        order by provider,item_id,coalesce(checked_at,requested_at) desc,id desc
      )
      select c.item_id,c.title,c.source_payload->>'variant_id' as variant_id,c.source_payload->'profit_gate_v2'->>'target_retail_usd' as retail_usd,c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf' as shelf
      from public.hunt_shelf_candidates c join latest_qa q using(provider,item_id)
      where c.provider='EPROLO' and c.production_effect=false and c.availability_verified=true and coalesce(c.verified_inventory,0)>0
        and nullif(trim(c.source_payload->>'variant_id'),'') is not null and coalesce(c.source_payload->>'catalog_safety_status','')='PASS'
        and coalesce(c.source_payload->>'image_technical_status','')='PASS' and lower(coalesce(c.source_payload->>'latest_market5_all_pass','false'))='true'
        and coalesce(c.source_payload->'taxonomy_gate_v2'->>'status','')='REMAP' and coalesce(c.source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
        and coalesce((c.source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0 and coalesce((c.source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
        and c.candidate_status in ('MARKET5_READY_STYLE_PHYSICAL_PENDING','MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING','MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED')
        and c.source_payload->'pdp_detail_gate'->>'status'='PASS' and coalesce((c.source_payload->'pdp_detail_gate'->>'http_status')::int,0)=200
        and q.qa_status='PASS' and coalesce(q.http_status,0)=200 and coalesce(q.variant_count,0)>=1 and coalesce(q.availability_verified,false)=true and coalesce(q.retail_price_verified,false)=true
        and coalesce(c.image_url,'') like 'https://%' order by c.item_id limit 1000
    `;
    const core=rows.filter((r:any)=>!taxonomyConflict(clean(r.title),clean(r.shelf))),slice=core.slice(offset,offset+batchSize);
    const results=await workerPool(slice,3,(row:any)=>auditOne(row,country,profile,String(sec.hunt_eprolo_api_key||""),String(sec.hunt_eprolo_api_secret||"")));
    const summary={selected:results.length,fresh_final_pass:results.filter((x:any)=>x.status==="FRESH_FINAL_PASS").length,hold:results.filter((x:any)=>x.status==="HOLD").length,retry:results.filter((x:any)=>x.status==="RETRY").length,out_of_stock:results.filter((x:any)=>x.status==="OUT_OF_STOCK").length,no_shipping:results.filter((x:any)=>x.reason==="NO_VERIFIED_SHIPPING").length,tax_unverified:results.filter((x:any)=>x.reason==="DESTINATION_TAX_NOT_VERIFIED").length,profit_review:results.filter((x:any)=>x.reason==="PROFIT_REVIEW").length,profit_block:results.filter((x:any)=>x.reason==="PROFIT_BLOCK").length,exact_variant_missing:results.filter((x:any)=>x.reason==="EXACT_VARIANT_NOT_RETURNED").length};
    return reply({checked_at:new Date().toISOString(),provider:"EPROLO",mode:"BATCH_SHADOW_READONLY",country,canonical_core_total:core.length,offset,batch_size:batchSize,summary,results,production_effect:false,sellable:false,writes:false});
  }catch(e){return reply({ok:false,error:e instanceof Error?e.message:String(e),production_effect:false,sellable:false},500);}
  finally{await sql.end({timeout:2}).catch(()=>{});}
});