const assert=require("node:assert/strict");
const Marketing=require("./boom-marketing-brain.js");
const Creative=require("./boom-creative-brain.js");
const Seo=require("./boom-seo-brain.js");
const Love=require("./boom-love-engine.js");
const Publisher=require("./boom-everywhere-publisher.js");
const Learning=require("./boom-learning-loop.js");

const plan={funnel:{sessions:3},launch:{canRunPaidMarketing:false},rankedDeals:[
  {provider:"CJdropshipping",item_id:"x1",title_snapshot:"Test Dress",current_price:19.99,currency:"USD",
   truth_status:"verified",discount_percent:15,boom:{eligibleForPromotion:true}}
]};
const market=Marketing.build({plan,data:{}});
assert.equal(market.primary.channel,"seo");
assert.equal(market.channels.find(x=>x.channel==="paid_media").locked,true);

const drafts=Creative.draftsForDeal(plan.rankedDeals[0]);
assert.equal(drafts.length,4);
assert.match(drafts[0].body,/verified price drop/);
assert.equal(Creative.draftsForDeal({boom:{eligibleForPromotion:false}}).length,0);

const seo=Seo.evaluate({title:true,description:true,canonical:false,indexable:true,structuredData:false,internalLinks:true,sitemap:false});
assert.ok(seo.score<100);
assert.ok(seo.missing.includes("canonical"));

const love=Love.measure({unique_sessions:10,product_views:100,likes:4,saves:3,add_to_cart:5});
assert.equal(love.confidence,"medium");
assert.ok(love.score>0);

const pub=Publisher.buildDrafts(drafts,"2026-09-15");
assert.equal(pub.length,4);
assert.equal(pub[0].ownerApproved,false);
assert.match(pub[0].utm.utm_campaign,/boom-2026-09-15/);

assert.equal(Learning.decide({paid:true,owner_approval_status:"required",status:"ready"},{}).decision,"hold");
assert.equal(Learning.decide({paid:false,owner_approval_status:"not_required",status:"ready"},{}).decision,"run");
assert.equal(Learning.decide({paid:false,status:"testing",min_sample_size:500},{sampleSize:100}).decision,"collect");

console.log("BOOM brain tests: PASS");