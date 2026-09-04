import "server-only";

import OpenAI from "openai";

/**
 * The model behind the companion.
 *
 * A mini tier by default. The companion's work is asking short, pointed
 * questions about text it has been handed, which is not what the large models
 * are for — and it runs dozens of times per piece, so the tier is the single
 * biggest lever on what this costs. Set OPENAI_MODEL to pin a different one;
 * `gpt-5.4` is the step up if answers start feeling shallow.
 */
export const COMPANION_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

/**
 * Reasoning effort. `low` is the cheaper setting and the questions came back
 * shallow on it, which is the one thing this feature cannot afford to be — a
 * companion that asks the obvious question is worse than no companion. Both
 * calls sit at `medium`; the ceilings and the folded context below are where
 * the saving comes from instead.
 */
export const COMPANION_EFFORT = "medium" as const;
export const COMPOSE_EFFORT = "medium" as const;

/**
 * Output ceilings.
 *
 * These cover the model's reasoning as well as its visible answer, which is
 * what made the first set of numbers wrong: a ceiling sized for the answer got
 * spent on thinking, and the call came back with nothing in it. They are sized
 * for both now. A ceiling that truncates is not a saving — the writer presses
 * the button again and pays twice.
 */
export const CHAT_MAX_TOKENS = 3_000;
export const COMPOSE_MAX_TOKENS = 16_000;
export const FILING_MAX_TOKENS = 4_000;

/** Thrown when the key is missing, so the route can say so in plain words. */
export class MissingCompanionKey extends Error {
  constructor() {
    super(
      "The companion isn't configured yet — OPENAI_API_KEY is missing from the server's environment.",
    );
    this.name = "MissingCompanionKey";
  }
}

/**
 * One client for the process.
 *
 * Unlike the Appwrite clients, this one carries no per-reader state — the key
 * is the server's, not the writer's — so sharing it across requests is safe
 * and saves rebuilding the HTTP agent on every message.
 */
let client: OpenAI | null = null;

export function companionClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new MissingCompanionKey();

  client ??= new OpenAI({ apiKey });
  return client;
}

export function companionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
