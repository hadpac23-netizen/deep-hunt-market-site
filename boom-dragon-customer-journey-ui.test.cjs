const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("boom-ai-studio.html","utf8");
const ui=fs.readFileSync("boom-dragon-customer-journey-ui.js","utf8");
const css=fs.readFileSync("boom-dragon-customer-journey.css","utf8");
assert(html.includes("boom-dragon-customer-journey.js"));
assert(html.includes("boom-dragon-customer-journey-ui.js"));
for(const x of ["View","Save","Cart","Checkout","Buyer","Repeat","TEST-CONTAMINATED","SERVER PREP"])assert(ui.includes(x),x+" missing");
assert(css.includes(".dc-customer-journey-badge"));
console.log("DRAGON Customer Journey UI contract: PASS");