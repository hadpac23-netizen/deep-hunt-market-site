import { createSupabaseContext } from "npm:@supabase/server";

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
  const uid=clean(ctx.userClaims?.sub);
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
async function cjPost(path:string,body:any){
  const token=await cjToken();
  const res=await fetch("https://developers.cjdropshipping.com/api2.0/v1"+path,{
    method:"POST",
    headers:{"content-type":"application/json","accept":"application/json","CJ-Access-Token":token},
    body:JSON.stringify(body)
  });
  const out=await res.json().catch(()=>({}));
  if(!res.ok||out?.result!==true){
    throw new Error("CJ_API_"+String(out?.code||res.status)+"_"+clean(out?.message).slice(0,120));
  }
  return out;
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

    const uid=clean(ctx.userClaims?.sub);
    if(session.user_id&&uid&&session.user_id!==uid&&!(await isAdmin(ctx))){
      return json(req,{ok:false,error:"SESSION_OWNER_MISMATCH"},403);
    }

    const lines=Array.isArray(session.line_items)?session.line_items:[];
    const shipping=session.shipping_snapshot&&typeof session.shipping_snapshot==="object"
      ? session.shipping_snapshot:{};
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
        await ctx.supabaseAdmin.from("hunt_order_events").insert({
          order_id:order.id,status:"processing",label:"HUNT sandbox fulfillment started"
        });
      }
      await ctx.supabaseAdmin.from("hunt_payment_sessions").update({
        order_id:order.id,fulfillment_status:"processing",updated_at:new Date().toISOString()
      }).eq("id",session.id);
    }

    const supplierResults:any[]=[];
    let index=0;
    for(const group of groups as any[]){
      index+=1;
      const {data:existingFulfillment}=await ctx.supabaseAdmin.from("hunt_fulfillment_orders")
        .select("*").eq("payment_session_id",session.id).eq("provider","CJdropshipping")
        .eq("group_key",group.group_key).maybeSingle();

      let supplierId=clean(existingFulfillment?.supplier_order_id);
      let supplierCode=clean(existingFulfillment?.supplier_order_code);
      let track=clean(existingFulfillment?.tracking_number);
      let createRequestId:string|null=null;

      if(!supplierId){
        const country=clean(session.country_code).toUpperCase();
        const orderNumber=("HSBX-"+session.id.slice(0,8)+"-"+index+"-"+Date.now().toString().slice(-8)).slice(0,50);
        const cjPayload={
          orderNumber,
          shippingZip:clean(shipping.shippingZip).slice(0,20),
          shippingCountry:countryNames[country],
          shippingCountryCode:country,
          shippingProvince:clean(shipping.shippingProvince).slice(0,50),
          shippingCity:clean(shipping.shippingCity).slice(0,50),
          shippingPhone:clean(shipping.shippingPhone).slice(0,20),
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
            storeLineItemId:("HUNT-"+session.id.slice(0,8)+"-"+index+"-"+(i+1)).slice(0,125)
          }))
        };
        const digest=await sha256(JSON.stringify(cjPayload));
        const created=await cjPost("/shopping/order/createOrderV2",cjPayload);
        supplierId=clean(created?.data?.orderId);
        supplierCode=clean(created?.data?.orderNumber)||orderNumber;
        createRequestId=clean(created?.requestId)||null;
        if(!supplierId)throw new Error("CJ_SANDBOX_ORDER_ID_MISSING");

        const row={
          payment_session_id:session.id,order_id:order.id,provider:"CJdropshipping",
          group_key:group.group_key,status:"submitted",line_items:group.line_items,
          logistics_name:group.shipping_method,origin_country_code:group.origin_country_code,
          destination_country_code:country,supplier_order_id:supplierId,
          supplier_order_code:supplierCode,supplier_status:"sandbox_created",
          request_digest:digest,attempt_count:Number(existingFulfillment?.attempt_count||0)+1,
          last_attempt_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()
        };
        const {error}=await ctx.supabaseAdmin.from("hunt_fulfillment_orders")
          .upsert(row,{onConflict:"payment_session_id,provider,group_key"});
        if(error)throw new Error("FULFILLMENT_STORE_FAILED");
      }

      const paid=await cjPost("/shopping/sandbox/simulatePay",{orderId:supplierId});
      await cjPost("/shopping/sandbox/updateStatus",{orderId:supplierId,targetStatus:400});
      track=track||("HUNTSBX"+session.id.replace(/-/g,"").slice(0,12)+String(index)).slice(0,64);
      const tracked=await cjPost("/shopping/sandbox/updateTrackNumber",{orderId:supplierId,trackNumber:track});
      await cjPost("/shopping/sandbox/updateStatus",{orderId:supplierId,targetStatus:500});

      await ctx.supabaseAdmin.from("hunt_fulfillment_orders").update({
        status:"shipped",supplier_status:"sandbox_shipped",
        tracking_number:track,carrier:"CJ SANDBOX",
        shipped_at:new Date().toISOString(),updated_at:new Date().toISOString()
      }).eq("payment_session_id",session.id).eq("provider","CJdropshipping").eq("group_key",group.group_key);

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
    await ctx.supabaseAdmin.from("hunt_orders").update({
      status:"shipped",
      carrier:"CJ SANDBOX",
      tracking_number:primary.tracking_number||null,
      shipped_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    }).eq("id",order.id);
    await ctx.supabaseAdmin.from("hunt_order_events").insert({
      order_id:order.id,status:"shipped",label:"CJ sandbox tracking verified"
    });
    await ctx.supabaseAdmin.from("hunt_payment_sessions").update({
      fulfillment_status:"shipped",updated_at:new Date().toISOString()
    }).eq("id",session.id);

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
