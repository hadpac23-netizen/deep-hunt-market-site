const fs=require("fs");
const assert=require("assert");

const src=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");

assert(src.includes("function routeManager(message:string)"),"deterministic routeManager missing");
assert(src.includes("owner_approval_required:needsOwnerGate(message)"),"deterministic owner gate missing");
assert(src.includes('action_class:"PROPOSE"'),"owner chat command should stage/propose, not execute live action");

const commandStart=src.indexOf('if(mode==="command")');
const ctxStart=src.indexOf("const ctx={",commandStart);
assert(commandStart>=0&&ctxStart>commandStart,"command staging block missing");
const commandBlock=src.slice(commandStart,ctxStart);
assert(!commandBlock.includes("ai?.reply"),"AI output leaked into deterministic command staging");
assert(!commandBlock.includes("aiReply("),"AI call leaked into deterministic command staging");

const aiCall=src.indexOf("aiReply(message,history,ctx)");
assert(aiCall>ctxStart,"AI reasoning should happen after deterministic command/context construction");

for(const forbidden of ["payplus","create supplier order","charge card","capture payment"]){
  assert(!src.toLowerCase().includes(forbidden),"chat edge function contains direct live execution path: "+forbidden);
}

console.log("BOOM orchestration boundary test: PASS");