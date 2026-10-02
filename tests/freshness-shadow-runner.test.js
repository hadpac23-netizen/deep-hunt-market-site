const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.resolve(__dirname,"../supabase/functions/hunt-freshness-shadow-runner/index.ts"),"utf8");

test("freshness runner is limited to CJ plus EPROLO launch-core candidates",()=>{
  assert.match(src,/CJdropshipping/);
  assert.match(src,/EPROLO/);
  assert.match(src,/PARTIAL_MARKET_READY/);
  assert.match(src,/private\.hunt_pdp_qa_runs/);
  assert.match(src,/qa_status='PASS'/);
  assert.match(src,/pdp_detail_gate/);
});

test("runner rechecks exact variant stock shipping and current supplier cost",()=>{
  assert.match(src,/hunt-cj-quote/);
  assert.match(src,/hunt-storefront/);
  assert.match(src,/hunt-eprolo-country-shadow/);
  assert.match(src,/supplier_cost_usd/);
  assert.match(src,/shipping_verified/);
  assert.match(src,/stock_verified/);
});

test("runner recomputes profit but never claims final tax-verified profit",()=>{
  assert.match(src,/function economics/);
  assert.match(src,/destination_tax_verified:false/);
  assert.match(src,/final_profit_verified:false/);
  assert.match(src,/PROFIT_REVIEW/);
  assert.match(src,/PROFIT_BLOCK/);
});

test("runner defaults to dry-run and never changes commerce activation",()=>{
  assert.match(src,/const persist=body\?\.persist===true/);
  assert.match(src,/mode:persist\?"SHADOW_PERSIST":"DRY_RUN"/);
  assert.match(src,/payment_changed:false/);
  assert.match(src,/supplier_order_changed:false/);
  assert.match(src,/catalog_visibility_changed:false/);
  assert.match(src,/sellable_changed:false/);
  assert.match(src,/production_effect:false/);
});

test("runner classifies failures into the exception ledger",()=>{
  assert.match(src,/OUT_OF_STOCK/);
  assert.match(src,/NO_SHIPPING/);
  assert.match(src,/SUPPLIER_API_RETRY/);
  assert.match(src,/hunt_ops_exceptions/);
});


test("runner contains per-item persistence failures and uses internal EPROLO auth",()=>{
  assert.match(src,/persist_error=clean/);
  assert.match(src,/HUNT_EPROLO_INTERNAL_TOKEN/);
  assert.match(src,/x-hunt-internal-token/);
  assert.match(src,/try\{[\s\S]*persistTransition[\s\S]*\}catch/);
});

test("freshness transition is atomic and serialized per variant route",()=>{
  assert.match(src,/sql\(\)\.begin\(async tx=>/);
  assert.match(src,/pg_advisory_xact_lock/);
  assert.match(src,/payload->>'evidence_version'/);
  assert.match(src,/persistTransition/);
  assert.doesNotMatch(src,/await persistObservation[\s\S]*await syncException/);
});

test("older PASS cannot supersede a newer HOLD",async()=>{
  const {freshnessEvidenceDisposition}=await import("../supabase/functions/_shared/freshness-order.mjs");
  assert.equal(
    freshnessEvidenceDisposition("2026-10-02T05:01:00.000Z","new-hold","2026-10-02T05:00:00.000Z","old-pass"),
    "STALE_EVIDENCE_REJECTED"
  );
});

test("older HOLD cannot supersede a newer PASS",async()=>{
  const {freshnessEvidenceDisposition}=await import("../supabase/functions/_shared/freshness-order.mjs");
  assert.equal(
    freshnessEvidenceDisposition("2026-10-02T05:01:00.000Z","new-pass","2026-10-02T05:00:00.000Z","old-hold"),
    "STALE_EVIDENCE_REJECTED"
  );
});

test("identical evidence replay is idempotent",async()=>{
  const {freshnessEvidenceDisposition}=await import("../supabase/functions/_shared/freshness-order.mjs");
  assert.equal(
    freshnessEvidenceDisposition("2026-10-02T05:01:00.000Z","same-v1","2026-10-02T05:01:00.000Z","same-v1"),
    "IDEMPOTENT_REPLAY"
  );
});

test("equal-time different evidence fails closed instead of racing",async()=>{
  const {freshnessEvidenceDisposition}=await import("../supabase/functions/_shared/freshness-order.mjs");
  assert.equal(
    freshnessEvidenceDisposition("2026-10-02T05:01:00.000Z","winner","2026-10-02T05:01:00.000Z","loser"),
    "STALE_EVIDENCE_REJECTED"
  );
});

test("persistence failure is explicit and dry-run still has zero mutation",()=>{
  assert.match(src,/persist_status="PERSISTENCE_INCOMPLETE"/);
  assert.match(src,/const persist=body\?\.persist===true/);
  assert.match(src,/if\(persist\)\{/);
  assert.match(src,/mode:persist\?"SHADOW_PERSIST":"DRY_RUN"/);
});
