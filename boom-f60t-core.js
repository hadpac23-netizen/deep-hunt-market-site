(() => {
  "use strict";

  const VERSION = "2026-09-19-f60t1";
  const TARGET_NET_PER_HOUR = 10000;
  const MISSION = Object.freeze({
    code: "F60T_YAMAM",
    name: "F60T · ימ״מ",
    target_net_per_hour: TARGET_NET_PER_HOUR,
    currency: "USD",
    target_type: "STRETCH_TARGET_NOT_GUARANTEE",
    principle: "TARGET → LOCATION → SALE → VERIFIED NET PROFIT"
  });

  const PLATFORMS = Object.freeze([
    "google_search","google_shopping","google_merchant","youtube","tiktok",
    "instagram","facebook","pinterest","reddit","snapchat","seo",
    "email_consent","push_consent","creators","affiliates","publishers",
    "referrals","approved_marketplaces","ai_agents","chat_commerce",
    "ucp","acp","mcp","a2a","ap2"
  ]);

  const GREEN_ACTIONS = new Set([
    "analytics","research","ranking","recommendations","onsite_merchandising",
    "safe_personalization","safe_seo_preparation","product_prioritization",
    "organic_creative_test","agent_feed_preparation","bundle_suggestion",
    "pricing_recommendation","internal_experiment"
  ]);
  const YELLOW_ACTIONS = new Set([
    "paid_campaign","new_commercial_channel","price_change","discount",
    "large_promotion","creator_compensation","affiliate_terms",
    "significant_offer_change","large_scale_traffic_allocation","new_external_integration"
  ]);
  const RED_ACTIONS = new Set([
    "bank_change","payment_configuration","supplier_commitment","supplier_order",
    "contract","credit","large_spend","financial_commitment","legal_declaration",
    "exclusivity","payout_rules","live_payment_activation"
  ]);

  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const pctTo01 = (value) => {
    const n = num(value);
    if (n === null) return null;
    if (n > 1) return clamp(n,0,100) / 100;
    return Math.max(0, Math.min(1, n));
  };

  function verifiedEconomics(economics = []) {
    return (Array.isArray(economics) ? economics : []).filter((row) =>
      row &&
      row.inputs_verified === true &&
      String(row.profit_gate_status || "").toUpperCase() === "PASS" &&
      (num(row.contribution_before_coupon) ?? 0) > 0
    );
  }

  function profitTruth(economics = []) {
    const rows = verifiedEconomics(economics);
    const contributions = rows
      .map((row) => num(row.contribution_before_coupon))
      .filter((x) => x !== null && x > 0);
    const avg = contributions.length
      ? contributions.reduce((a,b) => a+b,0) / contributions.length
      : null;
    const min = contributions.length ? Math.min(...contributions) : null;
    const max = contributions.length ? Math.max(...contributions) : null;
    return Object.freeze({
      verified_rows: rows.length,
      average_verified_contribution: avg,
      minimum_verified_contribution: min,
      maximum_verified_contribution: max,
      truth_ready: rows.length >= 3 && avg !== null && avg > 0
    });
  }

  function normalizeRealized(input = {}) {
    const amount = num(input.amount);
    const verified = input.verified === true && amount !== null;
    return Object.freeze({
      amount: verified ? amount : null,
      verified,
      evidence_ref: verified ? String(input.evidence_ref || "") : "",
      period_start: verified ? String(input.period_start || "") : "",
      period_end: verified ? String(input.period_end || "") : ""
    });
  }

  function hourlyTargetPlan({economics = [], targetNetPerHour = TARGET_NET_PER_HOUR, realized = {}} = {}) {
    const truth = profitTruth(economics);
    const target = num(targetNetPerHour) ?? TARGET_NET_PER_HOUR;
    const actual = normalizeRealized(realized);
    const requiredOrders = truth.average_verified_contribution !== null && truth.average_verified_contribution > 0
      ? Math.ceil(target / truth.average_verified_contribution)
      : null;
    const gap = actual.verified ? Math.max(0, target - actual.amount) : null;
    const state = !actual.verified
      ? "REALIZED_PROFIT_UNVERIFIED"
      : actual.amount >= target
        ? "TARGET_MET_VERIFIED"
        : "BELOW_TARGET_VERIFIED";
    return Object.freeze({
      mission: MISSION.code,
      target_net_per_hour: target,
      currency: "USD",
      target_is_guarantee: false,
      realized_net_last_hour: actual.amount,
      realized_verified: actual.verified,
      target_gap: gap,
      average_verified_contribution: truth.average_verified_contribution,
      minimum_orders_per_hour_at_average_contribution: requiredOrders,
      truth_ready: truth.truth_ready,
      state,
      can_claim_target_met: actual.verified && actual.amount >= target
    });
  }

  function ownerGate(action = {}) {
    const type = String(action.type || "").trim().toLowerCase();
    if (RED_ACTIONS.has(type)) return Object.freeze({level:"RED", execute_allowed:false, owner_required:true});
    if (YELLOW_ACTIONS.has(type)) return Object.freeze({level:"YELLOW", execute_allowed:false, owner_required:true});
    if (GREEN_ACTIONS.has(type)) {
      const withinApprovedLimits = action.within_approved_limits === true;
      return Object.freeze({
        level:"GREEN",
        execute_allowed:withinApprovedLimits,
        owner_required:!withinApprovedLimits
      });
    }
    return Object.freeze({level:"YELLOW", execute_allowed:false, owner_required:true});
  }

  function scoreOpportunity(row = {}) {
    const blockers = [];
    const expectedNet = num(row.expected_net_profit);
    const confidence = pctTo01(row.confidence);
    const downside = pctTo01(row.downside_risk);
    if (row.economics_verified !== true) blockers.push("economics_unverified");
    if (row.stock_verified !== true) blockers.push("stock_unverified");
    if (row.shipping_verified !== true) blockers.push("shipping_unverified");
    if (row.platform_eligible !== true) blockers.push("platform_not_verified_eligible");
    if (expectedNet === null || expectedNet <= 0) blockers.push("expected_net_profit_not_positive");
    if (confidence === null) blockers.push("confidence_missing");
    if (downside === null) blockers.push("downside_missing");

    const riskAdjusted = blockers.length === 0
      ? expectedNet * confidence * (1 - downside)
      : null;
    return Object.freeze({
      country:String(row.country || ""),
      region:String(row.region || ""),
      local_hour:String(row.local_hour || ""),
      platform:String(row.platform || ""),
      category:String(row.category || ""),
      product_key:String(row.product_key || ""),
      audience:String(row.audience || ""),
      intent_level:String(row.intent_level || ""),
      expected_net_profit:expectedNet,
      confidence,
      downside_risk:downside,
      risk_adjusted_expected_net_profit:riskAdjusted,
      eligible:blockers.length === 0,
      blockers:Object.freeze(blockers)
    });
  }

  function rankOpportunities(rows = []) {
    return Object.freeze((Array.isArray(rows) ? rows : [])
      .map(scoreOpportunity)
      .sort((a,b) => (b.risk_adjusted_expected_net_profit ?? -Infinity) - (a.risk_adjusted_expected_net_profit ?? -Infinity)));
  }

  function evaluatePriceLift(input = {}) {
    const currentPrice = num(input.current_price);
    const proposedPrice = num(input.proposed_price);
    const currentContribution = num(input.current_contribution_per_order);
    const proposedContribution = num(input.proposed_contribution_per_order);
    const currentConversion = pctTo01(input.current_conversion_rate);
    const proposedConversion = pctTo01(input.proposed_conversion_rate);
    const qualifiedSessions = num(input.qualified_sessions);
    const blockers = [];

    if (input.economics_verified !== true) blockers.push("economics_unverified");
    if (input.elasticity_evidence_verified !== true) blockers.push("elasticity_evidence_unverified");
    if (currentPrice === null || proposedPrice === null || proposedPrice <= 0) blockers.push("price_missing");
    if (currentContribution === null || proposedContribution === null) blockers.push("contribution_missing");
    if (currentConversion === null || proposedConversion === null) blockers.push("conversion_evidence_missing");
    if (qualifiedSessions === null || qualifiedSessions <= 0) blockers.push("qualified_sessions_missing");

    let currentExpected = null;
    let proposedExpected = null;
    let delta = null;
    if (!blockers.length) {
      currentExpected = qualifiedSessions * currentConversion * currentContribution;
      proposedExpected = qualifiedSessions * proposedConversion * proposedContribution;
      delta = proposedExpected - currentExpected;
    }

    const changeRate = currentPrice && proposedPrice !== null ? (proposedPrice-currentPrice)/currentPrice : null;
    const approvedBand = pctTo01(input.approved_auto_price_band);
    const insideAutoBand = input.owner_preapproved_price_band === true &&
      approvedBand !== null && changeRate !== null && Math.abs(changeRate) <= approvedBand;

    const decision = blockers.length
      ? "HOLD"
      : delta > 0
        ? (proposedPrice > currentPrice ? "RAISE_PRICE_CANDIDATE" : "CHANGE_PRICE_CANDIDATE")
        : "KEEP_OR_ROLLBACK";

    return Object.freeze({
      decision,
      current_price:currentPrice,
      proposed_price:proposedPrice,
      expected_net_current:currentExpected,
      expected_net_proposed:proposedExpected,
      expected_net_delta:delta,
      price_change_rate:changeRate,
      owner_gate: insideAutoBand ? "GREEN_PREAPPROVED_BAND" : "YELLOW_OWNER_REVIEW",
      live_price_write:false,
      blockers:Object.freeze(blockers)
    });
  }

  function stretchTarget({currentTarget = TARGET_NET_PER_HOUR, realized = {}, consecutiveVerifiedTargetHours = 0} = {}) {
    const actual = normalizeRealized(realized);
    const target = num(currentTarget) ?? TARGET_NET_PER_HOUR;
    if (!actual.verified || actual.amount < target || Number(consecutiveVerifiedTargetHours) < 3) {
      return Object.freeze({
        eligible:false,
        current_target:target,
        candidate_target:null,
        reason:"requires_3_consecutive_verified_hours_at_or_above_target",
        owner_gate:"YELLOW_OWNER_REVIEW"
      });
    }
    const candidate = Math.ceil(Math.max(target * 1.25, actual.amount * 1.10) / 100) * 100;
    return Object.freeze({
      eligible:true,
      current_target:target,
      candidate_target:candidate,
      reason:"sustained_verified_target_performance",
      owner_gate:"YELLOW_OWNER_REVIEW"
    });
  }

  function missionBoard({
    economics = [],
    targetNetPerHour = TARGET_NET_PER_HOUR,
    realized = {},
    opportunities = [],
    consecutiveVerifiedTargetHours = 0
  } = {}) {
    const target = hourlyTargetPlan({economics,targetNetPerHour,realized});
    const ranked = rankOpportunities(opportunities);
    const stretch = stretchTarget({
      currentTarget:target.target_net_per_hour,
      realized,
      consecutiveVerifiedTargetHours
    });
    return Object.freeze({
      version:VERSION,
      mission:MISSION,
      target,
      profit_truth:profitTruth(economics),
      top_opportunities:Object.freeze(ranked.slice(0,8)),
      platform_count:PLATFORMS.length,
      follow_the_sun:true,
      agent_commerce:true,
      price_lift:true,
      incrementality_required:true,
      uncertainty_required:true,
      stretch_target:stretch,
      paid_spend:false,
      external_publish:false,
      live_price_write:false,
      supplier_order:false,
      payment_activation:false,
      execute_actions:false,
      owner_gate:"ACTIVE"
    });
  }

  const api = Object.freeze({
    VERSION,MISSION,PLATFORMS,
    verifiedEconomics,profitTruth,normalizeRealized,hourlyTargetPlan,
    ownerGate,scoreOpportunity,rankOpportunities,evaluatePriceLift,
    stretchTarget,missionBoard
  });

  if (typeof window !== "undefined") window.BoomF60TCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();