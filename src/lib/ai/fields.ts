import "server-only";

import type OpenAI from "openai";

import { isTopicSlug, MAX_TOPICS, TOPIC_SLUGS, TOPICS } from "@/lib/topics";

/**
 * How a piece gets filed and described.
 *
 * Shared by the write-up and the standalone tagger so the two cannot drift:
 * pressing "End the conversation" and pressing "Tag it from the piece" should
 * produce the same judgement about the same text.
 */

export type Filing = {
  /** Topic slugs from `lib/topics.ts`, most central first. */
  topics: string[];
  seoTitle: string;
  seoDescription: string;
  coverAlt: string;
};

const TOPIC_LINES = TOPICS.map((t) => `- ${t.slug}: ${t.blurb}`).join("\n");

export const FILING_INSTRUCTION = `topics — which of these the piece is actually about, most central first, at most ${MAX_TOPICS}:
${TOPIC_LINES}

Tag what the piece is about, not what it mentions. A piece that names a dead father once while arguing about pensions is about money, not grief. Two or three is usually right; one is fine when the piece has one subject. Never reach for a fourth to fill the quota, and never invent a slug outside the list.

seoTitle — how the piece should read in a search result. Under 60 characters, because Google cuts it there. Concrete over clever: what the piece is about, not a tease. Do not append the site name; the layout adds it.

seoDescription — the snippet under it. 140 to 155 characters, one or two sentences, and it must say what the reader gets rather than trailing off with "…and more". No clickbait, no question marks used as bait.

coverAlt — what the cover image shows, for a reader using a screen reader and for image search. Describe the picture, not the article: "A kitchen table at night, two mugs, nobody in the chairs." Under 125 characters, no "image of" or "photo of". If the piece has no cover image, return an empty string.`;

/** The four properties, for a strict schema. */
export const FILING_PROPERTIES = {
  topics: {
    type: "array",
    description: "Topic slugs, most central first.",
    items: { type: "string", enum: TOPIC_SLUGS },
  },
  seoTitle: { type: "string", description: "Under 60 characters." },
  seoDescription: { type: "string", description: "140-155 characters." },
  coverAlt: {
    type: "string",
    description: "Under 125 characters, or empty if there is no cover.",
  },
} as const;

export const FILING_KEYS = ["topics", "seoTitle", "seoDescription", "coverAlt"];

/** Says whether a cover exists, so the model knows what coverAlt is for. */
export function coverNote(hasCover: boolean): string {
  return hasCover
    ? `The piece has a cover image. You cannot see it — describe what the piece implies it shows, and keep it plain enough to be true of the picture the writer chose.`
    : `The piece has no cover image, so coverAlt must be an empty string.`;
}

/**
 * Narrows the four fields coming back.
 *
 * The enum constrains the model, but these values still cross a boundary and
 * end up in a column and a URL.
 */
export function readFiling(
  parsed: Record<string, unknown>,
  hasCover: boolean,
): Filing {
  const str = (key: string, max: number) =>
    typeof parsed[key] === "string"
      ? (parsed[key] as string).trim().slice(0, max)
      : "";

  return {
    topics: Array.isArray(parsed.topics)
      ? (parsed.topics as unknown[]).filter(isTopicSlug).slice(0, MAX_TOPICS)
      : [],
    seoTitle: str("seoTitle", 160),
    seoDescription: str("seoDescription", 300),
    coverAlt: hasCover ? str("coverAlt", 300) : "",
  };
}

/**
 * Pulls the JSON out of a completion, or says why there isn't any.
 *
 * `max_completion_tokens` covers the model's reasoning as well as its visible
 * answer, so a ceiling set for the answer alone is spent on thinking and the
 * content comes back empty with `finish_reason: "length"` — a silent failure
 * that reads to the writer as "it's broken". Named here so it cannot be
 * mistaken for anything else.
 */
export class RanOutOfRoom extends Error {
  constructor() {
    super(
      "The model used its whole budget thinking and had nothing left to answer with. Raise the token ceiling for this call.",
    );
    this.name = "RanOutOfRoom";
  }
}

export function readJsonContent(
  completion: OpenAI.Chat.ChatCompletion,
): Record<string, unknown> {
  const choice = completion.choices[0];
  const raw = choice?.message?.content;

  if (!raw) {
    if (choice?.finish_reason === "length") throw new RanOutOfRoom();
    throw new Error("The model returned nothing.");
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Truncated mid-object is the same failure wearing a different hat.
    if (choice.finish_reason === "length") throw new RanOutOfRoom();
    throw new Error("The model's answer wasn't the shape we asked for.");
  }
}
