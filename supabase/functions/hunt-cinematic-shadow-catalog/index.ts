import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const PUBLIC_KEY = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
const ALLOWED = new Set([
  "https://raw.githack.com",
  "https://hadpac23-netizen.github.io",
  "https://deep-hunt-market.netlify.app",
  "http://127.0.0.1:8767",
  "http://localhost:8767",
  "http://127.0.0.1:18977",
  "http://localhost:18977"
]);

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const netlifyPreview = /^https:\/\/[a-z0-9-]+--deep-hunt-market\.netlify\.app$/i.test(origin);
  const allowed = ALLOWED.has(origin) || netlifyPreview;
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://raw.githack.com",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json"
  };
}

async function publicId(provider: string, itemId: string) {
  const bytes = new TextEncoder().encode(`${provider}:${itemId}:HUNT_SHADOW_V1`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest).map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function numberOrNull(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req: Request) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "GET required" }), { status: 405, headers });
  if ((req.headers.get("apikey") || "") !== PUBLIC_KEY) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers });
  }

  const db = Deno.env.get("SUPABASE_DB_URL");
  if (!db) return new Response(JSON.stringify({ error: "server config missing" }), { status: 500, headers });
  const sql = postgres(db, { prepare: false, max: 1, connect_timeout: 20, idle_timeout: 3, max_lifetime: 60 });

  try {
    const rows = await sql`
      select provider,item_id,title,image_url,verified_inventory,candidate_status,source_payload
      from public.hunt_shelf_candidates
      where production_effect=false
        and availability_verified=true
        and coalesce(verified_inventory,0)>0
        and coalesce(source_payload->'taxonomy_gate_v2'->>'status','')='REMAP'
        and coalesce(source_payload->'profit_gate_v2'->>'status','')='PROFIT_REVIEW'
        and coalesce(source_payload->>'catalog_safety_status','')='PASS'
        and coalesce(source_payload->>'image_technical_status','')='PASS'
        and coalesce((source_payload->>'latest_market5_all_pass')::boolean,false)=true
        and coalesce((source_payload->'profit_gate_v2'->>'target_retail_usd')::numeric,0)>0
        and coalesce((source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0)>0
        and coalesce((source_payload->'profit_gate_v2'->>'final_profit_verified')::boolean,false)=false
        and candidate_status in (
          'MARKET5_READY_STYLE_PHYSICAL_PENDING',
          'MARKET5_READY_STYLE_PASS_PHYSICAL_EVIDENCE_PENDING',
          'MARKET5_READY_STYLE_PASS_PHYSICAL_METADATA_VERIFIED'
        )
        and not (
          (source_payload->'taxonomy_gate_v2'->>'canonical_department'='gifts'
           and source_payload->'taxonomy_gate_v2'->>'canonical_shelf'='party')
          or
          (source_payload->'taxonomy_gate_v2'->>'canonical_department'='kids'
           and source_payload->'taxonomy_gate_v2'->>'canonical_shelf'='tableware')
        )
      order by
        source_payload->'taxonomy_gate_v2'->>'canonical_department',
        source_payload->'taxonomy_gate_v2'->>'canonical_shelf',
        coalesce((source_payload->'stylist_precheck'->>'score')::numeric,0) desc,
        coalesce((source_payload->'profit_gate_v2'->>'projected_product_contribution_usd')::numeric,0) desc,
        verified_inventory desc
      limit 2500
    `;

    const shelves: Record<string, any[]> = {};
    let total = 0;
    for (const row of rows) {
      const payload = row.source_payload || {};
      const gate = payload.taxonomy_gate_v2 || {};
      const profit = payload.profit_gate_v2 || {};
      const department = String(gate.canonical_department || "");
      const shelf = String(gate.canonical_shelf || "");
      const route = department && shelf ? `${department}/${shelf}` : "";
      if (!route || !String(row.image_url || "").startsWith("https://")) continue;

      const item = {
        department,
        category: shelf,
        taxonomy_gate_v2: "REMAP",
        provider: "HUNT",
        item_id: await publicId(String(row.provider || ""), String(row.item_id || "")),
        title: String(row.title || ""),
        image_url: String(row.image_url || ""),
        availability_verified: true,
        inventory_snapshot: Number(row.verified_inventory || 0),
        production_exposure: false,
        sell_state: "SHADOW_QA_PROFIT_REVIEW",
        image_technical_status: "PASS",
        market5_all_pass: true,
        candidate_status: String(row.candidate_status || ""),
        stylist_score: numberOrNull(payload.stylist_precheck?.score),
        profit_truth: {
          status: "PROFIT_REVIEW",
          final_profit_verified: false,
          target_retail_usd: numberOrNull(profit.target_retail_usd),
          projected_product_contribution_usd: numberOrNull(profit.projected_product_contribution_usd)
        },
        readiness: {
          metadata_verified: String(payload.physical_evidence_status || "") === "VERIFIED_METADATA",
          visual_status: String(payload.final_visual_status || "PENDING"),
          physical_quality_status: String(payload.physical_quality_status || "UNVERIFIED")
        }
      };
      (shelves[route] ||= []).push(item);
      total++;
    }

    return new Response(JSON.stringify({
      version: "HUNT-TAXONOMY-PROFIT-V2-PREVIEW-SUPPLEMENT",
      mode: "SHADOW_ONLY",
      production_effect: false,
      source: "HUNT_SHADOW_LIVE_CATALOG_V1",
      generated_at: new Date().toISOString(),
      total_products: total,
      route_count: Object.keys(shelves).length,
      shelves
    }), {
      headers: { ...headers, "Cache-Control": "public, max-age=30" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500, headers });
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
});