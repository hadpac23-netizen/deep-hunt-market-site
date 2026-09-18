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
assert.equal(Core.reasonFor({category:"bags"},"personalized",{recent_categories:["bags"]}),"Because you explored bags");
assert.equal(Core.reasonFor({category:"tech"},"wildcard",{}),"A controlled surprise outside your usual lane");

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
assert(js.includes("Style it"),"product-to-Stylist action missing");
assert(js.includes("Try in Mirror"),"eligible product-to-Mirror action missing");
assert(js.includes("function mirrorTypeFor"),"Mirror product type mapper missing");
assert(js.includes("anchor:category"),"Stylist product anchor query missing");
assert(js.includes("history.html?hunt2037=1"),"HUNT History entry missing");
assert(js.includes("Why this:"),"recommendation explainability missing");
assert(js.includes('data-provider="${H.esc(item.provider||"")}"'),"share provider metadata missing");
assert(js.includes("share.dataset.itemId"),"share item memory metadata missing");
assert(js.includes("HuntShoppingActions?.rescan?.()"),"shopping action rescan hook missing");
assert(!js.includes("PRODUCTS IN SESSION"),"visible catalog counts must stay hidden");
assert(js.includes('type:"world_enter"'),"world memory event missing");
assert(js.includes("function setWorldMode"),"world mode state controller missing");
assert(js.includes("data-world-exit"),"world mode exit control missing");
assert(js.includes("Style this world"),"world to Stylist handoff missing");
assert(js.includes('new CustomEvent("hunt:world-mode"'),"world mode event missing");
assert(js.includes('type:"product_view"'),"product memory event missing");
assert(js.includes("IntersectionObserver"),"engagement visibility observer missing");
assert(js.includes('type:"impression"'),"impression signal missing");
assert(js.includes('type:"dwell"'),"dwell signal missing");
assert(js.includes("impressionSeen"),"impression dedupe missing");
assert(js.includes("dwellSeen"),"dwell dedupe missing");
assert(js.includes("2500"),"dwell threshold missing");
assert(core.includes("Decision?.scoreCandidate"),"Decision Brain optional scoring missing");
assert(css.includes("prefers-reduced-motion"),"reduced-motion support missing");
assert(css.includes("content-visibility:auto"),"offscreen rendering optimization missing");
assert(css.includes(".hunt2037-world-mode-bar"),"world mode bar styles missing");
assert(css.includes(".hunt2037-card-actions"),"product action row styles missing");
assert(css.includes("body.hunt2037-active #hd-wow-showcase"),"fallback surface switch missing");
const visual=fs.readFileSync("hunt-2037-visual.js","utf8");
const cities=JSON.parse(fs.readFileSync("hunt-city-night-manifest.json","utf8"));
assert(html.includes("hunt-2037-visual.js?v=alpha1"),"visual engine script missing");
assert(visual.includes("hunt2037Wordmark"),"dynamic wordmark hook missing");
assert(visual.includes("hunt-city-night-manifest.json"),"city manifest loader missing");
assert(visual.includes("CITY MOOD · "),"city mood truth label missing");
assert(visual.includes('fashion:"tokyo"'),"Fashion world city mood mapping missing");
assert(visual.includes('"tech-home":"shenzhen"'),"Future Living world city mood mapping missing");
assert(visual.includes("worldLock"),"world mood scroll lock missing");
assert(css.includes("@keyframes hunt2037BrandFlow"),"dynamic HUNT animation missing");
assert(!css.includes("\\\\n"),"literal escaped newlines must not remain in CSS");
assert(cities.policy==="licensed_or_original_assets_only","city asset policy missing");
assert(cities.mode==="night_only","night-only city policy missing");
for(const city of ["Dubai","London","Tokyo","Singapore","New York","Copenhagen","Mumbai","Cape Town"])assert(cities.cities.some(x=>x.name===city),"missing city "+city);

console.log("HUNT 2037 Flow tests: PASS");
