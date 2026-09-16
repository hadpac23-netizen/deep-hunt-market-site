const fs=require("fs");
const assert=require("assert");

let src=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const m=src.match(/function routeManager\(message:string\)\{[\s\S]*?\n\}/);
if(!m)throw new Error("routeManager source missing");
let fnSrc=m[0]
  .replace("function routeManager(message:string)","function routeManager(message)")
  .replace("const rules:[RegExp,string][]=","const rules=");
const routeManager=new Function(fnSrc+"; return routeManager;")();

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

console.log(JSON.stringify({
  cases:cases.length,
  specialist_correct:specialistCorrect,
  specialist_accuracy:specialistRate,
  single_agent_baseline_correct:baselineCorrect,
  single_agent_baseline_accuracy:baselineRate,
  routing_gain:specialistRate-baselineRate
},null,2));