const fs=require("fs");
const assert=require("assert");

const index=fs.readFileSync("index.html","utf8");
const category=fs.readFileSync("category.html","utf8");
const search=fs.readFileSync("search.html","utf8");
const product=fs.readFileSync("product.html","utf8");
const home=fs.readFileSync("hunt-home-3.js","utf8");
const productJs=fs.readFileSync("product.js","utf8");
const confidenceCss=fs.readFileSync("hunt-decision-confidence.css","utf8");
const continuity=fs.readFileSync("hunt-browse-continuity.js","utf8");
const sw=fs.readFileSync("service-worker.js","utf8");
const pwa=fs.readFileSync("pwa.js","utf8");

assert(index.includes("hunt-decision-confidence.css?v=1"),"Home Decision Confidence stylesheet missing");
assert(product.includes("hunt-decision-confidence.css?v=1"),"Product Decision Confidence stylesheet missing");
assert(product.includes('id="hd-decision-check"'),"Decision Check shell missing");
assert(product.includes('id="hd-decision-check-grid"'),"Decision Check grid missing");
assert(product.includes('href="shipping.html"')&&product.includes('href="returns.html"'),"Decision Check policy links missing");

for(const token of ["renderDecisionCheck","Destination recheck","availabilityVerified","Quote verified","Needs check"]){
  assert(productJs.includes(token),"Product Decision Check contract missing: "+token);
}
for(const token of ["cardMicroFacts","Price verified","options","Stock data loaded","hd-card-microfacts"]){
  assert(home.includes(token),"Home micro-facts contract missing: "+token);
}
for(const token of [".hd-card-microfacts",".hd-decision-check-grid",".hd-decision-check-cell","data-state"]){
  assert(confidenceCss.includes(token),"Decision Confidence CSS contract missing: "+token);
}

for(const [name,html] of [["index",index],["category",category],["search",search]]){
  assert(html.includes("hunt-browse-continuity.js?v=2"),name+" Browse Continuity runtime missing");
}
for(const token of ["sessionStorage","back_forward","hunt:browse-position-restored","product\\.html","current_floor","viewport_top","matchingProductLink","huntReturnAnchor"]){
  assert(continuity.includes(token),"Browse Continuity contract missing: "+token);
}
assert(!continuity.includes('scrollRestoration="manual"'),"Browse Continuity must not disable native scroll restoration globally");

assert(sw.includes('hunt-shell-pwa6'),"PWA cache version not bumped");
for(const token of ["hunt-decision-confidence.css","hunt-browse-continuity.js","hunt-attention-guard.js","hunt-home-3.js","product.js"]){
  assert(sw.includes(token),"PWA core missing: "+token);
}
assert(pwa.includes("service-worker.js?v=pwa6"),"PWA registration version mismatch");

console.log("hunt_decision_confidence=PASS");
