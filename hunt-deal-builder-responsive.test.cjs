const fs=require("fs");
const assert=require("assert");

const css=fs.readFileSync("hunt-visual-v2.css","utf8");
const js=fs.readFileSync("boom-deal-builder.js","utf8");

assert(js.includes('class="hd-bundle-media"'),"Deal Builder media contract missing");
assert(css.includes("HUNT V2 · DEAL BUILDER RESPONSIVE SAFETY"),"Deal Builder responsive safety section missing");
assert(css.includes(".hd-bundle-media img"),"Deal Builder image rule missing");
assert(css.includes("max-width:100%"),"Deal Builder media must be width bounded");
assert(css.includes("object-fit:cover"),"Deal Builder images must preserve crop safely");
assert(css.includes(".hd-deal-builder-grid"),"Deal Builder grid rule missing");
assert(css.includes("grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"),"Desktop responsive grid missing");
assert(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),"Mobile two-column grid missing");
assert(css.includes("@media(max-width:420px)"),"Narrow mobile breakpoint missing");

console.log("hunt_deal_builder_responsive=PASS");
