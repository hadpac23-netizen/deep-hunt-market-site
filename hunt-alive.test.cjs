const fs=require("fs"),assert=require("assert");
const read=f=>fs.readFileSync(f,"utf8");
const brandCss=read("hunt-brand-motion.css");
const brandJs=read("hunt-brand-motion.js");
const discCss=read("hunt-discovery-engine.css");
const discJs=read("hunt-discovery-engine.js");
const nightCss=read("hunt-night-edit.css");
const nightJs=read("hunt-night-edit.js");
const heroJs=read("hunt-hero4.js");
const index=read("index.html");
const legal=JSON.parse(read("legal-config.json"));

assert(brandCss.includes("hd-hunt-signature-drop"),"HUNT letter drop keyframe missing");
assert(brandCss.includes("hd-hunt-signature-glass"),"HUNT glass shimmer keyframe missing");
assert(brandCss.includes("hd-hunt-signature-star"),"HUNT T-star keyframe missing");
assert(brandCss.includes("hd-hunt-t-spin"),"T spin missing");
assert(brandCss.includes("hd-hunt-wink"),"T wink missing");
assert(brandCss.includes("hd-hunt-smile-breathe"),"T smile missing");
assert(brandCss.includes("rotate(540deg)"),"Star full spin landing missing");
assert(brandCss.includes("right:-.06em")&&brandCss.includes("top:-.48em"),"Star not positioned above T");
assert(brandCss.includes("translate3d(0,-2.45em,0)"),"Drop is not strong/visible enough");
assert(brandCss.includes("@media (prefers-reduced-motion:reduce)"),"Brand reduced-motion fallback missing");
assert(brandJs.includes('is-hunt-t'),"T-specific markup missing");
assert(brandJs.includes('hd-hunt-face'),"T face markup missing");
assert(brandJs.includes('is-signature-complete'),"Signature completion state missing");
assert(brandJs.includes('MutationObserver')&&brandJs.includes('IntersectionObserver'),"Global brand runtime observers missing");

const htmlFiles=fs.readdirSync(".").filter(f=>f.endsWith(".html")&&!f.includes("browser-e2e"));
const branded=htmlFiles.filter(f=>/class="[^"]*hd-brand/.test(read(f)));
assert(branded.length>=20,"Unexpectedly few branded pages");
for(const f of branded){
  const s=read(f);
  assert(s.includes("hunt-brand-motion.css?v=1"),f+" missing global brand CSS");
  assert(s.includes("hunt-brand-motion.js?v=1"),f+" missing global brand JS");
}

assert(index.includes('id="hunt-now"'),"HUNT NOW missing");
assert(index.includes('id="hunt-night-edit"'),"Night Edit missing");
assert(index.includes("hunt-night-edit.css?v=1")&&index.includes("hunt-night-edit.js?v=1"),"Night Edit assets missing");

for(const mode of ["for-you","fresh","look","explore","verified","local"])
  assert(discJs.includes('"'+mode+'"'),"Discovery mode missing "+mode);
assert(discJs.includes('verifiedRows().length>=4'),"Verified evidence gate missing");
assert(discJs.includes('localRows().length>=4'),"Country evidence gate missing");
assert(!/\bTrending\b/i.test(discJs),"Unverified Trending language must not exist");
assert(discJs.includes("10400"),"Discovery cadence missing");
assert(discCss.includes("scroll-snap-type:x mandatory"),"Mobile discovery snap rail missing");

for(const world of ["women","beauty","accessories","tech","home","men"])
  assert(nightJs.includes('"'+world+'"'),"Night Edit world missing "+world);
assert(nightJs.includes("retail_price_verified===true"),"Night Edit retail truth gate missing");
assert(nightJs.includes("profit_gate_status"),"Night Edit Profit Gate check missing");
assert(!/\bTrending\b/i.test(nightJs),"Night Edit must not fake Trending");
assert(nightJs.includes("12400"),"Night Edit controlled cadence missing");
assert(nightJs.includes("mouseenter")&&nightJs.includes("focusin"),"Night Edit pause behavior missing");
assert(nightCss.includes("scroll-snap-type:x mandatory"),"Night Edit mobile snap missing");
assert(nightCss.includes("@media(prefers-reduced-motion:reduce)"),"Night Edit reduced motion missing");

assert((heroJs.match(/w=5120&q=92/g)||[]).length===10,"All night scenes must request 5K derivatives");
assert(heroJs.includes("width<3000")&&heroJs.includes("height<1800"),"Night city quality gate not raised");
assert(heroJs.includes('tier:width>=4800?"ultra-5k":"premium-3k"'),"Night city quality tiers missing");
assert(heroJs.includes("preloadNextScene"),"Next city preload missing");
assert(heroJs.includes("8600"),"Night city cadence missing");

assert(legal.payments_status==="PRELAUNCH","Payments must remain PRELAUNCH");
console.log("hunt_alive=PASS",{brandedPages:branded.length});