import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyPayPlusCallbackHeaders } from "./payplus-auth.mjs";
import { classifyPayPlusStatus } from "./payplus-status-map.mjs";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null;
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
  if(req.method==="GET")return {payload:params,signatureBody:null};
  const type=(req.headers.get("content-type")||"").toLowerCase();
  if(type.includes("application/json")){
    const body=await req.json().catch(()=>({}));
    return {payload:{...params,...body},signatureBody:body};
  }
  if(type.includes("application/x-www-form-urlencoded")||type.includes("multipart/form-data")){
    const fd=await req.formData().catch(()=>null);
    const body=fd?Object.fromEntries(fd.entries()):{};
    return {payload:{...params,...body},signatureBody:body};
  }
  const text=await req.text().catch(()=>"");
  try{
    const body=JSON.parse(text);
    return {payload:{...params,...body},signatureBody:body};
  }catch{
    return {payload:{...params,raw:text.slice(0,4000)},signatureBody:null};
  }
}
function verifiedTransaction(body:any){
  const root=body?.data??body;
  const candidates=[
    root?.transaction,
    Array.isArray(root?.transactions)?root.transactions[0]:null,
    root?.data?.transaction,
    Array.isArray(root?.data)?root.data[0]:null,
    root
  ].filter(Boolean);
  const tx=candidates.find((x:any)=>x&&typeof x==="object")||{};
  const requestUid=clean(
    tx?.payment_request_uid||tx?.paymentRequestUid||
    root?.payment_request_uid||root?.paymentRequestUid
  );
  const transactionUid=clean(
    tx?.transaction_uid||tx?.transactionUid||
    root?.transaction_uid||root?.transactionUid
  );
  const moreInfo=clean(
    tx?.more_info||tx?.moreInfo||
    root?.more_info||root?.moreInfo
  );
  const amount=num(
    tx?.amount??tx?.transaction_amount??tx?.total_amount??
    root?.amount??root?.transaction_amount??root?.total_amount
  );
  const currency=clean(
    tx?.currency_code||tx?.currency||
    root?.currency_code||root?.currency
  ).toUpperCase();
  return {requestUid,transactionUid,moreInfo,amount,currency};
}
async function verifyWithPayPlus(session:any,payload:any){
  const apiKey=clean(Deno.env.get("PAYPLUS_API_KEY"));
  const secretKey=clean(Deno.env.get("PAYPLUS_SECRET_KEY"));
  if(!apiKey||!secretKey)throw new Error("PAYPLUS_CREDENTIALS_MISSING");
  const transactionUid=clean(payload?.transaction_uid||payload?.transactionUid);
  const requestUid=clean(payload?.payment_request_uid||payload?.paymentRequestUid);
  if(!requestUid)throw new Error("PAYMENT_REQUEST_UID_REQUIRED");
  if(clean(session?.provider_request_uid)!==requestUid)throw new Error("PAYMENT_REQUEST_UID_MISMATCH");
  const base=session?.mode==="sandbox"
    ?"https://restapidev.payplus.co.il/api/v1.0"
    :"https://restapi.payplus.co.il/api/v1.0";
  const verifyBody={payment_request_uid:requestUid,related_transaction:false};
  const res=await fetch(base+"/PaymentPages/ipn-full",{
    method:"POST",
    headers:{"content-type":"application/json","api-key":apiKey,"secret-key":secretKey},
    body:JSON.stringify(verifyBody),
    signal:AbortSignal.timeout(10000)
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error("PAYPLUS_IPN_VERIFY_FAILED_"+res.status);

  const tx=verifiedTransaction(body);
  if(!tx.requestUid||!tx.transactionUid||!tx.moreInfo||tx.amount===null||!tx.currency){
    throw new Error("PAYPLUS_VERIFICATION_FIELDS_MISSING");
  }
  if(tx.requestUid!==requestUid)throw new Error("PAYPLUS_REQUEST_UID_MISMATCH");
  if(tx.moreInfo!==session.id)throw new Error("PAYPLUS_MORE_INFO_MISMATCH");
  if(transactionUid&&tx.transactionUid!==transactionUid)throw new Error("PAYPLUS_TRANSACTION_UID_MISMATCH");
  if(clean(session.provider_transaction_uid)&&tx.transactionUid!==clean(session.provider_transaction_uid)){
    throw new Error("PAYPLUS_STORED_TRANSACTION_UID_MISMATCH");
  }
  if(Math.abs(Number(tx.amount)-Number(session.total_amount))>0.01)throw new Error("PAYPLUS_AMOUNT_MISMATCH");
  if(tx.currency!==clean(session.currency).toUpperCase())throw new Error("PAYPLUS_CURRENCY_MISMATCH");

  return {
    body,
    transactionUid:tx.transactionUid,
    requestUid:tx.requestUid,
    moreInfo:tx.moreInfo,
    amount:tx.amount,
    currency:tx.currency
  };
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
    const parsed:any=await requestPayload(req);
    const payload:any=parsed.payload||{};
    const signature=await verifyPayPlusCallbackHeaders({
      userAgent:req.headers.get("user-agent"),
      hash:req.headers.get("hash"),
      body:parsed.signatureBody,
      secretKey:clean(Deno.env.get("PAYPLUS_SECRET_KEY"))
    });
    if(signature.valid!==true){
      return json({ok:false,error:signature.reason||"PAYPLUS_CALLBACK_SIGNATURE_INVALID"},401);
    }
    const sessionHint=clean(payload?.more_info||payload?.moreInfo);
    const requestUid=clean(payload?.payment_request_uid||payload?.paymentRequestUid);
    if(!requestUid)return json({ok:false,error:"PAYMENT_REQUEST_UID_REQUIRED"},400);
    const {data:session,error}=await supabase.from("hunt_payment_sessions")
      .select("id,user_id,order_id,mode,status,total_amount,currency,provider_request_uid,provider_transaction_uid")
      .eq("provider_request_uid",requestUid)
      .maybeSingle();
    if(error||!session)return json({ok:false,error:"PAYMENT_SESSION_NOT_FOUND"},404);
    if(sessionHint&&sessionHint!==session.id){
      return json({ok:false,error:"PAYMENT_SESSION_REFERENCE_MISMATCH"},409);
    }
    if(session.mode==="prelaunch"){
      return json({
        ok:false,
        error:"PRELAUNCH_SESSION_CALLBACK_BLOCKED",
        payment_session_id:session.id
      },409);
    }

    const verified=await verifyWithPayPlus(session,payload);
    const mapping=classifyPayPlusStatus(verified.body);
    const providerEventId=verified.transactionUid||verified.requestUid;

    const {error:observationError}=await supabase.from("hunt_payplus_status_observations").upsert({
      payment_session_id:session.id,
      provider_event_id:providerEventId,
      environment:session.mode==="sandbox"?"sandbox":"live",
      charge_method:mapping.fingerprint.charge_method,
      charge_method_name:mapping.fingerprint.charge_method_name,
      provider_status:mapping.fingerprint.status===null?null:String(mapping.fingerprint.status).slice(0,80),
      provider_code:mapping.fingerprint.code===null?null:String(mapping.fingerprint.code).slice(0,80),
      provider_description:mapping.fingerprint.description,
      mapping_state:mapping.state,
      signature_verified:true,
      ipn_full_verified:true,
      accepted_paid:false
    },{onConflict:"payment_session_id,provider_event_id"});
    if(observationError)throw new Error("PAYPLUS_STATUS_OBSERVATION_STORE_FAILED");

    const payloadDigest=await sha256(JSON.stringify({
      session_id:session.id,
      transaction_uid:verified.transactionUid||null,
      payment_request_uid:verified.requestUid||null,
      amount:verified.amount,
      currency:verified.currency,
      more_info:verified.moreInfo
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
        mapping_state:mapping.state,
        payment_session_id:session.id
      });
    }

    return json({
      ok:true,verified:true,accepted_paid:false,
      reason:"PROVIDER_STATUS_MAPPING_REQUIRES_SANDBOX_PROOF",
      mapping_state:mapping.state,
      payment_session_id:session.id
    });
  }catch(e){
    return json({ok:false,error:clean((e as Error)?.message)||"PAYPLUS_CALLBACK_FAILED"},400);
  }
});