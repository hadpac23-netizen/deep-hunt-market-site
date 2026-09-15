import { createSupabaseContext } from "npm:@supabase/server";

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
const money=(v:number)=>Number(v.toFixed(2));

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set([
    "https://deep-hunt-market.netlify.app",
    "https://hadpac23-netizen.github.io",
    "http://127.0.0.1:18977",
    "http://localhost:18977"
  ]);
  const preview=/^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  return {
    "access-control-allow-origin":(allowed.has(origin)||preview)?origin:"https://deep-hunt-market.netlify.app",
    "access-control-allow-headers":"apikey, authorization, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "vary":"Origin"
  };
}
function json(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json","cache-control":"no-store",...cors(req)
  }});
}
function tokens(v:string){
  const stop=new Set(["the","with","for","and","women","men","phone","fashion","new"]);
  return new Set(clean(v).toLowerCase().replace(/[^a-z0-9]+/g," ").split(/\s+/)
    .filter(x=>x.length>2&&!stop.has(x)));
}
function overlap(a:string,b:string){
  const A=tokens(a),B=tokens(b);
  let n=0;
  for(const x of A)if(B.has(x))n++;
  return n;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return json(req,{error:"method not allowed"},405);
  const {data:ctx,error:authError}=await createSupabaseContext(req,{auth:["user","publishable"]});
  if(authError||!ctx)return json(req,{error:"unauthorized"},authError?.status||401);

  try{
    const body=await req.json();
    const provider=clean(body?.provider);
    const itemId=clean(body?.item_id);
    const country=clean(body?.country_code).toUpperCase();
    if(!provider||!itemId||!/^[A-Z]{2}$/.test(country)){
      return json(req,{error:"INVALID_INPUT"},400);
    }

    const {data:currentCatalog}=await ctx.supabaseAdmin
      .from("hunt_catalog_products")
      .select("provider,item_id,category,title,image_url,availability_verified")
      .eq("provider",provider).eq("item_id",itemId).maybeSingle();
    if(!currentCatalog?.category||currentCatalog.availability_verified!==true){
      return json(req,{ok:true,candidates:[]});
    }
    const {data:currentEcon}=await ctx.supabaseAdmin
      .from("hunt_unit_economics")
      .select("item_id,variant_id,destination_country,currency,sale_price_per_unit,customer_shipping_amount,contribution_before_coupon,profit_gate_status,inputs_verified,calculated_at")
      .eq("provider",provider).eq("item_id",itemId).eq("destination_country",country)
      .eq("inputs_verified",true).eq("profit_gate_status","PASS")
      .order("calculated_at",{ascending:false}).limit(1).maybeSingle();
    if(!currentEcon)return json(req,{ok:true,candidates:[]});

    const {data:catalogRows}=await ctx.supabaseAdmin
      .from("hunt_catalog_products")
      .select("provider,item_id,category,title,image_url,availability_verified")
      .eq("provider",provider).eq("category",currentCatalog.category)
      .eq("availability_verified",true).neq("item_id",itemId).limit(80);
    const ids=(catalogRows||[]).map((x:any)=>clean(x.item_id)).filter(Boolean);
    if(!ids.length)return json(req,{ok:true,candidates:[]});
    const {data:econRows}=await ctx.supabaseAdmin
      .from("hunt_unit_economics")
      .select("item_id,variant_id,destination_country,currency,sale_price_per_unit,customer_shipping_amount,contribution_before_coupon,profit_gate_status,inputs_verified,calculated_at")
      .eq("provider",provider).eq("destination_country",country)
      .eq("inputs_verified",true).eq("profit_gate_status","PASS")
      .in("item_id",ids)
      .order("calculated_at",{ascending:false});

    const byId=new Map<string,any>();
    for(const row of econRows||[]){
      const id=clean(row.item_id);
      if(id&&!byId.has(id))byId.set(id,row);
    }
    const currentShipping=num(currentEcon.customer_shipping_amount);
    const currentDelivered=num(currentEcon.sale_price_per_unit)+currentShipping;
    const currentContribution=num(currentEcon.contribution_before_coupon);

    const ranked=(catalogRows||[]).map((cat:any)=>{
      const econ=byId.get(clean(cat.item_id));
      if(!econ)return null;
      const similarity=overlap(clean(currentCatalog.title),clean(cat.title));
      if(similarity<1)return null;
      const shipping=num(econ.customer_shipping_amount);
      const delivered=num(econ.sale_price_per_unit)+shipping;
      const contribution=num(econ.contribution_before_coupon);
      const shippingSaving=currentShipping-shipping;
      const deliveredSaving=currentDelivered-delivered;
      const contributionGain=contribution-currentContribution;
      if(shippingSaving<0.5&&deliveredSaving<0.5&&contributionGain<0.5)return null;
      return {
        provider:cat.provider,
        item_id:cat.item_id,
        variant_id:econ.variant_id,
        title:cat.title,
        image_url:cat.image_url,
        category:cat.category,
        currency:econ.currency||"USD",
        sale_price_per_unit:money(num(econ.sale_price_per_unit)),
        shipping_amount:money(shipping),
        shipping_saving:money(Math.max(0,shippingSaving)),
        delivered_saving:money(Math.max(0,deliveredSaving)),
        contribution_gain:money(Math.max(0,contributionGain)),
        similarity,
        verified_at:econ.calculated_at
      };
    }).filter(Boolean).sort((a:any,b:any)=>
      (b.delivered_saving*3+b.shipping_saving*2+b.contribution_gain+b.similarity)-
      (a.delivered_saving*3+a.shipping_saving*2+a.contribution_gain+a.similarity)
    ).slice(0,3);

    return json(req,{
      ok:true,
      country_code:country,
      current:{
        item_id:itemId,
        shipping_amount:money(currentShipping),
        delivered_amount:money(currentDelivered)
      },
      candidates:ranked
    });
  }catch(error){
    return json(req,{
      ok:false,
      error:clean((error as Error)?.message)||"shipping chess failed"
    },400);
  }
});
