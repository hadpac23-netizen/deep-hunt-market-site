const token=(process.env.PRINTFUL_API_TOKEN||"").trim();
if(!token){console.error("PRINTFUL_API_TOKEN missing");process.exit(2);}
const base="https://api.printful.com";
const headers={Authorization:"Bearer "+token,Accept:"application/json"};
const get=async path=>{const r=await fetch(base+path,{headers});return {ok:r.ok,status:r.status,body:await r.json().catch(()=>({}))};};
const scopes=await get("/oauth/scopes");
const names=(scopes.body?.result?.scopes||[]).map(x=>x.scope);
const hasOrders=names.includes("orders");
const hasOrdersRead=hasOrders||names.includes("orders/read");
let orderRead={ok:false,state:"NOT_CHECKED"};
if(hasOrdersRead){
  const r=await get("/orders?limit=1");
  orderRead={ok:r.ok,state:r.ok?"ORDERS_READ_VERIFIED":"ORDERS_READ_FAILED",http:r.status};
}
const out={
  provider:"Printful",
  mode:"DRAFT_TEST_READINESS",
  auth_verified:scopes.ok,
  scopes:names,
  orders_write_scope:hasOrders,
  orders_read_access:orderRead,
  estimate_costs_ready:hasOrders,
  draft_create_ready:hasOrders,
  confirm_endpoint_enabled:false,
  live_fulfillment:"DISABLED",
  checkout:"DISABLED"
};
console.log(JSON.stringify(out,null,2));