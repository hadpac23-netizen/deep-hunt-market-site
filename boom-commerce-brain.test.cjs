const fs=require("fs"),assert=require("assert");
const read=f=>fs.readFileSync(f,"utf8");
const brain=read("boom-commerce-brain.js");
const stylist=read("boom-stylist.js");
const director=read("boom-f35-director.js");
const styleCss=read("boom-stylist.css");
const fn=read("netlify/functions/boom-ai-director.mts");
const discovery=read("hunt-discovery-engine.js");
const night=read("hunt-night-edit.js");
const productFlow=read("product-flow.js");
const category=read("category.js");
const search=read("search.js");
const legal=JSON.parse(read("legal-config.json"));

for(const token of ["fallbackPlan","requestAI","scoreProduct","boom:plan","hunt:search-intent","boom:phase"])
  assert(brain.includes(token),"Brain contract missing "+token);
assert(brain.includes('fetch("/api/boom-ai-director"'),"AI endpoint not connected");
assert(brain.includes("AI_TTL"),"AI cache TTL missing");
assert(brain.includes("navigator.onLine"),"AI offline fallback missing");
assert(brain.includes('source:"local"'),"Local deterministic source missing");

assert(fn.includes('model: "gpt-5.6-sol"'),"Expected GPT-5.6 Sol AI model");
assert(fn.includes('path: "/api/boom-ai-director"'),"AI function route missing");
assert(fn.includes("rateLimit"),"AI endpoint rate limit missing");
assert(fn.includes('windowLimit: 6')&&fn.includes('windowSize: 60'),"AI endpoint rate limit contract wrong");
assert(fn.includes("OPENAI_BASE_URL")&&fn.includes("OPENAI_API_KEY"),"Netlify AI Gateway env contract missing");
for(const phrase of ["Never use pressure","Never infer sensitive traits","Never recommend payment","PRESENTATION ONLY"])
  assert(fn.includes(phrase),"AI ethical constraint missing: "+phrase);
for(const pii of ["email","phone","account_id","payment_details"])
  assert(!brain.includes('context.'+pii),"PII field leaked into AI client context: "+pii);

for(const lang of ["en","he","ar","es","fr","ja","zh"])
  assert(stylist.includes(lang+':{')||stylist.includes('"'+lang+'"'),"Stylist locale missing "+lang);
assert(stylist.includes("BoomCommerceBrain?.plan?.()"),"Stylist initial plan handoff missing");
assert(styleCss.includes("--boom-accent"),"Stylist visual variables missing");
assert(styleCss.includes("prefers-reduced-motion"),"Stylist reduced-motion safety missing");

assert(director.includes('"arrival"')&&director.includes('"discover"')&&director.includes('"deepen"')&&director.includes('"intent"'),"F35 session phases missing");
assert(director.includes("IntersectionObserver"),"F35 focus observer missing");
assert(director.includes("boom:phase"),"F35 phase event missing");

assert(discovery.includes('window.addEventListener("boom:plan"'),"HUNT NOW is not brain-controlled");
assert(night.includes('window.addEventListener("boom:plan"'),"Night Edit is not brain-controlled");
assert(productFlow.includes("BoomCommerceBrain?.scoreProduct"),"Product discovery brain score missing");
assert(category.includes("BoomCommerceBrain?.scoreProduct"),"Category brain score missing");
assert(search.includes('new CustomEvent("hunt:search-intent"'),"Search summary event missing");
const searchEvent=search.slice(search.indexOf('new CustomEvent("hunt:search-intent"'),search.indexOf('try{S.results=await load(i);'));
assert(!searchEvent.includes("query:q")&&!searchEvent.includes("raw:q")&&!searchEvent.includes("text:q"),"Raw search text leaked into brain event");

const pages=["index.html","product.html","category.html","search.html","checkout.html","profile.html","auth.html"];
for(const page of pages){
  const s=read(page);
  assert(s.includes("boom-stylist.css?v=1"),page+" missing BOOM stylist CSS");
  assert(s.includes("boom-commerce-brain.js?v=1"),page+" missing BOOM brain");
  assert(s.includes("boom-stylist.js?v=1"),page+" missing BOOM stylist");
  assert(s.includes("boom-f35-director.js?v=1"),page+" missing F35 director");
}

assert(fs.existsSync("docs/BOOM-HUNT-COMMERCE-BRAIN-F35-MASTER-PROMPT.md"),"BOOM master prompt missing");
assert(fs.existsSync("docs/BOOM-STYLIST-ETHICAL-BEHAVIORAL-DESIGN-SKILL.md"),"BOOM stylist skill missing");
assert(legal.payments_status==="PRELAUNCH","Payment gate changed unexpectedly");

console.log("boom_commerce_brain=PASS",{pages:pages.length,model:"gpt-5.6-sol"});