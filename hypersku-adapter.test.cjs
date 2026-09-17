const assert=require("node:assert/strict");
const Core=require("./hunt-supplier-core.js");
const Hyper=require("./hypersku-adapter.js");
const Decision=require("./boom-decision-brain.js");

const now="2026-09-18T00:00:00.000Z";
const product=Hyper.normalizeReadModel({
  product_id:"hs-1",
  sku:"HS-BAG-BLK",
  variant_id:"v1",
  title:"Test Bag",
  category:"bags",
  images:["https://example.com/bag.jpg"],
  supplier_cost:10,
  currency:"USD",
  stock:12,
  stock_checked_at:now,
  source_checked_at:now,
  warehouse:"EU-TEST",
  destination_country:"DE",
  shipping_method:"tracked",
  shipping_cost:5,
  eta_min_days:4,
  eta_max_days:7,
  landed_cost:15,
  margin_ratio:.25
});

assert.equal(product.provider,"hypersku");
assert.equal(product.item_id,"hs-1");
assert.equal(product.variant_id,"v1");

const valid=Core.validateProduct(product,{now:new Date(now).getTime(),maxAgeMs:60*60*1000});
assert.equal(valid.valid,true);
assert.deepEqual(valid.issues,[]);

const candidate=Core.toDecisionCandidate(product,{
  now:new Date(now).getTime(),
  maxAgeMs:60*60*1000,
  relevance:.8,affinity:.7,quality:.9,shipping_score:.85,
  trust_score:.8,freshness:.9,novelty:.5,creative_performance:.4
});
assert.equal(candidate.truth_status,"verified");
assert.equal(candidate.shipping_eligible,true);

const decision=Decision.scoreCandidate(candidate,{interactions:30},0);
assert.equal(decision.eligible,true);
assert.ok(decision.score>0);

const quote=Hyper.buildQuoteIntent({sku:"HS-BAG-BLK",country:"DE",quantity:2});
assert.equal(quote.valid,true);
assert.equal(quote.destination_country,"DE");

assert.equal(Hyper.normalizeOrderStatus("Pending Payment"),"AWAITING_SUPPLIER_PAYMENT");
assert.equal(Hyper.normalizeOrderStatus("Shipped"),"SHIPPED");
assert.equal(Hyper.normalizeError({message:"No shipping available"}).code,"SHIPPING_UNAVAILABLE");

const stale=Core.toDecisionCandidate({...product,source_checked_at:"2026-09-17T00:00:00.000Z"},{
  now:new Date(now).getTime(),maxAgeMs:60*60*1000
});
assert.equal(stale.truth_status,"RECHECK_REQUIRED");

console.log("HyperSKU adapter + Decision Brain tests: PASS");
