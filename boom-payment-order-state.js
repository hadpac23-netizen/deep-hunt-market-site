(() => {
  "use strict";
  const contract=typeof module!=="undefined"&&module.exports
    ? require("./boom-payment-order-state-contract.json")
    : window.BoomPaymentOrderStateContract;

  function allowed(kind,from,to){
    const section=contract?.[kind];
    if(!section?.transitions)return false;
    return Array.isArray(section.transitions[from])&&section.transitions[from].includes(to);
  }
  function assertTransition(kind,from,to){
    if(from===to)return {ok:true,noop:true,kind,from,to};
    if(!allowed(kind,from,to)){
      const error=new Error("INVALID_"+String(kind).toUpperCase()+"_TRANSITION");
      error.code=error.message;
      error.kind=kind; error.from=from; error.to=to;
      throw error;
    }
    return {ok:true,noop:false,kind,from,to};
  }
  function liveFulfillmentGate(input={}){
    const blockers=[];
    if(input.payment_mode!=="live")blockers.push("LIVE_PAYMENT_SESSION_REQUIRED");
    if(input.payment_status!=="paid")blockers.push("PAYMENT_NOT_CONFIRMED");
    if(input.commerce_truth!=="PASS")blockers.push("COMMERCE_TRUTH_NOT_PASSED");
    if(input.shipping_complete!==true)blockers.push("SHIPPING_ADDRESS_INCOMPLETE");
    if(input.owner_gate!==true)blockers.push("OWNER_GATE_REQUIRED");
    return {ok:blockers.length===0,blockers};
  }
  function sandboxFulfillmentGate(input={}){
    const blockers=[];
    if(input.sandbox_control!==true)blockers.push("SANDBOX_SUPPLIER_ORDER_DISABLED");
    if(input.is_test!==true)blockers.push("SANDBOX_ORDER_MUST_BE_TEST");
    if(input.provider_sandbox!==true)blockers.push("PROVIDER_SANDBOX_FLAG_REQUIRED");
    return {ok:blockers.length===0,blockers};
  }

  const api={version:contract?.version||"UNKNOWN",allowed,assertTransition,liveFulfillmentGate,sandboxFulfillmentGate,contract};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else window.BoomPaymentOrderState=api;
})();