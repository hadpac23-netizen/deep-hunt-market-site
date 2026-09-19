const H=require("./boom-brain-health.js");
const assert=require("assert");
let r=H.evaluate({brain_id:"growth",lifecycle:"GATED",error_rate:.30,error_samples:30});
assert.equal(r.recommended_lifecycle,"SHADOW");assert(r.reasons.includes("ERROR_RATE_EXCEEDED"));
r=H.evaluate({brain_id:"ops",lifecycle:"ACTIVE",safety_policy_failure:true});assert.equal(r.recommended_lifecycle,"OFF");
r=H.evaluate({brain_id:"intel",lifecycle:"ACTIVE",error_rate:.4,error_samples:4});assert.equal(r.recommended_lifecycle,"ACTIVE");
r=H.evaluate({brain_id:"commerce",lifecycle:"ACTIVE",critical_evidence_fresh:false});assert.equal(r.recommended_lifecycle,"SHADOW");
console.log("BOOM brain circuit breaker: PASS");
