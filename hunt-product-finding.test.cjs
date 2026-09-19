const fs=require("fs");
const assert=require("assert");

const categoryHtml=fs.readFileSync("category.html","utf8");
const searchHtml=fs.readFileSync("search.html","utf8");
const category=fs.readFileSync("category.js","utf8");
const search=fs.readFileSync("search.js","utf8");
const compare=fs.readFileSync("hunt-compare.js","utf8");
const css=fs.readFileSync("hunt-product-finding.css","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");
const pwa=fs.readFileSync("pwa.js","utf8");

for(const html of [categoryHtml,searchHtml]){
  assert(html.includes("hunt-product-finding.css?v=1"),"Product Finding stylesheet missing");
  assert(html.includes("hunt-compare.js?v=2"),"Compare runtime missing");
}
assert(categoryHtml.includes('id="hd-applied-filters"'),"Applied Filters overview missing");
assert(categoryHtml.includes('id="hd-filter-clear-all"'),"Applied Filters clear-all missing");
for(const token of ["renderAppliedFilters","updateSubcategoryCounts","scheduleRenderGrid","categoryFacts","data-clear-filter","HuntCompare?.button"]){
  assert(category.includes(token),"Category Product Finding contract missing: "+token);
}
for(const token of ["searchRetailReady","searchFacts","HuntCompare?.button","HuntCompare?.register"]){
  assert(search.includes(token),"Search Product Finding contract missing: "+token);
}
assert(search.includes('p?.retail_price_verified===true'),"Search must not present unverified price as verified retail");

for(const token of ["MAX=3","aria-pressed","Compare up to 3","No winner","Unknown","restricted","sessionStorage","hd-compare-table"]){
  assert(compare.includes(token),"Compare contract missing: "+token);
}
for(const token of [".hd-applied-filters",".hd-card-specific-facts",".hd-compare-tray",".hd-compare-dialog",".hd-compare-table"]){
  assert(css.includes(token),"Product Finding CSS missing: "+token);
}
assert(sw.includes("hunt-shell-pwa6"),"PWA4 cache missing");
assert(sw.includes("hunt-product-finding.css")&&sw.includes("hunt-compare.js"),"PWA core missing Product Finding assets");
assert(pwa.includes("service-worker.js?v=pwa6"),"PWA4 registration missing");

console.log("hunt_product_finding=PASS");
