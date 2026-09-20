(() => {
  "use strict";

  const config = window.HUNT_ANALYTICS_CONFIG || {};
  const consentKey = "hunt_analytics_consent_v2";
  const legacyConsentKey = "hunt_analytics_consent_v1";
  const consentVersion = String(config.consentVersion || "2026-09-20.1");
  let pageTracked = false;
  let initialized = false;
  let posthogLoaded = false;

  const clean = (value, max = 120) =>
    String(value ?? "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);

  const safePath = () => location.pathname || "/";
  const hasValidGtm = () => /^GTM-[A-Z0-9]+$/i.test(clean(config.gtmContainerId, 32));
  const hasValidGa4 = () => /^G-[A-Z0-9]+$/i.test(clean(config.ga4MeasurementId, 32));
  const hasValidPostHog = () =>
    /^phc_[A-Za-z0-9]+$/.test(clean(config.posthogProjectToken, 180)) &&
    /^https:\/\/eu\.i\.posthog\.com$/i.test(clean(config.posthogApiHost, 100));
  const configured = () => hasValidGtm() || hasValidGa4() || hasValidPostHog();

  function readStoredConsent() {
    if (!config.consentRequired) return "granted";
    try {
      const raw = localStorage.getItem(consentKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.analytics === "denied") return "denied";
        if (parsed?.analytics === "granted" && parsed?.version === consentVersion) return "granted";
      }
      const legacy = localStorage.getItem(legacyConsentKey);
      if (legacy === "denied") return "denied";
      // A legacy grant covered the previous analytics stack. Do not silently
      // expand it to new analytics vendors or a new consent scope.
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  let consentState = readStoredConsent();
  window.dataLayer = window.dataLayer || [];

  function persistConsent(state) {
    const record = {
      analytics: state,
      version: consentVersion,
      updated_at: new Date().toISOString()
    };
    try {
      localStorage.setItem(consentKey, JSON.stringify(record));
      localStorage.setItem(legacyConsentKey, state);
    } catch {}
    return record;
  }

  function consentGranted() {
    return consentState === "granted";
  }

  function consentRecord() {
    try {
      const raw = localStorage.getItem(consentKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        analytics: parsed?.analytics === "granted" ? "granted" : parsed?.analytics === "denied" ? "denied" : "unknown",
        version: clean(parsed?.version || "", 40),
        updated_at: clean(parsed?.updated_at || "", 60)
      };
    } catch {
      return null;
    }
  }

  function loadGtm() {
    const id = clean(config.gtmContainerId, 32);
    if (!consentGranted() || !hasValidGtm() || document.querySelector("script[data-hunt-gtm]")) return;
    window.dataLayer.push({"gtm.start": Date.now(), event: "gtm.js"});
    const script = document.createElement("script");
    script.async = true;
    script.dataset.huntGtm = "1";
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function loadDirectGa4() {
    const id = clean(config.ga4MeasurementId, 32);
    if (!consentGranted() || hasValidGtm() || !hasValidGa4() || document.querySelector("script[data-hunt-ga4]")) return;
    window["ga-disable-" + id] = false;
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    window.gtag("js", new Date());
    window.gtag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement("script");
    script.async = true;
    script.dataset.huntGa4 = "1";
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function loadPostHog() {
    if (!consentGranted() || !hasValidPostHog() || posthogLoaded || window.posthog?.__loaded) return;
    posthogLoaded = true;
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null;posthogLoaded=false},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags on onFeatureFlags onSessionId identify group reset get_distinct_id get_session_id set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(config.posthogProjectToken, {
      api_host: config.posthogApiHost,
      ui_host: config.posthogUiHost || "https://eu.posthog.com",
      defaults: config.posthogDefaults || "2026-05-30",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      session_recording: {maskAllInputs: true},
      person_profiles: "identified_only"
    });
  }

  function applyGrantedProviderState() {
    if (hasValidGa4()) {
      const id = clean(config.ga4MeasurementId, 32);
      window["ga-disable-" + id] = false;
      try {
        window.gtag?.("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      } catch {}
    }
    try { window.posthog?.opt_in_capturing?.(); } catch {}
  }

  function applyDeniedProviderState() {
    if (hasValidGa4()) {
      const id = clean(config.ga4MeasurementId, 32);
      window["ga-disable-" + id] = true;
      try {
        window.gtag?.("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      } catch {}
    }
    try {
      window.posthog?.stopSessionRecording?.();
      window.posthog?.opt_out_capturing?.();
      window.posthog?.reset?.();
    } catch {}
  }

  function sendGaPayload(payload) {
    if (!consentGranted()) return false;
    if (hasValidGtm()) {
      window.dataLayer.push(payload);
      return true;
    }
    if (hasValidGa4() && typeof window.gtag === "function") {
      const {event, ...params} = payload;
      window.gtag("event", event, params);
      return true;
    }
    return false;
  }

  function sendPostHogPayload(event, params = {}) {
    if (!consentGranted() || !hasValidPostHog()) return false;
    loadPostHog();
    try {
      window.posthog?.capture?.(event === "page_view" ? "$pageview" : event, {
        ...params,
        hunt_environment: clean(config.environment || "production", 24),
        page_path: safePath(),
        $process_person_profile: false
      });
      return true;
    } catch {
      return false;
    }
  }

  function dataLayerPush(event, params = {}) {
    // Fail closed: events that happen before explicit consent are discarded,
    // not queued and not replayed later.
    if (!consentGranted()) return false;
    const payload = {
      event,
      hunt_environment: clean(config.environment || "production", 24),
      page_path: safePath(),
      ...params
    };
    const gaSent = sendGaPayload(payload);
    const posthogSent = sendPostHogPayload(event, params);
    return gaSent || posthogSent;
  }

  function pageView() {
    if (!consentGranted() || pageTracked) return false;
    pageTracked = true;
    return dataLayerPush("page_view", {
      page_title: clean(document.title, 160),
      page_location_path: safePath()
    });
  }

  function init() {
    if (initialized || !consentGranted() || !configured()) return false;
    initialized = true;
    loadGtm();
    loadDirectGa4();
    loadPostHog();
    applyGrantedProviderState();
    pageView();
    return true;
  }

  function dismissConsentBanner() {
    document.getElementById("hunt-analytics-consent")?.remove();
  }

  function isConsentManagerSurface() {
    return document.body?.dataset?.huntConsentSurface === "manager";
  }

  function setConsent(granted) {
    consentState = granted === true ? "granted" : "denied";
    persistConsent(consentState);
    dismissConsentBanner();

    if (!consentGranted()) {
      initialized = false;
      pageTracked = false;
      applyDeniedProviderState();
      window.dispatchEvent(new CustomEvent("hunt:analytics-consent", {
        detail: {granted: false, state: "denied", version: consentVersion}
      }));
      return false;
    }

    applyGrantedProviderState();
    init();
    window.dispatchEvent(new CustomEvent("hunt:analytics-consent", {
      detail: {granted: true, state: "granted", version: consentVersion}
    }));
    return true;
  }

  function openPreferences() {
    const target = clean(config.privacyChoicesUrl || "privacy-choices.html", 180) || "privacy-choices.html";
    location.assign(target);
  }

  function renderConsentBanner() {
    if (!config.consentRequired || !configured() || consentState !== "unknown" || isConsentManagerSurface()) return;
    if (document.getElementById("hunt-analytics-consent")) return;

    const style = document.createElement("style");
    style.id = "hunt-analytics-consent-style";
    style.textContent = [
      "#hunt-analytics-consent{position:fixed;z-index:99999;left:50%;bottom:18px;transform:translateX(-50%);width:min(760px,calc(100% - 24px));background:rgba(6,18,32,.97);border:1px solid rgba(120,170,235,.35);box-shadow:0 18px 60px rgba(0,0,0,.38);backdrop-filter:blur(18px);border-radius:16px;padding:15px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;color:#eef6ff;font-family:inherit}",
      "#hunt-analytics-consent strong{display:block;font-size:.86rem;margin-bottom:4px}",
      "#hunt-analytics-consent p{margin:0;color:#aabed5;font-size:.68rem;line-height:1.45}",
      "#hunt-analytics-consent .hunt-consent-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}",
      "#hunt-analytics-consent button,#hunt-analytics-consent a{border:1px solid rgba(120,170,235,.35);background:rgba(14,35,59,.92);color:#dbeaff;border-radius:10px;padding:9px 12px;font:inherit;font-size:.68rem;font-weight:800;cursor:pointer;text-decoration:none;text-align:center}",
      "#hunt-analytics-consent button[data-consent='accept']{background:#ecf6ff;color:#071424;border-color:#ecf6ff}",
      "@media(max-width:680px){#hunt-analytics-consent{grid-template-columns:1fr;bottom:10px}.hunt-consent-actions{justify-content:stretch!important}.hunt-consent-actions button,.hunt-consent-actions a{flex:1}}"
    ].join("");

    if (!document.getElementById(style.id)) document.head.appendChild(style);

    const banner = document.createElement("aside");
    banner.id = "hunt-analytics-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Analytics preference");
    banner.innerHTML =
      '<div><strong>Analytics are optional</strong><p>Allow Google Analytics and PostHog EU to measure HUNT usage and shopping-funnel events. We do not send card details, shipping-form contents, or payment credentials. Session replay remains off.</p></div>' +
      '<div class="hunt-consent-actions"><button type="button" data-consent="decline">Decline</button><a href="' +
      clean(config.privacyChoicesUrl || "privacy-choices.html", 180) +
      '">Privacy choices</a><button type="button" data-consent="accept">Allow analytics</button></div>';
    banner.addEventListener("click", event => {
      const button = event.target.closest?.("[data-consent]");
      if (!button) return;
      setConsent(button.dataset.consent === "accept");
    });
    document.body.appendChild(banner);
  }

  function item(product = {}, variant = null, quantity = 1) {
    const provider = clean(product.provider || product.brand || "", 80);
    const category = clean(window.HuntCore?.inferCategory?.(product) || product.category || "", 60);
    return {
      item_id: clean(product.item_id || product.id || "", 100),
      item_name: clean(product.title || product.name || "Product", 160),
      item_brand: provider,
      item_category: category,
      item_variant: clean(
        variant?.variant_label ||
        [variant?.color, variant?.size].filter(Boolean).join(" / ") ||
        product.variant_label || "",
        100
      ),
      quantity: Math.max(1, Math.min(20, Number(quantity) || 1))
    };
  }

  function cartItem(row = {}) {
    return {
      item_id: clean(row.item_id || "", 100),
      item_name: clean(row.title || "Product", 160),
      item_brand: clean(row.provider || "", 80),
      item_variant: clean(row.variant_label || "", 100),
      quantity: Math.max(1, Math.min(20, Number(row.qty) || 1))
    };
  }

  const api = {
    configured,
    consentGranted,
    getConsentStatus: () => consentState,
    getConsentRecord: consentRecord,
    setConsent,
    openPreferences,
    pageView,
    category(category, resultCount = null) {
      return dataLayerPush("view_item_list", {
        item_list_id: clean(category, 60),
        item_list_name: clean(category, 60),
        result_count: Number.isFinite(Number(resultCount)) ? Number(resultCount) : undefined
      });
    },
    search({category = "", resultCount = 0} = {}) {
      return dataLayerPush("search", {
        search_category: clean(category, 60),
        result_count: Math.max(0, Number(resultCount) || 0)
      });
    },
    viewItem(product, variant = null) {
      return dataLayerPush("view_item", {
        items: [item(product, variant, 1)],
        hunt_price_stage: "source_intelligence_not_retail"
      });
    },
    addToCart(row, product = {}) {
      return dataLayerPush("add_to_cart", {
        items: [item(product, {
          variant_label: row?.variant_label,
          color: "",
          size: ""
        }, row?.qty || 1)],
        hunt_price_stage: "source_intelligence_not_retail"
      });
    },
    beginCheckout(cart = [], destination = "") {
      const items = Array.isArray(cart) ? cart.map(cartItem).filter(x => x.item_id) : [];
      if (!items.length) return false;
      return dataLayerPush("begin_checkout", {
        items,
        destination_market: clean(destination, 60),
        hunt_checkout_stage: "preview_no_payment"
      });
    },
    checkoutMarket(destination = "") {
      return dataLayerPush("checkout_market_selected", {
        destination_market: clean(destination, 60),
        hunt_checkout_stage: "preview_no_payment"
      });
    },
    recommendationImpression({placement = "", items = []} = {}) {
      const normalized = Array.isArray(items) ? items.slice(0, 20).map(x => item(x, null, 1)).filter(x => x.item_id) : [];
      if (!normalized.length) return false;
      return dataLayerPush("view_promotion", {
        creative_name: clean(placement || "recommendation", 80),
        items: normalized
      });
    },
    relatedProductClick(product = {}, placement = "endless_discovery") {
      return dataLayerPush("select_item", {
        item_list_id: clean(placement, 80),
        item_list_name: clean(placement, 80),
        items: [item(product, null, 1)]
      });
    },
    surveyComplete({categories = [], priceBand = "any"} = {}) {
      return dataLayerPush("shopping_survey_complete", {
        selected_category_count: Array.isArray(categories) ? categories.length : 0,
        price_band: clean(priceBand, 40)
      });
    },
    shoppingAction({provider = "", itemId = "", action = "", active = false, category = ""} = {}) {
      const normalizedAction = clean(action, 20);
      if (!["like", "save"].includes(normalizedAction)) return false;
      return dataLayerPush("shopping_preference", {
        item_id: clean(itemId, 100),
        item_brand: clean(provider, 80),
        item_category: clean(category, 60),
        preference_action: normalizedAction,
        preference_active: Boolean(active)
      });
    },
    purchase({transactionId, value, currency = "USD", items = [], confirmed = false} = {}) {
      if (confirmed !== true || !clean(transactionId, 120) || !(Number(value) >= 0)) return false;
      return dataLayerPush("purchase", {
        transaction_id: clean(transactionId, 120),
        value: Number(value),
        currency: clean(currency, 12),
        items: Array.isArray(items) ? items.map(cartItem) : [],
        hunt_order_state: "confirmed_real_order"
      });
    }
  };

  window.HuntAnalytics = Object.freeze(api);

  const boot = () => {
    if (consentGranted()) init();
    else if (consentState === "denied") applyDeniedProviderState();
    renderConsentBanner();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {once: true});
  } else {
    boot();
  }
})();
