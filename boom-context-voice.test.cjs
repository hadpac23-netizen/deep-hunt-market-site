const fs=require("fs");
const assert=require("assert");
const cp=require("child_process");

cp.execFileSync("npx",["--yes","esbuild","supabase/functions/hunt-boom-chat/boom-context.ts","--bundle","--platform=node","--format=cjs","--outfile=/tmp/boom-context-regression.cjs"],{stdio:"ignore"});
const c=require("/tmp/boom-context-regression.cjs");

const spoken=c.toSpokenText("**HUNT**\n- Search: ✅\n# Next\nhttps://example.com\ncode sample");
assert(!/[\*#|]/.test(spoken),"spoken_text leaked markdown");
assert(!/https?:/.test(spoken),"spoken_text leaked URL");

const current={
  active_topic:"HUNT Checkout & Payments",
  active_goal:"verify checkout",
  current_task:"check payment preview",
  next_expected_step:"run checkout QA",
  relevant_managers:["checkout-payment"],
  topic_history:[]
};
for(const ping of ["ילה","בווום","היי בום","לא הבנתי","איפה זה עומד עכשיו"]){
  const next=c.deriveTopicState(ping,current,"boom-super-agent","00000000-0000-0000-0000-000000000001");
  assert.equal(next.active_topic,current.active_topic,ping+" reset topic");
  assert.equal(next.active_goal,current.active_goal,ping+" reset goal");
  assert.equal(next.current_task,current.current_task,ping+" reset task");
  assert.equal(next.relevant_managers[0],"checkout-payment",ping+" reset manager");
  assert.equal(next.next_expected_step,"run checkout QA",ping+" reset next step");
}
const next=c.deriveTopicState("ילה",current,"boom-super-agent","00000000-0000-0000-0000-000000000001");

const report=c.buildCopyReport({
  reports:[
    {manager_id:"supplier-cj",status:"watch",issues:["stale stock"]},
    {manager_id:"supplier-eprolo",status:"watch",issues:["not connected"]}
  ],
  evals:[
    {metric_name:"attention_manager_count",current_value:8,passed:false},
    {metric_name:"command_duplicate_rate",current_value:0,passed:true}
  ],
  open_commands:[],
  project_memory:[],
  learning:[
    ...Array.from({length:4},(_,i)=>({domain:"agent-architecture",title:"learned-"+(i+1),status:"learned"})),
    ...Array.from({length:10},(_,i)=>({domain:"ai-engineering",title:"testing-"+(i+1),status:"testing"}))
  ]
},{
  ...next,
  active_topic:"BOOM Learning / AI Engineering",
  active_goal:"ללמוד הנדסת AI",
  current_task:"להמשיך ללמוד ולסכם"
},null);
assert(report.startsWith("BOOM COPY REPORT"),"copy report header missing");
assert(report.includes("TOPIC:"),"copy report topic missing");
assert(report.includes("NEXT ACTION:"),"copy report next action missing");
assert(!report.includes("attention_manager_count"),"copy report mixed stale attention eval into live snapshot");
assert(report.includes("AI learning items: 14"),"AI learning count missing");
assert(report.includes("Learned and behavior-backed: 4"),"learned count missing");
assert(report.includes("Still testing: 10"),"testing count missing");
assert(report.includes("Learned: learned-1"),"learned items missing");
assert(report.includes("testing-1 — still testing"),"testing items missing");
assert(!report.includes("supplier-cj"),"AI learning report leaked unrelated HUNT blocker");
assert(!report.includes("supplier-eprolo"),"AI learning report leaked unrelated supplier blocker");

const edge=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
assert(edge.includes("display_text:reply"),"display_text API missing");
assert(edge.includes("spoken_text:spokenText"),"spoken_text API missing");
assert(edge.includes("copy_report:copyReport"),"copy_report API missing");
assert(edge.includes("topic_state:topicState"),"topic_state context missing");

const studio=fs.readFileSync("boom-ai-studio.js","utf8");
assert(studio.includes("data.spoken_text"),"Studio does not consume spoken_text");
assert(studio.includes("data.copy_report"),"Studio does not consume copy_report");
assert(studio.includes("copy-report-btn"),"Studio copy button missing");

console.log("BOOM context/voice/copy test: PASS");