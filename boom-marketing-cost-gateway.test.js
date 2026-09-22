const fs=require("fs"),vm=require("vm"),assert=require("assert");
const c=JSON.parse(fs.readFileSync("boom-marketing-cost-evidence-contract.json","utf8"));
assert(/Missing connector or missing imported cost is UNKNOWN/.test(c.zero_spend_rule));
assert(c.hard_rules.some(x=>/Never convert missing cost data into zero/.test(x)));
const src=fs.readFileSync("boom-marketing-cost-gateway.js","utf8");
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);
const G=ctx.window.BoomMarketingCostGateway;
let r=G.normalize({source_class:"ANALYTICS_COST_IMPORT",platform:"GA4",account_ref:"553246710",period_start:"2026-09-01",period_end:"2026-09-22",currency:"USD",spend:0,channel_fees:0,evidence_ref:"ga4",retrieved_at:"2026-09-22",verification_status:"VERIFIED",coverage_proven:false});
assert.equal(r.verified,false);assert.equal(r.cost_truth,"UNKNOWN");assert.equal(r.reason,"ZERO_WITHOUT_COVERAGE_PROOF");
r=G.normalize({source_class:"OFFICIAL_AD_API",platform:"Google Ads",account_ref:"a1",period_start:"2026-09-01",period_end:"2026-09-22",currency:"USD",spend:120,channel_fees:2,evidence_ref:"api1",retrieved_at:"2026-09-22",verification_status:"VERIFIED",coverage_proven:true});
assert.equal(r.verified,true);assert.equal(r.cost_truth,"VERIFIED");
const a=G.aggregate([r.record]);
assert.equal(a.verified,false); // raw record loses coverage proof; must normalize from evidence envelope, preventing silent trust.
const a2=G.aggregate([{...r.record,coverage_proven:true}]);
assert.equal(a2.verified,true);assert.equal(a2.spend,120);assert.equal(a2.fees,2);
console.log("BOOM Marketing Cost Gateway: PASS — missing cost is UNKNOWN, zero needs coverage proof, verified spend aggregates only with evidence");
