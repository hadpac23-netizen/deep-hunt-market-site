const assert=require("node:assert");
const U=require("./boom-digital-marketing-university.js");

const src={source_url:"https://example.com/official",official_source_verified:true,verified_at:new Date().toISOString(),capability:"Free discovery",user_problem:"Low acquisition traffic"};
const exp={objective:"Increase qualified product opens",hypothesis:"Better internal links improve opens",audience:"Eligible shoppers",primary_kpi:"product-open rate",control:"Current experience",duration_rule:"Until sample floor",trust_safety_check:"No dark patterns",stop_rule:"Stop on guardrail breach",rollback:"Restore baseline",min_sample_size:100,paid:false};
const result={sample_size:120,baseline_value:10,treatment_value:12,control_measured:true,primary_kpi_measured:true,guardrail_measured:true,red_team_complete:true,data_quality_verified:true,guardrail_breached:false};
const row=U.evaluate({tactic:{level:"organic_growth",title:"Internal-link experiment",hunt_fit:"HUNT category/product discovery"},source:src,experiment:exp,result});
assert.strictEqual(row.state,"GRADUATION_CANDIDATE");
assert.strictEqual(row.graduate,false);
assert.strictEqual(row.adopt,false);

const paid=U.evaluate({tactic:{level:"advertising_systems",title:"Paid test",hunt_fit:"Acquisition"},source:src,experiment:{...exp,paid:true,owner_approval_status:"required"},result});
assert(paid.blockers.includes("paid_owner_approval_required"));
assert.strictEqual(paid.paid_launch,false);

const ready=U.systemReadiness({
  measurement_foundation_ready:true,product_truth_ready:true,experiment_registry_ready:true,
  holdout_framework_ready:true,guardrail_measurement_ready:true,learning_archive_ready:true,
  source_verification_workflow_ready:true
});
assert.strictEqual(ready.state,"OWNER_REVIEW");
assert.strictEqual(ready.auto_adopt,false);
assert.strictEqual(U.LEVELS.length,10);
console.log("boom_digital_marketing_university=PASS");