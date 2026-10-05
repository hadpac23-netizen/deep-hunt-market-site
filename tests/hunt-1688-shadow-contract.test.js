const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-1688-readonly-pilot/index.ts"),"utf8");
const contract=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../ops/hunt-1688-api-contract.json"),"utf8"));

test("1688 adapter is read-only shadow and cannot publish/order/pay",()=>{
  assert.match(src,/mode:\"READ_ONLY_SHADOW\"/);
  assert.match(src,/payment:\"OFF\"/);
  assert.match(src,/supplier_live_order:\"OFF\"/);
  assert.match(src,/supplier_order_submission_allowed:false/);
  assert.match(src,/production_catalog_write:false/);
  assert.match(src,/public_storefront_exposure:false/);
  assert.match(src,/auto_publish:false/);
  assert.equal(contract.runtime_policy.read_only,true);
  assert.equal(contract.runtime_policy.shadow_only,true);
  assert.equal(contract.runtime_policy.supplier_live_order,false);
  assert.equal(contract.runtime_policy.payment_live,false);
});

test("1688 adapter fails closed before official API and data approvals",()=>{
  assert.match(src,/HUNT_1688_OFFICIAL_API_CONTRACT_VERIFIED/);
  assert.match(src,/HUNT_1688_DATA_RESIDENCY_APPROVED/);
  assert.match(src,/HUNT_1688_IMAGE_DISPLAY_RIGHTS_APPROVED/);
  assert.match(src,/AWAITING_OFFICIAL_1688_API_CONTRACT/);
  assert.match(src,/1688_DATA_RESIDENCY_NOT_APPROVED/);
  assert.match(src,/1688_IMAGE_DISPLAY_RIGHTS_NOT_APPROVED/);
  assert.match(src,/1688_SHADOW_KILL_SWITCH_OFF/);
  assert.equal(contract.hard_gates.official_api_contract_verified,false);
  assert.equal(contract.hard_gates.data_residency_approved,false);
  assert.equal(contract.hard_gates.image_display_rights_approved,false);
});

test("1688 credentials are names only and must never be committed",()=>{
  const serialized=JSON.stringify(contract);
  assert.equal(contract.credential_values_in_git,false);
  assert.ok(contract.credential_names_reserved.includes("hunt_1688_app_key"));
  assert.ok(contract.credential_names_reserved.includes("hunt_1688_app_secret"));
  assert.doesNotMatch(serialized,/app_secret\"\s*:\s*\"[^\"]{8,}\"/i);
  assert.match(src,/credentials_logged:false/);
});

test("image modification remains a separate written-rights gate",()=>{
  assert.match(src,/HUNT_1688_IMAGE_MODIFICATION_RIGHTS_APPROVED/);
  assert.equal(contract.hard_gates.image_modification_rights_approved,false);
  assert.match(contract.image_policy.CLEANABLE,/explicit modification rights approval/i);
});

test("500k scale is staged and never bypasses owner gate",()=>{
  assert.deepEqual(contract.target_candidate_scale.scale_steps,[1000,5000,30000,100000,250000,500000]);
  assert.equal(contract.hard_gates.owner_gate_required_before_publication,true);
  assert.equal(contract.target_candidate_scale.initial_canary,20);
  assert.equal(contract.candidate_pipeline.at(-1),"PUBLISH");
  assert.ok(contract.candidate_pipeline.includes("RED_TEAM"));
  assert.ok(contract.candidate_pipeline.includes("OWNER_GATE"));
});
