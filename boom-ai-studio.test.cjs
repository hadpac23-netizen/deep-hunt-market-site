const fs=require("node:fs");
const assert=require("node:assert");

const html=fs.readFileSync("boom-ai-studio.html","utf8");
const css=fs.readFileSync("boom-ai-studio.css","utf8");
const js=fs.readFileSync("boom-ai-studio.js","utf8");

assert(html.includes('id="login-screen"'),"auth gate missing");
assert(html.includes('id="login-form"'),"login form missing");
assert(js.includes("signInWithPassword"),"password auth missing");
assert(js.includes('select("is_admin")'),"admin check missing");

assert(html.includes('data-manager-id="boom-meta-f35"'),"Meta-F35 node missing");
assert(html.includes('data-manager-id="boom-super-agent"'),"Super Agent node missing");
assert(js.includes("toolNodes"),"department/tool nodes missing");
assert(js.includes('["supplier-hypersku","HyperSKU Supplier","HyperSKU","H"]'),"HyperSKU Studio department node missing");
assert(js.includes('department:"TIER 0 SUPPLIER"'),"HyperSKU Studio fallback inspector missing");
assert(js.includes('id:"hypersku",name:"HyperSKU Supplier",kind:"TIER 0 SUPPLIER API"'),"HyperSKU BOOM Connect card missing");
assert(js.includes("Read-only first · live fulfillment requires explicit Owner approval"),"HyperSKU Connect gate missing");

assert(js.includes("hunt_boom_agent_commands"),"command data source missing");
assert(js.includes("hunt_boom_improvement_cycles"),"cycle data source missing");
assert(js.includes("hunt_boom_evals"),"eval data source missing");
assert(js.includes("hunt_boom_learning_items"),"learning data source missing");

assert(html.includes('id="trace-summary"'),"trace summary missing");
for(const type of ["command","event","worker","cycle","eval"]){
  assert(html.includes('data-trace-type="'+type+'"'),"trace filter missing: "+type);
  assert(js.includes('type:"'+type+'"'),"trace row mapping missing: "+type);
}
assert(js.includes("state.traceType"),"trace filter state missing");
assert(js.includes("trace-evidence"),"trace evidence rendering missing");
assert(css.includes(".trace-summary"),"trace summary styling missing");
assert(css.includes(".trace-filter.active"),"active trace filter styling missing");

assert(html.includes('id="attention-focus"'),"attention focus control missing");
assert(html.includes('id="attention-count"'),"attention count missing");
assert(js.includes("function attentionReports()"),"attention severity selector missing");
assert(js.includes("function focusAttention()"),"attention focus action missing");
assert(js.includes("performance.now()"),"attention focus latency measurement missing");
assert(js.includes('["critical","blocked","watch"]'),"attention severity filter missing");
assert(css.includes(".node.attention-focus"),"attention node highlight missing");

assert(html.includes("provider not enabled yet"),"truthful model connector state missing");
assert(js.includes("provider not enabled yet"),"model inspector truth state missing");

assert(css.includes("@media(max-width:900px)"),"mobile breakpoint missing");
assert(css.includes(".canvas-wrap"),"canvas layout missing");

assert(js.includes("postgres_changes"),"realtime subscriptions missing");
assert(js.includes("hunt-boom-chat"),"BOOM chat function missing");


assert(html.includes('id="brand-seed"'),"Brand Factory F35 seed control missing");
assert(js.includes("function loadBrandSeed()"),"Brand Factory seed loader missing");
assert(js.includes("brand-factory-seed-il-0001.json"),"Brand Factory seed source missing");
assert(fs.existsSync("brand-factory-seed-il-0001.json"),"Brand Factory seed fixture missing");
const seed=JSON.parse(fs.readFileSync("brand-factory-seed-il-0001.json","utf8"));
assert(seed.hooks?.length===10,"Brand Factory seed must contain 10 hooks");
assert(seed.concepts?.length===5,"Brand Factory seed must contain 5 concepts");
assert(seed.scripts?.length===3,"Brand Factory seed must contain 3 scripts");
assert(seed.owner_gate?.status==="DRAFT_REVIEW","Brand Factory seed must remain owner-gated");

assert(html.includes('id="brand-video-plan"'),"Video Router plan control missing");

assert(html.includes("brand-video-router.js?v=1"),"Video Router script missing");

assert(js.includes("buildBrandVideoPlan"),"Video Router studio integration missing");

