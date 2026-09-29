const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");

for (const file of ["catalog-index.json","catalog-readiness.json"]) {
  test(file+" is explicitly non-authoritative for launch",()=>{
    const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
    assert.equal(doc.legacy_snapshot_only,true);
    assert.equal(doc.launch_authoritative,false);
    assert.equal(doc.launch_source_of_truth,"SUPABASE_LIVE_DB");
  });
}

test("launch executable code cannot depend on legacy readiness snapshots",()=>{
  const blocked=["catalog-index.json","catalog-readiness.json"];
  const extensions=new Set([".js",".mjs",".cjs",".ts",".html"]);
  const skip=new Set(["node_modules",".git"]);
  const hits=[];
  const walk=dir=>{
    for(const name of fs.readdirSync(dir)){
      if(skip.has(name)) continue;
      const full=path.join(dir,name);
      const stat=fs.statSync(full);
      if(stat.isDirectory()){ walk(full); continue; }
      if(!extensions.has(path.extname(name))) continue;
      const rel=path.relative(root,full);
      if(rel==="tests/no-legacy-catalog-launch-path.test.js") continue;
      const text=fs.readFileSync(full,"utf8");
      for(const token of blocked){
        if(text.includes(token)) hits.push(rel+" -> "+token);
      }
    }
  };
  walk(root);
  assert.deepEqual(hits,[]);
});
