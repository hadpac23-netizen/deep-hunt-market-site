(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.BoomCreativeQA=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";

  const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
  const text=v=>String(v||"").toLowerCase();
  const has=(value,terms)=>terms.some(term=>text(value).includes(term));
  const sceneNumber=id=>Number(String(id||"").split("-")[1]||0);

  function scoreShot(shot){
    const visual=text(shot?.visual),overlay=text(shot?.overlay),prompt=text(shot?.prompt);
    const combined=visual+" "+overlay;
    let fidelity=55,hook=42,clarity=50,safety=100,conversion=45;
    const reasons=[];

    if(shot?.reference_image){fidelity+=22;reasons.push("verified product image reference");}
    else fidelity-=28;
    if(has(visual,["macro","detail","product","phone","case","hero","flatlay","cutout","pattern"]))fidelity+=15;
    if(has(visual,["generic plain","plain phone"]))fidelity+=3;
    if(sceneNumber(shot?.id)===1){hook+=10;reasons.push("opening-shot hook");}
    if(overlay.length>=8&&overlay.length<=80)hook+=12;
    if(/[?]/.test(overlay)||has(overlay,["pov","bored","tired","your phone","what if","from plain"]))hook+=12;
    if(has(combined,["transition","reveal","before","after","swipe","changes outfits","reset"]))hook+=10;

    if(visual.length>8)clarity+=12;
    if(overlay.length>0)clarity+=10;
    if(has(combined,["phone","case","floral","product"]))clarity+=10;
    if(has(overlay,["verify","check compatibility","see verified","shipping shown separately"]))clarity+=8;

    if(has(combined,["transition","reveal","before","after","swipe","reset"]))conversion+=18;
    if(has(combined,["macro","detail","hero","flatlay","pattern"]))conversion+=12;
    if(has(overlay,["check","see verified","verify your model"]))conversion+=10;

    const risky=["shockproof","military-grade","military grade","waterproof","scratch-proof","scratch proof","magsafe","anti-yellowing","anti yellowing","guaranteed","guarantee","best seller","bestseller","limited stock","premium material","made in korea"];
    const riskHits=risky.filter(term=>has(combined,[term]));
    safety-=riskHits.length*35;
    if(has(prompt,["without claiming premium materials","no claims rendered","no fake reviews"]))safety+=2;

    fidelity=clamp(fidelity);hook=clamp(hook);clarity=clamp(clarity);safety=clamp(safety);conversion=clamp(conversion);
    const overall=clamp(fidelity*.28+hook*.22+clarity*.18+conversion*.20+safety*.12);
    const blocked=safety<70||riskHits.length>0;
    return {
      id:String(shot?.id||""),script:String(shot?.script||""),visual:String(shot?.visual||""),overlay:String(shot?.overlay||""),
      scores:{fidelity,hook_strength:hook,clarity,claim_safety:safety,conversion_usefulness:conversion,overall},
      blocked,blocked_reasons:riskHits.map(x=>"unverified/risky claim: "+x),positive_signals:reasons
    };
  }

  function tournament(plan,mission,{limit=4,minScore=62}={}){
    const shots=Array.isArray(plan?.shots)?plan.shots:[];
    const scored=shots.map(scoreShot).sort((a,b)=>b.scores.overall-a.scores.overall||a.id.localeCompare(b.id));
    const eligible=scored.filter(x=>!x.blocked&&x.scores.overall>=minScore);
    const finalists=[];const used=new Set();
    for(const item of eligible){
      if(finalists.length>=limit)break;
      if(!used.has(item.script)){finalists.push(item);used.add(item.script);}
    }
    for(const item of eligible){
      if(finalists.length>=limit)break;
      if(!finalists.some(x=>x.id===item.id))finalists.push(item);
    }
    finalists.forEach((item,i)=>{item.rank=i+1;item.selection_reason=i<used.size?"best safe shot from a distinct script":"next-highest safe score";});
    const selectedIds=new Set(finalists.map(x=>x.id));
    const eliminated=scored.filter(x=>!selectedIds.has(x.id));
    const reduction=shots.length?Math.round((1-finalists.length/shots.length)*1000)/10:0;
    const blockers=[];
    if(plan?.execution_allowed!==false)blockers.push("ROUTE_PLAN_MUST_REMAIN_NON_EXECUTABLE");
    if(shots.some(s=>!s?.reference_image))blockers.push("VERIFIED_PRODUCT_IMAGE_REQUIRED_FOR_FULL_FIDELITY");
    blockers.push("OWNER_APPROVAL_REQUIRED_BEFORE_GENERATION");
    return {
      status:"QA_SHORTLIST",execution_allowed:false,policy:"SCORE_THEN_SHORTLIST_NO_GENERATION_NO_SPEND",
      criteria:{fidelity:.28,hook_strength:.22,clarity:.18,conversion_usefulness:.20,claim_safety:.12},
      input_shots:shots.length,finalist_count:finalists.length,generation_reduction_pct:reduction,
      mission_id:String(mission?.mission?.id||""),finalists,eliminated,blockers,
      next_safe_action:"Owner reviews the shortlist. Re-verify Product Truth before any future draft generation."
    };
  }

  return {scoreShot,tournament};
});
