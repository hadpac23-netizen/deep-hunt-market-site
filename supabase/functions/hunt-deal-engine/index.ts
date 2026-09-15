const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";

const ALLOWED=new Set([
  "https://deep-hunt-market.netlify.app",
  "https://hadpac23-netizen.github.io",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);
function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "Access-Control-Allow-Origin":(ALLOWED.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "Access-Control-Allow-Headers":"apikey, authorization, content-type",
    "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store",...cors(req)}})}
function num(v:unknown,d=0){const n=Number(v);return Number.isFinite(n)?n:d}
async function rest(path:string,init:any={}){
  const res=await fetch(URL+"/rest/v1/"+path,{...init,headers:{
    apikey:SERVICE,Authorization:"Bearer "+SERVICE,"Content-Type":"application/json",
    ...(init.prefer?{"Prefer":init.prefer}:{}),...(init.headers||{})
  }});
  const text=await res.text(); const data=text?JSON.parse(text):null;
  if(!res.ok)throw new Error(data?.message||data?.error||("REST_"+res.status));
  return data;
}
async function isAdmin(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return false;
  const u=await fetch(URL+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  if(!u.ok)return false;
  const user=await u.json(); if(!user?.id)return false;
  const p=await rest("profiles?id=eq."+encodeURIComponent(user.id)+"&select=is_admin");
  return p?.[0]?.is_admin===true;
}
function keyFor(row:any){
  const variant=String(row?.payload?.variant_id||"");
  return String(row.provider||"")+":"+String(row.item_id||"")+":"+variant;
}
async function latestEconomics(provider:string,itemId:string,variantId:string){
  let path="hunt_unit_economics?provider=eq."+encodeURIComponent(provider)+"&item_id=eq."+encodeURIComponent(itemId);
  if(variantId)path+="&variant_id=eq."+encodeURIComponent(variantId);
  path+="&select=*&order=calculated_at.desc&limit=20";
  const rows=await rest(path);
  if(!rows?.length)return null;
  const recent=rows.filter((x:any)=>Date.now()-Date.parse(x.calculated_at||"")<=7*86400000);
  const pool=recent.length?recent:rows.slice(0,1);
  const pass=pool.filter((x:any)=>x.profit_gate_status==="PASS"&&x.inputs_verified===true);
  const chosen=(pass.length?pass:pool).sort((a:any,b:any)=>num(a.max_safe_coupon_amount)-num(b.max_safe_coupon_amount))[0];
  return chosen||null;
}
async function boomScore(provider:string,itemId:string){
  const rows=await rest("hunt_boom_product_scores?provider=eq."+encodeURIComponent(provider)+"&item_id=eq."+encodeURIComponent(itemId)+"&select=total_score,promotion_eligible,calculated_at&order=calculated_at.desc&limit=1");
  return rows?.[0]||null;
}
async function refresh(){
  const since=new Date(Date.now()-31*86400000).toISOString();
  const observations=await rest("hunt_product_observations?observation_type=eq.price&observed_at=gte."+encodeURIComponent(since)+"&select=provider,item_id,price_amount,currency,payload,observed_at&order=observed_at.asc&limit=10000");
  const groups=new Map<string,any[]>();
  for(const row of observations||[]){
    if(!(num(row.price_amount)>0))continue;
    const k=keyFor(row);
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k)!.push(row);
  }
  let examined=0,created=0,ownerReview=0;
  const results:any[]=[];
  for(const [k,rows] of groups){
    if(rows.length<2)continue;
    examined++;
    const current=rows[rows.length-1];
    const prior=rows.slice(0,-1).filter((x:any)=>Date.parse(x.observed_at)<Date.parse(current.observed_at));
    if(!prior.length)continue;
    const reference=Math.min(...prior.map((x:any)=>num(x.price_amount,Infinity)).filter((x:number)=>Number.isFinite(x)&&x>0));
    const cur=num(current.price_amount);
    if(!(reference>cur))continue;
    const discount=(reference-cur)/reference;
    if(discount<0.03)continue;
    const variantId=String(current?.payload?.variant_id||"");
    const econ=await latestEconomics(current.provider,current.item_id,variantId);
    const boom=await boomScore(current.provider,current.item_id);
    const gate=econ?.profit_gate_status||"REVIEW";
    const verified=econ?.inputs_verified===true;
    const bscore=num(boom?.total_score,50);
    const freshness=Math.max(0,100-Math.min(100,(Date.now()-Date.parse(current.observed_at||""))/86400000*12));
    const discountScore=Math.min(100,discount*250);
    const profitScore=gate==="PASS"&&verified?100:gate==="PASS"?65:gate==="REVIEW"?35:0;
    const dealScore=Math.max(0,Math.min(100,discountScore*.35+profitScore*.30+bscore*.20+freshness*.15));
    const status=gate==="PASS"&&verified&&dealScore>=60?"owner_review":"candidate";
    if(status==="owner_review")ownerReview++;
    const payload={
      provider:current.provider,item_id:current.item_id,variant_id:variantId||null,
      title_snapshot:String(current?.payload?.title||"").slice(0,300)||null,
      current_price:Number(cur.toFixed(2)),reference_price:Number(reference.toFixed(2)),
      reference_basis:"LOWEST_30D",discount_percent:Number((discount*100).toFixed(2)),
      currency:String(current.currency||"USD").slice(0,3).toUpperCase(),
      profit_gate_status:gate,max_safe_coupon_amount:Number(num(econ?.max_safe_coupon_amount).toFixed(2)),
      boom_score:Number(bscore.toFixed(2)),deal_score:Number(dealScore.toFixed(2)),status,
      truth_status:"PRICE_DROP_VERIFIED",
      reasons:{observations:rows.length,reference_rule:"lowest verified prior price in observation window",inputs_verified:verified,economics_calculated_at:econ?.calculated_at||null,boom_calculated_at:boom?.calculated_at||null},
      verified_at:new Date().toISOString(),expires_at:new Date(Date.now()+48*3600000).toISOString(),
      owner_approved:false,updated_at:new Date().toISOString()
    };
    const inserted=await rest("hunt_deal_candidates",{method:"POST",prefer:"resolution=merge-duplicates,return=representation",body:JSON.stringify(payload)});
    created++; results.push(inserted?.[0]||payload);
  }
  await rest("hunt_deal_candidates?status=in.(candidate,eligible,owner_review,approved,live)&expires_at=lt."+encodeURIComponent(new Date().toISOString()),{
    method:"PATCH",prefer:"return=minimal",body:JSON.stringify({status:"expired",updated_at:new Date().toISOString()})
  }).catch(()=>null);
  return {examined_groups:examined,created_or_updated:created,owner_review:ownerReview,results:results.sort((a,b)=>num(b.deal_score)-num(a.deal_score)).slice(0,30),generated_at:new Date().toISOString()};
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
  if(!URL||!SERVICE)return json(req,{error:"server config missing"},500);
  if(req.method==="GET"){
    try{
      const rows=await rest("hunt_deal_candidates?status=eq.live&owner_approved=eq.true&truth_status=neq.NO_DISCOUNT_CLAIM&select=provider,item_id,variant_id,title_snapshot,current_price,reference_price,reference_basis,discount_percent,currency,deal_score,truth_status,verified_at,expires_at&order=deal_score.desc&limit=24");
      return json(req,{deals:rows||[],generated_at:new Date().toISOString()});
    }catch(e){return json(req,{error:e instanceof Error?e.message:"read failed"},500)}
  }
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  if(!(await isAdmin(req)))return json(req,{error:"Admin access required"},403);
  try{
    const body=await req.json(req,).catch(()=>({}));
    if(body?.action==="refresh")return json(req,{ok:true,refresh:await refresh()});
    if(body?.action==="approve"){
      const id=String(body?.id||"");
      if(!id)return json(req,{error:"id required"},400);
      const existing=await rest("hunt_deal_candidates?id=eq."+encodeURIComponent(id)+"&select=*&limit=1");
      const d=existing?.[0];
      if(!d)return json(req,{error:"deal not found"},404);
      if(d.truth_status==="NO_DISCOUNT_CLAIM"||d.profit_gate_status!=="PASS")return json(req,{error:"truth and profit gates must pass"},409);
      const updated=await rest("hunt_deal_candidates?id=eq."+encodeURIComponent(id),{
        method:"PATCH",prefer:"return=representation",
        body:JSON.stringify({status:"approved",owner_approved:true,updated_at:new Date().toISOString()})
      });
      return json(req,{ok:true,deal:updated?.[0]||null});
    }
    if(body?.action==="publish"){
      const id=String(body?.id||"");
      const existing=await rest("hunt_deal_candidates?id=eq."+encodeURIComponent(id)+"&owner_approved=eq.true&status=eq.approved&select=*&limit=1");
      const d=existing?.[0]; if(!d)return json(req,{error:"owner-approved deal required"},409);
      if(d.expires_at&&Date.parse(d.expires_at)<=Date.now())return json(req,{error:"deal expired; refresh required"},409);
      const updated=await rest("hunt_deal_candidates?id=eq."+encodeURIComponent(id),{
        method:"PATCH",prefer:"return=representation",
        body:JSON.stringify({status:"live",updated_at:new Date().toISOString()})
      });
      return json(req,{ok:true,deal:updated?.[0]||null});
    }
    if(body?.action==="reject"){
      const id=String(body?.id||"");
      const updated=await rest("hunt_deal_candidates?id=eq."+encodeURIComponent(id),{
        method:"PATCH",prefer:"return=representation",
        body:JSON.stringify({status:"rejected",owner_approved:false,updated_at:new Date().toISOString()})
      });
      return json(req,{ok:true,deal:updated?.[0]||null});
    }
    return json(req,{error:"unknown action"},400);
  }catch(e){return json(req,{error:e instanceof Error?e.message:"deal engine failed"},500)}
});