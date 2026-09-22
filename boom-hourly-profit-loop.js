(() => {
  "use strict";
  if(window.BoomHourlyProfitLoop?.version)return;
  const version="BOOM-HOURLY-PROFIT-LOOP-V1";
  const TARGET=10000;
  const runtime=()=>window.BoomRuntime;
  const num=v=>v===null||v===undefined||v===""?null:Number(v);
  async function client(){
    const rt=runtime();
    if(!rt?.adminReady)throw new Error("BOOM_RUNTIME_UNAVAILABLE");
    const gate=await rt.adminReady();
    if(!gate?.ok)throw new Error(gate?.reason||"ADMIN_REQUIRED");
    const c=rt.getSupabaseClient?.();
    if(!c)throw new Error("SUPABASE_UNAVAILABLE");
    return c;
  }
  function exactVerified(row){
    return String(row?.verification_status||"").trim().toUpperCase()==="VERIFIED";
  }
  async function latest({hours=24}={}){
    const c=await client();
    const cutoff=new Date(Date.now()-Math.max(1,Math.min(168,Number(hours)||24))*3600000).toISOString();
    const {data,error}=await c.from("f60t_hourly_profit_ledger")
      .select("hour_start,currency,verified_net_profit,locked_contribution,confirmed_real_orders,settled_real_orders,evidence_rows,verification_status,source_mode,calculated_at")
      .gte("hour_start",cutoff)
      .order("hour_start",{ascending:false})
      .limit(168);
    if(error)throw error;
    const rows=data||[];
    const verified=rows.filter(exactVerified);
    const latestRow=rows[0]||null;
    const latestVerified=verified[0]||null;
    return {
      rows:rows.length,
      exact_verified_rows:verified.length,
      latest_row:latestRow,
      latest_verified:latestVerified,
      verified_profit_window:verified.reduce((s,r)=>s+(num(r.verified_net_profit)||0),0)
    };
  }
  function diagnose(snapshot={}){
    const latestRow=snapshot.latest_row;
    const latestVerified=snapshot.latest_verified;
    if(!latestVerified){
      return {
        status:"BLOCKED_UNVERIFIED",
        verified_net_profit_per_hour:null,
        target_gap:null,
        target_attainment_percent:null,
        primary_constraint:"NO_VERIFIED_REAL_PROFIT",
        proposals:[
          {priority:1,type:"EVIDENCE",action:"prove_non_test_order_finance_evidence",material:false},
          {priority:2,type:"ATTRIBUTION",action:"connect_actual_marketing_cost_evidence",material:false}
        ],
        latest_observed_status:latestRow?.verification_status||"NO_HOURLY_ROW",
        material_action_authorized:false
      };
    }
    const profit=num(latestVerified.verified_net_profit);
    if(profit===null){
      return {status:"BLOCKED_INVALID_PROFIT",verified_net_profit_per_hour:null,target_gap:null,primary_constraint:"NO_VERIFIED_REAL_PROFIT",proposals:[],material_action_authorized:false};
    }
    const gap=Math.max(0,TARGET-profit);
    const proposals=[];
    if(gap>0){
      proposals.push({priority:1,type:"GROWTH",action:"rank_expected_profit_positive_products_for_more_qualified_traffic",material:false});
      proposals.push({priority:2,type:"EXPERIMENT",action:"propose_profit_positive_bundle_or_conversion_test",material:true,owner_gate:true});
    }
    return {
      status:gap===0?"TARGET_MET":"TARGET_GAP",
      verified_net_profit_per_hour:profit,
      target_gap:gap,
      target_attainment_percent:Number((profit/TARGET*100).toFixed(2)),
      primary_constraint:gap===0?null:"PROFIT_GAP",
      proposals,
      material_action_authorized:false
    };
  }
  async function run({hours=24}={}){
    const snapshot=await latest({hours});
    return {version,mode:"SHADOW",target:TARGET,snapshot,diagnosis:diagnose(snapshot),dispatch:false};
  }
  window.BoomHourlyProfitLoop={version,targetNetProfitPerHourUsd:TARGET,exactVerified,latest,diagnose,run};
})();