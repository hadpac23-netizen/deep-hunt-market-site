import fs from "node:fs";
const source="evidence/HUNT-PRINTFUL-CANDIDATE-SHELF-2026-09-22.json";
const out="evidence/HUNT-STYLIST-ACADEMY-TRAINING-SET-2026-09-22.json";
const data=JSON.parse(fs.readFileSync(source,"utf8"));
const rows=(data.global_candidates||[]).map(p=>({
  provider:p.provider,
  product_id:p.product_id,
  title:p.title,
  variant_id:p.variant_id,
  size:p.size,
  color:p.color,
  in_stock:p.in_stock,
  verified_markets:p.verified_markets,
  supplier_cost_usd:p.supplier_cost_usd,
  country_pricing:p.country_pricing,
  training_only:true
}));
const payload={
  version:"HUNT-STYLIST-TRAINING-SET-V1",
  mode:"SHADOW_TRAINING",
  source,
  verified_products:rows.length,
  excluded_country_limited:(data.country_limited_candidates||[]).length,
  products:rows,
  production_effect:false
};
fs.writeFileSync(out,JSON.stringify(payload,null,2)+"\n");
console.log(JSON.stringify({out,verified_products:rows.length,excluded_country_limited:payload.excluded_country_limited,production_effect:false},null,2));
