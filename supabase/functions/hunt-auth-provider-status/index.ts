import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !anonKey) return json({ error: "AUTH_CONFIG_UNAVAILABLE" }, 503);

  let external: Record<string, boolean> = {};
  try {
    const settings = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: "no-store",
    });
    if (settings.ok) {
      const body = await settings.json();
      external = body?.external || {};
    }
  } catch {
    // Keep conservative false defaults.
  }

  const custom: Record<string, boolean> = { tiktok: false, instagram: false };
  let customStatus = "not_configured";
  if (serviceRoleKey) {
    try {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await admin.auth.admin.customProviders.listProviders();
      if (error) throw error;
      const raw = Array.isArray(data) ? data : (data?.providers || []);
      const ids = new Set(raw.filter((p: any) => p?.enabled !== false).map((p: any) => String(p?.identifier || "")));
      custom.tiktok = ids.has("custom:tiktok");
      custom.instagram = ids.has("custom:instagram");
      customStatus = "verified";
    } catch {
      customStatus = "unavailable";
    }
  }

  return json({
    external: {
      email: external.email === true,
      google: external.google === true,
      github: external.github === true,
      apple: external.apple === true,
      facebook: external.facebook === true,
      azure: external.azure === true,
    },
    custom,
    custom_status: customStatus,
    checked_at: new Date().toISOString(),
  });
});
