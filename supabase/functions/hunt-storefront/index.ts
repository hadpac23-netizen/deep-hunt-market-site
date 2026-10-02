// Storefront runtime uses the Supabase client/RPC path; runtime.ts has no raw Postgres pooler dependency.
await import("./runtime.ts");
