(() => {
  "use strict";
  const local=["127.0.0.1","localhost"].includes(location.hostname);
  if(!local)return;

  const runtime=window.BoomRuntime;
  const host=document.getElementById("hd-local-sandbox-qa");
  const button=document.getElementById("hd-local-sandbox-run");
  const status=document.getElementById("hd-local-sandbox-status");
  if(!runtime||!host||!button||!status)return;

  const client=runtime.getSupabaseClient?.();
  if(!client)return;

  let verified=null;
  const setStatus=(message,tone="")=>{
    status.textContent=message||"";
    status.dataset.tone=tone;
  };

  async function boot(){
    const gate=await runtime.adminReady?.();
    if(gate?.ok!==true)return;
    host.hidden=false;
    setStatus("Verify checkout first. Sandbox only — no real charge.");
  }

  window.addEventListener("hunt:checkout-verified",event=>{
    const d=event?.detail||{};
    const ready=Boolean(
      d.payment_session_id &&
      d.idempotency_key &&
      d.commerce_status==="PASS" &&
      d.commerce_checked_at
    );
    verified=ready?{
      payment_session_id:String(d.payment_session_id),
      idempotency_key:String(d.idempotency_key)
    }:null;
    button.disabled=!ready;
    setStatus(ready
      ?"Checkout verified. Ready for dry-run, then CJ sandbox."
      :"Checkout verification is missing Commerce Truth evidence.",
      ready?"ok":"error");
  });

  async function invoke(run_mode){
    const {data,error}=await client.functions.invoke("hunt-order-orchestrator",{
      body:{
        payment_session_id:verified.payment_session_id,
        idempotency_key:verified.idempotency_key,
        run_mode
      }
    });
    if(error||data?.ok!==true){
      const message=data?.error||error?.message||"ORDER_PIPELINE_FAILED";
      const blockers=Array.isArray(data?.blockers)&&data.blockers.length
        ?" · "+data.blockers.join(", ")
        :"";
      throw new Error(String(message)+blockers);
    }
    return data;
  }

  button.addEventListener("click",async()=>{
    if(!verified)return;
    button.disabled=true;
    setStatus("Running dry-run…");
    try{
      const dry=await invoke("dry_run");
      if(dry?.ready_for_supplier_sandbox!==true){
        const blockers=Array.isArray(dry?.blockers)&&dry.blockers.length
          ?dry.blockers.join(", ")
          :"unknown blocker";
        setStatus("Dry-run HOLD: "+blockers,"error");
        return;
      }
      setStatus("Dry-run PASS. Running CJ sandbox — no real charge…","ok");
      const sandbox=await invoke("sandbox");
      const first=Array.isArray(sandbox?.supplier_groups)?sandbox.supplier_groups[0]:null;
      const supplierId=String(first?.supplier_order_id||"");
      const tracking=String(first?.tracking_number||"");
      setStatus(
        "CJ sandbox PASS"
        +(supplierId?" · supplier order "+supplierId:"")
        +(tracking?" · tracking "+tracking:""),
        "ok"
      );
      button.textContent="CJ sandbox PASS";
    }catch(error){
      setStatus("Sandbox test stopped: "+String(error?.message||"unknown error"),"error");
      button.disabled=false;
    }
  });

  boot();
})();
