const assert=require("node:assert");
const G=require("./boom-growth-agent.js");

const base={
  plan:{
    launch:{canSoftLaunch:true,canRunPaidMarketing:false},
    verifiedEconomicsCount:3,
    funnel:{sessions:5}
  },
  data:{
    passportSummary:{total:117,channels:{}},
    googleFeedPreview:{export_ready:0,publish_ready:0},
    controlSummary:{external:{promote_candidate:0},paid:{test_candidate:0},scale:{scale_candidate:0}},
    creativeBatch:{safe_drafts:0},
    offerSummary:{coupon_candidate:0,shipping_candidate:0,bundle_candidate:0},
    lifecyclePlan:{send_candidates:0},
    creatorSystem:{state:"HOLD"}
  },
  measurement:{
    paid_attribution_ready:false,
    server_event_id_persisted:false,
    owner_paid_approval:false,
    incrementality_ready:false,
    post_acquisition_profit_ready:false
  },
  marketing:{agentic:{discovery_data_ready:0,discovery_connected_ready:0}}
};

const current=G.decide(base);
assert.strictEqual(current.primary_move.code,"ENRICH_PRODUCT_TRUTH");
assert.strictEqual(current.lanes.paid.state,"HOLD");
assert.strictEqual(current.lanes.creator.state,"HOLD");
assert.strictEqual(current.diagnostics.can_scale,false);
assert.strictEqual(current.paid_spend,false);
assert.strictEqual(current.execute_actions,false);

const launchHold=G.decide({...base,plan:{...base.plan,launch:{...base.plan.launch,canSoftLaunch:false}}});
assert.strictEqual(launchHold.primary_move.code,"FIX_LAUNCH_GATE");
assert.strictEqual(launchHold.primary_move.state,"HOLD");

const paidReady=G.decide({
  plan:{launch:{canSoftLaunch:true,canRunPaidMarketing:true},verifiedEconomicsCount:8,funnel:{sessions:300}},
  data:{
    passportSummary:{total:20,channels:{}},
    googleFeedPreview:{export_ready:10,publish_ready:8},
    controlSummary:{external:{promote_candidate:8},paid:{test_candidate:3},scale:{scale_candidate:1}},
    creativeBatch:{safe_drafts:12},
    offerSummary:{coupon_candidate:2,shipping_candidate:1,bundle_candidate:0},
    lifecyclePlan:{send_candidates:0},
    creatorSystem:{state:"PREPARE"}
  },
  measurement:{
    paid_attribution_ready:true,
    server_event_id_persisted:true,
    owner_paid_approval:true,
    incrementality_ready:false,
    post_acquisition_profit_ready:true
  },
  marketing:{agentic:{discovery_data_ready:5,discovery_connected_ready:5}}
});
assert.strictEqual(paidReady.lanes.paid.state,"TEST_CANDIDATE");
assert.strictEqual(paidReady.lanes.external_discovery.state,"TEST_CANDIDATE");
assert.strictEqual(paidReady.lanes.agentic.state,"TEST_CANDIDATE");
assert.strictEqual(paidReady.diagnostics.can_scale,false,"Scale requires incrementality readiness even with a scale candidate");

const scaleReady=G.decide({
  ...paidReady,
  plan:{launch:{canSoftLaunch:true,canRunPaidMarketing:true},verifiedEconomicsCount:8,funnel:{sessions:300}},
  data:{
    passportSummary:{total:20,channels:{}},
    googleFeedPreview:{export_ready:10,publish_ready:8},
    controlSummary:{external:{promote_candidate:8},paid:{test_candidate:3},scale:{scale_candidate:2}},
    creativeBatch:{safe_drafts:12},
    offerSummary:{coupon_candidate:2,shipping_candidate:1,bundle_candidate:0},
    lifecyclePlan:{send_candidates:1},
    creatorSystem:{state:"PREPARE"}
  },
  measurement:{
    paid_attribution_ready:true,server_event_id_persisted:true,owner_paid_approval:true,
    incrementality_ready:true,post_acquisition_profit_ready:true
  },
  marketing:{agentic:{discovery_data_ready:5,discovery_connected_ready:5}}
});
assert.strictEqual(scaleReady.diagnostics.can_scale,true);
assert.strictEqual(scaleReady.creator_payout,false);
assert.strictEqual(G.VERSION,"2026-09-19-v1");
console.log("boom_growth_agent=PASS",JSON.stringify({current:current.primary_move,paid:paidReady.lanes.paid,can_scale:scaleReady.diagnostics.can_scale}));