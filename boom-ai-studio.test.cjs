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
assert(js.includes('["supplier-hypersku","HyperSKU Supplier","Read-only pilot · Owner-gated","H"]'),"HyperSKU Studio department node missing");
assert(js.includes('department:"TIER 0 SUPPLIER"'),"HyperSKU Studio fallback inspector missing");
assert(js.includes('id:"hypersku",name:"HyperSKU Supplier",kind:"TIER 0 SUPPLIER API"'),"HyperSKU BOOM Connect card missing");
assert(js.includes("Read-only first · fulfillment requires explicit Owner approval"),"HyperSKU Connect gate missing");

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
assert(html.includes('id="decision-simulate"'),"A2 Decision Brain simulator missing");
assert(html.includes("boom-taste-dna.js?v=alpha1"),"Taste DNA engine missing from Studio");
assert(html.includes("boom-decision-brain.js?v=brain1"),"Decision Brain engine missing from Studio");
assert(js.includes("function evaluateDecisionWorkspace"),"A2 decision evaluator missing");
assert(js.includes("A2_STUDIO_SIMULATION"),"A2 simulation-only mode missing");
assert(js.includes("sensitive_traits_used:false"),"Sensitive-trait guard missing");
assert(js.includes("BODY TRAITS USED: false"),"Body-trait guard missing");
assert(js.includes("STOREFRONT_CHANGED: false"),"Storefront execution guard missing");
assert(css.includes(".decision-workspace"),"A2 decision workspace styling missing");
assert(html.includes('id="memory-add-event"'),"A3 Memory action simulator missing");
assert(html.includes('id="memory-reset-simulation"'),"A3 Memory reset missing");
assert(html.includes("hunt-experience-memory.js?v=memory1"),"HUNT Memory engine missing from Studio");
assert(js.includes("simulatedMemoryEvents"),"Isolated memory state missing");
assert(js.includes("function addSimulatedMemoryEvent"),"A3 event simulator missing");
assert(js.includes("function renderMemorySimulation"),"A3 context renderer missing");
assert(js.includes("REAL PROFILE WRITTEN: false"),"Real-profile isolation guard missing");
assert(js.includes("HUNT HISTORY CHANGED: false"),"HUNT history isolation guard missing");
assert(css.includes(".memory-workspace"),"A3 memory workspace styling missing");
assert(html.includes('id="flow-simulate"'),"A4 Dynamic Flow simulator missing");
assert(html.includes("hunt-2037-flow-core.js?v=alpha1"),"HUNT Flow engine missing from Studio");
assert(js.includes("function simulateDynamicFlow"),"A4 Flow simulator missing");
assert(js.includes("A4_STRUCTURE_SIMULATION"),"A4 structural simulation mode missing");
assert(js.includes("PRODUCTS INVENTED: 0"),"No-fake-product guard missing");
assert(js.includes("VERIFIED PRODUCT REQUIRED PER SLOT: true"),"Verified-slot gate missing");
assert(js.includes("FEATURE_FLAG_CHANGED: false"),"Feature flag guard missing");
assert(css.includes(".flow-workspace"),"A4 Flow workspace styling missing");
assert(html.includes('id="personal-simulate"'),"A5 Stylist/Mirror simulator missing");
assert(html.includes("boom-stylist-core.js?v=alpha1"),"Stylist engine missing from Studio");
assert(html.includes("boom-mirror-core.js?v=alpha1"),"Mirror engine missing from Studio");
assert(js.includes("function simulatePersonalStudio"),"A5 personal simulator missing");
assert(js.includes("A5_SAFE_MIRROR_SIMULATION"),"Safe Mirror simulation mode missing");
assert(js.includes("BODY SCORING: false"),"Body-scoring guard missing");
assert(js.includes("ATTRACTIVENESS SCORING: false"),"Attractiveness-scoring guard missing");
assert(js.includes("SENSITIVE ATTRIBUTE INFERENCE: false"),"Sensitive inference guard missing");
assert(js.includes("AI PROVIDER CALLED: false"),"AI provider guard missing");
assert(css.includes(".personal-workspace"),"A5 workspace styling missing");
assert(html.includes('id="creative-simulate"'),"A6 Creative Learning simulator missing");
assert(js.includes("function simulateCreativeLearning"),"A6 creative simulator missing");
assert(js.includes("A6_CREATIVE_STRUCTURE_SIMULATION"),"Creative structural mode missing");
assert(js.includes("CONTENT GENERATED: 0"),"No-generated-content guard missing");
assert(js.includes("VIDEO GENERATED: 0"),"No-video-generation guard missing");
assert(js.includes("PROVIDER CALLS: 0"),"Provider-call guard missing");
assert(js.includes("OWNER GATE: DRAFT_REVIEW"),"Creative Owner Gate missing");
assert(css.includes(".creative-workspace"),"A6 workspace styling missing");

