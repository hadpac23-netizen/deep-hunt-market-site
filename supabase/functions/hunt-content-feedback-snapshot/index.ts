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
    "http://localhost:18977","http://127.0.0.1:18977",
    "http://localhost:8767","http://127.0.0.1:8767"
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
function canonicalCreativeKey(value:unknown){
  const s=clean(value);
  return /^creative:[0-9a-f-]{36}$/i.test(s)?s:"";
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(req.method!=="GET")return json(req,{error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json(req,{error:"server config missing"},500);
  const admin=await requireAdmin(req);
  if(!admin)return json(req,{error:"Admin access required"},403);

  try{
    const url=new URL(req.url);
    const days=clamp(Number(url.searchParams.get("days")||14),1,60);
    const cutoff=new Date(Date.now()-days*86400000).toISOString();

    const [
      {data:creative,error:creativeError},
      {data:distribution,error:distributionError},
      {data:attribution,error:attributionError},
      {data:finance,error:financeError},
      {data:learning,error:learningError},
      {data:experiments,error:experimentsError}
    ]=await Promise.all([
      supabase.from("hunt_creative_drafts")
        .select("id,experiment_id,provider,item_id,format,status,verified_product_relation,created_at,updated_at")
        .gte("updated_at",cutoff).limit(5000),
      supabase.from("hunt_distribution_drafts")
        .select("id,day,channel,provider,item_id,creative_format,utm_source,utm_medium,utm_campaign,utm_content,status,owner_approved,published_at,external_action_id,updated_at")
        .gte("updated_at",cutoff).limit(5000),
      supabase.from("hunt_attribution_ledger")
        .select("payment_session_id,order_id,context_status,first_utm_source,first_utm_medium,first_utm_campaign,last_utm_source,last_utm_medium,last_utm_campaign,purchase_status,purchase_confirmed_at,conversion_claim_allowed,updated_at")
        .gte("updated_at",cutoff).limit(5000),
      supabase.from("hunt_order_finance_ledger")
        .select("order_id,available_profit,contribution_locked,settlement_status,is_test,settled_at,updated_at")
        .gte("updated_at",cutoff).limit(5000),
      supabase.from("hunt_boom_learning_items")
        .select("id,learning_key,domain,status,confidence,last_evaluated_at,learned_at")
        .in("domain",["growth","creative","marketing","ads","content-feedback"])
        .order("learned_at",{ascending:false}).limit(500),
      supabase.from("hunt_marketing_experiments")
        .select("id,title,channel,paid,owner_approval_status,status,primary_kpi,min_sample_size,winner,updated_at")
        .order("updated_at",{ascending:false}).limit(500)
    ]);

    for(const err of [creativeError,distributionError,attributionError,financeError,learningError,experimentsError]){
      if(err)throw err;
    }

    const creatives=Array.isArray(creative)?creative:[];
    const distributions=Array.isArray(distribution)?distribution:[];
    const attributions=Array.isArray(attribution)?attribution:[];
    const finances=Array.isArray(finance)?finance:[];
    const learningRows=Array.isArray(learning)?learning:[];
    const experimentRows=Array.isArray(experiments)?experiments:[];

    const published=distributions.filter((x:any)=>x?.published_at&&x?.status!=="draft");
    const approved=distributions.filter((x:any)=>x?.owner_approved===true);
    const canonical=distributions.filter((x:any)=>canonicalCreativeKey(x?.utm_content));
    const attributed=attributions.filter((x:any)=>clean(x?.first_utm_campaign||x?.last_utm_campaign));
    const confirmed=attributions.filter((x:any)=>x?.conversion_claim_allowed===true&&x?.purchase_confirmed_at&&x?.order_id);
    const financeByOrder=new Map(
      finances.filter((x:any)=>x?.order_id&&x?.is_test===false).map((x:any)=>[String(x.order_id),x])
    );
    const confirmedWithProfit=confirmed.filter((x:any)=>{
      const row=financeByOrder.get(String(x.order_id));
      return row&&Number.isFinite(Number(row.available_profit));
    });
    const settledWithProfit=confirmedWithProfit.filter((x:any)=>{
      const row=financeByOrder.get(String(x.order_id));
      return row?.settled_at||["settled","final","paid_out","available"].includes(clean(row?.settlement_status).toLowerCase());
    });

    const campaignMap=new Map<string,any>();
    for(const row of distributions){
      const key=clean(row?.utm_campaign);
      if(!key)continue;
      const cur=campaignMap.get(key)||{
        campaign:key,drafts:0,published:0,approved:0,canonical_creative_ids:0,
        attributed_contexts:0,confirmed_purchases:0,profit_orders:0,available_profit:0
      };
      cur.drafts+=1;
      if(row?.published_at)cur.published+=1;
      if(row?.owner_approved===true)cur.approved+=1;
      if(canonicalCreativeKey(row?.utm_content))cur.canonical_creative_ids+=1;
      campaignMap.set(key,cur);
    }
    for(const row of attributions){
      const key=clean(row?.last_utm_campaign||row?.first_utm_campaign);
      if(!key)continue;
      const cur=campaignMap.get(key)||{
        campaign:key,drafts:0,published:0,approved:0,canonical_creative_ids:0,
        attributed_contexts:0,confirmed_purchases:0,profit_orders:0,available_profit:0
      };
      cur.attributed_contexts+=1;
      if(row?.conversion_claim_allowed===true&&row?.purchase_confirmed_at&&row?.order_id){
        cur.confirmed_purchases+=1;
        const fin:any=financeByOrder.get(String(row.order_id));
        if(fin&&Number.isFinite(Number(fin.available_profit))){
          cur.profit_orders+=1;
          cur.available_profit+=n(fin.available_profit);
        }
      }
      campaignMap.set(key,cur);
    }

    const campaigns=[...campaignMap.values()]
      .map(x=>({...x,available_profit:Number(n(x.available_profit).toFixed(2))}))
      .sort((a,b)=>b.available_profit-a.available_profit||b.confirmed_purchases-a.confirmed_purchases||b.attributed_contexts-a.attributed_contexts)
      .slice(0,100);

    const identityReady=published.length>0&&published.every((x:any)=>canonicalCreativeKey(x?.utm_content));
    const attributionReady=confirmed.length>0;
    const profitReady=settledWithProfit.length>0;
    const winnerEligible=identityReady&&attributionReady&&profitReady;

    const blockers:string[]=[];
    if(published.length===0)blockers.push("NO_PUBLISHED_DISTRIBUTION");
    if(!identityReady)blockers.push("CANONICAL_CREATIVE_ID_NOT_READY");
    if(attributed.length===0)blockers.push("NO_REAL_ATTRIBUTION_CONTEXT");
    if(confirmed.length===0)blockers.push("NO_CONFIRMED_ATTRIBUTED_PURCHASE");
    if(finances.filter((x:any)=>x?.is_test===false).length===0)blockers.push("NO_REAL_ORDER_FINANCE");
    if(!profitReady)blockers.push("NO_SETTLED_PROFIT_EVIDENCE");

    return json(req,{
      ok:true,
      generated_at:new Date().toISOString(),
      window_days:days,
      source:"creative_drafts + distribution_drafts + attribution_ledger + order_finance_ledger + learning",
      status:winnerEligible?"LEARNING_READY":"PREP",
      counts:{
        creative_drafts:creatives.length,
        verified_product_creatives:creatives.filter((x:any)=>x?.verified_product_relation===true).length,
        experiment_linked_creatives:creatives.filter((x:any)=>x?.experiment_id).length,
        marketing_experiments:experimentRows.length,
        distribution_drafts:distributions.length,
        distribution_approved:approved.length,
        distribution_published:published.length,
        canonical_creative_identity:canonical.length,
        attribution_contexts:attributed.length,
        confirmed_attributed_purchases:confirmed.length,
        profit_linked_orders:confirmedWithProfit.length,
        settled_profit_orders:settledWithProfit.length,
        learning_items:learningRows.length
      },
      readiness:{
        creative_identity_ready:identityReady,
        attribution_ready:attributionReady,
        profit_ready:profitReady,
        winner_eligible:winnerEligible
      },
      campaigns,
      blockers,
      rules:{
        canonical_utm_content:"creative:<creative_uuid>",
        winner_rule:"Published + canonical creative identity + confirmed attributed purchase + non-test settled profit evidence",
        revenue_only_winner:false,
        browser_purchase_winner:false,
        owner_gate_required:true
      }
    });
  }catch(error){
    return json(req,{ok:false,error:clean((error as Error)?.message)||"CONTENT_FEEDBACK_SNAPSHOT_FAILED"},500);
  }
});