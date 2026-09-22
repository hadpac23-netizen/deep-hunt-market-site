import fs from "node:fs";
const input="/tmp/boom-printful-profit-30.json";
if(!fs.existsSync(input))throw new Error("Missing Printful 30-product audit");
const audit=JSON.parse(fs.readFileSync(input,"utf8"));
const markets=["IL","DE","US"];
const products=(audit.results||[]).map(p=>{
  const verifiedMarkets=markets.filter(c=>p.countries?.[c]?.shipping_verified===true);
  const blockedMarkets=markets.filter(c=>!verifiedMarkets.includes(c));
  const countryPricing={};
  for(const c of verifiedMarkets){
    const x=p.countries[c];
    countryPricing[c]={
      supplier_shipping_usd:x.supplier_shipping_usd,
      customer_shipping_grossed_up_usd:x.customer_shipping_grossed_up_usd,
      product_retail_usd:p.product_gate?.retail,
      product_profit_usd:p.product_gate?.profit,
      free_shipping_retail_usd:x.free_shipping_required_retail_usd,
      free_shipping_profit_usd:x.free_shipping_profit_usd
    };
  }
  return {
    provider:"Printful",product_id:p.product_id,title:p.title,variant_id:p.variant_id,
    variant_name:p.variant_name,size:p.size,color:p.color,in_stock:p.in_stock===true,
    supplier_cost_usd:p.supplier_cost_usd,verified_markets:verifiedMarkets,blocked_markets:blockedMarkets,
    candidate_state:blockedMarkets.length===0?"GLOBAL_3_MARKET_VERIFIED":"COUNTRY_LIMITED",
    country_pricing:countryPricing,fulfillment:"DISABLED",checkout:"DISABLED"
  };
});
const global=products.filter(p=>p.candidate_state==="GLOBAL_3_MARKET_VERIFIED");
const limited=products.filter(p=>p.candidate_state==="COUNTRY_LIMITED");
const out={
  version:"HUNT-PRINTFUL-CANDIDATE-SHELF-2026-09-22-V1",
  mode:"SHADOW_CANDIDATE_SHELF",authority:"NONE",production_exposure:false,
  provider:"Printful",catalog_count:audit.summary?.catalog_count||null,
  audited_products:products.length,variants_verified:products.filter(p=>p.variant_id).length,
  in_stock_verified:products.filter(p=>p.in_stock).length,
  global_3_market_verified:global.length,country_limited:limited.length,
  fresh_shelf_production_verified:0,checkout_live_verified:0,
  fulfillment:"DISABLED",
  hard_rule:"Country-limited products must remain blocked in every market without a verified shipping quote.",
  global_candidates:global,
  country_limited_candidates:limited
};
fs.mkdirSync("evidence",{recursive:true});
fs.writeFileSync("evidence/HUNT-PRINTFUL-CANDIDATE-SHELF-2026-09-22.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({global:global.length,limited:limited.length,total:products.length,blocked:limited.map(p=>({title:p.title,blocked_markets:p.blocked_markets}))},null,2));