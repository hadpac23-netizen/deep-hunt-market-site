import assert from "node:assert/strict";
import {classifyPayPlusStatus,statusFingerprint} from "./supabase/functions/hunt-payplus-callback/payplus-status-map.mjs";

assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:1}}}).state,"CHARGE_CANDIDATE_SANDBOX_PROOF_REQUIRED");
assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:2}}}).state,"APPROVAL_NOT_PAID");
assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:0}}}).state,"CARD_CHECK_NOT_PAID");
assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:4}}}).state,"REFUND_CANDIDATE_SANDBOX_PROOF_REQUIRED");
assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:5}}}).state,"TOKEN_NOT_PAID");
assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:99}}}).state,"UNKNOWN_HOLD");
assert.equal(classifyPayPlusStatus({data:{transaction:{}}}).accepted_paid,false);
assert.equal(classifyPayPlusStatus({data:{transaction:{charge_method:1}}}).paid_state_write_allowed,false);
assert.deepEqual(
  statusFingerprint({data:{transaction:{charge_method:1,status:"success",code:0,description:"ok"}}}),
  {charge_method:1,charge_method_name:"CHARGE_J4",status:"success",code:0,description:"ok"}
);
console.log("payplus_status_map=PASS");