const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"category.html"),"utf8");
const bridge=fs.readFileSync(path.join(root,"eprolo-shelves-bridge.js"),"utf8");
const edge=fs.readFileSync(path.join(root,"supabase/functions/hunt-eprolo-shelves-readonly/index.ts"),"utf8");
const runtime=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/runtime.ts"),"utf8");
const moduleSrc=fs.readFileSync(path.join(root,"supabase/functions/hunt-storefront/eprolo-shelves.ts"),"utf8");
const rpcMigration=fs.readFileSync(path.join(root,"supabase/migrations/20260930165643_hunt_eprolo_canonical_shelves_rpc_v1.sql"),"utf8");

test("category loads the EPROLO shelf bridge before category logic",()=>{
  const bridgePos=html.indexOf("eprolo-shelves-bridge.js");
  const categoryPos=html.indexOf("category.js");
  assert.ok(bridgePos>0);
  assert.ok(categoryPos>bridgePos);
});

test("bridge prefers integrated storefront shelves and uses legacy endpoint only as fallback",()=>{
  assert.match(bridge,/String\(params\?\.shelves\|\|""\)!=="1"/);
  assert.match(bridge,/const base=await original\(params\)\|\|\{\}/);
  assert.match(bridge,/integrated\?\.source==="CANONICAL_PDP_READY"/);
  assert.match(bridge,/integrated\?\.purchasable===false/);
  assert.match(bridge,/integrated\?\.production_effect===false/);
  assert.match(bridge,/const extra=await eproloShelves\(\)/);
  assert.match(bridge,/if\(!extra\?\.shelves\)return base/);
  assert.match(bridge,/mergeShelves\(base\.shelves,extra\.shelves\)/);
});

