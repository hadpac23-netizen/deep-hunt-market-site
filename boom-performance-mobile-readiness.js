(() => {
  "use strict";
  if(window.BoomPerformanceMobileReadiness?.version)return;
  const version="BOOM-PERFORMANCE-MOBILE-READINESS-V1";
  const defaultBudgets={
    mobile_390:{max_initial_dom_nodes:3500,max_initial_images:220,max_initial_shelf_cards:100,max_small_touch_targets:0,max_broken_images:0,max_console_problems:0,max_critical_network_failures:0},
    tablet_768:{max_initial_dom_nodes:4000,max_initial_images:250,max_broken_images:0,max_console_problems:0,max_critical_network_failures:0},
    desktop_1280:{max_initial_dom_nodes:5000,max_initial_images:320,max_broken_images:0,max_console_problems:0,max_critical_network_failures:0},
    desktop_1440:{max_initial_dom_nodes:5000,max_initial_images:320,max_broken_images:0,max_console_problems:0,max_critical_network_failures:0}
  };
  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  function evaluateViewport(metrics={},budget={}){
    const checks={
      DOM_NODES:n(metrics.dom_nodes)!==null&&n(metrics.dom_nodes)<=budget.max_initial_dom_nodes,
      IMAGES:n(metrics.images)!==null&&n(metrics.images)<=budget.max_initial_images,
      HORIZONTAL_OVERFLOW:metrics.horizontal_overflow===false,
      BROKEN_IMAGES:n(metrics.broken_images)===0,
      CONSOLE_PROBLEMS:n(metrics.console_problems)===0,
      CRITICAL_NETWORK_FAILURES:n(metrics.network_failures)===0
    };
    if("max_initial_shelf_cards" in budget)checks.SHELF_CARDS=n(metrics.shelf_cards)!==null&&n(metrics.shelf_cards)<=budget.max_initial_shelf_cards;
    if("max_small_touch_targets" in budget)checks.TOUCH_TARGETS=n(metrics.small_touch_targets)===budget.max_small_touch_targets;
    const blocker=Object.keys(checks).find(k=>checks[k]!==true)||null;
    return {checks,blocker,state:blocker?"BLOCKED_"+blocker:"PASS_LOCAL"};
  }
  function evaluate(input={}){
    const mobile=evaluateViewport(input.mobile_390||{},input.budgets?.mobile_390||defaultBudgets.mobile_390);
    const tablet=evaluateViewport(input.tablet_768||{},input.budgets?.tablet_768||defaultBudgets.tablet_768);
    const desktop1280=evaluateViewport(input.desktop_1280||{},input.budgets?.desktop_1280||defaultBudgets.desktop_1280);
    const desktop1440=evaluateViewport(input.desktop_1440||{},input.budgets?.desktop_1440||defaultBudgets.desktop_1440);
    const pwa=input.pwa_preview_proof===true;
    const blocked=mobile.blocker||tablet.blocker||desktop1280.blocker||desktop1440.blocker;
    return {
      version,mode:"SHADOW",mobile,tablet,desktop1280,desktop1440,pwa_preview_proof:pwa,
      state:blocked?"BLOCKED_LOCAL_QA":(pwa?"READY_FOR_OWNER_REVIEW":"LOCAL_RESPONSIVE_PASS_PREVIEW_PWA_PROOF_PENDING"),
      material_action_authorized:false
    };
  }
  window.BoomPerformanceMobileReadiness={version,evaluateViewport,evaluate};
})();