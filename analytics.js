(() => {
  "use strict";

  const config = window.HUNT_ANALYTICS_CONFIG || {};
  const consentKey = "hunt_analytics_consent_v1";
  const queue = [];
  let pageTracked = false;
  let initialized = false;

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
    window.dataLayer.push(payload);
    return true;
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
    while (queue.length) window.dataLayer.push(queue.shift());
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

  function setConsent(granted) {
    consentGranted = granted === true;
    try {
      localStorage.setItem(consentKey, consentGranted ? "granted" : "denied");
    } catch {}
    if (!consentGranted) {
      queue.length = 0;
      return false;
    }
    init();
    flush();
    window.dispatchEvent(new CustomEvent("hunt:analytics-consent", {detail:{granted:true}}));
    return true;
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();
