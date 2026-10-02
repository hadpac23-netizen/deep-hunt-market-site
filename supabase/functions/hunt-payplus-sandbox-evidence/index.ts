import { createClient } from "npm:@supabase/supabase-js@2";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const BASE=clean(Deno.env.get("SUPABASE_URL"));
const SERVICE=clean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const PAYPLUS_API_KEY=clean(Deno.env.get("PAYPLUS_API_KEY"));
const PAYPLUS_SECRET_KEY=clean(Deno.env.get("PAYPLUS_SECRET_KEY"));
const PAYPLUS_PAGE_UID=clean(Deno.env.get("PAYPLUS_PAYMENT_PAGE_UID"));
const PAYPLUS_SANDBOX_BASE="https://restapidev.payplus.co.il/api/v1.0";
const sb=createClient(BASE,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});

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
async function control(token:string){
  const {data}=await sb.from("hunt_runtime_controls")
    .select("enabled,owner_approved,note")
    .eq("key","hunt_payplus_sandbox_evidence")
    .maybeSingle();
  if(data?.enabled!==true||data?.owner_approved!==true)return false;
  const note=clean(data?.note);
  const expected=note.startsWith("sha256:")?note.slice(7):"";
  return Boolean(expected)&&await sha256(token)===expected;
}
async function createLink(sessionId:string,amount:number){
  const missing=[
    !PAYPLUS_API_KEY?"PAYPLUS_API_KEY":null,
    !PAYPLUS_SECRET_KEY?"PAYPLUS_SECRET_KEY":null,
    !PAYPLUS_PAGE_UID?"PAYPLUS_PAYMENT_PAGE_UID":null
  ].filter(Boolean);
  if(missing.length)throw new Error("PAYPLUS_SANDBOX_CONFIG_MISSING:"+missing.join(","));
  const payload={
    payment_page_uid:PAYPLUS_PAGE_UID,
    charge_method:1,
    amount,
    currency_code:"ILS",
    expiry_datetime:20,
    sendEmailApproval:false,
    sendEmailFailure:false,
    refURL_success:"https://hadpac23-netizen.github.io/deep-hunt-market-site/checkout.html?payment=m31-sandbox-success",
    refURL_failure:"https://hadpac23-netizen.github.io/deep-hunt-market-site/checkout.html?payment=m31-sandbox-failed",
    refURL_cancel:"https://hadpac23-netizen.github.io/deep-hunt-market-site/checkout.html?payment=m31-sandbox-cancelled",
    refURL_callback:BASE+"/functions/v1/hunt-payplus-callback",
    send_failure_callback:true,
    allowed_charge_methods:["credit-card"],
    more_info:sessionId
  };
  const res=await fetch(PAYPLUS_SANDBOX_BASE+"/PaymentPages/generateLink",{
    method:"POST",
    headers:{"content-type":"application/json","api-key":PAYPLUS_API_KEY,"secret-key":PAYPLUS_SECRET_KEY},
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(10000)
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error("PAYPLUS_SANDBOX_LINK_FAILED_"+res.status);
  const data=body?.data||body;
  const requestUid=clean(data?.page_request_uid||data?.payment_request_uid);
  const redirectUrl=clean(data?.payment_page_link||data?.payment_page_url||data?.url);
  const hostedFields=clean(data?.hosted_fields_uuid);
  if(!requestUid||!redirectUrl)throw new Error("PAYPLUS_SANDBOX_LINK_FIELDS_MISSING");
  return {requestUid,redirectUrl,hostedFields};
}
async function disableLink(requestUid:string){
  const uid=encodeURIComponent(clean(requestUid));
  if(!uid)return;
  const res=await fetch(PAYPLUS_SANDBOX_BASE+"/PaymentPages/Disable/"+uid,{
    method:"POST",
    headers:{"accept":"application/json","api-key":PAYPLUS_API_KEY,"secret-key":PAYPLUS_SECRET_KEY},
    signal:AbortSignal.timeout(10000)
  });
  if(!res.ok)throw new Error("PAYPLUS_SANDBOX_DISABLE_FAILED_"+res.status);
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({ok:false,error:"method not allowed"},405);
  if(!BASE||!SERVICE)return json({ok:false,error:"server config missing"},500);
  try{
    const body=await req.json().catch(()=>({}));
    const token=clean(body?.token);
    const scenario=clean(body?.scenario).toLowerCase();
    if(!token||!["success","reject"].includes(scenario))return json({ok:false,error:"INVALID_REQUEST"},400);
    if(!await control(token))return json({ok:false,error:"M31_SANDBOX_EVIDENCE_DISABLED"},403);

    const id=crypto.randomUUID();
    const amount=1;
    const digest=await sha256("m31:"+scenario+":"+id);
    const now=new Date().toISOString();
    const {error:insertError}=await sb.from("hunt_payment_sessions").insert({
      id,
      provider:"payplus",
      mode:"sandbox",
      status:"created",
      country_code:"IL",
      currency:"ILS",
      product_amount:amount,
      shipping_amount:0,
      pre_discount_total_amount:amount,
      discount_amount:0,
      total_amount:amount,
      line_items:[{
        provider:"M31_SANDBOX",
        item_id:"PAYPLUS_STATUS_EVIDENCE",
        variant_id:scenario.toUpperCase(),
        qty:1,
        title:"M31 PayPlus Sandbox Evidence",
        unit_retail_amount:amount,
        supplier_cost_per_unit:0,
        shipping_amount:0,
        currency:"ILS"
      }],
      shipping_snapshot:{sandbox_evidence:true},
      commerce_snapshot:{
        status:"SANDBOX_EVIDENCE",
        scenario,
        verified:false,
        payment_live:false,
        supplier_order_live:false
      },
      cart_digest:digest,
      idempotency_key:"m31-payplus-"+scenario+"-"+id,
      customer_email:null,
      updated_at:now
    });
    if(insertError)throw new Error("M31_SANDBOX_SESSION_STORE_FAILED");

    let link:any;
    try{
      link=await createLink(id,amount);
    }catch(e){
      await sb.from("hunt_payment_sessions").delete().eq("id",id);
      throw e;
    }

    const {error:updateError}=await sb.from("hunt_payment_sessions").update({
      status:"pending",
      provider_request_uid:link.requestUid,
      provider_hosted_fields_uid:link.hostedFields||null,
      provider_redirect_url:link.redirectUrl,
      expires_at:new Date(Date.now()+20*60*1000).toISOString(),
      updated_at:new Date().toISOString()
    }).eq("id",id);
    if(updateError){
      let disableFailed=false;
      try{ await disableLink(link.requestUid); }catch{ disableFailed=true; }
      if(!disableFailed)await sb.from("hunt_payment_sessions").delete().eq("id",id);
      throw new Error(disableFailed
        ?"M31_SANDBOX_SESSION_UPDATE_FAILED_DISABLE_FAILED"
        :"M31_SANDBOX_SESSION_UPDATE_FAILED");
    }

    const {error:eventError}=await sb.from("hunt_payment_events").insert({
      payment_session_id:id,
      provider:"payplus",
      event_type:"m31_sandbox_evidence_session_created",
      payload_digest:digest
    });
    if(eventError){
      let disableFailed=false;
      try{ await disableLink(link.requestUid); }catch{ disableFailed=true; }
      await sb.from("hunt_payment_sessions").update({
        status:"failed",
        provider_redirect_url:null,
        updated_at:new Date().toISOString()
      }).eq("id",id);
      throw new Error(disableFailed
        ?"M31_SANDBOX_EVIDENCE_EVENT_STORE_FAILED_DISABLE_FAILED"
        :"M31_SANDBOX_EVIDENCE_EVENT_STORE_FAILED");
    }

    return json({
      ok:true,
      scenario,
      mode:"sandbox",
      amount,
      currency:"ILS",
      payment_session_id:id,
      payment_request_uid:link.requestUid,
      redirect_url:link.redirectUrl,
      accepted_paid:false
    });
  }catch(e){
    return json({ok:false,error:clean((e as Error)?.message)||"M31_SANDBOX_EVIDENCE_FAILED"},400);
  }
});