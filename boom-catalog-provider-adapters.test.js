const fs=require("fs"),assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-catalog-build/index.ts","utf8");
const gate=JSON.parse(fs.readFileSync("boom-cj-retail-price-gate-v2-contract.json","utf8"));
const adapters=JSON.parse(fs.readFileSync("boom-provider-adapters-contract.json","utf8"));

assert(src.includes('PRINTFUL_API_TOKEN'),"Printful token gate missing");
assert(src.includes('PRINTFUL_STORE_ID'),"Printful store gate missing");
assert(src.includes('h["Authorization"]="Bearer "+token'),"Printful Bearer auth missing");
assert(src.includes('h["X-PF-Store-Id"]=store'),"Printful store header missing");
assert(src.includes('READ_ONLY_STORE_ACCESS_VERIFIED'),"Printful read-only probe missing");

assert(src.includes('GOOTEN_RECIPE_ID'),"Gooten RecipeID gate missing");
assert(src.includes('productvariants'),"Gooten read-only variant probe missing");
assert(src.includes('u.searchParams.set("recipeid",recipe)'),"Gooten recipeid query missing");
assert(!src.includes('GOOTEN_PARTNER_BILLING_KEY'),"Catalog path must not use Gooten order secret");
assert(!/api\.print\.io\/.*orders/i.test(src),"Catalog path must not submit Gooten orders");
assert(!/api\.printful\.com\/orders/i.test(src),"Catalog path must not submit Printful orders");

assert(src.includes('shipping_proof:"NOT_VERIFIED"'),"Shipping must remain unverified");
assert(src.includes('fulfillment:"DISABLED"'),"Fulfillment must remain disabled");
assert(src.includes('mode:"SHADOW",authority:"NONE",production_price_changes:0'),"Price Gate V2 must remain shadow-only");
assert.equal(gate.mode,"SHADOW");
assert.equal(gate.authority,"NONE");
assert.equal(gate.current_review.price_changes_applied_to_production,0);
assert.equal(adapters.mode,"STAGED_READ_ONLY");
assert.equal(adapters.authority,"NONE");
assert.equal(adapters.production_deploy,false);
assert.equal(adapters.credentials_in_repo,false);
assert.deepEqual(adapters.providers.Printful.required_credential_env,["PRINTFUL_API_TOKEN"]);
assert.deepEqual(adapters.providers.Printful.optional_credential_env,["PRINTFUL_STORE_ID"]);
assert.equal(adapters.providers.Gooten.partner_billing_key_used_for_catalog,false);

console.log("HUNT Catalog Provider Adapters: PASS — read-only credential gates staged; no fulfillment or Production repricing enabled");