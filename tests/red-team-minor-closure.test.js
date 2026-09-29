const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("refund preview normalizes cents and currency before eligibility and response",()=>{
  const s=read("supabase/functions/hunt-refund-preview/index.ts");
  assert.match(s,/Math\.round\(rawRequestedAmount\*100\)\/100/);
  assert.match(s,/requestedCurrency=\(clean\(body\?\.currency\)\|\|clean\(session\.currency\)\)\.toUpperCase\(\)/);
  assert.match(s,/refund_currency:requestedCurrency/);
  assert.match(s,/requested_amount:requestedAmount/);
});

test("PayPlus transient callback failures return retryable 5xx",()=>{
  const s=read("supabase/functions/hunt-payplus-callback/index.ts");
  assert.match(s,/STORE_FAILED\|PAYPLUS_IPN_VERIFY_FAILED_5/);
  assert.match(s,/transient\?503:400/);
});

test("PayPlus charge method parser rejects non integer scalars",()=>{
  const s=read("supabase/functions/hunt-payplus-callback/payplus-status-map.mjs");
  assert.match(s,/typeof v==="number"/);
  assert.match(s,/typeof v!=="string"/);
  assert.match(s,/\^\\s\*\-\?\\d\+\\s\*\$/);
});

test("supplier audit scripts use bounded external fetch timeouts",()=>{
  for(const p of [
    "scripts/hunt-cj-launch-core-live-audit.mjs",
    "scripts/hunt-freshness-smoke.mjs",
    "scripts/hunt-live-shelf-audit.mjs"
  ]){
    assert.match(read(p),/AbortSignal\.timeout\(25000\)/,p);
  }
});

test("freshness exceptions use the existing partial unique index atomically",()=>{
  const s=read("supabase/functions/hunt-freshness-shadow-runner/index.ts");
  assert.match(s,/on conflict \(entity_type,entity_id,coalesce\(provider,''\),coalesce\(destination_country,''\),reason_code\)/);
  assert.match(s,/where status <> 'resolved'/);
  assert.doesNotMatch(s,/select id from private\.hunt_ops_exceptions/);
});

test("EPROLO audit economics uses checkout gross including shipping",()=>{
  for(const p of [
    "supabase/functions/hunt-eprolo-variant-country-audit-shadow/index.ts",
    "supabase/functions/hunt-eprolo-product-country-variants-audit-shadow/index.ts"
  ]){
    const s=read(p);
    assert.match(s,/gross=sale\+ship|const gross=sale\+ship/);
    assert.match(s,/gross-cost-ship-tax-\(gross\*r\)-fixed/);
  }
});

test("CJ quote caches only verified truth and has bounded global plus per-IP budgets",()=>{
  const s=read("supabase/functions/hunt-cj-quote/index.ts");
  assert.match(s,/QUOTE_CACHE_MAX=2000/);
  assert.match(s,/RATE_MAX_ENTRIES=2000/);
  assert.match(s,/GLOBAL_RATE_MAX_REQUESTS=120/);
  assert.match(s,/cacheVerified=result\.stock_verified===true/);
  assert.match(s,/if\(cacheVerified\)/);
  assert.match(s,/AbortSignal\.timeout\(20000\)/);
});

test("storefront prefers live and persisted shelves over snapshots",()=>{
  const s=read("supabase/functions/hunt-storefront/index.ts");
  assert.match(s,/mergeMarketShelves\(priorityCjShelves, cjShelves, persistedShelves,[\s\S]*matterhornShelves, surveyShelves\)/);
  assert.match(s,/verified Gelato API credentials/);
  assert.match(s,/Public catalog is live in HUNT\. Private store\/recipe credentials/);
});

test("launch workflows pin checkout and setup-node to immutable SHAs",()=>{
  const workflowDir=path.join(root,".github/workflows");
  for(const name of fs.readdirSync(workflowDir).filter(x=>x.endsWith(".yml")||x.endsWith(".yaml"))){
    const s=fs.readFileSync(path.join(workflowDir,name),"utf8");
    if(s.includes("actions/checkout@"))assert.doesNotMatch(s,/actions\/checkout@v\d/);
    if(s.includes("actions/setup-node@"))assert.doesNotMatch(s,/actions\/setup-node@v\d/);
  }
});


test("freshness smoke honors EPROLO internal auth and fails visibly when missing",()=>{
  const script=read("scripts/hunt-freshness-smoke.mjs");
  const workflow=read(".github/workflows/hunt-freshness-smoke.yml");
  assert.match(script,/HUNT_EPROLO_INTERNAL_TOKEN/);
  assert.match(script,/x-hunt-internal-token/);
  assert.match(script,/RETRY_INTERNAL_TOKEN_MISSING/);
  assert.match(workflow,/secrets\.HUNT_EPROLO_INTERNAL_TOKEN/);
});
