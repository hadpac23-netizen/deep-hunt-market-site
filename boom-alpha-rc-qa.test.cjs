const assert=require("node:assert");
const QA=require("./boom-alpha-rc-qa.js");

const journey=[
  {id:"discover",ready:true},{id:"product",ready:true},{id:"memory",ready:true},
  {id:"stylist",ready:true},{id:"creative",ready:true},{id:"checkout",ready:true}
];
const devices=[{width:390},{width:768},{width:1280},{width:1440}];
const preview={
  preview_ready:true,
  visibility:"OWNER_PRIVATE_STUDIO",
  journey,devices,
  alpha_activation_authorized:false,
  production_ready:false,
  production_changed:false,
  payments_activated:false,
  order_routing_activated:false,
  supplier_calls:0,
  provider_calls:0,
  spend_authorized:false,
  publishing_authorized:false,
  current_storefront_fallback:true,
  checkout_mode:"SIMULATION_ONLY",
  evidence_fingerprint:"A9-TEST"
};
const evidencePack={
  owner_review_ready:true,
  release_gate:"ALPHA_OWNER_REVIEW_READY",
  evidence_fingerprint:"A9-TEST",
  boundaries:{execution_allowed:false,payments_activated:false,order_routing_activated:false}
};
const harness={
  harness_pass:true,passed:4,total:4,
  scenarios:[
    {harness_pass:true},{harness_pass:true},{harness_pass:true},{harness_pass:true}
  ]
};
const domAudit={lang:"he",dir:"rtl",viewport:true,duplicate_ids:0,alpha_buttons_without_type:0};

const result=QA.run({preview,evidencePack,harness,domAudit});
assert.equal(result.mode,"A11_FULL_RC_QA_REGRESSION");
assert.equal(result.rc_qa_pass,true);
assert.equal(result.a12_eligible,true);
assert.equal(result.blockers.length,0);
assert(result.total>=30);
assert.equal(result.passed,result.total);
assert(result.groups.every(x=>x.pass));
assert.equal(result.production_ready,false);
assert.equal(result.alpha_activation_authorized,false);

const dup=QA.run({preview,evidencePack,harness,domAudit:{...domAudit,duplicate_ids:1}});
assert.equal(dup.rc_qa_pass,false);
assert(dup.blockers.includes("A4"));
assert.equal(dup.a12_eligible,false);

const payment=QA.run({preview:{...preview,payments_activated:true},evidencePack,harness,domAudit});
assert.equal(payment.rc_qa_pass,false);
assert(payment.blockers.includes("S4"));

const missingMobile=QA.run({preview:{...preview,devices:devices.filter(x=>x.width!==390)},evidencePack,harness,domAudit});
assert.equal(missingMobile.rc_qa_pass,false);
assert(missingMobile.blockers.includes("R1"));

console.log("boom_alpha_rc_qa=PASS");
