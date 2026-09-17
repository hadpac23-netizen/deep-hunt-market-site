const assert=require("node:assert/strict");
const fs=require("node:fs");
const Core=require("./hunt-2037-flow-core.js");

const shelves={
  "women-tops":[{provider:"CJdropshipping",item_id:"1",title:"Top",category:"women-tops",image_url:"https://example.com/1.jpg",retail_price_verified:true,retail_price_amount:20}],
  "bags":[{provider:"HyperSKU",item_id:"2",title:"Bag",category:"bags",image_url:"https://example.com/2.jpg",availability_verified:true}],
  "jewelry-necklaces":[{provider:"EPROLO",item_id:"3",title:"Necklace",category:"jewelry-necklaces",image_url:"https://example.com/3.jpg",new_arrival:true}],
  "phone-cases":[{provider:"CJdropshipping",item_id:"4",title:"Case",category:"phone-cases",image_url:"https://example.com/4.jpg"}]
};

const model=Core.buildUnits({shelves,context:{recent_categories:["bags"],recent_suppliers:["hypersku"]},sessionSeed:"test"});
assert.ok(model.total_products>=4);
assert.ok(model.worlds.length>=2);
assert.ok(model.units.some(x=>x.lane==="personalized"));
assert.ok(model.units.some(x=>x.lane==="new"));
assert.equal(Core.laneLabel("wildcard"),"SURPRISE");

const html=fs.readFileSync("index.html","utf8");
const js=fs.readFileSync("hunt-2037-flow.js","utf8");
const css=fs.readFileSync("hunt-2037-flow.css","utf8");
const core=fs.readFileSync("hunt-2037-flow-core.js","utf8");

assert(html.includes('id="hunt-2037-flow"'),"HUNT 2037 root missing");
assert(html.includes("hunt-experience-memory.js?v=memory1"),"Memory script missing");
assert(html.includes("boom-decision-brain.js?v=brain1"),"Decision Brain script missing");
assert(html.includes("hunt-2037-flow-core.js?v=alpha1"),"Flow core script missing");
assert(html.includes("hunt-2037-flow.js?v=alpha1"),"Flow UI script missing");
assert(js.includes('searchParams.get("hunt2037")==="1"'),"URL feature flag missing");
assert(js.includes("hunt_2037_flow_enabled"),"persistent feature flag missing");
assert(js.includes("data-hunt2037-share"),"share action missing");
assert(js.includes('type:"world_enter"'),"world memory event missing");
assert(js.includes('type:"product_view"'),"product memory event missing");
assert(core.includes("Decision?.scoreCandidate"),"Decision Brain optional scoring missing");
assert(css.includes("prefers-reduced-motion"),"reduced-motion support missing");
assert(css.includes("body.hunt2037-active #hd-wow-showcase"),"fallback surface switch missing");

console.log("HUNT 2037 Flow tests: PASS");
