import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { catalogSafetyTitle } from "../_shared/hunt-catalog-warehouse.ts";

const env = (name: string) => (Deno.env.get(name) || "").trim();
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}

function secretKey() {
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}");
    return clean(keys?.default) || env("SUPABASE_SERVICE_ROLE_KEY");
  } catch {
    return env("SUPABASE_SERVICE_ROLE_KEY");
  }
}

function authorized(req: Request) {
  const expected = env("HUNT_PROMOTION_RADAR_INTERNAL_TOKEN");
  const supplied = clean(req.headers.get("x-hunt-radar-token"));
  return Boolean(expected) && supplied === expected;
}
function shopifyConfig() {
  const rawShop = env("SHOPIFY_ADMIN_SHOP").toLowerCase()
    .replace(/^https?:\/\//,"")
    .replace(/\/$/,"");
  const shop = /^[a-z0-9][a-z0-9.-]*\.myshopify\.com$/.test(rawShop) ? rawShop : "";
  const versionRaw = env("SHOPIFY_ADMIN_API_VERSION") || "2026-07";
  const version = /^\d{4}-\d{2}$/.test(versionRaw) ? versionRaw : "2026-07";
  return {
    shop,
    version,
    token: env("SHOPIFY_ADMIN_ACCESS_TOKEN")
  };
}

function awinConfig() {
  const publisherId = env("AWIN_PUBLISHER_ID");
  return {
    publisherId: /^\d+$/.test(publisherId) ? publisherId : "",
    token: env("AWIN_ACCESS_TOKEN")
  };
}

function providerStatus() {
  const shopify = shopifyConfig();
  const awin = awinConfig();
  return {
    shopify: {
      status: shopify.shop && shopify.token ? "configured" : "credentials_required",
      shop_configured: Boolean(shopify.shop),
      token_present: Boolean(shopify.token),
      api_version: shopify.version,
      source: "Shopify Admin GraphQL discountNodes"
    },
    awin: {
      status: awin.publisherId && awin.token ? "configured" : "credentials_required",
      publisher_id_configured: Boolean(awin.publisherId),
      token_present: Boolean(awin.token),
      source: "Awin Publisher Offers API"
    }
  };
}

function discountType(typename: string) {
  const t = typename.toLowerCase();
  if (t.includes("bxgy")) return "buy_x_get_y";
  if (t.includes("free") && t.includes("shipping")) return "free_shipping";
  return "combined";
}
const SHOPIFY_DISCOUNTS_QUERY = `
query HuntPromotionRadar {
  discountNodes(first: 100, query: "status:active") {
    nodes {
      id
      discount {
        __typename
        ... on DiscountAutomaticBxgy {
          title
          summary
          status
          startsAt
          endsAt
          combinesWith { orderDiscounts productDiscounts shippingDiscounts }
          customerBuys {
            items { __typename }
            value {
              __typename
              ... on DiscountQuantity { quantity }
              ... on DiscountPurchaseAmount { amount }
            }
          }
          customerGets {
            items { __typename }
            value {
              __typename
              ... on DiscountOnQuantity {
                quantity { quantity }
                effect {
                  __typename
                  ... on DiscountPercentage { percentage }
                }
              }
            }
          }
        }
        ... on DiscountCodeBxgy {
          title
          summary
          status
          startsAt
          endsAt
          codes(first: 1) { nodes { code } }
          combinesWith { orderDiscounts productDiscounts shippingDiscounts }
          customerBuys {
            items { __typename }
            value {
              __typename
              ... on DiscountQuantity { quantity }
              ... on DiscountPurchaseAmount { amount }
            }
          }
          customerGets {
            items { __typename }
            value {
              __typename
              ... on DiscountOnQuantity {
                quantity { quantity }
                effect {
                  __typename
                  ... on DiscountPercentage { percentage }
                }
              }
            }
          }
        }
        ... on DiscountAutomaticBasic {
          title summary status startsAt endsAt
          combinesWith { orderDiscounts productDiscounts shippingDiscounts }
        }
        ... on DiscountCodeBasic {
          title summary status startsAt endsAt
          combinesWith { orderDiscounts productDiscounts shippingDiscounts }
        }
      }
    }
  }
}`;

async function scanShopify() {
  const cfg = shopifyConfig();
  if (!cfg.shop || !cfg.token) throw new Error("Shopify promotion radar credentials are not configured.");
  const endpoint = `https://${cfg.shop}/admin/api/${cfg.version}/graphql.json`;
  const response = await fetch(endpoint, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "X-Shopify-Access-Token":cfg.token
    },
    body:JSON.stringify({query:SHOPIFY_DISCOUNTS_QUERY})
  });
  if (!response.ok) throw new Error("Shopify discounts returned HTTP " + response.status);
  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length) {
    throw new Error("Shopify discounts GraphQL returned an error.");
  }
  const nodes = Array.isArray(payload?.data?.discountNodes?.nodes)
    ? payload.data.discountNodes.nodes : [];
  const now = new Date().toISOString();
  return nodes.map((node:any) => {
    const discount = node?.discount || {};
    const title = clean(discount?.title);
    const typename = clean(discount?.__typename);
    if (!title || !catalogSafetyTitle(title)) return null;
    const buysValue = discount?.customerBuys?.value || {};
    const getsValue = discount?.customerGets?.value || {};
    const effect = getsValue?.effect || {};
    const buyQtyRaw = Number(buysValue?.quantity);
    const getQtyRaw = Number(getsValue?.quantity?.quantity);
    const percentRaw = Number(effect?.percentage);
    const rewardPercent = Number.isFinite(percentRaw) && percentRaw > 0
      ? (percentRaw <= 1 ? percentRaw * 100 : percentRaw) : null;
    const minimumAmountRaw = Number(buysValue?.amount);
    const buyQty = Number.isFinite(buyQtyRaw) && buyQtyRaw > 0 ? Math.trunc(buyQtyRaw) : null;
    const getQty = Number.isFinite(getQtyRaw) && getQtyRaw > 0 ? Math.trunc(getQtyRaw) : null;
    const dealType = discountType(typename);
    return {
      source_provider:"Shopify",
      source_kind:"shopify_admin_graphql",
      source_offer_id:clean(node?.id),
      title,
      deal_type:dealType === "buy_x_get_y" && buyQty === 1 && getQty === 1 && rewardPercent === 100 ? "bogo" : dealType,
      buy_quantity:buyQty,
      get_quantity:getQty,
      reward_percent_off:rewardPercent,
      reward_amount_off:null,
      minimum_purchase_amount:Number.isFinite(minimumAmountRaw) && minimumAmountRaw > 0 ? minimumAmountRaw : null,
      coupon_code:clean(discount?.codes?.nodes?.[0]?.code) || null,
      free_shipping:false,
      terms_text:clean(discount?.summary) || null,
      source_url:`https://${cfg.shop}`,
      market_scope:{shop:cfg.shop},
      evidence:{
        shopify_gid:clean(node?.id),
        shopify_type:typename,
        shopify_status:clean(discount?.status),
        shopify_summary:clean(discount?.summary),
        api_version:cfg.version,
        customer_buys_type:clean(discount?.customerBuys?.items?.__typename) || null,
        customer_gets_type:clean(discount?.customerGets?.items?.__typename) || null,
        combines_with:discount?.combinesWith || null,
        details_complete:Boolean((buyQty || minimumAmountRaw > 0) && (getQty || rewardPercent)),
        checkout_test_required:true
      },
      valid_from:clean(discount?.startsAt) || null,
      valid_until:clean(discount?.endsAt) || null,
      observed_at:now,
      checkout_verified:false,
      verification_status:"pending_review",
      updated_at:now
    };
  }).filter((row:any)=>row?.source_offer_id);
}

