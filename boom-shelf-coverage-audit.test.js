const fs=require("fs");
const vm=require("vm");
const assert=require("assert");
const contract=JSON.parse(fs.readFileSync("boom-shelf-department-contract.json","utf8"));
const source=fs.readFileSync("boom-shelf-coverage-audit.js","utf8");
const ctx={window:{}};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:"boom-shelf-coverage-audit.js"});
const A=ctx.window.HuntShelfCoverageAudit;
assert.equal(contract.departments.length,17);
assert.equal(contract.departments.filter(x=>x.status==="VERIFIED_SOURCE").length,13);
assert.equal(contract.departments.filter(x=>x.status==="UNRESOLVED").length,4);
const now=new Date().toISOString();
const rows=[
  {shelf_slug:"women",live_verified_products:102,last_live_audit_at:now,providers:["CJdropshipping"]},
  {shelf_slug:"men",live_verified_products:1000,last_live_audit_at:now,providers:["CJdropshipping"]},
  {shelf_slug:"kids",live_verified_products:null,last_live_audit_at:null,providers:["CJdropshipping"]}
];
const report=A.summarize(contract,rows);
assert.equal(report.departments.find(x=>x.slug==="women").state,"THIN");
assert.equal(report.departments.find(x=>x.slug==="men").state,"READY");
assert.equal(report.departments.find(x=>x.slug==="kids").state,"UNKNOWN");
assert.equal(report.summary.unresolved,4);
assert.equal(report.summary.all_ready,false);
console.log("HUNT shelf coverage: PASS — 13 verified departments, 4 unresolved blocked, fresh live evidence only");
