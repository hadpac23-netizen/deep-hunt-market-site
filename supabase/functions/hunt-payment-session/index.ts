import { createSupabaseContext } from "npm:@supabase/server";

const ALLOWED_ORIGINS=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:8767",
  "http://localhost:8767",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null;

function normalizeShipping(body:any,country:string){
  const src=body?.shipping&&typeof body.shipping==="object"?body.shipping:{};
  const snapshot={
    shippingCustomerName:clean(src.shippingCustomerName).slice(0,50),
    shippingAddress:clean(src.shippingAddress).slice(0,500),
    shippingAddress2:clean(src.shippingAddress2).slice(0,500),
    shippingCity:clean(src.shippingCity).slice(0,50),
    shippingProvince:clean(src.shippingProvince).slice(0,50),
    shippingZip:clean(src.shippingZip).slice(0,20),
    shippingPhone:clean(src.shippingPhone).slice(0,20),
    shippingCountryCode:country
  };
  const email=clean(body?.customer_email||src.email).slice(0,254).toLowerCase();
  const missing=[
    ["shippingCustomerName",snapshot.shippingCustomerName],
    ["shippingAddress",snapshot.shippingAddress],
    ["shippingCity",snapshot.shippingCity],
    ["shippingProvince",snapshot.shippingProvince],
    ["shippingZip",snapshot.shippingZip],
    ["shippingPhone",snapshot.shippingPhone]
  ].filter(([,value])=>!value).map(([key])=>key);
  if(missing.length)throw new Error("SHIPPING_ADDRESS_INCOMPLETE");
  if(!email)throw new Error("CUSTOMER_EMAIL_REQUIRED");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("CUSTOMER_EMAIL_INVALID");
  return {snapshot,email};
}

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED_ORIGINS.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, authorization, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}});
}
async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function checkoutRequestDigest(body:any){
  const country=clean(body?.country_code).toUpperCase();
  const items=(Array.isArray(body?.items)?body.items:[]).map((raw:any)=>[
    clean(raw?.provider),clean(raw?.item_id),clean(raw?.variant_id),
    Math.max(1,Math.min(5,Number(raw?.qty||1)||1))
  ]).sort((a:any,b:any)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return sha256(JSON.stringify({country,items}));
}
function publishableKey(){
  try{
    const keys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
    return clean(keys.default);
  }catch{
    return clean(Deno.env.get("SUPABASE_ANON_KEY"));
  }
}
async function getProduct(base:string,key:string,provider:string,itemId:string,country:string){
  const url=new URL(base+"/functions/v1/hunt-storefront");
  url.searchParams.set("provider",provider);
  url.searchParams.set("product_id",itemId);
  url.searchParams.set("country_code",country);
  const res=await fetch(url,{headers:{apikey:key},cache:"no-store"});
  const body=await res.json().catch(()=>({}));
  if(!res.ok||!body?.product)throw new Error("PRODUCT_RECHECK_FAILED");
  return body.product;
}
async function getCjQuote(base:string,key:string,vid:string,country:string,qty:number){
  const url=new URL(base+"/functions/v1/hunt-cj-quote");
  url.searchParams.set("vid",vid);
  url.searchParams.set("country_code",country);
  url.searchParams.set("quantity",String(qty));
  const res=await fetch(url,{headers:{apikey:key},cache:"no-store"});
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error("SHIPPING_RECHECK_FAILED");
  return body;
}
async function validateCart(base:string,key:string,body:any){
  const country=clean(body?.country_code).toUpperCase();
  if(!/^[A-Z]{2}$/.test(country))throw new Error("COUNTRY_REQUIRED");
  const items=Array.isArray(body?.items)?body.items:[];
  if(!items.length||items.length>12)throw new Error("INVALID_CART");

  const lines:any[]=[];
  let productAmount=0;
  let shippingAmount=0;
  for(const raw of items){
    const provider=clean(raw?.provider);
    const itemId=clean(raw?.item_id);
    const variantId=clean(raw?.variant_id);
    const qty=Math.max(1,Math.min(5,Number(raw?.qty||1)||1));
    if(!provider||!itemId||!variantId)throw new Error("INVALID_LINE_ITEM");
    if(!provider.toLowerCase().includes("cj"))throw new Error("PROVIDER_PAYMENT_NOT_READY");
    const product=await getProduct(base,key,provider,itemId,country);
    const variants=Array.isArray(product?.variants)?product.variants:[];
    const variant=variants.find((v:any)=>clean(v?.variant_id)===variantId);
    if(!variant)throw new Error("VARIANT_RECHECK_FAILED");

    const retailVerified=(variant?.retail_price_verified??product?.retail_price_verified)===true;
    const profitPass=clean(variant?.profit_gate_status||product?.profit_gate_status)==="PASS";
    const retailAmount=num(variant?.retail_price_amount??product?.retail_price_amount);
    const retailCurrency=clean(variant?.retail_currency||product?.retail_currency||"").toUpperCase();
    if(!retailVerified||!profitPass||!(retailAmount&&retailAmount>0))throw new Error("RETAIL_PRICE_NOT_READY");
    if(retailCurrency!=="USD")throw new Error("CURRENCY_REVIEW_REQUIRED");

    const quote=await getCjQuote(base,key,variantId,country,qty);
    const shipping=Array.isArray(quote?.shipping_options)?quote.shipping_options[0]:null;
    if(quote?.stock_verified!==true||quote?.stock_available!==true)throw new Error("OUT_OF_STOCK");
    if(quote?.shipping_verified!==true||!shipping||!(num(shipping?.price_usd)>=0))throw new Error("SHIPPING_UNAVAILABLE");

    const lineProduct=retailAmount*qty;
    productAmount+=lineProduct;
    shippingAmount+=Number(shipping.price_usd);
    lines.push({
      provider,item_id:itemId,variant_id:variantId,qty,
      title:clean(product?.title).slice(0,180),
      unit_retail_amount:Number(retailAmount.toFixed(2)),
      supplier_cost_per_unit:Number(Number(num(variant?.price_amount??product?.price_amount)||0).toFixed(2)),
      currency:"USD",
      shipping_amount:Number(Number(shipping.price_usd).toFixed(2)),
      shipping_method:clean(shipping?.name).slice(0,120),
      origin_country_code:clean(quote?.selected_origin?.country_code).toUpperCase()||null,
      quote_checked_at:new Date().toISOString()
    });
  }
  return {
    country_code:country,currency:"USD",
    product_amount:Number(productAmount.toFixed(2)),
    shipping_amount:Number(shippingAmount.toFixed(2)),
    total_amount:Number((productAmount+shippingAmount).toFixed(2)),
    line_items:lines
  };
}
async function maybeApplyCheckoutOffer(ctx:any,body:any,pricing:any,requestDigest:string){
  const offerId=clean(body?.checkout_offer_id).slice(0,80);
  const zero={discount_amount:0,pre_discount_total_amount:pricing.total_amount,checkout_offer_id:null,application_enabled:false};
  if(!offerId)return zero;

  const {data:control}=await ctx.supabaseAdmin
    .from("hunt_runtime_controls")
    .select("enabled,owner_approved")
    .eq("key","hunt_bundle_discount_apply")
    .maybeSingle();
  const enabled=control?.enabled===true&&control?.owner_approved===true;
  if(!enabled)return {...zero,checkout_offer_id:offerId,application_enabled:false};

  const {data:offer}=await ctx.supabaseAdmin
    .from("hunt_checkout_offers")
    .select("id,cart_request_digest,country_code,currency,discount_amount,policy_id,status,inputs_verified,expires_at")
    .eq("id",offerId)
    .maybeSingle();
  if(!offer)throw new Error("CHECKOUT_OFFER_NOT_FOUND");
  if(offer.status!=="preview"||offer.inputs_verified!==true)throw new Error("CHECKOUT_OFFER_NOT_READY");
  if(Date.parse(offer.expires_at||"")<=Date.now())throw new Error("CHECKOUT_OFFER_EXPIRED");
  if(clean(offer.cart_request_digest)!==requestDigest)throw new Error("CHECKOUT_OFFER_CART_MISMATCH");
  if(clean(offer.country_code).toUpperCase()!==pricing.country_code)throw new Error("CHECKOUT_OFFER_COUNTRY_MISMATCH");
  if(clean(offer.currency).toUpperCase()!==pricing.currency)throw new Error("CHECKOUT_OFFER_CURRENCY_MISMATCH");

  const {data:policy}=await ctx.supabaseAdmin
    .from("hunt_coupon_policies")
    .select("id,status,owner_approved,starts_at,ends_at,requires_profit_gate")
    .eq("id",offer.policy_id)
    .maybeSingle();
  const now=Date.now();
  if(!policy||policy.status!=="active"||policy.owner_approved!==true)throw new Error("CHECKOUT_OFFER_POLICY_INACTIVE");
  if(policy.starts_at&&Date.parse(policy.starts_at)>now)throw new Error("CHECKOUT_OFFER_POLICY_INACTIVE");
  if(policy.ends_at&&Date.parse(policy.ends_at)<=now)throw new Error("CHECKOUT_OFFER_POLICY_EXPIRED");

  const {data:profile}=await ctx.supabaseAdmin
    .from("hunt_profit_profiles")
    .select("payment_rate,refund_reserve_rate,platform_variable_rate,platform_fixed_per_order,min_contribution_per_unit,max_coupon_rate")
    .eq("status","active").eq("owner_approved",true)
    .order("updated_at",{ascending:false}).limit(1).maybeSingle();
  if(!profile)throw new Error("PROFIT_PROFILE_NOT_ACTIVE");

  const supplierProduct=pricing.line_items.reduce((sum:number,x:any)=>sum+Number(x.supplier_cost_per_unit||0)*Number(x.qty||1),0);
  const supplierShipping=pricing.line_items.reduce((sum:number,x:any)=>sum+Number(x.shipping_amount||0),0);
  const units=pricing.line_items.reduce((sum:number,x:any)=>sum+Number(x.qty||1),0);
  const total=Number(pricing.total_amount||0);
  const payment=total*Number(profile.payment_rate||0);
  const refund=total*Number(profile.refund_reserve_rate||0);
  const platform=total*Number(profile.platform_variable_rate||0)+Number(profile.platform_fixed_per_order||0);
  const contribution=total-supplierProduct-supplierShipping-payment-refund-platform;
  const minimum=Number(profile.min_contribution_per_unit||0)*units;
  const safeCapacity=Math.max(0,Math.min(
    contribution-minimum,
    Number(pricing.product_amount||0)*Number(profile.max_coupon_rate||0)
  ));
  const discount=Math.max(0,Math.min(Number(offer.discount_amount||0),safeCapacity,Number(pricing.product_amount||0)));
  if(!(discount>0))throw new Error("CHECKOUT_OFFER_NO_LONGER_SAFE");

  return {
    discount_amount:Number(discount.toFixed(2)),
    pre_discount_total_amount:Number(pricing.total_amount.toFixed(2)),
    checkout_offer_id:offer.id,
    application_enabled:true
  };
}

async function buildProfitPreview(ctx:any,pricing:any){
  const lines=Array.isArray(pricing?.line_items)?pricing.line_items:[];
  const issues:string[]=[];
  if(!lines.length)issues.push("LINE_ITEMS_MISSING");
  if(lines.some((x:any)=>!Number.isFinite(Number(x?.supplier_cost_per_unit))))issues.push("SUPPLIER_PRODUCT_COST_UNKNOWN");
  if(lines.some((x:any)=>!Number.isFinite(Number(x?.shipping_amount))))issues.push("SUPPLIER_SHIPPING_COST_UNKNOWN");

  const {data:profile}=await ctx.supabaseAdmin
    .from("hunt_profit_profiles")
    .select("payment_rate,refund_reserve_rate,platform_variable_rate,platform_fixed_per_order,min_contribution_per_unit")
    .eq("status","active")
    .eq("owner_approved",true)
    .order("updated_at",{ascending:false})
    .limit(1)
    .maybeSingle();

  if(!profile)issues.push("PROFIT_PROFILE_NOT_ACTIVE");

  const currency=clean(pricing?.currency||"USD").toUpperCase()||"USD";
  const productRevenue=Number(pricing?.product_amount||0);
  const shippingRevenue=Number(pricing?.shipping_amount||0);
  const discount=Number(pricing?.discount_amount||0);
  const revenue=Number(pricing?.total_amount||0);
  const units=lines.reduce((sum:number,x:any)=>sum+Math.max(1,Number(x?.qty)||1),0);
  const supplierProduct=lines.reduce((sum:number,x:any)=>
    sum+(Number(x?.supplier_cost_per_unit)||0)*Math.max(1,Number(x?.qty)||1),0);
  const supplierShipping=lines.reduce((sum:number,x:any)=>sum+(Number(x?.shipping_amount)||0),0);

  if(issues.length){
    return {
      status:"PREP",
      realized:false,
      basis:"QUOTE",
      currency,
      revenue_amount:Number(revenue.toFixed(2)),
      product_revenue_amount:Number(productRevenue.toFixed(2)),
      shipping_revenue_amount:Number(shippingRevenue.toFixed(2)),
      discount_amount:Number(discount.toFixed(2)),
      supplier_product_cost:Number(supplierProduct.toFixed(2)),
      supplier_shipping_cost:Number(supplierShipping.toFixed(2)),
      contribution_amount:null,
      contribution_margin_rate:null,
      payment_fee_reserve:null,
      refund_reserve:null,
      platform_fee:null,
      units,
      issues
    };
  }

  const payment= revenue*Number(profile.payment_rate||0);
  const refund= revenue*Number(profile.refund_reserve_rate||0);
  const platform= revenue*Number(profile.platform_variable_rate||0)+Number(profile.platform_fixed_per_order||0);
  const contribution=revenue-supplierProduct-supplierShipping-payment-refund-platform;
  const margin=revenue>0?contribution/revenue:null;
  const minimum=Number(profile.min_contribution_per_unit||0)*units;

  return {
    status:contribution>=minimum?"QUOTE_PROFIT_PREVIEW":"QUOTE_PROFIT_HOLD",
    realized:false,
    basis:"QUOTE",
    currency,
    revenue_amount:Number(revenue.toFixed(2)),
    product_revenue_amount:Number(productRevenue.toFixed(2)),
    shipping_revenue_amount:Number(shippingRevenue.toFixed(2)),
    discount_amount:Number(discount.toFixed(2)),
    supplier_product_cost:Number(supplierProduct.toFixed(2)),
    supplier_shipping_cost:Number(supplierShipping.toFixed(2)),
    payment_fee_reserve:Number(payment.toFixed(2)),
    refund_reserve:Number(refund.toFixed(2)),
    platform_fee:Number(platform.toFixed(2)),
    contribution_amount:Number(contribution.toFixed(2)),
    contribution_margin_rate:margin===null?null:Number(margin.toFixed(4)),
    minimum_contribution:Number(minimum.toFixed(2)),
    units,
    fees_are_reserves:true,
    issues:[]
  };
}

async function createPayPlusSession(sessionId:string,pricing:any){
  const apiKey=clean(Deno.env.get("PAYPLUS_API_KEY"));
  const secretKey=clean(Deno.env.get("PAYPLUS_SECRET_KEY"));
  const pageUid=clean(Deno.env.get("PAYPLUS_PAYMENT_PAGE_UID"));
  const mode=clean(Deno.env.get("HUNT_PAYMENT_MODE")).toLowerCase()||"prelaunch";
  if(!apiKey||!secretKey||!pageUid||!["sandbox","live"].includes(mode))return null;

  const base=mode==="live"
    ?"https://restapi.payplus.co.il/api/v1.0"
    :"https://restapidev.payplus.co.il/api/v1.0";
  const site=clean(Deno.env.get("HUNT_SITE_URL"))||"https://deep-hunt-market.netlify.app";
  const supabaseUrl=clean(Deno.env.get("SUPABASE_URL"));
  const payload={
    payment_page_uid:pageUid,
    charge_method:1,
    amount:pricing.total_amount,
    currency_code:pricing.currency,
    expiry_datetime:30,
    sendEmailApproval:true,
    sendEmailFailure:false,
    refURL_success:site+"/checkout.html?payment=success",
    refURL_failure:site+"/checkout.html?payment=failed",
    refURL_cancel:site+"/checkout.html?payment=cancelled",
    refURL_callback:supabaseUrl+"/functions/v1/hunt-payplus-callback",
    send_failure_callback:true,
    allowed_charge_methods:["credit-card","apple-pay","google-pay"],
    more_info:sessionId
  };
  const res=await fetch(base+"/PaymentPages/generateLink",{
    method:"POST",
    headers:{"content-type":"application/json","api-key":apiKey,"secret-key":secretKey},
    body:JSON.stringify(payload)
  });
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error("PAYMENT_PROVIDER_SESSION_FAILED");
  const data=body?.data||body;
  return {
    mode,
    request_uid:clean(data?.page_request_uid||data?.payment_request_uid),
    hosted_fields_uid:clean(data?.hosted_fields_uuid),
    redirect_url:clean(data?.payment_page_link||data?.payment_page_url||data?.url),
    expires_at:new Date(Date.now()+30*60*1000).toISOString()
  };
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);

  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);

  try{
    const body=await req.json();
    const configuredMode=clean(Deno.env.get("HUNT_PAYMENT_MODE")).toLowerCase()||"prelaunch";
    if(configuredMode==="live"){
      const {data:liveControl}=await ctx.supabaseAdmin
        .from("hunt_runtime_controls")
        .select("enabled,owner_approved")
        .eq("key","hunt_payment_live")
        .maybeSingle();
      if(liveControl?.enabled!==true||liveControl?.owner_approved!==true){
        return json(req,{ok:false,error:"LIVE_PAYMENT_DISABLED"},409);
      }
    }
    const base=clean(Deno.env.get("SUPABASE_URL"));
    const key=publishableKey();
    if(!base||!key)throw new Error("SERVER_CONFIG_MISSING");
    const pricing=await validateCart(base,key,body);
    const shipping=normalizeShipping(body,pricing.country_code);
    const requestDigest=await checkoutRequestDigest(body);
    const offerApplication=await maybeApplyCheckoutOffer(ctx,body,pricing,requestDigest);
    const finalPricing={
      ...pricing,
      pre_discount_total_amount:offerApplication.pre_discount_total_amount,
      discount_amount:offerApplication.discount_amount,
      checkout_offer_id:offerApplication.checkout_offer_id,
      total_amount:Number((pricing.total_amount-offerApplication.discount_amount).toFixed(2))
    };
    const profitPreview=await buildProfitPreview(ctx,finalPricing);
    const requestedIdem=clean(body?.idempotency_key).slice(0,120);
    const idempotencyKey=requestedIdem||crypto.randomUUID();
    const normalized=JSON.stringify({
      country:pricing.country_code,
      offer:finalPricing.checkout_offer_id||null,
      shipping:shipping.snapshot,
      customer_email:shipping.email,
      items:pricing.line_items.map((x:any)=>[
        x.provider,x.item_id,x.variant_id,x.qty,x.origin_country_code,x.shipping_method
      ])
    });
    const cartDigest=await sha256(normalized);

    const {data:existing}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .select("id,status,mode,country_code,currency,product_amount,shipping_amount,pre_discount_total_amount,discount_amount,total_amount,checkout_offer_id,provider_hosted_fields_uid,provider_redirect_url,expires_at,cart_digest,line_items")
      .eq("idempotency_key",idempotencyKey)
      .maybeSingle();
    if(existing){
      if(clean(existing.cart_digest)!==cartDigest){
        return json(req,{ok:false,error:"IDEMPOTENCY_CONFLICT"},409);
      }
      const profitPreview=await buildProfitPreview(ctx,existing);
      return json(req,{
        ok:true,reused:true,
        payment_ready:existing.status!=="prelaunch",
        idempotency_key:idempotencyKey,
        session:existing,
        profit_preview:profitPreview
      });
    }

    const requestedMode=clean(Deno.env.get("HUNT_PAYMENT_MODE")).toLowerCase();
    const configured=Boolean(
      clean(Deno.env.get("PAYPLUS_API_KEY"))&&
      clean(Deno.env.get("PAYPLUS_SECRET_KEY"))&&
      clean(Deno.env.get("PAYPLUS_PAYMENT_PAGE_UID"))
    );
    const initialMode=configured&&["sandbox","live"].includes(requestedMode)?requestedMode:"prelaunch";
    const {data:inserted,error:insertError}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .insert({
        user_id:ctx.userClaims?.id||ctx.userClaims?.sub||null,
        provider:"payplus",
        mode:initialMode,
        status:initialMode==="prelaunch"?"prelaunch":"created",
        country_code:pricing.country_code,
        currency:pricing.currency,
        product_amount:pricing.product_amount,
        shipping_amount:pricing.shipping_amount,
        pre_discount_total_amount:pricing.total_amount,
        discount_amount:0,
        total_amount:pricing.total_amount,
        checkout_offer_id:null,
        line_items:pricing.line_items,
        customer_email:shipping.email,
        shipping_snapshot:shipping.snapshot,
        cart_digest:cartDigest,
        idempotency_key:idempotencyKey
      })
      .select("id,status,mode,country_code,currency,product_amount,shipping_amount,pre_discount_total_amount,discount_amount,total_amount,checkout_offer_id,expires_at")
      .single();
    if(insertError||!inserted)throw new Error("PAYMENT_SESSION_STORE_FAILED");

    let activeSession=inserted;
    let offerClaimed=false;
    if(finalPricing.checkout_offer_id&&offerApplication.application_enabled){
      const now=new Date().toISOString();
      const {data:claimed,error:claimError}=await ctx.supabaseAdmin
        .from("hunt_checkout_offers")
        .update({
          status:"applied",
          applied_payment_session_id:inserted.id,
          updated_at:now
        })
        .eq("id",finalPricing.checkout_offer_id)
        .eq("status","preview")
        .is("applied_payment_session_id",null)
        .select("id")
        .maybeSingle();

      if(claimError||!claimed){
        await ctx.supabaseAdmin.from("hunt_payment_sessions").delete().eq("id",inserted.id);
        return json(req,{ok:false,error:"CHECKOUT_OFFER_ALREADY_CLAIMED"},409);
      }
      offerClaimed=true;

      const {data:discounted,error:discountError}=await ctx.supabaseAdmin
        .from("hunt_payment_sessions")
        .update({
          pre_discount_total_amount:finalPricing.pre_discount_total_amount,
          discount_amount:finalPricing.discount_amount,
          total_amount:finalPricing.total_amount,
          checkout_offer_id:finalPricing.checkout_offer_id,
          updated_at:now
        })
        .eq("id",inserted.id)
        .select("id,status,mode,country_code,currency,product_amount,shipping_amount,pre_discount_total_amount,discount_amount,total_amount,checkout_offer_id,expires_at")
        .single();

      if(discountError||!discounted){
        await ctx.supabaseAdmin.from("hunt_checkout_offers").update({
          status:"preview",
          applied_payment_session_id:null,
          updated_at:new Date().toISOString()
        }).eq("id",finalPricing.checkout_offer_id).eq("applied_payment_session_id",inserted.id);
        await ctx.supabaseAdmin.from("hunt_payment_sessions").delete().eq("id",inserted.id);
        throw new Error("CHECKOUT_OFFER_SESSION_UPDATE_FAILED");
      }
      activeSession=discounted;
    }

    if(initialMode==="prelaunch"){
      const {error:eventError}=await ctx.supabaseAdmin.from("hunt_payment_events").insert({
        payment_session_id:activeSession.id,
        provider:"payplus",
        event_type:"prelaunch_session_created",
        payload_digest:cartDigest
      });
      if(eventError){
        if(offerClaimed&&finalPricing.checkout_offer_id){
          await ctx.supabaseAdmin.from("hunt_checkout_offers").update({
            status:"preview",
            applied_payment_session_id:null,
            updated_at:new Date().toISOString()
          }).eq("id",finalPricing.checkout_offer_id).eq("applied_payment_session_id",activeSession.id);
        }
        await ctx.supabaseAdmin.from("hunt_payment_sessions").delete().eq("id",activeSession.id);
        throw new Error("PAYMENT_EVENT_STORE_FAILED");
      }
      return json(req,{
        ok:true,
        payment_ready:false,
        shipping_ready:true,
        reason:"AUTHORIZED_PAYMENT_ACCOUNT_REQUIRED",
        idempotency_key:idempotencyKey,
        session:activeSession,
        profit_preview:profitPreview
      });
    }

    let providerSession:any=null;
    try{
      providerSession=await createPayPlusSession(activeSession.id,finalPricing);
      if(!providerSession)throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
    }catch(providerError){
      if(offerClaimed&&finalPricing.checkout_offer_id){
        await ctx.supabaseAdmin.from("hunt_checkout_offers").update({
          status:"preview",
          applied_payment_session_id:null,
          updated_at:new Date().toISOString()
        }).eq("id",finalPricing.checkout_offer_id).eq("applied_payment_session_id",activeSession.id);
      }
      await ctx.supabaseAdmin.from("hunt_payment_sessions").delete().eq("id",activeSession.id);
      throw providerError;
    }
    const {data:updated,error:updateError}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .update({
        status:"pending",
        provider_request_uid:providerSession.request_uid||null,
        provider_hosted_fields_uid:providerSession.hosted_fields_uid||null,
        provider_redirect_url:providerSession.redirect_url||null,
        expires_at:providerSession.expires_at,
        updated_at:new Date().toISOString()
      })
      .eq("id",activeSession.id)
      .select("id,status,mode,country_code,currency,product_amount,shipping_amount,pre_discount_total_amount,discount_amount,total_amount,checkout_offer_id,provider_request_uid,provider_hosted_fields_uid,provider_redirect_url,expires_at")
      .single();
    if(updateError||!updated)throw new Error("PAYMENT_SESSION_UPDATE_FAILED");

    const {error:eventError}=await ctx.supabaseAdmin.from("hunt_payment_events").insert({
      payment_session_id:activeSession.id,
      provider:"payplus",
      event_type:"session_created"
    });
    if(eventError)throw new Error("PAYMENT_EVENT_STORE_FAILED");

    return json(req,{
      ok:true,
      payment_ready:true,
      idempotency_key:idempotencyKey,
      integration:updated.provider_hosted_fields_uid?"hosted_fields":"hosted_page",
      session:updated,
      profit_preview:profitPreview
    });
  }catch(error){
    return json(req,{
      ok:false,
      error:clean((error as Error)?.message)||"payment session failed"
    },400);
  }
});