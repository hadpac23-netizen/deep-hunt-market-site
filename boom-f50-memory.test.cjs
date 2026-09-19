const assert=require("node:assert");
const M=require("./boom-f50-memory.js");
const {strongCandidate}=require("./boom-f50-test-fixtures.cjs");

const a=strongCandidate("mem-a");
const b={...strongCandidate("mem-b"),mechanism_primitives:[...a.mechanism_primitives].reverse()};
assert.strictEqual(M.fingerprint(a),M.fingerprint(b));
assert(M.fingerprint(a).startsWith("f50_"));

const killed=[{mechanism_fingerprint:M.fingerprint(a),last_decision:"KILL",hit_count:4}];
const blocked=M.inspect(a,killed);
assert.strictEqual(blocked.memory_ready,false);
assert(blocked.blockers.includes("previously_killed_or_near_duplicate_without_material_new_evidence"));

const reopened=M.inspect({...a,reopen_reason:"Material new patent and market evidence changes the mechanism boundary enough to justify a new attack.",reopen_evidence:["patent:new","market:new"]},killed);
assert.strictEqual(reopened.memory_ready,true);
assert.strictEqual(reopened.memory_hit,true);


const near={...a,mechanism_primitives:[...a.mechanism_primitives,"new_minor_primitive"]};
const nearRows=[{mechanism_fingerprint:"other",mechanism_primitives:a.mechanism_primitives,last_decision:"KILL",hit_count:2}];
const nearHit=M.inspect(near,nearRows);
assert.strictEqual(nearHit.match_type,"NEAR_DUPLICATE");
assert.strictEqual(nearHit.memory_ready,false);

const payload=M.recordPayload(a,"KILL",{blockers:["same_mechanism_prior_art_found"],prior_art:{same_mechanism_refs:["patent:x"]}});
assert.strictEqual(payload.last_decision,"KILL");
assert.deepStrictEqual(payload.prior_art_refs,["patent:x"]);
console.log("boom_f50_memory=PASS");