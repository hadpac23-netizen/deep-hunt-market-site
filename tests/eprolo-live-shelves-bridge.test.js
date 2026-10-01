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
const pdpRpcMigration=fs.readFileSync(path.join(root,"supabase/migrations/20261001034500_hunt_eprolo_strict_pdp_rpc_v1.sql"),"utf8");

test("category keeps EPROLO public bridge disabled while PDP runtime is held",()=>{
  assert.equal(html.includes("eprolo-shelves-bridge.js"),false);
});

test("legacy bridge is fail-closed and never fetches or merges EPROLO shelves",()=>{
  assert.match(bridge,/const original=H\.storefront\.bind\(H\)/);
  assert.match(bridge,/public_display_enabled:false/);
  assert.match(bridge,/PDP_RUNTIME_CREDENTIALS_NOT_READY/);
  assert.doesNotMatch(bridge,/fetch\(/);
  assert.doesNotMatch(bridge,/mergeShelves|mergeRows/);
});

test("legacy EPROLO shelf endpoint remains authenticated source-only and is not loaded by category",()=>{
  assert.equal(html.includes("eprolo-shelves-bridge.js"),false);
  assert.match(edge,/const PUBLIC_KEY="sb_publishable_/);
  assert.match(edge,/function authorized\(req:Request\)/);
  assert.match(edge,/req\.headers\.get\("apikey"\)/);
});

test("storefront audits canonical EPROLO shelves but does not publish them until PDP runtime is ready",()=>{
  assert.match(runtime,/import \{ eproloCanonicalMarketShelves \} from "\.\/eprolo-shelves\.ts"/);
  assert.match(runtime,/eproloCanonicalMarketShelves\(null, "supabase_rpc"\)/);
  assert.doesNotMatch(runtime,/eproloSqlClient|HUNT_DB_POOLER_URL|SUPABASE_DB_POOLER_URL/);
  assert.doesNotMatch(runtime,/persistedShelves,\s*eproloCanonical\.shelves/);
  assert.match(runtime,/public_display_enabled:false/);
  assert.match(runtime,/PDP_RUNTIME_CREDENTIALS_NOT_READY/);
});

test("strict EPROLO PDP is RPC-only and service-role protected",()=>{
  assert.match(runtime,/hunt_eprolo_strict_pdp_candidate_v1/);
  assert.match(runtime,/HUNT_EPROLO_API_KEY/);
  assert.match(runtime,/HUNT_EPROLO_API_SECRET/);
  assert.doesNotMatch(runtime,/npm:postgres|eproloSqlClient|HUNT_DB_POOLER_URL|SUPABASE_DB_POOLER_URL|vault\.decrypted_secrets/);
  assert.match(pdpRpcMigration,/security definer/i);
  assert.match(pdpRpcMigration,/set search_path = ''/i);
  assert.match(pdpRpcMigration,/from public/i);
  assert.match(pdpRpcMigration,/from anon/i);
  assert.match(pdpRpcMigration,/from authenticated/i);
  assert.match(pdpRpcMigration,/to service_role/i);
  assert.match(pdpRpcMigration,/production_effect=false/);
  assert.match(pdpRpcMigration,/catalog_safety_status/);
  assert.match(pdpRpcMigration,/image_technical_status/);
  assert.match(pdpRpcMigration,/latest_market5_all_pass/);
  assert.match(pdpRpcMigration,/profit_gate_v2/);
});

test("EPROLO shelf cards remain display-only and never claim final profit",()=>{
  for(const src of [edge,moduleSrc]){
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

test("EPROLO remains shadow-only in public shelves until PDP runtime credentials are ready", () => {
  const runtime=fs.readFileSync("supabase/functions/hunt-storefront/runtime.ts","utf8");
  assert.doesNotMatch(runtime,/persistedShelves,\s*eproloCanonical\.shelves/);
  assert.match(runtime,/public_display_enabled:false/);
  assert.match(runtime,/PDP_RUNTIME_CREDENTIALS_NOT_READY/);
  assert.doesNotMatch(runtime,/EPROLO Canonical PDP Ready \(display-only\)/);
});
