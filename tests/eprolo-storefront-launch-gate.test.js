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
