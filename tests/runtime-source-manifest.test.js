const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"ops/hunt-runtime-source-manifest.json"),"utf8"));
const expected=[
  "hunt-cj-quote",
  "hunt-cj-live-check",
  "hunt-eprolo-readonly-pilot",
  "hunt-eprolo-variant-country-audit-shadow",
  "hunt-eprolo-product-country-variants-audit-shadow"
];

test("CJ and EPROLO launch-critical runtime sources are committed to Git",()=>{
  const bySlug=new Map(manifest.functions.map(x=>[x.slug,x]));
  for(const slug of expected){
    assert.ok(bySlug.has(slug),slug+" missing from runtime manifest");
    const row=bySlug.get(slug);
    assert.ok(fs.existsSync(path.join(root,row.git_path)),slug+" source missing from Git");
    assert.equal(row.status,"ACTIVE");
  }
});

test("runtime manifest never stores credentials",()=>{
  const raw=JSON.stringify(manifest);
  assert.doesNotMatch(raw,/openApiSecret|service_role|PAYPLUS_SECRET_KEY|hunt_eprolo_api_secret/i);
});
