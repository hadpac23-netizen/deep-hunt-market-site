declare const Netlify: {
  env: { get(name: string): string | undefined }
};

const WORLDS = new Set(["women","men","beauty","accessories","tech","home","sports","kids"]);
const DISCOVERY = new Set(["for-you","fresh","look","explore","verified","local"]);
const STYLES = new Set(["cinematic","editorial","quiet-luxury","electric"]);
const ENERGY = new Set(["calm","balanced","vivid"]);
const DENSITY = new Set(["airy","balanced","rich"]);
const INTENTS = new Set(["discover","style","compare","complete-look","explore"]);
const PHASES = new Set(["arrival","discover","deepen","intent"]);
const LANGS = new Set(["en","he","ar","es","fr","ja","zh"]);

const BLOCKED_COPY = /\b(last chance|hurry|act now|only \d+ left|selling fast|everyone is buying|trending now|best seller|lowest price|guaranteed|don'?t miss|fear of missing|fomo)\b/i;

function cleanText(value: unknown, max = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function num(value: unknown, min = 0, max = 100) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
}
function world(value: unknown, fallback = "women") {
  const v = cleanText(value, 30).toLowerCase();
  return WORLDS.has(v) ? v : fallback;
}
function safeCopy(value: unknown, max: number) {
  const text = cleanText(value, max);
  return BLOCKED_COPY.test(text) ? "" : text;
}
function sanitizeContext(raw: any) {
  const interests = Array.isArray(raw?.top_interests)
    ? raw.top_interests.map((x: unknown) => world(x, "")).filter(Boolean).slice(0, 6)
    : [];
  const signals: Record<string, number> = {};
  if (raw?.signal_strengths && typeof raw.signal_strengths === "object") {
    for (const [key, value] of Object.entries(raw.signal_strengths).slice(0, 12)) {
      const k = world(key, "");
      if (k) signals[k] = num(value);
    }
  }
  const catalog: Record<string, number> = {};
  if (raw?.catalog_summary && typeof raw.catalog_summary === "object") {
    for (const [key, value] of Object.entries(raw.catalog_summary).slice(0, 12)) {
      const k = world(key, "");
      if (k) catalog[k] = num(value, 0, 10000);
    }
  }
  const localeRaw = cleanText(raw?.locale, 8).toLowerCase();
  const marketRaw = cleanText(raw?.market, 4).toUpperCase();
  const phaseRaw = cleanText(raw?.session_phase, 20).toLowerCase();
  const page = cleanText(raw?.page, 28).toLowerCase().replace(/[^a-z0-9-]/g, "") || "home";

  return {
    page,
    locale: LANGS.has(localeRaw) ? localeRaw : "en",
    market: /^[A-Z]{2}$/.test(marketRaw) ? marketRaw : "US",
    top_interests: [...new Set(interests)],
    signal_strengths: signals,
    catalog_summary: catalog,
    session_phase: PHASES.has(phaseRaw) ? phaseRaw : "arrival",
    reduced_motion: raw?.reduced_motion === true,
  };
}
function validatePlan(raw: any, ctx: ReturnType<typeof sanitizeContext>) {
  const primary = world(raw?.primary_world, ctx.top_interests[0] || "women");
  const secondaryCandidate = world(raw?.secondary_world, ctx.top_interests[1] || "beauty");
  const secondary = secondaryCandidate === primary ? (primary === "beauty" ? "accessories" : "beauty") : secondaryCandidate;
  const discovery = cleanText(raw?.discovery_mode, 24).toLowerCase();
  const style = cleanText(raw?.style_mode, 24).toLowerCase();
  const energy = cleanText(raw?.motion_energy, 20).toLowerCase();
  const density = cleanText(raw?.density, 20).toLowerCase();
  const intent = cleanText(raw?.intent, 24).toLowerCase();
  const night = world(raw?.night_world, primary);

  const codes = Array.isArray(raw?.rationale_codes)
    ? [...new Set(raw.rationale_codes.map((x: unknown) => cleanText(x, 36).toLowerCase().replace(/[^a-z0-9_-]/g, "")).filter(Boolean))].slice(0, 6)
    : [];

  return {
    primary_world: primary,
    secondary_world: secondary,
    discovery_mode: DISCOVERY.has(discovery) ? discovery : "for-you",
    night_world: night,
    style_mode: STYLES.has(style) ? style : "cinematic",
    motion_energy: ctx.reduced_motion ? "calm" : (ENERGY.has(energy) ? energy : "balanced"),
    density: DENSITY.has(density) ? density : "balanced",
    intent: INTENTS.has(intent) ? intent : "discover",
    microcopy: {
      headline: safeCopy(raw?.microcopy?.headline, 72),
      subline: safeCopy(raw?.microcopy?.subline, 128),
      cta: safeCopy(raw?.microcopy?.cta, 34),
    },
    rationale_codes: codes,
  };
}

const SYSTEM = `You are BOOM F35 Experience Director inside HUNT, a premium global commerce interface.

Your job is PRESENTATION ONLY: choose a visual/editorial direction that improves clarity, relevance, voluntary exploration, aesthetic delight, and trust.

Use multidisciplinary expertise from human-computer interaction, information architecture, visual perception, cognitive psychology, behavioral economics, typography, motion design, retail merchandising, and decision science.

STRICT ETHICAL RULES:
- Never use pressure, fear, shame, social comparison, addiction loops, coercion, dark patterns, manipulative urgency, fake scarcity, fake popularity, or exploit vulnerabilities.
- Never claim a price, discount, stock, delivery, popularity, trend, rating, or product quality.
- Never infer sensitive traits or identity.
- Never recommend payment, supplier-order, legal, or owner-gated actions.
- Do not output product IDs or external links.
- Personalization may use only explicit interests and first-party shopping behavior summarized in the context.
- Keep the experience exciting through composition, pacing, relevance, surprise, and beauty—not pressure.

Return JSON ONLY using exactly this shape:
{
  "primary_world": "women|men|beauty|accessories|tech|home|sports|kids",
  "secondary_world": "women|men|beauty|accessories|tech|home|sports|kids",
  "discovery_mode": "for-you|fresh|look|explore|verified|local",
  "night_world": "women|men|beauty|accessories|tech|home|sports|kids",
  "style_mode": "cinematic|editorial|quiet-luxury|electric",
  "motion_energy": "calm|balanced|vivid",
  "density": "airy|balanced|rich",
  "intent": "discover|style|compare|complete-look|explore",
  "microcopy": {
    "headline": "short line in the requested locale, no claims",
    "subline": "short supporting line in the requested locale, no claims",
    "cta": "short voluntary exploration CTA in the requested locale"
  },
  "rationale_codes": ["explicit_interest","behavior_signal","session_phase","catalog_depth"]
}

Make the microcopy elegant and concise. Match the locale in context.locale.`;

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 16000) {
    return Response.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const ctx = sanitizeContext(body?.context || {});
  const base = Netlify.env.get("OPENAI_BASE_URL");
  const key = Netlify.env.get("OPENAI_API_KEY");

  if (!base || !key) {
    return Response.json({ ok: false, error: "ai_gateway_unavailable" }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);

  try {
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ context: ctx }) },
        ],
        max_completion_tokens: 850,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return Response.json({ ok: false, error: "ai_gateway_error", status: response.status }, { status: 502 });
    }

    const data = await response.json();
    const content = cleanText(data?.choices?.[0]?.message?.content, 5000)
      .replace(/^\`\`\`json\s*/i, "")
      .replace(/\s*\`\`\`$/, "");

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return Response.json({ ok: false, error: "invalid_ai_json" }, { status: 502 });
    }

    const plan = validatePlan(parsed, ctx);
    return Response.json({
      ok: true,
      source: "ai",
      model: "gpt-5.6-sol",
      plan,
    }, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error: any) {
    const code = error?.name === "AbortError" ? "ai_timeout" : "ai_request_failed";
    return Response.json({ ok: false, error: code }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
};

export const config = {
  path: "/api/boom-ai-director",
  method: "POST",
  rateLimit: {
    windowLimit: 6,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
