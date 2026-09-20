const fs=require("fs");
const contract=JSON.parse(fs.readFileSync("boom-surface-contract.json","utf8"));
const errors=[];

for(const row of contract.surfaces){
  if(!fs.existsSync(row.file))continue;
  const html=fs.readFileSync(row.file,"utf8");
  if(html.includes("\\n  <script src=\"boom-runtime.js"))errors.push(row.file+": literal escaped newline before runtime script");
  const runtime=html.indexOf("boom-runtime.js");
  if(runtime>=0){
    const supabase=html.indexOf("@supabase/supabase-js");
    if(supabase>=0&&supabase>runtime)errors.push(row.file+": runtime loads before Supabase");
    if(!html.includes("boom-runtime.js?v=brainos2"))errors.push(row.file+": stale runtime cache version");
  }
}

for(const file of ["hunt-deal.js","checkout.js"]){
  const src=fs.readFileSync(file,"utf8");
  if(/\bcartKey\b|\breadCart\b|localStorage\.(?:getItem|setItem)\([^\n]*cart/i.test(src)){
    errors.push(file+": direct cart storage ownership returned");
  }
}
const productFlow=fs.readFileSync("product-flow.js","utf8");
if(!productFlow.includes("runtime?.getSupabaseClient?.()"))errors.push("product-flow.js bypasses shared Supabase runtime client");

const runtimeSrc=fs.readFileSync("boom-runtime.js","utf8");
for(const file of fs.readdirSync(".").filter(name=>name.endsWith(".js")&&name!=="boom-runtime.js")){
  const src=fs.readFileSync(file,"utf8");
  if(/\bcreateClient\s*\(/.test(src))errors.push(file+": duplicate Supabase client creation outside boom-runtime.js");
}
if(!runtimeSrc.includes("boom-feedback-center"))errors.push("boom-runtime.js missing global feedback center");
if(!runtimeSrc.includes("actionFeedback(payload)"))errors.push("boom-runtime.js missing canonical action feedback routing");
if(!runtimeSrc.includes("pointer-events:none"))errors.push("feedback center may block shopper controls");
if(!runtimeSrc.includes("async function adminReady()"))errors.push("boom-runtime.js missing shared admin gate");
if(!runtimeSrc.includes("traceContext={}"))errors.push("boom-runtime.js missing trace context lineage");
if(!runtimeSrc.includes("loadActionContract()"))errors.push("boom-runtime.js missing action metadata loading");

const studioHtml=fs.readFileSync("boom-brain-studio.html","utf8");
const studioJs=fs.readFileSync("boom-brain-studio.js","utf8");
if(!studioHtml.includes('data-admin-ready="false"'))errors.push("Brain Studio may flash private content before admin verification");
if(!studioJs.includes("runtime?.adminReady?.()"))errors.push("Brain Studio missing admin verification before contract load");
if(!studioJs.includes('json("boom-commerce-handoff-contract.json")'))errors.push("Brain Studio missing Commerce → Operations handoff contract");
if(!studioHtml.includes('id="bs-commerce-handoff"'))errors.push("Brain Studio missing commerce handoff surface");

for(const file of ["product.html","category.html","checkout.html","index.html"]){
  const html=fs.readFileSync(file,"utf8");
  if(!html.includes("boom-evidence-confidence.js"))errors.push(file+": evidence confidence engine not loaded");
}

const connections=fs.readFileSync("f60t-connections.js","utf8");
if(!connections.includes("runtime.adminReady()"))errors.push("F60T Connections bypasses shared admin gate");
if(/createClient\(/.test(connections))errors.push("F60T Connections may create a duplicate Supabase client");
if(!connections.includes('endpoint:"hunt-f60t-oauth"'))errors.push("F60T connector trace missing official Edge endpoint lineage");

const partnerHtml=fs.readFileSync("partner-outreach.html","utf8");
const partnerRuntimeAt=partnerHtml.indexOf("boom-runtime.js");
const partnerConfidenceAt=partnerHtml.indexOf("boom-evidence-confidence.js");
const partnerEvidenceAt=partnerHtml.indexOf("boom-partner-evidence.js");
const partnerAppAt=partnerHtml.indexOf("partner-outreach.js");
if([partnerRuntimeAt,partnerConfidenceAt,partnerEvidenceAt,partnerAppAt].some(x=>x<0) ||
   !(partnerRuntimeAt<partnerConfidenceAt&&partnerConfidenceAt<partnerEvidenceAt&&partnerEvidenceAt<partnerAppAt)){
  errors.push("partner outreach evidence runtime load order is invalid");
}
const partnerSrc=fs.readFileSync("partner-outreach.js","utf8");
if(!partnerSrc.includes("BoomPartnerEvidence?.load?.(client)"))errors.push("partner outreach does not consume persisted partner evidence");

const homeHtml=fs.readFileSync("index.html","utf8");
const migrationAt=homeHtml.indexOf("boom-storage-migrations.js");
const i18nAt=homeHtml.indexOf("i18n.js");
if(migrationAt<0||i18nAt<0||migrationAt>i18nAt)errors.push("storage migrations must load before i18n");

const i18nSrc=fs.readFileSync("i18n.js","utf8");
if(!i18nSrc.includes('LANGUAGE_KEY = "hunt_language_v1"'))errors.push("i18n still lacks versioned language key");
if(!i18nSrc.includes("LEGACY_LANGUAGE_KEY"))errors.push("i18n lacks safe legacy fallback during migration");

const core=fs.readFileSync("market-core.js","utf8");
for(const fn of ["addCart","removeCart","setCartQuantity","clearCart","updateCartBadges"]){
  if(!core.includes(fn))errors.push("market-core.js missing cart owner function "+fn);
}

if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log("BOOM runtime contract: PASS — load order, cache version and single cart owner");
