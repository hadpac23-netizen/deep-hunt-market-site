(() => {
  "use strict";

  const STATUS_WEIGHT={healthy:0,watch:35,blocked:75,critical:100};
  const ACTION_WEIGHT={OBSERVE:0,PROPOSE:5,SAFE_DYNAMIC:8,STAGE_FIX:15,OWNER_APPROVAL:20,BLOCK:30};
  const IMPACT_WEIGHT={low:5,medium:15,high:30,critical:45};
  const safeArray=value=>Array.isArray(value)?value:(value==null?[]:[value]);
  const text=value=>String(value??"").trim();
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));

  function hasEvidence(report={}){
    const evidence=safeArray(report.evidence).filter(Boolean);
    const metrics=report.metrics&&typeof report.metrics==="object"?Object.keys(report.metrics):[];
    return evidence.length>0||metrics.length>0;
  }

  function normalizeReport(report={}){
    const out={...report};
    out.manager_id=text(out.manager_id);
    out.timestamp=text(out.timestamp)||new Date(0).toISOString();
    out.scope=safeArray(out.scope).map(text).filter(Boolean);
    out.status=["healthy","watch","blocked","critical"].includes(text(out.status).toLowerCase())
      ? text(out.status).toLowerCase():"watch";
    out.evidence=safeArray(out.evidence).filter(Boolean);
    out.metrics=out.metrics&&typeof out.metrics==="object"?out.metrics:{};
    out.issues=safeArray(out.issues).filter(Boolean);
    out.recommended_action=text(out.recommended_action);
    out.action_class=text(out.action_class).toUpperCase()||"PROPOSE";
    out.owner_approval_required=out.owner_approval_required===true;
    out.confidence=clamp(Number(out.confidence),0,1);
    out.expected_impact=text(out.expected_impact).toLowerCase()||"medium";
    out.risk_if_ignored=text(out.risk_if_ignored);
    out.recheck_at=text(out.recheck_at);
    out.fallback=text(out.fallback);
    out.entity_key=text(out.entity_key);
    out.opportunity=text(out.opportunity);
    out._warnings=[];

    if(out.status==="healthy"&&!hasEvidence(out)){
      out.status="watch";
      out._warnings.push("healthy claim downgraded: no evidence");
      out.issues=[...out.issues,"Evidence missing for healthy claim"];
    }
    if(["blocked","critical"].includes(out.status)&&!out.issues.length){
      out._warnings.push("blocking report has no explicit issue");
    }
    if(!out.manager_id)out._warnings.push("manager_id missing");
    if(!out.scope.length)out._warnings.push("scope missing");
    if(!out.recommended_action&&out.status!=="healthy")out._warnings.push("recommended_action missing");
    return out;
  }

  function validateReport(report={},registry=null){
    const row=normalizeReport(report);
    const errors=[];
    if(!row.manager_id)errors.push("manager_id required");
    if(!row.scope.length)errors.push("scope required");
    if(!["OBSERVE","PROPOSE","SAFE_DYNAMIC","STAGE_FIX","OWNER_APPROVAL","BLOCK"].includes(row.action_class)){
      errors.push("invalid action_class");
    }
    if(registry){
      const known=[...(registry.managers||[]),...(registry.departments||[])].some(x=>x.id===row.manager_id);
      if(!known)errors.push("unknown manager_id");
    }
    return {ok:errors.length===0,errors,report:row};
  }

  function reportScore(report={}){
    const row=normalizeReport(report);
    const status=STATUS_WEIGHT[row.status]??35;
    const action=ACTION_WEIGHT[row.action_class]??5;
    const impact=IMPACT_WEIGHT[row.expected_impact]??15;
    const confidence=Math.round(row.confidence*20);
    const evidence=hasEvidence(row)?10:-10;
    const approval=row.owner_approval_required?5:0;
    return Math.max(0,status+action+impact+confidence+evidence+approval);
  }

  function overlap(a=[],b=[]){
    const A=new Set(safeArray(a).map(text));
    return safeArray(b).some(x=>A.has(text(x)));
  }

  function detectConflicts(reports=[]){
    const rows=reports.map(normalizeReport);
    const conflicts=[];
    for(let i=0;i<rows.length;i++){
      for(let j=i+1;j<rows.length;j++){
        const a=rows[i],b=rows[j];
        const sameEntity=a.entity_key&&b.entity_key&&a.entity_key===b.entity_key;
        if(!sameEntity&&!overlap(a.scope,b.scope))continue;
        const oneHealthy=a.status==="healthy"||b.status==="healthy";
        const oneBad=["blocked","critical"].includes(a.status)||["blocked","critical"].includes(b.status);
        if(oneHealthy&&oneBad){
          conflicts.push({
            type:"STATUS_CONFLICT",
            entity_key:a.entity_key||b.entity_key||null,
            managers:[a.manager_id,b.manager_id],
            scopes:[...new Set([...a.scope,...b.scope])],
            resolution:"Use the more restrictive state until evidence is reconciled."
          });
        }
      }
    }
    return conflicts;
  }

  function managerAllows(registry,managerId,actionClass){
    const all=[...(registry?.managers||[]),...(registry?.departments||[])];
    const manager=all.find(x=>x.id===managerId);
    if(!manager)return false;
    return safeArray(manager.can_auto).includes(actionClass);
  }

  function canAutoExecute(report={},registry=null){
    const row=normalizeReport(report);
    if(row.owner_approval_required)return false;
    if(!["SAFE_DYNAMIC","BLOCK"].includes(row.action_class))return false;
    if(!registry)return row.action_class==="SAFE_DYNAMIC";
    return managerAllows(registry,row.manager_id,row.action_class);
  }

  function buildExecutivePlan(reports=[],registry=null){
    const validated=safeArray(reports).map(r=>validateReport(r,registry));
    const invalid=validated.filter(x=>!x.ok);
    const rows=validated.filter(x=>x.ok).map(x=>x.report)
      .sort((a,b)=>reportScore(b)-reportScore(a));

    const conflicts=detectConflicts(rows);
    const critical=rows.filter(r=>r.status==="critical");
    const blocked=rows.filter(r=>r.status==="blocked");
    const ownerApprovals=rows.filter(r=>r.owner_approval_required||r.action_class==="OWNER_APPROVAL");
    const safeDynamic=rows.filter(r=>canAutoExecute(r,registry));
    const stagedFixes=rows.filter(r=>r.action_class==="STAGE_FIX");
    const proposals=rows.filter(r=>["PROPOSE","OBSERVE"].includes(r.action_class)&&r.status!=="healthy");
    const healthy=rows.filter(r=>r.status==="healthy");

    const top=rows[0]||null;
    const summary={
      report_count:rows.length,
      invalid_count:invalid.length,
      critical_count:critical.length,
      blocked_count:blocked.length,
      conflict_count:conflicts.length,
      owner_approval_count:ownerApprovals.length,
      safe_dynamic_count:safeDynamic.length,
      staged_fix_count:stagedFixes.length,
      healthy_count:healthy.length,
      executive_status:critical.length?"critical":blocked.length?"blocked":rows.some(r=>r.status==="watch")?"watch":"healthy"
    };

    return Object.freeze({
      summary:Object.freeze(summary),
      priority_queue:Object.freeze(rows.map(r=>Object.freeze({...r,boom_priority_score:reportScore(r)}))),
      critical:Object.freeze(critical),
      blocked:Object.freeze(blocked),
      owner_approvals:Object.freeze(ownerApprovals),
      safe_dynamic:Object.freeze(safeDynamic),
      staged_fixes:Object.freeze(stagedFixes),
      proposals:Object.freeze(proposals),
      conflicts:Object.freeze(conflicts),
      invalid:Object.freeze(invalid),
      top_priority:top?Object.freeze({...top,boom_priority_score:reportScore(top)}):null
    });
  }

  const api=Object.freeze({
    normalizeReport,
    validateReport,
    reportScore,
    detectConflicts,
    canAutoExecute,
    buildExecutivePlan
  });

  if(typeof window!=="undefined")window.BoomExecutiveCore=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();