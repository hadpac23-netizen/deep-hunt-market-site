export const RUNWAY_API_VERSION="2024-11-06";
export const RUNWAY_CREATE_URL="https://api.dev.runwayml.com/v1/image_to_video";
export const RUNWAY_TASK_URL="https://api.dev.runwayml.com/v1/tasks/";
export const RUNWAY_MODEL="gen4.5";
export const RUNWAY_CREDITS_PER_SECOND=12;

const clean=v=>String(v??"").trim();
const httpsUrl=value=>{try{const u=new URL(clean(value));return u.protocol==="https:"?u.toString():null}catch{return null}};

export function buildRunwayCreate(dispatch,{enabled=false,ownerApproved=false,secretPresent=false}={}){
  if(clean(dispatch?.provider)!=="runway-gen45")throw new Error("RUNWAY_PROVIDER_REQUIRED");
  if(clean(dispatch?.operation)!=="image-to-video")throw new Error("RUNWAY_IMAGE_TO_VIDEO_ONLY");
  const req=dispatch?.request_preview||{};
  const duration=Number(req.duration_seconds);
  if(!Number.isFinite(duration)||duration<2||duration>10)throw new Error("RUNWAY_DURATION_2_TO_10_REQUIRED");
  if(clean(req.aspect_ratio)!=="9:16")throw new Error("RUNWAY_PORTRAIT_9_16_REQUIRED");
  const prompt=clean(req.prompt); if(!prompt||prompt.length>2400)throw new Error("RUNWAY_PROMPT_INVALID");
  const image=httpsUrl(req.reference_image_url); if(!image)throw new Error("RUNWAY_HTTPS_REFERENCE_REQUIRED");
  const body={model:RUNWAY_MODEL,promptImage:image,promptText:prompt,ratio:"720:1280",duration};
  const blockers=[];
  if(!enabled)blockers.push("RUNWAY_CONNECTOR_DISABLED");
  if(!ownerApproved)blockers.push("OWNER_APPROVAL_REQUIRED");
  if(!secretPresent)blockers.push("RUNWAY_SECRET_REQUIRED");
  return {status:blockers.length?"BLOCKED":"READY",can_execute:blockers.length===0,blockers,endpoint:RUNWAY_CREATE_URL,api_version:RUNWAY_API_VERSION,body,estimated_credits:duration*RUNWAY_CREDITS_PER_SECOND,secret_name:"RUNWAYML_API_SECRET",secret_present_in_response:false};
}

export function validateTaskId(id){
  const value=clean(id);
  if(!/^[A-Za-z0-9-]{8,80}$/.test(value))throw new Error("RUNWAY_TASK_ID_INVALID");
  return value;
}
