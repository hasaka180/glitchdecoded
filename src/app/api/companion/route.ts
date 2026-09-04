import { APIError } from "openai";
import type OpenAI from "openai";

import {
  CHAT_MAX_TOKENS,
  COMPANION_EFFORT,
  COMPANION_MODEL,
  companionClient,
  companionConfigured,
} from "@/lib/ai/client";
import {
  MODE_METHOD,
  systemPrompts,
  type DraftContext,
} from "@/lib/ai/companion";
import { isCompanionMode, type CompanionMode } from "@/lib/ai/modes";
import {
  appendMessage,
  asksInWindow,
  countAsks,
  listThread,
  MAX_ASKS,
  RATE_MAX,
  REPLAY_WINDOW,
} from "@/lib/ai/thread";
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

/**
 * A streamed answer from a reasoning model can be thinking for a while before
 * the first token arrives, which is longer than a serverless function's default
 * ceiling. 60s is the most a Vercel Hobby function may run; raise it on a plan
 * that allows more if long answers start getting cut off mid-sentence.
 */
export const maxDuration = 60;

/** Longest turn a writer can send. Generous — people paste paragraphs here. */
const MAX_MESSAGE = 6_000;

/** Matches the editor's own ceiling; `foldDraft` handles anything near it. */
const MAX_BODY = 120_000;

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
      "The companion isn't switched on for this site yet — OPENAI_API_KEY is missing from the server's environment.",
      503,
    );
  }

  // Counted out of the database so the ceiling survives a cold start and holds
  // across every instance serving this deployment.
  if ((await asksInWindow(user.id)) >= RATE_MAX) {
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

  // The cap is enforced here rather than only in the panel: the route is
  // reachable by direct POST, and it is the thing that spends money.
  if ((await countAsks(user.id, articleId)) >= MAX_ASKS) {
    return fail(
      `That's ${MAX_ASKS} questions — as far as this conversation usefully goes. Write it up, or clear the thread and start again.`,
      429,
    );
  }

  const history = await listThread(user.id, articleId, REPLAY_WINDOW);

  // The brief first and the draft second, both as `developer` turns: they are
  // instructions from the site, not from the writer, and the split keeps the
  // frozen half at the front where prompt caching can reuse it.
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = systemPrompts(
    user.name,
    draft,
    "chat",
  ).map((content) => ({ role: "developer", content }));

  const opening = messages.length;
  for (const row of history) {
    // The window can slice into the middle of a thread; a leading answer from
    // a previous session, with nothing it was answering, is dropped.
    if (messages.length === opening && row.role !== "user") continue;
    messages.push({ role: row.role, content: row.body });
  }
  messages.push({ role: "user", content: message });

  // The quick ask's method rides along at the end as one more instruction, so
  // pressing a button changes this turn without touching — and so without
  // invalidating — the cached brief at the front.
  if (mode) messages.push({ role: "developer", content: MODE_METHOD[mode] });

  await appendMessage({
    userId: user.id,
    articleId,
    role: "user",
    body: message,
    mode,
  });

  // A writer who closes the panel mid-answer shouldn't keep paying for the
  // rest of it, so the model call is tied to the request's own signal.
  const stream = await companionClient().chat.completions.create(
    {
      model: COMPANION_MODEL,
      max_completion_tokens: CHAT_MAX_TOKENS,
      reasoning_effort: COMPANION_EFFORT,
      messages,
      stream: true,
    },
    { signal: request.signal },
  );

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
        for await (const chunk of stream) {
          // Only the prose. A reasoning model's own thinking never appears in
          // `content`, and a refusal arrives on its own field rather than here.
          const piece = chunk.choices[0]?.delta?.content;
          if (piece) {
            answer += piece;
            push({ t: piece });
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
      // Hangs up on the model as soon as the reader is gone.
      void stream.controller.abort();
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
