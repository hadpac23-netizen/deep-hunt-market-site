(() => {
  "use strict";
  const H=window.HuntCore;
  if(!H)return;

  let learning={categories:{},products:{},event_count:0,generated_at:null};
  let loaded=false;
  let remixNonce=0;

  function hash(input){
    let h=2166136261;
    for(const ch of String(input||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return (h>>>0)/4294967295;
  }
  function ageDays(value){
    const t=Date.parse(value||"");
    return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):999;
  }
  function category(item){
    return String(item?.category||H.inferCategory?.(item)||"").trim();
  }
  function department(item){
    const c=category(item);
    for(const [dep,children] of Object.entries(H.departmentSubcategories||{})){
      if(c===dep || (Array.isArray(children)&&children.includes(c)))return dep;
    }
    return c||"other";
  }
  function score(item){
    const c=category(item);
    const key=`${item?.provider||""}:${item?.item_id||""}`;
    const days=ageDays(item?.source_fresh_at||item?.updated_at);
    const freshness=days<=2?20:days<=7?18:days<=30?12:days<=90?6:2;
    const demand=Math.min(24,Number(learning.products?.[key]||0)+Number(learning.categories?.[c]||0)*1.15);
    const reliable=item?.availability_verified===true?18:8;
    const gate=String(item?.profit_gate_status||"").toUpperCase();
    const margin=(item?.retail_price_verified===true&&gate==="PASS")?20:
      (Number(item?.retail_price_amount)>0?11:5);
    const image=String(item?.image_url||"").startsWith("http")?5:0;
    const sessionMix=hash(`${key}:${remixNonce}:${new Date().toISOString().slice(0,10)}`)*9;
    return Math.min(100,Number((freshness+demand+reliable+margin+image+sessionMix).toFixed(2)));
  }
  function rankFeed(items,{limit=0}={}){
    const rows=(Array.isArray(items)?items:[]).filter(x=>x?.item_id);
    const scored=rows.map(item=>({item,score:score(item),dep:department(item),jitter:hash(`${item.provider}:${item.item_id}:${remixNonce}`)*7}))
      .sort((a,b)=>(b.score+b.jitter)-(a.score+a.jitter));
    const buckets=new Map();
    for(const row of scored){
      if(!buckets.has(row.dep))buckets.set(row.dep,[]);
      buckets.get(row.dep).push(row);
    }
    const deps=[...buckets.keys()].sort((a,b)=>{
      const aa=buckets.get(a)?.[0], bb=buckets.get(b)?.[0];
      return ((bb?.score||0)+hash(b+remixNonce)*5)-((aa?.score||0)+hash(a+remixNonce)*5);
    });
    const out=[],seen=new Set(),recent=[];
    while(deps.length && (!limit || out.length<limit)){
      let picked=false;
      for(let i=0;i<deps.length;i++){
        const dep=deps[i], bucket=buckets.get(dep)||[];
        if(!bucket.length){deps.splice(i--,1);continue;}
        if(recent.slice(-3).includes(dep) && deps.length>1)continue;
        const row=bucket.shift(),k=`${row.item.provider||""}:${row.item.item_id||""}`;
        if(seen.has(k))continue;
        seen.add(k);out.push({...row.item,boom_score:row.score});recent.push(dep);picked=true;
        if(limit&&out.length>=limit)break;
      }
      if(!picked){
        const dep=deps[0],bucket=buckets.get(dep)||[];
        if(!bucket.length){deps.shift();continue;}
        const row=bucket.shift(),k=`${row.item.provider||""}:${row.item.item_id||""}`;
        if(!seen.has(k)){seen.add(k);out.push({...row.item,boom_score:row.score});recent.push(dep);}
      }
    }
    return out;
  }
  function promotionEligible(item){
    if(!item?.item_id || !String(item?.image_url||"").startsWith("http"))return false;
    if(String(item?.provider||"").toLowerCase()==="hunt merchant"){
      return item?.promotion_eligible===true && String(item?.freshness_status||"")!=="stale";
    }
    return score(item)>=52 && ageDays(item?.source_fresh_at||item?.updated_at)<=90;
  }
  function remix(items){remixNonce+=1;return rankFeed(items);}
  async function load(){
    try{
      const res=await fetch(H.functionsBase+"/hunt-commerce-learning",{
        cache:"no-store",headers:{apikey:H.publishableKey}
      });
      const data=await res.json();
      if(res.ok&&data){learning=data;loaded=true;window.dispatchEvent(new CustomEvent("hunt:boom-net-ready",{detail:{learning}}));}
    }catch{}
    return learning;
  }
  window.BoomNet=Object.freeze({
    score,rankFeed,promotionEligible,remix,learning:()=>learning,loaded:()=>loaded,refresh:load
  });
  load();
})();