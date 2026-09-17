const STATES=new Set(["GENERATED_PENDING_INGEST","STORED_PENDING_QA","QA_PASSED","QA_FAILED","OWNER_APPROVED","REJECTED"]);
const NEXT={
  GENERATED_PENDING_INGEST:new Set(["STORED_PENDING_QA","REJECTED"]),
  STORED_PENDING_QA:new Set(["QA_PASSED","QA_FAILED","REJECTED"]),
  QA_PASSED:new Set(["OWNER_APPROVED","REJECTED"]),
  QA_FAILED:new Set(["STORED_PENDING_QA","REJECTED"]),
  OWNER_APPROVED:new Set(["REJECTED"]),
  REJECTED:new Set()
};
export const VAULT_BUCKET="boom-media-vault";
export const MAX_INGEST_BYTES=50*1024*1024;
const clean=v=>String(v??"").trim();
const safe=v=>clean(v).replace(/[^A-Za-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100);
export function storagePath({mission_id,asset_id,ext="mp4"}={}){
  const m=safe(mission_id),a=safe(asset_id),e=safe(ext).toLowerCase();
  if(!m||!a||!["mp4","webm"].includes(e))throw new Error("VAULT_PATH_INVALID");
  return `missions/${m}/${a}.${e}`;
}
export function validateTaskId(v){const id=clean(v);if(!/^[A-Za-z0-9_-]{8,128}$/.test(id))throw new Error("PROVIDER_TASK_ID_INVALID");return id;}
export function previewTTL(v=60){const n=Number(v);if(!Number.isInteger(n)||n<30||n>120)throw new Error("PREVIEW_TTL_INVALID");return n;}
export function ownerDecision(v){const d=clean(v).toLowerCase();if(!["approve","reject"].includes(d))throw new Error("OWNER_DECISION_INVALID");return d;}
export function decisionNote(v=""){const n=clean(v);if(n.length>500)throw new Error("OWNER_DECISION_NOTE_TOO_LONG");return n;}
export function assertTransition(from,to){
  if(!STATES.has(from)||!STATES.has(to))throw new Error("VAULT_STATUS_INVALID");
  if(!NEXT[from]?.has(to))throw new Error(`VAULT_TRANSITION_BLOCKED_${from}_TO_${to}`);
  if(to==="OWNER_APPROVED"&&from!=="QA_PASSED")throw new Error("QA_PASS_REQUIRED_BEFORE_OWNER_APPROVAL");
  return true;
}
export function postGenerationQA(evidence={}){
  const hard={
    stored_private:evidence.stored_private===true,
    aspect_ratio:clean(evidence.aspect_ratio)==="9:16",
    duration_ok:Number(evidence.duration_seconds)>0&&Number(evidence.duration_seconds)<=10,
    product_fidelity:evidence.product_fidelity===true,
    no_unverified_claims:evidence.no_unverified_claims===true,
    no_fake_reviews:evidence.no_fake_reviews===true,
    no_unintended_branding:evidence.no_unintended_branding===true,
    no_major_visual_defects:evidence.no_major_visual_defects===true
  };
  const failed=Object.entries(hard).filter(([,v])=>!v).map(([k])=>k);
  const score=Math.round((Object.values(hard).filter(Boolean).length/Object.keys(hard).length)*100);
  return {status:failed.length?"QA_FAILED":"QA_PASSED",score,hard_gates:hard,failed_gates:failed,publishing_allowed:false,owner_approval_required:true,next_safe_action:failed.length?"Reject or regenerate the asset; do not publish.":"Owner may review the private stored asset. Publishing remains separately gated."};
}
export function planVaultAsset(input={}){
  if(input?.source_verified!==true)throw new Error("PRODUCT_TRUTH_REVERIFY_REQUIRED");
  if(input?.generation_completed!==true)throw new Error("GENERATION_COMPLETION_REQUIRED");
  const mime=clean(input.mime_type);if(!["video/mp4","video/webm"].includes(mime))throw new Error("VAULT_MIME_INVALID");
  const duration=Number(input.duration_seconds);if(!(duration>0&&duration<=10))throw new Error("VAULT_DURATION_INVALID");
  if(clean(input.aspect_ratio)!=="9:16")throw new Error("VAULT_ASPECT_RATIO_INVALID");
  const verifiedAt=clean(input.product_truth_verified_at);if(!verifiedAt||Number.isNaN(Date.parse(verifiedAt)))throw new Error("PRODUCT_TRUTH_TIMESTAMP_REQUIRED");
  if(!clean(input.product_item_id))throw new Error("PRODUCT_ITEM_REQUIRED");
  const ext=mime==="video/webm"?"webm":"mp4";
  return {storage_bucket:VAULT_BUCKET,storage_path:storagePath({mission_id:input.mission_id,asset_id:input.asset_id,ext}),creative_asset_id:safe(input.asset_id),status:"GENERATED_PENDING_INGEST",public_url:null,private_only:true,publishing_allowed:false,owner_approval_required:true,next_safe_action:"Ingest server-side, verify checksum, then move to STORED_PENDING_QA."};
}
export {STATES};
