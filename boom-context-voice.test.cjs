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
const next=c.deriveTopicState("ילה",current,"boom-super-agent","00000000-0000-0000-0000-000000000001");
assert.equal(next.active_topic,current.active_topic,"continuation reset topic");
assert.equal(next.relevant_managers[0],"checkout-payment","continuation reset manager");
assert.equal(next.next_expected_step,"run checkout QA","continuation reset next step");

const report=c.buildCopyReport({
  reports:[],
  evals:[{metric_name:"command_duplicate_rate",current_value:0,passed:true}],
  open_commands:[],
  project_memory:[]
},next,null);
assert(report.startsWith("BOOM COPY REPORT"),"copy report header missing");
assert(report.includes("TOPIC:"),"copy report topic missing");
assert(report.includes("NEXT ACTION:"),"copy report next action missing");

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