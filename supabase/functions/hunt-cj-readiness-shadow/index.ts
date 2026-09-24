import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUB="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";

const COUNTRIES=["US","DE","GB","IL","AE"];
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown,d:number|null=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});

async function rest(path:string){
  const r=await fetch(BASE_URL+"/rest/v1/"+path,{headers:{apikey:SERVICE,Authorization:"Bearer "+SERVICE}});
  const t=await r.text(); const d=t?JSON.parse(t):null;
  if(!r.ok) throw new Error(d?.message||("REST_"+r.status));
  return d;
}

async function getProfile(){
  const rows=await rest("hunt_profit_profiles?status=eq.active&owner_approved=eq.true&select=*&order=updated_at.desc&limit=1");
  if(!rows?.[0]) throw new Error("PROFIT_PROFILE_NOT_ACTIVE");
  return rows[0];
}

async function getStorefront(itemId:string){
  const u=new URL(BASE_URL+"/functions/v1/hunt-storefront");
  u.searchParams.set("provider","CJdropshipping");
  u.searchParams.set("product_id",itemId);
  u.searchParams.set("country_code","US");
  const r=await fetch(u,{headers:{apikey:PUB},cache:"no-store"});
  const b=await r.json().catch(()=>({}));
  if(!r.ok||!b?.product) throw new Error("STOREFRONT_RECHECK_FAILED");
  return b.product;
}

async function getDetail(itemId:string){
  const u=new URL(BASE_URL+"/functions/v1/hunt-cj-product-detail-shadow");
  u.searchParams.set("id",itemId);
  const r=await fetch(u,{headers:{apikey:PUB},cache:"no-store"});
  const b=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(b?.error||("DETAIL_"+r.status));
  return b;
}

async function quote(vid:string,country:string){
  const u=new URL(BASE_URL+"/functions/v1/hunt-cj-quote");
  u.searchParams.set("vid",vid);
  u.searchParams.set("country_code",country);
  u.searchParams.set("quantity","1");
  const r=await fetch(u,{headers:{apikey:PUB},cache:"no-store"});
  const b=await r.json().catch(()=>({}));
  return {http_status:r.status,...b};
}

function rankedVariantIds(detail:any){
  const rows=Array.isArray(detail?.raw?.data?.variantInventory)?detail.raw.data.variantInventory:[];
  const score=new Map<string,number>();
  for(const row of rows){
    const vid=clean(row?.vid);
    if(!vid) continue;
    const invs=Array.isArray(row?.inventory)?row.inventory:[];
    let best=0;
    for(const inv of invs){
      const total=Math.max(0,Number(inv?.totalInventory||0));
      const cj=Math.max(0,Number(inv?.cjInventory||0));
      const verified=Number(inv?.verifiedWarehouse||0)===1?1:0;
      best=Math.max(best,verified*1000000+cj*1000+total);
    }
    score.set(vid,best);
  }
  const normalized=Array.isArray(detail?.normalized?.variants)?detail.normalized.variants:[];
  for(const v of normalized){
    const vid=clean(v?.variant_id);
    if(vid&&!score.has(vid)) score.set(vid,0);
  }
  return [...score.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,6);
}

