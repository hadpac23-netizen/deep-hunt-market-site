import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

// HUNT Stripe Tax Calculate Preview
// Shadow/Test only. No payment collection, no supplier order, no Production effect.
// Uses Stripe Tax Calculations API. If Stripe Tax is unavailable or unconfigured,
// fail closed with HOLD.

const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{"content-type":"application/json","cache-control":"no-store"}
});

function testKeyOnly(key:string){
  return key.startsWith("sk_test_")||key.startsWith("rk_test_");
}

function toMinorUsd(value:number){
  return Math.round(value*100);
}

type Line={
  reference?:string;
  amount_usd:number;
  quantity?:number;
  tax_code?:string;
  tax_behavior?:"inclusive"|"exclusive";
};

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return json({error:"POST required"},405);

  const db=Deno.env.get("SUPABASE_DB_URL");
  if(!db)return json({
    status:"HOLD",reason:"SERVER_DB_CONFIG_MISSING",
    tax_verified:false,final_profit_eligible:false,
    production_effect:false,sellable:false
  },503);
  const sql=postgres(db,{prepare:false,max:1,connect_timeout:15,idle_timeout:3,max_lifetime:60});
  let key="";
  try{
    const rows=await sql`
      select name,decrypted_secret
      from vault.decrypted_secrets
      where name in ('hunt_underwear_catalog_token','hunt_stripe_tax_test_secret_key')
    `;
    const sec=Object.fromEntries(rows.map((r:any)=>[r.name,r.decrypted_secret]));
    const expected=clean(sec.hunt_underwear_catalog_token);
    if(!expected||req.headers.get("x-hunt-internal-token")!==expected){
      return json({error:"unauthorized"},401);
    }
    key=clean(sec.hunt_stripe_tax_test_secret_key);
  } finally {
    await sql.end({timeout:1}).catch(()=>{});
  }

  const mode="test";
  if(mode!=="test"){
    return json({
      status:"HOLD",
      reason:"STRIPE_TAX_LIVE_MODE_BLOCKED",
      tax_verified:false,
      final_profit_eligible:false,
      production_effect:false,
      sellable:false
    },409);
  }
  if(!key||!testKeyOnly(key)){
    return json({
      status:"HOLD",
      reason:"STRIPE_TAX_TEST_KEY_REQUIRED",
      tax_verified:false,
      final_profit_eligible:false,
      production_effect:false,
      sellable:false
    },503);
  }

  try{
    const body=await req.json();
    const currency=clean(body?.currency||"usd").toLowerCase();
    const address=body?.customer_address&&typeof body.customer_address==="object"?body.customer_address:{};
    const country=clean(address?.country).toUpperCase();
    const postal=clean(address?.postal_code);
    const state=clean(address?.state);
    const city=clean(address?.city);
    const line1=clean(address?.line1);
    const lines:Array<Line>=Array.isArray(body?.line_items)?body.line_items:[];

    if(currency!=="usd"){
      return json({status:"HOLD",reason:"PREVIEW_USD_ONLY",production_effect:false,sellable:false},400);
    }
    if(!/^[A-Z]{2}$/.test(country)||!postal||!line1||!lines.length){
      return json({
        status:"HOLD",
        reason:"ADDRESS_AND_LINE_ITEMS_REQUIRED",
        tax_verified:false,
        final_profit_eligible:false,
        production_effect:false,
        sellable:false
      },400);
    }

    const params=new URLSearchParams();
    params.set("currency",currency);
    params.set("customer_details[address][country]",country);
    params.set("customer_details[address][postal_code]",postal);
    if(state)params.set("customer_details[address][state]",state);
    if(city)params.set("customer_details[address][city]",city);
    params.set("customer_details[address][line1]",line1);
    params.set("customer_details[address_source]","shipping");

    lines.forEach((line,i)=>{
      const amount=num(line?.amount_usd);
      const qty=Math.max(1,Math.min(20,Number(line?.quantity||1)||1));
      if(amount===null||amount<=0)throw new Error("INVALID_LINE_AMOUNT");
      params.set(`line_items[${i}][amount]`,String(toMinorUsd(amount)));
      params.set(`line_items[${i}][quantity]`,String(qty));
      params.set(`line_items[${i}][reference]`,clean(line?.reference)||`line_${i+1}`);
      params.set(`line_items[${i}][tax_code]`,clean(line?.tax_code)||"txcd_99999999");
      params.set(`line_items[${i}][tax_behavior]`,line?.tax_behavior==="exclusive"?"exclusive":"inclusive");
    });

    const ship=num(body?.shipping_amount_usd);
    if(ship!==null&&ship>=0){
      params.set("shipping_cost[amount]",String(toMinorUsd(ship)));
      params.set("shipping_cost[tax_behavior]","inclusive");
      params.set("shipping_cost[tax_code]","txcd_92010001");
    }

    const res=await fetch("https://api.stripe.com/v1/tax/calculations",{
      method:"POST",
      headers:{
        "authorization":"Bearer "+key,
        "content-type":"application/x-www-form-urlencoded"
      },
      body:params,
      signal:AbortSignal.timeout(20000)
    });
    const out=await res.json().catch(()=>({}));
    if(!res.ok){
      return json({
        status:"HOLD",
        reason:"STRIPE_TAX_CALCULATION_FAILED",
        stripe_type:out?.error?.type||null,
        stripe_code:out?.error?.code||null,
        stripe_message:out?.error?.message||null,
        tax_verified:false,
        final_profit_eligible:false,
        production_effect:false,
        sellable:false
      },502);
    }

    const taxExclusive=Number(out?.tax_amount_exclusive||0)/100;
    const taxInclusive=Number(out?.tax_amount_inclusive||0)/100;
    const taxUsd=Number((taxExclusive+taxInclusive).toFixed(2));

    return json({
      status:"VERIFIED",
      provider:"STRIPE_TAX",
      mode:"test",
      tax_calculation_id:out?.id||null,
      currency:out?.currency||currency,
      amount_total_usd:Number((Number(out?.amount_total||0)/100).toFixed(2)),
      tax_amount_exclusive_usd:Number(taxExclusive.toFixed(2)),
      tax_amount_inclusive_usd:Number(taxInclusive.toFixed(2)),
      tax_usd:taxUsd,
      expires_at:out?.expires_at||null,
      customer_country:country,
      tax_verified:true,
      final_profit_eligible:true,
      checked_at:new Date().toISOString(),
      production_effect:false,
      sellable:false
    });
  }catch(e){
    return json({
      status:"HOLD",
      reason:"STRIPE_TAX_PREVIEW_ERROR",
      error:e instanceof Error?e.message:String(e),
      tax_verified:false,
      final_profit_eligible:false,
      production_effect:false,
      sellable:false
    },500);
  }
});
