const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const m=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../ops/hunt-launch-closure-matrix.json"),"utf8"));

test("launch closure matrix keeps real-money blockers explicit",()=>{
  assert.equal(m.payment.payment_live,false);
  assert.equal(m.payment.payplus_callback_accept_paid,false);
  assert.equal(m.payment.payplus_sandbox_evidence_enabled,false);
  assert.equal(m.payment.official_api_contract_verified,true);
  assert.equal(m.payment.pr26_code_matches_official_contract,true);
  assert.equal(m.payment.callback_auth_contract_verified,true);
  assert.equal(m.payment.ipn_full_contract_verified,true);
  assert.equal(m.payment.sandbox_e2e_proven,false);
  assert.equal(m.payment.payplus_sandbox_request_sent,false);
  assert.equal(m.payment.payplus_sandbox_credentials_scope,"NOT_PRESENT_IN_SUPABASE_VAULT_CURRENT_EVIDENCE");
  assert.equal(m.fulfillment.cj_sandbox_e2e_runtime_blocker.active_admin_auth_session,false);
  assert.equal(m.fulfillment.cj_sandbox_e2e_runtime_blocker.active_admin_auth_session_count_observed,0);
  assert.equal(m.fulfillment.cj_sandbox_e2e_runtime_blocker.admin_auth_session_required_blocker_closed,false);
  assert.equal(m.fulfillment.eprolo_order_tracking_contract_verified,true);
  assert.equal(m.fulfillment.eprolo_contract_blocker.status,"OFFICIAL_CONTRACT_DOCUMENTED_RUNTIME_COST_VARIANT_MISMATCH_EXECUTION_BLOCKED");
  assert.equal(m.fulfillment.eprolo_contract_blocker.order_price_quote.method_contract_mismatch,true);
  assert.equal(m.fulfillment.eprolo_contract_blocker.order_price_quote.tax_truth_verified,false);
  assert.equal(m.fulfillment.eprolo_contract_blocker.supplier_submission_allowed,false);
  assert.equal(m.freshness_automation.live_cron_enabled,false);
  assert.equal(m.legal.status,"PRELAUNCH_POLICY_PAGES_READY_REAL_MONEY_DISCLOSURES_PENDING");
  assert.deepEqual(m.legal.missing_verified_fields,[]);
  assert.equal(m.legal.returns_solution_complete,true);
  assert.equal(m.legal.returns_workflow_owner_approved,true);
  assert.equal(m.legal.company_mailbox_designated_as_support_privacy,true);
  assert.equal(m.legal.standalone_policy_page_files_found_in_pr26,true);
  assert.equal(m.legal.customer_policy_pages_verified,true);
  assert.equal(m.legal.policy_publication_owner_approved,true);
  assert.equal(m.legal.real_money_business_address_disclosure_pending,true);
  assert.equal(m.security.status,"PARTIAL");
  assert.equal(m.git_governance.branch_protection_verified,true);
  assert.equal(m.git_governance.branch_protection_enabled,false);
  assert.equal(m.git_governance.rulesets_count,0);
  assert.equal(m.git_governance.required_status_checks_enforced,false);
});

test("CJ and EPROLO readiness are never conflated",()=>{
  assert.equal(m.catalog.cj_exact_variant_refresh_pool,63);
  assert.equal(m.catalog.eprolo_canonical_pdp_ready,261);
  assert.equal(m.catalog.cj_live_il_audit.fresh_pretax_pass,30);
  assert.equal(m.catalog.eprolo_live_fresh_truth_status,"QUARANTINED_SAFE_RUNTIME_PENDING_TAX_AND_PDP_CREDENTIALS");
  assert.equal(m.catalog.eprolo_live_runtime_proof.canonical_core_audited,261);
  assert.equal(m.catalog.eprolo_live_runtime_proof.tax_unverified,261);
  assert.equal(m.catalog.eprolo_live_runtime_proof.final_profit_verified,0);
});


test("2026-10-01 red-team closure distinguishes staged fixes from live proof",()=>{
  assert.equal(m.red_team_2026_10_01.status,"PRELAUNCH_BROWSER_QA_PASS_EXTERNAL_BLOCKERS_REMAIN");
  assert.equal(m.red_team_2026_10_01.rt01,"LIVE_V27_REPLAY_EXPIRY_PRICE_KILLSWITCH_HARDENED");
  assert.equal(m.red_team_2026_10_01.rt02,"LIVE_V27_V16_OWNER_PROOF_HARDENED");
  assert.equal(m.red_team_2026_10_01.rt08,"LIVE_MIGRATION_APPLIED_PRIVILEGES_HARDENED");
  assert.equal(m.red_team_2026_10_01.rt09,"LIVE_V27_INTEGER_QTY_ENFORCED");
  assert.equal(m.red_team_2026_10_01.rt10,"PRELAUNCH_BROWSER_PASS_PRIVACY_CONTEXT_MOBILE_390");
  assert.equal(m.red_team_2026_10_01.prelaunch_netlify.browser_qa,"PASS");
  assert.equal(m.red_team_2026_10_01.prelaunch_netlify.mobile_390,"PASS");
  assert.equal(m.red_team_2026_10_01.prelaunch_netlify.production_promoted,false);
  assert.equal(m.freshness_automation.live_cron_enabled,false);
  assert.equal(m.freshness_automation.runner_live_deployed,false);
  assert.equal(m.freshness_automation.watcher_live_deployed,false);
  assert.equal(m.fulfillment.live_evidence.cj_records_total,10);
  assert.equal(m.fulfillment.live_evidence.tracking,0);
  assert.equal(m.fulfillment.live_evidence.shipped,0);
});
