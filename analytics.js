(() => {
  "use strict";

  const config = window.HUNT_ANALYTICS_CONFIG || {};
  const consentKey = "hunt_analytics_consent_v1";
  const queue = [];
  const learnSessionKey = "hunt_learning_session_v1";
  let pageTracked = false;
  let initialized = false;

  function learningSession() {
    try {
      let sid = sessionStorage.getItem(learnSessionKey);
      if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem(learnSessionKey, sid);
      }
      return sid;
    } catch {
      return "";
    }
  }

  function learningSignal(eventType, payload = {}) {
    if (!consentGranted || !window.HuntCore?.publishableKey) return false;
    const endpoint = (window.HuntCore.functionsBase || "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1") + "/hunt-commerce-signal";
    const body = {
      event_type: clean(eventType, 40),
      session_id: learningSession(),
      provider: clean(payload.provider || "", 80),
      item_id: clean(payload.item_id || "", 100),
      category: clean(payload.category || "", 60),
      placement: clean(payload.placement || "", 80),
      quantity: Math.max(1, Math.min(20, Number(payload.quantity) || 1))
    };
    if (Number.isFinite(Number(payload.retail_price))) body.retail_price = Number(payload.retail_price);
    fetch(endpoint, {
      method: "POST",
      keepalive: true,
      headers: {apikey: window.HuntCore.publishableKey, "Content-Type": "application/json"},
      body: JSON.stringify(body)
    }).catch(() => {});
    return true;
  }

  function learningRetail(product = {}, variant = null) {
    const verified = (variant?.retail_price_verified ?? product?.retail_price_verified) === true &&
      String(variant?.profit_gate_status || product?.profit_gate_status || "") === "PASS";
    const amount = Number(variant?.retail_price_amount ?? product?.retail_price_amount);
    return verified && Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  const clean = (value, max = 120) =>
    String(value ?? "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);

  const safePath = () => location.pathname || "/";
  const hasValidGtm = () => /^GTM-[A-Z0-9]+$/i.test(clean(config.gtmContainerId, 32));
  const hasValidGa4 = () => /^G-[A-Z0-9]+$/i.test(clean(config.ga4MeasurementId, 32));
  const configured = () => hasValidGtm() || hasValidGa4();

  function storedConsent() {
    if (!config.consentRequired) return true;
    try { return localStorage.getItem(consentKey) === "granted"; }
    catch { return false; }
  }

  let consentGranted = storedConsent();
  window.dataLayer = window.dataLayer || [];

  function sendPayload(payload) {
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

  function dataLayerPush(event, params = {}) {
    const payload = {
      event,
      hunt_environment: clean(config.environment || "production", 24),
      page_path: safePath(),
      ...params
    };
    if (!consentGranted || !configured()) {
      queue.push(payload);
      return false;
    }
    return sendPayload(payload);
  }

  function loadGtm() {
    const id = clean(config.gtmContainerId, 32);
    if (!hasValidGtm() || document.querySelector("script[data-hunt-gtm]")) return;
    window.dataLayer.push({"gtm.start": Date.now(), event: "gtm.js"});
    const script = document.createElement("script");
    script.async = true;
    script.dataset.huntGtm = "1";
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function loadDirectGa4() {
    const id = clean(config.ga4MeasurementId, 32);
    if (hasValidGtm() || !hasValidGa4() || document.querySelector("script[data-hunt-ga4]")) return;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.huntGa4 = "1";
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, {send_page_view: false});
  }

  function flush() {
    if (!consentGranted || !configured()) return;
    while (queue.length) sendPayload(queue.shift());
  }

  function pageView() {
    if (pageTracked) return;
    pageTracked = true;
    dataLayerPush("page_view", {
      page_title: clean(document.title, 160),
      page_location_path: safePath()
    });
  }

  function init() {
    if (initialized || !consentGranted || !configured()) return false;
    initialized = true;
    loadGtm();
    loadDirectGa4();
    pageView();
    flush();
    return true;
  }

  function dismissConsentBanner() {
    document.getElementById("hunt-analytics-consent")?.remove();
  }

  function setConsent(granted) {
    consentGranted = granted === true;
    try {
      localStorage.setItem(consentKey, consentGranted ? "granted" : "denied");
    } catch {}
    dismissConsentBanner();
    if (!consentGranted) {
      queue.length = 0;
      window.dispatchEvent(new CustomEvent("hunt:analytics-consent", {detail:{granted:false}}));
      return false;
    }
    init();
    flush();
    window.dispatchEvent(new CustomEvent("hunt:analytics-consent", {detail:{granted:true}}));
    return true;
  }

  function renderConsentBanner() {
    if (!config.consentRequired || !configured()) return;
    try {
      const value = localStorage.getItem(consentKey);
      if (value === "granted" || value === "denied") return;
    } catch {}
    if (document.getElementById("hunt-analytics-consent")) return;

    const style = document.createElement("style");
    style.id = "hunt-analytics-consent-style";
    style.textContent = [
      "#hunt-analytics-consent{position:fixed;z-index:99999;left:50%;bottom:18px;transform:translateX(-50%);width:min(720px,calc(100% - 24px));background:rgba(6,18,32,.96);border:1px solid rgba(120,170,235,.35);box-shadow:0 18px 60px rgba(0,0,0,.38);backdrop-filter:blur(18px);border-radius:16px;padding:15px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;color:#eef6ff;font-family:inherit}",
      "#hunt-analytics-consent strong{display:block;font-size:.86rem;margin-bottom:4px}",
      "#hunt-analytics-consent p{margin:0;color:#aabed5;font-size:.68rem;line-height:1.45}",
      "#hunt-analytics-consent .hunt-consent-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}",
      "#hunt-analytics-consent button{border:1px solid rgba(120,170,235,.35);background:rgba(14,35,59,.92);color:#dbeaff;border-radius:10px;padding:9px 12px;font:inherit;font-size:.68rem;font-weight:800;cursor:pointer}",
      "#hunt-analytics-consent button[data-consent='accept']{background:#ecf6ff;color:#071424;border-color:#ecf6ff}",
      "@media(max-width:620px){#hunt-analytics-consent{grid-template-columns:1fr;bottom:10px}.hunt-consent-actions{justify-content:stretch!important}.hunt-consent-actions button{flex:1}}"
    ].join("");
    document.head.appendChild(style);

    const banner = document.createElement("aside");
    banner.id = "hunt-analytics-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Analytics preference");
    banner.innerHTML =
      '<div><strong>Help HUNT DEAL improve</strong><p>Allow privacy-conscious analytics so we can understand which products, countries and channels perform best. No payment data is collected here.</p></div>' +
      '<div class="hunt-consent-actions"><button type="button" data-consent="decline">Decline</button><button type="button" data-consent="accept">Allow analytics</button></div>';
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
    consentGranted: () => consentGranted,
    setConsent,
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
      learningSignal("hunt_view_item", {
        provider: product?.provider || "",
        item_id: product?.item_id || product?.id || "",
        category: window.HuntCore?.inferCategory?.(product) || product?.category || "",
        retail_price: learningRetail(product, variant) ?? undefined
      });
      return dataLayerPush("view_item", {
        items: [item(product, variant, 1)],
        hunt_price_stage: learningRetail(product, variant) ? "verified_retail" : "source_intelligence_not_retail"
      });
    },
    addToCart(row, product = {}) {
      learningSignal("hunt_add_to_cart", {
        provider: row?.provider || product?.provider || "",
        item_id: row?.item_id || product?.item_id || "",
        category: row?.category || window.HuntCore?.inferCategory?.(product) || product?.category || "",
        quantity: row?.qty || 1,
        retail_price: Number.isFinite(Number(row?.retail_price_amount)) ? Number(row.retail_price_amount) : undefined
      });
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
      const rows = Array.isArray(cart) ? cart : [];
      const items = rows.map(cartItem).filter(x => x.item_id);
      if (!items.length) return false;
      rows.forEach(row => learningSignal("hunt_begin_checkout", {
        provider: row?.provider || "",
        item_id: row?.item_id || "",
        category: row?.category || "",
        quantity: row?.qty || 1,
        retail_price: Number.isFinite(Number(row?.retail_price_amount)) ? Number(row.retail_price_amount) : undefined,
        placement: clean(destination, 60)
      }));
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
    recommendationImpression({placement="",items=[]}={}) {
      const normalized=Array.isArray(items)?items.slice(0,20).map(x=>item(x,null,1)).filter(x=>x.item_id):[];
      if(!normalized.length)return false;
      return dataLayerPush("view_promotion", {
        creative_name: clean(placement||"recommendation",80),
        items: normalized
      });
    },
    relatedProductClick(product={}, placement="endless_discovery") {
      learningSignal("hunt_select_item", {
        provider: product?.provider || "",
        item_id: product?.item_id || "",
        category: window.HuntCore?.inferCategory?.(product) || product?.category || "",
        placement
      });
      return dataLayerPush("select_item", {
        item_list_id: clean(placement,80),
        item_list_name: clean(placement,80),
        items:[item(product,null,1)]
      });
    },
    surveyComplete({categories=[],priceBand="any"}={}) {
      (Array.isArray(categories) ? categories : []).slice(0,20).forEach(category => learningSignal("hunt_survey_complete", {
        category,
        placement: clean(priceBand,40)
      }));
      return dataLayerPush("shopping_survey_complete", {
        selected_category_count: Array.isArray(categories)?categories.length:0,
        price_band: clean(priceBand,40)
      });
    },
    shoppingAction({provider="",itemId="",action="",active=false,category=""}={}) {
      if (!["like","save"].includes(clean(action, 20))) return false;
      if (active === true) learningSignal(action === "save" ? "hunt_save" : "hunt_like", {
        provider, item_id: itemId, category
      });
      return dataLayerPush("shopping_preference", {
        item_id: clean(itemId, 100),
        item_brand: clean(provider, 80),
        item_category: clean(category, 60),
        preference_action: clean(action, 20),
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
    init();
    renderConsentBanner();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  } else {
    boot();
  }
})();
