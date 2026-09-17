(function(){
  "use strict";

  const providers={
    "runway-gen45":{
      id:"runway-gen45",label:"Runway Gen-4.5",connection:"NOT_CONNECTED",inputModes:["text_to_video","image_to_video"],portrait:true,maxSeconds:10,nativeAudio:false,referenceMode:"first_frame",strengths:["product motion","prompt adherence","portrait ecommerce shots"]
    },
    "google-veo31":{
      id:"google-veo31",label:"Google Veo 3.1",connection:"NOT_CONNECTED",inputModes:["text_to_video","image_to_video","video_extension"],portrait:true,durations:[4,6,8],nativeAudio:true,referenceMode:"up_to_3_images",strengths:["native audio","reference images","frame control"]
    }
  };

  function sceneSeconds(value){
    const m=String(value||"").match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if(!m)return 4;
    return Math.max(1,Math.min(10,Number(m[2])-Number(m[1])));
  }

  function supportsDuration(provider,seconds){
    if(Array.isArray(provider.durations))return provider.durations.some(d=>d>=seconds);
    return seconds<=Number(provider.maxSeconds||0);
  }

  function routeShot(requirements){
    const candidates=Object.values(providers).filter(p=>p.portrait&&p.inputModes.includes(requirements.input_mode)&&supportsDuration(p,requirements.duration_seconds));
    const scored=candidates.map(p=>{
      let score=50;
      if(requirements.input_mode==="image_to_video"&&p.referenceMode)score+=20;
      if(requirements.needs_native_audio&&p.nativeAudio)score+=25;
      if(!requirements.needs_native_audio&&!p.nativeAudio)score+=8;
      if(p.id==="runway-gen45"&&requirements.product_fidelity)score+=8;
      if(p.id==="google-veo31"&&requirements.needs_reference_images)score+=10;
      return {provider_id:p.id,label:p.label,score,connection:p.connection};
    }).sort((a,b)=>b.score-a.score);
    return {primary:scored[0]||null,fallbacks:scored.slice(1)};
  }

  function buildPlan(mission,{productImageUrl="",ownerApproved=false}={}){
    const scripts=Array.isArray(mission?.scripts)?mission.scripts:[];
    const productFidelity=Boolean(productImageUrl);
    const shots=[];
    scripts.forEach((script,scriptIndex)=>{
      const scenes=Array.isArray(script?.scenes)?script.scenes:[];
      scenes.forEach((scene,sceneIndex)=>{
        const duration=sceneSeconds(scene?.t);
        const requirements={
          aspect_ratio:"9:16",
          duration_seconds:duration,
          input_mode:productFidelity?"image_to_video":"text_to_video",
          product_fidelity:productFidelity,
          needs_reference_images:productFidelity,
          needs_native_audio:false
        };
        const route=routeShot(requirements);
        shots.push({
          id:`S${scriptIndex+1}-${sceneIndex+1}`,
          script:String(script?.name||`Script ${scriptIndex+1}`),
          visual:String(scene?.visual||""),
          overlay:String(scene?.overlay||""),
          prompt:String(mission?.video_prompt_pack?.prompts?.[scriptIndex]?.prompt||scene?.visual||""),
          reference_image:productImageUrl||null,
          requirements,
          route
        });
      });
    });
    const blockers=[];
    if(!ownerApproved)blockers.push("OWNER_APPROVAL_REQUIRED");
    if(!productImageUrl)blockers.push("VERIFIED_PRODUCT_IMAGE_REQUIRED_FOR_FIDELITY");
    blockers.push("SERVER_SIDE_PROVIDER_CONNECTOR_REQUIRED");
    return {
      status:"DRAFT_PLAN",
      execution_allowed:false,
      policy:"PLAN_ONLY_NO_GENERATION_NO_SPEND",
      provider_catalog:Object.values(providers),
      shot_count:shots.length,
      shots,
      blockers,
      next_safe_action:"Verify the HUNT product live, review shot routes, then Owner may approve server-side provider connection and draft generation."
    };
  }

  window.BoomVideoRouter={providers,buildPlan,routeShot};
})();
