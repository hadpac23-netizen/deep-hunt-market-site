const fs=require("fs");
const src=fs.readFileSync("shopping-actions.js","utf8");
const errors=[];
for(const needle of [
  "async function mergeLocalToAccount()",
  "row.liked||previous.liked",
  "row.saved||previous.saved",
  "user_id:session.user.id",
  "onConflict:\"user_id,provider,item_id\"",
  "localStorage.removeItem(localKey)",
  "if(changed)await mergeLocalToAccount()"
]){
  if(!src.includes(needle))errors.push("guest merge missing: "+needle);
}
const removeAt=src.indexOf("localStorage.removeItem(localKey)");
const loopAt=src.indexOf("for(const row of rows)");
if(removeAt<loopAt)errors.push("guest state may be cleared before account upsert loop");
if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM guest→account merge contract: PASS — likes/saves union before local clear");