function firstHttps(...values: unknown[]) {
  for (const value of values) {
    const candidate = clean(value);
    if (candidate.startsWith("https://")) return candidate;
  }
  return "";
}

async function scanAwin() {
  const cfg = awinConfig();
  if (!cfg.publisherId || !cfg.token) throw new Error("Awin promotion radar credentials are not configured.");
  const endpoint = new URL(`https://api.awin.com/publisher/${cfg.publisherId}/promotions`);
  endpoint.searchParams.set("accessToken",cfg.token);
  const response = await fetch(endpoint,{
    method:"POST",
    headers:{
      "Authorization":"Bearer " + cfg.token,
      "Content-Type":"application/json",
      "Accept":"application/json"
    },
    body:JSON.stringify({
      filters:{status:"active",type:"all"},
      pagination:{page:1,pageSize:200}
    })
  });
  if (!response.ok) throw new Error("Awin Offers API returned HTTP " + response.status);
  const payload = await response.json();
  const offers = Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.offers) ? payload.offers
    : Array.isArray(payload?.promotions) ? payload.promotions
    : [];
  const now = new Date().toISOString();
  return offers.map((offer:any) => {
    const title = clean(offer?.title);
    const offerId = clean(offer?.promotionId ?? offer?.id);
    const sourceUrl = firstHttps(offer?.url,offer?.urlTracking);
    if (!title || !offerId || !sourceUrl || !catalogSafetyTitle(title)) return null;
    const regions = offer?.regions || {};
    const list = Array.isArray(regions?.list)
      ? regions.list.map((row:any)=>clean(row?.countryCode)).filter(Boolean).slice(0,120)
      : [];
    const voucher = offer?.voucher || {};
    return {
      source_provider:"Awin",
      source_kind:"awin_offers_api",
      source_offer_id:offerId,
      title,
      deal_type:clean(offer?.type).toLowerCase() === "voucher" ? "coupon" : "combined",
      buy_quantity:null,
      get_quantity:null,
      reward_percent_off:null,
      reward_amount_off:null,
      minimum_purchase_amount:null,
      coupon_code:clean(voucher?.code) || null,
      free_shipping:false,
      terms_text:clean(offer?.terms) || clean(offer?.description) || null,
      source_url:sourceUrl,
      market_scope:{all:regions?.all === true,countries:list},
      evidence:{
        advertiser_id:offer?.advertiser?.id ?? null,
        advertiser_name:clean(offer?.advertiser?.name) || null,
        advertiser_joined:offer?.advertiser?.joined === true,
        offer_type:clean(offer?.type),
        description:clean(offer?.description),
        voucher_exclusive:voucher?.exclusive === true,
        voucher_attributable:voucher?.attributable ?? null,
        details_complete:false,
        checkout_test_required:true
      },
      valid_from:clean(offer?.startDate) || null,
      valid_until:clean(offer?.endDate) || null,
      observed_at:now,
      checkout_verified:false,
      verification_status:"pending_review",
      updated_at:now
    };
  }).filter((row:any)=>row?.source_offer_id);
}

