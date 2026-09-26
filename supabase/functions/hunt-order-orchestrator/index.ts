import { createSupabaseContext } from "npm:@supabase/server";
import { assertTransition } from "../_shared/order-lifecycle.mjs";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const countryNames:Record<string,string>={
  IL:"Israel",US:"United States",GB:"United Kingdom",DE:"Germany",
  FR:"France",CA:"Canada",AU:"Australia",AE:"United Arab Emirates"
};
let cjCache={token:"",expiresAt:0};

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://127.0.0.1:8767","http://localhost:8767",
    "http://127.0.0.1:18977","http://localhost:18977"
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
async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function isAdmin(ctx:any){
  const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub);
  if(!uid)return false;
  const {data}=await ctx.supabaseAdmin.from("profiles").select("is_admin").eq("id",uid).maybeSingle();
  return data?.is_admin===true;
}
async function control(ctx:any,key:string){
  const {data}=await ctx.supabaseAdmin.from("hunt_runtime_controls")
    .select("enabled,owner_approved,note").eq("key",key).maybeSingle();
  return {
    enabled:data?.enabled===true,
    owner_approved:data?.owner_approved===true,
    note:clean(data?.note)
  };
}
async function cjToken(){
  const direct=clean(Deno.env.get("CJ_ACCESS_TOKEN"));
  if(direct)return direct;
  const apiKey=clean(Deno.env.get("CJ_API_KEY"));
  if(!apiKey)throw new Error("CJ_CREDENTIALS_MISSING");
  if(cjCache.token&&cjCache.expiresAt>Date.now())return cjCache.token;
  const res=await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",{
    method:"POST",headers:{"content-type":"application/json","accept":"application/json"},
    body:JSON.stringify({apiKey})
  });
  const body=await res.json().catch(()=>({}));
  const token=clean(body?.data?.accessToken);
  if(!res.ok||!token)throw new Error("CJ_TOKEN_FAILED");
  cjCache={token,expiresAt:Date.now()+12*60*60*1000};
  return token;
}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
function normalizeShippingPhone(country:string,value:unknown){
  const raw=clean(value);
  if(!raw)return "";
  const digits=raw.replace(/\D/g,"");
  if(digits.startsWith("00")&&digits.length>4)return "+"+digits.slice(2);
  if(country==="IL"){
    if(digits.startsWith("972"))return "+"+digits;
    if(digits.startsWith("0")&&digits.length>=9)return "+972"+digits.slice(1);
  }
  return raw;
}
function isTransientCjFailure(res:Response,out:any){
  const code=String(out?.code||res.status);
  const message=clean(out?.message).toLowerCase();
  return res.status>=500 || code==="1603000" && (message.includes("server is busy")||message.includes("try again later"));
}
async function cjGetOrderByStoreNumber(orderNumber:string){
  const ref=clean(orderNumber);
  if(!ref)return null;
  const token=await cjToken();
  const res=await fetch("https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetailBatch",{
    method:"POST",
    headers:{"content-type":"application/json","accept":"application/json","CJ-Access-Token":token},
    body:JSON.stringify({orderIds:[ref]})
  });
  const out=await res.json().catch(()=>({}));
  if(!res.ok||out?.result!==true)return null;
  const list=Array.isArray(out?.data)?out.data:[];
  const exact=list.find((row:any)=>
    [row?.orderId,row?.orderNum,row?.cjOrderId,row?.cjOrderCode].some(value=>clean(value)===ref) ||
    (Array.isArray(row?.productList)&&row.productList.some((line:any)=>clean(line?.orderNumber)===ref))
  );
  return exact||(list.length===1?list[0]:null);
}
async function cjPost(path:string,body:any,options:{maxAttempts?:number,reconcileOrderNumber?:string}={}){
  const maxAttempts=Math.max(1,Math.min(5,Number(options.maxAttempts||1)));
  let lastError="CJ_API_UNKNOWN";
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    const token=await cjToken();
    let res:Response;
    try{
      res=await fetch("https://developers.cjdropshipping.com/api2.0/v1"+path,{
        method:"POST",
        headers:{"content-type":"application/json","accept":"application/json","CJ-Access-Token":token},
        body:JSON.stringify(body)
      });
    }catch(error){
      lastError="CJ_NETWORK_"+clean(error instanceof Error?error.message:String(error)).slice(0,120);
      if(options.reconcileOrderNumber){
        const existing=await cjGetOrderByStoreNumber(options.reconcileOrderNumber).catch(()=>null);
        if(existing){
          return {
            code:200,result:true,message:"Reconciled existing CJ order after network failure",
            data:{
              orderId:clean(existing?.orderId||existing?.cjOrderId),
              orderNumber:clean(existing?.orderNum||options.reconcileOrderNumber)
            },
            requestId:null,reconciled:true
          };
        }
      }
      if(attempt>=maxAttempts)throw new Error(lastError);
      await sleep(Math.min(8000,1000*(2**(attempt-1))));
      continue;
    }
    const out=await res.json().catch(()=>({}));
    if(res.ok&&out?.result===true)return out;
    lastError="CJ_API_"+String(out?.code||res.status)+"_"+clean(out?.message).slice(0,120);
    const transient=isTransientCjFailure(res,out);
    const duplicate=String(out?.code||"")==="1603003";
    if((transient||duplicate)&&options.reconcileOrderNumber){
      const existing=await cjGetOrderByStoreNumber(options.reconcileOrderNumber).catch(()=>null);
      if(existing){
        return {
          code:200,result:true,message:"Reconciled existing CJ order after ambiguous create",
          data:{
            orderId:clean(existing?.orderId||existing?.cjOrderId),
            orderNumber:clean(existing?.orderNum||options.reconcileOrderNumber)
          },
          requestId:clean(out?.requestId)||null,reconciled:true
        };
      }
    }
    if(attempt>=maxAttempts||!transient)throw new Error(lastError);
    await sleep(Math.min(8000,1000*(2**(attempt-1))));
  }
  throw new Error(lastError);
}
function groupsFromLines(lines:any[]){
  const groups:Record<string,any>={};
  for(const raw of lines){
    const provider=clean(raw?.provider);
    const origin=clean(raw?.origin_country_code).toUpperCase();
    const logistics=clean(raw?.shipping_method);
    const key=[provider,origin,logistics].join("|");
    if(!groups[key])groups[key]={
      group_key:key,provider,origin_country_code:origin,
      shipping_method:logistics,line_items:[]
    };
    groups[key].line_items.push({
      item_id:clean(raw?.item_id),
      variant_id:clean(raw?.variant_id),
      qty:Math.max(1,Math.min(5,Number(raw?.qty||1)||1)),
      title:clean(raw?.title).slice(0,180)
    });
  }
  return Object.values(groups);
}
function normalizeShippingSnapshot(snapshot:any,sessionCountry:string){
  const raw=snapshot&&typeof snapshot==="object"?snapshot:{};
  return {
    shippingCustomerName:clean(raw.shippingCustomerName||raw.customer_name),
    shippingAddress:clean(raw.shippingAddress||raw.address1),
    shippingAddress2:clean(raw.shippingAddress2||raw.address2),
    shippingCity:clean(raw.shippingCity||raw.city),
    shippingProvince:clean(raw.shippingProvince||raw.province),
    shippingZip:clean(raw.shippingZip||raw.postal_code),
    shippingPhone:clean(raw.shippingPhone||raw.phone),
    shippingCountryCode:clean(raw.shippingCountryCode||raw.country_code||sessionCountry).toUpperCase()
  };
}
function shippingMissing(snapshot:any){
  return [
    "shippingCustomerName","shippingAddress","shippingCity",
    "shippingProvince","shippingZip","shippingPhone","shippingCountryCode"
  ].filter(k=>!clean(snapshot?.[k]));
}
async function addPipelineRun(ctx:any,payload:any){
  const {data,error}=await ctx.supabaseAdmin.from("hunt_order_pipeline_runs")
    .insert(payload).select("id,run_mode,stage,status,created_at").single();
  if(error)throw new Error("PIPELINE_EVIDENCE_STORE_FAILED");
  return data;
}
function requireWrite(error:any,code:string){
  if(error)throw new Error(code);
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);

  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);

  try{
    const body=await req.json();
    const sessionId=clean(body?.payment_session_id);
    const idem=clean(body?.idempotency_key);
    const runMode=clean(body?.run_mode||"dry_run").toLowerCase();
    if(!sessionId||!idem)return json(req,{ok:false,error:"SESSION_AND_IDEMPOTENCY_REQUIRED"},400);
    if(!["dry_run","sandbox","live"].includes(runMode))return json(req,{ok:false,error:"INVALID_RUN_MODE"},400);
    if(!(await isAdmin(ctx)))return json(req,{ok:false,error:"ADMIN_REQUIRED"},403);

    const {data:session,error:sessionError}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .select("id,user_id,order_id,provider,mode,status,country_code,currency,total_amount,line_items,idempotency_key,customer_email,shipping_snapshot,fulfillment_status")
      .eq("id",sessionId).eq("idempotency_key",idem).maybeSingle();
    if(sessionError||!session)return json(req,{ok:false,error:"SESSION_NOT_FOUND"},404);

    const uid=clean(ctx.userClaims?.id||ctx.userClaims?.sub);
    if(session.user_id&&uid&&session.user_id!==uid&&!(await isAdmin(ctx))){
      return json(req,{ok:false,error:"SESSION_OWNER_MISMATCH"},403);
    }

    const lines=Array.isArray(session.line_items)?session.line_items:[];
    const shipping=normalizeShippingSnapshot(session.shipping_snapshot,session.country_code);
    const groups=groupsFromLines(lines);
    const blockers:string[]=[];
    if(!lines.length)blockers.push("EMPTY_LINE_ITEMS");
    if(lines.some((x:any)=>!clean(x?.provider).toLowerCase().includes("cj")))blockers.push("NON_CJ_FULFILLMENT_NOT_READY");
    if(lines.some((x:any)=>!clean(x?.origin_country_code)))blockers.push("ORIGIN_NOT_PERSISTED");
    if(lines.some((x:any)=>!clean(x?.shipping_method)))blockers.push("LOGISTICS_NOT_PERSISTED");
    if(shippingMissing(shipping).length)blockers.push("SHIPPING_ADDRESS_INCOMPLETE");
    if(clean(shipping?.shippingCountryCode).toUpperCase()!==clean(session.country_code).toUpperCase())blockers.push("SHIPPING_COUNTRY_MISMATCH");
    if(!countryNames[clean(session.country_code).toUpperCase()])blockers.push("COUNTRY_NAME_MAPPING_REQUIRED");

    if(runMode==="dry_run"){
      const pass=blockers.length===0;
      const evidence=await addPipelineRun(ctx,{
        payment_session_id:session.id,
        order_id:session.order_id||null,
        run_mode:"dry_run",
        stage:"validated",
        status:pass?"pass":"hold",
        provider:"CJdropshipping",
        evidence:{
          line_count:lines.length,
          group_count:groups.length,
          shipping_snapshot_present:shippingMissing(shipping).length===0,
          payment_mode:session.mode,
          payment_status:session.status,
          blockers
        },
        created_by:uid||null
      });
      return json(req,{
        ok:true,dry_run:true,
        ready_for_supplier_sandbox:pass&&Boolean(session.user_id),
        requires_signed_in_test_session:!session.user_id,
        blockers,
        groups:groups.map((g:any)=>({
          provider:g.provider,origin_country_code:g.origin_country_code,
          shipping_method:g.shipping_method,line_count:g.line_items.length
        })),
        evidence
      });
    }

    if(blockers.length)return json(req,{ok:false,error:"PIPELINE_BLOCKED",blockers},409);
    if(!session.user_id)return json(req,{ok:false,error:"SIGNED_IN_TEST_SESSION_REQUIRED"},409);

    if(runMode==="live"){
      const live=await control(ctx,"hunt_supplier_order_live");
      if(!(live.enabled&&live.owner_approved)){
        return json(req,{ok:false,error:"LIVE_SUPPLIER_ORDER_DISABLED"},409);
      }
      return json(req,{ok:false,error:"LIVE_PATH_NOT_IMPLEMENTED_BEFORE_LAUNCH"},409);
    }

    const sandbox=await control(ctx,"hunt_supplier_order_sandbox");
    if(!(sandbox.enabled&&sandbox.owner_approved)){
      return json(req,{ok:false,error:"SANDBOX_SUPPLIER_ORDER_DISABLED"},409);
    }

    let order:any=null;
    if(session.order_id){
      const {data}=await ctx.supabaseAdmin.from("hunt_orders")
        .select("id,is_test,status,external_order_id").eq("id",session.order_id).maybeSingle();
      if(data&&!data.is_test)return json(req,{ok:false,error:"NON_TEST_ORDER_REUSE_BLOCKED"},409);
      order=data;
    }
    if(!order){
      const external="HUNT-SBX-"+session.id;
      const {data:existing}=await ctx.supabaseAdmin.from("hunt_orders")
        .select("id,is_test,status,external_order_id").eq("provider","HUNT_SANDBOX")
        .eq("external_order_id",external).maybeSingle();
      order=existing;
      if(!order){
        assertTransition("order","placed","processing");
        const {data,error}=await ctx.supabaseAdmin.from("hunt_orders").insert({
          user_id:session.user_id,
          provider:"HUNT_SANDBOX",
          external_order_id:external,
          status:"processing",
          total_amount:session.total_amount,
          currency:session.currency,
          is_test:true,
          order_source:"supplier_sandbox",
          shipping_snapshot:shipping
        }).select("id,is_test,status,external_order_id").single();
        if(error||!data)throw new Error("TEST_ORDER_CREATE_FAILED");
        order=data;
        const {error:eventError}=await ctx.supabaseAdmin.from("hunt_order_events").insert({
          order_id:order.id,status:"processing",label:"HUNT sandbox fulfillment started"
        });
        requireWrite(eventError,"ORDER_EVENT_START_STORE_FAILED");
      }
      const {error:sessionStartError}=await ctx.supabaseAdmin.from("hunt_payment_sessions").update({
        order_id:order.id,fulfillment_status:"processing",updated_at:new Date().toISOString()
      }).eq("id",session.id);
      requireWrite(sessionStartError,"PAYMENT_SESSION_FULFILLMENT_START_FAILED");
    }

    const supplierResults:any[]=[];
    let index=0;
    for(const group of groups as any[]){
      index+=1;
      const country=clean(session.country_code).toUpperCase();
      const stableHash=(await sha256(session.id+"|"+group.group_key)).slice(0,12);
      const stableOrderNumber=("HSBX-"+session.id.slice(0,8)+"-"+stableHash).slice(0,50);

      const {data:existingFulfillment,error:existingError}=await ctx.supabaseAdmin
        .from("hunt_fulfillment_orders")
        .select("*")
        .eq("payment_session_id",session.id)
        .eq("provider","CJdropshipping")
        .eq("group_key",group.group_key)
        .maybeSingle();
      requireWrite(existingError,"FULFILLMENT_READ_FAILED");

      let fulfillment=existingFulfillment;
      let supplierId=clean(fulfillment?.supplier_order_id);
      let supplierCode=clean(fulfillment?.supplier_order_code)||stableOrderNumber;
      let track=clean(fulfillment?.tracking_number);
      let createRequestId:string|null=null;

      if(!fulfillment){
        const claimRow={
          payment_session_id:session.id,
          order_id:order.id,
          provider:"CJdropshipping",
          group_key:group.group_key,
          status:"processing",
          line_items:group.line_items,
          logistics_name:group.shipping_method,
          origin_country_code:group.origin_country_code,
          destination_country_code:country,
          supplier_order_code:stableOrderNumber,
          supplier_status:"sandbox_claimed",
          attempt_count:1,
          last_attempt_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        };
        const {data:claimed,error:claimError}=await ctx.supabaseAdmin
          .from("hunt_fulfillment_orders")
          .insert(claimRow)
          .select("*")
          .maybeSingle();

        if(claimError){
          const {data:raced,error:raceReadError}=await ctx.supabaseAdmin
            .from("hunt_fulfillment_orders")
            .select("*")
            .eq("payment_session_id",session.id)
            .eq("provider","CJdropshipping")
            .eq("group_key",group.group_key)
            .maybeSingle();
          requireWrite(raceReadError,"FULFILLMENT_RACE_READ_FAILED");
          if(!raced)throw new Error("FULFILLMENT_CLAIM_FAILED");
          fulfillment=raced;
        }else{
          fulfillment=claimed;
        }
        supplierId=clean(fulfillment?.supplier_order_id);
        supplierCode=clean(fulfillment?.supplier_order_code)||stableOrderNumber;
        track=clean(fulfillment?.tracking_number);
      }

      if(!supplierId){
        let reopenedFailedSandbox=false;
        if(clean(fulfillment?.supplier_status)==="sandbox_create_failed"){
          if(Number(fulfillment?.attempt_count||0)>=5)throw new Error("SANDBOX_RETRY_LIMIT_REACHED");
          const {data:reopened,error:reopenError}=await ctx.supabaseAdmin
            .from("hunt_fulfillment_orders")
            .update({
              status:"processing",supplier_status:"sandbox_claimed",last_error:null,
              updated_at:new Date().toISOString()
            })
            .eq("id",fulfillment.id)
            .eq("supplier_status","sandbox_create_failed")
            .select("*").maybeSingle();
          requireWrite(reopenError,"FULFILLMENT_REOPEN_FAILED");
          if(!reopened)throw new Error("FULFILLMENT_REOPEN_RACE");
          fulfillment=reopened;
          reopenedFailedSandbox=true;
        }
        if(clean(fulfillment?.supplier_status)!=="sandbox_claimed"){
          throw new Error("FULFILLMENT_ALREADY_PROCESSING");
        }
        if(Number(fulfillment?.attempt_count||0)>1&&!reopenedFailedSandbox){
          throw new Error("FULFILLMENT_ALREADY_PROCESSING");
        }

        const cjPayload={
          orderNumber:supplierCode,
          shippingZip:clean(shipping.shippingZip).slice(0,20),
          shippingCountry:countryNames[country],
          shippingCountryCode:country,
          shippingProvince:clean(shipping.shippingProvince).slice(0,50),
          shippingCity:clean(shipping.shippingCity).slice(0,50),
          shippingPhone:normalizeShippingPhone(country,shipping.shippingPhone).slice(0,20),
          shippingCustomerName:clean(shipping.shippingCustomerName).slice(0,50),
          shippingAddress:clean(shipping.shippingAddress).slice(0,200),
          shippingAddress2:clean(shipping.shippingAddress2).slice(0,200),
          email:clean(session.customer_email).slice(0,50),
          payType:3,
          isSandbox:1,
          logisticName:clean(group.shipping_method).slice(0,50),
          fromCountryCode:clean(group.origin_country_code).toUpperCase(),
          orderFlow:1,
          products:group.line_items.map((line:any,i:number)=>({
            vid:line.variant_id,
            quantity:line.qty,
            storeLineItemId:("HUNT-"+session.id.slice(0,8)+"-"+stableHash+"-"+(i+1)).slice(0,125)
          }))
        };
        const digest=await sha256(JSON.stringify(cjPayload));

        const {data:claimedForAttempt,error:attemptClaimError}=await ctx.supabaseAdmin
          .from("hunt_fulfillment_orders")
          .update({
            request_digest:digest,
            supplier_status:"sandbox_submitting",
            attempt_count:Number(fulfillment?.attempt_count||0)+1,
            last_attempt_at:new Date().toISOString(),
            updated_at:new Date().toISOString()
          })
          .eq("id",fulfillment.id)
          .eq("supplier_status","sandbox_claimed")
          .select("*")
          .maybeSingle();
        requireWrite(attemptClaimError,"FULFILLMENT_ATTEMPT_CLAIM_FAILED");
        if(!claimedForAttempt)throw new Error("FULFILLMENT_ALREADY_PROCESSING");
        fulfillment=claimedForAttempt;

        let created:any;
        try{
          created=await cjPost("/shopping/order/createOrderV2",cjPayload,{maxAttempts:5,reconcileOrderNumber:supplierCode});
        }catch(createError){
          const failure=clean((createError as Error)?.message)||"CJ_SANDBOX_CREATE_FAILED";
          const now=new Date().toISOString();
          assertTransition("fulfillment",clean(fulfillment?.status)||"processing","failed");
          const {error:fulfillmentFailError}=await ctx.supabaseAdmin
            .from("hunt_fulfillment_orders")
            .update({
              status:"failed",
              supplier_status:"sandbox_create_failed",
              last_error:failure,
              updated_at:now
            })
            .eq("id",fulfillment.id);
          requireWrite(fulfillmentFailError,"FULFILLMENT_FAILURE_STORE_FAILED");

          assertTransition("order",clean(order?.status)||"processing","exception");
          const {error:orderFailError}=await ctx.supabaseAdmin
            .from("hunt_orders")
            .update({status:"exception",updated_at:now})
            .eq("id",order.id);
          requireWrite(orderFailError,"ORDER_FAILURE_STORE_FAILED");

          const {error:sessionFailError}=await ctx.supabaseAdmin
            .from("hunt_payment_sessions")
            .update({fulfillment_status:"failed",updated_at:now})
            .eq("id",session.id);
          requireWrite(sessionFailError,"PAYMENT_SESSION_FAILURE_STORE_FAILED");

          await addPipelineRun(ctx,{
            payment_session_id:session.id,
            order_id:order.id,
            run_mode:"sandbox",
            stage:"supplier_created",
            status:"hold",
            provider:"CJdropshipping",
            evidence:{
              is_test:true,
              isSandbox:1,
              error:failure,
              no_real_supplier_charge:true,
              no_real_logistics:true
            },
            last_error:failure,
            created_by:uid
          });
          throw createError;
        }
        supplierId=clean(created?.data?.orderId);
        supplierCode=clean(created?.data?.orderNumber)||stableOrderNumber;
        createRequestId=clean(created?.requestId)||null;
        if(!supplierId)throw new Error("CJ_SANDBOX_ORDER_ID_MISSING");

        assertTransition("fulfillment",clean(fulfillment?.status)||"processing","submitted");
        const {error:submittedError}=await ctx.supabaseAdmin
          .from("hunt_fulfillment_orders")
          .update({
            status:"submitted",
            supplier_order_id:supplierId,
            supplier_order_code:supplierCode,
            supplier_status:"sandbox_created",
            last_error:null,
            updated_at:new Date().toISOString()
          })
          .eq("id",fulfillment.id);
        requireWrite(submittedError,"FULFILLMENT_STORE_FAILED");
        fulfillment={...fulfillment,status:"submitted",supplier_order_id:supplierId,supplier_order_code:supplierCode,supplier_status:"sandbox_created"};
      }

      const alreadyShipped=clean(fulfillment?.supplier_status)==="sandbox_shipped";
      let paid:any=null;
      let tracked:any=null;
      if(!alreadyShipped){
        paid=await cjPost("/shopping/sandbox/simulatePay",{orderId:supplierId});
        await cjPost("/shopping/sandbox/updateStatus",{orderId:supplierId,targetStatus:400});
        track=track||("HUNTSBX"+session.id.replace(/-/g,"").slice(0,12)+String(index)).slice(0,64);
        tracked=await cjPost("/shopping/sandbox/updateTrackNumber",{orderId:supplierId,trackNumber:track});
        await cjPost("/shopping/sandbox/updateStatus",{orderId:supplierId,targetStatus:500});
      }else{
        track=track||clean(fulfillment?.tracking_number);
      }

      const currentFulfillmentStatus=clean(fulfillment?.status)||"submitted";
      assertTransition("fulfillment",currentFulfillmentStatus,"shipped");
      const {error:fulfillmentShipError}=await ctx.supabaseAdmin.from("hunt_fulfillment_orders").update({
        status:"shipped",supplier_status:"sandbox_shipped",
        tracking_number:track,carrier:"CJ SANDBOX",
        shipped_at:new Date().toISOString(),updated_at:new Date().toISOString()
      }).eq("payment_session_id",session.id).eq("provider","CJdropshipping").eq("group_key",group.group_key);
      requireWrite(fulfillmentShipError,"FULFILLMENT_SHIPPED_STORE_FAILED");

      supplierResults.push({
        group_key:group.group_key,
        supplier_order_id:supplierId,
        supplier_order_code:supplierCode,
        tracking_number:track,
        create_request_id:createRequestId,
        simulate_pay_request_id:clean(paid?.requestId)||null,
        track_request_id:clean(tracked?.requestId)||null
      });
    }

    const primary=supplierResults[0]||{};
    assertTransition("order",clean(order?.status)||"processing","shipped");
    const {error:orderShipError}=await ctx.supabaseAdmin.from("hunt_orders").update({
      status:"shipped",
      carrier:"CJ SANDBOX",
      tracking_number:primary.tracking_number||null,
      shipped_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    }).eq("id",order.id);
    requireWrite(orderShipError,"ORDER_SHIPPED_STORE_FAILED");

    const {error:orderEventError}=await ctx.supabaseAdmin.from("hunt_order_events").insert({
      order_id:order.id,status:"shipped",label:"CJ sandbox tracking verified"
    });
    requireWrite(orderEventError,"ORDER_EVENT_SHIPPED_STORE_FAILED");

    const {error:sessionShipError}=await ctx.supabaseAdmin.from("hunt_payment_sessions").update({
      fulfillment_status:"shipped",updated_at:new Date().toISOString()
    }).eq("id",session.id);
    requireWrite(sessionShipError,"PAYMENT_SESSION_SHIPPED_STORE_FAILED");

    const evidence=await addPipelineRun(ctx,{
      payment_session_id:session.id,
      order_id:order.id,
      run_mode:"sandbox",
      stage:"completed",
      status:"pass",
      provider:"CJdropshipping",
      supplier_order_id:primary.supplier_order_id||null,
      supplier_order_code:primary.supplier_order_code||null,
      tracking_number:primary.tracking_number||null,
      evidence:{
        is_test:true,isSandbox:1,
        groups:supplierResults,
        no_real_supplier_charge:true,
        no_real_logistics:true
      },
      created_by:uid
    });

    return json(req,{
      ok:true,sandbox:true,is_test:true,
      order_id:order.id,
      fulfillment_status:"shipped",
      supplier_groups:supplierResults,
      evidence
    });
  }catch(e){
    return json(req,{ok:false,error:clean((e as Error)?.message)||"ORDER_PIPELINE_FAILED"},400);
  }
});
