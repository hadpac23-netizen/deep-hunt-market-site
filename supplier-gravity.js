(() => {
  "use strict";

  // BOOM Supplier Gravity — SHADOW / advisory only.
  // Reads canonical HUNT state; never owns cart, price, payment or supplier execution.
  const H = window.HuntCore;
  if (!H) return;

  const STATE_KEY = "hunt_supplier_gravity_v2";
  const DAY_MS = 86400000;
  let accountActions = new Map();

  const clean = value => String(value ?? "").trim();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const readState = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  };
  const saveState = value => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(value)); } catch {}
    return value;
  };
  const providerKey = value => {
    const key = clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (key.includes("cj")) return "cjdropshipping";
    if (key.includes("eprolo")) return "eprolo";
    if (key.includes("gooten")) return "gooten";
    if (key.includes("printful")) return "printful";
    if (key.includes("printify")) return "printify";
    return key || "unknown";
  };
  const productKey = item => providerKey(item?.provider) + ":" + clean(item?.item_id);
  const cart = () => {
    const rows = H.cart?.();
    return Array.isArray(rows) ? rows : [];
  };

  function actionFor(item) {
    return accountActions.get(productKey(item)) || {};
  }
  function pinned(item) {
    const row = actionFor(item);
    return Boolean(row.liked || row.saved);
  }
  function cartProviders(rows = cart()) {
    const stats = new Map();
    rows.forEach((item, index) => {
      const provider = providerKey(item?.provider);
      if (provider === "unknown") return;
      const prev = stats.get(provider) || {provider, lines:0, qty:0, first:index};
      prev.lines += 1;
      prev.qty += Math.max(1, Number(item?.qty) || 1);
      prev.first = Math.min(prev.first, index);
      stats.set(provider, prev);
    });
    return stats;
  }

  function syncAnchor() {
    const rows = cart();
    const providers = cartProviders(rows);
    const next = {...readState()};
    if (!rows.length || !providers.size) {
      next.anchor_provider = null;
      next.mode = "discovery";
      next.cart_provider_count = 0;
      next.updated_at = Date.now();
      return saveState(next);
    }

    const current = providerKey(next.anchor_provider);
    if (!providers.has(current)) {
      next.anchor_provider = [...providers.values()]
        .sort((a,b) => a.first - b.first)[0]?.provider || null;
    } else {
      next.anchor_provider = current;
    }

    next.mode = providers.size > 1 ? "mixed" : "single";
    next.cart_provider_count = providers.size;
    next.updated_at = Date.now();
    return saveState(next);
  }

  function recordProviderView(provider) {
    const key = providerKey(provider);
    if (key === "unknown") return;
    const current = readState();
    const next = {...current, affinity:{...(current.affinity || {})}};
    const row = next.affinity[key] || {score:0,last_seen:0};
    row.score = clamp(Number(row.score || 0) + 1, 0, 20);
    row.last_seen = Date.now();
    next.affinity[key] = row;
    saveState(next);
  }

  function affinityProvider() {
    const rows = Object.entries(readState().affinity || {})
      .map(([provider,row]) => ({
        provider,
        score:Number(row?.score || 0),
        last:Number(row?.last_seen || 0)
      }))
      .filter(row => row.last > Date.now() - 14 * DAY_MS)
      .sort((a,b) => (b.score - a.score) || (b.last - a.last));
    return rows[0]?.provider || null;
  }

  function context() {
    const synced = syncAnchor();
    return {
      mode:synced.mode || "discovery",
      anchor_provider:synced.anchor_provider || null,
      affinity_provider:affinityProvider(),
      providers:[...cartProviders().keys()]
    };
  }

  function productBoost(item) {
    const ctx = context();
    const provider = providerKey(item?.provider);
    const action = actionFor(item);
    let score = 0;
    if (action.saved) score += 500;
    if (action.liked) score += 350;
    if (ctx.anchor_provider) {
      if (provider === ctx.anchor_provider) score += 80;
      else score -= 12;
    } else if (ctx.affinity_provider && provider === ctx.affinity_provider) {
      score += 15;
    }
    return score;
  }

  function stableTie(item) {
    const seed = clean(item?.provider)+":"+clean(item?.item_id)+":"+Math.floor(Date.now()/DAY_MS);
    let hash = 2166136261;
    for (let i=0;i<seed.length;i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash,16777619);
    }
    return hash >>> 0;
  }

  function rankProducts(items,{baseScore}={}) {
    const list = Array.isArray(items) ? [...items] : [];
    const base = typeof baseScore === "function" ? baseScore : () => 0;
    return list.sort((a,b) => {
      const pinA = pinned(a), pinB = pinned(b);
      if (pinA !== pinB) return Number(pinB) - Number(pinA);
      const scoreA = Number(base(a) || 0) + productBoost(a);
      const scoreB = Number(base(b) || 0) + productBoost(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return stableTie(a) - stableTie(b);
    });
  }

  function rankCategories(keys,{inventory={}}={}) {
    const signals = H.signals?.() || {};
    const pinnedByCategory = new Map();
    for (const row of accountActions.values()) {
      if (!(row?.liked || row?.saved)) continue;
      const category = clean(row?.category);
      if (category) pinnedByCategory.set(category,(pinnedByCategory.get(category) || 0) + 1);
    }
    return (Array.isArray(keys) ? keys : [])
      .filter(key => !Object.prototype.hasOwnProperty.call(inventory,key) ||
        Number(inventory[key] || 0) > 0 || Number(pinnedByCategory.get(key) || 0) > 0)
      .sort((a,b) => {
        const score = key => Number(pinnedByCategory.get(key) || 0) * 1000 +
          Number(signals[key] || 0) * 10 +
          Math.log1p(Math.max(0,Number(inventory[key] || 0))) * 4;
        return score(b) - score(a);
      });
  }

  function evaluateSecondary({
    candidateProvider,
    cartRetailAmount=0,
    contributionBeforeExtraShipping=0,
    incrementalShipping=0,
    cartItemCount=0,
    explicitSearch=false,
    minContribution=1.5,
    minMarginRate=0.12,
    maxAutoCustomerShipping=1.99
  }={}) {
    const ctx = context();
    const candidate = providerKey(candidateProvider);
    if (!ctx.anchor_provider || candidate === ctx.anchor_provider) {
      return {
        provider:candidate,
        anchor_provider:ctx.anchor_provider,
        auto_open:true,
        requires_user_choice:false,
        hunt_shipping_subsidy:0,
        customer_shipping_increment:0,
        advisory_only:true,
        mode:"SHADOW"
      };
    }

    const retail = Math.max(0,Number(cartRetailAmount) || 0);
    const contribution = Math.max(0,Number(contributionBeforeExtraShipping) || 0);
    const extra = Math.max(0,Number(incrementalShipping) || 0);
    const target = Math.max(Number(minContribution) || 0, retail * Math.max(0,Number(minMarginRate) || 0));
    const absorbable = Math.max(0, contribution - target);
    const subsidy = Math.min(extra, absorbable);
    const customerIncrement = Math.max(0, extra - subsidy);
    const expanded = Number(cartItemCount || 0) >= 3 || retail >= 40;
    const autoOpen = expanded && customerIncrement <= Math.max(0,Number(maxAutoCustomerShipping) || 0);

    return {
      provider:candidate,
      anchor_provider:ctx.anchor_provider,
      auto_open:autoOpen,
      requires_user_choice:!autoOpen,
      explicit_search:Boolean(explicitSearch),
      hunt_shipping_subsidy:Number(subsidy.toFixed(2)),
      customer_shipping_increment:Number(customerIncrement.toFixed(2)),
      target_contribution:Number(target.toFixed(2)),
      contribution_after_subsidy:Number((contribution-subsidy).toFixed(2)),
      unified_shipping:true,
      advisory_only:true,
      mode:"SHADOW"
    };
  }

  function updateAccountActions(rows) {
    accountActions = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      if (!clean(row?.item_id)) continue;
      accountActions.set(providerKey(row?.provider)+":"+clean(row.item_id),row);
    }
  }
  window.addEventListener("hunt:shopping-state", event => {
    updateAccountActions(event.detail?.rows || []);
  });
  window.addEventListener("hunt:shopping-action", event => {
    const row = event.detail || {};
    if (!clean(row?.item_id)) return;
    const key = providerKey(row?.provider)+":"+clean(row.item_id);
    if (row.liked || row.saved) accountActions.set(key,row);
    else accountActions.delete(key);
  });
  window.addEventListener("hunt:cart-changed", syncAnchor);
  window.addEventListener("storage", event => {
    if (event.key === H.cartKey) syncAnchor();
  });
  document.addEventListener("click", event => {
    const link = event.target.closest?.("a[href*='product.html']");
    if (!link) return;
    try {
      const url = new URL(link.href,location.href);
      recordProviderView(url.searchParams.get("provider") || "");
    } catch {}
  },true);

  syncAnchor();
  window.HuntSupplierGravity = Object.freeze({
    mode:"SHADOW",
    advisory_only:true,
    providerKey,context,pinned,productBoost,rankProducts,rankCategories,
    evaluateSecondary,recordProviderView,syncAnchor
  });
})();
