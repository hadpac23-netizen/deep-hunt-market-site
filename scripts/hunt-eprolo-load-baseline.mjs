const BASE="https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-storefront";
const APIKEY="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const IDS=["10317303","10695271","10709910","10709916","10719093","10719604","10893157","11595541","11595940","12288137","1283511","13732472","1817329","18456354","18561918"];
const CONCURRENCY=3;
const ROUNDS=2;
const timeoutMs=12000;

async function one(id){
  const u=new URL(BASE);
  u.searchParams.set("provider","EPROLO");
  u.searchParams.set("product_id",id);
  const started=Date.now();
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const res=await fetch(u,{headers:{apikey:APIKEY,accept:"application/json"},signal:controller.signal});
    clearTimeout(timer);
    const body=await res.json().catch(()=>({}));
    return {id,http:res.status,ms:Date.now()-started,ok:res.status===200&&!!body?.product,error:null};
  }catch(e){
    return {id,http:0,ms:Date.now()-started,ok:false,error:String(e?.name||e)};
  }
}
async function pool(items,limit){
  const out=[]; let i=0;
  async function worker(){
    while(true){
      const idx=i++;
      if(idx>=items.length)break;
      out[idx]=await one(items[idx]);
    }
  }
  await Promise.all(Array.from({length:limit},()=>worker()));
  return out;
}
const all=[];
for(let r=0;r<ROUNDS;r++){
  all.push(...await pool(IDS,CONCURRENCY));
}
const ms=all.map(x=>x.ms).sort((a,b)=>a-b);
const pct=p=>ms[Math.min(ms.length-1,Math.floor((ms.length-1)*p))];
const summary={
  total:all.length,
  ok_200_product:all.filter(x=>x.ok).length,
  non_200:all.filter(x=>x.http!==200&&x.http!==0).length,
  client_timeout_or_error:all.filter(x=>x.http===0).length,
  p50_ms:pct(.5),
  p95_ms:pct(.95),
  max_ms:ms[ms.length-1],
  concurrency:CONCURRENCY,
  rounds:ROUNDS
};
console.log("HUNT_EPROLO_LOAD_BASELINE="+JSON.stringify(summary));
console.log("HUNT_EPROLO_LOAD_FAILURES="+JSON.stringify(all.filter(x=>!x.ok)));
