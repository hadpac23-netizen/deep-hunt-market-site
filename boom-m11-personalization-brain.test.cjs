const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const brain=fs.readFileSync("boom-personalization-brain.js","utf8");

for(const token of [
  'M11 · PERSONALIZATION BRAIN',
  'id="bg-personalization-state"',
  'id="bg-personalization-stats"',
  'id="bg-personalization-readiness"',
  'id="bg-personalization-sample"',
  'boom-personalization-brain.js?v=m11'
]) assert(html.includes(token),"M11 Studio surface missing: "+token);

for(const token of [
  "function personalizationReadiness",
  "function renderPersonalization",
  "renderPersonalization(data);",
  "holdout_ready:false",
  "market_eligibility_ready:false"
]) assert(js.includes(token),"M11 Studio guard missing: "+token);

for(const token of [
  "SENSITIVE_KEYS",
  "sanitizeProfile",
  "reduced_personalization",
  "max_per_category",
  "max_per_supplier",
  "exploration_share",
  "non_personalized_holdout_missing",
  "ranking_enabled:false",
  "external_actions:false",
  "execute:false"
]) assert(brain.includes(token),"M11 brain contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/.test(brain),"M11 must not perform network or database actions");
console.log("boom_m11_personalization_contract=PASS");