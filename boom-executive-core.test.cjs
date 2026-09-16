const assert=require("node:assert/strict");
const fs=require("node:fs");
const Core=require("./boom-executive-core.js");
const registry=JSON.parse(fs.readFileSync("./boom-manager-registry.json","utf8"));

{
  const out=Core.normalizeReport({
    manager_id:"inventory-truth",scope:["stock"],status:"healthy",
    evidence:[],metrics:{},action_class:"OBSERVE",confidence:0.9
  });
  assert.equal(out.status,"watch");
  assert.ok(out.issues.includes("Evidence missing for healthy claim"));
}

{
  const report={
    manager_id:"category-orchestrator",scope:["category_depth"],status:"watch",
    evidence:["15 clean products"],metrics:{clean_inventory:15},issues:["thin shelf"],
    recommended_action:"rotate and source gap",action_class:"SAFE_DYNAMIC",
    owner_approval_required:false,confidence:0.9,expected_impact:"high",
    risk_if_ignored:"weak assortment",recheck_at:"2026-09-16T02:00:00Z",fallback:"keep discovery-only"
  };
  assert.equal(Core.validateReport(report,registry).ok,true);
  assert.equal(Core.canAutoExecute(report,registry),true);
}

{
  const reports=[
    {manager_id:"inventory-truth",scope:["stock"],entity_key:"CJ:1",status:"critical",evidence:["provider says missing"],issues:["item missing"],recommended_action:"block item",action_class:"BLOCK",owner_approval_required:false,confidence:1,expected_impact:"critical"},
    {manager_id:"sale-readiness",scope:["stock"],entity_key:"CJ:1",status:"healthy",evidence:["old cache"],metrics:{checked:1},recommended_action:"none",action_class:"OBSERVE",owner_approval_required:false,confidence:0.4,expected_impact:"low"}
  ];
  const conflicts=Core.detectConflicts(reports);
  assert.equal(conflicts.length,1);
}

{
  const plan=Core.buildExecutivePlan([
    {manager_id:"marketing-growth",scope:["traffic"],status:"watch",evidence:["sessions low"],metrics:{sessions:8},issues:["traffic low"],recommended_action:"prepare organic plan",action_class:"STAGE_FIX",owner_approval_required:false,confidence:0.8,expected_impact:"medium"},
    {manager_id:"checkout-payment",scope:["checkout"],status:"critical",evidence:["order create failed"],metrics:{failures:2},issues:["checkout broken"],recommended_action:"block launch and stage fix",action_class:"BLOCK",owner_approval_required:false,confidence:1,expected_impact:"critical"},
    {manager_id:"pricing-profit",scope:["economics"],status:"watch",evidence:["margin verified"],metrics:{contribution:5},issues:["thin margin"],recommended_action:"reduce subsidy",action_class:"SAFE_DYNAMIC",owner_approval_required:false,confidence:0.9,expected_impact:"high"}
  ],registry);
  assert.equal(plan.summary.executive_status,"critical");
  assert.equal(plan.top_priority.manager_id,"checkout-payment");
  assert.ok(plan.safe_dynamic.some(x=>x.manager_id==="pricing-profit"));
  assert.ok(plan.staged_fixes.some(x=>x.manager_id==="marketing-growth"));
}

console.log("BOOM Executive Core tests: PASS");