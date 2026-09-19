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
const productQa=read("hunt-product-qa.js");
const analytics=read("analytics.js");
const legal=JSON.parse(read("legal-config.json"));

for(const token of ["fallbackPlan","requestAI","scoreProduct","explainProduct","decisionState","decisionSupport","shoppingMission","missionQualifiers","decision_goal","choice_mode","recommendation_strategy","clarify_mode","diversity_mode","explanation_mode","shopping_mission","hunt:shopping-action","boom:plan","hunt:search-intent","boom:phase"])
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
for(const phrase of ["Never use pressure","Never infer sensitive traits","Never recommend payment","DECISION SUPPORT + PRESENTATION ONLY","Reduce cognitive load","Reduce uncertainty","Preserve autonomy"])
  assert(fn.includes(phrase),"AI ethical constraint missing: "+phrase);
for(const token of ["decision_goal","choice_mode","recommendation_strategy","clarify_mode","diversity_mode","explanation_mode","shopping_mission","mission_qualifiers","interaction_summary"])
  assert(fn.includes(token),"AI behavioral decision contract missing "+token);
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
for(const token of ["mission_type","has_device","has_size","hd-clarify-panel","BOOM CLARIFY ONCE"])
  assert(search.includes(token)||read("search.html").includes(token),"Mission/clarification contract missing "+token);
assert(analytics.includes("mission_type")&&analytics.includes("hunt_shopping_mission_v1"),"Mission outcome telemetry missing");
for(const token of ["hunt:product-state","topicFrom","answerVerified","answerCompatibility","answerShipping","answerReturns","explainProduct"])
  assert(productQa.includes(token)||read("product.js").includes(token),"Product Q&A contract missing "+token);
assert(!productQa.includes("fetch("),"Product Q&A must not send free-text questions to a server");
assert(read("product.html").indexOf("hunt-product-qa.js?v=3")<read("product.html").indexOf("product.js?v=launchqa11"),"Product Q&A listener must load before product state publisher");
const searchEvent=search.slice(search.indexOf('new CustomEvent("hunt:search-intent"'),search.indexOf('try{S.results=await load(i);'));
assert(!searchEvent.includes("query:q")&&!searchEvent.includes("raw:q")&&!searchEvent.includes("text:q"),"Raw search text leaked into brain event");

const pages=["index.html","product.html","category.html","search.html","checkout.html","profile.html","auth.html"];
for(const page of pages){
  const s=read(page);
  assert(s.includes("boom-stylist.css?v=1"),page+" missing BOOM stylist CSS");
  assert(s.includes("boom-commerce-brain.js?v=2"),page+" missing BOOM brain");
  assert(s.includes("boom-stylist.js?v=1"),page+" missing BOOM stylist");
  assert(s.includes("boom-f35-director.js?v=1"),page+" missing F35 director");
  assert(s.includes("analytics.js?v=huntmetrics2"),page+" missing mission-aware analytics");
}

assert(fs.existsSync("docs/BOOM-HUNT-COMMERCE-BRAIN-F35-MASTER-PROMPT.md"),"BOOM master prompt missing");
assert(fs.existsSync("docs/BOOM-STYLIST-ETHICAL-BEHAVIORAL-DESIGN-SKILL.md"),"BOOM stylist skill missing");
assert(fs.existsSync("docs/BOOM-BEHAVIORAL-COMMERCE-INTELLIGENCE.md"),"Behavioral commerce intelligence skill missing");
assert(legal.payments_status==="PRELAUNCH","Payment gate changed unexpectedly");

console.log("boom_commerce_brain=PASS",{pages:pages.length,model:"gpt-5.6-sol"});