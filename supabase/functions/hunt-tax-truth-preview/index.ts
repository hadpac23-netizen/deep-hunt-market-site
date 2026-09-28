// HUNT Tax Truth Preview
// Shadow/preview only. No payment, supplier-order, or Production effects.
//
// Purpose:
// - Distinguish verified transaction tax from conservative tax reserve.
// - Never convert a statutory headline rate into final tax truth.
// - Adult footwear reserve rates below are current standard-rate references
//   for scenario planning only; merchant liability still depends on transaction facts.
//
// Official references checked 2026-09-28:
// DE: BMF standard VAT 19%
// GB: GOV.UK standard VAT 20%
// IL: Israel Tax Authority VAT 18% from 2025-01-01
// AE: UAE Federal Tax Authority VAT 5%
// US: state/local sales tax depends on nexus and customer location; no country-level rate.

type TaxInput = {
  country: string;
  tax_category?: string;
  sale_amount_usd: number;
  price_includes_tax?: boolean;
  upstream_tax_usd?: number | null;
  upstream_tax_verified?: boolean;
  upstream_source?: string | null;
  shipping_incoterm?: string | null;
  customer_postal_code?: string | null;
};

const STANDARD_RESERVE: Record<string,{
  rate:number;
  source:string;
  effective_from:string;
}> = {
  DE:{rate:0.19,source:"BMF_STANDARD_VAT",effective_from:"2026-01-01"},
  GB:{rate:0.20,source:"GOV_UK_STANDARD_VAT",effective_from:"2026-04-01"},
  IL:{rate:0.18,source:"ISRAEL_TAX_AUTHORITY_VAT",effective_from:"2025-01-01"},
  AE:{rate:0.05,source:"UAE_FTA_STANDARD_VAT",effective_from:"2018-01-01"}
};

function n(v:unknown){
  const x=Number(v);
  return Number.isFinite(x)?x:null;
}
function money(v:number){
  return Number(v.toFixed(2));
}
function reserveFromInclusive(gross:number,rate:number){
  return money(gross*rate/(1+rate));
}
function reserveFromExclusive(net:number,rate:number){
  return money(net*rate);
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST"){
    return new Response(JSON.stringify({error:"POST required"}),{
      status:405,headers:{"content-type":"application/json","cache-control":"no-store"}
    });
  }
  try{
    const body=(await req.json()) as TaxInput;
    const country=String(body?.country||"").trim().toUpperCase();
    const sale=n(body?.sale_amount_usd);
    if(!/^[A-Z]{2}$/.test(country)||sale===null||sale<=0){
      return new Response(JSON.stringify({
        status:"HOLD",reason:"INVALID_INPUT",tax_verified:false,
        final_profit_eligible:false,production_effect:false,sellable:false
      }),{status:400,headers:{"content-type":"application/json","cache-control":"no-store"}});
    }

    const upstreamTax=n(body?.upstream_tax_usd);
    if(body?.upstream_tax_verified===true && upstreamTax!==null && upstreamTax>=0){
      return new Response(JSON.stringify({
        status:"VERIFIED",
        country,
        tax_usd:money(upstreamTax),
        tax_verified:true,
        source:String(body?.upstream_source||"UPSTREAM_TRANSACTION_TAX"),
        final_profit_eligible:true,
        checked_at:new Date().toISOString(),
        production_effect:false,
        sellable:false
      }),{headers:{"content-type":"application/json","cache-control":"no-store"}});
    }

    if(country==="US"){
      return new Response(JSON.stringify({
        status:"HOLD",
        country,
        reason:"ADDRESS_LEVEL_TAX_ENGINE_REQUIRED",
        detail:"US sales tax requires transaction-level state/local and nexus determination; no country-level reserve is treated as tax truth.",
        tax_verified:false,
        final_profit_eligible:false,
        checked_at:new Date().toISOString(),
        production_effect:false,
        sellable:false
      }),{headers:{"content-type":"application/json","cache-control":"no-store"}});
    }

    const rule=STANDARD_RESERVE[country];
    if(!rule){
      return new Response(JSON.stringify({
        status:"HOLD",country,reason:"NO_APPROVED_TAX_RULE",
        tax_verified:false,final_profit_eligible:false,
        checked_at:new Date().toISOString(),
        production_effect:false,sellable:false
      }),{headers:{"content-type":"application/json","cache-control":"no-store"}});
    }

    if(typeof body?.price_includes_tax!=="boolean"){
      return new Response(JSON.stringify({
        status:"HOLD",country,reason:"PRICE_TAX_INCLUSION_UNKNOWN",
        reserve_rate:rule.rate,reserve_source:rule.source,
        tax_verified:false,final_profit_eligible:false,
        checked_at:new Date().toISOString(),
        production_effect:false,sellable:false
      }),{headers:{"content-type":"application/json","cache-control":"no-store"}});
    }

    const reserve=body.price_includes_tax
      ? reserveFromInclusive(sale,rule.rate)
      : reserveFromExclusive(sale,rule.rate);

    return new Response(JSON.stringify({
      status:"RESERVE_ONLY",
      country,
      reserve_rate:rule.rate,
      tax_reserve_usd:reserve,
      reserve_source:rule.source,
      reserve_effective_from:rule.effective_from,
      reason:"STATUTORY_STANDARD_RATE_IS_NOT_TRANSACTION_TAX_TRUTH",
      tax_verified:false,
      final_profit_eligible:false,
      requires_transaction_tax_source:true,
      shipping_incoterm:String(body?.shipping_incoterm||"UNKNOWN"),
      checked_at:new Date().toISOString(),
      production_effect:false,
      sellable:false
    }),{headers:{"content-type":"application/json","cache-control":"no-store"}});
  }catch(e){
    return new Response(JSON.stringify({
      status:"HOLD",reason:"TAX_PREVIEW_ERROR",
      error:e instanceof Error?e.message:String(e),
      tax_verified:false,final_profit_eligible:false,
      production_effect:false,sellable:false
    }),{status:500,headers:{"content-type":"application/json","cache-control":"no-store"}});
  }
});
