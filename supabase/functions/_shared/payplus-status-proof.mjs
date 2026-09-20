export const PAYPLUS_STATUS_PROOF=Object.freeze({
  version:"PAYPLUS-STATUS-PROOF-V1",
  state:"HOLD",
  owner_approved:false,
  approved_success:null,
  approved_reject:null,
  rule:"Exact fingerprint match only. Sandbox evidence must be captured before owner approval."
});
const scalar=v=>v===null||v===undefined?null:String(v);
export function normalizeFingerprint(value={}){
  return Object.freeze({
    charge_method:value?.charge_method===null||value?.charge_method===undefined?null:Number(value.charge_method),
    status:scalar(value?.status),
    code:scalar(value?.code)
  });
}
export function fingerprintKey(value={}){
  const f=normalizeFingerprint(value);
  return JSON.stringify([f.charge_method,f.status,f.code]);
}
export function resolveApprovedStatus(value={},proof=PAYPLUS_STATUS_PROOF){
  if(proof?.owner_approved!==true||proof?.state!=="READY")return null;
  const key=fingerprintKey(value);
  if(proof.approved_success&&key===fingerprintKey(proof.approved_success))return "paid";
  if(proof.approved_reject&&key===fingerprintKey(proof.approved_reject))return "failed";
  return null;
}
export function proofReadiness({success_observation,reject_observation,proof=PAYPLUS_STATUS_PROOF}={}){
  const captured=Boolean(success_observation&&reject_observation);
  const approved=proof?.owner_approved===true&&proof?.state==="READY"&&proof?.approved_success&&proof?.approved_reject;
  return Object.freeze({
    state:approved&&captured?"READY":captured?"REVIEW":"HOLD",
    sandbox_capture_complete:captured,
    owner_approved:Boolean(approved),
    paid_write_allowed:Boolean(approved&&captured)
  });
}