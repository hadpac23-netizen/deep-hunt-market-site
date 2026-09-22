const fs=require("fs"),assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-storefront/index.ts","utf8");
const contract=JSON.parse(fs.readFileSync("boom-country-market-gate-contract.json","utf8"));

function normalizeCountryCode(value){
  const code=String(value??"").trim().toUpperCase().replace(/[^A-Z]/g,"").slice(0,2);
  return /^[A-Z]{2}$/.test(code)?code:"";
}
function allows(value,countryCode){
  const status=String(value??"").trim().toLowerCase();
  if(!status||status==="eligible"||status==="allowed"||status==="recheck_before_checkout") return true;
  if(status==="blocked"||status==="ineligible") return false;
  const parseCountries=raw=>raw.split(/[,;|\s]+/).map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z]{2}$/.test(x));
  if(status.startsWith("eligible:")){
    if(!countryCode) return false;
    return parseCountries(status.slice("eligible:".length)).includes(countryCode);
  }
  if(status.startsWith("blocked:")){
    if(!countryCode) return false;
    return !parseCountries(status.slice("blocked:".length)).includes(countryCode);
  }
  return false;
}

assert.equal(contract.version,"HUNT-COUNTRY-MARKET-GATE-V2");
assert.equal(contract.production_effect,false);
assert.equal(contract.scope,"persisted_catalog_discovery");
assert.equal(contract.eprolo_state.il_shadow_shelf_products,13);
assert.equal(contract.eprolo_state.market_specific_shadow_products,2);
assert.equal(contract.eprolo_state.global_unique_shadow_candidates,15);
assert.deepEqual(contract.eprolo_state.shipping_discovery_markets,["DE","FR","IT","ES","NL","GB","US","CA","AU","AE","JP","SG"]);
assert.deepEqual(contract.eprolo_state.mapped_policy_shadow_markets,["DE","FR","IT","ES","NL","GB","US","AU"]);
assert.deepEqual(contract.eprolo_state.unmapped_policy_hold_markets,["CA","AE","JP","SG"]);
assert.equal(contract.eprolo_state.global_live_eligible_products,0);
assert.equal(contract.eprolo_state.persisted_catalog_discovery_enabled,false);

assert.equal(normalizeCountryCode("de"),"DE");
assert.equal(normalizeCountryCode(" us "),"US");
assert.equal(normalizeCountryCode(""),"");
assert.equal(allows("eligible","IL"),true);
assert.equal(allows("allowed","DE"),true);
assert.equal(allows("recheck_before_checkout","US"),true);
assert.equal(allows("blocked","US"),false);
assert.equal(allows("eligible:DE,US","DE"),true);
assert.equal(allows("eligible:DE,US","US"),true);
assert.equal(allows("eligible:DE,US","IL"),false);
assert.equal(allows("eligible:DE,US",""),false);
assert.equal(allows("blocked:IL","IL"),false);
assert.equal(allows("blocked:IL","DE"),true);
assert.equal(allows("blocked:IL",""),false);
assert.equal(allows("unknown_status","DE"),false);

assert(src.includes('function normalizeCountryCode(value: unknown): string'));
assert(src.includes('function marketEligibilityAllows(value: unknown, countryCode: string): boolean'));
assert(src.includes('async function persistedCatalogShelves(countryCode = "")'));
assert(src.includes('marketEligibilityAllows(marketStatus, countryCode)'));
assert(src.includes('url.searchParams.get("country_code")'));
assert(src.includes('url.searchParams.get("country")'));
assert(src.includes('withProviderTimeout(persistedCatalogShelves(countryCode), {}, 3500)'));
assert(src.includes('market_gate_mode: countryCode ? "DESTINATION_AWARE" : "GLOBAL_OR_RECHECK_ONLY"'));
assert(src.includes('const freeLaunchProviders = new Set(["CJdropshipping", "Printful", "Gooten"])'));
assert(!src.includes('const freeLaunchProviders = new Set(["CJdropshipping", "Printful", "Gooten", "EPROLO"])'));
console.log("PASS boom-storefront-country-market-gate");
