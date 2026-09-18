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
  promptVersions:[{id:3,name:"decision-brain",version:3,label:"candidate"}],
  evalCases:[{id:1,suite_id:1,case_key:"truth-1",grader_type:"deterministic",weight:1}],
  modelObservations:[{id:90,provider:"openai",model:"gpt",success:true,latency_ms:420,estimated_cost_usd:0.01,quality_score:0.95,created_at:"2026-09-18T09:06:00Z",route_key:"owner-chat"}],
  modelRoutes:[{route_key:"owner-chat",max_latency_ms:1000,max_cost_usd:0.02,min_quality_score:0.8}],
  shadowRuns:[{experiment_key:"routing",status:"passed",baseline_metrics:{quality:0.8},candidate_metrics:{quality:0.9},comparison:{quality_gain:0.1}}],
  replayRuns:[{id:4,replay_key:"command-4",verdict:"same"}],
  redTeamCases:[{id:1,case_key:"rt-1",active:true}],
  redTeamRuns:[{id:1,case_id:1,result_status:"passed",completed_at:"2026-09-18T09:08:00Z"}],
  confidenceCalibration:[{id:1,task_class:"owner-chat",samples:100,correct_samples:91,mean_confidence:0.89,observed_accuracy:0.91,calibration_error:0.02}],
  teamRuns:[{id:1,run_key:"team-1",status:"completed",judge_verdict:{winner:"candidate-a"},completed_at:"2026-09-18T09:09:00Z"}],
  traceSpans:[{trace_id:"11111111-1111-4111-8111-111111111111",span_id:"22222222-2222-4222-8222-222222222222",session_id:"owner-session-1",name:"owner-chat-model",success:true,prompt_version_id:3,started_at:"2026-09-18T09:07:00Z"}],
  releaseGate:{mode:"A12_FINAL_OWNER_GO_NO_GO_GATE",final_gate_ready:true},
  promptStoreConnected:true,
  traceStoreConnected:true,
  datasetStoreConnected:true,
  reviewStoreConnected:true,
  traceSchemaConnected:true,
  alertRulesConnected:true,
  evaluatorRegistryConnected:true,
  humanAlignmentConnected:true,
  onlineEvalConnected:true,
  ciEvalGateConnected:true
};

const result=W.build(input);
assert.equal(result.mode,"BOOM_PROFESSIONAL_WORKBENCH");
assert(result.traces.rows.length>=5);
assert(result.traces.rows.some(x=>x.kind==="model"));
assert(result.experiments.comparisons.some(x=>x.source==="shadow"));
assert.equal(result.failures.dataset_candidates,1);
assert.equal(result.experiments.available,true);
assert.equal(result.experiments.comparisons[0].metric,"quality");
assert.equal(result.review.count,2);
assert.equal(result.cost.instrumented,true);
assert.equal(result.cost.total_tokens,1800);
assert.equal(result.cost.p50_latency_ms,420);
assert.equal(result.cost.p95_latency_ms,900);
assert.equal(result.prompts.instrumented,true);
assert.equal(result.prompts.status,"VERSIONED");
assert.equal(result.traceHierarchy.spans,1);
assert.equal(result.traceHierarchy.traces,1);
assert.equal(result.traceHierarchy.sessions,1);
assert(result.traces.rows.some(x=>x.kind==="span"));
assert.equal(result.alerts.watch,1);
assert.equal(result.evaluators.governance_ready,true);
assert.equal(result.evaluators.continuous_gate_ready,true);
assert.equal(result.safety.redteam.ready,true);
assert.equal(result.safety.calibration.ready,true);
assert.equal(result.safety.team_judge.ready,true);
assert.equal(result.lineage.ready,true);
assert.equal(result.safety.redteam.completed_linked,1);
assert.equal(result.safety.redteam.covered_cases,1);
assert.equal(result.safety.calibration.valid_rows,1);
assert.equal(result.safety.team_judge.judged,1);
assert.equal(result.gaps.length,0);
assert.equal(result.invariants.production_change,false);
assert.equal(result.invariants.payments,false);

const pendingSafety=W.buildSafetyOps({
  redTeamCases:[{id:1,active:true}],
  redTeamRuns:[{case_id:1,result_status:"passed",completed_at:null}]
});
assert.equal(pendingSafety.redteam.ready,false);
assert.equal(pendingSafety.redteam.pending,1);

