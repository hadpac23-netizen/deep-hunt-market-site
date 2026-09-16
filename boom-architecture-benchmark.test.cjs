const fs=require("fs");
const assert=require("assert");

let src=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const start=src.indexOf("const ROUTE_RULES:");
const end=src.indexOf("function buildModelCircuitState",start);
if(start<0||end<0)throw new Error("routing source missing");
let fnSrc=src.slice(start,end)
  .replace("const ROUTE_RULES:[RegExp,string][]=","const ROUTE_RULES=")
  .replace("function routeManager(message:string)","function routeManager(message)")
  .replace("function routeManagerDecision(message:string)","function routeManagerDecision(message)");
const routing=new Function(fnSrc+"; return {routeManager,routeManagerDecision};")();
const routeManager=routing.routeManager;
const routeManagerDecision=routing.routeManagerDecision;

const cases=[
  ["CJ stock refresh","supplier-cj"],
  ["EPROLO feed validation","supplier-eprolo"],
  ["inventory availability stale","inventory-truth"],
  ["checkout payment paypal","checkout-payment"],
  ["marketing campaign traffic","marketing-growth"],
  ["new customer acquisition","f35-acquisition"],
  ["sales orders today","sales-director"],
  ["profit margin pricing","pricing-profit"],
  ["10K daily mission","daily-10k-mission"],
  ["category gaps","category-orchestrator"],
  ["shelf merchandising rotation","dynamic-merchandising"],
  ["women fashion","dept-women"],
  ["men clothing","dept-men"],
  ["kids baby products","dept-kids-baby"],
  ["beauty perfume makeup","dept-beauty"],
  ["tech phone laptop","dept-tech"],
  ["toys catalog","dept-toys"],
  ["pets dog cat","dept-pets"],
  ["sports gym","dept-sports"],
  ["home lighting","dept-home"],
  ["shipping country localization","supplier-shipping"],
  ["analytics tracking","analytics-truth"],
  ["security access permissions","security-access"],
  ["site bug repair","repair-engineering"],
  ["uptime performance reliability","site-reliability"],
  ["API connector integration","integration-connections"],
  ["research trend F35","f35-research"],
  ["sale readiness quality","sale-readiness"],
  ["refund customer care","returns-care"],
  ["like save feedback","feedback-intelligence"],
  ["production release deploy","release-control"]
];

let specialistCorrect=0;
let baselineCorrect=0;
for(const [input,expected] of cases){
  const routed=routeManager(input);
  if(routed===expected)specialistCorrect++;
  if("boom-super-agent"===expected)baselineCorrect++;
}
const specialistRate=specialistCorrect/cases.length;
const baselineRate=baselineCorrect/cases.length;
assert.equal(specialistCorrect,cases.length,"specialist router missed a benchmark task");
assert(specialistRate>baselineRate,"specialist routing did not beat single-agent baseline");

let confidentSpecialist=0;
for(const [input,expected] of cases){
  const d=routeManagerDecision(input);
  assert.equal(d.manager_id,expected,"confidence router changed known route: "+input);
  assert.equal(d.abstained,false,"known specialist route abstained: "+input);
  assert(d.confidence>=.95,"known specialist confidence too low: "+input);
  confidentSpecialist++;
}

const unknown=[
  "what should we think about next",
  "continue the current work",
  "summarize the situation",
  "give me a strategic view",
  "what did we learn"
];
let unknownAbstained=0;
for(const input of unknown){
  const d=routeManagerDecision(input);
  assert.equal(d.manager_id,"boom-super-agent","unknown task picked a specialist: "+input);
  assert.equal(d.abstained,true,"unknown task did not abstain: "+input);
  assert(d.confidence<.65,"unknown task confidence too high: "+input);
  unknownAbstained++;
}

const ambiguous=[
  "check inventory and payment checkout",
  "marketing campaign and sales orders",
  "security review and production deploy",
  "inventory stock and shipping country",
  "site bug and performance reliability"
];
let ambiguousAbstained=0;
for(const input of ambiguous){
  const d=routeManagerDecision(input);
  assert.equal(d.manager_id,"boom-super-agent","ambiguous task picked one specialist: "+input);
  assert.equal(d.abstained,true,"ambiguous task did not abstain: "+input);
  assert(d.matched_managers.length>=2,"ambiguous task did not expose multiple signals: "+input);
  ambiguousAbstained++;
}

console.log(JSON.stringify({
  cases:cases.length,
  specialist_correct:specialistCorrect,
  specialist_accuracy:specialistRate,
  single_agent_baseline_correct:baselineCorrect,
  single_agent_baseline_accuracy:baselineRate,
  routing_gain:specialistRate-baselineRate,
  confident_specialist_cases:confidentSpecialist,
  unknown_abstained:unknownAbstained,
  ambiguous_abstained:ambiguousAbstained
},null,2));