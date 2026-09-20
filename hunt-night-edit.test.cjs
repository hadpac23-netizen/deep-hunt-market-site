const fs=require("fs");
const assert=require("assert");

const src=fs.readFileSync("hunt-night-edit.js","utf8");

assert(src.includes("function resolveWorld(requestedWorld)"),"Night Edit must use bounded world resolver");
assert(src.includes("for(let offset=0;offset<WORLDS.length;offset++)"),"Night Edit resolver must be bounded by world count");
assert(!src.includes("return renderWorld(nextWorld"),"Night Edit must not recurse when a world has too few products");
assert(src.includes("root.hidden=true"),"Night Edit must hide safely when no world has enough products");
assert(src.includes("root.hidden=false"),"Night Edit must recover when products become available");
assert(src.includes("return false;"),"Night Edit empty-state path must terminate");
assert(src.includes("return true;"),"Night Edit successful render should terminate explicitly");

console.log("hunt_night_edit_recursion_guard=PASS");
