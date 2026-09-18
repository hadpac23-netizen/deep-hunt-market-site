const assert=require("node:assert/strict");
const fs=require("node:fs");
const Core=require("./boom-stylist-core.js");

const html=fs.readFileSync("stylist.html","utf8");
const js=fs.readFileSync("boom-stylist-alpha.js","utf8");
const css=fs.readFileSync("boom-stylist-alpha.css","utf8");
const flow=fs.readFileSync("hunt-2037-flow.js","utf8");

assert(html.includes('id="stylist-occasion"'),"Occasion control missing");
assert(html.includes('id="stylist-budget"'),"Budget control missing");
assert(html.includes("does not judge bodies or appearance"),"Stylist safety copy missing");
assert(js.includes("Core.createMission"),"Stylist mission builder missing");
assert(html.includes("hunt-experience-memory.js?v=memory2"),"Stylist memory bridge missing");
assert(js.includes("WORLD_ANCHORS"),"World-to-Stylist anchor mapping missing");
assert(js.includes('params.get("anchor")'),"Product anchor query support missing");
assert(js.includes("Memory?.decisionContext?.()"),"Stylist must use HUNT memory context");
assert(js.includes('fashion:"women-dresses"'),"Fashion world Stylist mapping missing");
assert(js.includes('"tech-home":"home"'),"Future Living Stylist mapping missing");
assert(!/thin|weight loss|hide flaws/i.test(js+html),"harmful body styling language present");
assert(css.includes("prefers-reduced-motion"),"Stylist reduced-motion support missing");
assert(flow.includes("stylist.html?hunt2037=1"),"HUNT 2037 Stylist entry missing");

const mission=Core.createMission({anchor:{category:"women-dresses"},occasion:"event",budget:200,country:"DE"});
assert.equal(mission.requires_country_product_truth,true);
assert.equal(mission.exact_fit_claim,false);
assert.ok(mission.target_categories.length>0);

console.log("BOOM Stylist Alpha tests: PASS");
