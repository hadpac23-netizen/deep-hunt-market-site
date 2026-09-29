import postgres from "npm:postgres@3.4.5";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{"content-type":"application/json","cache-control":"no-store"}
});
const BASE=clean(Deno.env.get("SUPABASE_URL"));
const PUBLIC_KEY=clean(Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||Deno.env.get("SUPABASE_ANON_KEY"))||
  "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const EPROLO_INTERNAL_TOKEN=clean(Deno.env.get("HUNT_EPROLO_INTERNAL_TOKEN"));

let sqlClient:ReturnType<typeof postgres>|null=null;
function sql(){
  if(sqlClient)return sqlClient;
  const db=clean(Deno.env.get("SUPABASE_DB_POOLER_URL")||Deno.env.get("SUPABASE_DB_URL"));
  if(!db)throw new Error("DB_URL_MISSING");
  sqlClient=postgres(db,{prepare:false,max:1,connect_timeout:10,idle_timeout:20,max_lifetime:600});
  return sqlClient;
}
function taxonomyConflict(title:string,shelf:string){
  const t=title.toLowerCase(),s=shelf.toLowerCase();
  const phone=(/\b(iphone.{0,24}case|phone case|samsung.{0,24}case|galaxy.{0,24}case)\b/i.test(t)
    && !/\b(key\s?chain|keychain|bag pendant|passport|document case|card holder)\b/i.test(t));
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
async function profile(){
  const rows=await sql()`
    select payment_rate,refund_reserve_rate,platform_variable_rate,platform_fixed_per_order,
           min_contribution_per_unit,min_margin_rate
    from public.hunt_profit_profiles
    where status='active' and owner_approved=true
    order by updated_at desc
    limit 1
  `;
  if(!rows?.[0])throw new Error("PROFIT_PROFILE_MISSING");
  return rows[0];
}
function economics(p:any,retail:number,cost:number,shipping:number){
  const pay=Math.max(0,Number(p.payment_rate||0));
  const refund=Math.max(0,Number(p.refund_reserve_rate||0));
  const variable=Math.max(0,Number(p.platform_variable_rate||0));
  const fixed=Math.max(0,Number(p.platform_fixed_per_order||0));
  const gross=retail+shipping;
  const contribution=gross-cost-shipping-(gross*pay)-(gross*refund)-(gross*variable)-fixed;
  const margin=retail>0?contribution/retail:0;
  const minContribution=Math.max(0,Number(p.min_contribution_per_unit||0));
  const minMargin=Math.max(0,Number(p.min_margin_rate||0));
  return {
    contribution:Number(contribution.toFixed(2)),
    margin:Number(margin.toFixed(4)),
    required_contribution:Number(minContribution.toFixed(2)),
    min_margin:Number(minMargin.toFixed(4)),
    gate:contribution+0.0001>=minContribution&&margin+0.0001>=minMargin?"PASS":contribution>0?"REVIEW":"BLOCK",
    destination_tax_verified:false,
    final_profit_verified:false
  };
}
async function cjCandidates(limit:number,offset:number){
  return await sql()`
    select item_id,title,image_url,verified_inventory,source_payload,
           source_payload->>'variant_id' as variant_id,
           source_payload->'profit_gate_v2'->>'target_retail_usd' as retail_usd,
           source_payload->'taxonomy_gate_v2'->>'canonical_shelf' as shelf
    from public.hunt_shelf_candidates
    where provider='CJdropshipping'
      and production_effect=false
      and candidate_status='PARTIAL_MARKET_READY'
      and nullif(trim(source_payload->>'variant_id'),'') is not null
      and coalesce(source_payload->>'image_technical_status','')='PASS'
      and coalesce(source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
      and coalesce((source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
      and coalesce((source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
    order by item_id
    limit ${limit} offset ${offset}
  `;
}
async function eproloCandidates(limit:number,offset:number){
  const rows=await sql()`
    with latest_qa as (
      select distinct on (provider,item_id)
             provider,item_id,qa_status,http_status,variant_count,
             availability_verified,retail_price_verified
      from private.hunt_pdp_qa_runs
      where provider='EPROLO'
      order by provider,item_id,coalesce(checked_at,requested_at) desc,id desc
    )
    select c.item_id,c.title,c.image_url,c.source_payload,
           c.source_payload->>'variant_id' as variant_id,
           c.source_payload->'profit_gate_v2'->>'target_retail_usd' as retail_usd,
           c.source_payload->'taxonomy_gate_v2'->>'canonical_shelf' as shelf,
           q.qa_status,q.http_status as qa_http_status,q.variant_count as qa_variant_count,
           q.availability_verified as qa_availability_verified,
           q.retail_price_verified as qa_retail_price_verified
    from public.hunt_shelf_candidates c
    join latest_qa q using(provider,item_id)
    where c.provider='EPROLO'
      and c.production_effect=false
      and c.availability_verified=true
      and coalesce(c.verified_inventory,0)>0
      and nullif(trim(c.source_payload->>'variant_id'),'') is not null
      and coalesce(c.source_payload->>'catalog_safety_status','')='PASS'
      and coalesce(c.source_payload->>'image_technical_status','')='PASS'
      and lower(coalesce(c.source_payload->>'latest_market5_all_pass','false'))='true'
      and coalesce(c.source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
      and coalesce(c.source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
      and coalesce((c.source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
      and coalesce((c.source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
      and c.candidate_status in (
        'MARKET5_READY_STYLE_PHYSICAL_PENDING',
        'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
        'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
      )
      and c.source_payload->'pdp_detail_gate'->>'status'='PASS'
      and coalesce((c.source_payload->'pdp_detail_gate'->>'http_status')::int,0)=200
      and q.qa_status='PASS' and coalesce(q.http_status,0)=200
      and coalesce(q.variant_count,0)>=1
      and coalesce(q.availability_verified,false)=true
      and coalesce(q.retail_price_verified,false)=true
      and coalesce(c.image_url,'') like 'https://%'
    order by c.item_id
    limit ${Math.min(1000,Math.max(limit*3,limit))} offset ${offset}
  `;
  return rows.filter((r:any)=>!taxonomyConflict(clean(r.title),clean(r.shelf))).slice(0,limit);
}
async function edgeGet(path:string,params:Record<string,string>,extraHeaders:Record<string,string>={}){
  const u=new URL(BASE+"/functions/v1/"+path);
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
  const res=await fetch(u,{headers:{apikey:PUBLIC_KEY,accept:"application/json",...extraHeaders},signal:AbortSignal.timeout(25000)});
  return {http:res.status,body:await res.json().catch(()=>({}))};
}
async function cjRefresh(row:any,country:string,p:any){
  const itemId=clean(row.item_id),variantId=clean(row.variant_id);
  const [detail,quote]=await Promise.all([
    edgeGet("hunt-storefront",{provider:"CJdropshipping",product_id:itemId}),
    edgeGet("hunt-cj-quote",{vid:variantId,country_code:country,quantity:"1"})
  ]);
  const variants=Array.isArray(detail.body?.product?.variants)?detail.body.product.variants:[];
  const exact=variants.find((v:any)=>clean(v?.variant_id)===variantId)||null;
  const cost=num(exact?.price_amount);
  const shippingOptions=Array.isArray(quote.body?.shipping_options)?quote.body.shipping_options:[];
  const shipping=shippingOptions.length?num(shippingOptions[0]?.price_usd):null;
  const retail=num(row.retail_usd);
  let classification="RETRY",reason="CJ_FRESH_TRUTH_UNVERIFIED";
  if(detail.http===200&&quote.http===200&&quote.body?.stock_verified===true){
    if(quote.body?.stock_available!==true){classification="HOLD";reason="OUT_OF_STOCK";}
    else if(quote.body?.shipping_verified!==true||!shippingOptions.length||shipping===null){classification="HOLD";reason="NO_SHIPPING";}
    else if(!(cost&&cost>0)){classification="RETRY";reason="SUPPLIER_COST_UNVERIFIED";}
    else if(!(retail&&retail>0)){classification="HOLD";reason="RETAIL_PRICE_UNVERIFIED";}
    else{
      const econ=economics(p,retail,cost,shipping);
      classification=econ.gate==="PASS"?"FRESH_PRETAX_PASS":"HOLD";
      reason=econ.gate==="PASS"?"OK":econ.gate==="REVIEW"?"PROFIT_REVIEW":"PROFIT_BLOCK";
      return {classification,reason,item_id:itemId,variant_id:variantId,country,
        retail_usd:retail,supplier_cost_usd:cost,shipping_usd:shipping,
        stock_verified:true,stock_available:true,shipping_verified:true,
        shipping_method:clean(shippingOptions[0]?.name),selected_origin:quote.body?.selected_origin||null,
        economics:econ,http:{detail:detail.http,quote:quote.http}};
    }
  }
  return {classification,reason,item_id:itemId,variant_id:variantId,country,
    retail_usd:retail,supplier_cost_usd:cost,shipping_usd:shipping,
    stock_verified:quote.body?.stock_verified===true,stock_available:quote.body?.stock_available===true,
    shipping_verified:quote.body?.shipping_verified===true&&shippingOptions.length>0,
    shipping_method:clean(shippingOptions[0]?.name),selected_origin:quote.body?.selected_origin||null,
    economics:null,http:{detail:detail.http,quote:quote.http}};
}
async function eproloRefresh(row:any,country:string,p:any){
  const itemId=clean(row.item_id),variantId=clean(row.variant_id);
  if(!EPROLO_INTERNAL_TOKEN)throw new Error("EPROLO_INTERNAL_TOKEN_MISSING");
  const res=await edgeGet("hunt-eprolo-country-shadow",{item_id:itemId,variant_id:variantId,country},{"x-hunt-internal-token":EPROLO_INTERNAL_TOKEN});
  const b=res.body||{};
  const cost=num(b.supplier_cost_usd),shipping=num(b.shipping_usd),retail=num(row.retail_usd);
  let classification="RETRY",reason=clean(b.reason)||"EPROLO_FRESH_TRUTH_UNVERIFIED";
  if(res.http===200&&b.fresh_variant_truth===true&&b.stock_verified===true){
    if(b.stock_available!==true){classification="HOLD";reason="OUT_OF_STOCK";}
    else if(b.shipping_verified!==true||shipping===null){classification="HOLD";reason="NO_SHIPPING";}
    else if(!(cost&&cost>0)){classification="RETRY";reason="SUPPLIER_COST_UNVERIFIED";}
    else if(!(retail&&retail>0)){classification="HOLD";reason="RETAIL_PRICE_UNVERIFIED";}
    else{
      const econ=economics(p,retail,cost,shipping);
      classification=econ.gate==="PASS"?"FRESH_PRETAX_PASS":"HOLD";
      reason=econ.gate==="PASS"?"OK":econ.gate==="REVIEW"?"PROFIT_REVIEW":"PROFIT_BLOCK";
      return {classification,reason,item_id:itemId,variant_id:variantId,country,
        retail_usd:retail,supplier_cost_usd:cost,shipping_usd:shipping,
        stock_verified:true,stock_available:true,inventory_quantity:num(b.inventory_quantity),
        shipping_verified:true,shipping_method:clean(b.shipping_method),
        economics:econ,http:{country_shadow:res.http}};
    }
  }
  return {classification,reason,item_id:itemId,variant_id:variantId,country,
    retail_usd:retail,supplier_cost_usd:cost,shipping_usd:shipping,
    stock_verified:b.stock_verified===true,stock_available:b.stock_available===true,
    inventory_quantity:num(b.inventory_quantity),shipping_verified:b.shipping_verified===true,
    shipping_method:clean(b.shipping_method),economics:null,http:{country_shadow:res.http}};
}
async function persistObservation(provider:string,result:any){
  const now=new Date().toISOString();
  await sql()`
    insert into public.hunt_product_observations
      (provider,item_id,observation_type,price_amount,currency,availability_verified,
       shipping_amount,destination_country,payload,observed_at)
    values (
      ${provider},${result.item_id},'freshness',${result.retail_usd},'USD',
      ${result.stock_verified===true&&result.stock_available===true},
      ${result.shipping_usd},${result.country},
      ${sql().json({
        runner:"hunt-freshness-shadow-runner-v1",
        variant_id:result.variant_id,
        classification:result.classification,
        reason:result.reason,
        supplier_cost_usd:result.supplier_cost_usd,
        stock_verified:result.stock_verified,
        stock_available:result.stock_available,
        inventory_quantity:result.inventory_quantity??null,
        shipping_verified:result.shipping_verified,
        shipping_method:result.shipping_method||null,
        selected_origin:result.selected_origin||null,
        economics:result.economics,
        destination_tax_verified:false,
        final_profit_verified:false,
        http:result.http,
        production_effect:false
      })},
      ${now}
    )
  `;
}
async function syncException(provider:string,result:any){
  const activeReasons=["OUT_OF_STOCK","NO_SHIPPING","SUPPLIER_COST_UNVERIFIED","RETAIL_PRICE_UNVERIFIED","PROFIT_REVIEW","PROFIT_BLOCK"];
  const retryReason=result.classification==="RETRY"?"SUPPLIER_API_RETRY":null;
  const reason=retryReason||(activeReasons.includes(result.reason)?result.reason:null);
  const entityId=clean(result.variant_id)||clean(result.item_id);
  if(result.classification==="FRESH_PRETAX_PASS"){
    await sql()`
      update private.hunt_ops_exceptions
      set status='resolved',resolved_at=now(),resolution='Freshness runner PASS',
          last_checked_at=now(),updated_at=now()
      where entity_type='variant' and entity_id=${entityId}
        and coalesce(provider,'')=${provider}
        and coalesce(destination_country,'')=${result.country}
        and reason_code in ('OUT_OF_STOCK','NO_SHIPPING','SUPPLIER_COST_UNVERIFIED',
                            'RETAIL_PRICE_UNVERIFIED','PROFIT_REVIEW','PROFIT_BLOCK','SUPPLIER_API_RETRY')
        and status<>'resolved'
    `;
    return;
  }
  if(!reason)return;
  const severity=result.classification==="RETRY"?"warning":(reason==="OUT_OF_STOCK"||reason==="NO_SHIPPING"?"warning":"critical");
  const ownerRole=result.classification==="RETRY"?"developer":"operations";
  await sql()`
    insert into private.hunt_ops_exceptions
      (entity_type,entity_id,provider,destination_country,reason_code,severity,owner_role,status,
       opened_at,last_checked_at,evidence,created_at,updated_at)
    values ('variant',${entityId},${provider},${result.country},${reason},${severity},${ownerRole},'open',
            now(),now(),${sql().json({...result,production_effect:false})},now(),now())
    on conflict (entity_type,entity_id,coalesce(provider,''),coalesce(destination_country,''),reason_code)
    where status <> 'resolved'
    do update set
      severity=excluded.severity,
      owner_role=excluded.owner_role,
      last_checked_at=now(),
      evidence=excluded.evidence,
      updated_at=now()
  `;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({error:"method not allowed"},405);
  const secret=clean(Deno.env.get("HUNT_FRESHNESS_SHADOW_SECRET"));
  if(!secret||req.headers.get("x-hunt-freshness-secret")!==secret)return json({error:"unauthorized"},401);
  if(!BASE)return json({error:"SUPABASE_URL_MISSING"},500);

  const body=await req.json().catch(()=>({}));
  const provider=clean(body?.provider)||"all";
  const country=(clean(body?.country)||"IL").toUpperCase();
  const batchSize=Math.max(1,Math.min(25,Number(body?.batch_size||10)||10));
  const offset=Math.max(0,Number(body?.offset||0)||0);
  const persist=body?.persist===true;
  if(!["all","CJdropshipping","EPROLO"].includes(provider))return json({error:"invalid provider"},400);
  if(!/^[A-Z]{2}$/.test(country))return json({error:"invalid country"},400);

  const p=await profile();
  const work:any[]=[];
  if(provider==="all"||provider==="CJdropshipping"){
    const rows=await cjCandidates(batchSize,offset);
    for(const row of rows)work.push({provider:"CJdropshipping",row});
  }
  if(provider==="all"||provider==="EPROLO"){
    const rows=await eproloCandidates(batchSize,offset);
    for(const row of rows)work.push({provider:"EPROLO",row});
  }

  const results:any[]=[];
  for(const task of work){
    let result:any;
    try{
      result=task.provider==="CJdropshipping"
        ?await cjRefresh(task.row,country,p)
        :await eproloRefresh(task.row,country,p);
    }catch(error){
      result={
        classification:"RETRY",reason:"RUNNER_EXCEPTION",
        item_id:clean(task.row.item_id),variant_id:clean(task.row.variant_id),country,
        stock_verified:false,stock_available:false,shipping_verified:false,
        economics:null,error:clean(error instanceof Error?error.message:String(error))
      };
    }
    results.push({provider:task.provider,...result});
    if(persist){
      try{
        await persistObservation(task.provider,result);
        await syncException(task.provider,result);
      }catch(e){
        results[results.length-1].persist_error=clean(e instanceof Error?e.message:String(e));
      }
    }
  }

  const counts={
    fresh_pass:results.filter(x=>x.classification==="FRESH_PRETAX_PASS").length,
    hold:results.filter(x=>x.classification==="HOLD").length,
    retry:results.filter(x=>x.classification==="RETRY").length
  };
  return json({
    ok:true,mode:persist?"SHADOW_PERSIST":"DRY_RUN",country,batch_size:batchSize,offset,
    providers:provider==="all"?["CJdropshipping","EPROLO"]:[provider],
    selected:results.length,counts,results,
    payment_changed:false,supplier_order_changed:false,catalog_visibility_changed:false,
    sellable_changed:false,production_effect:false
  });
});