assert(js.includes("SERVER_SIDE_PROVIDER_CONNECTOR_REQUIRED")||fs.readFileSync("brand-video-router.js","utf8").includes("SERVER_SIDE_PROVIDER_CONNECTOR_REQUIRED"),"Video Router execution gate missing");

console.log("boom_ai_studio_tests=PASS");

assert(html.includes('data-tab="brand-factory"'),"Brand Factory tab missing");
assert(html.includes('id="brand-brief"'),"Brand Factory product truth form missing");
assert(html.includes('data-brand-stage="red_team"'),"Brand Factory Red Team stage missing");
assert(html.includes('data-brand-stage="owner_gate"'),"Brand Factory Owner Gate missing");
assert(js.includes("function buildBrandPrompt"),"Brand Factory prompt builder missing");
assert(js.includes("Never invent product claims"),"Brand Factory truth rule missing");
assert(js.includes("DRAFT_REVIEW"),"Brand Factory draft owner gate missing");
assert(js.includes('mode:"chat"'),"Brand Factory must stay analysis-only chat mode");
assert(css.includes(".brand-factory-layout"),"Brand Factory layout styling missing");

assert(html.includes('id="brand-verify"'),"Brand Factory HUNT verify button missing");
assert(html.includes('id="brand-item-id"'),"Brand Factory HUNT item id missing");
assert(html.includes('id="brand-variant-id"'),"Brand Factory variant id missing");
assert(js.includes("function verifyBrandProduct"),"Brand Factory live verification missing");
assert(js.includes('/hunt-storefront'),"Brand Factory storefront recheck missing");
assert(js.includes('/hunt-cj-quote'),"Brand Factory CJ quote recheck missing");
assert(js.includes("stock_verified"),"Brand Factory stock gate missing");
assert(js.includes("shipping_verified"),"Brand Factory shipping gate missing");

assert(js.includes("product_gross_margin_pct"),"Brand Factory product margin model missing");
assert(js.includes("contribution_if_shipping_subsidized"),"Brand Factory shipping subsidy scenario missing");
assert(js.includes("customer_total_before_tax"),"Brand Factory customer total missing");

assert(html.includes('id="brand-video-qa"'),"Creative QA control missing");
assert(html.includes("brand-creative-qa.js?v=1"),"Creative QA script missing");
assert(js.includes("function runBrandCreativeQA()"),"Creative QA integration missing");
assert(js.includes("generation_reduction_pct"),"Creative QA savings summary missing");

assert(html.includes('brand-media-vault-card'),"Media Vault card missing");
assert(html.includes("POST-GEN QA"),"Post-generation QA flow missing");
assert(html.includes('id="vault-preview"'),"Private preview control missing");
assert(html.includes('id="vault-qa-commit"'),"QA commit control missing");
assert(html.includes('id="vault-owner-approve"'),"Owner approve control missing");
assert(html.includes('id="vault-owner-reject"'),"Owner reject control missing");
assert(js.includes('function vaultAction('),"Media Vault action adapter missing");
assert(js.includes('MEDIA_VAULT_NOT_DEPLOYED'),"Media Vault deploy lock missing");
assert(js.includes('commitVaultOwnerDecision("approve")'),"Owner approve wiring missing");
assert(js.includes('commitVaultOwnerDecision("reject")'),"Owner reject wiring missing");
assert(html.includes("SERVER INGEST + SHA-256"),"Media ingest/checksum stage missing");
assert(html.includes("short-lived private preview frames"),"Private preview contract missing");

assert(html.includes("VISUAL QA"),"Visual QA stage missing from Media Vault flow");

assert(html.includes('vault-visual-qa'),"Visual QA button missing");assert(js.includes("sampleVaultFrames"),"Frame sampler missing");assert(js.includes("visual_qa_analyze"),"Server Visual QA action missing");

assert(html.includes('brand-deployment-readiness'),"Deployment Readiness card missing");
assert(html.includes("SOURCE_READY"),"Source readiness stage missing");
assert(html.includes("RUNTIME_READY"),"Runtime readiness stage missing");
assert(html.includes("OWNER_ACTIVATION"),"Owner activation stage missing");

