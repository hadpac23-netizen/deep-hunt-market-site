(() => {
  "use strict";
  function engine(){
    if(typeof module!=="undefined"&&module.exports)return require("./boom-evidence-confidence.js");
    return window.BoomEvidenceConfidence;
  }
  function evaluateRow(row={},nowMs=Date.now()){
    const E=engine();
    const evalOne=(type,observed_at)=>E?.evaluate
      ? E.evaluate({type,observed_at,base_confidence:1},nowMs)
      : {type,state:"UNKNOWN",confidence:0,recheck_required:true,automatic_change:false};
    return {
      partner_name:String(row.partner_name||""),
      partner_type:String(row.partner_type||""),
      lane:String(row.lane||""),
      integration_status:String(row.integration_status||""),
      owner_approval_required:row.owner_approval_required!==false,
      terms:evalOne("supplier_terms",row.terms_verified_at),
      commercial_rights:evalOne("commercial_rights",row.media_rights_verified_at),
      order_api_verified_at:row.order_api_verified_at||null,
      tracking_verified_at:row.tracking_verified_at||null
    };
  }
  async function load(client){
    if(!client?.from)throw new Error("PARTNER_EVIDENCE_CLIENT_REQUIRED");
    const {data,error}=await client.from("hunt_partner_matrix")
      .select("partner_name,partner_type,lane,integration_status,terms_verified_at,media_rights_verified_at,order_api_verified_at,tracking_verified_at,owner_approval_required")
      .order("partner_name",{ascending:true});
    if(error)throw error;
    return (data||[]).map(row=>evaluateRow(row));
  }
  const api={version:"BOOM-PARTNER-EVIDENCE-V1",evaluateRow,load};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else window.BoomPartnerEvidence=api;
})();