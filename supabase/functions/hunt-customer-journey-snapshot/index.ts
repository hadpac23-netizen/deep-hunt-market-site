import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BASE=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const supabase=createClient(BASE,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});

const clean=(v:unknown)=>String(v??"").trim();
const n=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://localhost:18977",
    "http://127.0.0.1:18977",
    "http://localhost:8767",
    "http://127.0.0.1:8767"
  ]);
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":allowed.has(origin)||preview?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"authorization, apikey, content-type",
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,data:unknown,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}
  });
}
async function requireAdmin(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return null;
  const {data:{user},error}=await supabase.auth.getUser(token);
  if(error||!user?.id)return null;
  const {data:profile}=await supabase.from("profiles").select("is_admin").eq("id",user.id).maybeSingle();
  return profile?.is_admin===true?user:null;
}
function activeRow(row:any){
  return ["unique_sessions","product_views","likes","saves","add_to_cart","checkout_starts","checkout_market_selections"]
    .some(k=>n(row?.[k])>0);
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="GET")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  const admin=await requireAdmin(req);
  if(!admin)return json(req,{error:"Admin access required"},403);

  try{
    const url=new URL(req.url);
    const days=clamp(Number(url.searchParams.get("days")||7),1,30);
    const cutoff=new Date(Date.now()-days*86400000).toISOString();

    const [{data:metrics,error:metricsError},{data:orders,error:ordersError},{data:attribution,error:attributionError}]=await Promise.all([
      supabase.from("hunt_daily_owner_metrics")
        .select("day,unique_sessions,page_views,product_views,likes,saves,add_to_cart,checkout_starts,checkout_market_selections,orders,gross_order_value")
        .order("day",{ascending:false})
        .limit(days),
      supabase.from("hunt_orders")
        .select("id,user_id,status,total_amount,currency,is_test,placed_at,updated_at")
        .gte("updated_at",cutoff)
        .order("updated_at",{ascending:false})
        .limit(2000),
      supabase.from("hunt_attribution_ledger")
        .select("order_id,purchase_status,purchase_confirmed_at,conversion_claim_allowed,updated_at")
        .eq("conversion_claim_allowed",true)
        .not("purchase_confirmed_at","is",null)
        .gte("updated_at",cutoff)
        .order("updated_at",{ascending:false})
        .limit(2000)
    ]);
    if(metricsError)throw metricsError;
    if(ordersError)throw ordersError;
    if(attributionError)throw attributionError;

    const rows=Array.isArray(metrics)?metrics:[];
    const orderRows=Array.isArray(orders)?orders:[];
    const attribRows=Array.isArray(attribution)?attribution:[];

    const confirmedIds=new Set(
      attribRows.filter((x:any)=>x?.conversion_claim_allowed===true&&x?.purchase_confirmed_at&&x?.order_id)
        .map((x:any)=>String(x.order_id))
    );
    const confirmedReal=orderRows.filter((x:any)=>x?.is_test===false&&confirmedIds.has(String(x.id)));
    const testOrders=orderRows.filter((x:any)=>x?.is_test===true);

    const buyerIdentities=new Set<string>();
    const signedInCounts=new Map<string,number>();
    for(const order of confirmedReal){
      const uid=clean(order?.user_id);
      buyerIdentities.add(uid||("order:"+String(order.id)));
      if(uid)signedInCounts.set(uid,(signedInCounts.get(uid)||0)+1);
    }
    const repeatBuyers=[...signedInCounts.values()].filter(count=>count>=2).length;

    const sum=(key:string)=>rows.reduce((total:number,row:any)=>total+n(row?.[key]),0);
    const latestActivity=rows.find(activeRow)||null;
    const metricOrders=sum("orders");
    const realOrderValue=confirmedReal.reduce((total:number,row:any)=>total+n(row?.total_amount),0);

    return json(req,{
      ok:true,
      generated_at:new Date().toISOString(),
      timezone:"Asia/Jerusalem",
      window_days:days,
      source:"hunt_daily_owner_metrics + hunt_orders + hunt_attribution_ledger",
      stages:{
        sessions:sum("unique_sessions"),
        product_views:sum("product_views"),
        engagement:sum("likes")+sum("saves"),
        saves:sum("saves"),
        likes:sum("likes"),
        cart:sum("add_to_cart"),
        checkout:sum("checkout_starts"),
        buyer:buyerIdentities.size,
        repeat:repeatBuyers
      },
      purchase_truth:{
        confirmed_orders:confirmedReal.length,
        confirmed_buyers:buyerIdentities.size,
        repeat_buyers:repeatBuyers,
        real_order_value:Number(realOrderValue.toFixed(2)),
        test_orders_excluded:testOrders.length,
        legacy_metric_orders:metricOrders,
        test_contamination_detected:metricOrders>0&&confirmedReal.length===0&&testOrders.length>0,
        confirmation_rule:"conversion_claim_allowed=true + purchase_confirmed_at + is_test=false"
      },
      freshness:{
        latest_activity_day:latestActivity?.day||null,
        latest_metric_day:rows[0]?.day||null
      },
      notes:[
        "Stage counts before Buyer are tracked events / daily-session aggregates and are not unique people across the whole window.",
        "Buyer and Repeat use server-side purchase confirmation only.",
        "Test orders never count as Buyer or Repeat."
      ]
    });
  }catch(error){
    return json(req,{ok:false,error:clean((error as Error)?.message)||"CUSTOMER_JOURNEY_SNAPSHOT_FAILED"},500);
  }
});