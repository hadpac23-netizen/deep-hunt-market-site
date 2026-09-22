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

assert.equal(contract.version,"HUNT-COUNTRY-MARKET-GATE-V7");
assert.equal(contract.production_effect,false);
assert.equal(contract.scope,"global_market_specific_shadow_eligibility");
assert.equal(contract.eprolo_state.il_shadow_shelf_products,13);
assert.equal(contract.eprolo_state.market_specific_shadow_products,2);
assert.equal(contract.eprolo_state.global_unique_shadow_candidates,15);
assert.deepEqual(contract.eprolo_state.shipping_discovery_markets,["IL","DE","FR","IT","ES","NL","GB","US","CA","AU","AE","JP","SG","SE","DK","FI","AT","BE","PL","PT","IE","CZ","GR","NO","CH","NZ","KR","HK","MY","TH","SA","MX","BR"]);
assert.deepEqual(contract.eprolo_state.mapped_policy_shadow_markets,["IL","DE","FR","IT","ES","NL","GB","US","AU","SE","DK","FI","AT","BE","PL","PT","IE","CZ","GR"]);
assert.deepEqual(contract.eprolo_state.unmapped_policy_hold_markets,["CA","AE","JP","SG","NO","CH","NZ","KR","HK","MY","TH","SA","MX","BR"]);
assert.equal(contract.eprolo_state.global_live_eligible_products,0);
assert.equal(contract.eprolo_state.persisted_catalog_discovery_enabled,false);
assert.equal(contract.eprolo_state.global_markets_checked,33);
assert.equal(contract.eprolo_state.markets_with_shipping_pass,33);
assert.equal(contract.eprolo_state.global_market_matrix.length,33);
assert(contract.eprolo_state.global_market_matrix.every(x=>x.real_money_live===false));
assert.equal(contract.eprolo_state.global_product_market_shadow.products,15);
assert.equal(contract.eprolo_state.global_product_market_shadow.countries_represented,33);
assert.equal(contract.eprolo_state.global_product_market_shadow.possible_product_market_pairs,495);
assert.equal(contract.eprolo_state.global_product_market_shadow.shipping_shadow_product_market_pairs,455);
assert.equal(contract.eprolo_state.global_product_market_shadow.policy_mapped_shadow_pairs,281);
assert.equal(contract.eprolo_state.global_product_market_shadow.policy_hold_shadow_pairs,174);
assert.equal(contract.eprolo_state.global_product_market_shadow.full_33_market_matrix,true);
assert.equal(contract.eprolo_state.global_product_market_shadow.live_product_market_pairs,0);
assert.equal(contract.eprolo_state.global_wave2_checked_products,7);
assert.deepEqual(contract.eprolo_state.shipping_discovery_markets,["IL","DE","FR","IT","ES","NL","GB","US","CA","AU","AE","JP","SG","SE","DK","FI","AT","BE","PL","PT","IE","CZ","GR","NO","CH","NZ","KR","HK","MY","TH","SA","MX","BR"]);
assert.equal(contract.eprolo_state.shipping_pass_counts.SG,15);
assert.equal(contract.eprolo_state.shipping_pass_counts.DE,15);
assert.equal(contract.eprolo_state.shipping_pass_counts.US,15);
assert.equal(contract.eprolo_state.market_policy_states.CA,"HOLD_UNMAPPED");
assert.equal(contract.eprolo_state.market_policy_states.DE,"REVIEW_REQUIRED");
assert.equal(contract.global_operating_model.country_unit,"ISO_3166_1_ALPHA2");
assert.equal(contract.global_operating_model.live_rule.includes("every independent gate"),true);

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
