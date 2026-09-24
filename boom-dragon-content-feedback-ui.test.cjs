const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("boom-ai-studio.html","utf8");
const ui=fs.readFileSync("boom-dragon-content-feedback-ui.js","utf8");
assert(html.includes("boom-dragon-content-feedback.js"));
assert(html.includes("boom-dragon-content-feedback-ui.js"));
for(const x of ["Creative","Published","Attributed","Purchase","Profit","Winner eligible","Revenue/clicks alone"])assert(ui.includes(x),x+" missing");
console.log("DRAGON Content Feedback UI contract: PASS");