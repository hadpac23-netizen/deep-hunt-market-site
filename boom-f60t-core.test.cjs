const assert=require("node:assert/strict");
const F=require("./boom-f60t-core.js");

const econ=[
  {inputs_verified:true,profit_gate_status:"PASS",contribution_before_coupon:20},
  {inputs_verified:true,profit_gate_status:"PASS",contribution_before_coupon:30},
  {inputs_verified:true,profit_gate_status:"PASS",contribution_before_coupon:25},
  {inputs_verified:false,profit_gate_status:"PASS",contribution_before_coupon:99}
];

{
  const t=F.profitTruth(econ);
  assert.equal(t.verified_rows,3);
  assert.equal(t.average_verified_contribution,25);
  assert.equal(t.truth_ready,true);
}

{
  const p=F.hourlyTargetPlan({economics:econ});
  assert.equal(p.target_net_per_hour,10000);
  assert.equal(p.minimum_orders_per_hour_at_average_contribution,400);
  assert.equal(p.realized_verified,false);
  assert.equal(p.target_gap,null);
  assert.equal(p.can_claim_target_met,false);
  assert.equal(p.state,"REALIZED_PROFIT_UNVERIFIED");
}

{
  const p=F.hourlyTargetPlan({economics:econ,realized:{amount:10500,verified:true,evidence_ref:"ledger:hour"}});
  assert.equal(p.target_gap,0);
  assert.equal(p.can_claim_target_met,true);
  assert.equal(p.state,"TARGET_MET_VERIFIED");
}

{
  const ranked=F.rankOpportunities([
    {country:"DE",platform:"tiktok",expected_net_profit:1000,confidence:80,downside_risk:10,economics_verified:true,stock_verified:true,shipping_verified:true,platform_eligible:true},
    {country:"FR",platform:"google",expected_net_profit:1500,confidence:40,downside_risk:40,economics_verified:true,stock_verified:true,shipping_verified:true,platform_eligible:true},
    {country:"US",platform:"youtube",expected_net_profit:5000,confidence:95,downside_risk:10,economics_verified:false,stock_verified:true,shipping_verified:true,platform_eligible:true}
  ]);
  assert.equal(ranked[0].country,"DE");
  assert.equal(ranked[2].eligible,false);
  assert.equal(ranked[2].risk_adjusted_expected_net_profit,null);
}

{
  const price=F.evaluatePriceLift({
    current_price:20,proposed_price:22,
    current_contribution_per_order:8,proposed_contribution_per_order:10,
    current_conversion_rate:5,proposed_conversion_rate:4.8,
    qualified_sessions:1000,
    economics_verified:true,elasticity_evidence_verified:true
  });
  assert.equal(price.decision,"RAISE_PRICE_CANDIDATE");
  assert.ok(price.expected_net_delta>0);
  assert.equal(price.owner_gate,"YELLOW_OWNER_REVIEW");
  assert.equal(price.live_price_write,false);
}

{
  const gate=F.ownerGate({type:"live_payment_activation"});
  assert.equal(gate.level,"RED");
  assert.equal(gate.execute_allowed,false);
}

{
  const s=F.stretchTarget({
    currentTarget:10000,
    realized:{amount:12000,verified:true,evidence_ref:"ledger"},
    consecutiveVerifiedTargetHours:3
  });
  assert.equal(s.eligible,true);
  assert.ok(s.candidate_target>10000);
  assert.equal(s.owner_gate,"YELLOW_OWNER_REVIEW");
}

{
  const board=F.missionBoard({economics:econ});
  assert.equal(board.mission.code,"F60T_YAMAM");
  assert.equal(board.target.target_net_per_hour,10000);
  assert.equal(board.execute_actions,false);
  assert.equal(board.live_price_write,false);
  assert.equal(board.paid_spend,false);
  assert.equal(board.payment_activation,false);
}

console.log("boom_f60t_core=PASS");