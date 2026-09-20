const fs=require("fs");
const contract=JSON.parse(fs.readFileSync("boom-surface-contract.json","utf8"));
const errors=[];

for(const row of contract.surfaces){
  if(!fs.existsSync(row.file))continue;
  const html=fs.readFileSync(row.file,"utf8");
  if(html.includes("\\n  <script src=\"boom-runtime.js"))errors.push(row.file+": literal escaped newline before runtime script");
  const runtime=html.indexOf("boom-runtime.js");
  if(runtime>=0){
    const supabase=html.indexOf("@supabase/supabase-js");
    if(supabase>=0&&supabase>runtime)errors.push(row.file+": runtime loads before Supabase");
    if(!html.includes("boom-runtime.js?v=brainos2"))errors.push(row.file+": stale runtime cache version");
  }
}

for(const file of ["hunt-deal.js","checkout.js"]){
  const src=fs.readFileSync(file,"utf8");
  if(/\bcartKey\b|\breadCart\b|localStorage\.(?:getItem|setItem)\([^\n]*cart/i.test(src)){
    errors.push(file+": direct cart storage ownership returned");
  }
}
const productFlow=fs.readFileSync("product-flow.js","utf8");
if(!productFlow.includes("runtime?.getSupabaseClient?.()"))errors.push("product-flow.js bypasses shared Supabase runtime client");

const core=fs.readFileSync("market-core.js","utf8");
for(const fn of ["addCart","removeCart","setCartQuantity","clearCart","updateCartBadges"]){
  if(!core.includes(fn))errors.push("market-core.js missing cart owner function "+fn);
}

if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM runtime contract: PASS — load order, cache version and single cart owner");
