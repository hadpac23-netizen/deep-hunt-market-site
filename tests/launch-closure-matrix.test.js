const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const m=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../ops/hunt-launch-closure-matrix.json"),"utf8"));

test("launch closure matrix keeps real-money blockers explicit",()=>{
  assert.equal(m.payment.payment_live,false);
  assert.equal(m.payment.payplus_callback_accept_paid,false);
  assert.equal(m.fulfillment.eprolo_order_tracking_contract_verified,true);
  assert.equal(m.fulfillment.eprolo_contract_blocker.status,"OFFICIAL_CONTRACT_DOCUMENTED_EXECUTION_BLOCKED");
  assert.equal(m.fulfillment.eprolo_contract_blocker.supplier_submission_allowed,false);
  assert.equal(m.freshness_automation.live_cron_enabled,false);
  assert.equal(m.legal.status,"BLOCKED");
  assert.equal(m.security.status,"PARTIAL");
});

test("CJ and EPROLO readiness are never conflated",()=>{
  assert.equal(m.catalog.cj_exact_variant_refresh_pool,63);
  assert.equal(m.catalog.eprolo_canonical_pdp_ready,261);
  assert.equal(m.catalog.cj_live_il_audit.fresh_pretax_pass,30);
  assert.equal(m.catalog.eprolo_live_fresh_truth_status,"LIVE_STOCK_COST_SHIPPING_VERIFIED_TAX_MISSING");
  assert.equal(m.catalog.eprolo_live_runtime_proof.canonical_core_audited,261);
  assert.equal(m.catalog.eprolo_live_runtime_proof.tax_unverified,261);
  assert.equal(m.catalog.eprolo_live_runtime_proof.final_profit_verified,0);
});
