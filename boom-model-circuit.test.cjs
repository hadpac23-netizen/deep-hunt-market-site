const fs=require("fs");
const assert=require("assert");
const src=fs.readFileSync("supabase/functions/hunt-boom-chat/index.ts","utf8");
const start=src.indexOf("function buildModelCircuitState");
const end=src.indexOf("function shouldLearnOwner",start);
if(start<0||end<0)throw new Error("buildModelCircuitState source missing");
let s=src.slice(start,end)
  .replace("function buildModelCircuitState(observations:any[])","function buildModelCircuitState(observations)")
  .replace("new Map<string,{attempts:number,successes:number,rateLimited:number}>()","new Map()")
  .replace("const out:any={}","const out={}");
const buildModelCircuitState=new Function(s+";return buildModelCircuitState;")();

const rows=[];
for(let i=0;i<6;i++)rows.push({provider:"openai",success:false,status_code:429});
for(let i=0;i<5;i++)rows.push({provider:"groq",success:i<4,status_code:i<4?200:500});
for(let i=0;i<5;i++)rows.push({provider:"gemini",success:i<3,status_code:i<3?200:500});
for(let i=0;i<4;i++)rows.push({provider:"tiny",success:false,status_code:429});

const state=buildModelCircuitState(rows);
assert.equal(state.openai.open,true,"OpenAI rate-limit circuit did not open");
assert.equal(state.openai.rate_limit_rate,1,"OpenAI rate-limit ratio wrong");
assert.equal(state.groq.open,false,"healthy Groq circuit opened");
assert.equal(state.gemini.open,false,"usable Gemini circuit opened");
assert.equal(state.tiny.open,false,"circuit opened with fewer than five samples");
assert.equal(state.groq.success_rate,.8,"Groq success rate wrong");
assert.equal(state.gemini.success_rate,.6,"Gemini success rate wrong");

assert(src.includes('note:"circuit_open"'),"circuit-open skip marker missing");
assert(src.includes('x?.note!=="circuit_open"'),"circuit-open self-poison prevention missing");
assert(src.includes('modelHealthSince=new Date(Date.now()-6*60*60*1000)'),"six-hour health window missing");
console.log(JSON.stringify({openai:state.openai,groq:state.groq,gemini:state.gemini,tiny:state.tiny},null,2));
