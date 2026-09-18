const fs=require("fs");

function assert(condition,message){
  if(!condition)throw new Error(message);
}

const js=fs.readFileSync("boom-ai-studio.js","utf8");
const snapshot=JSON.parse(fs.readFileSync("boom-security-audit-snapshot.json","utf8"));

assert(Array.isArray(snapshot.findings),"Security snapshot findings missing");
assert(snapshot.findings.length===3,"Expected three current Supabase security findings");
assert(snapshot.production_changed===false,"Security snapshot must remain read-only evidence");
assert(js.includes("async function loadSecurityAuditSnapshot()"),"Security snapshot loader missing");
assert(js.includes("function buildSecurityConnectRows()"),"Security Connect row builder missing");
assert(js.includes("...buildSecurityConnectRows(),...buildEvidenceConnectorRows()"),"Security rows not wired into BOOM Connect");
assert(js.includes("await loadSecurityAuditSnapshot();"),"Safe preview must load security evidence");

console.log("PASS boom-connect-security-truth");
