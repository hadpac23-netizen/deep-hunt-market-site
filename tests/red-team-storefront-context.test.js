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

test("RT10 PDP loads canonical taxonomy before product runtime",()=>{
  const html=read("product.html");
  assert.ok(html.indexOf('canonical-taxonomy.js?v=canon4')>0);
  assert.ok(html.indexOf('canonical-taxonomy.js?v=canon4')<html.indexOf('product.js?v=redteam3'));
});

test("RT10 product links preserve department and exact shelf context",()=>{
  const privacy=read("storefront-privacy.js");
  const product=read("product.js");
  assert.match(privacy,/url\.searchParams\.set\("c",parent\)/);
  assert.match(privacy,/url\.searchParams\.set\("sub",sub\)/);
  assert.match(product,/const contextAllowed=Boolean\(contextSub&&H\.categoryDefs\[contextSub\]/);
  assert.match(product,/genderContextSubs\.has\(contextSub\)/);
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


test("RT10 PDP related products stay on the exact shelf and hide supplier metadata",()=>{
  const flow=read("product-flow.js");
  assert.match(flow,/const contextualShelf=pageSub&&H\.categoryDefs\?\.\[pageSub\]\?pageSub:""/);
  assert.match(flow,/contextualShelf\s*\? \[contextualShelf\]/);
  assert.match(flow,/if\(!all\.length&&!contextualShelf\)/);
  assert.match(flow,/H\.sourceCodeForProvider\(item\?\.provider\)/);
  assert.match(flow,/HUNT SOURCE/);
  assert.doesNotMatch(flow,/H\.esc\(item\.provider\|\|"HUNT"\)/);
});
