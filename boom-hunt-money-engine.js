(() => {
  "use strict";
  if (window.BoomHuntMoneyEngine?.version) return;

  const version = "HUNT-MONEY-ENGINE-V1";
  const REQUIRED = [
    "destination","sale_price","customer_shipping_revenue","supplier_cost","supplier_shipping_cost",
    "payment_fees","fx_cost","tax_import_cost","discount_cost","affiliate_creator_cost",
    "marketing_cost","expected_return_refund_cost","other_variable_cost"
  ];
  const num = v => typeof v === "number" && Number.isFinite(v) ? v : null;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const round = v => Number(Number(v).toFixed(2));

  function baseOutput(status, reason, blockers=[]) {
    return {
      version, status, score: 0, confidence: 0,
      reason_codes: reason ? [reason] : [],
      evidence_refs: [], blockers,
      projected_contribution: null,
      verified_profit_value: null,
      traffic_value: null,
      basket_value: null,
      contribution_density: {
        per_shipping_dollar: null,
        per_chargeable_kg: null,
        per_acquisition_dollar: null
      },
      money_roles: [],
      recommended_action: "",
      requires_owner_gate: false,
      material_action_authorized: false
    };
  }

  function evaluateRoute(input={}) {
    const missing = REQUIRED.filter(k => k === "destination" ? !String(input[k]||"").trim() : num(input[k]) === null);
    if (missing.length) {
      const out = baseOutput("UNKNOWN","MISSING_COST_EVIDENCE",missing);
      out.recommended_action = "refresh exact route cost evidence";
      return out;
    }
    const gates = [
      ["product_truth_verified","PRODUCT_TRUTH_NOT_VERIFIED"],
      ["stock_verified","STOCK_NOT_VERIFIED"],
      ["shipping_quote_verified","SHIPPING_NOT_VERIFIED"]
    ];
    const failed = gates.find(([k]) => input[k] !== true);
    if (failed) {
      const out = baseOutput("HOLD",failed[1],[failed[0]]);
      out.recommended_action = "refresh truth gate before routing";
      return out;
    }

    const revenue = input.sale_price + input.customer_shipping_revenue;
    const costs = input.supplier_cost + input.supplier_shipping_cost + input.payment_fees +
      input.fx_cost + input.tax_import_cost + input.discount_cost + input.affiliate_creator_cost +
      input.marketing_cost + input.expected_return_refund_cost + input.other_variable_cost;
    const contribution = round(revenue - costs);
    const margin = revenue > 0 ? contribution / revenue : null;
    const minContribution = num(input.min_projected_contribution_usd) ?? 4;
    const minMargin = num(input.min_projected_margin_rate) ?? 0.35;

    const status = contribution < 0 ? "REJECT" :
      contribution < minContribution || margin < minMargin ? "REVIEW" : "PASS";
    const reason = contribution < 0 ? "NEGATIVE_CONTRIBUTION" :
      status === "REVIEW" ? "BELOW_MARGIN_FLOOR" : "ROUTE_ECONOMICS_PASS";
    const out = baseOutput(status,reason,[]);
    out.projected_contribution = contribution;
    out.projected_margin_rate = margin === null ? null : Number(margin.toFixed(4));
    out.total_variable_cost = round(costs);
    out.customer_revenue = round(revenue);
    out.destination = input.destination;
    out.supplier = input.supplier || "";
    out.warehouse = input.warehouse || "";
    out.shipping_method = input.shipping_method || "";
    out.confidence = 1;
    out.score = status === "PASS" ? clamp(round((contribution / Math.max(revenue,0.01))*100),0,100) : 0;
    out.recommended_action = status === "PASS" ? "eligible for shadow ranking" :
      status === "REVIEW" ? "review route, supplier, price or basket economics" : "block uneconomic route";
    return out;
  }

  function contributionDensity(input={}) {
    const c = num(input.projected_contribution);
    if (c === null) return baseOutput("UNKNOWN","MISSING_COST_EVIDENCE",["projected_contribution"]);
    const shipping = num(input.supplier_shipping_cost);
    const kg = num(input.chargeable_weight_kg);
    const cac = num(input.acquisition_cost);
    const acquisitionCoverage = input.acquisition_cost_verified === true;

    const out = baseOutput("PASS","DENSITY_CALCULATED",[]);
    out.projected_contribution = c;
    out.confidence = 1;
    out.contribution_density = {
      per_shipping_dollar: shipping !== null && shipping > 0 ? round(c/shipping) : null,
      per_chargeable_kg: kg !== null && kg > 0 ? round(c/kg) : null,
      per_acquisition_dollar: acquisitionCoverage && cac !== null && cac > 0 ? round(c/cac) : null
    };
    if (kg === null || kg <= 0) out.reason_codes.push("SHIPPING_DENSITY_UNKNOWN");
    if (!acquisitionCoverage) out.reason_codes.push("ACQUISITION_COST_UNKNOWN");
    out.recommended_action = "use density only as a ranking diagnostic";
    return out;
  }

  function classifyMoneyRole(input={}) {
    if (input.performance_verified !== true) {
      const out = baseOutput("UNKNOWN","PERFORMANCE_EVIDENCE_MISSING",["performance_verified"]);
      out.money_roles = ["UNKNOWN"];
      out.recommended_action = "collect observed acquisition, basket and realized-profit evidence";
      return out;
    }
    const traffic = num(input.traffic_value);
    const basket = num(input.basket_value);
    const profit = num(input.verified_profit_value);
    const retention = num(input.retention_value);
    const shippingSponsor = input.shipping_sponsor_verified === true;
    if ([traffic,basket,profit,retention].some(v => v === null)) {
      const out = baseOutput("UNKNOWN","PERFORMANCE_EVIDENCE_MISSING",["traffic_value","basket_value","verified_profit_value","retention_value"]);
      out.money_roles = ["UNKNOWN"];
      return out;
    }
    const roles = [];
    if (traffic >= 70) roles.push("TRAFFIC_PRODUCT");
    if (profit > 0) roles.push("PROFIT_PRODUCT");
    if (basket >= 60) roles.push("BASKET_BUILDER");
    if (shippingSponsor) roles.push("SHIPPING_SPONSOR");
    if (retention >= 60) roles.push("RETENTION_PRODUCT");
    if (!roles.length) roles.push(profit < 0 ? "HOLD" : "UNKNOWN");

    const out = baseOutput(profit < 0 ? "HOLD" : "PASS", profit < 0 ? "NEGATIVE_REALIZED_PROFIT" : "MONEY_ROLE_CLASSIFIED",[]);
    out.traffic_value = traffic;
    out.basket_value = basket;
    out.verified_profit_value = profit;
    out.money_roles = roles;
    out.confidence = 1;
    out.score = clamp(round((traffic + basket + clamp(profit,0,100) + retention)/4),0,100);
    out.recommended_action = profit < 0 ? "stop scaling and review economics" : "route only through evidence-backed roles";
    return out;
  }

  function chooseRoute(routes=[]) {
    const evaluated = routes.map(route => ({route, decision:evaluateRoute(route)}));
    const eligible = evaluated.filter(x => x.decision.status === "PASS" || x.decision.status === "REVIEW")
      .sort((a,b) => Number(b.decision.projected_contribution??-Infinity) - Number(a.decision.projected_contribution??-Infinity));
    if (!eligible.length) {
      const out = baseOutput("UNKNOWN","NO_ECONOMIC_ROUTE",[]);
      out.routes = evaluated;
      out.recommended_action = "refresh supplier/warehouse/shipping evidence";
      return out;
    }
    const best = eligible[0];
    return {
      ...best.decision,
      reason_codes:[...best.decision.reason_codes,"BEST_SHADOW_ROUTE"],
      selected_route_id:best.route.route_id || null,
      routes:evaluated,
      recommended_action:"propose best verified route; production routing still requires Owner Gate",
      requires_owner_gate:true,
      material_action_authorized:false
    };
  }

  window.BoomHuntMoneyEngine = {version,evaluateRoute,contributionDensity,classifyMoneyRole,chooseRoute};
})();