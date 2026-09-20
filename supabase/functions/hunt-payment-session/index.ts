import { createSupabaseContext } from "npm:@supabase/server";
import { evaluateCommerceProfit, minimumSafeSalePricePerUnit } from "../_shared/hunt-commerce-profit.mjs";

const ALLOWED_ORIGINS=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:8767",
  "http://localhost:8767"
]);
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null;

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
function publishableKey(){
  try{
    const keys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
    return clean(keys.default);
  }catch{
    return clean(Deno.env.get("SUPABASE_ANON_KEY"));
  }
}
async function authenticatedUserId(ctx:any,req:Request){
  const claimId=clean(ctx?.userClaims?.sub);
  if(claimId)return claimId;
  const auth=clean(req.headers.get("authorization"));
  const match=auth.match(/^Bearer\s+(.+)$/i);
  if(!match?.[1])return null;
  const token=clean(match[1]);
  if(!token||token===publishableKey())return null;
  const {data,error}=await ctx.supabaseAdmin.auth.getUser(token);
  if(error||!data?.user?.id)return null;
  return clean(data.user.id);
}
async function activeProfitProfile(ctx:any){
  const {data,error}=await ctx.supabaseAdmin
    .from("hunt_profit_profiles")
    .select("id,name,payment_rate,refund_reserve_rate,platform_variable_rate,platform_fixed_per_order,min_contribution_per_unit,min_margin_rate,max_coupon_rate,updated_at")
    .eq("status","active")
    .eq("owner_approved",true)
    .order("updated_at",{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error||!data)throw new Error("PROFIT_PROFILE_NOT_ACTIVE");
  return data;
}
function sanitizeShipping(body:any,country:string){
  const raw=body?.shipping_snapshot&&typeof body.shipping_snapshot==="object"?body.shipping_snapshot:{};
  const cap=(value:unknown,max:number)=>clean(value).slice(0,max);
  const email=cap(body?.customer_email,254);
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("INVALID_CUSTOMER_EMAIL");
  const snapshot={
    shippingCustomerName:cap(raw.shippingCustomerName,80),
    shippingAddress:cap(raw.shippingAddress,160),
    shippingAddress2:cap(raw.shippingAddress2,160),
    shippingCity:cap(raw.shippingCity,80),
    shippingProvince:cap(raw.shippingProvince,80),
    shippingZip:cap(raw.shippingZip,20),
    shippingPhone:cap(raw.shippingPhone,30),
    shippingCountryCode:country
  };
  const hasAny=Boolean(email||snapshot.shippingCustomerName||snapshot.shippingAddress||snapshot.shippingAddress2||snapshot.shippingCity||snapshot.shippingProvince||snapshot.shippingZip||snapshot.shippingPhone);
  const complete=Boolean(email&&snapshot.shippingCustomerName&&snapshot.shippingAddress&&snapshot.shippingCity&&snapshot.shippingProvince&&snapshot.shippingZip&&snapshot.shippingPhone&&country);
  return {customer_email:email||null,shipping_snapshot:hasAny?snapshot:{},has_any:hasAny,complete};
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
async function validateCart(base:string,key:string,body:any,profitProfile:any){
  const country=clean(body?.country_code).toUpperCase();
  if(!/^[A-Z]{2}$/.test(country))throw new Error("COUNTRY_REQUIRED");
  const items=Array.isArray(body?.items)?body.items:[];
  if(!items.length||items.length>12)throw new Error("INVALID_CART");

  const lines:any[]=[];
  let productAmount=0;
  let shippingAmount=0;
  let contributionAmount=0;
  const commerceCheckedAt=new Date().toISOString();
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

    const supplierCost=num(variant?.price_amount??product?.price_amount);
    if(!(supplierCost&&supplierCost>0))throw new Error("SUPPLIER_COST_NOT_READY");

    const quote=await getCjQuote(base,key,variantId,country,qty);
    const shipping=Array.isArray(quote?.shipping_options)?quote.shipping_options[0]:null;
    if(quote?.stock_verified!==true||quote?.stock_available!==true)throw new Error("OUT_OF_STOCK");
    if(quote?.shipping_verified!==true||!shipping||!(num(shipping?.price_usd)>=0))throw new Error("SHIPPING_UNAVAILABLE");

    const supplierShipping=Number(shipping.price_usd);
    const profitInput={
      quantity:qty,
      supplier_cost_per_unit:supplierCost,
      customer_shipping_amount:supplierShipping,
      supplier_shipping_cost:supplierShipping
    };
    const catalogRetailAmount=Number(retailAmount.toFixed(2));
    let effectiveRetailAmount=catalogRetailAmount;
    let economics=evaluateCommerceProfit(profitProfile,{
      ...profitInput,
      sale_price_per_unit:effectiveRetailAmount
    });
    let destinationPriceAdjusted=false;
    if(economics.profit_gate_status!=="PASS"){
      const safeRetail=minimumSafeSalePricePerUnit(profitProfile,profitInput);
      if(!(safeRetail&&safeRetail>0))throw new Error("PROFIT_RECHECK_FAILED");
      effectiveRetailAmount=Math.max(catalogRetailAmount,safeRetail);
      economics=evaluateCommerceProfit(profitProfile,{
        ...profitInput,
        sale_price_per_unit:effectiveRetailAmount
      });
      destinationPriceAdjusted=effectiveRetailAmount>catalogRetailAmount;
    }
    if(economics.profit_gate_status!=="PASS")throw new Error("PROFIT_RECHECK_FAILED");

    const lineProduct=effectiveRetailAmount*qty;
    productAmount+=lineProduct;
    shippingAmount+=supplierShipping;
    contributionAmount+=economics.contribution_before_coupon;
    lines.push({
      provider,item_id:itemId,variant_id:variantId,qty,
      title:clean(product?.title).slice(0,180),
      unit_retail_amount:Number(effectiveRetailAmount.toFixed(2)),
      catalog_retail_amount:catalogRetailAmount,
      destination_price_adjusted:destinationPriceAdjusted,
      supplier_cost_per_unit:Number(supplierCost.toFixed(2)),
      currency:"USD",
      shipping_amount:Number(supplierShipping.toFixed(2)),
      shipping_method:clean(shipping?.name).slice(0,120),
      origin_country_code:clean(quote?.selected_origin?.country_code).toUpperCase()||null,
      quote_checked_at:commerceCheckedAt,
      profit_checked_at:commerceCheckedAt,
      profit_profile_id:profitProfile.id,
      profit_profile_name:clean(profitProfile.name).slice(0,120),
      checkout_profit_gate_status:economics.profit_gate_status,
      contribution_before_coupon:economics.contribution_before_coupon,
      contribution_margin:economics.contribution_margin,
      min_required_contribution:economics.min_required_contribution,
      payment_reserve:economics.payment_reserve,
      refund_reserve:economics.refund_reserve,
      platform_cost:economics.platform_cost
    });
  }
  return {
    country_code:country,currency:"USD",
    product_amount:Number(productAmount.toFixed(2)),
    shipping_amount:Number(shippingAmount.toFixed(2)),
    total_amount:Number((productAmount+shippingAmount).toFixed(2)),
    line_items:lines,
    commerce_snapshot:{
      version:"HUNT-COMMERCE-TRUTH-V1",
      status:"PASS",
      decision_owner:"commerce_truth_brain",
      execution_owner:"operations_brain",
      checked_at:commerceCheckedAt,
      profit_profile_id:profitProfile.id,
      profit_profile_name:clean(profitProfile.name).slice(0,120),
      line_count:lines.length,
      total_contribution_before_coupon:Number(contributionAmount.toFixed(2)),
      all_lines_profit_pass:lines.every(x=>x.checkout_profit_gate_status==="PASS"),
      destination_price_adjusted:lines.some(x=>x.destination_price_adjusted===true),
      adjusted_line_count:lines.filter(x=>x.destination_price_adjusted===true).length
    }
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
  const site=clean(Deno.env.get("HUNT_SITE_URL"))||"https://hadpac23-netizen.github.io/deep-hunt-market-site";
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
    const verifiedUserId=await authenticatedUserId(ctx,req);
    const body=await req.json();
    const base=clean(Deno.env.get("SUPABASE_URL"));
    const key=publishableKey();
    if(!base||!key)throw new Error("SERVER_CONFIG_MISSING");
    const profitProfile=await activeProfitProfile(ctx);
    const pricing=await validateCart(base,key,body,profitProfile);
    const shipping=sanitizeShipping(body,pricing.country_code);
    const requestedIdem=clean(body?.idempotency_key).slice(0,120);
    const idempotencyKey=requestedIdem||crypto.randomUUID();
    const normalized=JSON.stringify({
      country:pricing.country_code,
      user_id:verifiedUserId||null,
      items:pricing.line_items.map((x:any)=>[
        x.provider,x.item_id,x.variant_id,x.qty,x.origin_country_code,x.shipping_method
      ]),
      customer_email:shipping.customer_email,
      shipping_snapshot:shipping.shipping_snapshot
    });
    const cartDigest=await sha256(normalized);

    const {data:existing}=await ctx.supabaseAdmin
      .from("hunt_payment_sessions")
      .select("id,user_id,status,mode,country_code,currency,product_amount,shipping_amount,total_amount,provider_hosted_fields_uid,provider_redirect_url,expires_at,cart_digest,commerce_snapshot")
      .eq("idempotency_key",idempotencyKey)
      .maybeSingle();
    if(existing){
      if(clean(existing.cart_digest)!==cartDigest){
        return json(req,{ok:false,error:"IDEMPOTENCY_CONFLICT"},409);
      }
      const {user_id:existingUserId,...safeExisting}=existing as any;
      return json(req,{
        ok:true,reused:true,
        payment_ready:existing.status!=="prelaunch",
        shipping_attached:shipping.complete,
        user_attached:Boolean(existingUserId),
        idempotency_key:idempotencyKey,
        session:safeExisting
      });
    }

    const economicsRows=pricing.line_items.map((line:any)=>({
      provider:line.provider,
      item_id:line.item_id,
      variant_id:line.variant_id,
      destination_country:pricing.country_code,
      quantity:line.qty,
      currency:pricing.currency,
      sale_price_per_unit:line.unit_retail_amount,
      supplier_cost_per_unit:line.supplier_cost_per_unit,
      customer_shipping_amount:line.shipping_amount,
      supplier_shipping_cost:line.shipping_amount,
      payment_reserve:line.payment_reserve,
      refund_reserve:line.refund_reserve,
      platform_cost:line.platform_cost,
      contribution_before_coupon:line.contribution_before_coupon,
      contribution_margin:line.contribution_margin,
      min_required_contribution:line.min_required_contribution,
      profit_gate_status:line.checkout_profit_gate_status,
      inputs_verified:true,
      profile_id:line.profit_profile_id,
      calculation:{
        source:"checkout_recheck",
        commerce_snapshot_version:pricing.commerce_snapshot.version,
        commerce_checked_at:pricing.commerce_snapshot.checked_at,
        shipping_method:line.shipping_method,
        origin_country_code:line.origin_country_code,
        catalog_retail_amount:line.catalog_retail_amount,
        destination_price_adjusted:line.destination_price_adjusted===true
      }
    }));
    const {error:economicsError}=await ctx.supabaseAdmin.from("hunt_unit_economics").insert(economicsRows);
    if(economicsError)throw new Error("ECONOMICS_EVIDENCE_STORE_FAILED");

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
        user_id:verifiedUserId||null,
        provider:"payplus",
        mode:initialMode,
        status:initialMode==="prelaunch"?"prelaunch":"created",
        country_code:pricing.country_code,
        currency:pricing.currency,
        product_amount:pricing.product_amount,
        shipping_amount:pricing.shipping_amount,
        total_amount:pricing.total_amount,
        line_items:pricing.line_items,
        commerce_snapshot:pricing.commerce_snapshot,
        customer_email:shipping.customer_email,
        shipping_snapshot:shipping.shipping_snapshot,
        cart_digest:cartDigest,
        idempotency_key:idempotencyKey
      })
      .select("id,status,mode,country_code,currency,product_amount,shipping_amount,total_amount,expires_at,commerce_snapshot")
      .single();
    if(insertError||!inserted)throw new Error("PAYMENT_SESSION_STORE_FAILED");

    if(initialMode==="prelaunch"){
      return json(req,{
        ok:true,
        payment_ready:false,
        shipping_attached:shipping.complete,
        user_attached:Boolean(verifiedUserId),
        reason:"AUTHORIZED_PAYMENT_ACCOUNT_REQUIRED",
        idempotency_key:idempotencyKey,
        session:inserted
      });
    }

    const providerSession=await createPayPlusSession(inserted.id,pricing);
    if(!providerSession)throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
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
      .eq("id",inserted.id)
      .select("id,status,mode,country_code,currency,product_amount,shipping_amount,total_amount,provider_request_uid,provider_hosted_fields_uid,provider_redirect_url,expires_at,commerce_snapshot")
      .single();
    if(updateError||!updated)throw new Error("PAYMENT_SESSION_UPDATE_FAILED");

    await ctx.supabaseAdmin.from("hunt_payment_events").insert({
      payment_session_id:inserted.id,
      provider:"payplus",
      event_type:"session_created"
    });

    return json(req,{
      ok:true,
      payment_ready:true,
      shipping_attached:shipping.complete,
      user_attached:Boolean(verifiedUserId),
      idempotency_key:idempotencyKey,
      integration:updated.provider_hosted_fields_uid?"hosted_fields":"hosted_page",
      session:updated
    });
  }catch(error){
    return json(req,{
      ok:false,
      error:clean((error as Error)?.message)||"payment session failed"
    },400);
  }
});