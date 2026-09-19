const fs=require("node:fs");
const assert=require("node:assert");
const vm=require("node:vm");

const src=fs.readFileSync("hunt-experience-audit-core.js","utf8");
const context={window:{}};
vm.createContext(context);
vm.runInContext(src,context,{filename:"hunt-experience-audit-core.js"});

const api=context.window.HuntExperienceAudit;
assert(api,"HuntExperienceAudit global missing");
assert.strictEqual(api.baselineCommit,"78fc0ad","HUNT source baseline mismatch");
const departments=api.departments();
assert.strictEqual(departments.length,18,"A→Z audit must map exactly 18 departments");
assert.strictEqual(new Set(departments.map(x=>x.id)).size,18,"Department IDs must be unique");
for(const row of departments){
  assert(/^X\d{2}$/.test(row.id),"Invalid department id: "+row.id);
  assert(["PASS","PARTIAL","MISSING","BLOCKED","NEEDS_EVIDENCE"].includes(row.status),"Invalid status: "+row.status);
  assert(Array.isArray(row.evidence),"Evidence list missing: "+row.id);
  assert(Array.isArray(row.gaps),"Gap list missing: "+row.id);
  assert(Array.isArray(row.tests)&&row.tests.length>0,"Test list missing: "+row.id);
}
const report=api.audit();
assert.strictEqual(report.total,18,"Audit total mismatch");
assert.strictEqual(report.production_changed,false,"Audit must never change Production");
assert.strictEqual(report.provider_calls,0,"Source audit must not call providers");
assert.strictEqual(report.payment_changed,false,"Source audit must not change payment");
assert.strictEqual(report.supplier_order_changed,false,"Source audit must not change supplier ordering");
assert.strictEqual(report.owner_gate,"REVIEW_REQUIRED","Owner gate invariant missing");
assert(report.gap_count>0,"Audit should expose known gaps");
assert(report.departments.some(x=>x.id==="X03"&&x.status==="PASS"&&x.gaps.length===0),"Gallery audit lane must remain PASS after X03 closure");
assert(report.departments.some(x=>x.id==="X15"&&x.status==="BLOCKED"),"Real-money lifecycle gate missing");
const prompt=api.masterPrompt();
for(const token of ["Principal Ecommerce Experience QA Architect","PASS/PARTIAL/MISSING/BLOCKED","PRODUCTION","OWNER"]){
  assert(prompt.includes(token),"Master prompt core missing: "+token);
}
console.log("hunt_experience_audit_core=PASS",JSON.stringify({total:report.total,gaps:report.gap_count,counts:report.counts}));
