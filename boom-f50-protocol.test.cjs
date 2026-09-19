const fs=require("node:fs");
const assert=require("node:assert");
const doc=fs.readFileSync("docs/F50-DEEP-HUNT-RESEARCH-PROTOCOL.md","utf8");
const skill=fs.readFileSync("skills/boom-f50-deep-hunt.md","utf8");
const candidate=fs.readFileSync("docs/F50-HUNT-PROMISE-MESH-CANDIDATE-2026-09-19.md","utf8");

for(const token of [
  "First Principles","Hidden Problem Mining","Extreme Users","Weak Signals",
  "Contradiction Hunting","Invisible Resources","Missing Markets","Failed Futures",
  "Technology Collisions","Assumption Delete","Mechanism Transfer","Future Backcasting",
  "Economic Primitive Test","Network Effect Test","Data / Moat Test","Big-Tech Copy Test",
  "Prior-Art Attack","Red Team","Scale Mathematics","One-Idea Rule",
  "50 → 10 → 3 → 1 or 0","F50-DEEP-HUNT-CONTINUE"
]) assert(doc.includes(token),"Protocol missing: "+token);

assert(skill.includes("Do not force a winner."));
assert(skill.includes(">=3 verified usable evidence records"));
assert(candidate.includes("PROVISIONAL_KEEP_PENDING_FORMAL_EVIDENCE"));
assert(candidate.includes("winner_claim_allowed: false"));
assert(candidate.includes("final_result: unresolved"));
console.log("boom_f50_protocol_contract=PASS");