const assert=require("node:assert/strict");
const A=require("./boom-f60t-live-adapter.js");

const unverified=A.normalize({
  ok:true,crowd_signals_ready:true,local_buying_clock_ready:false,
  sources:[{status:"LIVE"}],
  external_signals:{
    verified_rows:2,
    source_counts:{pinterest_trends:2},
    top:[{source_key:"pinterest_trends",country_code:"US"}],
    recent_runs:[]
  },
  agent_signals:{verified_events:0},
  hourly_profit:{verification_status:"UNVERIFIED",verified_net_profit:0,hour_start:"2026-09-19T16:00:00Z"}
});
assert.equal(unverified.adapter_ready,true);
assert.equal(unverified.realized.verified,false);
assert.equal(unverified.realized.amount,null);
assert.equal(unverified.source_live_count,1);
assert.equal(unverified.external_signal_rows,2);
assert.equal(unverified.external_top[0].source_key,"pinterest_trends");

const verified=A.normalize({
  ok:true,
  hourly_profit:{verification_status:"VERIFIED",verified_net_profit:123.45,hour_start:"2026-09-19T16:00:00Z",hour_end:"2026-09-19T17:00:00Z",evidence_ref:"ledger"},
  agent_signals:{verified_events:3}
});
assert.equal(verified.realized.verified,true);
assert.equal(verified.realized.amount,123.45);
assert.equal(verified.agent_gateway_ready,true);
console.log("boom_f60t_live_adapter=PASS");