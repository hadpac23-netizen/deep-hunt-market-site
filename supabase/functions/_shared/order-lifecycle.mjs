const ORDER_TRANSITIONS=Object.freeze({
  placed:new Set(["confirmed","cancelled","exception"]),
  confirmed:new Set(["processing","cancelled","exception"]),
  processing:new Set(["shipped","cancelled","exception"]),
  shipped:new Set(["out_for_delivery","returned","exception"]),
  out_for_delivery:new Set(["delivered","returned","exception"]),
  delivered:new Set(["returned","refunded","exception"]),
  returned:new Set(["refunded","exception"]),
  exception:new Set(["processing","cancelled","refunded"]),
  cancelled:new Set(),
  refunded:new Set()
});

const FULFILLMENT_TRANSITIONS=Object.freeze({
  queued:new Set(["processing","hold","failed"]),
  processing:new Set(["submitted","hold","failed"]),
  submitted:new Set(["shipped","hold","failed"]),
  shipped:new Set(["delivered","hold","failed"]),
  delivered:new Set(),
  hold:new Set(["processing","failed"]),
  failed:new Set(["processing","hold"])
});

const PAYMENT_TRANSITIONS=Object.freeze({
  created:new Set(["prelaunch","pending","cancelled","expired","failed"]),
  prelaunch:new Set(["created","cancelled","expired"]),
  pending:new Set(["authorized","paid","failed","cancelled","expired"]),
  authorized:new Set(["paid","failed","cancelled","expired"]),
  paid:new Set(["refunded"]),
  failed:new Set(),
  cancelled:new Set(),
  expired:new Set(),
  refunded:new Set()
});

function can(map,from,to){
  if(from===to)return true;
  return Boolean(map[String(from||"")]?.has(String(to||"")));
}
function assertTransition(kind,from,to){
  const map=kind==="order"?ORDER_TRANSITIONS:kind==="fulfillment"?FULFILLMENT_TRANSITIONS:kind==="payment"?PAYMENT_TRANSITIONS:null;
  if(!map)throw new Error("LIFECYCLE_KIND_INVALID");
  if(!can(map,from,to))throw new Error(`${kind.toUpperCase()}_TRANSITION_INVALID:${from}->${to}`);
  return true;
}
export {ORDER_TRANSITIONS,FULFILLMENT_TRANSITIONS,PAYMENT_TRANSITIONS,assertTransition};
