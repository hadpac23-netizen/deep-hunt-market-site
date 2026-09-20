const fs=require("fs");
const health=JSON.parse(fs.readFileSync("boom-brain-health-policy.json","utf8"));
const budgets=JSON.parse(fs.readFileSync("boom-mission-budget-contract.json","utf8"));
const errors=JSON.parse(fs.readFileSync("boom-error-taxonomy.json","utf8"));
const reasons=JSON.parse(fs.readFileSync("boom-decision-reason-codes.json","utf8"));
const storage=JSON.parse(fs.readFileSync("boom-storage-contract.json","utf8"));
const problems=[];
const unique=(rows,key,label)=>{const seen=new Set();for(const row of rows){if(!row[key])problems.push(label+" missing "+key);if(seen.has(row[key]))problems.push("duplicate "+label+" "+row[key]);seen.add(row[key]);}};
unique(budgets.resources,"id","budget"); unique(errors.errors,"code","error"); unique(reasons.codes,"code","reason"); unique(storage.stores,"key","storage key");
unique(storage.legacy_keys||[],"key","legacy storage key");
for(const r of budgets.resources)if(r.autonomous_budget!==0||r.owner_gate!==true)problems.push(r.id+": material budget must default to owner-gated zero autonomous budget");
for(const s of storage.stores)if(s.sensitive!==false)problems.push(s.key+": browser storage contract may not be marked for sensitive data");
if(!storage.stores.some(s=>s.key==="hunt_language_v1"&&s.schema_version===1))problems.push("versioned language storage missing");
if(!(storage.legacy_keys||[]).some(s=>s.key==="hunt_language"&&s.replacement==="hunt_language_v1"))problems.push("legacy language migration not registered");
if(!fs.existsSync("boom-storage-migrations.js"))problems.push("executable storage migration runtime missing");
if(health.mode!=="RECOMMEND_ONLY")problems.push("circuit breaker must remain recommend-only in v1");
if(problems.length){console.error(problems.join("\n"));process.exit(1);}
console.log("BOOM governance contracts: PASS",budgets.resources.length+" budgets, "+errors.errors.length+" errors, "+reasons.codes.length+" reasons, "+storage.stores.length+" storage keys");
