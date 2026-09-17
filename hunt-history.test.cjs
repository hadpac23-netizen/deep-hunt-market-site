const assert=require("node:assert/strict");
const fs=require("node:fs");

const html=fs.readFileSync("history.html","utf8");
const js=fs.readFileSync("hunt-history.js","utf8");
const css=fs.readFileSync("hunt-history.css","utf8");
const memory=fs.readFileSync("hunt-experience-memory.js","utf8");

assert(html.includes("HUNT MEMORY"),"History heading missing");
assert(html.includes('id="hunt-history-reset"'),"Reset control missing");
assert(html.includes("does not delete your account"),"Reset scope disclosure missing");
assert(html.includes("hunt-experience-memory.js"),"Memory core missing");
assert(html.includes("shopping-actions.js"),"Like/Save state bridge missing");
assert(js.includes("Memory.historyGroups()"),"History grouping missing");
assert(js.includes("Memory.clear()"),"Memory reset action missing");
assert(js.includes("Press again to reset memory"),"Safe two-step reset missing");
assert(js.includes("hunt:shopping-state"),"Shopping state listener missing");
assert(css.includes("prefers-reduced-motion"),"Reduced motion support missing");
assert(memory.includes("title:clean(input.title)"),"Memory title metadata missing");
assert(memory.includes("image_url:clean(input.image_url)"),"Memory image metadata missing");
assert(memory.includes('new CustomEvent("hunt:memory-reset")'),"Memory reset event missing");

console.log("HUNT History tests: PASS");
