const fs=require("fs");
const assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const start=src.indexOf("const ROUTE_RULES:");
const end=src.indexOf("function shouldLearnOwner",start);
if(start<0||end<0)throw new Error("routing source missing");
let s=src.slice(start,end)
  .replace("const ROUTE_RULES:[RegExp,string][]=","const ROUTE_RULES=")
  .replace("function routeManager(message:string)","function routeManager(message)")
  .replace("function routeManagerDecision(message:string)","function routeManagerDecision(message)");
const routing=new Function(s+";return {routeManager,routeManagerDecision};")();
const routeManager=routing.routeManager;
const routeManagerDecision=routing.routeManagerDecision;

const cases=[
 ["inventory stock and payment checkout",["inventory-truth","checkout-payment"]],
 ["marketing campaign and sales orders",["marketing-growth","sales-director"]],
 ["security access and production deploy",["security-access","release-control"]],
 ["inventory stock and shipping country",["inventory-truth","supplier-shipping"]],
 ["site bug and performance reliability",["repair-engineering","site-reliability"]]
];

let singleCoverage=0,teamCoverage=0,maxTeam=0;
const details=[];
for(const row of cases){
  const task=row[0],expected=row[1];
  const single=routeManager(task);
  const team=routeManagerDecision(task);
  assert(team.abstained,"hard multi-domain task should not pick one specialist");
  assert.deepEqual(new Set(team.matched_managers),new Set(expected),"team planner missed expected specialists");
  const singleHit=expected.includes(single)?1:0;
  singleCoverage+=singleHit/expected.length;
  teamCoverage+=team.matched_managers.filter(x=>expected.includes(x)).length/expected.length;
  maxTeam=Math.max(maxTeam,team.matched_managers.length);
  details.push({task,single,team:team.matched_managers,single_coverage:singleHit/expected.length,team_coverage:1});
}
singleCoverage/=cases.length;
teamCoverage/=cases.length;
assert.equal(teamCoverage,1,"team planner did not cover all hard-task domains");
assert(teamCoverage>singleCoverage,"team planner did not improve coverage");
assert(maxTeam<=2,"benchmark team exceeded bounded size");
console.log(JSON.stringify({
  cases:cases.length,
  single_coverage:singleCoverage,
  team_coverage:teamCoverage,
  gain:teamCoverage-singleCoverage,
  max_team_size:maxTeam,
  judge_required:true,
  details
},null,2));
