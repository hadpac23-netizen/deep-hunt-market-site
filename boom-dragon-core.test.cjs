const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("boom-ai-studio.html","utf8"),css=fs.readFileSync("boom-dragon-core.css","utf8"),js=fs.readFileSync("boom-dragon-core.js","utf8");
for(const x of ['id="dragon-control-room"','id="dragon-core-nav"','id="dragon-core-right-panel"','id="dragon-core-search"'])assert(html.includes(x),x+" missing");
for(const x of ["DRAGON CORE","Customers","Products","Orders","Profit","Decisions","Owner Gate","F35","F50","F60T","BOOM Stylist","Verifier"])assert(js.includes(x),x+" missing");
for(const x of ["PREP","GATED","GRAPH READY","SHADOW_ONLY"])assert(js.includes(x),x+" readiness state missing");
for(const x of ["--dc-blue","--dc-orange","--dc-green","--dc-red","--dc-purple","--dc-cyan"])assert(css.includes(x),x+" palette missing");
assert(js.includes("owner-home")&&js.includes("brand-factory")&&js.includes("learning"),"legacy Studio navigation missing");
console.log("DRAGON CORE command center contract: PASS");