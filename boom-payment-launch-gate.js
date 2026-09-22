(() => {
  "use strict";
  if(window.BoomPaymentLaunchGate?.version)return;
  const version="BOOM-PAYMENT-LAUNCH-GATE-V1";
  const clean=v=>String(v??"").trim();
  const bool=v=>v===true;
  const runtime=()=>window.BoomRuntime;

  function providerEvidence(processor,input={}){
    const map=input.provider_evidence||{};
    return map[processor]||{};
  }

  function evaluateRoute(route={},input={}){
    const processor=clean(route.processor).toLowerCase();
    const paymentLive=input.payment_live||{};
    const p=providerEvidence(processor,input);
    const checks={
      ROUTE_EXISTS:Boolean(route.route_key),
      COMMERCIAL_ACCOUNT_APPROVED:Boolean(route.approval_reference)&&Boolean(route.approved_at)&&p.account_approved===true,
      SERVER_CREDENTIALS_READY:p.server_credentials_ready===true,
      SANDBOX_OR_TEST_PROOF:p.sandbox_proven===true,
      SUCCESS_CALLBACK_PROVEN:p.success_callback_proven===true,
      FAILURE_CALLBACK_PROVEN:p.failure_callback_proven===true,
      IDEMPOTENCY_AND_REFERENCE_INTEGRITY_PROVEN:p.idempotency_integrity_proven===true,
      REFUND_PATH_PROVEN:p.refund_proven===true,
      FINANCE_LEDGER_PATH_PROVEN:p.finance_ledger_proven===true,
      SETTLEMENT_DESTINATION_VERIFIED:p.settlement_destination_verified===true,
      COUNTRY_CURRENCY_SCOPE_VERIFIED:p.country_currency_scope_verified===true,
      LEGAL_CHECKOUT_DISCLOSURES_READY:p.legal_checkout_ready===true,
      OWNER_GATE_APPROVED:p.owner_gate_approved===true,
      MASTER_PAYMENT_LIVE_SWITCH_ON:bool(paymentLive.enabled)&&bool(paymentLive.owner_approved)
    };
    const preOwner=[
      "ROUTE_EXISTS","COMMERCIAL_ACCOUNT_APPROVED","SERVER_CREDENTIALS_READY",
      "SANDBOX_OR_TEST_PROOF","SUCCESS_CALLBACK_PROVEN","FAILURE_CALLBACK_PROVEN",
      "IDEMPOTENCY_AND_REFERENCE_INTEGRITY_PROVEN","REFUND_PATH_PROVEN",
      "FINANCE_LEDGER_PATH_PROVEN","SETTLEMENT_DESTINATION_VERIFIED",
      "COUNTRY_CURRENCY_SCOPE_VERIFIED","LEGAL_CHECKOUT_DISCLOSURES_READY"
    ];
    const missing=preOwner.filter(k=>!checks[k]);
    let state="BLOCKED";
    if(String(route.status||"").toLowerCase()==="planned"&&missing.length)state="PLANNED";
    else if(!missing.length&&!checks.OWNER_GATE_APPROVED)state="LIVE_READY_CANDIDATE";
    else if(!missing.length&&checks.OWNER_GATE_APPROVED&&!checks.MASTER_PAYMENT_LIVE_SWITCH_ON)state="LIVE_READY_CANDIDATE";
    else if(!missing.length&&checks.OWNER_GATE_APPROVED&&checks.MASTER_PAYMENT_LIVE_SWITCH_ON)state="LIVE";
    return {
      route_key:route.route_key||null,
      processor,
      payment_method:route.payment_method||null,
      display_name:route.display_name||null,
      configured_status:route.status||null,
      state,
      checks,
      missing,
      blocker:missing[0]||(!checks.OWNER_GATE_APPROVED?"OWNER_GATE_REQUIRED":(!checks.MASTER_PAYMENT_LIVE_SWITCH_ON?"MASTER_PAYMENT_LIVE_OFF":null)),
      material_action_authorized:false
    };
  }

  function evaluate(input={}){
    const routes=Array.isArray(input.routes)?input.routes:[];
    const results=routes.map(r=>evaluateRoute(r,input));
    return {
      version,mode:"SHADOW",
      routes:results,
      summary:{
        total:results.length,
        planned:results.filter(x=>x.state==="PLANNED").length,
        blocked:results.filter(x=>x.state==="BLOCKED").length,
        candidates:results.filter(x=>x.state==="LIVE_READY_CANDIDATE").length,
        live:results.filter(x=>x.state==="LIVE").length
      },
      payment_live_enabled:bool(input.payment_live?.enabled)&&bool(input.payment_live?.owner_approved),
      supplier_live_enabled:bool(input.supplier_live?.enabled)&&bool(input.supplier_live?.owner_approved),
      material_action_authorized:false
    };
  }

  async function snapshot(providerEvidenceOverride={}){
    const rt=runtime();
    if(!rt?.adminReady)throw new Error("BOOM_RUNTIME_UNAVAILABLE");
    const gate=await rt.adminReady();
    if(!gate?.ok)throw new Error(gate?.reason||"ADMIN_REQUIRED");
    const c=rt.getSupabaseClient?.();
    if(!c)throw new Error("SUPABASE_UNAVAILABLE");
    const [routesRes,controlsRes]=await Promise.all([
      c.from("hunt_payment_routes")
        .select("route_key,processor,payment_method,display_name,status,priority,buyer_countries,currencies,capabilities,approval_reference,approved_at,updated_at")
        .order("priority",{ascending:true}),
      c.from("hunt_runtime_controls")
        .select("key,enabled,owner_approved,note")
        .in("key",["hunt_payment_live","hunt_supplier_order_live"])
    ]);
    if(routesRes.error)throw routesRes.error;
    if(controlsRes.error)throw controlsRes.error;
    const controls=Object.fromEntries((controlsRes.data||[]).map(r=>[r.key,r]));
    return evaluate({
      routes:routesRes.data||[],
      payment_live:controls.hunt_payment_live||{},
      supplier_live:controls.hunt_supplier_order_live||{},
      provider_evidence:providerEvidenceOverride
    });
  }

  window.BoomPaymentLaunchGate={version,evaluateRoute,evaluate,snapshot};
})();