import { evaluateCommerceProfit } from "../_shared/hunt-commerce-profit.mjs";
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUB=(()=>{try{return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||Deno.env.get("SUPABASE_ANON_KEY")||""}catch{return Deno.env.get("SUPABASE_ANON_KEY")||""}})();

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})}
function clean(v:unknown,max=200){return typeof v==="string"?v.trim().slice(0,max):""}
function num(v:unknown,d:number|null=null){const n=Number(v);return Number.isFinite(n)?n:d}
async function rest(path:string,init:any={}){
  const res=await fetch(URL+"/rest/v1/"+path,{...init,headers:{
    apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json",
    ...(init.prefer?{"Prefer":init.prefer}:{}),...(init.headers||{})
  }});
  const text=await res.text(); const data=text?JSON.parse(text):null;
  if(!res.ok)throw new Error(data?.message||data?.error||("REST_"+res.status));
  return data;
}
async function isAdmin(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return false;
  const u=await fetch(URL+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  if(!u.ok)return false;
  const user=await u.json(); if(!user?.id)return false;
  const rows=await rest("profiles?id=eq."+encodeURIComponent(user.id)+"&select=is_admin");
  return rows?.[0]?.is_admin===true;
}
async function profile(){
  const rows=await rest("hunt_profit_profiles?status=eq.active&owner_approved=eq.true&select=*&order=updated_at.desc&limit=1");
  if(!rows?.[0])throw new Error("PROFIT_PROFILE_NOT_ACTIVE");
  return rows[0];
}
async function cjProduct(provider:string,itemId:string,country:string){
  const u=new URL(URL+"/functions/v1/hunt-storefront");
  u.searchParams.set("provider",provider);
  u.searchParams.set("product_id",itemId);
  if(country)u.searchParams.set("country_code",country);
  const r=await fetch(u,{headers:{apikey:PUB},cache:"no-store"});
  const b=await r.json().catch(()=>({}));
  if(!r.ok||!b?.product)throw new Error("PRODUCT_RECHECK_FAILED");
  return b.product;
}
async function cjQuote(variantId:string,country:string,qty:number){
  const u=new URL(URL+"/functions/v1/hunt-cj-quote");
  u.searchParams.set("vid",variantId);u.searchParams.set("country_code",country);u.searchParams.set("quantity",String(qty));
  const r=await fetch(u,{headers:{apikey:PUB},cache:"no-store"});
  const b=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("SHIPPING_RECHECK_FAILED");
  return b;
}
const calc=(p:any,input:any)=>evaluateCommerceProfit(p,input);

Deno.serve(async(req)=>{
  if(req.method!=="POST")return json({error:"method not allowed"},405);
  if(!URL||!SERVICE||!PUB)return json({error:"server config missing"},500);
  if(!(await isAdmin(req)))return json({error:"Admin access required"},403);
  try{
    const body=await req.json();
    const provider=clean(body?.provider,80);
    const itemId=clean(body?.item_id,180);
    const variantId=clean(body?.variant_id,200);
    const country=clean(body?.country_code,2).toUpperCase();
    const qty=Math.max(1,Math.min(5,Math.floor(num(body?.quantity,1) as number)));
    if(!provider||!itemId)return json({error:"provider and item_id required"},400);
    if(country&&!/^[A-Z]{2}$/.test(country))return json({error:"invalid country"},400);

    const prof=await profile();
    let title="", sale=0, cost=0, customerShip=0, supplierShip=0, currency="USD", verified=false, selectedVariant=variantId;

    if(provider.toLowerCase().includes("cj")){
      if(!variantId||!country)return json({error:"CJ requires variant_id and country_code"},400);
      const product=await cjProduct(provider,itemId,country);
      const variants=Array.isArray(product?.variants)?product.variants:[];
      const variant=variants.find((v:any)=>clean(v?.variant_id,200)===variantId);
      if(!variant)return json({error:"VARIANT_RECHECK_FAILED"},409);
      if((variant?.retail_price_verified??product?.retail_price_verified)!==true ||
         clean(variant?.profit_gate_status||product?.profit_gate_status)!=="PASS"){
        return json({error:"RETAIL_PRICE_NOT_READY"},409);
      }
      sale=num(variant?.retail_price_amount??product?.retail_price_amount,0) as number;
      cost=num(variant?.price_amount??product?.price_amount,0) as number;
      currency=clean(variant?.retail_currency||product?.retail_currency||"USD",3).toUpperCase();
      const quote=await cjQuote(variantId,country,qty);
      const shipping=Array.isArray(quote?.shipping_options)?quote.shipping_options[0]:null;
      if(quote?.stock_verified!==true||quote?.stock_available!==true)return json({error:"OUT_OF_STOCK"},409);
      if(quote?.shipping_verified!==true||!shipping||num(shipping?.price_usd,null)===null)return json({error:"SHIPPING_UNAVAILABLE"},409);
      supplierShip=num(shipping.price_usd,0) as number;
      customerShip=supplierShip;
      title=clean(product?.title,260);
      verified=Boolean(sale>0&&cost>0&&currency==="USD");
      await rest("hunt_product_observations",{method:"POST",prefer:"return=minimal",body:JSON.stringify([
        {provider,item_id:itemId,observation_type:"price",price_amount:sale,currency,availability_verified:true,payload:{variant_id:variantId,title,supplier_cost_per_unit:cost,retail_verified:true}},
        {provider,item_id:itemId,observation_type:"stock",currency,availability_verified:true,payload:{variant_id:variantId,quantity:qty}},
        {provider,item_id:itemId,observation_type:"shipping",currency,availability_verified:true,shipping_amount:supplierShip,destination_country:country,payload:{variant_id:variantId,quantity:qty,shipping_method:clean(shipping?.name,120)}}
      ])});
    } else if(provider==="HUNT Merchant"){
      const rows=await rest("merchant_products?id=eq."+encodeURIComponent(itemId)+"&select=id,title,price_amount,currency,inventory_quantity,availability_verified,status,safety_status,store_id,merchant_stores!inner(status,commission_bps,seller_of_record,merchant_account_id,merchant_accounts!inner(kyc_status,agreement_status))&limit=1");
      const p=rows?.[0]; if(!p)return json({error:"PRODUCT_NOT_FOUND"},404);
      sale=num(p.price_amount,0) as number; currency=clean(p.currency||"USD",3).toUpperCase(); title=clean(p.title,260);
      const store=p.merchant_stores||{}, account=store.merchant_accounts||{};
      const commissionRate=(num(store.commission_bps,0) as number)/10000;
      const platformRevenue=sale*commissionRate;
      cost=Math.max(0,sale-platformRevenue);
      verified=Boolean(p.status==="approved"&&p.safety_status==="passed"&&p.availability_verified===true&&store.status==="approved"&&account.kyc_status==="verified"&&account.agreement_status==="accepted");
    } else return json({error:"PROVIDER_NOT_SUPPORTED"},400);

    if(currency!=="USD")return json({error:"CURRENCY_REVIEW_REQUIRED"},409);
    const economics=calc(prof,{quantity:qty,sale_price_per_unit:sale,supplier_cost_per_unit:cost,customer_shipping_amount:customerShip,supplier_shipping_cost:supplierShip});
    const requestedCoupon=Math.max(0,num(body?.requested_coupon_amount,0) as number);
    const approvedCoupon=Math.min(requestedCoupon,economics.max_safe_coupon_amount);
    const contributionAfter=Number((economics.contribution_before_coupon-approvedCoupon).toFixed(2));
    const remainingCac=Number(Math.max(0,economics.max_safe_cac-approvedCoupon).toFixed(2));

    const inserted=await rest("hunt_unit_economics",{method:"POST",prefer:"return=representation",body:JSON.stringify({
      provider,item_id:itemId,variant_id:selectedVariant||null,destination_country:country||null,quantity:qty,currency,
      sale_price_per_unit:sale,supplier_cost_per_unit:cost,customer_shipping_amount:customerShip,supplier_shipping_cost:supplierShip,
      payment_reserve:economics.payment_reserve,refund_reserve:economics.refund_reserve,platform_cost:economics.platform_cost,
      contribution_before_coupon:economics.contribution_before_coupon,contribution_margin:economics.contribution_margin,
      min_required_contribution:economics.min_required_contribution,max_safe_coupon_amount:economics.max_safe_coupon_amount,
      max_safe_coupon_rate:economics.max_safe_coupon_rate,max_safe_cac:economics.max_safe_cac,
      profit_gate_status:economics.profit_gate_status,inputs_verified:verified,profile_id:prof.id,
      calculation:{title,requested_coupon_amount:requestedCoupon,approved_coupon_amount:approvedCoupon,contribution_after_coupon:contributionAfter,remaining_safe_cac_after_coupon:remainingCac,profile:prof.name}
    })});
    return json({ok:true,title,provider,item_id:itemId,variant_id:selectedVariant||null,country_code:country||null,currency,inputs_verified:verified,
      economics,requested_coupon_amount:requestedCoupon,approved_coupon_amount:approvedCoupon,
      contribution_after_coupon:contributionAfter,remaining_safe_cac_after_coupon:remainingCac,
      profile:{name:prof.name,payment_rate:prof.payment_rate,refund_reserve_rate:prof.refund_reserve_rate,min_contribution_per_unit:prof.min_contribution_per_unit,min_margin_rate:prof.min_margin_rate,max_coupon_rate:prof.max_coupon_rate},
      calculation_id:inserted?.[0]?.id||null});
  }catch(e){return json({error:e instanceof Error?e.message:"profit engine failed"},500)}
});