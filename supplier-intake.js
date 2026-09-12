(() => {
  const isFinitePositive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const text = value => String(value ?? "").trim();
  const normalizeId = value => text(value).toLowerCase().replace(/[^a-z0-9]+/g,"");

  function normalizeImage(value) {
    const v = text(value);
    return /^https:\/\//i.test(v) ? v : null;
  }

  function normalizeCurrency(value) {
    const v = text(value).toUpperCase();
    return /^[A-Z]{3}$/.test(v) ? v : null;
  }

  function normalizeCountries(value) {
    return [...new Set((Array.isArray(value) ? value : []).map(x=>text(x).toUpperCase()).filter(x=>/^[A-Z]{2}$/.test(x)))];
  }

  function normalizeVariant(raw = {}) {
    const price = isFinitePositive(raw.price_amount ?? raw.price)
      ? Number(raw.price_amount ?? raw.price) : null;
    return {
      variant_id: text(raw.variant_id ?? raw.id) || null,
      sku: text(raw.sku) || null,
      color: text(raw.color) || null,
      size: text(raw.size) || null,
      image_url: normalizeImage(raw.image_url ?? raw.image),
      price_amount: price,
      currency: price !== null ? normalizeCurrency(raw.currency) : null,
      stock_quantity: Number.isFinite(Number(raw.stock_quantity)) ? Number(raw.stock_quantity) : null,
      availability_verified: raw.availability_verified === true
    };
  }
  function normalizeProduct(raw = {}, providerConfig = {}) {
    const price = isFinitePositive(raw.price_amount ?? raw.price)
      ? Number(raw.price_amount ?? raw.price) : null;
    const variants = (Array.isArray(raw.variants) ? raw.variants : []).map(normalizeVariant);
    return {
      provider: text(raw.provider || providerConfig.name || providerConfig.id),
      provider_id: normalizeId(raw.provider_id || providerConfig.id || raw.provider),
      item_id: text(raw.item_id ?? raw.id ?? raw.product_id),
      sku: text(raw.sku) || null,
      title: text(raw.title ?? raw.name),
      description: text(raw.description) || null,
      category: text(raw.category) || null,
      gender: text(raw.gender) || null,
      brand: text(raw.brand) || null,
      image_url: normalizeImage(raw.image_url ?? raw.image),
      gallery: [...new Set((Array.isArray(raw.gallery) ? raw.gallery : []).map(normalizeImage).filter(Boolean))],
      price_amount: price,
      currency: price !== null ? normalizeCurrency(raw.currency) : null,
      price_basis: text(raw.price_basis || "SUPPLIER_BASE").toUpperCase(),
      availability_verified: raw.availability_verified === true,
      stock_quantity: Number.isFinite(Number(raw.stock_quantity)) ? Number(raw.stock_quantity) : null,
      shipping_countries: normalizeCountries(raw.shipping_countries),
      shipping_excluded_countries: normalizeCountries(raw.shipping_excluded_countries),
      shipping_verified: raw.shipping_verified === true,
      shipping_country: text(raw.shipping_country).toUpperCase() || null,
      shipping_amount: isFinitePositive(raw.shipping_amount) ? Number(raw.shipping_amount) : null,
      shipping_currency: isFinitePositive(raw.shipping_amount) ? normalizeCurrency(raw.shipping_currency || raw.currency) : null,
      variants,
      variant_count: variants.length,
      source_url: /^https:\/\//i.test(text(raw.source_url)) ? text(raw.source_url) : null,
      media_rights_verified: raw.media_rights_verified === true,
      returns_policy_verified: raw.returns_policy_verified === true,
      catalog_discovery: raw.catalog_discovery === true
    };
  }
  function validateProduct(product) {
    const errors = [];
    const warnings = [];
    if (!text(product?.provider)) errors.push("provider_missing");
    if (!text(product?.item_id)) errors.push("item_id_missing");
    if (!text(product?.title)) errors.push("title_missing");
    if (!normalizeImage(product?.image_url)) errors.push("image_missing_or_invalid");
    if (product?.price_amount !== null && !isFinitePositive(product?.price_amount)) errors.push("price_invalid");
    if (product?.price_amount !== null && !normalizeCurrency(product?.currency)) errors.push("currency_invalid");
    if (product?.availability_verified !== true) warnings.push("availability_unverified");
    if (product?.shipping_verified !== true) warnings.push("shipping_unverified");
    if (product?.media_rights_verified !== true) warnings.push("media_rights_unverified");
    if (product?.returns_policy_verified !== true) warnings.push("returns_unverified");
    if (!product?.variants?.length) warnings.push("variants_missing");
    return {ok:errors.length===0,errors,warnings};
  }

  function publishGate(product) {
    const result = validateProduct(product);
    const blockers = [...result.errors];
    if (!isFinitePositive(product?.price_amount)) blockers.push("price_missing");
    if (!normalizeCurrency(product?.currency)) blockers.push("currency_missing");
    if (product?.media_rights_verified !== true) blockers.push("media_rights_not_verified");
    return {
      state: blockers.length ? "HOLD" : "CATALOG_READY",
      blockers:[...new Set(blockers)],
      warnings:result.warnings
    };
  }
  function checkoutGate(product, countryCode) {
    const country = text(countryCode).toUpperCase();
    const blockers = [];
    if (!country || !/^[A-Z]{2}$/.test(country)) blockers.push("country_required");
    if (product?.availability_verified !== true) blockers.push("availability_unverified");
    if (product?.shipping_verified !== true || text(product?.shipping_country).toUpperCase() !== country) blockers.push("destination_shipping_unverified");
    if (!isFinitePositive(product?.price_amount) || !normalizeCurrency(product?.currency)) blockers.push("source_price_invalid");
    return {state:blockers.length ? "BLOCK" : "ALLOW",blockers};
  }

  function providerReadiness(config = {}) {
    const integration = config.integration || {};
    const unknown = Object.entries(integration).filter(([,v])=>v==="unknown").map(([k])=>k);
    const hardNo = Object.entries(integration).filter(([,v])=>v===false).map(([k])=>k);
    return {
      provider_id:config.id || null,
      free_to_start:config.free_to_start === true,
      country_rule_default:config.country_rules?.default || "check",
      unknown_capabilities:unknown,
      unavailable_capabilities:hardNo,
      state:config.state || "unknown"
    };
  }

  const api = {normalizeId,normalizeVariant,normalizeProduct,validateProduct,publishGate,checkoutGate,providerReadiness};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.HuntSupplierIntake = api;
})();