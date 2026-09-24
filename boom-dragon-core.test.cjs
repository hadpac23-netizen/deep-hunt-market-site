const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("boom-ai-studio.html","utf8"),css=fs.readFileSync("boom-dragon-core.css","utf8"),js=fs.readFileSync("boom-dragon-core.js","utf8");
assert(html.includes('data-tab="dragon-control-room"'));
assert(html.includes('id="dragon-control-room"'));
assert(html.includes("DRAGON CORE"));
for(const x of ["Owner","Pro Studio","Brain","Professional","Brand Factory","Connect","Executions","Evaluations","Learning"])assert(js.includes(x),x+" module missing");
for(const x of ["Customers","Products","Orders","Profit","Owner Gate","F35","F50","F60T","BOOM Stylist","Verifier"])assert(js.includes(x),x+" node missing");
assert(css.includes("radial-gradient"));
console.log("DRAGON CORE unified contract: PASS");