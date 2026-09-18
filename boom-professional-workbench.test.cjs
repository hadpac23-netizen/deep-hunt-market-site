const assert=require("node:assert");
const W=require("./boom-professional-workbench.js");

const input={
  commands:[{id:"c1",title:"Run QA",status:"done",created_at:"2026-09-18T09:00:00Z",target_manager_id:"qa"}],
  events:[{id:"e1",title:"Stock warning",severity:"watch",created_at:"2026-09-18T09:01:00Z",source_manager_id:"inventory"}],
  workerReports:[{id:"w1",worker_id:"worker-a",manager_id:"inventory",status:"healthy",created_at:"2026-09-18T09:02:00Z"}],
  reports:[
    {manager_id:"supplier-cj",status:"watch",issues:["Stock freshness"],recommended_action:"Recheck",created_at:"2026-09-18T09:03:00Z"},
    {manager_id:"release-control",status:"healthy",issues:[],created_at:"2026-09-18T09:04:00Z"}
  ],
  cycles:[
    {id:"cy1",focus:"ranking",status:"evaluating",started_at:"2026-09-18T08:00:00Z"}
  ],
  evals:[
    {id:"ev2",metric_name:"quality",current_value:0.92,passed:true,created_at:"2026-09-18T09:05:00Z"},
    {id:"ev1",metric_name:"quality",current_value:0.88,passed:true,created_at:"2026-09-18T08:05:00Z"}
  ],
  decisions:[{id:"d1",status:"pending",title:"Owner review",reason:"Release gate"}],
  costSamples:[
    {cost:0.02,latency_ms:420,tokens:600},
    {cost:0.03,latency_ms:900,tokens:900},
    {cost:0.01,latency_ms:300,tokens:300}
  ],
  promptVersions:[{name:"decision-brain",version:3,label:"candidate"}],
  releaseGate:{mode:"A12_FINAL_OWNER_GO_NO_GO_GATE",final_gate_ready:true},
  datasetStoreConnected:true,
  reviewStoreConnected:true,
  traceSchemaConnected:true,
  alertRulesConnected:true
};

const result=W.build(input);
assert.equal(result.mode,"BOOM_PROFESSIONAL_WORKBENCH");
assert(result.traces.rows.length>=5);
assert.equal(result.failures.dataset_candidates,1);
assert.equal(result.experiments.available,true);
assert.equal(result.experiments.comparisons[0].metric,"quality");
assert.equal(result.review.count,2);
assert.equal(result.cost.instrumented,true);
assert.equal(result.cost.total_tokens,1800);
assert.equal(result.cost.p50_latency_ms,420);
assert.equal(result.cost.p95_latency_ms,900);
assert.equal(result.prompts.instrumented,true);
assert.equal(result.alerts.watch,1);
assert.equal(result.gaps.length,0);
assert.equal(result.invariants.production_change,false);
assert.equal(result.invariants.payments,false);

const gaps=W.build({reports:[],evals:[],commands:[],events:[],workerReports:[],cycles:[],decisions:[]});
assert(gaps.gaps.includes("prompts"));
assert(gaps.gaps.includes("experiments"));
assert(gaps.gaps.includes("cost"));
assert(gaps.gaps.includes("release"));
assert(gaps.gaps.includes("traces"));
assert(gaps.gaps.includes("datasets"));
assert(gaps.gaps.includes("review"));
assert(gaps.gaps.includes("alerts"));
assert.equal(gaps.invariants.mutation,false);

console.log("boom_professional_workbench=PASS");