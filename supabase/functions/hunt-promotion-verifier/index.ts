import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const env = (name:string) => (Deno.env.get(name) || "").trim();
const clean = (value:unknown) => typeof value === "string" ? value.trim() : "";
const num = (value:unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const ALLOWED_METHODS = new Set([
  "provider_api","authorized_storefront_test","merchant_checkout_test","internal_review"
]);
const DEAL_TYPES = new Set([
  "percent_off","amount_off","buy_x_get_y","bogo","bundle",
  "tiered","coupon","free_shipping","free_gift","combined"
]);
const MAX_OBSERVATION_AGE_MS = 48 * 60 * 60 * 1000;
const MAX_CHECKOUT_PROOF_AGE_MS = 24 * 60 * 60 * 1000;

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
  const expected=env("HUNT_PROMOTION_VERIFIER_INTERNAL_TOKEN");
  const supplied=clean(req.headers.get("x-hunt-verifier-token"));
  return Boolean(expected) && supplied === expected;
}
function db(){
  const url=env("SUPABASE_URL");
  const key=secretKey();
  if(!url || !key) throw new Error("Supabase secret environment is unavailable.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
function timestamp(value:unknown){
  const t=Date.parse(clean(value));
  return Number.isFinite(t) ? t : null;
}
function activeObservation(row:any,now=Date.now()){
  const start=timestamp(row?.valid_from);
  const end=timestamp(row?.valid_until);
  if(start !== null && start > now) return false;
  if(end !== null && end < now) return false;
  return true;
}
function sourceVerified(row:any,now=Date.now()){
  if(!clean(row?.source_url).startsWith("https://")) return false;
  const observed=timestamp(row?.observed_at);
  return observed !== null && now >= observed && now-observed <= MAX_OBSERVATION_AGE_MS;
}
function structureVerified(row:any){
  const type=clean(row?.deal_type).toLowerCase();
  if(!DEAL_TYPES.has(type)) return false;
  const buy=num(row?.buy_quantity);
  const get=num(row?.get_quantity);
  const pct=num(row?.reward_percent_off);
  const amount=num(row?.reward_amount_off);
  if(["buy_x_get_y","bogo"].includes(type)){
    return Boolean(buy && buy>0 && get && get>0 && ((pct && pct>0) || (amount && amount>0)));
  }
  if(type==="percent_off") return Boolean(pct && pct>0 && pct<=100);
  if(type==="amount_off") return Boolean(amount && amount>0);
  if(type==="coupon") return Boolean(clean(row?.coupon_code) || clean(row?.terms_text));
  if(type==="free_shipping") return row?.free_shipping === true;
  if(["bundle","tiered","free_gift","combined"].includes(type)) return Boolean(clean(row?.terms_text));
  return false;
}
function checkoutProof(body:any,method:string,now=Date.now()){
  const proof=body?.checkout_evidence || {};
  if(!["provider_api","authorized_storefront_test","merchant_checkout_test"].includes(method)){
    return {verified:false,landedCostComplete:false,observedTotal:null,currency:null,reason:"Checkout verification method is not eligible."};
  }
  const tested=timestamp(proof?.tested_at);
  const reference=clean(proof?.evidence_reference).slice(0,300);
  const total=num(proof?.observed_total);
  const currency=clean(proof?.currency).toUpperCase();
  const fresh=tested !== null && now>=tested && now-tested<=MAX_CHECKOUT_PROOF_AGE_MS;
  const verified=proof?.verified===true && proof?.checkout_effect_confirmed===true &&
    fresh && Boolean(reference) && total !== null && total>=0 && /^[A-Z]{3}$/.test(currency);
  const landedCostComplete=verified && proof?.landed_cost_complete===true;
  return {
    verified,
    landedCostComplete,
    observedTotal:verified?total:null,
    currency:verified?currency:null,
    reason:verified ? "Checkout effect reproduced with fresh evidence." : "Fresh checkout proof is incomplete."
  };
}
function missionFit(row:any,mission:any={}){
  const needed=num(mission?.quantity);
  const buy=num(row?.buy_quantity)||0;
  const get=num(row?.get_quantity)||0;
  const required=buy+get;
  const overbuy=needed !== null && needed>0 && required>0 && needed<required;
  return {quantity_needed:needed,required_cart_quantity:required||null,overbuy_required:overbuy};
}
function comparisonState(body:any){
  const c=body?.comparison_evidence || {};
  return {
    bestVerified:c?.best_verified_option===true && Boolean(clean(c?.comparison_reference)),
    alternativeBetter:c?.alternative_better===true && Boolean(clean(c?.comparison_reference)),
    reference:clean(c?.comparison_reference).slice(0,300) || null
  };
}
function evaluate(row:any,body:any){
  const now=Date.now();
  const method=clean(body?.verification_method).toLowerCase();
  const isActive=activeObservation(row,now);
  const sourceOk=sourceVerified(row,now);
  const structureOk=structureVerified(row);
  const checkout=checkoutProof(body,method,now);
  const mission=missionFit(row,body?.mission||{});
  const comparison=comparisonState(body);

  let result="insufficient_evidence";
  let verdict="WAIT";
  let reason="More evidence is required before HUNT recommends this promotion.";

  const end=timestamp(row?.valid_until);
  if(end !== null && end < now){
    result="expired"; verdict="SKIP"; reason="Promotion has expired.";
  } else if(!isActive || !sourceOk || !structureOk){
    result="failed"; verdict="SKIP";
    reason=!sourceOk ? "Source evidence is stale or invalid." :
      !structureOk ? "Promotion structure is incomplete." : "Promotion is not active.";
  } else if(!checkout.verified){
    result="insufficient_evidence"; verdict="WAIT"; reason="Checkout redemption has not been reproduced yet.";
  } else {
    result="passed";
    if(mission.overbuy_required){
      verdict="WAIT"; reason="Promotion is valid but requires buying more units than the current mission needs.";
    } else if(comparison.alternativeBetter){
      verdict="SWITCH"; reason="A verified alternative currently produces a better outcome.";
    } else if(!checkout.landedCostComplete){
      verdict="WAIT"; reason="Promotion works at checkout, but full landed cost is still incomplete.";
    } else if(comparison.bestVerified){
      verdict="BUY"; reason="Checkout, landed cost and comparison evidence all support this option.";
    } else {
      verdict="WAIT"; reason="Promotion is verified, but HUNT has not proved it is the best verified option.";
    }
  }
  return {
    method,result,verdict,reason,
    source_verified:sourceOk,
    structure_verified:structureOk,
    checkout_verified:checkout.verified,
    landed_cost_complete:checkout.landedCostComplete,
    observed_total:checkout.observedTotal,
    currency:checkout.currency,
    mission_fit:mission,
    comparison
  };
}
async function persist(client:any,row:any,evaluation:any,body:any){
  const status=evaluation.result==="passed" ? "verified" :
    evaluation.result==="expired" ? "expired" :
    evaluation.result==="failed" ? "rejected" : "pending_review";

  const record={
    observation_id:row.id,
    verification_method:evaluation.method || "internal_review",
    result:evaluation.result,
    source_verified:evaluation.source_verified,
    structure_verified:evaluation.structure_verified,
    checkout_verified:evaluation.checkout_verified,
    landed_cost_complete:evaluation.landed_cost_complete,
    observed_total:evaluation.observed_total,
    currency:evaluation.currency,
    verdict:evaluation.verdict,
    reason:evaluation.reason,
    evidence:{
      checkout_evidence:body?.checkout_evidence || {},
      comparison_evidence:body?.comparison_evidence || {},
      mission_fit:evaluation.mission_fit
    },
    verified_at:new Date().toISOString()
  };
  const {error:insertError}=await client.from("hunt_promotion_verifications").insert(record);
  if(insertError) throw new Error(insertError.message);

  const {error:updateError}=await client.from("hunt_promotion_observations")
    .update({
      checkout_verified:evaluation.checkout_verified,
      verification_status:status,
      updated_at:new Date().toISOString()
    })
    .eq("id",row.id);
  if(updateError) throw new Error(updateError.message);
}
Deno.serve(async(req:Request)=>{
  if(req.method!=="POST") return json({error:"POST required"},405);
  if(!authorized(req)) return json({error:"unauthorized"},401);

  let body:any={};
  try { body=await req.json(); } catch {}

  if(body?.action==="status"){
    return json({
      ok:true,
      mode:"internal_verifier",
      writes_require_dry_run_false:true,
      buy_requires:["checkout_verified","landed_cost_complete","best_verified_option"]
    });
  }
  if(body?.action!=="evaluate") return json({error:"supported action: evaluate"},400);

  const observationId=clean(body?.observation_id);
  const method=clean(body?.verification_method).toLowerCase();
  if(!observationId) return json({error:"observation_id required"},400);
  if(!ALLOWED_METHODS.has(method)) return json({error:"unsupported verification_method"},400);

  try {
    const client=db();
    const {data:row,error}=await client.from("hunt_promotion_observations")
      .select("*").eq("id",observationId).maybeSingle();
    if(error) throw new Error(error.message);
    if(!row) return json({error:"promotion observation not found"},404);

    const evaluation=evaluate(row,body);
    const dryRun=body?.dry_run !== false;
    if(!dryRun) await persist(client,row,evaluation,body);

    return json({
      ok:true,
      dry_run:dryRun,
      observation_id:row.id,
      provider:row.source_provider,
      deal_type:row.deal_type,
      evaluation
    });
  } catch(error) {
    return json({error:error instanceof Error ? error.message : "promotion verification failed"},502);
  }
});
