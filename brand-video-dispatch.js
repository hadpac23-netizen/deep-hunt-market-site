(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.BoomVideoDispatch=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const alias=id=>id==="google-veo31"?"veo-3.1":id;
  function buildDryRunRequest(qa,plan,truth){
    if(truth?.source_verified!==true)throw new Error("PRODUCT_TRUTH_REVERIFY_REQUIRED");
    if(plan?.execution_allowed!==false)throw new Error("ROUTE_PLAN_MUST_REMAIN_NON_EXECUTABLE");
    const finalists=Array.isArray(qa?.finalists)?qa.finalists:[];
    if(!finalists.length)throw new Error("QA_SHORTLIST_REQUIRED");
    const byId=new Map((plan?.shots||[]).map(s=>[String(s.id),s]));
    const shots=finalists.map(f=>{
      const s=byId.get(String(f.id));
      if(!s)throw new Error("FINALIST_ROUTE_MISSING_"+f.id);
      return {
        id:String(s.id),
        primary_provider:alias(String(s.route?.primary?.provider_id||"")),
        fallback_provider:alias(String(s.route?.fallbacks?.[0]?.provider_id||""))||null,
        duration_seconds:Number(s.requirements?.duration_seconds||0),
        aspect_ratio:String(s.requirements?.aspect_ratio||""),
        mode:s.requirements?.input_mode==="image_to_video"?"image-to-video":"text-to-video",
        prompt:String(s.prompt||s.visual||""),
        reference_image_url:String(s.reference_image||"")||null,
        qa_score:Number(f.scores?.overall||0),
        script:String(f.script||"")
      };
    });
    return {mode:"dry_run",product_truth:truth,route_plan:{status:"QA_SHORTLIST",execution_allowed:false,shots}};
  }
  return {buildDryRunRequest,alias};
});
