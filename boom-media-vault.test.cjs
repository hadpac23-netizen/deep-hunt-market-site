const assert=require("node:assert");const fs=require("node:fs");const path=require("node:path");const {pathToFileURL}=require("node:url");
(async()=>{const core=await import(pathToFileURL(path.resolve("supabase/functions/hunt-boom-media-vault/vault-core.mjs")));
const p=core.planVaultAsset({source_verified:true,generation_completed:true,mission_id:"BF-IL-0001",asset_id:"S2-4",mime_type:"video/mp4"});
assert.equal(p.storage_bucket,"boom-media-vault");assert.equal(p.public_url,null);assert.equal(p.private_only,true);assert.match(p.storage_path,/^missions\/BF-IL-0001\/S2-4\.mp4$/);
assert.throws(()=>core.planVaultAsset({source_verified:false,generation_completed:true,mission_id:"x",asset_id:"y",mime_type:"video/mp4"}),/PRODUCT_TRUTH_REVERIFY_REQUIRED/);
assert.throws(()=>core.assertTransition("STORED_PENDING_QA","OWNER_APPROVED"),/VAULT_TRANSITION_BLOCKED/);assert(core.assertTransition("QA_PASSED","OWNER_APPROVED"));
const good=core.postGenerationQA({stored_private:true,aspect_ratio:"9:16",duration_seconds:3,product_fidelity:true,no_unverified_claims:true,no_fake_reviews:true,no_unintended_branding:true,no_major_visual_defects:true});
assert.equal(good.status,"QA_PASSED");assert.equal(good.publishing_allowed,false);assert.equal(good.owner_approval_required,true);
const bad=core.postGenerationQA({...good,stored_private:true,aspect_ratio:"9:16",duration_seconds:3,product_fidelity:false,no_unverified_claims:true,no_fake_reviews:true,no_unintended_branding:true,no_major_visual_defects:true});assert.equal(bad.status,"QA_FAILED");assert(bad.failed_gates.includes("product_fidelity"));
const sql=fs.readFileSync(globMig(),"utf8");assert(sql.includes("'boom-media-vault'"));assert(sql.includes("public = false"));assert(sql.includes("enable row level security"));assert(!/for insert\s+to authenticated/i.test(sql),"client insert policy must not exist");
const edge=fs.readFileSync("supabase/functions/hunt-boom-media-vault/index.ts","utf8");assert(edge.includes("isAdmin"));assert(!edge.includes("createSignedUrl"));assert(!edge.includes("publicUrl"));console.log("boom_media_vault_tests=PASS");
function globMig(){return fs.readdirSync("supabase/migrations").filter(x=>x.includes("boom_media_vault.sql")).sort().pop().replace(/^/,"supabase/migrations/")}
})().catch(e=>{console.error(e);process.exit(1)});
