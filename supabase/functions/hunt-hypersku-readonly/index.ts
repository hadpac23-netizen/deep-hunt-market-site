import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{
  status,
  headers:{"content-type":"application/json","cache-control":"no-store"}
});

type Action="readiness"|"product"|"stock"|"shipping_quote";

function envState(){
  const token=clean(Deno.env.get("HYPERSKU_OPEN_API_TOKEN"));
  const base=clean(Deno.env.get("HYPERSKU_OPEN_API_BASE_URL"));
  const productPath=clean(Deno.env.get("HYPERSKU_PRODUCT_PATH"));
  const stockPath=clean(Deno.env.get("HYPERSKU_STOCK_PATH"));
  const shippingPath=clean(Deno.env.get("HYPERSKU_SHIPPING_QUOTE_PATH"));
  const docsReady=Boolean(base&&productPath&&stockPath&&shippingPath);
  return {
    token_present:Boolean(token),
    base_present:Boolean(base),
    docs_ready:docsReady,
    read_only_ready:Boolean(token&&docsReady),
    fulfillment_enabled:false
  };
}
function validateAction(input:any){
  const action=clean(input?.action||"readiness") as Action;
  if(!["readiness","product","stock","shipping_quote"].includes(action)){
    return {ok:false,error:"INVALID_ACTION"};
  }
  if(action==="readiness")return {ok:true,action};

  const sku=clean(input?.sku);
  const variantId=clean(input?.variant_id);
  if(!sku&&!variantId)return {ok:false,error:"SKU_OR_VARIANT_REQUIRED"};

  if(action==="shipping_quote"){
    const country=clean(input?.country).toUpperCase();
    if(!/^[A-Z]{2}$/.test(country))return {ok:false,error:"COUNTRY_REQUIRED"};
  }
  return {ok:true,action};
}

function configuredPath(action:Action){
  if(action==="product")return clean(Deno.env.get("HYPERSKU_PRODUCT_PATH"));
  if(action==="stock")return clean(Deno.env.get("HYPERSKU_STOCK_PATH"));
  if(action==="shipping_quote")return clean(Deno.env.get("HYPERSKU_SHIPPING_QUOTE_PATH"));
  return "";
}
Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);

  const state=envState();
  const input=await req.json().catch(()=>({}));
  const check=validateAction(input);

  if(!check.ok)return json({provider:"hypersku",error:check.error},400);

  if(check.action==="readiness"){
    const blocker=!state.token_present
      ?"AUTH_REQUIRED"
      :(!state.docs_ready?"PROVIDER_DOCS_REQUIRED":null);
    return json({
      provider:"hypersku",
      mode:"READ_ONLY",
      status:blocker?"BLOCKED":"READY",
      blocker,
      ...state
    });
  }

  if(!state.token_present){
    return json({provider:"hypersku",error:"AUTH_REQUIRED",mode:"READ_ONLY"},503);
  }
  if(!state.docs_ready){
    return json({provider:"hypersku",error:"PROVIDER_DOCS_REQUIRED",mode:"READ_ONLY"},503);
  }
  // Endpoint paths are supplied only through server-side secrets/config after
  // HyperSKU Open API documentation is obtained from the account/agent.
  // HUNT never guesses provider endpoints or request schemas.
  const base=clean(Deno.env.get("HYPERSKU_OPEN_API_BASE_URL"));
  const path=configuredPath(check.action as Action);

  return json({
    provider:"hypersku",
    mode:"READ_ONLY",
    status:"CONFIGURED_NOT_EXECUTED",
    action:check.action,
    endpoint_configured:Boolean(base&&path),
    message:"Provider transport is intentionally locked until authenticated HyperSKU Open API schema is verified.",
    fulfillment_enabled:false
  },501);
});
