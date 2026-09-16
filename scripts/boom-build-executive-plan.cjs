const fs=require("node:fs");
const path=require("node:path");
const Core=require(path.resolve(__dirname,"..","boom-executive-core.js"));
const registry=JSON.parse(fs.readFileSync(path.resolve(__dirname,"..","boom-manager-registry.json"),"utf8"));
const inputs=process.argv.slice(2).filter(Boolean);
if(!inputs.length){console.error("Usage: node scripts/boom-build-executive-plan.cjs <report.json> [...]");process.exit(2);}
const reports=[];
for(const file of inputs){
  const value=JSON.parse(fs.readFileSync(file,"utf8"));
  if(Array.isArray(value))reports.push(...value);
  else {
    reports.push(value);
    const departments=value?.details?.department_reports;
    if(Array.isArray(departments))reports.push(...departments);
  }
}
const plan=Core.buildExecutivePlan(reports,registry);
const out=process.env.BOOM_EXECUTIVE_PLAN_PATH||"boom-executive-plan.json";
fs.writeFileSync(out,JSON.stringify(plan,null,2));
console.log(JSON.stringify(plan,null,2));
if(plan.summary.critical_count>0)process.exitCode=2;