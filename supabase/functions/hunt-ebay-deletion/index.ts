import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const token = Deno.env.get("EBAY_DELETION_VERIFICATION_TOKEN")?.trim() || "";
  const endpoint = Deno.env.get("EBAY_DELETION_ENDPOINT")?.trim() || "";

  if (req.method === "GET") {
    const challenge = url.searchParams.get("challenge_code")?.trim() || "";
    if (!challenge || !token || !endpoint) return json({ error: "challenge configuration missing" }, 400);
    return json({ challengeResponse: await sha256Hex(challenge + token + endpoint) });
  }

  if (req.method === "POST") {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }

  return json({ error: "method not allowed" }, 405);
});
