import type { Carousel, ModelId } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";

const CAROUSEL_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["hook", "content", "cta"] },
          kicker: { type: "string" },
          title: { type: "string" },
          lines: { type: "array", items: { type: "string" } },
        },
        required: ["type", "title", "lines"],
        additionalProperties: false,
      },
    },
  },
  required: ["topic", "slides"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You write Instagram carousel copy that earns saves and shares.

Rules for great carousels:
- Slide 1 is ALWAYS type "hook": one scroll-stopping line, max 9 words, no kicker needed. Curiosity gap or bold claim — never generic.
- Middle slides are type "content": each makes exactly ONE point. Title is the point (max 8 words). "lines" holds 1-3 short supporting lines (max 11 words each). Use a "kicker" like "01", "MYTH", "STEP 2" to give the deck rhythm.
- Last slide is ALWAYS type "cta": title tells the reader what to do next (save this, follow for more, try it today). 0-2 lines.
- Write punchy and specific. Concrete numbers, examples, and verbs beat adjectives. No hashtags, no emoji, no filler like "in today's world".
- Everything must be accurate. If the user's notes contain facts, use them; never invent statistics.`;

export interface GenerateOptions {
  apiKey: string;
  model: ModelId;
  topic: string;
  notes: string;
  audience: string;
  tone: string;
  slideCount: number;
}

export class ClaudeRefusalError extends Error {
  constructor() {
    super("The model declined this topic. Try rephrasing or a different subject.");
  }
}

export async function generateCarousel(opts: GenerateOptions): Promise<Carousel> {
  const userPrompt = [
    `Topic: ${opts.topic}`,
    opts.notes.trim() ? `My notes / raw material:\n${opts.notes.trim()}` : "",
    `Audience: ${opts.audience}`,
    `Tone: ${opts.tone}`,
    `Write exactly ${opts.slideCount} slides (1 hook + ${opts.slideCount - 2} content + 1 cta).`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const body: Record<string, unknown> = {
    model: opts.model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    output_config: {
      format: { type: "json_schema", schema: CAROUSEL_SCHEMA },
    },
    messages: [{ role: "user", content: userPrompt }],
  };

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": opts.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };

  // Fable 5 ships safety classifiers that can decline benign-adjacent requests;
  // opt into the server-side fallback so Opus 4.8 transparently rescues those.
  if (opts.model === "claude-fable-5") {
    headers["anthropic-beta"] = "server-side-fallback-2026-06-01";
    body.fallbacks = [{ model: "claude-opus-4-8" }];
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const msg = err?.error?.message ?? `API error (HTTP ${res.status})`;
    if (res.status === 401) throw new Error("Invalid API key. Check it in console.anthropic.com.");
    throw new Error(msg);
  }

  const data = await res.json();
  if (data.stop_reason === "refusal") throw new ClaudeRefusalError();

  const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
  if (!text) throw new Error("Empty response from the model.");

  const parsed = JSON.parse(text) as Carousel;
  if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    throw new Error("Model returned no slides — try again.");
  }
  return parsed;
}
