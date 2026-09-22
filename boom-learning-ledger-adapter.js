(() => {
  "use strict";
  if(window.BoomLearningLedger?.version)return;
  const version="BOOM-LEARNING-LEDGER-V1";
  function sanitize(value,depth=0){
    if(depth>4)return null;
    if(value===null)return null;
    if(["string","number","boolean"].includes(typeof value))return value;
    if(Array.isArray(value))return value.slice(0,50).map(v=>sanitize(v,depth+1));
    if(typeof value==="object"){
      const out={};
      for(const [k,v] of Object.entries(value)){
        if(/token|secret|password|credential|email|phone|address|payment/i.test(k))continue;
        out[k]=sanitize(v,depth+1);
      }
      return out;
    }
    return null;
  }
  async function db(){
    const rt=window.BoomRuntime;
    const ready=await rt?.adminReady?.();
    if(!ready?.ok)throw Object.assign(new Error(ready?.reason||"AUTH_REQUIRED"),{code:ready?.reason||"AUTH_REQUIRED"});
    const client=rt?.getSupabaseClient?.();
    if(!client)throw Object.assign(new Error("LEARNING_DB_UNAVAILABLE"),{code:"LEARNING_DB_UNAVAILABLE"});
    return client;
  }
  function safeText(value,max=2000){return String(value??"").trim().slice(0,max);}
  async function propose(run,proposal={}){
    if(String(run?.workflow_id||"")!=="analytics_learning_loop")throw Object.assign(new Error("LEARNING_WORKFLOW_REQUIRED"),{code:"LEARNING_WORKFLOW_REQUIRED"});
    if(!run?.run_id||!run?.correlation_id)throw Object.assign(new Error("RUN_IDENTITY_REQUIRED"),{code:"RUN_IDENTITY_REQUIRED"});
    const title=safeText(proposal.title,300), principle=safeText(proposal.principle,3000), application=safeText(proposal.hunt_application,3000);
    if(!title||!principle||!application)throw Object.assign(new Error("LEARNING_FIELDS_REQUIRED"),{code:"LEARNING_FIELDS_REQUIRED"});
    const confidence=Math.max(0,Math.min(1,Number(proposal.confidence??0.5)));
    const learningKey=safeText(proposal.learning_key||("automation:"+run.workflow_id+":"+run.run_id),500);
    const row={
      learning_key:learningKey,
      domain:safeText(proposal.domain||"automation",160),
      title,
      source_name:safeText(proposal.source_name||"BOOM Automation Evidence",300),
      source_url:proposal.source_url?safeText(proposal.source_url,1000):null,
      principle,
      hunt_application:application,
      proposed_experiment:proposal.proposed_experiment?safeText(proposal.proposed_experiment,3000):null,
      eval_required:true,
      status:"testing",
      confidence,
      metadata:sanitize({
        mission_id:run.mission_id,
        workflow_id:run.workflow_id,
        run_id:run.run_id,
        correlation_id:run.correlation_id,
        evidence_quality_pass:true,
        provenance_verified:true,
        baseline_available:true,
        proposal_metadata:proposal.metadata||{}
      }),
      behavior_rule:null,
      graduation_eval_key:null,
      graduation_evidence:[]
    };
    const client=await db();
    const {data,error}=await client.from("hunt_boom_learning_items").upsert(row,{onConflict:"learning_key"})
      .select("id,learning_key,status,confidence,eval_required").maybeSingle();
    if(error)throw error;
    return data||row;
  }
  window.BoomLearningLedger={version,sanitize,propose};
})();