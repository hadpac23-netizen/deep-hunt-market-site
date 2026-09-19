const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");

for(const token of [
  'id="bg-studio-coverage-state"',
  'id="bg-studio-coverage-stats"',
  'id="bg-studio-runtime-coverage"',
  'id="bg-studio-skill-gaps"',
  'STUDIO CONTROL PLANE · COMPLETENESS'
]) assert(html.includes(token),"M10 Studio surface missing: "+token);

for(const token of [
  "function studioCoverage()",
  "function renderStudioCoverage()",
  "renderStudioCoverage();",
  '"M09","Agentic Commerce Gateway"',
  '"OPS","Marketing Brain"',
  '"LEGACY","Commerce Brain"',
  '"Personalization Brain"',
  "const existingTools=[",
  '"Marketplace seller/admin"',
  '"Storefront promotions"',
  '"Digital Marketing University"',
  'execute_actions:false',
  'owner_gate:"REVIEW_REQUIRED"'
]) assert(js.includes(token),"M10 coverage contract missing: "+token);

assert(!js.includes("studioCoverage().execute"),"M10 must remain read-only");
console.log("boom_m10_studio_control_plane=PASS");