const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("boom-ai-studio.html","utf8");
const ui=fs.readFileSync("boom-dragon-decision-engine-ui.js","utf8");
assert(html.includes("boom-dragon-decision-engine.js"));
assert(html.includes("boom-dragon-decision-engine-ui.js"));
for(const x of ["READINESS","Confidence","HARD GATES","NEXT SAFE ACTION","Owner Gate"])assert(ui.includes(x),x+" missing");
console.log("DRAGON Decision Engine UI contract: PASS");