function calc(profile:any,sale:number,cost:number,ship:number){
  const payment=Math.max(0,Number(profile?.payment_rate||0.04));
  const refund=Math.max(0,Number(profile?.refund_reserve_rate||0.05));
  const variable=Math.max(0,Number(profile?.platform_variable_rate||0));
  const fixed=Math.max(0,Number(profile?.platform_fixed_per_order||0));
  const minContribution=Math.max(0,Number(profile?.min_contribution_per_unit||4));
  const minMargin=Math.max(0,Number(profile?.min_margin_rate||0.20));
  const r=payment+refund+variable;
  const contribution=(1-r)*sale-cost-r*ship-fixed;
  const margin=sale>0?contribution/sale:0;
  const gate=contribution>=minContribution&&margin>=minMargin?"PASS":contribution>0?"REVIEW":"BLOCK";
  const contributionFloor=(minContribution+cost+r*ship+fixed)/(1-r);
  const marginDenom=1-r-minMargin;
  const marginFloor=marginDenom>0?(cost+r*ship+fixed)/marginDenom:Infinity;
  return {
    contribution:Number(contribution.toFixed(2)),
    margin:Number(margin.toFixed(4)),
    gate,
    rescue_retail_floor:Number(Math.max(contributionFloor,marginFloor).toFixed(2))
  };
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET") return json({error:"method not allowed"},405);
  if(!BASE_URL||!SERVICE||!PUB) return json({error:"server config missing"},500);
  try{
    const u=new URL(req.url);
    const itemId=clean(u.searchParams.get("item_id"));
    if(!itemId) return json({error:"item_id required"},400);

    const profile=await getProfile();
    const storefront=await getStorefront(itemId);
    const detail=await getDetail(itemId);
    const variants=Array.isArray(storefront?.variants)?storefront.variants:[];
    const ids=rankedVariantIds(detail);
    if(!ids.length) return json({item_id:itemId,status:"HOLD",reason:"NO_VARIANTS",production_effect:false});

    let chosenVid="";
    let chosenQuote:any=null;
    for(let i=0;i<ids.length;i++){
      if(i>0) await wait(1700);
      const q=await quote(ids[i],"US");
      if(q?.stock_verified===true&&q?.stock_available===true&&q?.shipping_verified===true&&Array.isArray(q?.shipping_options)&&q.shipping_options.length){
        chosenVid=ids[i]; chosenQuote=q; break;
      }
    }
    if(!chosenVid) return json({item_id:itemId,status:"HOLD",reason:"NO_LIVE_VARIANT_US",tested_variants:ids,production_effect:false});

    const sfVariant=variants.find((v:any)=>clean(v?.variant_id)===chosenVid)||null;
    const exactRetailVerified=sfVariant?.retail_price_verified===true;
    const exactProfitProjected=clean(sfVariant?.profit_gate_status)==="PASS";
    const sale=Number(sfVariant?.retail_price_amount);
    const cost=Number(sfVariant?.price_amount);

    if(!exactRetailVerified||!exactProfitProjected||!Number.isFinite(sale)||sale<=0||!Number.isFinite(cost)||cost<=0){
      return json({
        item_id:itemId,variant_id:chosenVid,status:"HOLD",reason:"EXACT_VARIANT_RETAIL_NOT_READY",
        exact_retail_verified:exactRetailVerified,exact_projected_profit_gate:sfVariant?.profit_gate_status||null,
        production_effect:false
      });
    }

    const quotes:any[]=[];
    quotes.push({country:"US",quote:chosenQuote});
    for(const country of COUNTRIES.slice(1)){
      await wait(1700);
      quotes.push({country,quote:await quote(chosenVid,country)});
    }

    const results=quotes.map(({country,quote:q})=>{
      const option=Array.isArray(q?.shipping_options)?q.shipping_options[0]:null;
      const ship=Number(option?.price_usd);
      const evidenceOk=q?.stock_verified===true&&q?.stock_available===true&&q?.shipping_verified===true&&option&&Number.isFinite(ship);
      const economics=evidenceOk?calc(profile,sale,cost,ship):null;
      return {
        country,
        stock_verified:q?.stock_verified===true,
        stock_available:q?.stock_available===true,
        shipping_verified:q?.shipping_verified===true,
        shipping_method:option?.name||null,
        shipping_usd:Number.isFinite(ship)?ship:null,
        aging:option?.aging||null,
        economics
      };
    });

    const allPass=results.every(r=>r.stock_verified&&r.stock_available&&r.shipping_verified&&r.economics?.gate==="PASS");
    const rescueFloor=Math.max(...results.map(r=>r.economics?.rescue_retail_floor||0));
    return json({
      generated_at:new Date().toISOString(),
      production_effect:false,
      provider:"CJdropshipping",
      item_id:itemId,
      title:storefront?.title||detail?.normalized?.title||null,
      variant_id:chosenVid,
      variant_label:sfVariant?.label||sfVariant?.name||null,
      supplier_cost_usd:cost,
      retail_price_usd:sale,
      exact_retail_verified:exactRetailVerified,
      exact_projected_profit_gate:sfVariant?.profit_gate_status||null,
      destinations:results,
      readiness_status:allPass?"FULLY_READY_CANDIDATE":"HOLD",
      all_5_destinations_pass:allPass,
      rescue_retail_floor_usd:Number(rescueFloor.toFixed(2)),
      profile:{name:profile?.name,min_contribution_per_unit:profile?.min_contribution_per_unit,min_margin_rate:profile?.min_margin_rate,payment_rate:profile?.payment_rate,refund_reserve_rate:profile?.refund_reserve_rate}
    });
  }catch(e){
    return json({error:e instanceof Error?e.message:"readiness shadow failed",production_effect:false},500);
  }
});
