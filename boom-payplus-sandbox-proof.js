(() => {
  "use strict";
  if(window.BoomPayPlusSandboxProof?.version)return;
  const version="BOOM-PAYPLUS-SANDBOX-STATUS-PROOF-V1";
  const clean=v=>String(v??"").trim();
  const bool=v=>v===true;
  const fingerprint=o=>[
    Number.isInteger(Number(o?.charge_method))?Number(o.charge_method):"",
    clean(o?.provider_status),
    clean(o?.provider_code),
    clean(o?.mapping_state)
  ].join("|");

  function evaluate(input={}){
    const control=input.control||{};
    const sessions=Array.isArray(input.sessions)?input.sessions:[];
    const observations=Array.isArray(input.observations)?input.observations:[];
    const events=Array.isArray(input.events)?input.events:[];
    const verified=observations.filter(o=>o?.environment==="sandbox"&&bool(o.signature_verified)&&bool(o.ipn_full_verified));
    const j4=verified.filter(o=>Number(o.charge_method)===1);
    const refunds=verified.filter(o=>Number(o.charge_method)===4);
    const distinctFingerprints=[...new Set(verified.map(fingerprint).filter(Boolean))];

    const evidence={
      control_enabled:bool(control.enabled),
      control_owner_approved:bool(control.owner_approved),
      sandbox_sessions:sessions.length,
      observations:observations.length,
      verified_observations:verified.length,
      j4_verified_observations:j4.length,
      refund_verified_observations:refunds.length,
      distinct_fingerprints:distinctFingerprints.length,
      accepted_paid_true_rows:observations.filter(o=>o.accepted_paid===true).length
    };

    const checks={
      SIGNED_CALLBACK:verified.length>0,
      J4_SUCCESS:false,
      J4_FAILURE:false,
      DUPLICATE_CALLBACK_IDEMPOTENCY:false,
      REFERENCE_INTEGRITY:input.reference_integrity_proven===true,
      CANCEL_NOT_PAID:input.cancel_not_paid_proven===true,
      REFUND:false
    };

    const approvedFingerprints=input.approved_fingerprints||{};
    for(const o of j4){
      const fp=fingerprint(o);
      const cls=approvedFingerprints[fp];
      if(cls==="PAID_SUCCESS")checks.J4_SUCCESS=true;
      if(cls==="NOT_PAID")checks.J4_FAILURE=true;
    }
    for(const o of refunds){
      const fp=fingerprint(o);
      if(approvedFingerprints[fp]==="REFUND_SUCCESS"&&input.refund_original_transaction_link_proven===true){
        checks.REFUND=true;
      }
    }

    const providerIds=events.map(e=>clean(e.provider_event_id)).filter(Boolean);
    const unique=new Set(providerIds);
    if(input.duplicate_replay_attempted===true&&providerIds.length===unique.size&&input.duplicate_paid_transition_count===0){
      checks.DUPLICATE_CALLBACK_IDEMPOTENCY=true;
    }

    const paidRequired=["SIGNED_CALLBACK","J4_SUCCESS","J4_FAILURE","DUPLICATE_CALLBACK_IDEMPOTENCY","REFERENCE_INTEGRITY"];
    const checkoutRequired=[...paidRequired,"CANCEL_NOT_PAID"];
    const refundRequired=["REFUND"];
    const ready=list=>list.every(k=>checks[k]===true);

    let state="WAITING_SANDBOX_EVIDENCE";
    let blocker="NO_SANDBOX_OBSERVATIONS";
    if(!bool(control.enabled)||!bool(control.owner_approved)){
      state="BLOCKED_SANDBOX_CONTROL_OFF"; blocker="SANDBOX_EVIDENCE_CONTROL_OFF";
    }else if(!sessions.length){
      state="WAITING_SANDBOX_SESSION"; blocker="NO_SANDBOX_SESSION";
    }else if(!verified.length){
      state="WAITING_SIGNED_CALLBACK"; blocker="NO_SIGNED_IPN_OBSERVATION";
    }else if(!ready(paidRequired)){
      state="WAITING_PAID_MAPPING_PROOF"; blocker=paidRequired.find(k=>!checks[k])||"PAID_PROOF_INCOMPLETE";
    }else{
      state="PAID_ACCEPTANCE_PROOF_READY"; blocker=null;
    }

    return {
      version,mode:"SHADOW",state,blocker,evidence,checks,
      paid_acceptance_ready:ready(paidRequired),
      checkout_launch_ready:ready(checkoutRequired),
      refund_launch_ready:ready(refundRequired),
      material_action_authorized:false
    };
  }

  window.BoomPayPlusSandboxProof={version,evaluate,fingerprint};
})();