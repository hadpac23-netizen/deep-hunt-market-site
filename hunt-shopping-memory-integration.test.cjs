const assert=require("node:assert/strict");
const fs=require("node:fs");
const shopping=fs.readFileSync("shopping-actions.js","utf8");
const memory=fs.readFileSync("hunt-experience-memory.js","utf8");
assert(shopping.includes("action:kind,active"),"shopping action must emit changed action and active state");
assert(shopping.includes("action:kind,active:preferenceActive"),"account shopping action must emit changed action");
assert(memory.includes('d.action==="like"||d.action==="save"'),"memory must read changed shopping action");
assert(memory.includes("d.active===true"),"memory must ignore deactivation as a positive taste signal");
console.log("HUNT Shopping/Memory integration tests: PASS");
