import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const yes=(v:unknown)=>clean(v).toLowerCase()==="true";

const REQUIRED_APPROVALS=Object.freeze([
  "HUNT_1688_OFFICIAL_API_CONTRACT_VERIFIED",
  "HUNT_1688_DATA_RESIDENCY_APPROVED",
  "HUNT_1688_IMAGE_DISPLAY_RIGHTS_APPROVED"
]);

function gateSnapshot(){
  const officialApiContractVerified=yes(Deno.env.get("HUNT_1688_OFFICIAL_API_CONTRACT_VERIFIED"));
  const dataResidencyApproved=yes(Deno.env.get("HUNT_1688_DATA_RESIDENCY_APPROVED"));
  const imageDisplayRightsApproved=yes(Deno.env.get("HUNT_1688_IMAGE_DISPLAY_RIGHTS_APPROVED"));
  const imageModificationRightsApproved=yes(Deno.env.get("HUNT_1688_IMAGE_MODIFICATION_RIGHTS_APPROVED"));
  const shadowEnabled=yes(Deno.env.get("HUNT_1688_SHADOW_ENABLED"));
  const appKeyPresent=Boolean(clean(Deno.env.get("HUNT_1688_APP_KEY")));
  const appSecretPresent=Boolean(clean(Deno.env.get("HUNT_1688_APP_SECRET")));

  return {
    official_api_contract_verified:officialApiContractVerified,
    data_residency_approved:dataResidencyApproved,
    image_display_rights_approved:imageDisplayRightsApproved,
    image_modification_rights_approved:imageModificationRightsApproved,
    shadow_enabled:shadowEnabled,
    credentials_present:appKeyPresent&&appSecretPresent,
    ready_for_official_readonly_implementation:Boolean(
      officialApiContractVerified&&dataResidencyApproved&&imageDisplayRightsApproved&&shadowEnabled&&appKeyPresent&&appSecretPresent
    )
  };
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return reply({error:"POST required"},405);

  const internalToken=clean(Deno.env.get("HUNT_1688_INTERNAL_TOKEN"));
  if(!internalToken||req.headers.get("x-hunt-internal-token")!==internalToken){
    return reply({error:"unauthorized"},401);
  }

  const gates=gateSnapshot();
  const body=await req.json().catch(()=>({}));
  const action=clean(body?.action)||"status";

  const base={
    ok:false,
    provider:"1688",
    mode:"READ_ONLY_SHADOW",
    action,
    gates,
    required_approvals:REQUIRED_APPROVALS,
    payment:"OFF",
    supplier_live_order:"OFF",
    supplier_order_submission_allowed:false,
    production_catalog_write:false,
    public_storefront_exposure:false,
    auto_publish:false,
    credentials_logged:false
  };

  if(action==="status"){
    return reply({...base,ok:true,status:gates.ready_for_official_readonly_implementation?"READY_TO_IMPLEMENT_OFFICIAL_CONTRACT":"BLOCKED_AWAITING_OFFICIAL_APPROVALS"},200);
  }

  // Fail closed until 1688 supplies and HUNT verifies the official endpoint/auth contract.
  // Do not guess endpoint paths, request signing, OAuth scopes, fields or rate-limit behavior.
  if(!gates.official_api_contract_verified){
    return reply({...base,error:"AWAITING_OFFICIAL_1688_API_CONTRACT"},503);
  }
  if(!gates.data_residency_approved){
    return reply({...base,error:"1688_DATA_RESIDENCY_NOT_APPROVED"},503);
  }
  if(!gates.image_display_rights_approved){
    return reply({...base,error:"1688_IMAGE_DISPLAY_RIGHTS_NOT_APPROVED"},503);
  }
  if(!gates.shadow_enabled){
    return reply({...base,error:"1688_SHADOW_KILL_SWITCH_OFF"},503);
  }
  if(!gates.credentials_present){
    return reply({...base,error:"1688_CREDENTIALS_UNAVAILABLE"},503);
  }

  return reply({...base,error:"OFFICIAL_1688_READONLY_ADAPTER_NOT_IMPLEMENTED_YET"},501);
});
