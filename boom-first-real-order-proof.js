(() => {
  "use strict";
  if(window.BoomFirstRealOrderProof?.version)return;
  const version="BOOM-FIRST-REAL-ORDER-PROOF-V1";
  const TARGET=10000;
  const runtime=()=>window.BoomRuntime;
  const num=v=>v===null||v===undefined||v===""?null:Number(v);
  const exactVerified=v=>String(v||"").trim().toUpperCase()==="VERIFIED";
  async function adminClient(){
    const rt=runtime();
    if(!rt?.adminReady)throw new Error("BOOM_RUNTIME_UNAVAILABLE");
    const gate=await rt.adminReady();
    if(!gate?.ok)throw new Error(gate?.reason||"ADMIN_REQUIRED");
    const c=rt.getSupabaseClient?.();
    if(!c)throw new Error("SUPABASE_UNAVAILABLE");
    return c;
  }
  function evaluate(input={}){
    const control=input.payment_control||{};
    const order=input.order||null;
    const finance=input.finance||null;
    const bridge=input.bridge||null;
    const hourly=input.hourly||null;
    const stages=[];
    const pass=(id,evidence={})=>stages.push({id,status:"PASS",evidence});
    const block=(id,reason,evidence={})=>({version,mode:"SHADOW",state:id,blocker:reason,stages:[...stages,{id,status:"BLOCKED",reason,evidence}],target_gap:null,verified_net_profit_per_hour:null,material_action_authorized:false});

    if(control.enabled!==true||control.owner_approved!==true){
      return block("BLOCKED_PAYMENT_ACCEPTANCE","PAYMENT_ACCEPTANCE_KILL_SWITCH_OFF",{enabled:control.enabled===true,owner_approved:control.owner_approved===true});
    }
    pass("PAYMENT_ACCEPTANCE_READY");

    if(!bridge?.provider_payment_confirmation||!bridge?.server_purchase_confirmation||!bridge?.paid_at){
      return block("WAITING_REAL_PAYMENT","NO_REAL_PAYMENT");
    }
    pass("REAL_PAYMENT_CONFIRMED",{payment_session_id:bridge.payment_session_id||null});

    if(!order||order.is_test===true||!order.id){
      return block("WAITING_REAL_ORDER","NO_REAL_ORDER");
    }
    if(bridge.order_id&&String(bridge.order_id)!==String(order.id)){
      return block("ORDER_LINK_MISMATCH","NO_REAL_ORDER",{bridge_order_id:bridge.order_id,order_id:order.id});
    }
    pass("REAL_ORDER_CREATED",{order_id:order.id});

    if(!finance||finance.is_test===true||!finance.id||String(finance.order_id||"")!==String(order.id)){
      return block("WAITING_REAL_FINANCE","NO_REAL_FINANCE_LEDGER");
    }
    if(num(finance.contribution_locked)===null){
      return block("FINANCE_INCOMPLETE","NO_REAL_FINANCE_LEDGER",{finance_ledger_id:finance.id});
    }
    pass("FINANCE_LEDGER_LOCKED",{finance_ledger_id:finance.id,contribution_locked:num(finance.contribution_locked)});

    if(!bridge?.finance_ledger_present||bridge?.finance_is_test===true||!bridge?.profit_evidence_ready){
      return block("WAITING_ATTRIBUTION_BRIDGE","ATTRIBUTION_BRIDGE_NOT_READY",{finance_ledger_id:finance.id});
    }
    if(String(finance.settlement_status||"").toLowerCase()!=="settled"||num(finance.available_profit)===null){
      return block("WAITING_SETTLEMENT","PROFIT_NOT_SETTLED",{settlement_status:finance.settlement_status||null});
    }
    pass("REALIZED_PROFIT_SETTLED",{available_profit:num(finance.available_profit),currency:finance.currency||null});

    if(!hourly||!exactVerified(hourly.verification_status)||Number(hourly.confirmed_real_orders||0)<1||Number(hourly.settled_real_orders||0)<1){
      return block("WAITING_HOURLY_VERIFICATION","NO_EXACT_VERIFIED_HOURLY_ROW",{verification_status:hourly?.verification_status||null});
    }
    const ids=Array.isArray(hourly?.evidence?.source_finance_ledger_ids)?hourly.evidence.source_finance_ledger_ids.map(String):[];
    if(!ids.includes(String(finance.id))){
      return block("HOURLY_LINK_MISSING","HOURLY_EVIDENCE_LINK_MISSING",{finance_ledger_id:finance.id});
    }
    pass("HOURLY_PROFIT_VERIFIED",{hour_start:hourly.hour_start||null,finance_ledger_id:finance.id});

    const profit=num(hourly.verified_net_profit);
    if(profit===null)return block("HOURLY_PROFIT_INVALID","NO_EXACT_VERIFIED_HOURLY_ROW");
    const gap=Math.max(0,TARGET-profit);
    pass("MISSION_GAP_PROVEN",{target:TARGET,verified_net_profit_per_hour:profit,target_gap:gap});
    return {version,mode:"SHADOW",state:"PROVEN",blocker:null,stages,verified_net_profit_per_hour:profit,target_gap:gap,target_attainment_percent:Number((profit/TARGET*100).toFixed(2)),material_action_authorized:false};
  }

  async function snapshot(){
    const c=await adminClient();
    const controlsRes=await c.from("hunt_runtime_controls").select("key,enabled,owner_approved,note").in("key",["hunt_payplus_callback_accept_paid","hunt_supplier_order_live"]);
    if(controlsRes.error)throw controlsRes.error;
    const controls=Object.fromEntries((controlsRes.data||[]).map(r=>[r.key,r]));
    const control=controls.hunt_payplus_callback_accept_paid||{enabled:false,owner_approved:false};

    const ordersRes=await c.from("hunt_orders").select("id,is_test,status,total_amount,currency,placed_at").eq("is_test",false).order("placed_at",{ascending:false}).limit(1);
    if(ordersRes.error)throw ordersRes.error;
    const order=(ordersRes.data||[])[0]||null;

    let finance=null,bridge=null,hourly=null;
    if(order){
      const financeRes=await c.from("hunt_order_finance_ledger").select("id,payment_session_id,order_id,currency,customer_gross,contribution_locked,available_profit,settlement_status,is_test,calculated_at").eq("order_id",order.id).eq("is_test",false).order("calculated_at",{ascending:false}).limit(1);
      if(financeRes.error)throw financeRes.error;
      finance=(financeRes.data||[])[0]||null;

      const bridgeRes=await c.from("hunt_purchase_attribution_bridge").select("payment_session_id,paid_at,order_id,order_is_test,provider_payment_confirmation,real_order_linked,server_purchase_confirmation,finance_ledger_id,finance_ledger_present,finance_is_test,settlement_status,contribution_locked,available_profit,profit_evidence_ready").eq("order_id",order.id).limit(1);
      if(bridgeRes.error)throw bridgeRes.error;
      bridge=(bridgeRes.data||[])[0]||null;
    }
    if(finance){
      const start=finance.calculated_at?new Date(finance.calculated_at):new Date();
      start.setUTCMinutes(0,0,0);
      const hourlyRes=await c.from("f60t_hourly_profit_ledger").select("hour_start,currency,verified_net_profit,locked_contribution,confirmed_real_orders,settled_real_orders,evidence_rows,verification_status,source_mode,evidence,calculated_at").eq("hour_start",start.toISOString()).eq("currency",String(finance.currency||"USD").toUpperCase()).limit(1);
      if(hourlyRes.error)throw hourlyRes.error;
      hourly=(hourlyRes.data||[])[0]||null;
    }
    const result=evaluate({payment_control:control,order,finance,bridge,hourly});
    return {
      ...result,
      live_truth:{
        payment_acceptance_enabled:control.enabled===true,
        payment_acceptance_owner_approved:control.owner_approved===true,
        supplier_order_live_enabled:controls.hunt_supplier_order_live?.enabled===true&&controls.hunt_supplier_order_live?.owner_approved===true,
        real_order_found:Boolean(order),
        real_finance_found:Boolean(finance),
        bridge_found:Boolean(bridge),
        hourly_found:Boolean(hourly)
      }
    };
  }
  window.BoomFirstRealOrderProof={version,targetNetProfitPerHourUsd:TARGET,exactVerified,evaluate,snapshot};
})();