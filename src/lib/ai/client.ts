import "server-only";

import OpenAI from "openai";

/**
 * The model behind the companion.
 *
 * Overridable without a code change, because model names move faster than this
 * file will: set OPENAI_MODEL in the environment to pin a different one. The
 * default is a general-purpose flagship rather than a mini or nano tier — the
 * job here is reading a half-finished argument and finding the question that
 * unlocks it, which is the part small models are worst at.
 */
export const COMPANION_MODEL = process.env.OPENAI_MODEL || "gpt-5.4";

/**
 * Reasoning effort is stepped down from the default because this is a chat: the
 * writer is waiting with a cursor blinking at them, and the answers are a few
 * hundred words of questions rather than a long analysis. Raise it if the
 * companion starts feeling shallow.
 */
export const COMPANION_EFFORT = "medium" as const;

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
