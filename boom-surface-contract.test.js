const fs=require("fs");
const contract=JSON.parse(fs.readFileSync("boom-surface-contract.json","utf8"));
const errors=[];
const ids=new Set(),files=new Set();
for(const row of contract.surfaces){
  if(ids.has(row.id))errors.push("duplicate surface id: "+row.id); ids.add(row.id);
  if(files.has(row.file))errors.push("duplicate surface file: "+row.file); files.add(row.file);
  for(const key of row.required||[])if(!contract.modules[key])errors.push("unknown module "+key+" on "+row.id);
  if(row.enforce_phase_1){
    if(!fs.existsSync(row.file)){errors.push("missing surface file: "+row.file);continue;}
    const html=fs.readFileSync(row.file,"utf8");
    for(const key of row.required||[]){
      const file=contract.modules[key];
      if(!html.includes(file))errors.push(row.file+" missing required "+file);
    }
  }
}
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM surface contract: PASS",contract.surfaces.filter(x=>x.enforce_phase_1).length+" phase-1 surfaces enforced");
