const fs=require("fs"),assert=require("node:assert/strict");
const sec=JSON.parse(fs.readFileSync("dragon-security-status.json","utf8"));
assert.equal(sec.database_security.status,"HARDENED");
assert.equal(sec.database_security.advisor_definer_warnings,0);
assert.equal(sec.database_security.advisor_rls_info,0);
assert.equal(sec.auth.leaked_password_protection,"DISABLED");
console.log("DRAGON Security Status contract: PASS");