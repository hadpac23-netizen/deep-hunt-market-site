import { createClient } from "npm:@supabase/supabase-js@2";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const BASE=clean(Deno.env.get("SUPABASE_URL"));
const SERVICE=clean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const supabase=createClient(BASE,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,headers:{"content-type":"application/json","cache-control":"no-store"}
  });
}
async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function requestPayload(req:Request){
  const url=new URL(req.url);
  const params:Object=Object.fromEntries(url.searchParams.entries());
  if(req.method==="GET")return params;
  const type=(req.headers.get("content-type")||"").toLowerCase();
  if(type.includes("application/json")){
    return {...params,...await req.json().catch(()=>({}))};
  }
  if(type.includes("application/x-www-form-urlencoded")||type.includes("multipart/form-data")){
    const fd=await req.formData().catch(()=>null);
    return fd?{...params,...Object.fromEntries(fd.entries())}:params;
  }
  const text=await req.text().catch(()=>"");
  try{return {...params,...JSON.parse(text)}}catch{return {...params,raw:text.slice(0,4000)}}
}
async function verifyWithPayPlus(session:any,payload:any){
  const apiKey=clean(Deno.env.get("PAYPLUS_API_KEY"));
  const secretKey=clean(Deno.env.get("PAYPLUS_SECRET_KEY"));
  if(!apiKey||!secretKey)throw new Error("PAYPLUS_CREDENTIALS_MISSING");
  const transactionUid=clean(payload?.transaction_uid||payload?.transactionUid);
  const requestUid=clean(payload?.payment_request_uid||payload?.paymentRequestUid||session?.provider_request_uid);
  if(!transactionUid&&!requestUid)throw new Error("PAYPLUS_PROVIDER_ID_REQUIRED");
  const base=session?.mode==="sandbox"
    ?"https://restapidev.payplus.co.il/api/v1.0"
    :"https://restapi.payplus.co.il/api/v1.0";
  const verifyBody=transactionUid
    ?{transaction_uid:transactionUid,related_transaction:false}
    :{payment_request_uid:requestUid,related_transaction:false};
  const res=await fetch(base+"/PaymentPages/ipn-full",{
    method:"POST",
    headers:{"content-type":"application/json","api-key":apiKey,"secret-key":secretKey},
    body:JSON.stringify(verifyBody)
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error("PAYPLUS_IPN_VERIFY_FAILED_"+res.status);
  return {body,transactionUid,requestUid};
}
async function runtimeControl(key:string){
  const {data}=await supabase.from("hunt_runtime_controls")
    .select("enabled,owner_approved").eq("key",key).maybeSingle();
  return data?.enabled===true&&data?.owner_approved===true;
}

Deno.serve(async(req:Request)=>{
  if(!["GET","POST"].includes(req.method))return json({error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json({error:"server config missing"},500);
  try{
    const payload:any=await requestPayload(req);
    const sessionHint=clean(payload?.more_info||payload?.moreInfo);
    const requestUid=clean(payload?.payment_request_uid||payload?.paymentRequestUid);
    let query=supabase.from("hunt_payment_sessions")
      .select("id,user_id,order_id,mode,status,total_amount,currency,provider_request_uid,provider_transaction_uid");
    if(sessionHint)query=query.eq("id",sessionHint);
    else if(requestUid)query=query.eq("provider_request_uid",requestUid);
    else return json({ok:false,error:"PAYMENT_SESSION_REFERENCE_REQUIRED"},400);
    const {data:session,error}=await query.maybeSingle();
    if(error||!session)return json({ok:false,error:"PAYMENT_SESSION_NOT_FOUND"},404);

    const verified=await verifyWithPayPlus(session,payload);
    const providerEventId=verified.transactionUid||verified.requestUid;
    const payloadDigest=await sha256(JSON.stringify({
      session_id:session.id,
      transaction_uid:verified.transactionUid||null,
      payment_request_uid:verified.requestUid||null
    }));

    const enabled=await runtimeControl("hunt_payplus_callback_accept_paid");
    const eventType=enabled?"callback_verified_pending_status_mapping":"callback_verified_hold";
    const {error:eventError}=await supabase.from("hunt_payment_events").upsert({
      payment_session_id:session.id,
      provider:"payplus",
      event_type:eventType,
      provider_event_id:providerEventId||null,
      payload_digest:payloadDigest
    },{onConflict:"provider,provider_event_id",ignoreDuplicates:true});
    if(eventError)throw new Error("PAYMENT_EVENT_STORE_FAILED");

    if(!enabled){
      return json({
        ok:true,verified:true,accepted_paid:false,
        reason:"PAID_ACCEPTANCE_KILL_SWITCH_OFF",
        payment_session_id:session.id
      });
    }

    return json({
      ok:true,verified:true,accepted_paid:false,
      reason:"PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF",
      payment_session_id:session.id
    });
  }catch(e){
    return json({ok:false,error:clean((e as Error)?.message)||"PAYPLUS_CALLBACK_FAILED"},400);
  }
});
