const assert=require("node:assert");
const P=require("./hunt-promotion-engine.js");

const base={
  promotion:{type:"threshold_reward",starts_at:"2026-09-20T00:00:00Z",ends_at:"2026-09-27T00:00:00Z"},
  economics_input:{revenue:100,landed_cost:55,shipping_subsidy:5,payment_fees:3,returns_allowance:4,affiliate_cost:0,discount_cost:8,tax_cost:0,margin_floor:15},
  experiment_input:{hypothesis:"Threshold reward increases AOV",audience:"Eligible shoppers",control:"No reward",primary_metric:"contribution per session",margin_guardrail:"Contribution >= floor",refund_guardrail:"Refund rate not worse",stop_rule:"Stop on floor breach",rollback:"Disable campaign"},
  context:{availability_verified:true,final_price_clear:true}
};
const ok=P.evaluate(base);
assert.strictEqual(ok.state,"OWNER_REVIEW");
assert.strictEqual(ok.economics.passes_floor,true);
assert.strictEqual(ok.promotion_activate,false);
assert.strictEqual(ok.checkout_application,false);

const bad=P.evaluate({...base,promotion:{...base.promotion,countdown_resets:true},economics_input:{...base.economics_input,discount_cost:30}});
assert.strictEqual(bad.state,"PREPARE");
assert(bad.blockers.includes("resetting_countdown_forbidden"));
assert(bad.blockers.includes("margin_floor_failed"));

const win=P.evaluate({...base,promotion:{...base.promotion,type:"win_back"},context:{availability_verified:true,final_price_clear:true}});
assert(win.blockers.includes("win_back_history_not_verified"));
assert(win.blockers.includes("win_back_inactivity_not_verified"));
console.log("hunt_promotion_engine=PASS");