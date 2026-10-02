import { createSupabaseContext } from "npm:@supabase/server";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});

async function upsertException(db:any,row:any){
  const now=new Date().toISOString();
  let q=db.from("hunt_ops_exceptions")
    .select("id").eq("entity_type",row.entity_type).eq("entity_id",row.entity_id)
    .eq("reason_code",row.reason_code).neq("status","resolved");
  q=row.provider? q.eq("provider",row.provider):q.is("provider",null);
  q=row.destination_country? q.eq("destination_country",row.destination_country):q.is("destination_country",null);
  const {data:existing,error:readError}=await q.limit(1).maybeSingle();
  if(readError)throw new Error("EXCEPTION_READ_FAILED");
  if(existing?.id){
    const {error}=await db.from("hunt_ops_exceptions").update({
      severity:row.severity,owner_role:row.owner_role,last_checked_at:now,
      evidence:row.evidence,updated_at:now
    }).eq("id",existing.id);
    if(error)throw new Error("EXCEPTION_UPDATE_FAILED");
    return;
  }
  const {error}=await db.from("hunt_ops_exceptions").insert({
    ...row,status:"open",opened_at:now,last_checked_at:now,updated_at:now
  });
  if(error)throw new Error("EXCEPTION_INSERT_FAILED");
}
async function resolveException(db:any,filters:any,resolution:string){
  let q=db.from("hunt_ops_exceptions").update({
    status:"resolved",resolved_at:new Date().toISOString(),resolution,updated_at:new Date().toISOString()
  }).neq("status","resolved").eq("reason_code","SUPPLIER_DATA_STALE");
  for(const [k,v] of Object.entries(filters)){
    q=(k==="destination_country"&&v===null)?q.is(k,null):q.eq(k,v);
  }
  const {error}=await q;
  if(error)throw new Error("EXCEPTION_RESOLVE_FAILED");
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({error:"method not allowed"},405);
  const ctx=await createSupabaseContext(req,{auth:{required:false}});
  const secret=clean(Deno.env.get("HUNT_OPS_WATCH_SECRET"));
  if(!secret||req.headers.get("x-hunt-ops-watch-secret")!==secret)return json({error:"unauthorized"},401);

  const providers=["CJdropshipping","EPROLO"];
  const results:any[]=[];
  for(const provider of providers){
    const {data:policy,error:policyError}=await ctx.supabaseAdmin
      .schema("private").from("hunt_supplier_refresh_policy")
      .select("*").eq("provider",provider).maybeSingle();
    if(policyError||!policy){results.push({provider,status:"HOLD",reason:"REFRESH_POLICY_MISSING"});continue;}

    const staleAfter=Math.max(1,Number(policy.stale_after_minutes||90));
    const staleCutoff=new Date(Date.now()-staleAfter*60*1000).toISOString();

    const observations:any[]=[];
    const pageSize=1000,maxRows=100000;
    let scanComplete=false,scanError:string|null=null;
    for(let from=0;from<maxRows;from+=pageSize){
      const {data:page,error:obsError}=await ctx.supabaseAdmin
        .from("hunt_product_observations")
        .select("id,item_id,destination_country,availability_verified,payload,observed_at")
        .eq("provider",provider)
        .order("observed_at",{ascending:false})
        .order("id",{ascending:false})
        .range(from,from+pageSize-1);
      if(obsError){scanError="OBSERVATION_READ_FAILED";break;}
      observations.push(...(page||[]));
      if((page||[]).length<pageSize){scanComplete=true;break;}
    }
    if(!scanComplete){
      results.push({provider,status:"HOLD",reason:scanError||"OBSERVATION_SCAN_LIMIT",scanned_rows:observations.length,production_effect:false});
      continue;
    }

    const latest=new Map<string,any>();
    for(const o of observations){
      const variant=clean(o?.payload?.variant_id);
      const key=[o.item_id,variant,o.destination_country||""].join("|");
      if(!latest.has(key))latest.set(key,o);
    }

    let fresh=0,stale=0,unverified=0,shippingUnverified=0;
    for(const o of latest.values()){
      const isStale=!o.observed_at||o.observed_at<staleCutoff;
      const variant=clean(o?.payload?.variant_id);
      const entityId=variant||clean(o.item_id);
      const country=clean(o.destination_country);
      if(isStale){
        stale++;
        await upsertException(ctx.supabaseAdmin.schema("private"),{
          entity_type:variant?"variant":"product",entity_id:entityId,provider,destination_country:country||null,
          reason_code:"SUPPLIER_DATA_STALE",severity:"warning",owner_role:"operations",
          evidence:{item_id:o.item_id,variant_id:variant||null,observed_at:o.observed_at,stale_after_minutes:staleAfter,production_effect:false}
        });
      }else{
        fresh++;
        await resolveException(ctx.supabaseAdmin.schema("private"),{
          entity_type:variant?"variant":"product",entity_id:entityId,provider,
          destination_country:country||null
        },"Fresh supplier observation restored").catch(()=>{});
      }
      if(o.availability_verified!==true)unverified++;
      if(country&&o?.payload?.shipping_verified!==true)shippingUnverified++;
    }

    const {count:openCount,error:openCountError}=await ctx.supabaseAdmin.schema("private").from("hunt_ops_exceptions")
      .select("id",{count:"exact",head:true}).eq("provider",provider).neq("status","resolved");
    if(openCountError){
      results.push({provider,status:"HOLD",reason:"EXCEPTION_COUNT_READ_FAILED",production_effect:false});
      continue;
    }

    results.push({status:"PASS",
      provider,mode:policy.mode,stale_after_minutes:staleAfter,
      latest_variant_markets:latest.size,fresh,stale,availability_unverified:unverified,
      shipping_unverified:shippingUnverified,open_exceptions:openCount||0,
      failure_action:policy.failure_action,production_effect:false
    });
  }

  const {data:stuck,error:stuckError}=await ctx.supabaseAdmin.from("hunt_fulfillment_orders")
    .select("id,order_id,payment_session_id,provider,status,supplier_status,last_error,updated_at")
    .in("provider",providers)
    .in("status",["processing","submitted"])
    .lt("updated_at",new Date(Date.now()-30*60*1000).toISOString())
    .limit(200);
  if(stuckError){
    return json({ok:false,complete:false,mode:"SHADOW_WATCH",providers:results,reason:"STUCK_ORDER_READ_FAILED",
      payment_changed:false,supplier_order_changed:false,catalog_visibility_changed:false,production_effect:false},503);
  }

  for(const row of stuck||[]){
    await upsertException(ctx.supabaseAdmin.schema("private"),{
      entity_type:"order",entity_id:clean(row.order_id||row.payment_session_id||row.id),
      provider:row.provider,destination_country:null,reason_code:"ORDER_STUCK_OVER_30M",
      severity:"critical",owner_role:"operations",
      evidence:{fulfillment_id:row.id,payment_session_id:row.payment_session_id,supplier_status:row.supplier_status,last_error:row.last_error,updated_at:row.updated_at,production_effect:false}
    });
  }

  const complete=results.every(x=>x.status==="PASS");
  return json({ok:complete,complete,mode:"SHADOW_WATCH",providers:results,stuck_orders:(stuck||[]).length,
    payment_changed:false,supplier_order_changed:false,catalog_visibility_changed:false,production_effect:false},complete?200:503);
});
