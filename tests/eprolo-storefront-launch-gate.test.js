const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const entry=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/index.ts"),"utf8");
const runtime=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/runtime.ts"),"utf8");
const src=entry+"\n"+runtime;

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


test("EPROLO PDP reuses one DB client and prefers the configured transaction pooler",()=>{
  assert.match(entry,/HUNT_DB_POOLER_URL/);
  assert.match(entry,/Deno\.env\.set\("SUPABASE_DB_POOLER_URL", huntDbPoolerUrl\)/);
  assert.match(runtime,/SUPABASE_DB_POOLER_URL/);
  assert.match(runtime,/let eproloSqlClientInstance/);
  assert.match(runtime,/if \(eproloSqlClientInstance\) return eproloSqlClientInstance/);
  assert.match(runtime,/prepare:false/);
  assert.match(runtime,/max:1/);
  assert.match(runtime,/connect_timeout:10/);
  assert.match(runtime,/max_lifetime:600/);
  assert.doesNotMatch(runtime,/await sql\.end\(/);
  assert.doesNotMatch(runtime,/connect_timeout:20,idle_timeout:3,max_lifetime:60/);
});


test("EPROLO PDP never promotes PROFIT_REVIEW to PASS or purchasable",()=>{
  assert.match(src,/profit_gate_status:exact\?\(cleanText\(source\?\.profit_gate_v2\?\.status\)\|\|"REVIEW"\):"REVIEW"/);
  assert.match(src,/retail_price_verified:false/);
  assert.match(src,/purchasable:false/);
  assert.doesNotMatch(src,/profit_gate_status:exact\?"PASS":"REVIEW"/);
});
