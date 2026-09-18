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
      ...safeArray(input.evals).map(x=>({kind:"eval",id:x.id,title:x.metric_name||x.eval_key||"Eval",status:x.passed===true?"pass":x.passed===false?"fail":"open",time:x.created_at,actor:x.subject_key||x.subject_type||"eval"}))
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
        baseline_pass:baseline.passed
      });
    }
    return Object.freeze({
      available:comparisons.length>0,
      comparisons:Object.freeze(comparisons.slice(0,20))
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
    return Object.freeze({
      alerts:Object.freeze(alerts.slice(0,60)),
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
    const release=input.releaseGate||null;

    const capabilities=Object.freeze([
      {id:"traces",label:"Trace Explorer",state:traces.rows.length?"ready":"empty",evidence:traces.rows.length+" trace rows · "+traces.failures+" failures"},
      {id:"prompts",label:"Prompt Registry / Versions",state:prompts.instrumented?"ready":"gap",evidence:prompts.instrumented?prompts.rows.length+" versioned prompts":"No persisted prompt-version registry connected"},
      {id:"datasets",label:"Failure Inbox → Eval Dataset",state:failures.persisted_dataset?"ready":"gap",evidence:failures.dataset_candidates+" dataset candidate(s) · persisted dataset="+String(failures.persisted_dataset)},
      {id:"experiments",label:"Experiment Diff",state:experiments.available?"ready":"gap",evidence:experiments.available?experiments.comparisons.length+" comparable metric(s)":"Need 2+ comparable eval runs per metric"},
      {id:"review",label:"Human / Owner Review Queue",state:review.persisted?"ready":"gap",evidence:review.count+" review item(s) · annotation history persisted="+String(review.persisted)},
      {id:"cost",label:"Cost / Latency Budget",state:cost.instrumented?"ready":"gap",evidence:cost.instrumented?cost.sample_count+" measured samples":"Token/cost/latency instrumentation not connected"},
      {id:"alerts",label:"Alerts / SLO Inbox",state:alerts.critical?"blocked":alerts.watch?"watch":"ready",evidence:alerts.critical+" critical · "+alerts.watch+" watch"},
      {id:"release",label:"Release Replay / Gate",state:release?"ready":"gap",evidence:release?"Owner gate evidence attached":"No release-gate snapshot attached"}
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