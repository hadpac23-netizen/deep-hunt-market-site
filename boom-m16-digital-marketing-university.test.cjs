const fs=require("node:fs");
const assert=require("node:assert");
const html=fs.readFileSync("boom-growth-os.html","utf8");
const js=fs.readFileSync("boom-growth-os.js","utf8");
const uni=fs.readFileSync("boom-digital-marketing-university.js","utf8");

for(const token of [
"M16 · DIGITAL MARKETING UNIVERSITY",
'id="bg-university-state"',
'id="bg-university-stats"',
'id="bg-university-readiness"',
'id="bg-university-levels"',
'boom-digital-marketing-university.js?v=m16'
]) assert(html.includes(token),"M16 Studio surface missing: "+token);

for(const token of [
"function universityReadiness",
"function renderUniversity",
"holdout_framework_ready:false",
"guardrail_measurement_ready:false",
"learning_archive_ready:false",
"source_verification_workflow_ready:false",
"const skillOnly=[]"
]) assert(js.includes(token),"M16 Studio governance missing: "+token);

for(const token of [
"GRADUATION_CANDIDATE","ROLLBACK_CANDIDATE",
"official_source_not_verified","control_not_measured",
"red_team_missing","graduate:false","adopt:false",
"paid_launch:false","execute:false","auto_adopt:false"
]) assert(uni.includes(token),"M16 university contract missing: "+token);

assert(!/fetch\s*\(|XMLHttpRequest/.test(uni),"M16 runtime must remain local-only");
console.log("boom_m16_digital_marketing_university_contract=PASS");