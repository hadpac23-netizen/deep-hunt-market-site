(() => {
  "use strict";
  const VERSION="2026-09-19-f50-memory-adapter2";
  const clean=(v,max=1000)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);

  async function load(client,fingerprints=[]){
    if(!client?.from)return {ok:true,rows:[]};
    const {data,error}=await client.from("f50_research_memory")
      .select("mechanism_fingerprint,mechanism_primitives,last_decision,kill_reasons,prior_art_refs,winner_claim_allowed,hit_count,last_seen_at")
      .order("last_seen_at",{ascending:false}).limit(200);
    return error?{ok:false,rows:[],error:String(error.message||error)}:{ok:true,rows:data||[]};
  }

  async function upsert(client,payload={}){
    if(!client?.from)return {ok:false,error:"supabase_client_missing"};
    if(!clean(payload.mechanism_fingerprint,160))return {ok:false,error:"fingerprint_missing"};
    const {data:existing}=await client.from("f50_research_memory")
      .select("hit_count,first_seen_at").eq("mechanism_fingerprint",payload.mechanism_fingerprint).maybeSingle();
    const row={...payload,hit_count:Number(existing?.hit_count||0)+1,first_seen_at:existing?.first_seen_at||new Date().toISOString()};
    const {data,error}=await client.from("f50_research_memory").upsert(row,{onConflict:"mechanism_fingerprint"}).select().single();
    return error?{ok:false,error:String(error.message||error)}:{ok:true,row:data};
  }

  const api=Object.freeze({VERSION,load,upsert});
  if(typeof window!=="undefined")window.BoomF50MemoryAdapter=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();