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
      ...safeArray(input.modelObservations).map(x=>({kind:"model",id:x.id,title:(x.provider||"model")+"/"+(x.model||"unknown"),status:x.success===true?"pass":x.success===false?"fail":"open",time:x.created_at,actor:x.route_key||x.task_class||"model"}))
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
    return Object.freeze({
      instrumented:rows.length>0,
      rows:Object.freeze(rows),
      status:rows.length?"VERSIONED":"REGISTRY_REQUIRED"
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

  function build(input={}){
    const traces=buildTraceExplorer(input);
    const failures=buildFailureInbox(input);
    const experiments=buildExperimentDiff(input);
    const review=buildReviewQueue(input);
    const cost=buildCostLatency(input);
    const prompts=buildPromptRegistry(input);
    const alerts=buildAlerts(input);
    const replayRuns=safeArray(input.replayRuns);
    const release=input.releaseGate||(replayRuns.length?{replay_runs:replayRuns.length,latest:replayRuns[0]}:null);

    const capabilities=Object.freeze([
      {id:"traces",label:"Trace Explorer",state:input.traceSchemaConnected===true?"ready":"gap",evidence:traces.rows.length+" activity rows · nested trace/span/session schema="+String(input.traceSchemaConnected===true)},
      {id:"prompts",label:"Prompt Registry / Versions",state:prompts.instrumented?"ready":"gap",evidence:prompts.instrumented?prompts.rows.length+" versioned prompts":"No persisted prompt-version registry connected"},
      {id:"datasets",label:"Failure Inbox → Eval Dataset",state:failures.persisted_dataset?"ready":"gap",evidence:failures.dataset_candidates+" dataset candidate(s) · persisted dataset="+String(failures.persisted_dataset)},
      {id:"experiments",label:"Experiment Diff",state:experiments.available?"ready":"gap",evidence:experiments.available?experiments.comparisons.length+" comparable metric(s)":"Need 2+ comparable eval runs per metric"},
      {id:"review",label:"Human / Owner Review Queue",state:review.persisted?"ready":"gap",evidence:review.count+" review item(s) · annotation history persisted="+String(review.persisted)},
      {id:"cost",label:"Cost / Latency Budget",state:cost.instrumented?"ready":"gap",evidence:cost.instrumented?cost.sample_count+" measured samples":"Token/cost/latency instrumentation not connected"},
      {id:"alerts",label:"Alerts / SLO Inbox",state:input.alertRulesConnected===true?(alerts.critical?"blocked":alerts.watch?"watch":"ready"):"gap",evidence:alerts.critical+" critical · "+alerts.watch+" watch · threshold/rule history="+String(input.alertRulesConnected===true)},
      {id:"release",label:"Release Replay / Gate",state:release?"ready":"gap",evidence:release?(replayRuns.length?replayRuns.length+" persisted replay run(s)":"Owner gate evidence attached"):"No release/replay snapshot attached"}
    ]);

    return Object.freeze({
      mode:"BOOM_PROFESSIONAL_WORKBENCH",
      capabilities,
      traces,failures,experiments,review,cost,prompts,alerts,release,
      professional_ready:capabilities.every(x=>x.state==="ready"||x.state==="empty"),
      gaps:Object.freeze(capabilities.filter(x=>x.state==="gap").map(x=>x.id)),
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

  const api=Object.freeze({build,buildTraceExplorer,buildFailureInbox,buildExperimentDiff,buildReviewQueue,buildCostLatency,buildPromptRegistry,buildAlerts,percentile});
  if(typeof window!=="undefined")window.BoomProfessionalWorkbench=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();