const PROVIDERS={
  "runway-gen45":{adapter:"runway",capability:"image_to_video",secret_env:"RUNWAY_API_KEY"},
  "veo-3.1":{adapter:"google-veo",capability:"image_to_video",secret_env:"GOOGLE_AI_API_KEY"}
};

const clean=v=>String(v??"").trim();
const finite=(v,min,max)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max;

function httpsUrl(value){
  const raw=clean(value);
  if(!raw)return null;
  try{const u=new URL(raw);return u.protocol==="https:"?u.toString():null}catch{return null}
}

function validateShot(raw,index){
  const provider=clean(raw?.primary_provider);
  if(!PROVIDERS[provider])throw new Error(`SHOT_${index+1}_PROVIDER_UNSUPPORTED`);
  const fallback=clean(raw?.fallback_provider);
  if(fallback&&!PROVIDERS[fallback])throw new Error(`SHOT_${index+1}_FALLBACK_UNSUPPORTED`);
  const duration=Number(raw?.duration_seconds);
  if(!finite(duration,1,10))throw new Error(`SHOT_${index+1}_DURATION_INVALID`);
  if(clean(raw?.aspect_ratio)!=="9:16")throw new Error(`SHOT_${index+1}_ASPECT_RATIO_INVALID`);
  const mode=clean(raw?.mode);
  if(!["image-to-video","text-to-video"].includes(mode))throw new Error(`SHOT_${index+1}_MODE_INVALID`);
  const prompt=clean(raw?.prompt);
  if(!prompt||prompt.length>2400)throw new Error(`SHOT_${index+1}_PROMPT_INVALID`);
  const reference=httpsUrl(raw?.reference_image_url);
  if(mode==="image-to-video"&&!reference)throw new Error(`SHOT_${index+1}_REFERENCE_REQUIRED`);
  return {
    id:clean(raw?.id)||`shot-${index+1}`,
    primary_provider:provider,
    fallback_provider:fallback||null,
    duration_seconds:duration,
    aspect_ratio:"9:16",
    mode,
    prompt,
    reference_image_url:reference
  };
}

export function buildDryRunPlan(input={}){
  if(clean(input?.mode)!=="dry_run")throw new Error("DRY_RUN_ONLY");
  const truth=input?.product_truth||{};
  if(truth?.source_verified!==true)throw new Error("PRODUCT_TRUTH_REVERIFY_REQUIRED");
  const route=input?.route_plan||{};
  if(route?.execution_allowed!==false)throw new Error("ROUTE_MUST_BE_NON_EXECUTABLE");
  const shots=Array.isArray(route?.shots)?route.shots:[];
  if(!shots.length||shots.length>50)throw new Error("SHOT_COUNT_INVALID");
  const checked=shots.map(validateShot);
  return {
    status:"DRY_RUN",
    execution_allowed:false,
    provider_calls_made:0,
    spend_authorized:false,
    publishing_authorized:false,
    owner_approval_required:true,
    product_truth:{
      provider:clean(truth?.provider),item_id:clean(truth?.item_id),variant_id:clean(truth?.variant_id),
      country_code:clean(truth?.country_code).toUpperCase(),verified_at:clean(truth?.verification?.verified_at||truth?.verified_at)
    },
    dispatches:checked.map((shot,index)=>({
      sequence:index+1,
      shot_id:shot.id,
      provider:shot.primary_provider,
      fallback_provider:shot.fallback_provider,
      adapter:PROVIDERS[shot.primary_provider].adapter,
      operation:shot.mode,
      request_preview:{
        duration_seconds:shot.duration_seconds,
        aspect_ratio:shot.aspect_ratio,
        prompt:shot.prompt,
        reference_image_url:shot.reference_image_url
      },
      secret_required:PROVIDERS[shot.primary_provider].secret_env,
      secret_present_in_response:false,
      cost_estimate:null,
      cost_status:"PROVIDER_PRICING_ADAPTER_NOT_CONNECTED",
      execution_status:"BLOCKED_DRY_RUN"
    })),
    blockers:["OWNER_APPROVAL_REQUIRED","PROVIDER_CONNECTOR_NOT_CONNECTED","DRY_RUN_ONLY"],
    next_safe_action:"Review dispatch previews. Provider connection and any paid generation require explicit Owner approval."
  };
}
