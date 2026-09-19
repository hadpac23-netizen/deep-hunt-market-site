(() => {
  "use strict";

  const VERSION="2026-09-19-f50-e1";
  const SOURCE_KINDS=new Set([
    "OFFICIAL_DOC","GOVERNMENT","PATENT","ACADEMIC_RESEARCH","COMPANY_PRIMARY",
    "GITHUB_PRIMARY","REGULATORY","MARKET_DATA","INDUSTRY_PRIMARY","DIRECT_OBSERVATION"
  ]);
  const NOVELTY_SURFACES=Object.freeze([
    "products","startups","patents","research","github","legacy_industries","alternate_names"
  ]);
  const clean=(v,max=500)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean))];

  function inspectEvidence(row={}){
    const blockers=[];
    const kind=clean(row.kind,40).toUpperCase();
    const ref=clean(row.ref||row.url,500);
    const claim=clean(row.claim,500);
    const verified=row.verified===true;
    if(!SOURCE_KINDS.has(kind))blockers.push("unsupported_source_kind");
    if(!ref)blockers.push("source_ref_missing");
    if(!claim)blockers.push("claim_missing");
    if(!verified)blockers.push("source_not_verified");
    return Object.freeze({
      id:clean(row.id,120),
      kind,ref,claim,verified,
      independent:row.independent!==false,
      blockers:Object.freeze(blockers),
      usable:blockers.length===0
    });
  }

  function inspectCandidate(candidate={}){
    const evidence=(Array.isArray(candidate.evidence)?candidate.evidence:[]).map(inspectEvidence);
    const usable=evidence.filter(x=>x.usable);
    const independent=usable.filter(x=>x.independent);
    const novelty=uniq((candidate.novelty_surfaces||[]).map(x=>clean(x,60).toLowerCase()));
    const missingNovelty=NOVELTY_SURFACES.filter(x=>!novelty.includes(x));
    const blockers=[];
    if(usable.length<3)blockers.push("insufficient_verified_evidence");
    if(independent.length<2)blockers.push("insufficient_independent_evidence");
    if(missingNovelty.length)blockers.push("prior_art_surface_gaps");
    return Object.freeze({
      version:VERSION,
      evidence:Object.freeze(evidence),
      usable_count:usable.length,
      independent_count:independent.length,
      novelty_surfaces:Object.freeze(novelty),
      missing_novelty_surfaces:Object.freeze(missingNovelty),
      evidence_ready:blockers.length===0,
      blockers:Object.freeze(blockers),
      execute_actions:false
    });
  }

  const api=Object.freeze({VERSION,SOURCE_KINDS,NOVELTY_SURFACES,inspectEvidence,inspectCandidate});
  if(typeof window!=="undefined")window.BoomF50EvidenceEngine=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();