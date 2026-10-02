const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const canonical=fs.readFileSync("canonical-taxonomy.js","utf8");
const home=fs.readFileSync("hunt-deal.js","utf8");
const html=fs.readFileSync("index.html","utf8");

test("canonical taxonomy exports the shared Home/Category source of truth",()=>{
  assert.match(canonical,/H\.canonicalTaxonomy\s*=\s*Object\.freeze/);
  assert.match(canonical,/version:"canonical50-v2"/);
  assert.match(canonical,/defs:Object\.freeze/);
  assert.match(canonical,/groups:Object\.freeze/);
  assert.match(canonical,/if \(!\/\(\^\|\\\/\)category\\\.html\$\//);
});

test("Home loads canonical taxonomy before hunt-deal",()=>{
  const canonPos=html.indexOf("canonical-taxonomy.js?v=canon2");
  const homePos=html.indexOf("hunt-deal.js?v=stable3");
  assert.ok(canonPos>0,"canonical taxonomy script missing");
  assert.ok(homePos>canonPos,"Home must load after canonical taxonomy");
});

test("Home no longer owns an independent shelf universe or title regex classifier",()=>{
  assert.doesNotMatch(home,/const shelfMeta\s*=\s*\{/);
  assert.doesNotMatch(home,/const shelfDepartments\s*=\s*\[/);
  assert.doesNotMatch(home,/function isWomenShelfItem/);
  assert.doesNotMatch(home,/const rules\s*=\s*\{[\s\S]*women:/);
  assert.match(home,/function canonicalDepartments\(\)/);
  assert.match(home,/function normalizeCanonicalShelfData\(data\)/);
  assert.match(home,/item\?\._hunt_canonical_shelf/);
});

test("legacy Home slugs are compatibility aliases only",()=>{
  assert.match(home,/dresses:"women-dresses"/);
  assert.match(home,/sleepwear:"women-nightwear"/);
  assert.match(home,/womenunderwear:"women-underwear"/);
  assert.match(home,/menunderwear:"men-underwear"/);
  assert.match(home,/suits:"men-tailoring"/);
  assert.doesNotMatch(home,/socks:"/);
});

test("Home renders only canonical definitions and canonical category URLs",()=>{
  assert.match(home,/new Set\(Object\.keys\(canonicalTaxonomy\(\)\.defs/);
  assert.match(home,/defs\?\.\[slug\]\?\.canonical===true/);
  assert.match(home,/defs\?\.\[slug\]\?\.parent===department/);
  assert.match(home,/canonicalCategoryHref\(slug\)/);
});
