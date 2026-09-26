import { createSupabaseContext } from "npm:@supabase/server";
import { refundEligibility } from "../_shared/order-lifecycle.mjs";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{"content-type":"application/json","cache-control":"no-store"}
});

async function isAdmin(ctx:any){
  const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub);
  if(!uid)return false;
  const {data}=await ctx.supabaseAdmin.from("profiles").select("is_admin").eq("id",uid).maybeSingle();
  return data?.is_admin===true;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"method not allowed"},405);
  const {data:ctx,error}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(error||!ctx)return json({ok:false,error:"unauthorized"},error?.status||401);
  if(!(await isAdmin(ctx)))return json({ok:false,error:"ADMIN_REQUIRED"},403);

  try{
    const body=await req.json().catch(()=>({}));
    const paymentSessionId=clean(body?.payment_session_id);
    const requestedAmount=Number(body?.refund_amount);
    if(!paymentSessionId||!Number.isFinite(requestedAmount)||requestedAmount<=0){
      return json({ok:false,error:"PAYMENT_SESSION_AND_REFUND_AMOUNT_REQUIRED"},400);
    }

    const {data:session,error:sessionError}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .select("id,order_id,status,mode,total_amount,currency,provider_transaction_uid")
      .eq("id",paymentSessionId)
      .maybeSingle();
    if(sessionError||!session)return json({ok:false,error:"PAYMENT_SESSION_NOT_FOUND"},404);

    let order:any=null;
    if(session.order_id){
      const {data,error:orderError}=await ctx.supabaseAdmin
        .from("hunt_orders")
        .select("id,status,is_test,total_amount,currency")
        .eq("id",session.order_id)
        .maybeSingle();
      if(orderError)throw new Error("ORDER_LOOKUP_FAILED");
      order=data;
    }

    const eligibility=refundEligibility({
      payment_status:session.status,
      order_status:order?.status||"",
      total_amount:Number(session.total_amount),
      refund_amount:requestedAmount,
      currency:session.currency,
      refund_currency:clean(body?.currency)||session.currency
    });
    const blockers=[...eligibility.blockers];
    if(session.mode==="prelaunch")blockers.push("PRELAUNCH_PAYMENT_NOT_REFUNDABLE");
    if(!clean(session.provider_transaction_uid))blockers.push("PROVIDER_TRANSACTION_UID_MISSING");
    if(!order)blockers.push("ORDER_NOT_LINKED");
    blockers.push("REFUND_PROVIDER_EXECUTION_DISABLED");

    return json({
      ok:true,
      dry_run:true,
      refund_live:false,
      payment_session_id:session.id,
      order_id:order?.id||null,
      requested_amount:Number(requestedAmount.toFixed(2)),
      currency:clean(body?.currency||session.currency).toUpperCase(),
      eligible_for_provider_refund:eligibility.eligible && !blockers.includes("PRELAUNCH_PAYMENT_NOT_REFUNDABLE") && !blockers.includes("PROVIDER_TRANSACTION_UID_MISSING") && Boolean(order),
      ready_for_live_refund:false,
      blockers:[...new Set(blockers)]
    });
  }catch(e){
    return json({ok:false,error:clean((e as Error)?.message)||"REFUND_PREVIEW_FAILED"},400);
  }
});
