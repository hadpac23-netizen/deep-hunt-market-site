const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"category.html"),"utf8");
const bridge=fs.readFileSync(path.join(root,"eprolo-shelves-bridge.js"),"utf8");
const edge=fs.readFileSync(path.join(root,"supabase/functions/hunt-eprolo-shelves-readonly/index.ts"),"utf8");

test("category loads the EPROLO shelf bridge before category logic",()=>{
  const bridgePos=html.indexOf("eprolo-shelves-bridge.js");
  const categoryPos=html.indexOf("category.js");
  assert.ok(bridgePos>0);
  assert.ok(categoryPos>bridgePos);
});

test("EPROLO shelf bridge merges only shelves=1 and fails open to the existing catalog",()=>{
  assert.match(bridge,/String\(params\?\.shelves\|\|""\)!=="1"/);
  assert.match(bridge,/Promise\.allSettled/);
  assert.match(bridge,/if\(!extra\?\.shelves\)return base/);
  assert.match(bridge,/mergeShelves\(base\.shelves,extra\.shelves\)/);
});

test("EPROLO shelves require the same public storefront key contract",()=>{
  assert.match(bridge,/headers:\{apikey:publishableKey,accept:"application\/json"\}/);
  assert.match(edge,/const PUBLIC_KEY="sb_publishable_/);
  assert.match(edge,/function authorized\(req:Request\)/);
  assert.match(edge,/req\.headers\.get\("apikey"\)/);
  assert.match(edge,/if\(!authorized\(req\)\)return new Response\(JSON\.stringify\(\{error:"unauthorized"\}\),\{status:401,headers\}\)/);
});

test("EPROLO shelf cards remain display-only and never claim final profit",()=>{
  for(const src of [bridge,edge]){
    assert.match(src,/purchasable:false/);
    assert.match(src,/production_effect:false/);
    assert.match(src,/final_profit_verified:0/);
  }
  assert.match(edge,/availability_verified:false/);
  assert.match(edge,/retail_price_verified:false/);
  assert.match(edge,/quote_verification_status:"HOLD"/);
  assert.match(edge,/PRODUCT_DETAIL_RECHECK_REQUIRED/);
});

test("EPROLO shelf source uses the same canonical readiness gates",()=>{
  assert.match(edge,/catalog_safety_status/);
  assert.match(edge,/image_technical_status/);
  assert.match(edge,/latest_market5_all_pass/);
  assert.match(edge,/pdp_detail_status='PASS'/);
  assert.match(edge,/qa_status='PASS'/);
  assert.match(edge,/qa_variant_count>=1/);
  assert.match(edge,/qa_availability_verified=true/);
  assert.match(edge,/qa_retail_price_verified=true/);
});

test("obvious cross-shelf and IP mismatches are quarantined before display",()=>{
  assert.match(edge,/CHILD_PRODUCT_IN_PETS/);
  assert.match(edge,/VEHICLE_PRODUCT_IN_HOME/);
  assert.match(edge,/FOOTWEAR_IN_BELTS/);
  assert.match(edge,/HOME_FIXTURE_IN_BEAUTY/);
  assert.match(edge,/NON_PET_PRODUCT_IN_PET_HOUSES/);
  assert.match(edge,/IP_REVIEW/);
});

test("EPROLO shelf source reuses one DB client and prefers the pooler",()=>{
  assert.match(edge,/let sqlClientInstance/);
  assert.match(edge,/HUNT_DB_POOLER_URL/);
  assert.match(edge,/if\(sqlClientInstance\)return sqlClientInstance/);
  assert.match(edge,/prepare:false,max:1,connect_timeout:10,idle_timeout:20,max_lifetime:600/);
  assert.doesNotMatch(edge,/sql\.end\(/);
});