import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { evaluateProfitGate, HUNT_COST_KEYS, PROFIT_CHANNELS } from "../_shared/hunt-profit-core.ts";

const env = (name:string) => (Deno.env.get(name) || "").trim();
const clean = (value:unknown) => typeof value === "string" ? value.trim() : "";
function json(data:unknown,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function secretKey(){
  try {
    const keys=JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}");
    return clean(keys?.default) || env("SUPABASE_SERVICE_ROLE_KEY");
  } catch {
    return env("SUPABASE_SERVICE_ROLE_KEY");
  }
}
function authorized(req:Request){
  const expected=env("HUNT_PROFIT_GATE_INTERNAL_TOKEN");
  const supplied=clean(req.headers.get("x-hunt-profit-token"));
  return Boolean(expected) && supplied === expected;
}
function db(){
  const url=env("SUPABASE_URL");
  const key=secretKey();
  if(!url || !key) throw new Error("Supabase secret environment is unavailable.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function persist(body:any,result:any){
  const client=db();
  const row={
    provider:clean(body?.provider) || "HUNT",
    item_id:clean(body?.item_id) || clean(body?.source_ref) || crypto.randomUUID(),
    market_code:clean(body?.market_code).toUpperCase() || null,
    channel:result.channel,
    currency:result.currency,
    ...result.costs,
    retail_price:money(body?.retail_price),
    affiliate_commission:money(body?.affiliate_commission),
    arena_success_fee:money(body?.arena_success_fee),
    gross_revenue:result.gross_revenue,
    contribution_profit:result.contribution_profit,
    contribution_margin_pct:result.contribution_margin_pct,
    minimum_profit_amount:result.minimum_profit_amount,
    minimum_margin_pct:result.minimum_margin_pct,
    inputs_complete:result.inputs_complete,
    gate_status:result.gate_status,
    evidence:body?.evidence || {},
    valid_until:clean(body?.valid_until) || null,
    updated_at:new Date().toISOString()
  };
  const {data,error}=await client.from("hunt_unit_economics_quotes")
    .insert(row).select("id,provider,item_id,channel,currency,gate_status,contribution_profit,contribution_margin_pct,valid_until,created_at").single();
  if(error) throw new Error(error.message);
  return data;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return json({error:"POST required"},405);
  if(!authorized(req)) return json({error:"unauthorized"},401);
  let body:any={};
  try { body=await req.json(); } catch {}

  if(body?.action==="status"){
    return json({ok:true,channels:[...PROFIT_CHANNELS],dry_run_default:true,cost_fields:HUNT_COST_KEYS});
  }
  if(body?.action!=="evaluate") return json({error:"supported action: evaluate"},400);

  try {
    const result=evaluateProfitGate(body,{
      minimum_profit_amount:env("HUNT_MIN_CONTRIBUTION_AMOUNT"),
      minimum_margin_pct:env("HUNT_MIN_CONTRIBUTION_MARGIN_PCT")
    });
    const dryRun=body?.dry_run !== false;
    const quote=!dryRun ? await persist(body,result) : null;
    return json({ok:true,dry_run:dryRun,result,quote});
  } catch(error) {
    return json({error:error instanceof Error ? error.message : "profit gate failed"},502);
  }
});
