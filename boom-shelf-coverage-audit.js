(() => {
  "use strict";
  if(window.HuntShelfCoverageAudit?.version)return;
  const version="HUNT-SHELF-COVERAGE-AUDIT-V1";

  function stateFor(count,resolved=true){
    if(!resolved)return "UNRESOLVED";
    if(count===null||count===undefined||!Number.isFinite(Number(count)))return "UNKNOWN";
    const n=Number(count);
    if(n<=0)return "EMPTY";
    if(n<50)return "CRITICAL";
    if(n<250)return "THIN";
    if(n<1000)return "BUILDING";
    return "READY";
  }
  function fresh(ts,maxHours=24){
    const n=Date.parse(String(ts||""));
    if(!Number.isFinite(n))return false;
    return Date.now()-n <= Math.max(1,Number(maxHours)||24)*3600000;
  }
  function normalizeRow(row){
    const live=row?.live_verified_products;
    const auditFresh=fresh(row?.last_live_audit_at,24);
    const count=auditFresh&&Number.isFinite(Number(live))?Number(live):null;
    return {
      shelf_slug:String(row?.shelf_slug||""),
      verified_count:count,
      evidence_fresh:auditFresh,
      raw_live_verified:Number.isFinite(Number(live))?Number(live):null,
      static_unique_products:Number(row?.static_unique_products||0),
      curated_eligible_products:Number.isFinite(Number(row?.curated_eligible_products))?Number(row.curated_eligible_products):null,
      coverage_status:String(row?.coverage_status||"unknown"),
      providers:Array.isArray(row?.providers)?row.providers:[],
      last_live_audit_at:row?.last_live_audit_at||null
    };
  }
  function summarize(contract,rows=[]){
    const normalized=(Array.isArray(rows)?rows:[]).map(normalizeRow);
    const bySlug=new Map(normalized.map(x=>[x.shelf_slug,x]));
    const departments=(contract?.departments||[]).map(dep=>{
      if(!dep?.slug){
        return {slug:null,title:dep?.title||"Unresolved",resolved:false,state:"UNRESOLVED",verified_count:null,gap_to_target:1000,evidence_fresh:false};
      }
      const row=bySlug.get(dep.slug)||null;
      const count=row?.verified_count??null;
      return {
        slug:dep.slug,title:dep.title,resolved:true,
        state:stateFor(count,true),
        verified_count:count,
        gap_to_target:count===null?1000:Math.max(0,1000-count),
        evidence_fresh:Boolean(row?.evidence_fresh),
        providers:row?.providers||[],
        source_row:row
      };
    });
    const ready=departments.filter(x=>x.state==="READY").length;
    const unresolved=departments.filter(x=>x.state==="UNRESOLVED").length;
    const unknown=departments.filter(x=>x.state==="UNKNOWN").length;
    const knownVerified=departments.reduce((sum,x)=>sum+(Number.isFinite(Number(x.verified_count))?Number(x.verified_count):0),0);
    return {
      version,
      target_departments:Number(contract?.target_departments||17),
      target_per_department:Number(contract?.target_verified_sellable_per_department||1000),
      departments,
      summary:{
        ready,
        unresolved,
        unknown,
        known_verified_total:knownVerified,
        target_total:Number(contract?.target_departments||17)*Number(contract?.target_verified_sellable_per_department||1000),
        all_ready:ready===Number(contract?.target_departments||17)&&unresolved===0&&unknown===0
      }
    };
  }
  async function fromSupabase(contract){
    const rt=window.BoomRuntime;
    const admin=await rt?.adminReady?.();
    if(!admin?.ok)throw Object.assign(new Error(admin?.reason||"AUTH_REQUIRED"),{code:admin?.reason||"AUTH_REQUIRED"});
    const db=rt?.getSupabaseClient?.();
    if(!db)throw Object.assign(new Error("COVERAGE_DB_UNAVAILABLE"),{code:"COVERAGE_DB_UNAVAILABLE"});
    const {data,error}=await db.from("hunt_shelf_coverage")
      .select("shelf_slug,static_unique_products,live_verified_products,curated_eligible_products,providers,coverage_status,last_live_audit_at,updated_at");
    if(error)throw error;
    return summarize(contract,data||[]);
  }
  window.HuntShelfCoverageAudit={version,stateFor,fresh,normalizeRow,summarize,fromSupabase};
})();