assert(js.includes('vaultLive:true'),"Media Vault runtime should be marked live after deployment");
assert(html.includes('id="deployment-readiness-refresh"'),"Provider readiness refresh control missing");
assert(js.includes('refreshDeploymentReadiness'),"Provider readiness client missing");
assert(js.includes('action:"readiness"'),"Server readiness action wiring missing");
assert((js.match(/#vault-preview"\)\?\.addEventListener/g)||[]).length===1,"Vault preview listener must not be duplicated");

assert(html.includes('data-tab="hunt-intelligence"'),"HUNT Intelligence tab missing");
assert(html.includes('id="intelligence-grid"'),"HUNT Intelligence capability grid missing");
assert(html.includes('id="intelligence-simulate"'),"HUNT Intelligence simulation control missing");
assert(html.includes("OWNER GATE · EXECUTION OFF"),"HUNT Intelligence owner gate missing");
assert(js.includes("function renderHuntIntelligence"),"HUNT Intelligence renderer missing");
assert(js.includes("function simulateHuntIntelligence"),"HUNT Intelligence simulator missing");
assert(js.includes("SIMULATION_ONLY"),"Simulation-only execution contract missing");
assert(js.includes("EXECUTION_ALLOWED: false"),"Execution-off guard missing");
assert(js.includes("SPEND_AUTHORIZED: false"),"Spend guard missing");
assert(js.includes("PUBLISHING_AUTHORIZED: false"),"Publishing guard missing");
assert(css.includes(".intelligence-grid"),"HUNT Intelligence layout missing");
assert(html.includes('id="brain-detail"'),"Brain Detail inspector missing");
assert(html.includes('id="planning-build"'),"Planning Board build control missing");
assert(html.includes('id="planning-approve"'),"Planning approval control missing");
assert(js.includes("function renderBrainDetail"),"Brain contract renderer missing");
assert(js.includes("capabilityContracts"),"Brain contracts missing");
assert(js.includes("function buildPlanningDraft"),"Planning Board draft builder missing");
assert(js.includes("APPROVED_FOR_IMPLEMENTATION_PLANNING"),"Planning-only approval state missing");
assert(js.includes("LIVE EXECUTION REMAINS BLOCKED"),"Live execution guard missing");
assert(css.includes(".brain-detail-grid"),"Brain Detail layout missing");
assert(css.includes(".planning-board"),"Planning Board layout missing");
assert(html.includes('id="approval-queue"'),"Owner Approval Queue missing");
assert(html.includes("Approval Queue & Version History"),"Version History heading missing");
assert(js.includes("PLANNING_HISTORY_KEY"),"Planning history storage contract missing");
assert(js.includes("function appendPlanningHistory"),"Planning history append missing");
assert(js.includes("function renderApprovalQueue"),"Approval Queue renderer missing");
assert(js.includes("production_changed:false"),"Production boundary evidence missing");
assert(js.includes("spend_authorized:false"),"Spend boundary evidence missing");
assert(js.includes("publishing_authorized:false"),"Publishing boundary evidence missing");
assert(css.includes(".approval-entry"),"Approval history styling missing");
assert(html.includes("HUNT 2037 Alpha Blueprint"),"HUNT Alpha Blueprint missing");
assert(html.includes('id="alpha-load-plan"'),"HUNT Alpha plan loader missing");
assert(html.includes("OWNER REVIEW REQUIRED · PRODUCTION OFF"),"Alpha production gate missing");
assert(js.includes("huntAlphaStages"),"HUNT Alpha stage contract missing");
assert(js.includes("function renderAlphaBlueprint"),"HUNT Alpha renderer missing");
assert(js.includes("function loadAlphaPlan"),"HUNT Alpha planning handoff missing");
assert(js.includes("current storefront stays fallback"),"Storefront fallback gate missing");
assert(js.includes("No production activation"),"Alpha execution boundary missing");
assert(css.includes(".alpha-stage-grid"),"HUNT Alpha Blueprint layout missing");
assert(html.includes('id="truth-simulate"'),"A1 Product Truth simulator missing");
assert(html.includes("hunt-supplier-core.js?v=alpha1"),"Supplier normalization engine missing from Studio");
assert(html.includes("hunt-country-product-truth.js?v=alpha1"),"Country/Product Truth engine missing from Studio");
assert(js.includes("function evaluateTruthWorkspace"),"A1 truth evaluator missing");
assert(js.includes("A1_STUDIO_SIMULATION"),"A1 simulation-only mode missing");
assert(js.includes("SUPPLIER_CALLED: false"),"Supplier execution guard missing");
assert(js.includes("EXECUTION_ALLOWED: false"),"A1 execution guard missing");
assert(css.includes(".truth-workspace"),"A1 truth workspace styling missing");
