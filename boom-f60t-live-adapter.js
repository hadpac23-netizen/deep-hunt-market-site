(() => {
  "use strict";

  const VERSION="2026-09-19-f60t-live2";

  function normalize(snapshot={}){
    const profit=snapshot?.hourly_profit||{};
    const crowd=Array.isArray(snapshot?.hot_zones)?snapshot.hot_zones:[];
    const sources=Array.isArray(snapshot?.sources)?snapshot.sources:[];
    const agents=snapshot?.agent_signals||{};
    const external=snapshot?.external_signals||{};
    return Object.freeze({
      version:VERSION,
      adapter_ready:snapshot?.ok===true,
      crowd_signals_ready:snapshot?.crowd_signals_ready===true,
      local_buying_clock_ready:snapshot?.local_buying_clock_ready===true,
      hot_zones:Object.freeze(crowd),
      sources:Object.freeze(sources),
      source_live_count:sources.filter(x=>String(x?.status||"")==="LIVE").length,
      external_signal_rows:Number(external.verified_rows||0),
      external_source_counts:Object.freeze(external.source_counts&&typeof external.source_counts==="object"?external.source_counts:{}),
      external_top:Object.freeze(Array.isArray(external.top)?external.top:[]),
      external_recent_runs:Object.freeze(Array.isArray(external.recent_runs)?external.recent_runs:[]),
      agent_events_verified:Number(agents.verified_events||0),
      agent_gateway_ready:Number(agents.verified_events||0)>0,
      realized:Object.freeze({
        amount:profit?.verification_status==="VERIFIED" ? Number(profit?.verified_net_profit||0) : null,
        verified:profit?.verification_status==="VERIFIED",
        evidence_ref:profit?.verification_status==="VERIFIED" ? String(profit?.evidence_ref||"F60T_HOURLY_LEDGER") : "",
        period_start:String(profit?.hour_start||""),
        period_end:String(profit?.hour_end||"")
      }),
      hourly_profit:Object.freeze(profit),
      errors:Object.freeze(Array.isArray(snapshot?.errors)?snapshot.errors:[]),
      read_only:true,
      external_publish:false,
      paid_spend:false,
      live_price_write:false,
      execute_actions:false
    });
  }

  const api=Object.freeze({VERSION,normalize});
  if(typeof window!=="undefined")window.BoomF60TLiveAdapter=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();