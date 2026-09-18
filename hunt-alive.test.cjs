const fs=require("fs"),assert=require("assert"),path=require("path");
const read=f=>fs.readFileSync(f,"utf8");
const brandCss=read("hunt-brand-motion.css");
const brandJs=read("hunt-brand-motion.js");
const discCss=read("hunt-discovery-engine.css");
const discJs=read("hunt-discovery-engine.js");
const index=read("index.html");
const legal=JSON.parse(read("legal-config.json"));

assert(brandCss.includes("hd-hunt-signature-drop"),"HUNT letter drop keyframe missing");
assert(brandCss.includes("hd-hunt-signature-glass"),"HUNT glass shimmer keyframe missing");
assert(brandCss.includes("hd-hunt-signature-star"),"HUNT T-star keyframe missing");
assert(brandCss.includes("background-position:-60%"),"Glass sweep does not cross full word");
assert(brandCss.includes("right:-.12em")&&brandCss.includes("top:-.36em"),"T star is not positioned above final letter");
assert(brandCss.includes("@media (prefers-reduced-motion:reduce)"),"Brand reduced-motion fallback missing");
assert(brandJs.includes('[..."HUNT"]'),"Global HUNT letter construction missing");
assert(brandJs.includes('MutationObserver'),"Dynamic HUNT brand upgrade missing");
assert(brandJs.includes('IntersectionObserver'),"Brand entry visibility gate missing");

const htmlFiles=fs.readdirSync(".").filter(f=>f.endsWith(".html")&&!f.includes("browser-e2e"));
const branded=htmlFiles.filter(f=>/class="[^"]*hd-brand/.test(read(f)));
assert(branded.length>=20,"Unexpectedly few branded pages");
for(const f of branded){
  const s=read(f);
  assert(s.includes("hunt-brand-motion.css?v=1"),f+" missing global brand CSS");
  assert(s.includes("hunt-brand-motion.js?v=1"),f+" missing global brand JS");
}

assert(index.includes('id="hunt-now"'),"HUNT NOW section missing");
assert(index.includes("hunt-discovery-engine.css?v=1"),"Discovery CSS missing");
assert(index.includes("hunt-discovery-engine.js?v=1"),"Discovery JS missing");

for(const mode of ["for-you","fresh","look","explore","verified","local"])
  assert(discJs.includes('"'+mode+'"'),"Discovery mode missing "+mode);
assert(discJs.includes('verifiedRows().length>=4'),"Verified mode evidence gate missing");
assert(discJs.includes('localRows().length>=4'),"Country-shipping mode evidence gate missing");
assert(discJs.includes('retail_price_verified===true'),"Verified retail condition missing");
assert(discJs.includes('profit_gate_status'),"Profit Gate condition missing");
assert(discJs.includes('C?.readiness?.(item)==="verified_match"'),"Country evidence condition missing");
assert(!/\bTrending\b/i.test(discJs),"Unverified Trending language must not exist");
assert(discJs.includes("10400"),"Controlled discovery cadence missing");
assert(discJs.includes("mouseenter")&&discJs.includes("focusin"),"Auto-cycle pause interactions missing");
assert(discJs.includes("IntersectionObserver"),"Offscreen discovery timer gate missing");
assert(discCss.includes("scroll-snap-type:x mandatory"),"Mobile discovery snap rail missing");
assert(discCss.includes("@media(prefers-reduced-motion:reduce)"),"Discovery reduced-motion fallback missing");
assert(discCss.includes("hd-alive-section"),"Existing catalog reveal layer missing");

assert(legal.payments_status==="PRELAUNCH","Payments must remain PRELAUNCH");
console.log("hunt_alive=PASS",{brandedPages:branded.length});