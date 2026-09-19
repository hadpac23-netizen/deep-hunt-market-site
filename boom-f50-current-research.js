(() => {
  "use strict";
  const RECEIPT=Object.freeze({
    version:"2026-09-19-f50-current2",
    protocol_token:"F50-DEEP-HUNT-CONTINUE",
    active_mission:"HUNT gap hunt — Promise Mesh formal attack",
    saved_candidate_id:"HUNT_PROMISE_MESH",
    saved_candidate_title:"HUNT Promise Mesh",
    saved_candidate_status:"KILLED_THIS_ROUND_REOPENABLE_WITH_NEW_EVIDENCE",
    mechanism_fingerprint:"f50_0e5bbbb820831132",
    formal_evidence_imported:true,
    prior_art_attack_state:"HOLD",
    patents_verified:6,
    prior_art_surfaces_complete:false,
    economics_state:"HOLD",
    red_team_state:"HOLD",
    research_memory_state:"READY",
    winner_claim_allowed:false,
    current_final_result:"ZERO",
    reopen_requires_new_evidence:true,
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