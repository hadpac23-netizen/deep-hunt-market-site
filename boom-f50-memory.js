(() => {
  "use strict";
  const VERSION="2026-09-19-f50-mem2";
  const clean=(v,max=800)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
  const primitives=c=>[...new Set((Array.isArray(c?.mechanism_primitives)?c.mechanism_primitives:[])
    .map(x=>clean(x,120).toLowerCase().replace(/[^a-z0-9_:-]+/g,"_"))
    .filter(Boolean))].sort();

  function fnv1a64(text){
    let h=14695981039346656037n;
    for(const ch of text){h^=BigInt(ch.codePointAt(0));h=BigInt.asUintN(64,h*1099511628211n);}
    return h.toString(16).padStart(16,"0");
  }
  function fingerprint(candidate={}){
    const p=primitives(candidate);
    return p.length>=3?"f50_"+fnv1a64(p.join("|")):"";
  }
  function similarity(a=[],b=[]){
    const A=new Set(a),B=new Set(b);
    if(!A.size||!B.size)return 0;
    let inter=0;for(const x of A)if(B.has(x))inter++;
    const union=new Set([...A,...B]).size;
    return union?inter/union:0;
  }
  function inspect(candidate={},memoryRows=[]){
    const fp=fingerprint(candidate);
    const p=primitives(candidate);
    const blockers=[];
    if(!fp)blockers.push("mechanism_primitives_insufficient");
    const rows=Array.isArray(memoryRows)?memoryRows:[];
    let hit=rows.find(row=>clean(row?.mechanism_fingerprint,160)===fp)||null;
    let matchType=hit?"EXACT":"NONE",score=hit?1:0;
    if(!hit&&p.length>=3){
      for(const row of rows){
        const rp=[...new Set((Array.isArray(row?.mechanism_primitives)?row.mechanism_primitives:[]).map(x=>clean(x,120).toLowerCase()).filter(Boolean))];
        const s=similarity(p,rp);
        const shared=p.filter(x=>rp.includes(x)).length;
        if(shared>=2&&s>=0.6&&s>score){hit=row;score=s;matchType="NEAR_DUPLICATE";}
      }
    }
    if(hit&&String(hit.last_decision||"").toUpperCase()==="KILL"){
      const refs=[...new Set((candidate.reopen_evidence||[]).map(x=>clean(x,1000)).filter(Boolean))];
      const reason=clean(candidate.reopen_reason,1000);
      if(reason.length<40||refs.length<2)blockers.push("previously_killed_or_near_duplicate_without_material_new_evidence");
    }
    if(hit&&String(hit.last_decision||"").toUpperCase()==="WINNER"){
      blockers.push("known_winner_requires_revalidation_not_reinvention");
    }
    return Object.freeze({
      version:VERSION,fingerprint:fp,memory_hit:Boolean(hit),match_type:matchType,
      similarity:Number(score.toFixed(3)),
      previous_decision:hit?String(hit.last_decision||"UNRESOLVED").toUpperCase():"NONE",
      hit_count:Number(hit?.hit_count||0),memory_ready:blockers.length===0,
      blockers:Object.freeze(blockers),execute_actions:false
    });
  }
  function recordPayload(candidate={},decision="UNRESOLVED",result={}){
    return Object.freeze({
      mechanism_fingerprint:fingerprint(candidate),
      canonical_title:clean(candidate.title,300),
      canonical_mechanism:clean(candidate.mechanism,2000),
      mechanism_primitives:primitives(candidate),
      last_decision:String(decision||"UNRESOLVED").toUpperCase(),
      kill_reasons:Array.isArray(result.blockers)?result.blockers:[],
      prior_art_refs:Array.isArray(result.prior_art?.same_mechanism_refs)?result.prior_art.same_mechanism_refs:[],
      winner_claim_allowed:decision==="WINNER"&&result.final_claim_allowed===true,
      last_seen_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    });
  }

  const api=Object.freeze({VERSION,primitives,fingerprint,inspect,recordPayload});
  if(typeof window!=="undefined")window.BoomF50Memory=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();