(() => {
  const MAX_VERIFY_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const TYPES = new Set([
    "percent_off","amount_off","buy_x_get_y","bogo","bundle",
    "tiered","coupon","free_shipping","free_gift","combined"
  ]);
  const num = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const text = value => String(value ?? "").trim();
  const validDate = value => {
    const t = Date.parse(text(value));
    return Number.isFinite(t) ? t : null;
  };
  function active(promo, now = Date.now()) {
    if (text(promo?.status).toLowerCase() !== "live") return false;
    const start = validDate(promo?.starts_at);
    const end = validDate(promo?.ends_at);
    if (start !== null && start > now) return false;
    if (end !== null && end < now) return false;
    return true;
  }
  function verified(promo, now = Date.now()) {
    const type = text(promo?.deal_type).toLowerCase();
    if (!TYPES.has(type) || !active(promo, now)) return false;
    if (promo?.checkout_verified !== true) return false;
    if (!text(promo?.source_url).startsWith("https://")) return false;
    const verifiedAt = validDate(promo?.verified_at);
    if (verifiedAt === null || now - verifiedAt > MAX_VERIFY_AGE_MS) return false;
    if (["buy_x_get_y","bogo"].includes(type)) {
      const buy = num(promo?.buy_quantity);
      const get = num(promo?.get_quantity);
      const pct = num(promo?.reward_percent_off);
      const amount = num(promo?.reward_amount_off);
      if (!(buy > 0 && get > 0)) return false;
      if (!(pct > 0 || amount > 0)) return false;
    }
    return true;
  }

  function label(promo) {
    const type = text(promo?.deal_type).toLowerCase();
    const buy = num(promo?.buy_quantity);
    const get = num(promo?.get_quantity);
    const pct = num(promo?.reward_percent_off);
    const amount = num(promo?.reward_amount_off);
    if ((type === "bogo" || type === "buy_x_get_y") && buy === 1 && get === 1 && pct === 100) return "1+1 FREE";
    if ((type === "bogo" || type === "buy_x_get_y") && buy && get && pct) return `BUY ${buy} GET ${get} · ${pct}% OFF`;
    if (type === "percent_off" && pct) return `${pct}% OFF`;
    if (type === "amount_off" && amount) return `${amount} OFF`;
    if (type === "free_shipping" || promo?.free_shipping === true) return "FREE SHIPPING";
    if (type === "free_gift") return "FREE GIFT";
    if (type === "bundle") return "BUNDLE DEAL";
    if (type === "tiered") return "VOLUME DEAL";
    if (type === "coupon") return "COUPON";
    return "VERIFIED DEAL";
  }

  function equivalentPercent(promo) {
    const type = text(promo?.deal_type).toLowerCase();
    const buy = num(promo?.buy_quantity);
    const get = num(promo?.get_quantity);
    const pct = num(promo?.reward_percent_off);
    const sameProduct = promo?.evidence?.same_product_reward === true;
    if (!sameProduct || !["buy_x_get_y","bogo"].includes(type) || !(buy > 0 && get > 0 && pct > 0)) return null;
    return (get * pct) / (buy + get);
  }
  function missionFit(promo, mission = {}) {
    const needed = num(mission?.quantity);
    const buy = num(promo?.buy_quantity) || 0;
    const get = num(promo?.get_quantity) || 0;
    const threshold = buy + get;
    const overbuyRequired = needed !== null && threshold > 0 && needed < threshold;
    return {
      overbuy_required: overbuyRequired,
      required_cart_quantity: threshold || null,
      useful_for_mission: !overbuyRequired
    };
  }

  window.HuntPromotionTruth = {
    active,
    verified,
    label,
    equivalentPercent,
    missionFit,
    supportedTypes: [...TYPES]
  };
})();