const unlinkedSafety=W.buildSafetyOps({
  redTeamCases:[{id:1,active:true}],
  redTeamRuns:[{case_id:999,result_status:"passed",completed_at:"2026-09-18T10:00:00Z"}]
});
assert.equal(unlinkedSafety.redteam.ready,false);
assert.equal(unlinkedSafety.redteam.unlinked,1);

const emptyCalibration=W.buildSafetyOps({confidenceCalibration:[{}]});
assert.equal(emptyCalibration.calibration.ready,false);
assert.equal(emptyCalibration.calibration.invalid_rows,1);

const zeroSampleCalibration=W.buildSafetyOps({
  confidenceCalibration:[{samples:0,correct_samples:0,mean_confidence:0.5,observed_accuracy:0.5,calibration_error:0}]
});
assert.equal(zeroSampleCalibration.calibration.ready,false);

const emptyJudge=W.buildSafetyOps({
  teamRuns:[{status:"completed",completed_at:"2026-09-18T10:00:00Z",judge_verdict:{}}]
});
assert.equal(emptyJudge.team_judge.ready,false);
assert.equal(emptyJudge.team_judge.incomplete,1);

const mixedPending=W.buildSafetyOps({
  redTeamCases:[{id:1,active:true}],
  redTeamRuns:[
    {case_id:1,result_status:"passed",completed_at:"2026-09-18T10:00:00Z"},
    {case_id:1,result_status:"passed",completed_at:null}
  ]
});
assert.equal(mixedPending.redteam.covered_cases,1);
assert.equal(mixedPending.redteam.pending,1);
assert.equal(mixedPending.redteam.ready,false);

const mixedUnlinked=W.buildSafetyOps({
  redTeamCases:[{id:1,active:true}],
  redTeamRuns:[
    {case_id:1,result_status:"passed",completed_at:"2026-09-18T10:00:00Z"},
    {case_id:999,result_status:"passed",completed_at:"2026-09-18T10:01:00Z"}
  ]
});
assert.equal(mixedUnlinked.redteam.covered_cases,1);
assert.equal(mixedUnlinked.redteam.unlinked,1);
assert.equal(mixedUnlinked.redteam.ready,false);

const validCalibrationRow={
  samples:100,
  correct_samples:91,
  mean_confidence:0.89,
  observed_accuracy:0.91,
  calibration_error:0.02
};
for(const field of ["samples","correct_samples","mean_confidence","observed_accuracy","calibration_error"]){
  for(const missingValue of [null,""]){
    const row={...validCalibrationRow,[field]:missingValue};
    const resultMissing=W.buildSafetyOps({confidenceCalibration:[row]});
    assert.equal(resultMissing.calibration.ready,false,"missing "+field+" must fail closed");
    assert.equal(resultMissing.calibration.invalid_rows,1);
  }
}

const mixedCalibration=W.buildSafetyOps({
  confidenceCalibration:[
    validCalibrationRow,
    {...validCalibrationRow,calibration_error:null}
  ]
});
assert.equal(mixedCalibration.calibration.valid_rows,1);
assert.equal(mixedCalibration.calibration.invalid_rows,1);
assert.equal(mixedCalibration.calibration.ready,false);

const gaps=W.build({reports:[],evals:[],commands:[],events:[],workerReports:[],cycles:[],decisions:[]});
assert(gaps.gaps.includes("prompts"));
assert(gaps.gaps.includes("experiments"));
assert(gaps.gaps.includes("cost"));
assert(gaps.gaps.includes("release"));
assert(gaps.gaps.includes("traces"));
assert(gaps.gaps.includes("datasets"));
assert(gaps.gaps.includes("review"));
assert(gaps.gaps.includes("alerts"));
assert(gaps.gaps.includes("evaluators"));
assert(gaps.gaps.includes("online-ci"));
assert(gaps.gaps.includes("redteam"));
assert(gaps.gaps.includes("calibration"));
assert(gaps.gaps.includes("team-judge"));
assert(gaps.gaps.includes("lineage"));
assert.equal(gaps.prompts.status,"REGISTRY_REQUIRED");
assert.equal(gaps.traceHierarchy.store_connected,false);
assert.equal(gaps.invariants.mutation,false);

console.log("boom_professional_workbench=PASS");