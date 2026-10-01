const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const entry=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/index.ts"),"utf8");
const runtime=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/runtime.ts"),"utf8");
const src=entry+"\n"+runtime;
const pdpRpcMigration=fs.readFileSync(path.join(root,"supabase/migrations/20261001034500_hunt_eprolo_strict_pdp_rpc_v1.sql"),"utf8");

test("EPROLO PDP blocks only obvious taxonomy conflicts before launch",()=>{
  assert.match(src,/function eproloObviousTaxonomyConflict/);
  assert.match(src,/isPhoneCase/);
  assert.match(src,/isFootwear/);
  assert.match(src,/isToy/);
  assert.match(src,/isWatch/);
  assert.match(src,/isApparel/);
  assert.match(src,/if\(eproloObviousTaxonomyConflict\(title,launchShelf\)\)return null/);
});

test("EPROLO PDP surfaces media and variant-load quality flags without faking readiness",()=>{
  assert.match(src,/LIMITED_GALLERY/);
  assert.match(src,/LARGE_VARIANT_SET/);
  assert.match(src,/final_profit_verified:false/);
  assert.match(src,/production_effect:false/);
});


test("phone-case guard excludes keychains and passport/document covers",()=>{
  assert.match(src,/key\\s\?chain\|keychain\|bag pendant\|passport\|document case\|card holder/);
  assert.doesNotMatch(src,/mobile case\|protective cover/);
});


test("EPROLO PDP uses a service-role RPC and Edge secrets instead of a raw Postgres pooler",()=>{
  assert.doesNotMatch(entry,/Deno\.env\.set/);
  assert.doesNotMatch(runtime,/npm:postgres/);
  assert.doesNotMatch(runtime,/eproloSqlClient/);
  assert.doesNotMatch(runtime,/HUNT_DB_POOLER_URL|SUPABASE_DB_POOLER_URL/);
  assert.doesNotMatch(runtime,/vault\.decrypted_secrets/);
  assert.match(runtime,/hunt_eprolo_strict_pdp_candidate_v1/);
  assert.match(runtime,/HUNT_EPROLO_API_KEY/);
  assert.match(runtime,/HUNT_EPROLO_API_SECRET/);
  assert.match(runtime,/mode:"supabase_rpc"/);
});

test("strict PDP RPC is service-role-only, search-path locked, and preserves launch gates",()=>{
  assert.match(pdpRpcMigration,/security definer/i);
  assert.match(pdpRpcMigration,/set search_path = ''/i);
  assert.match(pdpRpcMigration,/revoke all on function public\.hunt_eprolo_strict_pdp_candidate_v1\(text\) from public/i);
  assert.match(pdpRpcMigration,/from anon/i);
  assert.match(pdpRpcMigration,/from authenticated/i);
  assert.match(pdpRpcMigration,/grant execute on function public\.hunt_eprolo_strict_pdp_candidate_v1\(text\) to service_role/i);
  for(const signature of [
    "provider='EPROLO'","production_effect=false","availability_verified=true",
    "catalog_safety_status","image_technical_status","latest_market5_all_pass",
    "taxonomy_gate_v2","profit_gate_v2","PROFIT_REVIEW",
    "MARKET5_READY_STYLE_PHYSICAL_PENDING",
    "MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING",
    "MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED"
  ]) assert.ok(pdpRpcMigration.includes(signature),`RPC migration missing ${signature}`);
});


test("EPROLO PDP never promotes PROFIT_REVIEW to PASS or purchasable",()=>{
  assert.match(src,/profit_gate_status:exact\?\(cleanText\(source\?\.profit_gate_v2\?\.status\)\|\|"REVIEW"\):"REVIEW"/);
  assert.match(src,/retail_price_verified:false/);
  assert.match(src,/purchasable:false/);
  assert.doesNotMatch(src,/profit_gate_status:exact\?"PASS":"REVIEW"/);
});
