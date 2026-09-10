import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const env=(name:string)=>(Deno.env.get(name)||"").trim();
const clean=(value:unknown)=>typeof value==="string"?value.trim():"";
const TOKEN_URL="https://api.ebay.com/identity/v1/oauth2/token";
const ORDER_API="https://apix.ebay.com/buy/order/v2";
const SCOPE="https://api.ebay.com/oauth/api_scope";
const MARKETPLACES=new Set(["EBAY_US","EBAY_GB","EBAY_DE","EBAY_FR","EBAY_IT","EBAY_ES","EBAY_AU","EBAY_CA"]);
let tokenCache:{value:string;expiresAt:number}|null=null;

function json(data:unknown,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function marketplace(){
  const value=env("EBAY_MARKETPLACE_ID")||"EBAY_US";
  return MARKETPLACES.has(value)?value:"EBAY_US";
}
function approved(){return env("EBAY_ORDER_API_APPROVED").toLowerCase()==="true";}
function authorized(req:Request){
  const expected=env("HUNT_EBAY_ORDER_INTERNAL_TOKEN");
  const supplied=clean(req.headers.get("x-hunt-ebay-order-token"));
  return Boolean(expected)&&supplied===expected;
}
function credentials(){
  return {clientId:env("EBAY_CLIENT_ID"),clientSecret:env("EBAY_CLIENT_SECRET")};
}
async function applicationToken(){
  if(tokenCache&&tokenCache.expiresAt>Date.now()+60_000)return tokenCache.value;
  const {clientId,clientSecret}=credentials();
  if(!clientId||!clientSecret)throw new Error("EBAY_CREDENTIALS_REQUIRED");
  const body=new URLSearchParams({grant_type:"client_credentials",scope:SCOPE});
  const res=await fetch(TOKEN_URL,{method:"POST",headers:{
    "Authorization":`Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    "Content-Type":"application/x-www-form-urlencoded"
  },body});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!clean(data?.access_token))throw new Error(`EBAY_OAUTH_FAILED_${res.status}`);
  const ttl=Math.max(60,Number(data?.expires_in)||7200);
  tokenCache={value:clean(data.access_token),expiresAt:Date.now()+ttl*1000};
  return tokenCache.value;
}
function affiliateHeader(){
  const campaign=env("EBAY_EPN_CAMPAIGN_ID");
  const reference=env("EBAY_EPN_REFERENCE_ID");
  if(!/^\d{10}$/.test(campaign))return "";
  const parts=[`affiliateCampaignId=${campaign}`];
  if(reference)parts.push(`affiliateReferenceId=${encodeURIComponent(reference.slice(0,256))}`);
  return parts.join(",");
}
function safeSessionId(value:unknown){
  const id=clean(value).slice(0,240);
  return /^[A-Za-z0-9._|:-]+$/.test(id)?id:"";
}
function safePurchaseId(value:unknown){return safeSessionId(value);}
function safeItemId(value:unknown){
  const id=clean(value).slice(0,240);
  return /^[A-Za-z0-9|_-]+$/.test(id)?id:"";
}
function safeQuantity(value:unknown){
  const n=Math.trunc(Number(value));
  return Number.isFinite(n)&&n>=1&&n<=20?n:null;
}
function requireCheckoutApproval(){
  if(!approved())throw new Error("ORDER_API_APPROVAL_REQUIRED");
}
function orderHeaders(token:string){
  const headers:Record<string,string>={
    "Authorization":`Bearer ${token}`,
    "X-EBAY-C-MARKETPLACE-ID":marketplace(),
    "Content-Type":"application/json",
    "Accept":"application/json"
  };
  const affiliate=affiliateHeader();
  if(affiliate)headers["X-EBAY-C-ENDUSERCTX"]=affiliate;
  return headers;
}
async function ebayOrderFetch(path:string,init:RequestInit={}){
  requireCheckoutApproval();
  const token=await applicationToken();
  const res=await fetch(ORDER_API+path,{...init,headers:{...orderHeaders(token),...(init.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    const message=clean(data?.errors?.[0]?.message)||`EBAY_ORDER_API_FAILED_${res.status}`;
    throw new Error(message);
  }
  return data;
}
function guestPayload(body:any){
  const email=clean(body?.contact_email).slice(0,254);
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error("VALID_CONTACT_EMAIL_REQUIRED");
  const lineItems=(Array.isArray(body?.line_items)?body.line_items:[]).slice(0,10).map((x:any)=>({
    itemId:safeItemId(x?.item_id),quantity:safeQuantity(x?.quantity)
  }));
  if(!lineItems.length||lineItems.some((x:any)=>!x.itemId||!x.quantity))throw new Error("VALID_EBAY_LINE_ITEMS_REQUIRED");
  const a=body?.shipping_address||{};
  const shippingAddress={
    recipient:clean(a?.recipient).slice(0,120),
    phoneNumber:clean(a?.phone_number).slice(0,40),
    addressLine1:clean(a?.address_line1).slice(0,120),
    addressLine2:clean(a?.address_line2).slice(0,120)||undefined,
    city:clean(a?.city).slice(0,80),
    stateOrProvince:clean(a?.state_or_province).slice(0,80)||undefined,
    postalCode:clean(a?.postal_code).slice(0,32),
    country:clean(a?.country).toUpperCase().slice(0,2)
  };
  if(!shippingAddress.recipient||!shippingAddress.addressLine1||!shippingAddress.city||!shippingAddress.postalCode||!/^[A-Z]{2}$/.test(shippingAddress.country))throw new Error("COMPLETE_SHIPPING_ADDRESS_REQUIRED");
  return {contactEmail:email,lineItemInputs:lineItems,shippingAddress};
}
async function initiateGuest(body:any){
  const payload=guestPayload(body);
  return ebayOrderFetch("/guest_checkout_session/initiate",{
    method:"POST",body:JSON.stringify(payload)
  });
}
async function getGuestSession(body:any){
  const id=safeSessionId(body?.checkout_session_id);
  if(!id)throw new Error("VALID_CHECKOUT_SESSION_ID_REQUIRED");
  return ebayOrderFetch(`/guest_checkout_session/${encodeURIComponent(id)}`,{method:"GET"});
}
async function getGuestPurchaseOrder(body:any){
  const id=safePurchaseId(body?.purchase_order_id);
  if(!id)throw new Error("VALID_PURCHASE_ORDER_ID_REQUIRED");
  return ebayOrderFetch(`/guest_purchase_order/${encodeURIComponent(id)}`,{method:"GET"});
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({error:"POST required"},405);
  if(!authorized(req))return json({error:"unauthorized"},401);
  let body:any={};
  try{body=await req.json();}catch{}
  const action=clean(body?.action).toLowerCase();
  if(action==="status"){
    const {clientId,clientSecret}=credentials();
    return json({ok:true,provider:"eBay",credentials_present:Boolean(clientId&&clientSecret),order_api_approved:approved(),onsite_checkout:approved()&&Boolean(clientId&&clientSecret),flow:"GUEST_CHECKOUT_V2",payment_ui:"CHECKOUT_WITH_EBAY_WIDGET",marketplace_id:marketplace(),epn_campaign_configured:/^\d{10}$/.test(env("EBAY_EPN_CAMPAIGN_ID"))});
  }
  try{
    if(action==="initiate_guest")return json({ok:true,data:await initiateGuest(body)});
    if(action==="get_guest_session")return json({ok:true,data:await getGuestSession(body)});
    if(action==="get_guest_purchase_order")return json({ok:true,data:await getGuestPurchaseOrder(body)});
    return json({error:"supported actions: status, initiate_guest, get_guest_session, get_guest_purchase_order"},400);
  }catch(error){
    const message=error instanceof Error?error.message:"EBAY_ORDER_FAILED";
    return json({ok:false,error:message},message==="ORDER_API_APPROVAL_REQUIRED"?403:502);
  }
});
