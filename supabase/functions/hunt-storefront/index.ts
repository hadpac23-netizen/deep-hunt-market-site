const huntDbPoolerUrl = (Deno.env.get("HUNT_DB_POOLER_URL") || "").trim();

// Supabase reserves the SUPABASE_ prefix for user-managed Edge Function secrets.
// Map the allowed HUNT_DB_POOLER_URL secret to the legacy runtime variable before
// loading the existing storefront implementation. This remains branch-only until
// an explicit Owner Gate permits deployment.
if (huntDbPoolerUrl && !(Deno.env.get("SUPABASE_DB_POOLER_URL") || "").trim()) {
  Deno.env.set("SUPABASE_DB_POOLER_URL", huntDbPoolerUrl);
}

await import("./runtime.ts");
