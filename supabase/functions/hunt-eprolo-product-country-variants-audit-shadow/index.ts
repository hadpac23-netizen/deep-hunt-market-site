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
  const r=await fetch(u,{headers:{"apiKey":k,"Accept":"application/json","User-Agent":"HUNT-EPROLO-PRODUCT-COUNTRY-VARIANTS/1.0"},signal:AbortSignal.timeout(25000)});
  return {http:r.status,body:await r.json().catch(()=>null)};
}
function vid(v:any){
  return [v?.id,v?.variantsid,v?.variantId,v?.variant_id,v?.variants_id,v?.sku].map((x:any)=>String(x??"")).find(Boolean)||"";
}
function options(v:any){
  const out:any[]=[];
  for(const l of (v?.logistics_cost_list||[]))for(const x of (l?.cost_list||[])){
    const c=num(x?.cost); if(c===null||c<0)continue;
    const tax=num(x?.taxesFee ?? x?.tax_fee ?? x?.tax ?? x?.taxes);
    out.push({shipping_usd:Math.round(c*100)/100,method:String(x?.ship_method||""),eta:String(x?.shiptime||""),tax_usd:tax===null?null:Math.round(tax*100)/100});
  }
  out.sort((a,b)=>a.shipping_usd-b.shipping_usd);
  return out;
}
function customsTruth(source:any,variantId:string,country:string){
  const root=source?.customs_truth_v1||{};
  const variants=root?.variants&&typeof root.variants==="object"?root.variants:{};
  const direct=clean(root?.variant_id)===variantId?root:null;
  const node=(variants&&variants[variantId])||direct||null;
  const origin=clean(node?.country_of_origin).toUpperCase();
  const originVerified=Boolean(node&&node.country_of_origin_verified===true&&/^[A-Z]{2}$/.test(origin));
  const market=node?.markets&&typeof node.markets==="object"?node.markets[country]:null;
  const landedCostVerified=Boolean(market&&market.landed_cost_verified===true);
  const dutyTaxUsd=landedCostVerified?num(market?.duty_tax_usd):null;
  const destinationTaxDutyVerified=Boolean(landedCostVerified&&dutyTaxUsd!==null&&dutyTaxUsd>=0);
  return {country_of_origin:origin||null,country_of_origin_verified:originVerified,landed_cost_verified:landedCostVerified,destination_tax_duty_verified:destinationTaxDutyVerified,duty_tax_usd:destinationTaxDutyVerified?Number(dutyTaxUsd):null};
}
function econ(p:any,sale:number,cost:number,ship:number,tax:number){
  const pay=Math.max(0,Number(p?.payment_rate||0.04)),ref=Math.max(0,Number(p?.refund_reserve_rate||0.05)),vr=Math.max(0,Number(p?.platform_variable_rate||0)),fixed=Math.max(0,Number(p?.platform_fixed_per_order||0)),minC=Math.max(0,Number(p?.min_contribution_per_unit||4)),minM=Math.max(0,Number(p?.min_margin_rate||0.20)),r=pay+ref+vr;
  const gross=sale+ship,contribution=gross-cost-ship-tax-(gross*r)-fixed,margin=sale>0?contribution/sale:0;
  return {contribution:Number(contribution.toFixed(2)),margin:Number(margin.toFixed(4)),gate:contribution>=minC&&margin>=minM?"PASS":contribution>0?"REVIEW":"BLOCK"};
}
function floorPrice(p:any,cost:number,ship:number,tax:number){
  const pay=Math.max(0,Number(p?.payment_rate||0.04)),ref=Math.max(0,Number(p?.refund_reserve_rate||0.05)),vr=Math.max(0,Number(p?.platform_variable_rate||0)),fixed=Math.max(0,Number(p?.platform_fixed_per_order||0)),minC=Math.max(0,Number(p?.min_contribution_per_unit||4)),minM=Math.max(0,Number(p?.min_margin_rate||0.20)),r=pay+ref+vr,c=cost+tax+fixed+r*ship;
  const cf=(minC+c)/(1-r),md=1-r-minM,mf=md>0?c/md:Infinity,f=Math.max(cf,mf),w=Math.ceil(f+0.01),charm=Number((w-0.01).toFixed(2));
  return charm+1e-9>=f?charm:Number((w+0.99).toFixed(2));
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return reply({error:"GET required"},405);
  const db=Deno.env.get("SUPABASE_DB_URL"); if(!db)return reply({error:"server config missing"},500);
  const sql=postgres(db,{prepare:false,max:1,connect_timeout:20,idle_timeout:3,max_lifetime:60});
  try{
    const secRows=await sql`select name,decrypted_secret from vault.decrypted_secrets where name in ('hunt_underwear_catalog_token','hunt_eprolo_api_key','hunt_eprolo_api_secret')`;
    const sec=Object.fromEntries(secRows.map((r:any)=>[r.name,r.decrypted_secret]));
    if(!sec.hunt_underwear_catalog_token || req.headers.get("x-hunt-internal-token")!==String(sec.hunt_underwear_catalog_token))return reply({error:"unauthorized"},401);

    const u=new URL(req.url),itemId=clean(u.searchParams.get("item_id")),country=clean(u.searchParams.get("country")).toUpperCase();
    if(!itemId||!/^[A-Z]{2}$/.test(country))return reply({error:"item_id and ISO country required"},400);

    const cand=await sql`select title,source_payload from public.hunt_shelf_candidates where provider='EPROLO' and item_id=${itemId} limit 1`;
    if(!cand?.[0])return reply({item_id:itemId,country,status:"HOLD",reason:"CANDIDATE_NOT_FOUND",production_effect:false},404);
    const profiles=await sql`select * from public.hunt_profit_profiles where status='active' and owner_approved=true order by updated_at desc limit 1`;
    if(!profiles?.[0])return reply({error:"PROFIT_PROFILE_NOT_ACTIVE",production_effect:false},500);
    const p=profiles[0];

    const q=await apiGet(String(sec.hunt_eprolo_api_key||""),String(sec.hunt_eprolo_api_secret||""),"get_product_shiping_fees.html",{productid:itemId,countrycode:country});
    if(q.http!==200||String(q.body?.code)!=="0")return reply({provider:"EPROLO",item_id:itemId,country,status:"HOLD",reason:"UPSTREAM_UNAVAILABLE",http:q.http,code:q.body?.code??null,production_effect:false});

    const list=Array.isArray(q.body?.data?.variantlist)?q.body.data.variantlist:[];
    const checkedAt=new Date().toISOString();
    const rows:any[]=[];
    for(const v of list.slice(0,250)){
      const variantId=vid(v),inventory=Math.max(0,Number(v?.inventory_quantity||0)),cost=num(v?.cost),opts=options(v),ship=opts[0]||null;
      let status="HOLD",reason:string|null=null,sale:number|null=null,economics:any=null,finalProfit=false,taxesVerified=false,taxUsd:number|null=null;
      let customs={country_of_origin:null as string|null,country_of_origin_verified:false,landed_cost_verified:false,destination_tax_duty_verified:false,duty_tax_usd:null as number|null};
      if(!variantId) {reason="VARIANT_ID_MISSING";}
      else if(!(cost!==null&&cost>0)){reason="NO_VARIANT_COST";}
      else if(inventory<1){status="OUT_OF_STOCK";reason="EXACT_VARIANT_ZERO_INVENTORY";}
      else if(!ship){reason="NO_VERIFIED_SHIPPING";}
      else {
        taxesVerified=ship.tax_usd!==null; taxUsd=ship.tax_usd;
        customs=customsTruth(cand[0].source_payload,variantId,country);
        const tax=customs.destination_tax_duty_verified?Number(customs.duty_tax_usd):0;
        sale=floorPrice(p,cost,ship.shipping_usd,tax);
        economics=econ(p,sale,cost,ship.shipping_usd,tax);
        finalProfit=customs.country_of_origin_verified&&customs.destination_tax_duty_verified&&economics.gate==="PASS";
        status=finalProfit?"COUNTRY_PASS":"PROFIT_REVIEW";
        reason=finalProfit?null:(!customs.country_of_origin_verified?"COUNTRY_OF_ORIGIN_NOT_VERIFIED":(!customs.destination_tax_duty_verified?"DESTINATION_TAX_NOT_VERIFIED":"ECONOMICS_NOT_PASS"));
      }
      rows.push({
        variant_id:variantId,variant_title:v?.title||null,color:v?.option1||null,size:v?.option2||null,
        inventory_quantity:inventory,stock_available:inventory>0,supplier_cost_usd:cost,
        shipping_verified:Boolean(ship),shipping_method:ship?.method||null,shipping_usd:ship?.shipping_usd??null,shipping_eta:ship?.eta||null,
        supplier_tax_observed:taxesVerified,supplier_tax_usd:taxUsd,...customs,shadow_retail_floor_usd:sale,economics,final_profit_verified:finalProfit,status,reason
      });
    }

    for(const x of rows){
      if(!x.variant_id)continue;
      await sql`
        insert into public.hunt_product_observations
        (provider,item_id,observation_type,price_amount,currency,availability_verified,shipping_amount,destination_country,payload,observed_at)
        values(
          'EPROLO',${itemId},'stock',${x.supplier_cost_usd},'USD',${x.stock_available&&x.shipping_verified},${x.shipping_usd},${country},
          ${sql.json({
            runner:"hunt-eprolo-product-country-variants-audit-shadow-v1",
            variant_id:x.variant_id,variant_title:x.variant_title,color:x.color,size:x.size,
            inventory_quantity:x.inventory_quantity,stock_available:x.stock_available,
            supplier_cost_usd:x.supplier_cost_usd,shipping_verified:x.shipping_verified,
            shipping_method:x.shipping_method,shipping_usd:x.shipping_usd,shipping_eta:x.shipping_eta,
            supplier_tax_observed:x.supplier_tax_observed,supplier_tax_usd:x.supplier_tax_usd,country_of_origin:x.country_of_origin,country_of_origin_verified:x.country_of_origin_verified,landed_cost_verified:x.landed_cost_verified,destination_tax_duty_verified:x.destination_tax_duty_verified,duty_tax_usd:x.duty_tax_usd,shadow_retail_floor_usd:x.shadow_retail_floor_usd,
            economics:x.economics,final_profit_verified:x.final_profit_verified,readiness_status:x.status,reason:x.reason,
            production_effect:false,sellable:false
          })},${checkedAt}::timestamptz
        )
      `;
      if(x.status==="OUT_OF_STOCK"||x.status==="HOLD"){
        const sev=x.status==="OUT_OF_STOCK"?"critical":"warning";
        await sql`
          insert into private.hunt_ops_exceptions
          (entity_type,entity_id,provider,destination_country,reason_code,severity,owner_role,status,last_checked_at,evidence,updated_at)
          values('variant',${x.variant_id},'EPROLO',${country},${x.reason||"VARIANT_HOLD"},${sev},'operations','open',now(),
          ${sql.json({item_id:itemId,checked_at:checkedAt,status:x.status,inventory_quantity:x.inventory_quantity,shipping_verified:x.shipping_verified})},now())
          on conflict (entity_type,entity_id,coalesce(provider,''),coalesce(destination_country,''),reason_code)
          where status <> 'resolved'
          do update set last_checked_at=now(),severity=excluded.severity,evidence=excluded.evidence,updated_at=now()
        `;
      }
    }

    const taxMissing=rows.filter(x=>x.reason==="DESTINATION_TAX_NOT_VERIFIED").length;
    const originMissing=rows.filter(x=>x.reason==="COUNTRY_OF_ORIGIN_NOT_VERIFIED").length;
    if(taxMissing>0){
      await sql`
        insert into private.hunt_ops_exceptions
        (entity_type,entity_id,provider,destination_country,reason_code,severity,owner_role,status,last_checked_at,evidence,updated_at)
        values('product',${itemId},'EPROLO',${country},'DESTINATION_TAX_NOT_VERIFIED','warning','operations_finance','open',now(),
        ${sql.json({item_id:itemId,checked_at:checkedAt,affected_variants:taxMissing,total_variants:rows.length})},now())
        on conflict (entity_type,entity_id,coalesce(provider,''),coalesce(destination_country,''),reason_code)
        where status <> 'resolved'
        do update set last_checked_at=now(),evidence=excluded.evidence,updated_at=now()
      `;
    } else if(rows.some(x=>x.destination_tax_duty_verified===true)) {
      await sql`
        update private.hunt_ops_exceptions
        set status='resolved',resolved_at=now(),resolution='Destination landed-cost/tax-duty evidence verified for audited variants',
            last_checked_at=now(),updated_at=now()
        where entity_type='product' and entity_id=${itemId} and provider='EPROLO'
          and destination_country=${country} and reason_code='DESTINATION_TAX_NOT_VERIFIED' and status<>'resolved'
      `;
    }
    if(originMissing>0){
      await sql`
        insert into private.hunt_ops_exceptions
        (entity_type,entity_id,provider,destination_country,reason_code,severity,owner_role,status,last_checked_at,evidence,updated_at)
        values('product',${itemId},'EPROLO',${country},'COUNTRY_OF_ORIGIN_NOT_VERIFIED','warning','operations_finance','open',now(),
        ${sql.json({item_id:itemId,checked_at:checkedAt,affected_variants:originMissing,total_variants:rows.length})},now())
        on conflict (entity_type,entity_id,coalesce(provider,''),coalesce(destination_country,''),reason_code)
        where status <> 'resolved'
        do update set last_checked_at=now(),evidence=excluded.evidence,updated_at=now()
      `;
    } else if(rows.some(x=>x.country_of_origin_verified===true)) {
      await sql`
        update private.hunt_ops_exceptions
        set status='resolved',resolved_at=now(),resolution='Exact-variant country of origin evidence verified',
            last_checked_at=now(),updated_at=now()
        where entity_type='product' and entity_id=${itemId} and provider='EPROLO'
          and destination_country=${country} and reason_code='COUNTRY_OF_ORIGIN_NOT_VERIFIED' and status<>'resolved'
      `;
    }

    const summary={
      total_variants:rows.length,
      stock_available:rows.filter(x=>x.stock_available).length,
      out_of_stock:rows.filter(x=>x.status==="OUT_OF_STOCK").length,
      shipping_verified:rows.filter(x=>x.shipping_verified).length,
      shipping_unverified:rows.filter(x=>!x.shipping_verified).length,
      final_profit_verified:rows.filter(x=>x.final_profit_verified).length,
      profit_review:rows.filter(x=>x.status==="PROFIT_REVIEW").length,
      holds:rows.filter(x=>x.status==="HOLD").length,
      destination_tax_missing:taxMissing,
      country_of_origin_missing:originMissing
    };

    return reply({checked_at:checkedAt,provider:"EPROLO",item_id:itemId,product_title:cand[0].title,country,summary,variants:rows,production_effect:false,sellable:false});
  }catch(e){
    return reply({ok:false,error:e instanceof Error?e.message:String(e),production_effect:false,sellable:false},500);
  }finally{await sql.end({timeout:1}).catch(()=>{});}
});