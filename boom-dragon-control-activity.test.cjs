const assert=require("node:assert/strict");
global.window={};
global.document={
  hidden:false,
  body:{classList:{contains:()=>false}},
  querySelector:()=>null,
  addEventListener:()=>{}
};
global.CustomEvent=function(){};
global.setInterval=()=>0;
global.setTimeout=()=>0;
const A=require("./boom-dragon-control-activity.js");
const s=A.normalize({
  ok:true,
  generated_at:"2026-09-24T13:00:00Z",
  counts:{commands:4,waiting_owner:1,evidence:2,managers:3},
  material_execution:{payment_live:false,supplier_live_order:false,external_publish:false},
  items:[
    {kind:"OWNER_GATE",status:"WAITING_OWNER",at:"2026-09-24T12:59:00Z"},
    {kind:"EVIDENCE",status:"VERIFIED",at:"2026-09-24T12:58:00Z"}
  ]
});
assert.equal(s.status,"READY");
assert.equal(s.items.length,2);
assert.equal(A.tone(s.items[0]),"gate");
assert.equal(A.tone(s.items[1]),"ready");
assert.equal(s.material_execution.payment_live,false);
console.log("DRAGON Control Activity adapter tests: PASS");