import { createSupabaseContext } from "npm:@supabase/server";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const money=(v:number)=>Number(v.toFixed(2));

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://127.0.0.1:18977",
    "http://localhost:18977"
  ]);
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "access-control-allow-origin":(allowed.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "vary":"Origin"
  };
}
function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json","cache-control":"no-store",...cors(req)
  }});
}
async function isAdmin(ctx:any){
  const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub);
  if(!uid)return false;
  const {data}=await ctx.supabaseAdmin.from("profiles")
    .select("is_admin").eq("id",uid).maybeSingle();
  return data?.is_admin===true;
}
async function control(ctx:any,key:string){
  const {data}=await ctx.supabaseAdmin.from("hunt_runtime_controls")
    .select("enabled,owner_approved").eq("key",key).maybeSingle();
  return data?.enabled===true&&data?.owner_approved===true;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);

  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);
  if(!(await isAdmin(ctx)))return json(req,{error:"ADMIN_REQUIRED"},403);
  if(!(await control(ctx,"hunt_finance_ledger_preview"))){
    return json(req,{error:"FINANCE_PREVIEW_DISABLED"},409);
  }

  try{
    const body=await req.json();
    const sessionId=clean(body?.payment_session_id);
    if(!sessionId)return json(req,{error:"PAYMENT_SESSION_REQUIRED"},400);
    const {data:session,error:sessionError}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .select("id,order_id,mode,status,country_code,currency,total_amount,line_items")
      .eq("id",sessionId).maybeSingle();
    if(sessionError||!session)return json(req,{error:"SESSION_NOT_FOUND"},404);
    if(session.mode==="live")return json(req,{error:"LIVE_FINANCE_PREVIEW_BLOCKED"},409);

    const {data:profile,error:profileError}=await ctx.supabaseAdmin
      .from("hunt_profit_profiles")
      .select("id,payment_rate,refund_reserve_rate,platform_variable_rate,platform_fixed_per_order")
      .eq("status","active").eq("owner_approved",true)
      .order("updated_at",{ascending:false}).limit(1).maybeSingle();
    if(profileError||!profile)return json(req,{error:"PROFIT_PROFILE_NOT_ACTIVE"},409);

    const lines=Array.isArray(session.line_items)?session.line_items:[];
    if(!lines.length)return json(req,{error:"EMPTY_LINE_ITEMS"},409);

    const supplierProduct=lines.reduce((sum:number,x:any)=>
      sum+num(x?.supplier_cost_per_unit)*Math.max(1,num(x?.qty)||1),0);
    const supplierShipping=lines.reduce((sum:number,x:any)=>sum+num(x?.shipping_amount),0);
    const gross=num(session.total_amount);
    const processor=gross*num(profile.payment_rate);
    const refund=gross*num(profile.refund_reserve_rate);
    const platform=gross*num(profile.platform_variable_rate)+num(profile.platform_fixed_per_order);
    const taxReserve=0;
    const contribution=gross-supplierProduct-supplierShipping-processor-refund-platform-taxReserve;
    const row={
      payment_session_id:session.id,
      order_id:session.order_id||null,
      currency:clean(session.currency)||"USD",
      customer_gross:money(gross),
      supplier_product_payable:money(supplierProduct),
      supplier_shipping_payable:money(supplierShipping),
      processor_reserve:money(processor),
      refund_reserve:money(refund),
      tax_reserve:money(taxReserve),
      other_reserve:money(platform),
      contribution_locked:money(contribution),
      available_profit:0,
      settlement_status:"preview",
      supplier_payment_status:"not_started",
      owner_payout_status:"locked",
      is_test:true,
      calculation:{
        profile_id:profile.id,
        country_code:session.country_code,
        payment_mode:session.mode,
        payment_status:session.status,
        tax_status:"NOT_VERIFIED_PREVIEW_ONLY",
        profit_release_allowed:false,
        line_count:lines.length
      },
      calculated_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    };

    const {data:ledger,error:ledgerError}=await ctx.supabaseAdmin
      .from("hunt_order_finance_ledger")
      .upsert(row,{onConflict:"payment_session_id"})
      .select("id,payment_session_id,order_id,currency,customer_gross,supplier_product_payable,supplier_shipping_payable,processor_reserve,refund_reserve,tax_reserve,other_reserve,contribution_locked,available_profit,settlement_status,supplier_payment_status,owner_payout_status,is_test,calculated_at")
      .single();
    if(ledgerError||!ledger)throw new Error("FINANCE_LEDGER_STORE_FAILED");

    return json(req,{ok:true,ledger});
  }catch(error){
    return json(req,{
      ok:false,
      error:clean((error as Error)?.message)||"finance preview failed"
    },400);
  }
});
