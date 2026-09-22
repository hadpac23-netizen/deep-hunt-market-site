(() => {
  "use strict";
  if(window.BoomN8nShadowAdapter?.version)return;
  const version="BOOM-N8N-SHADOW-ADAPTER-V1";
  let contract=null;
  let readyPromise=null;

  async function ready(){
    if(readyPromise)return readyPromise;
    readyPromise=fetch("boom-n8n-adapter-contract.json",{cache:"no-store"})
      .then(r=>{if(!r.ok)throw new Error("N8N_ADAPTER_CONTRACT_UNAVAILABLE");return r.json();})
      .then(c=>{contract=c;return {version,mode:c.mode,connected:c.connected,authority:c.authority};});
    return readyPromise;
  }

  function idempotencyKey(run){
    return [run.workflow_id,run.run_id,run.correlation_id].map(String).join(":");
  }

  async function planDispatch(run,{capability="read_verified_catalog_counts",timeoutMs=15000}={}){
    await ready();
    if(!run?.run_id||!run?.workflow_id||!run?.mission_id||!run?.correlation_id){
      return {ok:false,reason:"INVALID_RUN_ENVELOPE"};
    }
    if(contract.connected===true)return {ok:false,reason:"LIVE_TRANSPORT_NOT_IMPLEMENTED"};
    if(contract.mode!=="SHADOW")return {ok:false,reason:"ADAPTER_NOT_SHADOW"};
    if((contract.safety?.blocked_capabilities||[]).includes(capability))return {ok:false,reason:"CAPABILITY_BLOCKED"};
    if(!(contract.safety?.allowed_capabilities||[]).includes(capability))return {ok:false,reason:"CAPABILITY_NOT_ALLOWLISTED"};
    if(!(contract.safety?.allowed_workflows||[]).includes(run.workflow_id))return {ok:false,reason:"WORKFLOW_NOT_ALLOWLISTED"};

    return {
      ok:true,
      dispatch:false,
      reason:"SHADOW_PLAN_ONLY",
      envelope:{
        mission_id:String(run.mission_id),
        workflow_id:String(run.workflow_id),
        run_id:String(run.run_id),
        correlation_id:String(run.correlation_id),
        mode:"SHADOW",
        requested_capability:String(capability),
        idempotency_key:idempotencyKey(run),
        timeout_ms:Math.max(1000,Math.min(Number(timeoutMs)||15000,30000))
      }
    };
  }

  window.BoomN8nShadowAdapter={version,ready,planDispatch};
})();