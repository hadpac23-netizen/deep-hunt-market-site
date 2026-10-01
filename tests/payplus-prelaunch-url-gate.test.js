const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const gate=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../ops/hunt-payplus-prelaunch-url-gate.json"),"utf8"));

test("PayPlus URL can be shared before live payments but not before pre-launch safety closure",()=>{
  assert.equal(gate.payment_live_required,false);
  assert.equal(gate.supplier_live_order_required,false);
  assert.equal(gate.candidate_url_current_deploy_accepted,false);
  assert.equal(gate.status,"PENDING_LEGAL_DEPLOY_QA");
  assert.equal(gate.post_deploy_evidence.browser_qa,"PASS_DESKTOP_AND_390PX_MOBILE");
  assert.match(gate.post_deploy_evidence.session_adversarial_runtime,/^PARTIAL_/);
  assert.match(gate.candidate_url,/^https:\/\/hunt-pr26-prelaunch--deep-hunt-market\.netlify\.app$/);
});

test("PayPlus URL gate explicitly requires red-team, legal and no-real-money controls",()=>{
  const checks=gate.required_before_sharing.join(" ");
  for(const code of ["RT01","RT02","RT03","RT08","RT09","RT10"]) assert.match(checks,new RegExp(code));
  assert.match(checks,/Terms, Privacy, Returns\/Refunds and Shipping\/Delivery/);
  assert.deepEqual(gate.must_remain_off_during_provider_review,["hunt_payment_live","hunt_payplus_callback_accept_paid","hunt_supplier_order_live"]);
});
