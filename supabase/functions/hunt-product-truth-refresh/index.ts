import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const PUBLIC=(()=>{try{return JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||Deno.env.get("SUPABASE_ANON_KEY")||""}catch{return Deno.env.get("SUPABASE_ANON_KEY")||""}})();
const db=createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}});
const clean=(v:any,n=220)=>String(v??"").trim().slice(0,n);
const json=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json"}});

async function isAdmin(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7).trim():"";
  if(!token)return false;
  const u=await fetch(URL+"/auth/v1/user",{headers:{apikey:SERVICE,Authorization:"Bearer "+token}});
  if(!u.ok)return false;
  const user=await u.json();
  const {data}=await db.from("profiles").select("is_admin").eq("id",user?.id).maybeSingle();
  return data?.is_admin===true;
}

async function storefront(itemId:string,country:string){
  const u=new URL(URL+"/functions/v1/hunt-storefront");
  u.searchParams.set("provider","CJdropshipping");
  u.searchParams.set("product_id",itemId);
  u.searchParams.set("country_code",country);
  const r=await fetch(u,{headers:{apikey:PUBLIC}});
  const b=await r.json().catch(()=>({}));
  if(!r.ok||!b?.product){
    const err:any=new Error("PRODUCT_LOOKUP_FAILED");
    err.http_status=r.status;err.provider_error=clean(b?.error,120);throw err;
  }
  return b.product;
}

async function quote(vid:string,country:string){
  const u=new URL(URL+"/functions/v1/hunt-cj-quote");
  u.searchParams.set("vid",vid);u.searchParams.set("country_code",country);u.searchParams.set("quantity","1");
  const r=await fetch(u,{headers:{apikey:PUBLIC}});
  const b=await r.json().catch(()=>({}));
  if(!r.ok)return {ok:false,http_status:r.status,error:clean(b?.error,120)};
  return {ok:true,...b};
}

function statusRow(itemId:string,country:string,scanId:string,state:string,extra:any={}){
  return {
    provider:"CJdropshipping",item_id:itemId,observation_type:"product",currency:"USD",
    availability_verified:state==="VERIFIED",
    payload:{
      scan_id:scanId,destination_country:country,refresh_state:state,
      source:"controlled-cj-refresh",...extra
    }
  };
}

