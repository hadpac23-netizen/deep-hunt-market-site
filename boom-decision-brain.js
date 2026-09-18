(() => {
  "use strict";

  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number(n) || 0));
  const truthOk = status => ["verified", "live_verified", "live-verified"].includes(String(status || "").toLowerCase());

  const WEIGHTS = Object.freeze({
    relevance: 0.20,
    affinity: 0.16,
    quality: 0.16,
    shipping: 0.12,
    trust: 0.10,
    freshness: 0.08,
    novelty: 0.07,
    creative: 0.05,
    margin: 0.06
  });

  const LANE_PATTERNS = Object.freeze({
    cold_start: ["quality", "new", "adjacent", "quality", "wildcard"],
    learning: ["personalized", "adjacent", "new", "personalized", "wildcard"],
    personalized: ["personalized", "personalized", "adjacent", "new", "personalized", "wildcard"]
  });

  function modeFor(context = {}) {
    const n = Number(context.interactions || 0);
    if (n < 5) return "cold_start";
    if (n < 20) return "learning";
    return "personalized";
  }
  function laneFor(position = 0, context = {}) {
    const mode = modeFor(context);
    const pattern = LANE_PATTERNS[mode];
    return pattern[Math.abs(Number(position) || 0) % pattern.length];
  }

  function hardGate(candidate = {}) {
    const reasons = [];
    if (candidate.safety_eligible === false) reasons.push("safety_blocked");
    if (candidate.market_eligible === false) reasons.push("market_ineligible");
    if (candidate.shipping_eligible === false) reasons.push("shipping_ineligible");
    if (!truthOk(candidate.truth_status)) reasons.push("truth_not_live_verified");
    if (candidate.stock_available === false) reasons.push("out_of_stock");
    if (candidate.image_verified === false) reasons.push("media_unverified");
    return Object.freeze({eligible: reasons.length === 0, reasons});
  }

  function normalizeMargin(candidate = {}) {
    if (Number.isFinite(Number(candidate.margin_score))) return clamp(candidate.margin_score);
    const ratio = Number(candidate.margin_ratio);
    if (!Number.isFinite(ratio)) return 0;
    return clamp(ratio / 0.35);
  }

  function baseSignals(candidate = {}) {
    return {
      relevance: clamp(candidate.relevance),
      affinity: clamp(candidate.affinity),
      quality: clamp(candidate.quality),
      shipping: clamp(candidate.shipping_score),
      trust: clamp(candidate.trust_score),
      freshness: clamp(candidate.freshness),
      novelty: clamp(candidate.novelty),
      creative: clamp(candidate.creative_performance),
      margin: normalizeMargin(candidate)
    };
  }
  function laneBoosts(lane, s) {
    switch (lane) {
      case "personalized":
        return {affinity: s.affinity * 0.08, relevance: s.relevance * 0.03};
      case "adjacent":
        return {novelty: s.novelty * 0.05, relevance: s.relevance * 0.04};
      case "new":
        return {freshness: s.freshness * 0.08, novelty: s.novelty * 0.03};
      case "wildcard":
        return {novelty: s.novelty * 0.10, quality: s.quality * 0.03};
      case "quality":
      default:
        return {quality: s.quality * 0.08, trust: s.trust * 0.04};
    }
  }

  function penalties(candidate = {}, context = {}) {
    let total = 0;
    const reasons = [];
    const recentProducts = new Set(context.recent_product_keys || []);
    const recentCategories = new Set(context.recent_categories || []);
    const recentSuppliers = new Set(context.recent_suppliers || []);
    const key = String(candidate.product_key || "");

    if (key && recentProducts.has(key)) { total += 0.18; reasons.push("recent_product_repeat"); }
    if (candidate.category && recentCategories.has(candidate.category)) { total += 0.05; reasons.push("category_fatigue"); }
    if (candidate.supplier && recentSuppliers.has(candidate.supplier)) { total += 0.03; reasons.push("supplier_fatigue"); }
    total += clamp(candidate.refund_risk) * 0.12;
    total += clamp(candidate.hide_risk) * 0.10;
    return {total: clamp(total, 0, 0.45), reasons};
  }
  function scoreCandidate(candidate = {}, context = {}, position = 0) {
    const gate = hardGate(candidate);
    const lane = candidate.discovery_lane || laneFor(position, context);
    if (!gate.eligible) {
      return Object.freeze({
        eligible: false,
        score: 0,
        lane,
        reasons: gate.reasons,
        components: {}
      });
    }

    const s = baseSignals(candidate);
    let weighted = 0;
    for (const [k, w] of Object.entries(WEIGHTS)) weighted += s[k] * w;

    const boosts = laneBoosts(lane, s);
    const boost = Object.values(boosts).reduce((a, b) => a + b, 0);
    const p = penalties(candidate, context);
    const raw = clamp(weighted + boost - p.total);
    const score = Number((raw * 100).toFixed(2));

    const reasons = [
      lane,
      ...(s.quality >= 0.8 ? ["high_quality"] : []),
      ...(s.shipping >= 0.8 ? ["strong_shipping"] : []),
      ...(s.affinity >= 0.8 ? ["taste_match"] : []),
      ...(s.freshness >= 0.8 ? ["fresh"] : []),
      ...(s.novelty >= 0.8 ? ["novel"] : []),
      ...p.reasons
    ];
    return Object.freeze({
      eligible: true,
      score,
      lane,
      reasons,
      components: Object.freeze({...s, boost: Number(boost.toFixed(4)), penalty: Number(p.total.toFixed(4))})
    });
  }

  function rankCandidates(candidates = [], context = {}) {
    return candidates
      .map((candidate, index) => ({candidate, decision: scoreCandidate(candidate, context, index)}))
      .filter(row => row.decision.eligible)
      .sort((a, b) => b.decision.score - a.decision.score);
  }

  function explain(decision = {}) {
    if (!decision.eligible) return "Blocked by: " + (decision.reasons || []).join(", ");
    const top = Object.entries(decision.components || {})
      .filter(([k]) => !["boost", "penalty"].includes(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
    return `${decision.lane}: ${top.join(" + ")}`;
  }

  const api = Object.freeze({
    WEIGHTS,
    modeFor,
    laneFor,
    hardGate,
    scoreCandidate,
    rankCandidates,
    explain
  });

  if (typeof window !== "undefined") window.BoomDecisionBrain = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
