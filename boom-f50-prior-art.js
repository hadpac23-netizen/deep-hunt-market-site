(() => {
  "use strict";
  const VERSION="2026-09-19-f50-pa1";
  const SURFACES=Object.freeze(["products","startups","patents","research","github","legacy_industries","alternate_names"]);
  const RELATIONS=new Set(["same_mechanism","same_function","adjacent","different"]);
  const clean=(v,max=1200)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function analyze(candidate={}){
    const rows=(Array.isArray(candidate.prior_art_evidence)?candidate.prior_art_evidence:[])
      .map(row=>({
        surface:clean(row?.surface,80).toLowerCase(),
        relation:clean(row?.relation,40).toLowerCase(),
        source_ref:clean(row?.source_ref||row?.ref,1000),
        verified:row?.verified===true,
        note:clean(row?.note||row?.claim,1000)
      }))
      .filter(row=>row.surface&&RELATIONS.has(row.relation)&&row.source_ref);
    const verified=rows.filter(row=>row.verified);
    const covered=uniq(verified.map(row=>row.surface));
    const missing=SURFACES.filter(surface=>!covered.includes(surface));
    const sameMechanism=verified.filter(row=>row.relation==="same_mechanism");
    const sameFunction=verified.filter(row=>row.relation==="same_function");
    const patentRefs=verified.filter(row=>row.surface==="patents");
    const alternates=uniq((candidate.alternate_names||[]).map(x=>clean(x,120).toLowerCase()));
    const noveltyScope=clean(candidate.novelty_scope||candidate.novelty_claim,1200);
    const overclaim=/\b(world[- ]?first|does not exist|nothing like this|no one has|never been done|אין בעולם|לא קיים בעולם)\b/i.test(noveltyScope);
    const blockers=[];
    if(sameMechanism.length)blockers.push("same_mechanism_prior_art_found");
    if(missing.length)blockers.push("prior_art_surface_gaps");
    if(patentRefs.length<1)blockers.push("patent_evidence_missing");
    if(alternates.length<3)blockers.push("alternate_names_insufficient");
    if(noveltyScope.length<40)blockers.push("novelty_scope_too_broad_or_missing");
    if(overclaim)blockers.push("unsupported_global_novelty_claim");
    if(sameFunction.length&&clean(candidate.mechanism_difference,1200).length<40)blockers.push("same_function_difference_not_explained");
    const fatal=sameMechanism.length>0;
    const state=fatal?"KILL":blockers.length?"HOLD":"PASS";
    return Object.freeze({
      version:VERSION,state,
      prior_art_ready:state==="PASS",
      mechanism_novelty:state==="PASS",
      verified_records:verified.length,
      covered_surfaces:Object.freeze(covered),
      missing_surfaces:Object.freeze(missing),
      same_mechanism_refs:Object.freeze(sameMechanism.map(x=>x.source_ref)),
      same_function_refs:Object.freeze(sameFunction.map(x=>x.source_ref)),
      patent_refs:Object.freeze(patentRefs.map(x=>x.source_ref)),
      alternate_names:Object.freeze(alternates),
      blockers:Object.freeze(blockers),
      execute_actions:false
    });
  }

  const api=Object.freeze({VERSION,SURFACES,RELATIONS,analyze});
  if(typeof window!=="undefined")window.BoomF50PriorArt=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();