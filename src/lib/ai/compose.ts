import "server-only";

import { CATEGORIES, isCategorySlug, type CategorySlug } from "@/lib/categories";

import {
  companionClient,
  COMPANION_MODEL,
  COMPOSE_EFFORT,
  COMPOSE_MAX_TOKENS,
} from "./client";
import { systemPrompts, type DraftContext } from "./companion";
import type { CompanionRow } from "./thread";

/**
 * Turning a conversation into a draft.
 *
 * The companion's whole method is to ask rather than answer, which leaves a
 * thread with no natural end — this is the end. It reads the conversation back
 * and lays out the piece it produced, in the shape the editor's form expects.
 */

export type ComposedDraft = {
  title: string;
  dek: string;
  category: CategorySlug;
  body: string;
  /** What the model guessed at, handed back to the writer rather than hidden. */
  note: string;
};

const SLUGS = CATEGORIES.map((c) => c.slug);

const INSTRUCTION = `Stop asking and write it up.

Everything above is the raw material: what the writer told you, in their words, and what you drew out of them. Lay out the piece it adds up to.

- Use only what the writer actually said. Do not invent a fact, a name, a date, a statistic or a scene that did not come from them. Where the piece needs something they haven't given you, leave a marked gap — [TK: the year this happened] — rather than filling it in. A marked gap is honest; an invention is not, and this magazine publishes it.
- Write in their register, not yours. Where they said something well, use their phrasing.
- The body is Markdown and carries the piece's structure in real headings: "##" for each section, "###" beneath one only where a section genuinely splits. Never "#" — the title is its own field and the page renders it above the body, so an H1 here prints it twice. Two to five sections is usually right: no headings at all is a wall, one per paragraph is a listicle.
- Use the rest of the markup where the writing calls for it and nowhere else — "> " for a line worth pulling out, "*emphasis*" sparingly, a list only for things that are genuinely a list.
- Length is whatever the material supports and no more — a short piece with everything in it beats a long one with padding.
- The standfirst is one or two sentences that make the case for reading on. Not a summary.
- Pick the perspective the piece actually belongs under.
- In "note", tell the writer in two or three sentences what you had to guess at, what you left as a gap, and what only they can supply. Write it to them, plainly.

This is a first draft they will rewrite, not a finished piece. Do not tell them it's finished.`;

/** Strict schema, so the fields drop straight into the editor without parsing luck. */
const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The headline. No trailing full stop." },
    dek: { type: "string", description: "The standfirst — one or two sentences." },
    category: { type: "string", enum: SLUGS, description: "Perspective slug." },
    body: { type: "string", description: "The piece, in Markdown." },
    note: { type: "string", description: "A short note to the writer." },
  },
  required: ["title", "dek", "category", "body", "note"],
  additionalProperties: false,
} as const;

const MAX_TITLE = 160;
const MAX_DEK = 400;
const MAX_BODY = 120_000;

export class EmptyConversation extends Error {
  constructor() {
    super("There isn't enough of a conversation yet to write anything up.");
    this.name = "EmptyConversation";
  }
}

export async function composeFromThread(input: {
  writerName: string;
  thread: CompanionRow[];
  draft: DraftContext | null;
}): Promise<ComposedDraft> {
  // Two turns is the floor: a single question with no answer is not material.
  if (input.thread.filter((row) => row.role === "user").length === 0) {
    throw new EmptyConversation();
  }

  const messages = [
    ...systemPrompts(input.writerName, input.draft, "compose").map((content) => ({
      role: "developer" as const,
      content,
    })),
    ...input.thread.map((row) => ({ role: row.role, content: row.body })),
    { role: "developer" as const, content: INSTRUCTION },
  ];

  const completion = await companionClient().chat.completions.create({
    model: COMPANION_MODEL,
    // A step above the chat's floor. This is the one call per piece whose
    // output becomes an article, so it is the wrong place to save pennies —
    // and it still has to finish inside a serverless duration ceiling, which
    // is why it is not higher than that.
    reasoning_effort: COMPOSE_EFFORT,
    max_completion_tokens: COMPOSE_MAX_TOKENS,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: { name: "composed_draft", strict: true, schema: SCHEMA },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("The write-up came back empty.");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const str = (key: string) =>
    typeof parsed[key] === "string" ? (parsed[key] as string) : "";

  const category = str("category");

  return {
    title: str("title").trim().slice(0, MAX_TITLE) || "Untitled",
    dek: str("dek").trim().slice(0, MAX_DEK),
    // `strict` constrains the enum, but the value still crosses a boundary and
    // ends up in a column that only accepts the six.
    category: isCategorySlug(category) ? category : "human",
    body: str("body").slice(0, MAX_BODY),
    note: str("note").trim().slice(0, 2_000),
  };
}
