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
  const sessionKey = "hunt_session_id_v1";
  const missionKey = "hunt_shopping_mission_v1";
  function currentMission() {
    try {
      const value=clean(sessionStorage.getItem(missionKey)||"none",20).toLowerCase();
      return ["gift","outfit","replace","replenish","compare","trip","event","setup","budget"].includes(value)?value:"none";
    } catch { return "none"; }
  }
  function sessionId() {
    try {
      let value = sessionStorage.getItem(sessionKey);
      if (!value) {
        value = "hunt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
        sessionStorage.setItem(sessionKey, value);
      }
      return clean(value, 80);
    } catch {
      return "hunt_ephemeral_" + Date.now().toString(36);
    }
  }

  function firstPartySignal(event, params = {}) {
    if (!consentGranted) return false;
    const map = {
      page_view:"hunt_page_view",
      view_item_list:"hunt_view_list",
      search:"hunt_search",
      view_item:"hunt_view_item",
      select_item:"hunt_select_item",
      add_to_cart:"hunt_add_to_cart",
      begin_checkout:"hunt_begin_checkout",
      checkout_market_selected:"hunt_checkout_market"
    };
    let eventType = map[event] || "";
    if (event === "shopping_preference") {
      eventType = params.preference_action === "like" ? "hunt_like" :
        params.preference_action === "save" ? "hunt_save" : "";
    }
    if (!eventType) return false;
    const firstItem = Array.isArray(params.items) ? (params.items[0] || {}) : {};
    const payload = {
      event_type: eventType,
      session_id: sessionId(),
      page_path: safePath(),
      page_title: clean(document.title, 160),
      category: clean(params.item_list_id || params.item_category || firstItem.item_category || params.search_category || "", 60),
      provider: clean(firstItem.item_brand || params.item_brand || "", 80),
      item_id: clean(firstItem.item_id || params.item_id || "", 100),
      placement: clean(params.item_list_id || params.creative_name || "", 80),
      quantity: Number(firstItem.quantity || 1),
      result_count: Number(params.result_count || 0),
      search_category: clean(params.search_category || "", 60),
      destination_market: clean(params.destination_market || "", 60),
      preference_action: clean(params.preference_action || "", 20),
      mission_type: clean(params.mission_type || "", 20)
    };
    try {
      fetch((window.HuntCore?.functionsBase || "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1") + "/hunt-commerce-signal", {
        method:"POST",
        keepalive:true,
        headers:{
          apikey: window.HuntCore?.publishableKey || "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X",
          "Content-Type":"application/json"
        },
        body:JSON.stringify(payload)
      }).catch(()=>{});
      return true;
    } catch {
      return false;
    }
  }

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
      mission_type: clean(params.mission_type || currentMission(),20),
      ...params
    };
    if (!consentGranted) {
      queue.push(payload);
      return false;
    }
    const firstPartySent = firstPartySignal(event, {...params, mission_type:payload.mission_type});
    if (!configured()) return firstPartySent;
    return sendPayload(payload) || firstPartySent;
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
    if (!consentGranted) return;
    while (queue.length) {
      const payload = queue.shift();
      const {event, hunt_environment, page_path, ...params} = payload;
      firstPartySignal(event, params);
      if (configured()) sendPayload(payload);
    }
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
    if (initialized || !consentGranted) return false;
    initialized = true;
    if (configured()) {
      loadGtm();
      loadDirectGa4();
    }
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
    if (!config.consentRequired) return;
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
      '<div><strong>Help HUNT improve</strong><p>Allow privacy-conscious analytics so we can understand which products, countries and channels perform best. No payment data is collected here.</p></div>' +
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

  function experience(eventType, metadata={}) {
    if(!consentGranted)return false;
    const type=clean("hunt_"+String(eventType||"experience").replace(/[^a-z0-9_]+/gi,"_").toLowerCase(),80);
    const safeMeta={};
    for(const [k,v] of Object.entries(metadata||{}).slice(0,30)){
      const key=clean(k,50);
      if(!key)continue;
      if(Array.isArray(v))safeMeta[key]=v.slice(0,12).map(x=>clean(x,80));
      else if(typeof v==="boolean"||typeof v==="number")safeMeta[key]=v;
      else safeMeta[key]=clean(v,160);
    }
    safeMeta.page_path=safePath();
    try{
      fetch("https://zszlnahjqmwozwubetkm.supabase.co/rest/v1/analytics_events",{
        method:"POST",
        keepalive:true,
        headers:{
          apikey:window.HuntCore?.publishableKey||"sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X",
          "Content-Type":"application/json",
          Prefer:"return=minimal"
        },
        body:JSON.stringify({event_type:type,session_id:sessionId(),metadata:safeMeta})
      }).catch(()=>{});
      return true;
    }catch{return false}
  }

  const api = {
    configured,
    experience,
    consentGranted: () => consentGranted,
    currentMission,
    setConsent,
    pageView,
    category(category, resultCount = null) {
      return dataLayerPush("view_item_list", {
        item_list_id: clean(category, 60),
        item_list_name: clean(category, 60),
        result_count: Number.isFinite(Number(resultCount)) ? Number(resultCount) : undefined
      });
    },
    search({category = "", resultCount = 0, missionType = "none"} = {}) {
      return dataLayerPush("search", {
        search_category: clean(category, 60),
        mission_type: clean(missionType, 20),
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
    recommendationImpression({placement="",items=[]}={}) {
      const normalized=Array.isArray(items)?items.slice(0,20).map(x=>item(x,null,1)).filter(x=>x.item_id):[];
      if(!normalized.length)return false;
      return dataLayerPush("view_promotion", {
        creative_name: clean(placement||"recommendation",80),
        items: normalized
      });
    },
    relatedProductClick(product={}, placement="endless_discovery") {
      return dataLayerPush("select_item", {
        item_list_id: clean(placement,80),
        item_list_name: clean(placement,80),
        items:[item(product,null,1)]
      });
    },
    shoppingAction({provider="",itemId="",action="",active=false,category=""}={}) {
      if (!["like","save"].includes(clean(action, 20))) return false;
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
