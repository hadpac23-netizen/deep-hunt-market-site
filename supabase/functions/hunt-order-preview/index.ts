import { createSupabaseContext } from "npm:@supabase/server";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const json=(req:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{
    "content-type":"application/json",
    "cache-control":"no-store",
    "access-control-allow-origin":req.headers.get("origin")||"*",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "vary":"Origin"
  }
});

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return json(req,{ok:true});
  if(req.method!=="POST") return json(req,{error:"method not allowed"},405);

  const {data:ctx,error}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(error||!ctx) return json(req,{error:"unauthorized"},error?.status||401);

  try{
    const body=await req.json();
    const sessionId=clean(body?.payment_session_id);
    const idempotencyKey=clean(body?.idempotency_key);
    if(!sessionId||!idempotencyKey) return json(req,{ok:false,error:"SESSION_AND_IDEMPOTENCY_REQUIRED"},400);

    const {data:session,error:sessionError}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .select("id,user_id,provider,mode,status,country_code,currency,product_amount,shipping_amount,total_amount,line_items,idempotency_key,provider_request_uid,expires_at,created_at")
      .eq("id",sessionId)
      .eq("idempotency_key",idempotencyKey)
      .maybeSingle();

    if(sessionError||!session) return json(req,{ok:false,error:"SESSION_NOT_FOUND"},404);

    const userSub=clean(ctx.userClaims?.sub);
    if(session.user_id && userSub && session.user_id!==userSub) {
      return json(req,{ok:false,error:"SESSION_OWNER_MISMATCH"},403);
    }

    const lines=Array.isArray(session.line_items)?session.line_items:[];
    const groups:Record<string,{provider:string,origin_country_code:string,shipping_method:string,line_items:any[]}>= {};

    for(const line of lines){
      const provider=clean(line?.provider)||"unknown";
      const origin=clean(line?.origin_country_code).toUpperCase();
      const shippingMethod=clean(line?.shipping_method);
      const groupKey=[provider,origin||"missing-origin",shippingMethod||"missing-logistics"].join("|");
      if(!groups[groupKey]){
        groups[groupKey]={
          provider,
          origin_country_code:origin,
          shipping_method:shippingMethod,
          line_items:[]
        };
      }
      groups[groupKey].line_items.push({
        item_id:clean(line?.item_id),
        variant_id:clean(line?.variant_id),
        qty:Math.max(1,Math.min(5,Number(line?.qty||1)||1)),
        unit_retail_amount:Number(line?.unit_retail_amount||0),
        currency:clean(line?.currency)||session.currency,
        shipping_amount:Number(line?.shipping_amount||0),
        quote_checked_at:clean(line?.quote_checked_at)||null
      });
    }

    const blockers:string[]=[];
    if(session.mode==="prelaunch") blockers.push("PAYMENT_ACCOUNT_NOT_ACTIVE");
    if(!["paid","succeeded","completed"].includes(clean(session.status).toLowerCase())) blockers.push("PAYMENT_NOT_CONFIRMED");
    if(!lines.length) blockers.push("EMPTY_LINE_ITEMS");
    if(lines.some((x:any)=>!clean(x?.provider).toLowerCase().includes("cj"))) blockers.push("NON_CJ_FULFILLMENT_NOT_READY");
    if(lines.some((x:any)=>!clean(x?.origin_country_code))) blockers.push("ORIGIN_NOT_PERSISTED");
    if(lines.some((x:any)=>!clean(x?.shipping_method))) blockers.push("LOGISTICS_NOT_PERSISTED");
    blockers.push("SHIPPING_ADDRESS_NOT_COLLECTED");
    blockers.push("SUPPLIER_ORDER_CREATION_DISABLED");

    const fulfillmentPreview=Object.values(groups).map(group=>({
      provider:group.provider,
      origin_country_code:group.origin_country_code||null,
      shipping_method:group.shipping_method||null,
      line_count:group.line_items.length,
      line_items:group.line_items,
      cj_create_order_v2_payload_preview:group.provider.toLowerCase().includes("cj") ? {
        orderNumber:"<generated_at_live_checkout>",
        shippingCountryCode:session.country_code,
        fromCountryCode:group.origin_country_code||"<missing_origin>",
        logisticName:group.shipping_method||"<missing_logistics>",
        payType:3,
        isSandbox:1,
        products:group.line_items.map((line:any)=>({
          vid:line.variant_id,
          quantity:line.qty
        }))
      } : null,
      required_shipping_fields:[
        "shippingCustomerName",
        "shippingAddress",
        "shippingCity",
        "shippingProvince",
        "shippingZip",
        "shippingPhone"
      ],
      supplier_order_will_be_created:false
    }));

    return json(req,{
      ok:true,
      dry_run:true,
      payment_session:{
        id:session.id,
        mode:session.mode,
        status:session.status,
        country_code:session.country_code,
        currency:session.currency,
        product_amount:session.product_amount,
        shipping_amount:session.shipping_amount,
        total_amount:session.total_amount
      },
      fulfillment_preview:fulfillmentPreview,
      ready_for_live_payment:session.mode==="live" && !blockers.includes("PAYMENT_ACCOUNT_NOT_ACTIVE"),
      ready_for_supplier_order:false,
      blockers
    });
  }catch(e){
    return json(req,{ok:false,error:clean((e as Error)?.message)||"ORDER_PREVIEW_FAILED"},400);
  }
});