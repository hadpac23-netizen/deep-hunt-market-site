(() => {
  "use strict";

  const safeArray=v=>Array.isArray(v)?v:[];
  const clean=v=>String(v??"").trim();
  const badStatus=v=>["critical","blocked","failed","fail","killed","error"].includes(clean(v).toLowerCase());
  const watchStatus=v=>["watch","warning","open","evaluating","pending"].includes(clean(v).toLowerCase());

  function percentile(values,p){
    const rows=safeArray(values).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    if(!rows.length)return null;
    const idx=Math.min(rows.length-1,Math.max(0,Math.ceil((p/100)*rows.length)-1));
    return rows[idx];
  }

  function buildTraceExplorer(input={}){
    const rows=[
      ...safeArray(input.commands).map(x=>({kind:"command",id:x.id||x.command_id,title:x.title||x.instruction||"Command",status:x.status||"open",time:x.created_at,actor:x.target_manager_id||x.issued_by||"unknown"})),
      ...safeArray(input.events).map(x=>({kind:"event",id:x.id,title:x.title||x.event_type||"Event",status:x.severity||"healthy",time:x.created_at,actor:x.source_manager_id||"system"})),
      ...safeArray(input.workerReports).map(x=>({kind:"worker",id:x.id,title:x.finding||x.worker_id||"Worker report",status:x.status||"healthy",time:x.created_at,actor:x.worker_id||x.manager_id||"worker"})),
      ...safeArray(input.cycles).map(x=>({kind:"cycle",id:x.id,title:x.focus||x.cycle_key||"Cycle",status:x.status||"open",time:x.evaluated_at||x.started_at,actor:x.started_by||"BOOM"})),
      ...safeArray(input.evals).map(x=>({kind:"eval",id:x.id,title:x.metric_name||x.eval_key||"Eval",status:x.passed===true?"pass":x.passed===false?"fail":"open",time:x.created_at,actor:x.subject_key||x.subject_type||"eval"})),
      ...safeArray(input.modelObservations).map(x=>({kind:"model",id:x.id,title:(x.provider||"model")+"/"+(x.model||"unknown"),status:x.success===true?"pass":x.success===false?"fail":"open",time:x.created_at,actor:x.route_key||x.task_class||"model"})),
      ...safeArray(input.traceSpans).map(x=>({kind:"span",id:x.span_id||x.id,title:x.name||x.span_type||"Span",status:x.success===true?"pass":x.success===false?"fail":x.status||"open",time:x.started_at,actor:x.route_key||x.session_id||x.trace_id||"trace"}))
    ].filter(x=>x.time).sort((a,b)=>new Date(b.time)-new Date(a.time));
    return Object.freeze({
      rows:Object.freeze(rows.slice(0,160)),
      failures:rows.filter(x=>badStatus(x.status)).length,
      watch:rows.filter(x=>watchStatus(x.status)).length,
      actors:new Set(rows.map(x=>x.actor).filter(Boolean)).size
    });
  }

  function buildFailureInbox(input={}){
    const items=[];
    for(const report of safeArray(input.reports)){
      const issues=safeArray(report.issues);
      if(badStatus(report.status)||watchStatus(report.status)||issues.length){
        items.push({
          source:"manager",
          key:report.manager_id||report.id||"manager",
          status:report.status||"watch",
          title:report.manager_id||"Manager report",
          detail:issues.join(" · ")||report.recommended_action||"Review required",
          time:report.created_at
        });
      }
    }
    for(const e of safeArray(input.evals)){
      if(e.passed===false){
        items.push({
          source:"eval",
          key:e.eval_key||e.id||"eval",
          status:"critical",
          title:e.metric_name||e.eval_key||"Failed eval",
          detail:e.notes||("value="+String(e.current_value??"—")+" target="+String(e.target??"—")),
          time:e.created_at
        });
      }
    }
    items.sort((a,b)=>new Date(b.time||0)-new Date(a.time||0));
    return Object.freeze({
      items:Object.freeze(items.slice(0,80)),
      dataset_candidates:items.length,
      persisted_dataset:input.datasetStoreConnected===true
    });
  }

  function buildExperimentDiff(input={}){
    const evals=safeArray(input.evals).filter(x=>x.current_value!==null&&x.current_value!==undefined);
    const grouped=new Map();
    for(const e of evals){
      const key=clean(e.metric_name||e.eval_key||"metric");
      if(!grouped.has(key))grouped.set(key,[]);
      grouped.get(key).push(e);
    }
    const comparisons=[];
    for(const [metric,rows] of grouped){
      rows.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      if(rows.length<2)continue;
      const [candidate,baseline]=rows;
      const c=Number(candidate.current_value),b=Number(baseline.current_value);
      comparisons.push({
        metric,
        baseline:Number.isFinite(b)?b:null,
        candidate:Number.isFinite(c)?c:null,
        delta:Number.isFinite(c)&&Number.isFinite(b)?c-b:null,
        candidate_pass:candidate.passed,
        baseline_pass:baseline.passed,
        source:"eval"
      });
    }
    for(const run of safeArray(input.shadowRuns)){
      const baseline=run?.baseline_metrics&&typeof run.baseline_metrics==="object"?run.baseline_metrics:{};
      const candidate=run?.candidate_metrics&&typeof run.candidate_metrics==="object"?run.candidate_metrics:{};
      const keys=[...new Set([...Object.keys(baseline),...Object.keys(candidate)])];
      let added=0;
      for(const key of keys){
        const b=Number(baseline[key]),c=Number(candidate[key]);
        if(!Number.isFinite(b)||!Number.isFinite(c))continue;
        comparisons.push({
          metric:(run.experiment_key||run.run_key||"shadow")+":"+key,
          baseline:b,
          candidate:c,
          delta:c-b,
          candidate_pass:run.status==="passed"?true:run.status==="failed"?false:null,
          baseline_pass:null,
          source:"shadow"
        });
        added++;
      }
      if(!added&&run.comparison&&Object.keys(run.comparison).length){
        comparisons.push({
          metric:(run.experiment_key||run.run_key||"shadow")+":comparison",
          baseline:null,
          candidate:null,
          delta:null,
          candidate_pass:run.status==="passed"?true:run.status==="failed"?false:null,
          baseline_pass:null,
          source:"shadow"
        });
      }
    }
    return Object.freeze({
      available:comparisons.length>0,
      comparisons:Object.freeze(comparisons.slice(0,40))
    });
  }

  function buildReviewQueue(input={}){
    const failures=buildFailureInbox(input).items;
    const decisions=safeArray(input.decisions).filter(x=>["pending","needs_review","owner_review_required"].includes(clean(x.status).toLowerCase()));
    const rows=[
      ...failures.map(x=>({kind:x.source,key:x.key,title:x.title,detail:x.detail,status:x.status})),
      ...decisions.map(x=>({kind:"decision",key:x.id||x.decision_key||"decision",title:x.title||x.decision_type||"Owner decision",detail:x.reason||x.notes||"Owner review required",status:x.status||"pending"}))
    ];
    return Object.freeze({rows:Object.freeze(rows.slice(0,80)),count:rows.length,persisted:input.reviewStoreConnected===true});
  }

  function buildCostLatency(input={}){
    const samples=safeArray(input.costSamples);
    const costs=samples.map(x=>Number(x.cost)).filter(Number.isFinite);
    const latency=samples.map(x=>Number(x.latency_ms)).filter(Number.isFinite);
    const tokens=samples.map(x=>Number(x.tokens)).filter(Number.isFinite);
    return Object.freeze({
      instrumented:samples.length>0,
      sample_count:samples.length,
      total_cost:costs.length?costs.reduce((a,b)=>a+b,0):null,
      total_tokens:tokens.length?tokens.reduce((a,b)=>a+b,0):null,
      p50_latency_ms:percentile(latency,50),
      p95_latency_ms:percentile(latency,95),
      budget_state:samples.length?"MEASURED":"INSTRUMENTATION_REQUIRED"
    });
  }

  function buildPromptRegistry(input={}){
    const rows=safeArray(input.promptVersions);
    const connected=input.promptStoreConnected===true;
    return Object.freeze({
      instrumented:connected&&rows.length>0,
      connected,
      rows:Object.freeze(rows),
      status:rows.length?"VERSIONED":connected?"EMPTY_REGISTRY":"REGISTRY_REQUIRED"
    });
  }

  function buildAlerts(input={}){
    const alerts=[];
    for(const report of safeArray(input.reports)){
      if(badStatus(report.status)||watchStatus(report.status)){
        alerts.push({
          source:report.manager_id||"manager",
          severity:badStatus(report.status)?"critical":"watch",
          message:safeArray(report.issues).join(" · ")||report.recommended_action||clean(report.status)
        });
      }
    }

    const observations=safeArray(input.modelObservations);
    for(const route of safeArray(input.modelRoutes)){
      const key=clean(route.route_key);
      if(!key)continue;
      const rows=observations
        .filter(x=>clean(x.route_key)===key)
        .sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))
        .slice(0,20);
      if(!rows.length)continue;

      const latencyP95=percentile(rows.map(x=>x.latency_ms),95);
      const latencyLimit=Number(route.max_latency_ms);
      if(Number.isFinite(latencyP95)&&Number.isFinite(latencyLimit)&&latencyP95>latencyLimit){
        alerts.push({source:key,severity:"watch",message:"P95 latency "+latencyP95+"ms > route budget "+latencyLimit+"ms"});
      }

      const costs=rows.map(x=>Number(x.estimated_cost_usd)).filter(Number.isFinite);
      const costLimit=Number(route.max_cost_usd);
      const maxCost=costs.length?Math.max(...costs):null;
      if(Number.isFinite(maxCost)&&Number.isFinite(costLimit)&&maxCost>costLimit){
        alerts.push({source:key,severity:"watch",message:"Max observed cost $"+maxCost.toFixed(6)+" > route budget $"+costLimit.toFixed(6)});
      }

      const quality=rows.map(x=>Number(x.quality_score)).filter(Number.isFinite);
      const qualityMin=Number(route.min_quality_score);
      const qualityAvg=quality.length?quality.reduce((a,b)=>a+b,0)/quality.length:null;
      if(Number.isFinite(qualityAvg)&&Number.isFinite(qualityMin)&&qualityAvg<qualityMin){
        alerts.push({source:key,severity:"watch",message:"Average quality "+qualityAvg.toFixed(3)+" < route minimum "+qualityMin.toFixed(3)});
      }

      const failures=rows.filter(x=>x.success===false).length;
      if(failures){
        alerts.push({source:key,severity:"critical",message:failures+" failed model observation(s) in latest "+rows.length+" samples"});
      }
    }

    return Object.freeze({
      alerts:Object.freeze(alerts.slice(0,80)),
      critical:alerts.filter(x=>x.severity==="critical").length,
      watch:alerts.filter(x=>x.severity==="watch").length
    });
  }

  function buildEvaluatorOps(input={}){
    const cases=safeArray(input.evalCases);
    const graderTypes=[...new Set(cases.map(x=>clean(x.grader_type).toLowerCase()).filter(Boolean))].sort();

    const registry=safeArray(input.evaluatorRegistry);
    const alignments=safeArray(input.humanAlignmentRuns);
    const online=safeArray(input.onlineEvalWindows);
    const gates=safeArray(input.ciQualityGates).filter(x=>x.enabled!==false);
    const gateRuns=safeArray(input.ciQualityGateRuns);

    const activeEvaluators=registry.filter(x=>clean(x.status).toLowerCase()==="active"&&Boolean(x.activated_at));
    const activeIds=new Set(activeEvaluators.map(x=>String(x.id??"")).filter(Boolean));
    const validAlignments=alignments.filter(x=>{
      const sampleCount=Number(x.sample_count);
      const agreement=Number(x.agreement_rate);
      return activeIds.has(String(x.evaluator_id??""))&&
        clean(x.status).toLowerCase()==="completed"&&Boolean(x.completed_at)&&
        x.owner_approved===true&&Number.isFinite(sampleCount)&&sampleCount>0&&
        x.agreement_rate!==null&&x.agreement_rate!==undefined&&String(x.agreement_rate).trim()!==""&&
        Number.isFinite(agreement)&&agreement>=0&&agreement<=1;
    });
    const alignedIds=new Set(validAlignments.map(x=>String(x.evaluator_id??"")));
    const calibrationRequired=activeEvaluators.filter(x=>x.calibration_required!==false);
    const missingAlignment=calibrationRequired.filter(x=>!alignedIds.has(String(x.id??"")));

    const completedOnline=online.filter(x=>{
      const samples=Number(x.sample_count),scored=Number(x.scored_count);
      const passed=Number(x.passed_count),failed=Number(x.failed_count);
      return clean(x.status).toLowerCase()==="completed"&&Boolean(x.completed_at)&&
        Number.isFinite(samples)&&samples>0&&Number.isFinite(scored)&&scored>0&&scored<=samples&&
        Number.isFinite(passed)&&passed>=0&&Number.isFinite(failed)&&failed>=0&&passed+failed<=scored;
    });

    const blockingGates=gates.filter(x=>x.blocks_merge===true);
    const latestRunByGate=new Map();
    for(const run of gateRuns){
      const key=String(run.gate_id??"");
      if(key&&!latestRunByGate.has(key))latestRunByGate.set(key,run);
    }
    const passedGateIds=new Set();
    const failedGateIds=new Set();
    const pendingGateIds=new Set();
    for(const gate of blockingGates){
      const key=String(gate.id??"");
      const run=latestRunByGate.get(key);
      const samples=Number(run?.sample_count);
      const enough=Number.isFinite(samples)&&samples>=Number(gate.min_samples||1);
      const status=clean(run?.status).toLowerCase();
      const measured=run?.metric_value!==null&&run?.metric_value!==undefined&&String(run?.metric_value).trim()!==""&&Number.isFinite(Number(run.metric_value));
      if(status==="completed"&&Boolean(run?.completed_at)&&enough&&measured&&run?.passed===true)passedGateIds.add(key);
      else if(status==="completed"&&Boolean(run?.completed_at)&&enough&&measured&&run?.passed===false)failedGateIds.add(key);
      else pendingGateIds.add(key);
    }
    const uncoveredGates=blockingGates.filter(g=>!passedGateIds.has(String(g.id??"")));
    const pendingOnline=online.filter(x=>["pending","running"].includes(clean(x.status).toLowerCase()));

    const evaluatorRegistryConnected=activeEvaluators.length>0;
    const humanAlignmentConnected=evaluatorRegistryConnected&&missingAlignment.length===0;
    const alignmentState=calibrationRequired.length===0?"not_required":humanAlignmentConnected?"evidenced":"gap";
    const onlineEvalConnected=completedOnline.length>0;
    const ciEvalGateConnected=blockingGates.length>0&&uncoveredGates.length===0;
    const ciGateState=failedGateIds.size>0?"blocked":pendingGateIds.size>0?"pending":ciEvalGateConnected?"ready":"gap";

    return Object.freeze({
      grader_types:Object.freeze(graderTypes),
      evaluator_registry_connected:evaluatorRegistryConnected,
      evaluator_registry_rows:registry.length,
      active_evaluators:activeEvaluators.length,
      calibration_required:calibrationRequired.length,
      human_alignment_connected:humanAlignmentConnected,
      alignment_runs:alignments.length,
      valid_alignment_runs:validAlignments.length,
      missing_alignment:missingAlignment.length,
      alignment_state:alignmentState,
      online_eval_connected:onlineEvalConnected,
      online_windows:online.length,
      completed_online_windows:completedOnline.length,
      pending_online_windows:pendingOnline.length,
      ci_eval_gate_connected:ciEvalGateConnected,
      ci_gate_state:ciGateState,
      ci_gates:blockingGates.length,
      ci_gate_runs:gateRuns.length,
      passed_ci_gates:passedGateIds.size,
      failed_ci_gates:failedGateIds.size,
      pending_ci_gates:pendingGateIds.size,
      uncovered_ci_gates:uncoveredGates.length,
      governance_ready:graderTypes.length>0&&evaluatorRegistryConnected&&humanAlignmentConnected,
      continuous_gate_ready:onlineEvalConnected&&ciEvalGateConnected
    });
  }

  function buildSafetyOps(input={}){
    const cases=safeArray(input.redTeamCases).filter(x=>x.active!==false);
    const runs=safeArray(input.redTeamRuns);
    const caseIds=new Set(cases.map(x=>String(x.id??"")).filter(Boolean));
    const passStatuses=new Set(["passed","pass","safe","success"]);
    const failStatuses=new Set(["failed","fail","blocked","unsafe","error"]);
    const finalStatuses=new Set([...passStatuses,...failStatuses]);
    const completedLinked=runs.filter(x=>{
      const status=clean(x.result_status).toLowerCase();
      return caseIds.has(String(x.case_id??""))&&Boolean(x.completed_at)&&finalStatuses.has(status);
    });
    const failedRuns=completedLinked.filter(x=>failStatuses.has(clean(x.result_status).toLowerCase()));
    const coveredCases=new Set(completedLinked.map(x=>String(x.case_id??"")));
    const unlinkedRuns=runs.filter(x=>!caseIds.has(String(x.case_id??"")));
    const pendingRuns=runs.filter(x=>!x.completed_at||!finalStatuses.has(clean(x.result_status).toLowerCase()));

    const calibration=safeArray(input.confidenceCalibration);
    const hasMeasuredValue=value=>value!==null&&value!==undefined&&!(typeof value==="string"&&value.trim()==="");
    const validCalibration=calibration.filter(x=>{
      const required=[x.samples,x.correct_samples,x.mean_confidence,x.observed_accuracy,x.calibration_error];
      if(required.some(value=>!hasMeasuredValue(value)))return false;
      const samples=Number(x.samples);
      const correct=Number(x.correct_samples);
      const mean=Number(x.mean_confidence);
      const observed=Number(x.observed_accuracy);
      const error=Number(x.calibration_error);
      return Number.isFinite(samples)&&samples>0&&
        Number.isFinite(correct)&&correct>=0&&correct<=samples&&
        Number.isFinite(mean)&&mean>=0&&mean<=1&&
        Number.isFinite(observed)&&observed>=0&&observed<=1&&
        Number.isFinite(error)&&error>=0;
    });

    const teamRuns=safeArray(input.teamRuns);
    const teamFinalStatuses=new Set(["completed","complete","done","passed","pass","success"]);
    const judgedTeamRuns=teamRuns.filter(x=>{
      const verdict=x.judge_verdict;
      const verdictReady=Boolean(verdict&&typeof verdict==="object"&&!Array.isArray(verdict)&&Object.keys(verdict).length>0);
      return Boolean(x.completed_at)&&teamFinalStatuses.has(clean(x.status).toLowerCase())&&verdictReady;
    });

    const validErrors=validCalibration.map(x=>Number(x.calibration_error)).filter(Number.isFinite);
    return Object.freeze({
      redteam:Object.freeze({
        cases:cases.length,
        runs:runs.length,
        completed_linked:completedLinked.length,
        covered_cases:coveredCases.size,
        unlinked:unlinkedRuns.length,
        pending:pendingRuns.length,
        failed:failedRuns.length,
        ready:cases.length>0&&coveredCases.size===cases.length&&completedLinked.length>0&&failedRuns.length===0&&pendingRuns.length===0&&unlinkedRuns.length===0
      }),
      calibration:Object.freeze({
        rows:calibration.length,
        valid_rows:validCalibration.length,
        invalid_rows:calibration.length-validCalibration.length,
        ready:calibration.length>0&&validCalibration.length===calibration.length,
        max_error:validErrors.length?Math.max(...validErrors):null
      }),
      team_judge:Object.freeze({
        runs:teamRuns.length,
        judged:judgedTeamRuns.length,
        incomplete:teamRuns.length-judgedTeamRuns.length,
        ready:teamRuns.length>0&&judgedTeamRuns.length===teamRuns.length
      })
    });
  }

  function buildLineage(input={}){
    const prompts=safeArray(input.promptVersions);
    const spans=safeArray(input.traceSpans);
    const promptIds=new Set(prompts.map(x=>String(x.id??"")).filter(Boolean));
    const versionedSpans=spans.filter(x=>x.prompt_version_id!==null&&x.prompt_version_id!==undefined);
    const linked=versionedSpans.filter(x=>promptIds.has(String(x.prompt_version_id))).length;
    const orphaned=versionedSpans.length-linked;
    const connected=input.promptStoreConnected===true&&input.traceStoreConnected===true;
    return Object.freeze({
      connected,
      prompt_versions:prompts.length,
      versioned_spans:versionedSpans.length,
      linked_spans:linked,
      orphaned_spans:orphaned,
      ready:connected&&prompts.length>0&&linked>0&&orphaned===0
    });
  }

  function buildKnowledgeRadar(input={}){
    const sources=safeArray(input.f35Sources).filter(x=>x.enabled!==false);
    const findings=safeArray(input.f35Findings);
    const now=Number.isFinite(Number(input.nowMs))?Number(input.nowMs):Date.now();
    const fresh=[],stale=[],never=[];
    for(const source of sources){
      const checked=new Date(source.last_checked_at||0).getTime();
      const freshnessHours=Number(source.freshness_hours||168);
      if(!Number.isFinite(checked)||checked<=0){never.push(source);continue}
      const ageHours=Math.max(0,(now-checked)/36e5);
      if(Number.isFinite(freshnessHours)&&ageHours<=freshnessHours)fresh.push(source);
      else stale.push(source);
    }
    const verified=findings.filter(x=>["verified_official","cross_verified"].includes(clean(x.confidence).toLowerCase()));
    const review=findings.filter(x=>clean(x.action_state).toLowerCase()==="review"||x.requires_owner_review===true);
    const latest=verified
      .slice()
      .sort((a,b)=>new Date(b.observed_at||0)-new Date(a.observed_at||0))
      .slice(0,12);
    return Object.freeze({
      sources:sources.length,
      fresh:fresh.length,
      stale:stale.length,
      never_checked:never.length,
      findings:findings.length,
      verified_findings:verified.length,
      review_queue:review.length,
      latest:Object.freeze(latest),
      ready:sources.length>0&&stale.length===0&&never.length===0
    });
  }

  function build(input={}){
    const traces=buildTraceExplorer(input);
    const failures=buildFailureInbox(input);
    const experiments=buildExperimentDiff(input);
    const review=buildReviewQueue(input);
    const cost=buildCostLatency(input);
    const prompts=buildPromptRegistry(input);
    const alerts=buildAlerts(input);
    const evaluators=buildEvaluatorOps(input);
    const safety=buildSafetyOps(input);
    const lineage=buildLineage(input);
    const radar=buildKnowledgeRadar(input);
    const replayRuns=safeArray(input.replayRuns);
    const release=input.releaseGate||(replayRuns.length?{replay_runs:replayRuns.length,latest:replayRuns[0]}:null);
    const spanRows=safeArray(input.traceSpans);
    const traceHierarchy=Object.freeze({
      store_connected:input.traceStoreConnected===true,
      spans:spanRows.length,
      traces:new Set(spanRows.map(x=>clean(x.trace_id)).filter(Boolean)).size,
      sessions:new Set(spanRows.map(x=>clean(x.session_id)).filter(Boolean)).size
    });

    const capabilities=Object.freeze([
      {id:"traces",label:"Trace Explorer",state:input.traceSchemaConnected===true?"ready":"gap",evidence:traceHierarchy.spans+" nested spans · "+traceHierarchy.traces+" traces · "+traceHierarchy.sessions+" sessions · store="+String(traceHierarchy.store_connected)},
      {id:"prompts",label:"Prompt Registry / Versions",state:prompts.instrumented?"ready":"gap",evidence:prompts.instrumented?prompts.rows.length+" versioned prompts":"No persisted prompt-version registry connected"},
      {id:"datasets",label:"Failure Inbox → Eval Dataset",state:failures.persisted_dataset?"ready":"gap",evidence:failures.dataset_candidates+" dataset candidate(s) · persisted dataset="+String(failures.persisted_dataset)},
      {id:"evaluators",label:"Evaluator Registry + Human Alignment",state:evaluators.governance_ready?"ready":"gap",evidence:evaluators.grader_types.length+" grader type(s) · registry="+String(evaluators.evaluator_registry_connected)+" · alignment="+evaluators.alignment_state+" · missing="+evaluators.missing_alignment},
      {id:"experiments",label:"Experiment Diff",state:experiments.available?"ready":"gap",evidence:experiments.available?experiments.comparisons.length+" comparable metric(s)":"Need 2+ comparable eval runs per metric"},
      {id:"online-ci",label:"Online Evals + CI Quality Gate",state:evaluators.continuous_gate_ready?"ready":evaluators.ci_gate_state==="blocked"?"blocked":evaluators.ci_gate_state==="pending"||evaluators.pending_online_windows>0?"pending":"gap",evidence:"online="+evaluators.completed_online_windows+"/"+evaluators.online_windows+" completed · pending online="+evaluators.pending_online_windows+" · CI="+evaluators.ci_gate_state+" · passed="+evaluators.passed_ci_gates+"/"+evaluators.ci_gates+" · failed="+evaluators.failed_ci_gates+" · pending="+evaluators.pending_ci_gates},
      {id:"redteam",label:"Red Team Regression",state:safety.redteam.ready?"ready":safety.redteam.failed?"blocked":"gap",evidence:safety.redteam.covered_cases+"/"+safety.redteam.cases+" active case(s) covered · completed="+safety.redteam.completed_linked+" · pending="+safety.redteam.pending+" · unlinked="+safety.redteam.unlinked+" · failed="+safety.redteam.failed},
      {id:"calibration",label:"Confidence Calibration",state:safety.calibration.ready?"ready":"gap",evidence:safety.calibration.valid_rows+"/"+safety.calibration.rows+" valid measured row(s) · invalid="+safety.calibration.invalid_rows+" · max error="+String(safety.calibration.max_error??"unmeasured")},
      {id:"team-judge",label:"Multi-Agent Judge Runs",state:safety.team_judge.ready?"ready":"gap",evidence:safety.team_judge.judged+"/"+safety.team_judge.runs+" completed run(s) have non-empty final verdicts · incomplete="+safety.team_judge.incomplete},
      {id:"lineage",label:"Prompt → Trace Lineage",state:lineage.ready?"ready":"gap",evidence:lineage.linked_spans+"/"+lineage.versioned_spans+" versioned spans linked · orphaned="+lineage.orphaned_spans+" · stores="+String(lineage.connected)},
      {id:"f35-radar",label:"F35 Knowledge Freshness",state:radar.ready?"ready":"gap",evidence:radar.fresh+"/"+radar.sources+" source(s) fresh · stale="+radar.stale+" · never="+radar.never_checked+" · findings="+radar.verified_findings},
      {id:"review",label:"Human / Owner Review Queue",state:review.persisted?"ready":"gap",evidence:review.count+" review item(s) · annotation history persisted="+String(review.persisted)},
      {id:"cost",label:"Cost / Latency Budget",state:cost.instrumented?"ready":"gap",evidence:cost.instrumented?cost.sample_count+" measured samples":"Token/cost/latency instrumentation not connected"},
      {id:"alerts",label:"Alerts / SLO Inbox",state:input.alertRulesConnected===true?(alerts.critical?"blocked":alerts.watch?"watch":"ready"):"gap",evidence:alerts.critical+" critical · "+alerts.watch+" watch · threshold/rule history="+String(input.alertRulesConnected===true)},
      {id:"release",label:"Release Replay / Gate",state:release?"ready":"gap",evidence:release?(replayRuns.length?replayRuns.length+" persisted replay run(s)":"Owner gate evidence attached"):"No release/replay snapshot attached"}
    ]);

    return Object.freeze({
      mode:"BOOM_PROFESSIONAL_WORKBENCH",
      capabilities,
      traces,traceHierarchy,failures,experiments,review,cost,prompts,alerts,evaluators,safety,lineage,radar,release,
      professional_ready:capabilities.every(x=>x.state==="ready"||x.state==="empty"),
      gaps:Object.freeze(capabilities.filter(x=>x.state==="gap").map(x=>x.id)),
      pending:Object.freeze(capabilities.filter(x=>x.state==="pending").map(x=>x.id)),
      invariants:Object.freeze({
        mutation:false,
        production_change:false,
        publish:false,
        spend:false,
        payments:false,
        supplier_orders:false,
        owner_gate_required:true
      })
    });
  }

  const api=Object.freeze({build,buildTraceExplorer,buildFailureInbox,buildExperimentDiff,buildReviewQueue,buildCostLatency,buildPromptRegistry,buildAlerts,buildEvaluatorOps,buildSafetyOps,buildLineage,buildKnowledgeRadar,percentile});
  if(typeof window!=="undefined")window.BoomProfessionalWorkbench=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();