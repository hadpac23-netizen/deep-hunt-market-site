const fs=require("node:fs");
const assert=require("node:assert");
const doc=fs.readFileSync("docs/F50-DEEP-HUNT-RESEARCH-PROTOCOL.md","utf8");
const skill=fs.readFileSync("skills/boom-f50-deep-hunt.md","utf8");
const candidate=fs.readFileSync("docs/F50-HUNT-PROMISE-MESH-CANDIDATE-2026-09-19.md","utf8");
const completion=fs.readFileSync("docs/F50-04-07-COMPLETION-2026-09-19.md","utf8");

for(const token of [
  "First Principles","Hidden Problem Mining","Extreme Users","Weak Signals",
  "Contradiction Hunting","Invisible Resources","Missing Markets","Failed Futures",
  "Technology Collisions","Assumption Delete","Mechanism Transfer","Future Backcasting",
  "Economic Primitive Test","Network Effect Test","Data / Moat Test","Big-Tech Copy Test",
  "Prior-Art Attack","Red Team","Scale Mathematics","One-Idea Rule",
  "50 → 10 → 3 → 1 or 0","F50-DEEP-HUNT-CONTINUE",
  "F50-04 Prior-Art + Patent Attack","F50-05 Market / Economics",
  "F50-06 Red Team","F50-07 Research Memory","near-duplicate"
]) assert(doc.includes(token),"Protocol missing: "+token);

for(const token of [
  "## F50-04 — Prior-Art + Patent Attack",
  "## F50-05 — Market / Economics",
  "## F50-06 — Red Team",
  "## F50-07 — Research Memory",
  "BoomF50MemoryAdapter",
  "authenticated-admin RLS only"
]) assert(skill.includes(token),"Skill missing: "+token);

assert(skill.includes("Do not force a winner."));
assert(candidate.includes("KILLED_THIS_ROUND_REOPENABLE_WITH_NEW_EVIDENCE"));
assert(candidate.includes("current_final_result: ZERO"));
assert(completion.includes("Result: ZERO."));
console.log("boom_f50_protocol_contract=PASS");