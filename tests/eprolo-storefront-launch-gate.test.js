const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/index.ts"),"utf8");

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


test("EPROLO PDP reuses one DB client and prefers the transaction pooler",()=>{
  assert.match(src,/SUPABASE_DB_POOLER_URL/);
  assert.match(src,/let eproloSqlClientInstance/);
  assert.match(src,/if \(eproloSqlClientInstance\) return eproloSqlClientInstance/);
  assert.match(src,/prepare:false/);
  assert.match(src,/max:1/);
  assert.match(src,/connect_timeout:10/);
  assert.match(src,/max_lifetime:600/);
  assert.doesNotMatch(src,/await sql\.end\(/);
  assert.doesNotMatch(src,/connect_timeout:20,idle_timeout:3,max_lifetime:60/);
});
