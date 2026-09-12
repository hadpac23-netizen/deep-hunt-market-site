(() => {
  const H = window.HuntCore;
  if (!H) return;

  const COUNTRY_KEY = "hunt_ship_country_v1";
  const countryNames = {
    ZZ:"Choose country", IL:"Israel", US:"United States", CA:"Canada", MX:"Mexico", BR:"Brazil",
    GB:"United Kingdom", DE:"Germany", FR:"France", IT:"Italy", ES:"Spain", NL:"Netherlands",
    BE:"Belgium", AT:"Austria", CH:"Switzerland", PL:"Poland", PT:"Portugal", GR:"Greece", IE:"Ireland",
    SE:"Sweden", DK:"Denmark", NO:"Norway", FI:"Finland", TR:"Türkiye",
    CN:"China", JP:"Japan", KR:"South Korea", SG:"Singapore", IN:"India",
    AU:"Australia", NZ:"New Zealand", AE:"United Arab Emirates", SA:"Saudi Arabia"
  };

  const supplierRules = {
    "trendsi": {blocked:["IL"], default:"check", note:"Israel currently unsupported by supplier."},
    "hypersku": {allowed:["IL"], default:"check", note:"Israel route currently supported; other countries require current route check."},
    "fondmart": {default:"check"},
    "eprolo": {default:"check"},
    "cjdropshipping": {default:"check"},
    "cj": {default:"check"},
    "matterhorn": {default:"check"},
    "printful": {default:"check"},
    "gooten": {default:"check"},
    "brandsgateway": {default:"check"},
    "brandsdistribution": {default:"check"},
    "bdroppy": {default:"check"}
  };

  const normalizeProvider = value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g,"");
  const currentCountry = () => localStorage.getItem(COUNTRY_KEY) || inferCountry();

  function inferCountry() {
    const lang = String(navigator.language || "");
    const match = lang.match(/-([A-Z]{2})$/i);
    const code = match ? match[1].toUpperCase() : "ZZ";
    return countryNames[code] ? code : "ZZ";
  }
  function productCountries(product) {
    const allowed = Array.isArray(product?.shipping_countries) ? product.shipping_countries.map(x=>String(x).toUpperCase()) : [];
    const blocked = Array.isArray(product?.shipping_excluded_countries) ? product.shipping_excluded_countries.map(x=>String(x).toUpperCase()) : [];
    return {allowed,blocked};
  }

  function ruleFor(product) {
    const key = normalizeProvider(product?.provider);
    if (supplierRules[key]) return supplierRules[key];
    for (const [name,rule] of Object.entries(supplierRules)) {
      if (key.includes(name)) return rule;
    }
    return {default:"check"};
  }

  function status(product, country = currentCountry()) {
    const code = String(country || "ZZ").toUpperCase();
    if (code === "ZZ") return {state:"check",country:code,label:"Choose shipping country"};
    if (product?.shipping_verified === true && String(product?.shipping_country || "").toUpperCase() === code) {
      return {state:"eligible",country:code,label:"Destination shipping verified",source:"live_quote"};
    }
    const explicit = productCountries(product);
    if (explicit.blocked.includes(code)) return {state:"blocked",country:code,label:"Not available to this country",source:"product"};
    if (explicit.allowed.length && explicit.allowed.includes(code)) return {state:"eligible",country:code,label:"Ships to this country",source:"product"};
    if (explicit.allowed.length && !explicit.allowed.includes(code)) return {state:"blocked",country:code,label:"Not listed for this country",source:"product"};

    const rule = ruleFor(product);
    if ((rule.blocked || []).includes(code)) return {state:"blocked",country:code,label:"Not available to this country",source:"supplier",note:rule.note || ""};
    if ((rule.allowed || []).includes(code)) return {state:"eligible",country:code,label:"Route supported",source:"supplier",note:rule.note || ""};
    return {state:rule.default || "check",country:code,label:"Shipping check required",source:"supplier",note:rule.note || ""};
  }

  function tagProduct(product, country = currentCountry()) {
    if (!product || typeof product !== "object") return product;
    return {...product, country_availability:status(product,country), shipping_country:country};
  }
  function filterRows(rows, country) {
    if (!Array.isArray(rows)) return rows;
    return rows.map(x=>tagProduct(x,country)).filter(x=>x.country_availability?.state !== "blocked");
  }

  function apply(data, country = currentCountry()) {
    if (!data || typeof data !== "object") return data;
    const next = Array.isArray(data) ? filterRows(data,country) : {...data};
    if (Array.isArray(data)) return next;
    if (data.product) next.product = tagProduct(data.product,country);
    if (Array.isArray(data.results)) next.results = filterRows(data.results,country);
    if (next.shelves && typeof next.shelves === "object") {
      const shelves = {};
      Object.entries(next.shelves).forEach(([slug,rows]) => { shelves[slug] = filterRows(rows,country); });
      next.shelves = shelves;
      next.visible_product_count = new Set(Object.values(shelves).flat().map(x=>`${x?.provider||""}:${x?.item_id||""}`)).size;
    }
    next.shipping_country = country;
    return next;
  }

  const originalStorefront = H.storefront.bind(H);
  H.storefront = async params => apply(await originalStorefront({...params, country_code:params?.country_code || currentCountry()}));

  const originalSearch = H.search.bind(H);
  H.search = async (query,limit) => apply(await originalSearch(query,limit));

  const originalAddCart = H.addCart.bind(H);
  H.addCart = (product,variant,qty) => {
    const s = status(product);
    if (s.state === "blocked") throw new Error(`This product is not available for shipping to ${countryNames[s.country] || s.country}.`);
    if (s.state !== "eligible") throw new Error(`Shipping must be verified for ${countryNames[s.country] || s.country} before checkout.`);
    return originalAddCart(tagProduct(product),variant,qty);
  };
  function installSelector() {
    if (document.querySelector("#hd-ship-country")) return;
    const tools = document.querySelector(".hd-tools");
    if (!tools) return;
    const wrap = document.createElement("label");
    wrap.className = "hd-country-picker";
    wrap.innerHTML = `<span>Ship to</span><select id="hd-ship-country" aria-label="Shipping country">${Object.entries(countryNames).map(([code,name])=>`<option value="${code}">${name}</option>`).join("")}</select>`;
    const select = wrap.querySelector("select");
    select.value = currentCountry();
    select.addEventListener("change", () => {
      localStorage.setItem(COUNTRY_KEY,select.value);
      location.reload();
    });
    const lang = tools.querySelector(".hd-lang");
    if (lang) tools.insertBefore(wrap,lang); else tools.prepend(wrap);
  }

  function decorateProductAvailability(product) {
    const s = status(product);
    const shipping = document.querySelector("#hd-product-shipping");
    if (shipping && s.state !== "eligible") {
      shipping.textContent = s.state === "blocked"
        ? `Not available for shipping to ${countryNames[s.country] || s.country}.`
        : `Shipping to ${countryNames[s.country] || s.country} requires a live supplier quote.`;
    }
    const buttons = ["#hd-product-add","#hd-mobile-add"].map(q=>document.querySelector(q)).filter(Boolean);
    if (s.state === "blocked") {
      buttons.forEach(btn=>{ btn.disabled=true; btn.textContent="Not available in your country"; });
    }
  }

  function syncCheckoutCountry() {
    const select = document.querySelector("#hd-checkout-market");
    if (!select) return;
    const current = currentCountry();
    if (current !== "ZZ") select.value = current;
    select.addEventListener("change", () => {
      const code = String(select.value || "ZZ").toUpperCase();
      localStorage.setItem(COUNTRY_KEY,code);
    });
  }

  window.addEventListener("hunt:product-loaded", event => decorateProductAvailability(event.detail?.product));
  document.addEventListener("DOMContentLoaded", () => { installSelector(); syncCheckoutCountry(); });
  if (document.readyState !== "loading") { installSelector(); syncCheckoutCountry(); }

  window.HuntCountry = {
    key:COUNTRY_KEY,
    countries:countryNames,
    current:currentCountry,
    status,
    apply,
    tagProduct,
    set(code){ localStorage.setItem(COUNTRY_KEY,String(code||"ZZ").toUpperCase()); location.reload(); }
  };
})();