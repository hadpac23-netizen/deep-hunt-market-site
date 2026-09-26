const enc=new TextEncoder();

export function constantTimeEqual(a,b){
  const aa=enc.encode(String(a??""));
  const bb=enc.encode(String(b??""));
  const len=Math.max(aa.length,bb.length);
  let diff=aa.length^bb.length;
  for(let i=0;i<len;i++)diff|=(aa[i]||0)^(bb[i]||0);
  return diff===0;
}

export async function hmacSha256Base64(message,secretKey){
  const key=await crypto.subtle.importKey(
    "raw",enc.encode(String(secretKey??"")),
    {name:"HMAC",hash:"SHA-256"},false,["sign"]
  );
  const signature=await crypto.subtle.sign("HMAC",key,enc.encode(String(message??"")));
  let binary="";
  for(const byte of new Uint8Array(signature))binary+=String.fromCharCode(byte);
  return btoa(binary);
}

export async function verifyPayPlusCallbackHeaders({userAgent,hash,body,secretKey}={}){
  if(String(userAgent??"").trim()!=="PayPlus"){
    return Object.freeze({valid:false,reason:"PAYPLUS_USER_AGENT_INVALID"});
  }
  if(!String(hash??"").trim()){
    return Object.freeze({valid:false,reason:"PAYPLUS_HASH_MISSING"});
  }
  if(!secretKey){
    return Object.freeze({valid:false,reason:"PAYPLUS_SECRET_KEY_MISSING"});
  }
  if(!body||typeof body!=="object"||Array.isArray(body)){
    return Object.freeze({valid:false,reason:"PAYPLUS_SIGNED_BODY_REQUIRED"});
  }
  const message=JSON.stringify(body);
  if(!message||message==="{}"){
    return Object.freeze({valid:false,reason:"PAYPLUS_SIGNED_BODY_REQUIRED"});
  }
  const expected=await hmacSha256Base64(message,secretKey);
  return Object.freeze({
    valid:constantTimeEqual(expected,String(hash).trim()),
    reason:constantTimeEqual(expected,String(hash).trim())?"PAYPLUS_SIGNATURE_VALID":"PAYPLUS_SIGNATURE_INVALID"
  });
}