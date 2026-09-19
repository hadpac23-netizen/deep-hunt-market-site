(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const RECEIPT=Object.freeze({
    verified_at:"2026-09-19T14:31:50Z",
    migration_version:"20260919143150",
    view_name:"hunt_purchase_attribution_bridge",
    security_invoker:true,
    public_read_blocked:true,
    security_advisor_bridge_finding:false,
    total_sessions:23,
    provider_payment_confirmed:0,
    paid_timestamp_present:0,
    real_orders_linked:0,
    server_confirmed_purchases:0,
    campaign_context_present:3,
    purchase_touchpoint_linked:0,
    provider_click_validated:0,
    finance_ledger_rows:0,
    profit_evidence_ready:0,
    conversion_claim_allowed:0,
    provider_status_mapping_ready:false,
    payment_live_enabled:false,
    payplus_callback_accept_paid:false
  });

  function evaluateRows(rows=[]){
    const data=Array.isArray(rows)?rows:[];
    const count=(key)=>data.filter(r=>r?.[key]===true).length;
    const financeRows=data.filter(r=>r?.finance_ledger_present===true);
    const profitReady=data.filter(r=>r?.profit_evidence_ready===true);
    const claimable=data.filter(r=>r?.conversion_claim_allowed===true);
    return {
      total_sessions:data.length,
      provider_payment_confirmed:count("provider_payment_confirmation"),
      paid_timestamp_present:count("paid_timestamp_present"),
      real_orders_linked:count("real_order_linked"),
      server_confirmed_purchases:count("server_purchase_confirmation"),
      campaign_context_present:count("campaign_context_present"),
      purchase_touchpoint_linked:count("purchase_touchpoint_linkage"),
      provider_click_validated:count("provider_click_validation"),
      finance_ledger_rows:financeRows.length,
      profit_evidence_ready:profitReady.length,
      conversion_claim_allowed:claimable.length
    };
  }

  function evaluate(input=RECEIPT){
    const x=Array.isArray(input)?evaluateRows(input):input||{};
    const bridgeReady=Array.isArray(input)
      ? true
      : x.security_invoker===true
        && x.public_read_blocked===true
        && x.security_advisor_bridge_finding===false;

    return Object.freeze({
      version:VERSION,
      receipt:Array.isArray(input)?null:x,
      state:bridgeReady?"BRIDGE_READY":"HOLD",
      bridge_ready:bridgeReady,
      total_sessions:Number(x.total_sessions||0),
      provider_payment_confirmed:Number(x.provider_payment_confirmed||0),
      paid_timestamp_present:Number(x.paid_timestamp_present||0),
      real_orders_linked:Number(x.real_orders_linked||0),
      server_confirmed_purchases:Number(x.server_confirmed_purchases||0),
      campaign_context_present:Number(x.campaign_context_present||0),
      purchase_touchpoint_linked:Number(x.purchase_touchpoint_linked||0),
      provider_click_validated:Number(x.provider_click_validated||0),
      finance_ledger_rows:Number(x.finance_ledger_rows||0),
      profit_evidence_ready:Number(x.profit_evidence_ready||0),
      conversion_claim_allowed:Number(x.conversion_claim_allowed||0),
      server_purchase_confirmation:Number(x.server_confirmed_purchases||0)>0,
      purchase_touchpoint_linkage:Number(x.purchase_touchpoint_linked||0)>0,
      provider_click_validation:Number(x.provider_click_validated||0)>0,
      profit_evidence_available:Number(x.profit_evidence_ready||0)>0,
      provider_status_mapping_ready:x.provider_status_mapping_ready===true,
      paid_attribution_ready:false,
      payments_live:false,
      paid_launch:false,
      paid_spend:false,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,RECEIPT,evaluateRows,evaluate});
  if(typeof window!=="undefined")window.BoomPurchaseAttributionBridge=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();