Deno.serve(async req=>{
  if(req.method!=="POST")return json({error:"method not allowed"},405);
  if(!await isAdmin(req))return json({error:"admin required"},403);
  const body=await req.json().catch(()=>({}));
  const country=clean(body?.country_code,2).toUpperCase()||"IL";
  const limit=Math.max(1,Math.min(12,Number(body?.limit)||3));
  const variantProbeLimit=Math.max(1,Math.min(6,Number(body?.variant_probe_limit)||6));
  const commit=body?.commit_observations===true;
  const scanId=clean(body?.scan_id,100)||("CJ-"+country+"-"+Date.now());
  const {data:catalog,error}=await db.from("hunt_catalog_products")
    .select("provider,item_id,category,title,image_url,price_amount,currency,availability_verified,market_eligibility_status")
    .eq("provider","CJdropshipping")
    .order("source_fresh_at",{ascending:true,nullsFirst:true})
    .limit(limit);
  if(error)return json({error:error.message},500);

  const results:any[]=[];
  for(const row of catalog||[]){
    const itemId=clean(row.item_id);
    try{
      const product=await storefront(itemId,country);
      const variants=Array.isArray(product?.variants)?product.variants:[];
      let chosen:any=null,q:any=null;
      for(const v of variants.slice(0,variantProbeLimit)){
        if(!v?.variant_id)continue;
        const candidate=await quote(clean(v.variant_id),country);
        if(candidate?.ok===true&&candidate?.stock_verified===true&&candidate?.stock_available===true&&candidate?.shipping_verified===true&&(candidate?.shipping_options||[]).length){
          chosen=v;q=candidate;break;
        }
      }

      if(!chosen||!q){
        if(commit){
          const {error:writeError}=await db.from("hunt_product_observations").insert(
            statusRow(itemId,country,scanId,"NO_VERIFIED_VARIANT",{variant_count:variants.length})
          );
          if(writeError)throw writeError;
        }
        results.push({item_id:itemId,status:"NO_VERIFIED_VARIANT",variant_count:variants.length});
        continue;
      }

      const shipping=[...(q.shipping_options||[])].filter((x:any)=>Number.isFinite(Number(x?.price_usd))).sort((a:any,b:any)=>Number(a.price_usd)-Number(b.price_usd))[0];
      const retailVerified=(chosen?.retail_price_verified??product?.retail_price_verified)===true;
      const profitGate=clean(chosen?.profit_gate_status||product?.profit_gate_status,40).toUpperCase();
      const sale=Number(chosen?.retail_price_amount??product?.retail_price_amount);
      const supplier=Number(chosen?.price_amount??product?.price_amount);
      const eligible=retailVerified&&profitGate==="PASS"&&sale>0&&shipping&&Number.isFinite(Number(shipping.price_usd));

      if(!eligible){
        if(commit){
          const {error:writeError}=await db.from("hunt_product_observations").insert(
            statusRow(itemId,country,scanId,"PRICE_OR_PROFIT_BLOCKED",{variant_id:chosen?.variant_id||null,profit_gate_status:profitGate||null})
          );
          if(writeError)throw writeError;
        }
        results.push({item_id:itemId,status:"PRICE_OR_PROFIT_BLOCKED",variant_id:chosen?.variant_id||null,profit_gate_status:profitGate||null});
        continue;
      }

      if(commit){
        const common={scan_id:scanId,variant_id:chosen.variant_id,source:"hunt-product-truth-refresh"};
        const payloads=[
          statusRow(itemId,country,scanId,"VERIFIED",{variant_id:chosen.variant_id,profit_gate_status:"PASS"}),
          {provider:"CJdropshipping",item_id:itemId,observation_type:"price",price_amount:sale,currency:"USD",availability_verified:true,payload:{...common,supplier_cost_per_unit:supplier,retail_verified:true,profit_gate_status:"PASS"}},
          {provider:"CJdropshipping",item_id:itemId,observation_type:"stock",currency:"USD",availability_verified:true,payload:{...common,stock_verified:true,stock_available:true,selected_origin:q.selected_origin||null}},
          {provider:"CJdropshipping",item_id:itemId,observation_type:"shipping",currency:"USD",availability_verified:true,shipping_amount:Number(shipping.price_usd),destination_country:country,payload:{...common,shipping_verified:true,shipping_method:shipping.name||null,aging:shipping.aging||null}}
        ];
        const {error:writeError}=await db.from("hunt_product_observations").insert(payloads);
        if(writeError)throw writeError;
      }

      results.push({item_id:itemId,status:commit?"VERIFIED":"DRY_RUN_VERIFIED",variant_id:chosen.variant_id,shipping_price_usd:Number(shipping.price_usd),market_eligibility_status:row.market_eligibility_status});
    }catch(e){
      const err=e as any;
      if(commit){
        const {error:writeError}=await db.from("hunt_product_observations").insert(
          statusRow(itemId,country,scanId,"PRODUCT_FAILED",{http_status:err?.http_status||null,error:clean(err?.provider_error||err?.message,120)})
        );
        if(writeError)return json({error:writeError.message,item_id:itemId},500);
      }
      results.push({item_id:itemId,status:"PRODUCT_FAILED",http_status:err?.http_status||null,error:clean(err?.provider_error||err?.message,120)});
    }
  }

  return json({
    ok:true,mode:commit?"OBSERVATION_COMMIT":"DRY_RUN",scan_id:scanId,country,limit,variant_probe_limit:variantProbeLimit,results,
    notes:["Writes product scan status plus verified evidence only.","Does not update hunt_catalog_products.","Does not change market_eligibility_status.","Does not activate checkout or supplier ordering."]
  });
});