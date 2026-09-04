import type Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk";

import {
  COMPANION_EFFORT,
  COMPANION_MODEL,
  companionClient,
  companionConfigured,
} from "@/lib/ai/client";
import {
  MODE_METHOD,
  systemBlocks,
  type DraftContext,
} from "@/lib/ai/companion";
import { isCompanionMode, type CompanionMode } from "@/lib/ai/modes";
import { appendMessage, listThread } from "@/lib/ai/thread";
import { getArticleById } from "@/lib/articles/queries";
import { getCurrentUser, ownsArticle } from "@/lib/auth/dal";

/**
 * The companion's turn.
 *
 * A route handler rather than a Server Action because the answer is streamed —
 * a writer watching a blank panel for fifteen seconds assumes it is broken —
 * and Server Actions return once, at the end.
 *
 * The wire format is newline-delimited JSON: `{"t":"…"}` for a chunk of text,
 * `{"e":"…"}` for something that went wrong mid-answer, `{"d":{…}}` when the
 * turn is stored. Plain text would be simpler, but there would be nowhere to
 * put an error that only surfaces after the first paragraph has been sent.
 */

/** Longest turn a writer can send. Generous — people paste paragraphs here. */
const MAX_MESSAGE = 6_000;

/** Matches the editor's own ceiling; `foldDraft` handles anything near it. */
const MAX_BODY = 120_000;

/**
 * A crude ceiling, per signed-in writer, on a route that spends real money.
 *
 * In memory, so it resets on deploy and is counted per instance — this is a
 * guard against a stuck retry loop or one enthusiastic account, not a billing
 * control. A real limit belongs in front of the process.
 */
const RATE_MAX = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const recent = new Map<string, number[]>();

function overRateLimit(userId: string): boolean {
  const now = Date.now();
  const hits = (recent.get(userId) ?? []).filter(
    (at) => now - at < RATE_WINDOW_MS,
  );
  hits.push(now);
  recent.set(userId, hits);
  return hits.length > RATE_MAX;
}

function frame(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`);
}

function fail(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Narrows the draft the panel sends alongside the message. */
function readDraft(value: unknown): DraftContext | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const str = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";
  return {
    title: str("title").slice(0, 200),
    dek: str("dek").slice(0, 500),
    body: str("body").slice(0, MAX_BODY),
    category: str("category").slice(0, 40),
    status: "draft",
  };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("You need to be signed in.", 401);

  if (!companionConfigured()) {
    return fail(
      "The companion isn't switched on for this site yet — ANTHROPIC_API_KEY is missing from the server's environment.",
      503,
    );
  }

  if (overRateLimit(user.id)) {
    return fail("That's a lot of questions at once. Give it a few minutes.", 429);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("Malformed request.", 400);
  }

  const message = String(payload.message ?? "").trim().slice(0, MAX_MESSAGE);
  if (!message) return fail("Say something first.", 400);

  const mode: CompanionMode | null = isCompanionMode(payload.mode)
    ? payload.mode
    : null;

  // A thread is keyed by a piece, so the piece has to be the writer's. Someone
  // else's id is a 404 for the same reason it is in the editor: a distinct
  // "not yours" would confirm which ids exist.
  const articleId =
    typeof payload.articleId === "string" && payload.articleId
      ? payload.articleId
      : null;

  let draft: DraftContext | null = null;
  if (articleId) {
    const article = await getArticleById(articleId);
    if (!article || !ownsArticle(user, article)) {
      return fail("That piece no longer exists.", 404);
    }

    // The panel sends what is on screen, which is ahead of the stored row
    // between autosaves; the row is the fallback and the source of the two
    // fields the editor doesn't hold — status and the desk's note.
    const live = readDraft(payload.draft);
    draft = {
      title: live?.title || article.title,
      dek: live?.dek || article.dek || "",
      body: live?.body ?? article.body ?? "",
      category: live?.category || article.category,
      status: article.status,
      reviewNote: article.reviewNote,
    };
  }

  const history = await listThread(user.id, articleId);

  const messages: Anthropic.MessageParam[] = [];
  for (const row of history) {
    // The window can slice into the middle of a thread, and the API needs a
    // user turn first; leading answers from a previous session are dropped.
    if (messages.length === 0 && row.role !== "user") continue;
    messages.push({ role: row.role, content: row.body });
  }
  messages.push({ role: "user", content: message });

  // The quick ask's method rides along as a mid-conversation system message,
  // so pressing a button changes this turn without touching — and so without
  // invalidating — the cached brief above it.
  if (mode) messages.push({ role: "system", content: MODE_METHOD[mode] });

  await appendMessage({
    userId: user.id,
    articleId,
    role: "user",
    body: message,
    mode,
  });

  const stream = companionClient().messages.stream({
    model: COMPANION_MODEL,
    max_tokens: 8_000,
    thinking: { type: "adaptive" },
    output_config: { effort: COMPANION_EFFORT },
    system: systemBlocks(user.name, draft),
    messages,
  });

  // A writer who closes the panel mid-answer shouldn't keep paying for the
  // rest of it.
  request.signal.addEventListener("abort", () => stream.abort());

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      /** Set once the reader has gone; enqueuing after that throws. */
      let gone = false;

      const push = (payload: Record<string, unknown>) => {
        if (gone) return;
        try {
          controller.enqueue(frame(payload));
        } catch {
          gone = true;
        }
      };

      try {
        for await (const event of stream) {
          // Only visible prose is forwarded. Thinking blocks stream too, with
          // their text empty under the default display setting.
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            answer += event.delta.text;
            push({ t: event.delta.text });
          }
        }
      } catch (error) {
        // A writer pressing Stop aborts the stream; that is not a failure and
        // there is nobody left to tell about it either way.
        if (!request.signal.aborted) {
          push({
            e:
              error instanceof APIError
                ? `The companion stopped mid-thought (${error.status ?? "no response"}). Try again.`
                : "The companion stopped mid-thought. Try again.",
          });
        }
      }

      // Whatever arrived is kept, including a half-finished answer: a thread
      // showing a question with no reply reads as lost work.
      if (answer.trim()) {
        try {
          const row = await appendMessage({
            userId: user.id,
            articleId,
            role: "assistant",
            body: answer,
            mode,
          });
          push({ d: { id: row.$id } });
        } catch {
          push({ e: "That answer couldn't be saved to the thread." });
        }
      }

      if (!gone) {
        try {
          controller.close();
        } catch {
          // Already closed by the reader going away.
        }
      }
    },

    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Stops a proxy from buffering the answer into one lump at the end.
      "X-Accel-Buffering": "no",
    },
  });
}
