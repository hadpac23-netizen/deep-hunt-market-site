import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const PUB="sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const reply=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return reply({error:"POST required"},405);
  const base=Deno.env.get("SUPABASE_URL")||"";
  const db=Deno.env.get("SUPABASE_DB_URL");
  if(!base||!db)return reply({error:"server config missing"},500);
  const sql=postgres(db,{prepare:false,max:1,connect_timeout:20,idle_timeout:3,max_lifetime:60});
  try{
    const secRows=await sql`select decrypted_secret from vault.decrypted_secrets where name='hunt_underwear_catalog_token' limit 1`;
    const internal=String(secRows?.[0]?.decrypted_secret||"");
    if(!internal||req.headers.get("x-hunt-internal-token")!==internal)return reply({error:"unauthorized"},401);

    const body=await req.json().catch(()=>({}));
    const phase=clean(body?.phase||"prepayment");
    const country=clean(body?.country).toUpperCase();
    const lines=Array.isArray(body?.lines)?body.lines:[];
    if(!["prepayment","presupplier"].includes(phase))return reply({error:"invalid phase"},400);
    if(!/^[A-Z]{2}$/.test(country))return reply({error:"ISO country required"},400);
    if(!lines.length||lines.length>25)return reply({error:"1-25 lines required"},400);

    const results:any[]=[];
    for(const raw of lines){
      const provider=clean(raw?.provider);
      const itemId=clean(raw?.item_id);
      const variantId=clean(raw?.variant_id);
      const qty=Math.max(1,Math.min(5,Number(raw?.qty||1)||1));
      if(!provider||!itemId||!variantId){
        results.push({provider,item_id:itemId,variant_id:variantId,status:"HOLD",reason:"LINE_IDENTITY_INCOMPLETE"});
        continue;
      }
      let audit:any={};
      try{
        if(provider.toLowerCase().includes("cj")){
          const u=new URL(base+"/functions/v1/hunt-cj-readiness-country-shadow");
          u.searchParams.set("item_id",itemId);u.searchParams.set("variant_id",variantId);u.searchParams.set("country",country);
          const r=await fetch(u,{headers:{apikey:PUB},cache:"no-store",signal:AbortSignal.timeout(30000)});
          audit=await r.json().catch(()=>({}));
        }else if(provider.toLowerCase().includes("eprolo")){
          const u=new URL(base+"/functions/v1/hunt-eprolo-variant-country-audit-shadow");
          u.searchParams.set("item_id",itemId);u.searchParams.set("variant_id",variantId);u.searchParams.set("country",country);
          const r=await fetch(u,{headers:{"x-hunt-internal-token":internal},cache:"no-store",signal:AbortSignal.timeout(30000)});
          audit=await r.json().catch(()=>({}));
        }else{
          results.push({provider,item_id:itemId,variant_id:variantId,status:"HOLD",reason:"PROVIDER_LIVE_TRUTH_NOT_CONNECTED"});
          continue;
        }
      }catch(e){
        results.push({provider,item_id:itemId,variant_id:variantId,status:"HOLD",reason:"SUPPLIER_CHECK_ERROR",error:e instanceof Error?e.message:String(e)});
        continue;
      }

      const supplierCost=num(audit?.supplier_cost_usd);
      const shipping=num(audit?.shipping_usd);
      const expectedCost=num(raw?.expected_supplier_cost_usd);
      const expectedShipping=num(raw?.expected_shipping_usd);
      const costChanged=expectedCost!==null&&supplierCost!==null&&Math.abs(expectedCost-supplierCost)>0.01;
      const shippingChanged=expectedShipping!==null&&shipping!==null&&Math.abs(expectedShipping-shipping)>0.01;
      const stockOk=audit?.stock_verified===true&&audit?.stock_available===true;
      const shippingOk=audit?.shipping_verified===true;
      const economicsPass=audit?.economics?.gate==="PASS";
      const finalProfit=audit?.final_profit_verified===true;
      const upstreamReady=audit?.readiness_status==="COUNTRY_PASS";

      let status="PASS",reason:string|null=null;
      if(!stockOk){status="HOLD";reason="STOCK_NOT_VERIFIED_OR_OUT";}
      else if(!shippingOk){status="HOLD";reason="SHIPPING_NOT_VERIFIED";}
      else if(costChanged||shippingChanged){status="HOLD";reason="REQUOTE_REQUIRED";}
      else if(!economicsPass){status="HOLD";reason="PROFIT_GATE_NOT_PASS";}
      else if(provider.toLowerCase().includes("eprolo")&&!finalProfit){status="HOLD";reason="FINAL_PROFIT_NOT_VERIFIED";}
      else if(provider.toLowerCase().includes("cj")&&!upstreamReady){status="HOLD";reason="COUNTRY_READINESS_NOT_PASS";}

      results.push({
        provider,item_id:itemId,variant_id:variantId,qty,country,phase,status,reason,
        checked_at:audit?.checked_at||audit?.generated_at||new Date().toISOString(),
        stock_verified:audit?.stock_verified===true,
        stock_available:audit?.stock_available===true,
        inventory_quantity:audit?.inventory_quantity??null,
        supplier_cost_usd:supplierCost,
        shipping_verified:audit?.shipping_verified===true,
        shipping_method:audit?.shipping_method||null,
        shipping_usd:shipping,
        expected_supplier_cost_usd:expectedCost,
        expected_shipping_usd:expectedShipping,
        cost_changed:costChanged,
        shipping_changed:shippingChanged,
        economics:audit?.economics||null,
        final_profit_verified:finalProfit,
        source_readiness:audit?.readiness_status||audit?.status||null,
        missing_for_final_profit:audit?.missing_for_final_profit||[],
        production_effect:false,
        supplier_order_created:false,
        payment_created:false
      });
    }

    const blockers=results.filter(x=>x.status!=="PASS");
    return reply({
      phase,country,checked_at:new Date().toISOString(),
      line_count:results.length,pass_count:results.length-blockers.length,hold_count:blockers.length,
      ready: blockers.length===0,
      results,
      action: blockers.length?"HOLD_AND_REQUOTE_OR_REVERIFY":"CONTINUE_TO_NEXT_GATE",
      production_effect:false,
      payment_created:false,
      supplier_order_created:false
    });
  }catch(e){
    return reply({ok:false,error:e instanceof Error?e.message:String(e),production_effect:false},500);
  }finally{await sql.end({timeout:1}).catch(()=>{});}
});