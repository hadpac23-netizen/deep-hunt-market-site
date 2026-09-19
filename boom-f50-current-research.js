(() => {
  "use strict";
  const RECEIPT=Object.freeze({
    version:"2026-09-19-f50-current1",
    protocol_token:"F50-DEEP-HUNT-CONTINUE",
    active_mission:"HUNT gap hunt",
    saved_candidate_id:"HUNT_PROMISE_MESH",
    saved_candidate_title:"HUNT Promise Mesh",
    saved_candidate_status:"PROVISIONAL_KEEP_PENDING_FORMAL_EVIDENCE",
    formal_evidence_imported:false,
    winner_claim_allowed:false,
    current_final_result:"UNRESOLVED",
    payments_live:false,
    paid_spend:false,
    external_publish:false,
    execute_actions:false,
    owner_gate:"REVIEW_REQUIRED"
  });
  const api=Object.freeze({RECEIPT});
  if(typeof window!=="undefined")window.BoomF50CurrentResearch=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();