const fs=require("node:fs");
const assert=require("node:assert/strict");

const master=fs.readFileSync("docs/F60T-YAMAM-MASTER-PROMPT.md","utf8");
const map=fs.readFileSync("docs/F60T-SKILLS-MAP.md","utf8");

for(const token of [
  "USD 10,000 VERIFIED NET PROFIT / HOUR",
  "Global Profit Heatmap",
  "Follow-the-Sun Commerce",
  "Agent Commerce Dominance",
  "Price Lift Engine",
  "No-Discount-First",
  "Profit Pressure Router",
  "Incrementality",
  "Owner Gate",
  "YAMAM Hourly Mission Board",
  "NEVER FAKE SUCCESS",
  "ALWAYS-ON WORLD WATCH LAYER — F60T-23–40",
  "Five Always-On Radars",
  "Crowd Convergence",
  "First-Thing Engine",
  "Always-On World Watch Cycle"
]) assert(master.includes(token),"Master prompt missing: "+token);

for(let i=1;i<=40;i++){
  const id="F60T-"+String(i).padStart(2,"0");
  assert(map.includes(id),"Skills map missing "+id);
}

for(const file of [
  "skills/boom-f60t-yamam.md",
  "skills/boom-f60t-profit-truth-price.md",
  "skills/boom-f60t-global-crowd-time.md",
  "skills/boom-f60t-platform-distribution.md",
  "skills/boom-f60t-agent-commerce.md",
  "skills/boom-f60t-profit-routing-uncertainty.md",
  "skills/boom-f60t-funnel-creative-supplier.md",
  "skills/boom-f60t-owner-memory-research.md",
  "skills/boom-f60t-human-platform-audience.md",
  "skills/boom-f60t-crowd-entry-content.md",
  "skills/boom-f60t-follow-sun-creator-community.md",
  "skills/boom-f60t-search-agent-radar.md",
  "skills/boom-f60t-profit-preservation-world-router.md",
  "skills/boom-f60t-always-on-memory-world-watch.md"
]) assert(fs.existsSync(file),"Missing skill file: "+file);

for(const runtime of [
  "boom-f60t-core.js",
  "boom-f60t-crowd-radar.js",
  "boom-f60t-world-watch.js"
]) assert(fs.existsSync(runtime),"Missing runtime contract: "+runtime);

console.log("boom_f60t_protocol=PASS");