assert(html.includes('id="alpha-integration-qa"'),"A7 Integration QA control missing");
assert(html.includes('id="alpha-integration-status"'),"A7 readiness status missing");
assert(html.includes('id="alpha-integration-stage-grid"'),"A7 stage evidence grid missing");
assert(html.includes('id="alpha-integration-report"'),"A7 evidence report missing");
assert(js.includes("function alphaIntegrationStages()"),"A7 stage aggregator missing");
assert(js.includes("function runAlphaIntegrationQA()"),"A7 integration runner missing");
assert(js.includes("MODE: A7_INTEGRATION_QA"),"A7 integration mode missing");
assert(js.includes("READY_FOR_OWNER_ALPHA_REVIEW"),"A7 Owner alpha-review readiness missing");
assert(js.includes("PRODUCTION READY: false"),"A7 production-off invariant missing");
assert(js.includes("PRODUCTION_CHANGED: false"),"A7 production-change guard missing");
assert(js.includes("SUPPLIER_CALLS: 0"),"A7 supplier-call guard missing");
assert(js.includes("AI_PROVIDER_CALLS: 0"),"A7 AI-provider-call guard missing");
assert(js.includes("SPEND_AUTHORIZED: false"),"A7 spend guard missing");
assert(js.includes("PUBLISHING_AUTHORIZED: false"),"A7 publishing guard missing");
assert(js.includes("OWNER_GATE: OWNER_REVIEW_REQUIRED"),"A7 Owner Gate missing");
assert(css.includes(".integration-workspace"),"A7 workspace styling missing");
assert(css.includes(".integration-stage[data-state=\"blocked\"]"),"A7 blocker styling missing");

