const fs=require("fs");
const assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");

const start=src.indexOf("function parseModelRouteSpec");
const end=src.indexOf("function scoreModelBenchmark",start);
if(start<0||end<0)throw new Error("benchmark cost helper missing");
let s=src.slice(start,end)
  .replace("function parseModelRouteSpec(spec:string)","function parseModelRouteSpec(spec)")
  .replace("function estimateBenchmarkReferenceCost(routes:string[],casesCount:number,costRows:any[],inputTokens=6000,outputTokens=700)","function estimateBenchmarkReferenceCost(routes,casesCount,costRows,inputTokens=6000,outputTokens=700)")
  .replace("const details:any[]=[]","const details=[]")
  .replace(/\(x:any\)/g,"x");
const helpers=new Function(s+";return {parseModelRouteSpec,estimateBenchmarkReferenceCost};")();

const costs=[
 {provider:"groq",model:"openai/gpt-oss-120b",pricing_tier:"reference_standard",input_usd_per_million:.15,output_usd_per_million:.60,active:true},
 {provider:"gemini",model:"gemini-3.5-flash",pricing_tier:"reference_paid_standard",input_usd_per_million:1.50,output_usd_per_million:9.00,active:true}
];
const plan=helpers.estimateBenchmarkReferenceCost(
 ["groq:openai/gpt-oss-120b","gemini:gemini-3.5-flash"],5,costs
);
assert.equal(plan.ok,true,"benchmark plan failed");
assert.equal(plan.total,.0831,"benchmark reference cost changed");
assert.equal(plan.details.length,2,"route cost details missing");

assert(src.includes('action==="model_benchmark_plan"||action==="model_benchmark_execute"'),"benchmark action gate missing");
assert(src.includes('body?.owner_approved!==true'),"benchmark owner approval missing");
assert(src.includes('maxCost>0.25'),"benchmark hard cost cap missing");
assert(src.includes('routes.length!==2||new Set(routes).size!==2'),"two-route gate missing");
assert(src.includes('benchmark_strict_route:true'),"strict-route benchmark missing");
assert(src.includes('if(ctx?.benchmark_strict_route)'),"strict route fallback stop missing");
assert(src.includes('live_business_actions:0'),"benchmark live-business assertion missing");

console.log(JSON.stringify({estimated_reference_cost_usd:plan.total,calls:10,hard_cap_usd:.25},null,2));
