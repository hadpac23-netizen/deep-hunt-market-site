const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-eprolo-country-shadow/index.ts"),"utf8");

test("EPROLO country truth includes provider-reported destination tax when present",()=>{
  assert.match(src,/taxesFee \?\? x\?\.tax_fee \?\? x\?\.tax \?\? x\?\.taxes/);
  assert.match(src,/destination_tax_usd:sh\.tax_usd/);
  assert.match(src,/destination_tax_verified:destinationTaxVerified/);
  assert.match(src,/final_profit_verified:destinationTaxVerified && econ\.gate==="PASS"/);
});

test("EPROLO country pass remains fail-closed when destination tax is unknown",()=>{
  assert.match(src,/readiness_status:econ\.gate==="PASS"&&destinationTaxVerified\?"COUNTRY_PASS":"HOLD"/);
  assert.match(src,/tax_included:destinationTaxVerified/);
});
