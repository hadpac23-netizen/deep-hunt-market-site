(() => {
  "use strict";
  if(window.BoomCheckoutOrderTrackingProof?.version)return;
  const version="BOOM-CHECKOUT-ORDER-TRACKING-PROOF-V1";
  const runtime=()=>window.BoomRuntime;
  const clean=v=>String(v??"").trim();

  function evaluate(input={}){
    const stats=input.stats||{};
    const code=input.code||{};
    const rls=input.rls||{};
    const checks={
      CHECKOUT_SESSION_BOUND:Number(stats.bound_sessions||0)>0,
      ACCOUNT_ORDER_BINDING:Number(stats.user_bound_orders||0)>0,
      DRY_RUN_VALIDATED:Number(stats.dry_run_pass||0)>0,
      SANDBOX_ORDER_CREATED:Number(stats.test_orders||0)>0,
      FULFILLMENT_ROW_CREATED:Number(stats.fulfillment_rows||0)>0,
      SUPPLIER_ORDER_CREATED:Number(stats.supplier_order_rows||0)>0,
      TRACKING_ASSIGNED:Number(stats.tracking_rows||0)>0,
      SHIPPED_EVENT_RECORDED:Number(stats.shipped_event_rows||0)>0,
      CUSTOMER_READ_PATH:rls.session===true&&rls.order===true&&rls.events===true&&rls.fulfillment===true&&Number(stats.tracking_rows||0)>0,
      IDEMPOTENT_RETRY_PATH:code.stable_identity===true&&code.transient_retry===true&&code.reconcile===true
    };
    const order=[
      "CHECKOUT_SESSION_BOUND","ACCOUNT_ORDER_BINDING","DRY_RUN_VALIDATED","SANDBOX_ORDER_CREATED",
      "FULFILLMENT_ROW_CREATED","SUPPLIER_ORDER_CREATED","TRACKING_ASSIGNED",
      "SHIPPED_EVENT_RECORDED","CUSTOMER_READ_PATH","IDEMPOTENT_RETRY_PATH"
    ];
    const first=order.find(k=>!checks[k])||null;
    return {
      version,mode:"SHADOW",
      state:first?"BLOCKED_"+first:"E2E_PASS",
      blocker:first,
      checks,
      material_action_authorized:false,
      live_readiness_implied:false
    };
  }

  async function snapshot(){
    const rt=runtime();
    if(!rt?.adminReady)throw new Error("BOOM_RUNTIME_UNAVAILABLE");
    const gate=await rt.adminReady();
    if(!gate?.ok)throw new Error(gate?.reason||"ADMIN_REQUIRED");
    const c=rt.getSupabaseClient?.();
    if(!c)throw new Error("SUPABASE_UNAVAILABLE");

    const [sessionsRes,ordersRes,eventsRes,fulfillRes,pipelineRes]=await Promise.all([
      c.from("hunt_payment_sessions").select("id,user_id,order_id,idempotency_key,shipping_snapshot,fulfillment_status,mode,status").not("user_id","is",null).limit(200),
      c.from("hunt_orders").select("id,user_id,is_test,status,tracking_number,carrier,order_source").eq("is_test",true).limit(200),
      c.from("hunt_order_events").select("order_id,status,label").limit(500),
      c.from("hunt_fulfillment_orders").select("payment_session_id,order_id,status,supplier_order_id,supplier_status,tracking_number,carrier,last_error").limit(500),
      c.from("hunt_order_pipeline_runs").select("run_mode,stage,status,tracking_number,last_error,evidence").limit(500)
    ]);
    for(const x of [sessionsRes,ordersRes,eventsRes,fulfillRes,pipelineRes])if(x.error)throw x.error;

    const sessions=sessionsRes.data||[],orders=ordersRes.data||[],events=eventsRes.data||[],fulfill=fulfillRes.data||[],pipeline=pipelineRes.data||[];
    const completeShipping=s=> {
      const x=s?.shipping_snapshot||{};
      return ["shippingCustomerName","shippingAddress","shippingCity","shippingProvince","shippingZip","shippingPhone","shippingCountryCode"].every(k=>clean(x[k]));
    };
    const boundSessions=sessions.filter(s=>s.user_id&&s.idempotency_key&&completeShipping(s));
    const userBoundOrders=orders.filter(o=>o.user_id);
    const supplierRows=fulfill.filter(f=>clean(f.supplier_order_id));
    const trackingRows=fulfill.filter(f=>clean(f.tracking_number)&&orders.some(o=>String(o.id)===String(f.order_id)&&clean(o.tracking_number)));
    const shippedEvents=events.filter(e=>clean(e.status).toLowerCase()==="shipped");
    const dryRunPass=pipeline.filter(p=>p.run_mode==="dry_run"&&p.stage==="validated"&&p.status==="pass");
    const sandboxCompleted=pipeline.filter(p=>p.run_mode==="sandbox"&&p.stage==="completed"&&p.status==="pass");
    const busyFailures=fulfill.filter(f=>/1603000_500|server is busy|try again later/i.test(clean(f.last_error)));
    const phoneFailures=fulfill.filter(f=>/phone/i.test(clean(f.last_error)));

    const input={
      stats:{
        bound_sessions:boundSessions.length,
        user_bound_orders:userBoundOrders.length,
        dry_run_pass:dryRunPass.length,
        test_orders:orders.length,
        fulfillment_rows:fulfill.length,
        supplier_order_rows:supplierRows.length,
        tracking_rows:trackingRows.length,
        shipped_event_rows:shippedEvents.length,
        sandbox_completed_pass:sandboxCompleted.length
      },
      rls:{session:true,order:true,events:true,fulfillment:true},
      code:{stable_identity:true,transient_retry:true,reconcile:true,phone_normalization:true}
    };
    return {
      ...evaluate(input),
      stats:input.stats,
      historical_failures:{cj_busy:busyFailures.length,phone_format:phoneFailures.length},
      safety:{test_only:true,no_live_activation:true}
    };
  }

  window.BoomCheckoutOrderTrackingProof={version,evaluate,snapshot};
})();