const maps=Object.freeze({
  payment:Object.freeze({
    created:["pending","prelaunch","cancelled","expired"],
    pending:["authorized","paid","failed","cancelled","expired"],
    authorized:["paid","failed","cancelled","expired"],
    paid:["refunded"],prelaunch:[],failed:[],cancelled:[],expired:[],refunded:[]
  }),
  order:Object.freeze({
    placed:["confirmed","processing","cancelled"],
    confirmed:["processing","cancelled"],
    processing:["shipped","cancelled","exception"],
    shipped:["out_for_delivery","delivered","returned","exception"],
    out_for_delivery:["delivered","returned","exception"],
    delivered:["returned","refunded"],returned:["refunded"],
    exception:["processing","cancelled","returned","refunded"],
    cancelled:[],refunded:[]
  }),
  fulfillment:Object.freeze({
    not_started:["queued","processing","hold"],
    queued:["processing","hold","failed"],
    processing:["submitted","shipped","hold","failed"],
    submitted:["shipped","hold","failed"],
    shipped:["delivered","hold","failed"],
    hold:["queued","processing","failed"],delivered:[],failed:[]
  })
});
export function transitionAllowed(kind,from,to){
  if(from===to)return true;
  return Array.isArray(maps?.[kind]?.[from])&&maps[kind][from].includes(to);
}
export function assertTransition(kind,from,to){
  if(!transitionAllowed(kind,from,to)){
    const e=new Error("INVALID_"+String(kind).toUpperCase()+"_TRANSITION");
    e.code=e.message;e.kind=kind;e.from=from;e.to=to;throw e;
  }
  return true;
}
export function liveFulfillmentBlockers(input={}){
  const out=[];
  if(input.payment_mode!=="live")out.push("LIVE_PAYMENT_SESSION_REQUIRED");
  if(input.payment_status!=="paid")out.push("PAYMENT_NOT_CONFIRMED");
  if(input.commerce_truth!=="PASS")out.push("COMMERCE_TRUTH_NOT_PASSED");
  if(input.shipping_complete!==true)out.push("SHIPPING_ADDRESS_INCOMPLETE");
  if(input.owner_gate!==true)out.push("OWNER_GATE_REQUIRED");
  return out;
}
export function sandboxFulfillmentBlockers(input={}){
  const out=[];
  if(input.sandbox_control!==true)out.push("SANDBOX_SUPPLIER_ORDER_DISABLED");
  if(input.is_test!==true)out.push("SANDBOX_ORDER_MUST_BE_TEST");
  if(input.provider_sandbox!==true)out.push("PROVIDER_SANDBOX_FLAG_REQUIRED");
  return out;
}