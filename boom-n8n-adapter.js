(() => {
  "use strict";
  if(window.BoomN8nAdapter?.version)return;
  const version="BOOM-N8N-CLIENT-ADAPTER-V1";
  const status=()=>({
    version,
    mode:"SHADOW",
    authority:"NONE",
    connection:"CODED_NOT_CONNECTED",
    first_allowed_workflow:"shelf_coverage_17x1000"
  });
  async function dispatchShadow(run,payload={}){
    if(!run?.run_id||!run?.workflow_id||!run?.mission_id||!run?.correlation_id){
      throw Object.assign(new Error("MISSING_RUN_IDENTITY"),{code:"MISSING_RUN_IDENTITY"});
    }
    if(run.workflow_id!=="shelf_coverage_17x1000"){
      throw Object.assign(new Error("WORKFLOW_NOT_ALLOWLISTED"),{code:"WORKFLOW_NOT_ALLOWLISTED"});
    }
    const rt=window.BoomRuntime;
    const admin=await rt?.adminReady?.();
    if(!admin?.ok)throw Object.assign(new Error(admin?.reason||"AUTH_REQUIRED"),{code:admin?.reason||"AUTH_REQUIRED"});
    const db=rt?.getSupabaseClient?.();
    if(!db?.functions?.invoke)throw Object.assign(new Error("EDGE_GATEWAY_UNAVAILABLE"),{code:"EDGE_GATEWAY_UNAVAILABLE"});
    const {data,error}=await db.functions.invoke("boom-automation-gateway",{body:{
      workflow_id:run.workflow_id,
      run_id:run.run_id,
      mission_id:run.mission_id,
      correlation_id:run.correlation_id,
      payload
    }});
    if(error)throw error;
    if(data?.ok!==true)throw Object.assign(new Error(data?.error||"N8N_DISPATCH_FAILED"),{code:data?.error||"N8N_DISPATCH_FAILED",detail:data});
    return data;
  }
  window.BoomN8nAdapter={version,status,dispatchShadow};
})();