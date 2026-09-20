import assert from "node:assert/strict";
import fs from "node:fs";
import {PAYPLUS_STATUS_PROOF,resolveApprovedStatus,proofReadiness,fingerprintKey}
  from "./supabase/functions/_shared/payplus-status-proof.mjs";

const contract=JSON.parse(fs.readFileSync("boom-payplus-proof-contract.json","utf8"));
assert.equal(contract.version,PAYPLUS_STATUS_PROOF.version);
assert.equal(contract.state,PAYPLUS_STATUS_PROOF.state);
assert.equal(contract.owner_approved,PAYPLUS_STATUS_PROOF.owner_approved);
assert.equal(resolveApprovedStatus({charge_method:1,status:"success",code:"0"}),null);
assert.equal(proofReadiness({success_observation:null,reject_observation:null}).state,"HOLD");
assert.equal(proofReadiness({success_observation:{},reject_observation:{}}).state,"REVIEW");
assert.equal(fingerprintKey({charge_method:1,status:0,code:"000"}),'[1,"0","000"]');

const approved={
  version:"x",state:"READY",owner_approved:true,
  approved_success:{charge_method:1,status:"approved",code:"0"},
  approved_reject:{charge_method:1,status:"declined",code:"12"}
};
assert.equal(resolveApprovedStatus({charge_method:1,status:"approved",code:"0"},approved),"paid");
assert.equal(resolveApprovedStatus({charge_method:1,status:"declined",code:"12"},approved),"failed");
assert.equal(resolveApprovedStatus({charge_method:1,status:"approved",code:"999"},approved),null);
console.log("BOOM PayPlus proof gate: PASS — only exact owner-approved fingerprints can resolve paid/failed");