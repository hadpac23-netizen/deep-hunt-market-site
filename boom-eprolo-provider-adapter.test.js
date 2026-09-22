const fs=require("fs"),assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-eprolo-provider-adapter-contract.json","utf8"));
const adapters=JSON.parse(fs.readFileSync("boom-provider-adapters-contract.json","utf8"));
const registry=JSON.parse(fs.readFileSync("boom-agent-registry.json","utf8"));
const evidence=JSON.parse(fs.readFileSync("evidence/HUNT-EPROLO-CONNECTION-AUDIT-2026-09-22.json","utf8"));
const catalog=fs.readFileSync("supabase/functions/hunt-catalog-build/index.ts","utf8");
const storefront=fs.readFileSync("supabase/functions/hunt-storefront/index.ts","utf8");

assert.equal(contract.provider,"EPROLO");
assert.equal(contract.mode,"SIGNED_API_CONNECTED_READ_ONLY");
assert.equal(contract.authority,"GATED");
assert.equal(contract.credentials.credentials_in_repo,false);
assert.deepEqual(contract.credentials.canonical_env,["EPROLO_API_KEY","EPROLO_API_SECRET"]);
assert.equal(contract.api_truth.categories.status,"PASS");
assert.equal(contract.api_truth.categories.count,10);
assert.equal(contract.api_truth.categories_level2.count,193);
assert.equal(contract.staged_catalog.unique_candidates,7252);
assert.equal(contract.staged_catalog.checkout_status,"PRODUCT_DETAIL_RECHECK_REQUIRED");
assert.equal(contract.staged_catalog.shipping_status,"PENDING_DESTINATION_QUOTE");
assert.equal(contract.staged_catalog.profit_gate_status,"PENDING_DESTINATION_QUOTE");

assert.equal(adapters.version,"HUNT-PROVIDER-ADAPTERS-V2");
assert.deepEqual(adapters.providers.EPROLO.required_credential_env,["EPROLO_API_KEY","EPROLO_API_SECRET"]);
assert.equal(adapters.providers.EPROLO.api_status,"CONNECTED_READ_ONLY");
assert.equal(adapters.providers.EPROLO.fulfillment,"DISABLED");

const map=registry.legacy_manager_map.find(x=>x.legacy_id==="supplier-eprolo");
assert(map);
assert.equal(map.new_owner,"commerce_truth_brain");
assert.equal(map.new_role,"supplier_connector_adapter");
assert.equal(map.authority,"GATED");

assert(catalog.includes('EPROLO_API_KEY'));
assert(catalog.includes('EPROLO_API_SECRET'));
assert(catalog.includes('SIGNED_API_READY'));
assert(catalog.includes('shipping_proof:"PENDING_DESTINATION_QUOTE"'));
assert(catalog.includes('fulfillment:"DISABLED"'));

assert(storefront.includes('EPROLO: {'));
assert(storefront.includes('Signed EPROLO API credentials are connected for read-only catalog work.'));
assert(storefront.includes('Exact product detail, destination shipping, profit gate and Owner approval remain required before shelf or checkout activation.'));
assert(!/EPROLO[\s\S]{0,600}ONSITE_CAPABLE/.test(storefront),"EPROLO must not be onsite-capable yet");

assert.equal(evidence.result,"CONNECTED_TO_SUPPLIER_MESH_READ_ONLY");
assert.equal(evidence.production_effect,false);
assert.equal(evidence.gates.checkout,"DISABLED");
assert.equal(evidence.gates.fulfillment,"DISABLED");
assert.equal(evidence.gates.owner_gate,"REQUIRED");
assert.equal(evidence.secrets.secrets_copied_into_repo,false);

console.log("PASS boom-eprolo-provider-adapter");
