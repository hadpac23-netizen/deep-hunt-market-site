const assert=require("node:assert");
const fs=require("node:fs");
const path=require("node:path");
const {pathToFileURL}=require("node:url");

(async()=>{
  const corePath=path.resolve("supabase/functions/hunt-boom-video-plan/plan-core.mjs");
  const {buildDryRunPlan}=await import(pathToFileURL(corePath));
  const good={
    mode:"dry_run",
    product_truth:{source_verified:true,provider:"CJdropshipping",item_id:"1",variant_id:"2",country_code:"IL",verification:{verified_at:"2026-09-17T19:00:00Z"}},
    route_plan:{execution_allowed:false,shots:[
      {id:"a",primary_provider:"runway-gen45",fallback_provider:"veo-3.1",duration_seconds:4,aspect_ratio:"9:16",mode:"image-to-video",prompt:"Product macro shot",reference_image_url:"https://example.com/product.jpg"},
      {id:"b",primary_provider:"veo-3.1",duration_seconds:6,aspect_ratio:"9:16",mode:"text-to-video",prompt:"Clean product scene"}
    ]}
  };
  const out=buildDryRunPlan(good);
  assert.equal(out.status,"DRY_RUN");
  assert.equal(out.execution_allowed,false);
  assert.equal(out.provider_calls_made,0);
  assert.equal(out.spend_authorized,false);
  assert.equal(out.dispatches.length,2);
  assert(out.dispatches.every(x=>x.execution_status==="BLOCKED_DRY_RUN"));
  assert(out.dispatches.every(x=>x.secret_present_in_response===false));
  assert(out.blockers.includes("OWNER_APPROVAL_REQUIRED"));
  assert.throws(()=>buildDryRunPlan({...good,mode:"execute"}),/DRY_RUN_ONLY/);
  assert.throws(()=>buildDryRunPlan({...good,product_truth:{...good.product_truth,source_verified:false}}),/PRODUCT_TRUTH_REVERIFY_REQUIRED/);
  assert.throws(()=>buildDryRunPlan({...good,route_plan:{...good.route_plan,execution_allowed:true}}),/ROUTE_MUST_BE_NON_EXECUTABLE/);
  const edge=fs.readFileSync("supabase/functions/hunt-boom-video-plan/index.ts","utf8");
  assert(edge.includes("isAdmin"),"admin gate missing");
  assert(edge.includes('req.method!=="POST"'),"POST-only gate missing");
  assert(!edge.includes("api.runwayml.com"),"Runway provider call must not exist in dry-run adapter");
  assert(!edge.includes("generativelanguage.googleapis.com"),"Veo provider call must not exist in dry-run adapter");
  console.log("hunt_boom_video_plan_tests=PASS");
})().catch(err=>{console.error(err);process.exit(1)});
