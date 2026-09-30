(() => {
  const H=window.HuntCore;
  if(!H||typeof H.storefront!=="function")return;

  const original=H.storefront.bind(H);
  const endpoint="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-eprolo-shelves-readonly";
  const publishableKey="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";

  const keyOf=p=>`${String(p?.provider||"").toUpperCase()}:${String(p?.item_id||"")}`;
  const mergeRows=(base=[],incoming=[])=>{
    const map=new Map();
    for(const row of Array.isArray(base)?base:[])map.set(keyOf(row),row);
    for(const row of Array.isArray(incoming)?incoming:[]){
      const key=keyOf(row);
      if(key!==":"&&!map.has(key))map.set(key,row);
    }
    return [...map.values()];
  };
  const mergeShelves=(base={},incoming={})=>{
    const out={...(base||{})};
    for(const [slug,rows] of Object.entries(incoming||{}))out[slug]=mergeRows(out[slug],rows);
    return out;
  };

  async function eproloShelves(){
    try{
      const res=await fetch(endpoint,{
        method:"GET",
        headers:{apikey:publishableKey,accept:"application/json"},
        cache:"no-store",
        signal:AbortSignal.timeout(5500)
      });
      if(!res.ok)return null;
      const data=await res.json();
      return data?.ok===true&&data?.purchasable===false&&data?.production_effect===false?data:null;
    }catch{return null;}
  }

  H.storefront=async params=>{
    if(String(params?.shelves||"")!=="1")return original(params);
    const base=await original(params)||{};
    const integrated=base?.eprolo_canonical_shelves;
    if(integrated?.source==="CANONICAL_PDP_READY"&&integrated?.purchasable===false&&integrated?.production_effect===false){
      return base;
    }
    const extra=await eproloShelves();
    if(!extra?.shelves)return base;
    return {
      ...base,
      shelves:mergeShelves(base.shelves,extra.shelves),
      eprolo_canonical_shelves:{
        source:extra.source,
        canonical_count:extra.canonical_count,
        display_eligible_count:extra.display_eligible_count,
        quarantined_count:extra.quarantined_count,
        final_profit_verified:0,
        purchasable:false,
        production_effect:false
      }
    };
  };
})();