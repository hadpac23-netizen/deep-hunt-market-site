(() => {
  "use strict";

  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const pct = (part, whole) => {
    const p = num(part), w = num(whole);
    return p !== null && w !== null && w > 0 ? (p / w) * 100 : null;
  };

  function funnel(today = {}) {
    const sessions = num(today.unique_sessions) ?? 0;
    const productViews = num(today.product_views) ?? 0;
    const carts = num(today.add_to_cart) ?? 0;
    const checkouts = num(today.checkout_starts) ?? 0;
    const orders = num(today.orders) ?? 0;
    return Object.freeze({
      sessions,
      productViews,
      carts,
      checkouts,
      orders,
      productViewsPerSession: sessions > 0 ? productViews / sessions : null,
      productViewToCartPct: pct(carts, productViews),
      cartToCheckoutPct: pct(checkouts, carts),
      checkoutToOrderPct: pct(orders, checkouts)
    });
  }

  function scoreDeal(row = {}) {
    let score = clamp(num(row.deal_score) ?? 0);
    const blockers = [];
    const reasons = [];

    const verified = row.inputs_verified === true;
    const gate = String(row.profit_gate_status || "").toUpperCase();
    const truth = String(row.truth_status || "").toLowerCase();
    const safeCac = num(row.max_safe_cac);
    const contribution = num(row.contribution_before_coupon);

    if (verified) { score += 8; reasons.push("verified economics"); }
    else { score -= 18; blockers.push("economics not fully verified"); }

    if (gate === "PASS") { score += 12; reasons.push("profit gate PASS"); }
    else { score -= 28; blockers.push("profit gate is not PASS"); }

    if (/verified|truth|confirmed/.test(truth)) { score += 8; reasons.push("price truth verified"); }
    else if (truth) { score -= 8; blockers.push("price truth needs review"); }
    else { score -= 12; blockers.push("price truth missing"); }

    if (safeCac !== null && safeCac > 0) reasons.push("positive safe CAC capacity");
    else if (safeCac !== null) { score -= 18; blockers.push("no safe CAC capacity"); }
    else { score -= 12; blockers.push("safe CAC not calculated"); }

    if (contribution !== null && contribution <= 0) {
      score -= 35;
      blockers.push("non-positive contribution");
    }

    if (["rejected","expired"].includes(String(row.status || "").toLowerCase())) {
      score = 0;
      blockers.push("candidate is not active");
    }

    return Object.freeze({
      score: Math.round(clamp(score)),
      blockers: Object.freeze(blockers),
      reasons: Object.freeze(reasons),
      eligibleForPromotion: blockers.length === 0 && score >= 70
    });
  }

  function verifiedEconomics(economics = []) {
    return (Array.isArray(economics) ? economics : []).filter((row) =>
      row && row.inputs_verified === true &&
      String(row.profit_gate_status || "").toUpperCase() === "PASS" &&
      (num(row.contribution_before_coupon) ?? 0) > 0
    );
  }

  function averageVerifiedContribution(economics = []) {
    const rows = verifiedEconomics(economics);
    if (!rows.length) return null;
    return rows.reduce((sum, row) => sum + (num(row.contribution_before_coupon) ?? 0), 0) / rows.length;
  }

  function profitMilestones(avgContribution) {
    const contribution = num(avgContribution);
    const targets = [100, 500, 1000, 3000, 10000];
    return targets.map((target) => ({
      target,
      minimumOrdersAtContribution: contribution !== null && contribution > 0 ? Math.ceil(target / contribution) : null,
      contributionPerOrder: contribution !== null && contribution > 0 ? contribution : null
    }));
  }

  function launchState(summary = {}) {
    const soft = String(summary.soft_launch_status || "UNKNOWN").toUpperCase();
    const money = String(summary.real_money_status || "UNKNOWN").toUpperCase();
    const paid = String(summary.paid_marketing_status || "UNKNOWN").toUpperCase();
    return Object.freeze({
      soft,
      money,
      paid,
      canSoftLaunch: soft === "PASS" || soft === "GO",
      canTakeRealMoney: money === "PASS" || money === "GO",
      canRunPaidMarketing: paid === "PASS" || paid === "GO"
    });
  }

  function bottleneck({today = {}, launchSummary = {}, economics = []} = {}) {
    const f = funnel(today);
    const launch = launchState(launchSummary);
    const verified = verifiedEconomics(economics);

    if (!launch.canSoftLaunch) {
      return {code:"SOFT_LAUNCH_GATE", title:"Launch readiness", why:"A soft-launch gate is still blocking safe public growth.", action:"Resolve the blocking launch-readiness gate before increasing traffic."};
    }
    if (verified.length < 3) {
      return {code:"ECONOMICS_SAMPLE", title:"Verified unit economics", why:"There are too few verified profitable economics checks to scale offers safely.", action:"Run verified Profit Engine checks on the strongest products and destinations."};
    }
    if (f.sessions < 20) {
      return {code:"TRAFFIC", title:"Qualified traffic", why:"Traffic is too small for reliable conversion learning.", action:"Push organic distribution first: Google product visibility, SEO, social short-form, Pinterest and creator tests with tracked UTMs."};
    }
    if (f.productViewsPerSession !== null && f.productViewsPerSession < 0.7) {
      return {code:"MERCHANDISING", title:"Merchandising", why:"Sessions are not reaching enough product detail pages.", action:"Improve home/category ranking, product cards and recommendation placement before buying traffic."};
    }
    if (f.productViews >= 20 && (f.productViewToCartPct ?? 0) < 4) {
      return {code:"OFFER_FIT", title:"Offer / product fit", why:"Product interest is not becoming cart intent.", action:"Test stronger verified deals, bundles, trust signals, shipping clarity and product selection."};
    }
    if (f.carts >= 10 && (f.cartToCheckoutPct ?? 0) < 30) {
      return {code:"CART_CHECKOUT", title:"Cart to checkout", why:"Cart intent is dropping before checkout.", action:"Reduce checkout friction and clarify shipping, returns, totals and trust."};
    }
    if (!launch.canTakeRealMoney) {
      return {code:"REAL_MONEY_GATE", title:"Real-money readiness", why:"The funnel may be testable, but real payment remains owner-gated or blocked.", action:"Finish payment callback → order → supplier handoff → tracking → full order test before enabling payment."};
    }
    if (f.checkouts >= 10 && (f.checkoutToOrderPct ?? 0) < 35) {
      return {code:"CHECKOUT_ORDER", title:"Checkout conversion", why:"Checkout starts are not becoming confirmed orders.", action:"Investigate payment, trust, shipping cost and checkout UX using confirmed funnel evidence."};
    }
    return {code:"SCALE_WINNERS", title:"Scale verified winners", why:"No earlier bottleneck is dominant from the current verified evidence.", action:"Increase exposure only for deals with verified margin, stock, shipping and measured conversion."};
  }

  function recommendExperiment(experiments = []) {
    const rows = (Array.isArray(experiments) ? experiments : []).filter((row) =>
      row && !["won","lost","archived"].includes(String(row.status || "").toLowerCase())
    );
    const ranked = rows.map((row) => {
      const paid = row.paid === true;
      const approval = String(row.owner_approval_status || "not_required").toLowerCase();
      const status = String(row.status || "draft").toLowerCase();
      const locked = paid && approval !== "approved";
      let score = 0;
      if (!paid) score += 30;
      if (status === "testing") score += 28;
      if (status === "ready") score += 24;
      if (status === "draft") score += 8;
      if (locked) score -= 80;
      return {...row, boom_experiment_score: score, boom_locked: locked};
    }).sort((a,b) => b.boom_experiment_score - a.boom_experiment_score);
    return ranked.find((row) => !row.boom_locked) || null;
  }

  function radarFocus(ideas = []) {
    const rows = (Array.isArray(ideas) ? ideas : []).filter((row) =>
      row && !["rejected","blocked"].includes(String(row.status || "").toLowerCase())
    );
    return rows.map((row) => {
      const priority = num(row.priority) ?? 0;
      const value = num(row.user_value) ?? 0;
      const complexity = num(row.complexity) ?? 0;
      const status = String(row.status || "scouted").toLowerCase();
      let score = priority * 12 + value * 10 - complexity * 6;
      if (status === "adopted") score += 24;
      if (status === "testing") score += 16;
      if (status === "prototype") score += 10;
      return {...row, boom_radar_score: Math.round(score)};
    }).sort((a,b) => b.boom_radar_score - a.boom_radar_score)[0] || null;
  }

  function buildPlan({snapshot = {}, launchSummary = {}, economics = [], deals = [], experiments = [], worldIdeas = []} = {}) {
    const avgContribution = averageVerifiedContribution(economics);
    const rankedDeals = (Array.isArray(deals) ? deals : [])
      .map((row) => ({...row, boom: scoreDeal(row)}))
      .sort((a, b) => b.boom.score - a.boom.score);
    return Object.freeze({
      funnel: funnel(snapshot.today || {}),
      launch: launchState(launchSummary),
      verifiedEconomicsCount: verifiedEconomics(economics).length,
      avgVerifiedContribution: avgContribution,
      milestones: Object.freeze(profitMilestones(avgContribution)),
      bottleneck: Object.freeze(bottleneck({
        today: snapshot.today || {},
        launchSummary,
        economics
      })),
      rankedDeals: Object.freeze(rankedDeals),
      recommendedExperiment: recommendExperiment(experiments),
      radarFocus: radarFocus(worldIdeas)
    });
  }

  const api = Object.freeze({
    funnel,
    scoreDeal,
    verifiedEconomics,
    averageVerifiedContribution,
    profitMilestones,
    launchState,
    bottleneck,
    recommendExperiment,
    radarFocus,
    buildPlan
  });

  if (typeof window !== "undefined") window.BoomGrowthOSCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
