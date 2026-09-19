(() => {
  "use strict";

  const VERSION="2026-09-19-v1";
  const safeCount=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):null;

  async function count(client,table,filter=null){
    try{
      let q=client.from(table).select("id",{count:"exact",head:true});
      if(filter?.column)q=q.eq(filter.column,filter.value);
      const res=await q;
      if(res?.error)return {ok:false,count:null,error:String(res.error.message||res.error)};
      return {ok:true,count:safeCount(res?.count)||0,error:""};
    }catch(error){
      return {ok:false,count:null,error:String(error?.message||error)};
    }
  }

  async function load(client){
    if(!client?.from)return Object.freeze({
      version:VERSION,adapter_ready:false,merchant_registry_ready:false,attribution_registry_ready:false,
      counts:Object.freeze({}),errors:Object.freeze(["supabase_client_missing"]),read_only:true
    });

    const specs=[
      ["accounts","merchant_accounts",null],
      ["stores_total","merchant_stores",null],
      ["stores_approved","merchant_stores",{column:"status",value:"approved"}],
      ["stores_pending","merchant_stores",{column:"status",value:"pending"}],
      ["products_total","merchant_products",null],
      ["products_approved","merchant_products",{column:"status",value:"approved"}],
      ["products_pending","merchant_products",{column:"status",value:"pending_review"}],
      ["outbound_clicks","merchant_outbound_clicks",null],
      ["conversion_events","merchant_conversion_events",null],
      ["ad_requests","merchant_ad_requests",null]
    ];
    const results=await Promise.all(specs.map(async([key,table,filter])=>[key,await count(client,table,filter)]));
    const counts={},errors=[];
    for(const [key,result] of results){
      counts[key]=result.count;
      if(!result.ok)errors.push(key+":"+result.error);
    }
    const registryKeys=["accounts","stores_total","products_total"];
    const attributionKeys=["outbound_clicks","conversion_events"];
    const merchantRegistryReady=registryKeys.every(key=>results.find(([k])=>k===key)?.[1]?.ok===true);
    const attributionRegistryReady=attributionKeys.every(key=>results.find(([k])=>k===key)?.[1]?.ok===true);
    const adapterReady=merchantRegistryReady&&["stores_approved","stores_pending","products_approved","products_pending"].every(key=>results.find(([k])=>k===key)?.[1]?.ok===true);

    return Object.freeze({
      version:VERSION,
      adapter_ready:adapterReady,
      merchant_registry_ready:merchantRegistryReady,
      attribution_registry_ready:attributionRegistryReady,
      counts:Object.freeze(counts),
      errors:Object.freeze(errors),
      read_only:true,
      writes:0,
      execute_actions:false,
      owner_gate:"REVIEW_REQUIRED"
    });
  }

  const api=Object.freeze({VERSION,count,load});
  if(typeof window!=="undefined")window.HuntMarketplaceSnapshotAdapter=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})();