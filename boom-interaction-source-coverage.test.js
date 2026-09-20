const fs=require("fs");
const inventory=JSON.parse(fs.readFileSync("boom-interaction-inventory.json","utf8"));
const errors=[];
for(const row of inventory.interactions){
  if(!fs.existsSync(row.file)){errors.push("missing source file: "+row.file);continue;}
  const src=fs.readFileSync(row.file,"utf8");
  const selector=String(row.selector||"");
  let present=src.includes(selector);
  if(!present&&selector.startsWith("#")){
    const id=selector.slice(1);
    present=src.includes('"'+id+'"')||src.includes("'"+id+"'")||src.includes("#"+id);
  }
  if(!present&&selector.startsWith("."))present=src.includes(selector.slice(1));
  if(!present&&selector.includes(","))present=selector.split(",").some(part=>src.includes(part.trim()));
  if(!present)errors.push(row.file+" missing inventory selector "+selector+" -> "+row.action_id);
}
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM interaction source coverage: PASS",inventory.interactions.length+" mappings resolve to source");
