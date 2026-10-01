const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-runtime-source-manifest.json"),"utf8"));
const expected=[
  "hunt-payment-session",
  "hunt-order-orchestrator",
  "hunt-storefront",
  "hunt-cj-quote",
  "hunt-cj-live-check",
  "hunt-eprolo-country-shadow",
  "hunt-eprolo-readonly-pilot",
  "hunt-eprolo-variant-country-audit-shadow",
  "hunt-eprolo-product-country-variants-audit-shadow"
];

test("CJ and EPROLO launch-critical runtime sources are committed to Git",()=>{
  const bySlug=new Map(manifest.functions.map(x=>[x.slug,x]));
  for(const slug of expected){
    assert.ok(bySlug.has(slug),slug+" missing from runtime manifest");
    const row=bySlug.get(slug);
    assert.ok(fs.existsSync(path.join(root,row.git_path)),slug+" source missing from Git");
    assert.equal(row.live_status,"ACTIVE");
    assert.ok(["EXACT_MATCH","PATCHED_AHEAD_OF_RUNTIME"].includes(row.relationship));
  }
});

test("runtime manifest makes undeployed launch patches explicit",()=>{
  const bySlug=new Map(manifest.functions.map(x=>[x.slug,x]));
  for(const slug of ["hunt-payment-session","hunt-order-orchestrator","hunt-storefront","hunt-eprolo-country-shadow"]){
    assert.equal(bySlug.get(slug)?.relationship,"PATCHED_AHEAD_OF_RUNTIME");
  }
});

test("runtime manifest never stores credentials",()=>{
  const raw=JSON.stringify(manifest);
  assert.doesNotMatch(raw,/openApiSecret|service_role|PAYPLUS_SECRET_KEY|hunt_eprolo_api_secret/i);
});


test("freshness runner and watcher are explicit branch-only runtime gaps",()=>{
  const bySlug=new Map(manifest.functions.map(x=>[x.slug,x]));
  for(const slug of ["hunt-freshness-shadow-runner","hunt-supplier-ops-watch-shadow"]){
    assert.equal(bySlug.get(slug)?.live_status,"NOT_DEPLOYED");
    assert.equal(bySlug.get(slug)?.relationship,"PR26_BRANCH_ONLY");
    assert.ok(fs.existsSync(path.join(root,bySlug.get(slug)?.git_path||"")));
  }
});

test("manifest records the audited live versions instead of stale launch notes",()=>{
  const bySlug=new Map(manifest.functions.map(x=>[x.slug,x]));
  assert.equal(bySlug.get("hunt-payment-session")?.live_version,26);
  assert.equal(bySlug.get("hunt-order-orchestrator")?.live_version,25);
  assert.equal(bySlug.get("hunt-storefront")?.live_version,140);
  assert.equal(bySlug.get("hunt-eprolo-country-shadow")?.live_version,12);
});