test("legacy fallback endpoint requires the same public storefront key contract",()=>{
  assert.match(bridge,/headers:\{apikey:publishableKey,accept:"application\/json"\}/);
  assert.match(edge,/const PUBLIC_KEY="sb_publishable_/);
  assert.match(edge,/function authorized\(req:Request\)/);
  assert.match(edge,/req\.headers\.get\("apikey"\)/);
  assert.match(edge,/if\(!authorized\(req\)\)return new Response\(JSON\.stringify\(\{error:"unauthorized"\}\),\{status:401,headers\}\)/);
});

test("storefront integrates canonical EPROLO shelves without outranking live verified sources",()=>{
  assert.match(runtime,/import \{ eproloCanonicalMarketShelves \} from "\.\/eprolo-shelves\.ts"/);
  assert.match(runtime,/eproloCanonicalMarketShelves\(eproloSqlClient\(\), eproloDbConnectionMode\(\)\)/);
  assert.match(runtime,/mergeMarketShelves\(priorityCjShelves, cjShelves, persistedShelves, eproloCanonical\.shelves/);
  assert.match(runtime,/eprolo_canonical_shelves: eproloCanonical\.meta/);
});

test("EPROLO shelf cards remain display-only and never claim final profit",()=>{
  for(const src of [bridge,edge,moduleSrc]){
    assert.match(src,/purchasable:false/);
    assert.match(src,/production_effect:false/);
    assert.match(src,/final_profit_verified:0/);
  }
  for(const src of [edge,moduleSrc]){
    assert.match(src,/availability_verified:false/);
    assert.match(src,/retail_price_verified:false/);
    assert.match(src,/quote_verification_status:"HOLD"/);
    assert.match(src,/PRODUCT_DETAIL_RECHECK_REQUIRED/);
  }
});

test("canonical source preserves both readiness gates and the taxonomy conflict gate",()=>{
  for(const src of [edge,rpcMigration]){
    assert.match(src,/catalog_safety_status/);
    assert.match(src,/image_technical_status/);
    assert.match(src,/latest_market5_all_pass/);
    assert.match(src,/pdp_detail_status='PASS'/);
    assert.match(src,/qa_status='PASS'/);
    assert.match(src,/qa_variant_count>=1/);
    assert.match(src,/qa_availability_verified=true/);
    assert.match(src,/qa_retail_price_verified=true/);
    assert.match(src,/obvious_taxonomy_conflict/);
    assert.match(src,/and not obvious_taxonomy_conflict/);
  }
});

test("obvious cross-shelf and IP mismatches are quarantined before display",()=>{
  for(const src of [edge,moduleSrc]){
    assert.match(src,/CHILD_PRODUCT_IN_PETS/);
    assert.match(src,/VEHICLE_PRODUCT_IN_HOME/);
    assert.match(src,/TOY_IN_CURTAINS/);
    assert.match(src,/FOOTWEAR_IN_BELTS/);
    assert.match(src,/HOME_FIXTURE_IN_BEAUTY/);
    assert.match(src,/NON_PET_PRODUCT_IN_PET_HOUSES/);
    assert.match(src,/IP_REVIEW/);
  }
});

test("verified EPROLO aliases feed the matching canonical shelves without broad unsafe remaps",()=>{
  assert.match(moduleSrc,/"women-evening":\["dresses","women-occasionwear"\]/);
  assert.match(moduleSrc,/"women-suits":\["suits","women-tailoring"\]/);
  assert.match(moduleSrc,/"women-sleepwear":\["sleepwear","women-nightwear"\]/);
  assert.match(moduleSrc,/"men-suits":\["suits","men-tailoring"\]/);
  assert.match(moduleSrc,/"keychains":\["wallets-small-accessories","accessories"\]/);
  assert.match(moduleSrc,/"phone-cases":\["phonecases","phoneaccessories","tech","tech-accessories"\]/);
  assert.match(moduleSrc,/"chargers-cables":\["phoneaccessories","tech","tech-accessories"\]/);
  assert.match(moduleSrc,/"computer-accessories":\["tech","tech-accessories"\]/);
  assert.match(moduleSrc,/"activewear":\["sports","sports-outdoor"\]/);
  assert.match(moduleSrc,/"active-bottoms":\["activewear","sports","sports-outdoor"\]/);
  assert.match(moduleSrc,/"fitness-accessories":\["sports","sports-outdoor"\]/);
  assert.match(moduleSrc,/"curtains":\["curtains-blinds","home"\]/);
  assert.match(moduleSrc,/"rugs":\["home","rugs-runners"\]/);
  assert.match(moduleSrc,/"baby-clothing":\["kids"\]/);
  assert.match(moduleSrc,/"stands-holders":\["phoneaccessories","tech"\]/);
});

test("targeted fill is title-gated for empty canonical shelves",()=>{
  assert.match(moduleSrc,/function aliases\(department:string,shelf:string,title=""\)/);
  assert.match(moduleSrc,/out\.add\("baby-bodysuits"\)/);
  assert.match(moduleSrc,/out\.add\("newborn"\)/);
  assert.match(moduleSrc,/out\.add\("nursery"\)/);
  assert.match(moduleSrc,/out\.add\("boys"\)/);
  assert.match(moduleSrc,/out\.add\("kids-nightwear"\)/);
  assert.match(moduleSrc,/out\.add\("kids-occasionwear"\)/);
  assert.match(moduleSrc,/out\.add\("kids-swimwear"\)/);
  assert.match(moduleSrc,/out\.add\("men-shorts"\)/);
  assert.match(moduleSrc,/out\.add\("women-loungewear"\)/);
  assert.match(moduleSrc,/out\.add\("women-maternity"\)/);
  assert.match(moduleSrc,/!\/\\b\(swimsuit\|swimwear\)\\b\//);
  assert.match(moduleSrc,/!\/\\b\(halloween\|cosplay\|costume\)\\b\//);
  assert.match(moduleSrc,/aliases\(department,shelf,title\)/);
  assert.doesNotMatch(moduleSrc,/"baby-clothing":\[[^\]]*"baby-bodysuits"/);
  assert.doesNotMatch(moduleSrc,/"men-bottoms":\[[^\]]*"men-shorts"/);
});

test("integrated module uses service-role RPC instead of opening another DB connection",()=>{
  assert.match(moduleSrc,/hunt_eprolo_canonical_shelves_rows/);
  assert.match(moduleSrc,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(moduleSrc,/dbConnectionMode="supabase_rpc"/);
  assert.doesNotMatch(moduleSrc,/postgres\(/);
  assert.doesNotMatch(moduleSrc,/sql\.end\(/);
  assert.match(rpcMigration,/security definer/i);
  assert.match(rpcMigration,/set search_path = ''/i);
  assert.match(rpcMigration,/revoke all on function public\.hunt_eprolo_canonical_shelves_rows\(\) from public/i);
  assert.match(rpcMigration,/revoke all on function public\.hunt_eprolo_canonical_shelves_rows\(\) from anon/i);
  assert.match(rpcMigration,/revoke all on function public\.hunt_eprolo_canonical_shelves_rows\(\) from authenticated/i);
  assert.match(rpcMigration,/grant execute on function public\.hunt_eprolo_canonical_shelves_rows\(\) to service_role/i);
});
