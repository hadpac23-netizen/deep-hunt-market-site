const assert=require("node:assert/strict");
const fs=require("node:fs");
const Stylist=require("./boom-stylist-core.js");

const mission=Stylist.createMission({
  anchor:{provider:"CJdropshipping",item_id:"d1",category:"women-dresses",title:"Dress",price:80},
  occasion:"event",budget:220,country:"DE",
  context:{recent_categories:["bags"],saved_categories:["jewelry-earrings"]}
});

assert.equal(mission.occasion,"event");
assert.ok(mission.target_categories.includes("women-shoes"));
assert.ok(mission.target_categories.includes("jewelry-earrings"));
assert.equal(mission.requires_country_product_truth,true);
assert.equal(mission.exact_fit_claim,false);
assert.equal(mission.budget.budget_total,220);
assert.equal(mission.budget.anchor_reserved,80);
assert.ok(mission.why.some(x=>x.reason.includes("delivery verification")));
assert(!/thin|weight|body|attract/i.test(JSON.stringify(mission)),"body judgement language must not appear");

const look=Stylist.lookLockerEntry({
  anchor:{provider:"CJdropshipping",item_id:"d1",category:"women-dresses",title:"Dress"},
  items:[{provider:"HyperSKU",item_id:"b1",category:"bags",title:"Bag"}],
  occasion:"event",budget:220
});
assert.equal(look.items.length,1);
assert.equal(look.stores_source_photo,false);

const html=fs.readFileSync("index.html","utf8");
assert(html.includes("boom-stylist-core.js?v=alpha1"),"Stylist core not loaded");
console.log("BOOM Stylist Core tests: PASS");
