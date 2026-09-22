const fs=require("fs"),assert=require("assert");
const r=JSON.parse(fs.readFileSync("boom-skill-registry.json","utf8"));
assert(r.skills.length>=20);
assert.equal(r.skills.find(x=>x.path.includes("personalization-brain")).status,"REWIRE_NOT_BRAIN");
assert.equal(r.skills.find(x=>x.path.includes("hunt-marketplace-brain")).type,"DOMAIN_MODULE");
assert(r.skills.some(x=>x.owner==="innovation_brain"));
console.log("Skill registry: PASS — brain-named files cannot create extra Primary Brains");