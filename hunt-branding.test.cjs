const fs=require("fs");
const path=require("path");
const assert=require("assert");

const exts=new Set([".html",".js",".ts",".md",".css",".webmanifest"]);
const skip=new Set([".git","node_modules"]);
const offenders=[];

function walk(dir){
  for(const name of fs.readdirSync(dir)){
    if(skip.has(name))continue;
    const p=path.join(dir,name);
    const st=fs.statSync(p);
    if(st.isDirectory())walk(p);
    else if(exts.has(path.extname(p))){
      const text=fs.readFileSync(p,"utf8");
      if(text.includes("HUNT DEAL"))offenders.push(p);
    }
  }
}
walk(".");
assert.deepEqual(offenders,[],"legacy HUNT DEAL branding remains: "+offenders.join(", "));
const home=fs.readFileSync("index.html","utf8");
assert(home.includes('content="HUNT — Smarter Shopping Intelligence"'),"HUNT title missing");
assert(home.includes('<a class="hd-brand" href="./">HUNT</a>'),"HUNT header brand missing");
const boom=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
assert(boom.includes("orchestration layer for HUNT and connected BOOM systems"),"BOOM brand context missing");
console.log("HUNT branding test: PASS");
