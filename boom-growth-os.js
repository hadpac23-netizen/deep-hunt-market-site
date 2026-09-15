(() => {
  "use strict";

  const H = window.HuntCore;
  const Core = window.BoomGrowthOSCore;
  const sb = window.supabase;
  if (!H || !Core || !sb?.createClient) return;

  const BASE = "https://zszlnahjqmwozwubetkm.supabase.co";
  const client = window.HuntSupabaseClient || sb.createClient(BASE, H.publishableKey);
  if (!window.HuntSupabaseClient) window.HuntSupabaseClient = client;
  const $ = (q) => document.querySelector(q);
  let session = null;

  function status(text, tone = "") {
    const el = $("#bg-status");
    if (!el) return;
    el.hidden = false;
    el.dataset.tone = tone;
    el.innerHTML = "<strong>" + H.esc(text) + "</strong>";
  }

  function money(value, currency = "USD") {
    return Number.isFinite(Number(value)) ? H.money(Number(value), currency) : "—";
  }

  function percent(value) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(1) + "%" : "—";
  }

  async function ownerFunction(slug) {
    const res = await fetch(BASE + "/functions/v1/" + slug, {
      headers: {
        apikey: H.publishableKey,
        Authorization: "Bearer " + session.access_token
      },
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok !== true) throw new Error(data.error || slug + " failed");
    return data;
  }

  async function loadData() {
    const [mission, launch, econRes, dealRes, experimentRes, radarRes] = await Promise.all([
      ownerFunction("hunt-owner-mission-control"),
      ownerFunction("hunt-launch-readiness"),
      client.from("hunt_unit_economics")
        .select("provider,item_id,currency,inputs_verified,profit_gate_status,contribution_before_coupon,contribution_margin,max_safe_cac,calculated_at")
        .order("calculated_at", {ascending:false})
        .limit(120),
      client.from("hunt_deal_candidates")
        .select("id,provider,item_id,title_snapshot,status,deal_score,current_price,reference_price,currency,discount_percent,profit_gate_status,max_safe_coupon_amount,truth_status,updated_at")
        .order("updated_at", {ascending:false})
        .limit(120),
      client.from("hunt_marketing_experiments")
        .select("id,title,channel,objective,paid,owner_approval_status,status,hypothesis,primary_kpi,updated_at")
        .order("updated_at", {ascending:false})
        .limit(80),
      client.from("hunt_boom_world_ideas")
        .select("id,title,domain,status,priority,user_value,complexity,next_action,evidence_note,last_verified_at,updated_at")
        .order("updated_at", {ascending:false})
        .limit(80)
    ]);

    if (econRes.error) throw econRes.error;
    if (dealRes.error) throw dealRes.error;
    if (experimentRes.error) throw experimentRes.error;
    if (radarRes.error) throw radarRes.error;

    const economics = econRes.data || [];
    const econMap = new Map();
    for (const row of economics) {
      const key = String(row.provider || "") + ":" + String(row.item_id || "");
      if (!econMap.has(key)) econMap.set(key, row);
    }
    const deals = (dealRes.data || []).map((row) => {
      const econ = econMap.get(String(row.provider || "") + ":" + String(row.item_id || "")) || {};
      return {
        ...row,
        inputs_verified: econ.inputs_verified === true,
        contribution_before_coupon: econ.contribution_before_coupon,
        max_safe_cac: econ.max_safe_cac,
        profit_gate_status: row.profit_gate_status || econ.profit_gate_status || ""
      };
    });

    return {
      snapshot: mission.snapshot || {},
      missionRecommendation: mission.recommendation || {},
      launchSummary: launch.summary || {},
      economics,
      deals,
      experiments: experimentRes.data || [],
      worldIdeas: radarRes.data || []
    };
  }

  function renderFunnel(f) {
    const rows = [
      ["Sessions", f.sessions, "100% entry"],
      ["Product views", f.productViews, f.productViewsPerSession == null ? "—" : f.productViewsPerSession.toFixed(2) + " / session"],
      ["Add to cart", f.carts, percent(f.productViewToCartPct) + " of product views"],
      ["Checkout", f.checkouts, percent(f.cartToCheckoutPct) + " of carts"],
      ["Orders", f.orders, percent(f.checkoutToOrderPct) + " of checkout"]
    ];
    $("#bg-funnel").innerHTML = rows.map(([label, value, meta]) =>
      '<div class="bg-step"><small>' + H.esc(label) + '</small><strong>' + H.esc(value) + '</strong><small>' + H.esc(meta) + '</small></div>'
    ).join("");
  }

  function renderMilestones(rows) {
    $("#bg-milestones").innerHTML = rows.map((row) =>
      '<div class="bg-row"><div class="bg-row-head"><strong>' + money(row.target) + ' net/day</strong><span class="bg-score">' +
      (row.minimumOrdersAtContribution == null ? "—" : H.esc(row.minimumOrdersAtContribution)) +
      '</span></div><small>' +
      (row.minimumOrdersAtContribution == null
        ? "Need verified positive contribution data first."
        : "minimum orders/day at verified contribution of " + money(row.contributionPerOrder) + " before acquisition cost and remaining overhead") +
      '</small></div>'
    ).join("");
  }

  function renderDeals(rows) {
    const active = rows.filter((row) => !["rejected","expired"].includes(String(row.status || "").toLowerCase())).slice(0, 12);
    $("#bg-deal-list").innerHTML = active.length ? active.map((row) => {
      const b = row.boom;
      const blockers = b.blockers.length ? " · Blockers: " + b.blockers.join(", ") : "";
      return '<article class="bg-row"><div class="bg-row-head"><div><strong>' +
        H.esc(row.title_snapshot || row.item_id || "Deal candidate") +
        '</strong><small>' + H.esc(row.provider || "HUNT") + ' · ' + H.esc(row.status || "candidate") + '</small></div><span class="bg-score">' +
        H.esc(b.score) + '/100</span></div><small>Profit gate: ' +
        H.esc(row.profit_gate_status || "unknown") + ' · Safe CAC: ' + money(row.max_safe_cac, row.currency || "USD") +
        H.esc(blockers) + '</small></article>';
    }).join("") : '<div class="bg-empty">No active deal candidates yet. BOOM will not invent them.</div>';
  }

  function renderLaunch(launch) {
    const states = [
      ["Soft launch", launch.soft],
      ["Real money", launch.money],
      ["Paid marketing", launch.paid]
    ];
    $("#bg-launch").innerHTML = states.map(([label, state]) =>
      '<div class="bg-row"><div class="bg-row-head"><strong>' + H.esc(label) + '</strong><span class="bg-score">' + H.esc(state) + '</span></div></div>'
    ).join("");
  }

  function renderOperating(plan, data) {
    const brainRows = [
      ["Analytics", Number(data.snapshot?.today?.unique_sessions || 0) > 0 ? "LIVE" : "READY"],
      ["Profit", plan.verifiedEconomicsCount > 0 ? "LIVE" : "NEEDS DATA"],
      ["Deals", plan.rankedDeals.length > 0 ? "LIVE" : "READY"],
      ["Marketing", (data.experiments || []).length > 0 ? "LIVE" : "READY"],
      ["Radar", (data.worldIdeas || []).length > 0 ? "LIVE" : "READY"]
    ];
    $("#bg-brains").innerHTML = brainRows.map(([name,state]) =>
      '<div class="bg-step"><small>' + H.esc(name) + '</small><strong>' + H.esc(state) + '</strong></div>'
    ).join("");

    const exp = plan.recommendedExperiment;
    $("#bg-exp-title").textContent = exp?.title || "No active experiment selected";
    $("#bg-exp-copy").textContent = exp
      ? (String(exp.paid ? "Paid" : "Free") + " · " + String(exp.channel || "channel") + " · KPI: " + String(exp.primary_kpi || "measurable outcome") + ". " + String(exp.hypothesis || ""))
      : "BOOM prefers free, measurable experiments before paid scale.";

    const radar = plan.radarFocus;
    $("#bg-radar-title").textContent = radar?.title || "No radar focus selected";
    $("#bg-radar-copy").textContent = radar
      ? (String(radar.domain || "growth") + " · " + String(radar.status || "scouted") + ". Next: " + String(radar.next_action || radar.evidence_note || "Review evidence."))
      : "Global ideas remain evidence-based and owner-controlled.";
  }

  function render(data) {
    const plan = Core.buildPlan(data);
    $("#bg-sessions").textContent = String(plan.funnel.sessions);
    $("#bg-product-views").textContent = String(plan.funnel.productViews);
    $("#bg-econ").textContent = String(plan.verifiedEconomicsCount);
    $("#bg-deals").textContent = String(plan.rankedDeals.filter((x) => !["rejected","expired"].includes(String(x.status || "").toLowerCase())).length);
    $("#bg-avg-profit").textContent = money(plan.avgVerifiedContribution);

    renderFunnel(plan.funnel);
    renderMilestones(plan.milestones);
    renderDeals(plan.rankedDeals);
    renderLaunch(plan.launch);
    renderOperating(plan, data);

    $("#bg-bottleneck-code").textContent = plan.bottleneck.code;
    $("#bg-bottleneck-title").textContent = plan.bottleneck.title;
    $("#bg-bottleneck-why").textContent = plan.bottleneck.why;
    $("#bg-bottleneck-action").textContent = plan.bottleneck.action;

    $("#bg-status").hidden = true;
    $("#bg-app").hidden = false;
  }

  async function init() {
    const [userResult, sessionResult] = await Promise.all([
      client.auth.getUser(),
      client.auth.getSession()
    ]);
    const user = userResult.data.user || null;
    session = sessionResult.data.session || null;
    if (!user || !session) {
      location.replace("auth.html?next=" + encodeURIComponent("/deep-hunt-market-site/boom-growth-os.html"));
      return;
    }

    const profile = await client.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!profile.data?.is_admin) {
      status("Owner/admin access required.", "error");
      return;
    }

    try {
      const data = await loadData();
      render(data);
    } catch (error) {
      status(error?.message || "Could not load BOOM Profit & Growth OS.", "error");
    }
  }

  init();
})();