async function upsertObservations(rows: Record<string,unknown>[]) {
  const key = secretKey();
  const url = env("SUPABASE_URL");
  if (!key || !url) throw new Error("Supabase secret environment is unavailable.");
  const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let written = 0;
  for (let i=0;i<rows.length;i+=200) {
    const batch = rows.slice(i,i+200);
    const {error} = await client.from("hunt_promotion_observations")
      .upsert(batch,{onConflict:"source_provider,source_offer_id",ignoreDuplicates:false});
    if (error) throw new Error(error.message);
    written += batch.length;
  }
  return written;
}
Deno.serve(async(req: Request) => {
  if (req.method !== "POST") return json({error:"POST required"},405);
  if (!authorized(req)) return json({error:"unauthorized"},401);

  let body:any = {};
  try { body = await req.json(); } catch {}

  if (body?.action === "status") {
    return json({ok:true,providers:providerStatus()});
  }

  const provider = clean(body?.provider).toLowerCase();
  if (body?.action !== "scan" || !["shopify","awin"].includes(provider)) {
    return json({error:"supported action: scan, provider: shopify | awin"},400);
  }

  try {
    const observations = provider === "awin" ? await scanAwin() : await scanShopify();
    const providerName = provider === "awin" ? "Awin" : "Shopify";
    const dryRun = body?.dry_run !== false;
    if (dryRun) {
      return json({
        ok:true,
        dry_run:true,
        provider:providerName,
        observation_count:observations.length,
        verification_state:"pending_review",
        sample:observations.slice(0,5)
      });
    }
    const written = await upsertObservations(observations as Record<string,unknown>[]);
    return json({ok:true,dry_run:false,provider:providerName,written});
  } catch (error) {
    return json({error:error instanceof Error ? error.message : "promotion radar scan failed"},502);
  }
});
