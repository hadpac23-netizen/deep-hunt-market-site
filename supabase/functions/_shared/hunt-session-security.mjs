const clean=value=>typeof value==="string"?value.trim():"";

export function requireIntegerQuantity(value,{min=1,max=5}={}){
  const qty=Number(value);
  if(!Number.isFinite(qty)||!Number.isInteger(qty)||qty<min||qty>max){
    throw new Error("INVALID_QUANTITY");
  }
  return qty;
}

export function pricingSnapshotMatches(session,pricing){
  if(!session||!pricing)return false;
  const eq=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<0.005;
  return clean(session.country_code).toUpperCase()===clean(pricing.country_code).toUpperCase()
    && clean(session.currency).toUpperCase()===clean(pricing.currency).toUpperCase()
    && eq(session.product_amount,pricing.product_amount)
    && eq(session.shipping_amount,pricing.shipping_amount)
    && eq(session.total_amount,pricing.total_amount);
}

export function sessionReuseState(session,{expectedMode,liveApproved=false,now=Date.now()}={}){
  const mode=clean(session?.mode).toLowerCase();
  const status=clean(session?.status).toLowerCase();
  if(mode!==clean(expectedMode).toLowerCase())return {ok:false,reason:"SESSION_MODE_STALE"};
  if(mode==="live"&&!liveApproved)return {ok:false,reason:"PAYMENT_LIVE_KILL_SWITCH_OFF"};
  if(mode==="prelaunch")return status==="prelaunch"?{ok:true,paymentReady:false}:{ok:false,reason:"SESSION_STATUS_NOT_REUSABLE"};
  if(status!=="pending")return {ok:false,reason:"SESSION_STATUS_NOT_REUSABLE"};
  const expires=Date.parse(clean(session?.expires_at));
  if(!Number.isFinite(expires)||expires<=now)return {ok:false,reason:"SESSION_EXPIRED"};
  if(!clean(session?.provider_redirect_url))return {ok:false,reason:"PAYMENT_PROVIDER_SESSION_NOT_READY"};
  return {ok:true,paymentReady:true};
}

export async function sha256Hex(value){
  const bytes=new TextEncoder().encode(String(value??""));
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export async function guestOwnerProofMatches(token,expectedHash){
  const supplied=clean(token);
  const expected=clean(expectedHash).toLowerCase();
  if(!supplied||!/^[a-f0-9]{64}$/.test(expected))return false;
  return (await sha256Hex(supplied))===expected;
}
