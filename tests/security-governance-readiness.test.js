const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const auth=fs.readFileSync(path.join(root,"auth.js"),"utf8");
const authHtml=fs.readFileSync(path.join(root,"auth.html"),"utf8");
const plan=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-main-branch-protection-plan.json"),"utf8"));

test("security mitigation does not expose a password-auth path in HUNT UI",()=>{
  assert.doesNotMatch(auth,/signInWithPassword|signUp\s*\([^)]*password/i);
  assert.doesNotMatch(authHtml,/type=["']password["']/i);
  assert.match(auth,/signInWithOtp|signInWithOAuth/);
});

test("branch-protection plan is explicit but Owner-Gated",()=>{
  assert.equal(plan.current_state,"VERIFIED_UNPROTECTED");
  assert.equal(plan.apply_now,false);
  assert.equal(plan.owner_gate_required,true);
  assert.deepEqual(plan.required_status_checks,["HUNT checkout regression","HUNT Catalog Integrity"]);
  assert.equal(plan.allow_force_pushes,false);
  assert.equal(plan.allow_deletions,false);
});
