import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * The model behind the companion. Opus rather than a smaller model on purpose:
 * the job here is reading a half-finished argument and finding the question
 * that unlocks it, which is the part cheaper models are worst at.
 */
export const COMPANION_MODEL = "claude-opus-5";

/**
 * Effort is stepped down from the default `high` because this is a chat: the
 * writer is waiting with a cursor blinking at them, and the answers are a few
 * hundred words of questions rather than a long analysis. Raise it if the
 * companion starts feeling shallow.
 */
export const COMPANION_EFFORT = "medium" as const;

/** Thrown when the key is missing, so the route can say so in plain words. */
export class MissingCompanionKey extends Error {
  constructor() {
    super(
      "The companion isn't configured yet — ANTHROPIC_API_KEY is missing from the server's environment.",
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
let client: Anthropic | null = null;

export function companionClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingCompanionKey();

  client ??= new Anthropic({ apiKey });
  return client;
}

export function companionConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
