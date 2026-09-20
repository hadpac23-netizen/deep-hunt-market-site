const assert=require("node:assert/strict");
const Taste=require("./boom-taste-dna.js");

const events=[];
for(let i=0;i<8;i++)events.push({type:"save",ts:new Date().toISOString(),category:"jewelry",provider:"CJdropshipping"});
events.push({type:"not_interested",ts:new Date().toISOString(),category:"tech",provider:"EPROLO"});

const profile=Taste.buildProfile(events);
assert.equal(profile.mode,"learning");
assert.ok(profile.confidence>0);
assert.equal(profile.controls.sensitive_traits_used,false);
assert.equal(profile.categories[0].key,"jewelry");
assert.ok(profile.categories.find(row=>row.key==="tech").score<0);

const jewelry=Taste.candidateSignals(profile,{category:"jewelry",provider:"CJdropshipping"});
const tech=Taste.candidateSignals(profile,{category:"tech",provider:"EPROLO"});
assert.ok(jewelry.affinity>tech.affinity);
assert.ok(tech.hide_risk>jewelry.hide_risk);
assert.equal(jewelry.reason,"taste_category_match");

const context=Taste.enrichContext({interactions:events.length},events);
assert.equal(context.taste_profile.interactions,events.length);
assert.equal(Taste.modeFor(3),"cold_start");
assert.equal(Taste.modeFor(30),"personalized");

console.log("BOOM Taste DNA tests: PASS");
