const test=require("node:test");
const assert=require("node:assert/strict");

test("PayPlus charge states never auto-accept paid",async()=>{
  const mod=await import("../supabase/functions/hunt-payplus-callback/payplus-status-map.mjs");
  const cases=[
    [0,"CARD_CHECK_NOT_PAID"],
    [1,"CHARGE_CANDIDATE_SANDBOX_PROOF_REQUIRED"],
    [2,"APPROVAL_NOT_PAID"],
    [3,"RECURRING_CANDIDATE_SANDBOX_PROOF_REQUIRED"],
    [4,"REFUND_CANDIDATE_SANDBOX_PROOF_REQUIRED"],
    [5,"TOKEN_NOT_PAID"]
  ];
  for(const [charge_method,state] of cases){
    const result=mod.classifyPayPlusStatus({charge_method});
    assert.equal(result.state,state);
    assert.equal(result.accepted_paid,false);
    assert.equal(result.paid_state_write_allowed,false);
    assert.equal(result.refund_state_write_allowed,false);
    assert.equal(result.execute_actions,false);
  }
});

test("unknown PayPlus status remains on hold",async()=>{
  const mod=await import("../supabase/functions/hunt-payplus-callback/payplus-status-map.mjs");
  const result=mod.classifyPayPlusStatus({charge_method:99,status:"mystery"});
  assert.equal(result.state,"UNKNOWN_HOLD");
  assert.equal(result.accepted_paid,false);
  assert.equal(result.sandbox_status_proven,false);
});
