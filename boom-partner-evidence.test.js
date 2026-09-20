const assert=require("assert");
const P=require("./boom-partner-evidence.js");
const now=Date.parse("2026-09-20T09:00:00Z");
const at=h=>new Date(now-h*36e5).toISOString();

let r=P.evaluateRow({partner_name:"CJdropshipping",terms_verified_at:null,media_rights_verified_at:null},now);
assert.equal(r.terms.state,"UNKNOWN");
assert.equal(r.commercial_rights.state,"UNKNOWN");
assert.equal(r.owner_approval_required,true);

r=P.evaluateRow({partner_name:"Test",terms_verified_at:at(24),media_rights_verified_at:at(800)},now);
assert.equal(r.terms.state,"FRESH");
assert.equal(r.commercial_rights.state,"FRESH");

r=P.evaluateRow({partner_name:"Test",terms_verified_at:at(2200),media_rights_verified_at:at(2500)},now);
assert.equal(r.terms.state,"STALE");
assert.equal(r.commercial_rights.state,"RECHECK");
assert.equal(r.terms.automatic_change,false);
console.log("BOOM partner evidence: PASS — persisted timestamps map to confidence states");