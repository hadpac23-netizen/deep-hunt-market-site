(() => {
  const bool = value => value === true;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const hasText = value => String(value ?? "").trim().length > 0;
  const hasImage = value => /^https:\/\//i.test(String(value || ""));

  function score(product = {}, context = {}) {
    const parts = {};
    parts.identity = [
      hasText(product.provider),
      hasText(product.item_id),
      hasText(product.title),
      hasImage(product.image_url)
    ].filter(Boolean).length * 5;

    parts.availability = bool(product.availability_verified) ? 15 : 0;
    parts.shipping = bool(product.shipping_verified) && hasText(product.shipping_country) ? 15 : 0;
    parts.media = bool(product.media_rights_verified) ? 10 : 0;
    parts.returns = bool(product.returns_policy_verified) ? 10 : 0;

    const variantCount = number(product.variant_count) ?? (Array.isArray(product.variants) ? product.variants.length : 0);
    parts.variants = variantCount >= 3 ? 5 : variantCount > 0 ? 3 : 0;

    const sourcePriceReady = number(product.price_amount) > 0 && /^[A-Z]{3}$/.test(String(product.currency || "").toUpperCase());
    const landedState = String(context.landed_price?.state || "");
    parts.economics = landedState === "RETAIL_READY" ? 15 : (sourcePriceReady ? 6 : 0);

    const countryState = String(context.country_state || product.country_availability?.state || "");
    parts.country_fit = countryState === "eligible" ? 10 : countryState === "check" ? 3 : 0;

    const total = Object.values(parts).reduce((sum,v)=>sum+v,0);
    const blockers = [];
    if (!bool(product.availability_verified)) blockers.push("availability");
    if (!bool(product.shipping_verified)) blockers.push("shipping");
    if (!bool(product.media_rights_verified)) blockers.push("media_rights");
    if (landedState !== "RETAIL_READY") blockers.push("retail_economics");
    if (countryState === "blocked") blockers.push("country_blocked");

    let band = "DISCOVERY";
    if (total >= 85 && blockers.length === 0) band = "HUNT_100_READY";
    else if (total >= 65 && !blockers.includes("country_blocked")) band = "STRONG_CANDIDATE";
    else if (total >= 45 && !blockers.includes("country_blocked")) band = "REVIEW";
    else if (blockers.includes("country_blocked")) band = "MARKET_BLOCKED";

    return {
      score:Math.max(0,Math.min(100,total)),
      band,
      parts,
      blockers:[...new Set(blockers)]
    };
  }

  function rank(rows = [], contextFor = () => ({})) {
    return rows.map(product => ({product,result:score(product,contextFor(product))}))
      .sort((a,b)=>b.result.score-a.result.score);
  }

  const api={score,rank};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(typeof window!=="undefined")window.HuntScore=api;
})();