(() => {
  "use strict";
  if(window.BoomProductProfitLedger?.version)return;
  const version="BOOM-PRODUCT-PROFIT-LEDGER-V1";
  const runtime=()=>window.BoomRuntime;
  const n=v=>v===null||v===undefined||v===""?null:Number(v);
  async function requireAdmin(){
    const rt=runtime();
    if(!rt?.adminReady)throw new Error("BOOM_RUNTIME_UNAVAILABLE");
    const gate=await rt.adminReady();
    if(!gate?.ok)throw new Error(gate?.reason||"ADMIN_REQUIRED");
    const client=rt.getSupabaseClient?.();
    if(!client)throw new Error("SUPABASE_UNAVAILABLE");
    return client;
  }
  async function listExpected({limit=100}={}){
    const client=await requireAdmin();
    const {data,error}=await client.from("hunt_unit_economics")
      .select("provider,item_id,variant_id,destination_country,quantity,currency,sale_price_per_unit,supplier_cost_per_unit,customer_shipping_amount,supplier_shipping_cost,payment_reserve,refund_reserve,platform_cost,contribution_before_coupon,contribution_margin,max_safe_cac,profit_gate_status,inputs_verified,calculated_at")
      .eq("inputs_verified",true)
      .order("calculated_at",{ascending:false})
      .limit(Math.max(1,Math.min(500,Number(limit)||100)));
    if(error)throw error;
    return (data||[]).map(row=>({
      lane:"EXPECTED",
      state:"EXPECTED_ONLY",
      provider:row.provider,
      item_id:row.item_id,
      variant_id:row.variant_id||null,
      destination_country:row.destination_country||null,
      currency:row.currency,
      sale_price_per_unit:n(row.sale_price_per_unit),
      supplier_cost_per_unit:n(row.supplier_cost_per_unit),
      supplier_shipping_cost:n(row.supplier_shipping_cost),
      payment_reserve:n(row.payment_reserve),
      refund_reserve:n(row.refund_reserve),
      platform_cost:n(row.platform_cost),
      contribution_before_coupon:n(row.contribution_before_coupon),
      contribution_margin:n(row.contribution_margin),
      max_safe_cac:n(row.max_safe_cac),
      profit_gate_status:row.profit_gate_status,
      calculated_at:row.calculated_at,
      realized_profit:null
    }));
  }
  async function realizedSummary(){
    const client=await requireAdmin();
    const {data,error}=await client.from("hunt_order_finance_ledger")
      .select("order_id,customer_gross,contribution_locked,available_profit,settlement_status,is_test,calculated_at")
      .eq("is_test",false)
      .order("calculated_at",{ascending:false})
      .limit(500);
    if(error)throw error;
    const rows=data||[];
    const total=rows.reduce((s,row)=>s+(n(row.available_profit)||0),0);
    return {
      state:rows.length?"REALIZED_ORDER_LEVEL":"UNKNOWN_NO_REAL_FINANCE_ROWS",
      real_finance_rows:rows.length,
      realized_available_profit:total,
      product_level_allocation:false,
      reason:rows.length?"ORDER_LEVEL_ONLY_UNTIL_AUDITABLE_PRODUCT_ALLOCATION":"NO_REAL_FINANCE_LEDGER_ROWS"
    };
  }
  async function snapshot(){
    const [expected,realized]=await Promise.all([listExpected({limit:100}),realizedSummary()]);
    return {
      version,
      mode:"SHADOW",
      expected,
      realized,
      mission_target_eligible_realized_profit:realized.realized_available_profit,
      test_orders_excluded:true,
      schema_change_required:false
    };
  }
  window.BoomProductProfitLedger={version,listExpected,realizedSummary,snapshot};
})();