const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=file=>fs.readFileSync(path.resolve(__dirname,"..",file),"utf8");

test("RT10 PDP never renders raw supplier identity",()=>{
  const product=read("product.js");
  assert.match(product,/#hd-product-provider"\)\.textContent = "HUNT SOURCE"/);
  assert.doesNotMatch(product,/#hd-product-provider"\)\.textContent = product\.provider/);
});

test("RT10 product links preserve department and exact shelf context",()=>{
  const privacy=read("storefront-privacy.js");
  const product=read("product.js");
  assert.match(privacy,/url\.searchParams\.set\("c",parent\)/);
  assert.match(privacy,/url\.searchParams\.set\("sub",sub\)/);
  assert.match(product,/contextDef=contextSub&&H\.categoryDefs\[contextSub\]\?\.parent===contextParent/);
  assert.match(product,/category\.html\?c=\$\{encodeURIComponent\(contextParent\)\}&sub=\$\{encodeURIComponent\(contextSub\)\}/);
});

test("RT10 Dresses rejects mens dress-pants false positives",()=>{
  const category=read("category.js");
  assert.match(category,/\["dresses","women-dresses"\]\.includes\(exactShelf\)/);
  assert.match(category,/dress pants\?/);
  assert.match(category,/men\(\?:'s\|s\)\?/);
});


test("RT10 customer-facing category and fresh-arrival copy never renders supplier names",()=>{
  const category=read("category.js");
  const wow=read("hunt-wow.js");
  assert.doesNotMatch(category,/providers\.join\(/);
  assert.match(category,/HUNT source/);
  assert.doesNotMatch(wow,/New from CJdropshipping|CJ LIVE/);
  assert.match(wow,/Fresh arrivals from the HUNT network/);
});