assert(html.includes('id="alpha-harness-run"'),"A8 Alpha Test Harness control missing");
assert(html.includes('id="alpha-harness-status"'),"A8 harness status missing");
assert(html.includes('id="alpha-harness-scenarios"'),"A8 scenario grid missing");
assert(html.includes('id="alpha-harness-report"'),"A8 report missing");
assert(html.includes("boom-alpha-test-harness.js?v=alpha1"),"A8 harness core script missing");
assert(js.includes("const AlphaHarness=window.BoomAlphaTestHarness"),"A8 harness binding missing");
assert(js.includes("function runAlphaHarnessUI()"),"A8 harness UI runner missing");
assert(js.includes("A8_PASS"),"A8 pass state missing");
assert((js.match(/#alpha-harness-run"\)\?\.addEventListener/g)||[]).length===1,"A8 harness listener must be unique");
assert(js.includes("PRODUCTION READY: false"),"A8 production readiness guard missing");
assert(js.includes("SUPPLIER_CALLS: 0"),"A8 supplier-call guard missing");
assert(js.includes("AI_PROVIDER_CALLS: 0"),"A8 AI-provider-call guard missing");
assert(js.includes("SPEND_AUTHORIZED: false"),"A8 spend guard missing");
assert(js.includes("PUBLISHING_AUTHORIZED: false"),"A8 publishing guard missing");
assert(css.includes(".harness-workspace"),"A8 harness styling missing");
assert(css.includes(".harness-scenario[data-state=\"blocked\"]"),"A8 fail-closed styling missing");
assert(fs.existsSync("boom-alpha-test-harness.js"),"A8 harness core file missing");
assert(fs.existsSync("boom-alpha-test-harness.test.cjs"),"A8 harness unit test missing");

assert(html.includes('id="alpha-evidence-build"'),"A9 Owner Evidence Pack control missing");
assert(html.includes('id="alpha-evidence-status"'),"A9 evidence status missing");
assert(html.includes('id="alpha-evidence-fingerprint"'),"A9 evidence fingerprint missing");
assert(html.includes('id="alpha-evidence-stages"'),"A9 evidence stage grid missing");
assert(html.includes('id="alpha-evidence-report"'),"A9 evidence report missing");
assert(html.includes("boom-alpha-evidence-pack.js?v=alpha1"),"A9 evidence core script missing");
assert(js.includes("const EvidencePack=window.BoomAlphaEvidencePack"),"A9 evidence binding missing");
assert(js.includes("function buildOwnerAlphaEvidencePack()"),"A9 evidence builder missing");
assert(js.includes("BLOCKED_BOUNDARY_VIOLATION"),"A9 boundary violation fail-closed state missing");
assert(js.includes("ALPHA_OWNER_REVIEW_READY"),"A9 owner-review release gate missing");
assert(js.includes("ALPHA ACTIVATION AUTHORIZED: false"),"A9 alpha activation guard missing");
assert(js.includes("PAYMENTS_ACTIVATED: false"),"A9 payments guard missing");
assert(js.includes("ORDER_ROUTING_ACTIVATED: false"),"A9 order-routing guard missing");
assert((js.match(/#alpha-evidence-build"\)\?\.addEventListener/g)||[]).length===1,"A9 evidence listener must be unique");
assert(css.includes(".evidence-workspace"),"A9 evidence workspace styling missing");
assert(css.includes(".evidence-stage[data-state=\"blocked\"]"),"A9 blocked evidence styling missing");
assert(fs.existsSync("boom-alpha-evidence-pack.js"),"A9 evidence core file missing");
assert(fs.existsSync("boom-alpha-evidence-pack.test.cjs"),"A9 evidence unit test missing");

assert(html.includes('id="alpha-rc-preview-build"'),"A10 RC preview control missing");
assert(html.includes('id="alpha-rc-preview-status"'),"A10 RC preview status missing");
assert(html.includes('id="alpha-rc-devices"'),"A10 device grid missing");
assert(html.includes('id="alpha-rc-journey"'),"A10 journey grid missing");
assert(html.includes('id="alpha-rc-preview-report"'),"A10 preview report missing");
assert(html.includes("boom-alpha-rc-preview.js?v=alpha1"),"A10 RC preview core script missing");
assert(js.includes("const RCPreview=window.BoomAlphaRCPreview"),"A10 RC preview binding missing");
assert(js.includes("function buildAlphaRCPreview()"),"A10 RC preview builder missing");
assert(js.includes("A10_PRIVATE_RC_READY"),"A10 private ready state missing");
assert(js.includes("CHECKOUT MODE: "), "A10 checkout evidence missing");
assert(js.includes("PAYMENTS_ACTIVATED: false"),"A10 payment-off guard missing");
assert(js.includes("ORDER_ROUTING_ACTIVATED: false"),"A10 order-routing guard missing");
assert(js.includes("ALPHA_ACTIVATION_AUTHORIZED: false"),"A10 alpha activation guard missing");
assert((js.match(/#alpha-rc-preview-build"\)\?\.addEventListener/g)||[]).length===1,"A10 preview listener must be unique");
assert(css.includes(".rc-preview-workspace"),"A10 preview styling missing");
assert(css.includes(".rc-journey-step[data-state=\"blocked\"]"),"A10 blocked journey styling missing");
assert(fs.existsSync("boom-alpha-rc-preview.js"),"A10 preview core file missing");
assert(fs.existsSync("boom-alpha-rc-preview.test.cjs"),"A10 preview unit test missing");

assert(html.includes('id="alpha-rc-qa-run"'),"A11 Full RC QA control missing");
assert(html.includes('id="alpha-rc-qa-status"'),"A11 RC QA status missing");
assert(html.includes('id="alpha-rc-qa-groups"'),"A11 QA group grid missing");
assert(html.includes('id="alpha-rc-qa-checks"'),"A11 QA check grid missing");
assert(html.includes('id="alpha-rc-qa-report"'),"A11 QA report missing");
assert(html.includes("boom-alpha-rc-qa.js?v=alpha1"),"A11 QA core script missing");
assert(js.includes("const RCQA=window.BoomAlphaRCQA"),"A11 QA binding missing");
assert(js.includes("function alphaRCDomAudit()"),"A11 DOM audit missing");
assert(js.includes("function runAlphaRCQA()"),"A11 QA runner missing");
assert(js.includes("A11_PASS · A12_ELIGIBLE"),"A11 pass state missing");
assert(js.includes("A11_BLOCKED"),"A11 blocked state missing");
assert(js.includes("DUPLICATE IDS: "), "A11 duplicate-id evidence missing");
assert(js.includes("ALPHA BUTTONS WITHOUT TYPE: "), "A11 button-type evidence missing");
assert((js.match(/#alpha-rc-qa-run"\)\?\.addEventListener/g)||[]).length===1,"A11 QA listener must be unique");
assert(css.includes(".rc-qa-workspace"),"A11 QA workspace styling missing");
assert(css.includes(".rc-qa-check[data-state=\"blocked\"]"),"A11 blocked check styling missing");
assert(fs.existsSync("boom-alpha-rc-qa.js"),"A11 QA core file missing");
assert(fs.existsSync("boom-alpha-rc-qa.test.cjs"),"A11 QA unit test missing");

assert(html.includes('id="alpha-final-gate-build"'),"A12 Final Owner gate control missing");
assert(html.includes('id="alpha-final-gate-status"'),"A12 final gate status missing");
assert(html.includes('id="alpha-final-gate-evidence"'),"A12 final evidence panel missing");
assert(html.includes('id="alpha-final-go"'),"A12 GO planning button missing");
assert(html.includes('id="alpha-final-no-go"'),"A12 NO-GO button missing");
assert(html.includes('id="alpha-final-gate-report"'),"A12 final gate report missing");
assert(html.includes("boom-alpha-final-gate.js?v=alpha1"),"A12 final gate core script missing");
assert(js.includes("const FinalGate=window.BoomAlphaFinalGate"),"A12 final gate binding missing");
assert(js.includes("function buildAlphaFinalGate()"),"A12 final gate builder missing");
assert(js.includes("function recordAlphaFinalDecision("),"A12 final decision recorder missing");
assert(js.includes("MERGE AUTHORIZED: false"),"A12 merge guard missing");
assert(js.includes("PRIVATE ALPHA ACTIVATION AUTHORIZED: false"),"A12 private Alpha activation guard missing");
assert(js.includes("PRODUCTION ACTIVATION AUTHORIZED: false"),"A12 Production activation guard missing");
assert(js.includes("PAYMENTS_ACTIVATED: false"),"A12 payment guard missing");
assert(js.includes("ORDER_ROUTING_ACTIVATED: false"),"A12 order-routing guard missing");
assert((js.match(/#alpha-final-gate-build"\)\?\.addEventListener/g)||[]).length===1,"A12 build listener must be unique");
assert((js.match(/#alpha-final-go"\)\?\.addEventListener/g)||[]).length===1,"A12 GO listener must be unique");
assert((js.match(/#alpha-final-no-go"\)\?\.addEventListener/g)||[]).length===1,"A12 NO-GO listener must be unique");
assert(css.includes(".final-gate-workspace"),"A12 final gate styling missing");
assert(fs.existsSync("boom-alpha-final-gate.js"),"A12 final gate core file missing");
assert(fs.existsSync("boom-alpha-final-gate.test.cjs"),"A12 final gate unit test missing");

assert(html.includes("BOOM DEPARTMENTS · ORDERED FLOW"),"Ordered Studio label missing");
assert(js.includes('id:"intelligence"')&&js.includes("HUNT INTELLIGENCE PIPELINE · A1 → A6"),"Ordered Studio intelligence group missing");
assert(js.includes('id:"release"')&&js.includes("ALPHA QA / RELEASE CONTROL · A7 → A12"),"Ordered Studio release group missing");
assert(js.includes('id:"commerce"')&&js.includes("COMMERCE & OPERATIONS CONTROL"),"Ordered Studio commerce group missing");
assert(js.includes('id:"missions"')&&js.includes("F35 / GROWTH MISSIONS"),"Ordered Studio missions group missing");
assert(js.includes('id:"suppliers"')&&js.includes("SUPPLIER CONNECTORS · STUDIO ONLY"),"Ordered Studio supplier group missing");
assert(js.includes('id:"store"')&&js.includes("STORE DEPARTMENTS · CATEGORY OWNERS"),"Ordered Studio store group missing");
for(const id of ["inventory-truth","decision-intelligence","feedback-intelligence","memory-continuity","hunt-worlds-flow","boom-stylist","boom-mirror","creative-brand-factory","release-control","trust-compliance","finance-reconciliation","country-localization","knowledge-freshness","dept-women","dept-men","dept-tech","dept-toys"]){
  assert(js.includes('["'+id+'"'),"Ordered Studio node missing: "+id);
}
assert(js.includes("const studioNodeGroupById=new Map()"),"Studio node catalog map missing");
assert(js.includes("No live manager report is loaded for this Studio node in the current runtime."),"Truthful offline Studio fallback missing");
assert(css.includes(".studio-node-group"),"Studio group lane styling missing");
assert(css.includes("min-height:2180px"),"Expanded Studio canvas height missing");

assert(html.includes('id="node-output"'),"Decision / Owner Output node missing");
assert(html.includes("DECISION / OUTPUT"),"Decision / Output section label missing");
assert(js.includes('if(type==="output")'),"Decision / Owner Output inspector missing");
assert(js.includes("KNOWLEDGE != AUTHORITY"),"Decision authority boundary missing");
assert(js.includes('addLine(svg,$("#node-eval"),$("#node-output"),"watch")'),"Decision output link missing");
assert(html.includes('id="prompt-coverage-audit"'),"Prompt coverage audit workspace missing");
assert(html.includes('id="prompt-audit-summary"'),"Prompt audit summary missing");
assert(html.includes('id="prompt-audit-grid"'),"Prompt audit grid missing");
assert(js.includes("const promptCoverageItems=Object.freeze(["),"Prompt audit contract missing");
assert(js.includes("Product trace: source → shelf → checkout → order → sale"),"Product trace prompt item missing");
assert(js.includes("Viewport visual QA · 390 / 768 / 1280 / 1440"),"Viewport visual QA prompt item missing");
assert(fs.existsSync("boom-studio-device-browser-e2e.html"),"BOOM Studio device browser E2E harness missing");
assert(js.includes("Supplier names hidden from shopper storefront"),"Supplier hiding prompt item missing");
assert(js.includes("Like / Save / Share / History browser E2E"),"Shopper actions browser E2E prompt item missing");
assert(js.includes("Search → recommendation → Product browser E2E"),"Search/recommendation browser E2E prompt item missing");
assert(fs.existsSync("hunt-search-product-browser-e2e.html"),"Search to Product browser E2E harness missing");
assert(fs.existsSync("hunt-shopper-browser-e2e.html"),"Shopper browser E2E harness missing");
assert(js.includes("function renderPromptCoverageAudit()"),"Prompt audit renderer missing");
assert(css.includes(".prompt-audit-workspace"),"Prompt audit styling missing");

assert(js.includes('const previewLocalHost=["127.0.0.1","localhost"].includes(location.hostname);'),"Safe localhost preview mode missing");
assert(js.includes('previewUrl.searchParams.get("preview")==="1"'),"Safe preview query gate missing");
assert(js.includes('function applyLocalPreviewSafety(mode="local")'),"Safe preview safety function missing");
assert(js.includes('label+" PREVIEW · LIVE ACTIONS OFF"'),"Preview safety status missing");
assert(js.includes('input.placeholder=label+" PREVIEW · chat execution disabled"'),"Preview chat lock missing");

assert(html.includes('id="product-trace-workspace"'),"Product trace workspace missing");
assert(html.includes('id="product-trace-key"'),"Product trace reference input missing");
assert(html.includes('id="product-trace-run"'),"Product trace run control missing");
assert(html.includes('id="product-trace-grid"'),"Product trace evidence grid missing");
assert(html.includes('id="product-trace-report"'),"Product trace report missing");
assert(js.includes("function runProductTrace()"),"Product trace runner missing");
assert(js.includes("BOOM_INTERNAL_PRODUCT_TRACE"),"Internal Product Trace mode missing");
assert(js.includes('client.from("hunt_catalog_products")'),"Product trace catalog query missing");
assert(js.includes('client.from("hunt_orders")'),"Product trace order query missing");
assert(js.includes('client.from("hunt_fulfillment_orders")'),"Product Trace fulfillment query missing");
assert(js.includes('client.from("hunt_order_pipeline_runs")'),"Product trace pipeline query missing");
assert(js.includes('client.from("hunt_order_finance_ledger")'),"Product trace finance query missing");
assert(js.includes("PRODUCT REFS FROM FULFILLMENT: "), "Product Trace line-item evidence missing");
assert(js.includes("CATALOG MATCHES: "), "Product Trace catalog-match evidence missing");
assert(js.includes("Source/Shelf claims require exact item_id from fulfillment line_items; missing finance stays UNVERIFIED."),"Exact fulfillment Product Trace integrity rule missing");
assert(js.includes("CUSTOMER EMAIL DISPLAYED: false"),"Product Trace customer-email privacy guard missing");
assert(js.includes("CUSTOMER ADDRESS DISPLAYED: false"),"Product Trace customer-address privacy guard missing");
assert(js.includes("DATA_CHANGED: false"),"Product Trace read-only mutation guard missing");
assert(js.includes("LIVE QUERY: false"),"Product trace local preview guard missing");
assert(css.includes(".product-trace-workspace"),"Product trace styling missing");
assert(js.includes('label:"Product trace: source → shelf → checkout → order → sale",status:"PRESENT"'),"Product trace prompt status not closed");
assert(js.includes('label:"Supplier names hidden from shopper storefront",status:"PRESENT"'),"Supplier hiding prompt status not closed");

assert(js.includes("async function loadConnectorEvidence()"),"Live connector evidence loader missing");
assert(js.includes('query("api_integration_log"'),"Connector API log evidence query missing");
assert(js.includes('query("source_registry"'),"Connector source registry query missing");
assert(js.includes('query("hunt_partner_matrix"'),"Connector partner matrix query missing");
assert(js.includes('query("hunt_runtime_controls"'),"Connector runtime-control query missing");
assert(js.includes("function buildEvidenceConnectorRows()"),"Connector evidence row builder missing");
assert(js.includes("Verification gaps: "), "Connector verification gap reporting missing");
assert(js.includes('id:"connect-live",label:"Connector-by-connector truth matrix",status:"PRESENT"'),"Connector prompt audit not closed");
assert(fs.existsSync("hunt-search-product-browser-e2e.html"),"Search→Product browser E2E harness missing");

assert(html.includes('id="studio-department-nav"'),"Studio department navigator missing");
for(const id of ["intelligence","release","commerce","missions","suppliers","store"]){
  assert(html.includes('data-studio-group="'+id+'"'),"Studio navigator target missing: "+id);
}
assert(js.includes("function focusStudioGroup("),"Studio navigator focus function missing");
assert(js.includes('const studioJump=ev.target.closest("[data-studio-group]")'),"Studio navigator click routing missing");
assert(css.includes(".studio-department-nav"),"Studio navigator styling missing");

assert(js.includes('const previewNetlifyDraft=/^[a-z0-9]+--deep-hunt-market\\.netlify\\.app$/i.test(location.hostname);'),"Netlify draft preview hostname gate missing");
assert(js.includes('applyLocalPreviewSafety(previewNetlifyDraft?"draft":"local")'),"Draft preview safety mode missing");
assert(js.includes('const SAFE_PREVIEW_BOOT=(previewLocalHost||previewNetlifyDraft)&&previewUrl.searchParams.get("preview")==="1";'),"Safe preview query gate missing");

assert(js.includes('(!S?.createClient&&!SAFE_PREVIEW_BOOT)'),"Safe preview Supabase decoupling missing");
assert(js.includes('const client=S?.createClient?S.createClient('),"Optional preview Supabase client missing");

assert(html.includes('data-tab="professional-workbench"'),"Professional Workbench tab missing");
assert(html.includes('id="professional-workbench"'),"Professional Workbench view missing");
assert(html.includes('id="professional-summary"'),"Professional Workbench summary missing");
assert(html.includes('id="professional-grid"'),"Professional capability grid missing");
assert(html.includes('id="professional-trace-list"'),"Professional trace explorer missing");
assert(html.includes('id="professional-failure-list"'),"Professional failure inbox missing");
assert(html.includes('id="professional-experiment-list"'),"Professional experiment diff missing");
assert(html.includes('id="professional-review-list"'),"Professional review queue missing");
assert(html.includes('id="professional-cost-report"'),"Professional cost report missing");
assert(html.includes('id="professional-report"'),"Professional contract report missing");
assert(html.includes("boom-professional-workbench.js?v=1"),"Professional Workbench core script missing");
assert(js.includes("const ProfessionalWorkbench=window.BoomProfessionalWorkbench"),"Professional Workbench binding missing");
assert(js.includes("function professionalCostSamples()"),"Professional cost sample extractor missing");
assert(js.includes("function renderProfessionalWorkbench()"),"Professional Workbench renderer missing");
assert(js.includes("PROMPT REGISTRY: "), "Professional prompt registry evidence missing");
assert(js.includes("DATASET CANDIDATES: "), "Professional dataset evidence missing");
assert(js.includes("EXPERIMENT DIFF: "), "Professional experiment evidence missing");
assert(js.includes("COST/LATENCY: "), "Professional cost/latency evidence missing");
assert(js.includes("OWNER GATE REQUIRED: true"),"Professional Owner gate invariant missing");
assert(js.includes("PRODUCTION CHANGE: false"),"Professional Production guard missing");
assert(js.includes("SUPPLIER ORDERS: false"),"Professional supplier-order guard missing");
assert((js.match(/#professional-refresh"\)\?\.addEventListener/g)||[]).length===1,"Professional refresh listener must be unique");
assert(css.includes(".professional-head"),"Professional Workbench styling missing");
assert(css.includes(".professional-card[data-state=\"gap\"]"),"Professional gap styling missing");
assert(fs.existsSync("boom-professional-workbench.js"),"Professional Workbench core file missing");
assert(fs.existsSync("boom-professional-workbench.test.cjs"),"Professional Workbench unit test missing");

assert(js.includes("async function loadProfessionalEvidence()"),"Professional evidence loader missing");
assert(js.includes('query("hunt_boom_model_observations"'),"Model observations query missing");
assert(js.includes('query("hunt_boom_model_cost_registry"'),"Model cost registry query missing");
assert(js.includes('query("hunt_boom_model_routes"'),"Model routes query missing");
assert(js.includes('query("hunt_boom_eval_cases_v2"'),"Persisted eval cases query missing");
assert(js.includes('query("hunt_boom_eval_runs_v2"'),"Persisted eval runs query missing");
assert(js.includes('query("hunt_boom_eval_suites"'),"Persisted eval suites query missing");
assert(js.includes('query("hunt_boom_replay_runs"'),"Replay runs query missing");
assert(js.includes('query("hunt_boom_shadow_runs"'),"Shadow runs query missing");
assert(js.includes("PERSISTED EVAL CASES: "), "Professional persisted dataset evidence missing");
assert(js.includes("SHADOW RUNS: "), "Professional shadow evidence missing");
assert(js.includes("REPLAY RUNS: "), "Professional replay evidence missing");
assert(js.includes("MODEL OBSERVATIONS: "), "Professional observation evidence missing");
assert(js.includes("datasetStoreConnected:state.professionalEvidence.evalCases.length>0&&state.professionalEvidence.evalSuites.length>0"),"Professional dataset truth gate missing");
