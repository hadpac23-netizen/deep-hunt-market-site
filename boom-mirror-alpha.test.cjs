const assert=require("node:assert/strict");
const fs=require("node:fs");
const Mirror=require("./boom-mirror-core.js");

const html=fs.readFileSync("mirror.html","utf8");
const ui=fs.readFileSync("boom-mirror-alpha.js","utf8");
const css=fs.readFileSync("boom-mirror-alpha.css","utf8");
const flow=fs.readFileSync("hunt-2037-flow.js","utf8");

assert(html.includes('id="mirror-consent"'),"consent control missing");
assert(html.includes('value="none">Do not store source photo'),"no-retention default missing");
assert(html.includes("No body scoring"),"body-safety disclosure missing");
assert(html.includes("does not claim exact physical fit"),"fit limitation missing");
assert(ui.includes("URL.createObjectURL"),"local preview missing");
assert(ui.includes("URL.revokeObjectURL"),"local preview cleanup missing");
assert(!ui.includes("fetch("),"Mirror Alpha must not upload photos");
assert(!ui.includes("localStorage.setItem"),"Mirror Alpha must not persist source photo state");
assert(ui.includes('type:"try_on"'),"try-on memory event missing");
assert(css.includes("prefers-reduced-motion"),"Mirror reduced-motion support missing");
assert(flow.includes("mirror.html?hunt2037=1"),"HUNT 2037 Mirror entry missing");

const consent=Mirror.createConsent({accepted:true,photo_preview:true,retention:"none"});
const session=Mirror.createSession({consent,inputMode:"upload"});
assert.equal(session.created,true);
assert.equal(session.persistent_source_photo,false);

console.log("BOOM Mirror Alpha tests: PASS");
