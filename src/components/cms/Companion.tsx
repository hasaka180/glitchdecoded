"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Markdown from "@/components/cms/Markdown";
import SubmitButton from "@/components/cms/SubmitButton";
import { ERROR_BOX } from "@/components/cms/ui";
import {
  clearCompanionThread,
  type CompanionState,
} from "@/lib/actions/companion";
import {
  QUICK_ASKS,
  type CompanionMessage,
  type CompanionMode,
} from "@/lib/ai/modes";

/**
 * The room: the writer's half of the conversation with the companion.
 *
 * The answer is streamed off `/api/companion` rather than fetched, so the panel
 * fills a line at a time the way a person typing would. Everything it renders
 * is also stored server-side, which is why a reload does not lose the thread —
 * the local list here is only ever ahead of the store by the turn in flight.
 */

type DraftSnapshot = {
  title: string;
  dek: string;
  body: string;
  category: string;
};

type Props = {
  /** The piece this thread belongs to, or null for the blank-page thread. */
  articleId: string | null;
  initial: CompanionMessage[];
  /** False when the server has no API key; the panel says so instead of failing. */
  configured: boolean;
  /**
   * Reads what is on screen right now. The editor's state is ahead of the
   * stored row between autosaves, and a companion answering about the previous
   * paragraph is worse than one that admits it cannot see the draft.
   */
  getDraft?: () => DraftSnapshot;
  className?: string;
};

/** Markdown at chat size rather than article size. */
const CHAT_MD =
  "!text-[16px] [&_p]:my-3 [&_p]:leading-[1.55] [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[19px] [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-[17px] [&_blockquote]:my-3";

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="pixel-corner-sm max-w-[85%] bg-white/[0.09] px-4 py-3 font-garamond text-[16px] leading-[1.5] whitespace-pre-wrap">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="border-l-2 border-[color:var(--cyan)]/50 pl-4">
      {children}
    </div>
  );
}

export default function Companion({
  articleId,
  initial,
  configured,
  getDraft,
  className,
}: Props) {
  const [messages, setMessages] = useState<CompanionMessage[]>(initial);
  const [input, setInput] = useState("");
  /** The answer currently arriving, before it joins the list above. */
  const [live, setLive] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clearState, clearAction] = useActionState<CompanionState, FormData>(
    clearCompanionThread,
    {},
  );

  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  /** Whether to follow the answer down — false the moment the reader scrolls up. */
  const follow = useRef(true);

  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [messages, live]);

  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    async (text: string, mode: CompanionMode | null) => {
      const body = text.trim();
      if (!body || streaming) return;

      setError(null);
      setInput("");
      setMessages((prev) => [
        ...prev,
        {
          id: `pending-${Date.now()}`,
          role: "user",
          body,
          createdAt: new Date().toISOString(),
        },
      ]);
      follow.current = true;
      setStreaming(true);
      setLive("");

      const controller = new AbortController();
      abort.current = controller;

      let answer = "";

      try {
        const res = await fetch("/api/companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            articleId,
            message: body,
            mode,
            draft: getDraft?.(),
          }),
        });

        if (!res.ok || !res.body) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(payload?.error ?? "The companion didn't answer. Try again.");
          setStreaming(false);
          return;
        }

        // Newline-delimited JSON: read what has arrived, act on whole lines,
        // keep the trailing fragment for the next chunk.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let parsed: { t?: string; e?: string };
            try {
              parsed = JSON.parse(line) as { t?: string; e?: string };
            } catch {
              continue;
            }
            if (parsed.t) {
              answer += parsed.t;
              setLive(answer);
            }
            if (parsed.e) setError(parsed.e);
          }
        }
      } catch (cause) {
        // An abort is the writer pressing Stop, not a failure.
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError("The connection dropped before the answer finished.");
        }
      } finally {
        if (answer.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `answer-${Date.now()}`,
              role: "assistant",
              body: answer,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setLive("");
        setStreaming(false);
        abort.current = null;
      }
    },
    [articleId, getDraft, streaming],
  );

  const empty = messages.length === 0 && !live && !streaming;

  return (
    <div className={`flex min-h-0 flex-col ${className ?? ""}`}>
      {/* --- the thread --------------------------------------------------- */}
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-5 py-6 sm:px-6"
      >
        {empty ? (
          <div className="mx-auto max-w-[46ch] py-6 text-center">
            <p className="font-garamond text-[19px] leading-[1.5] opacity-80">
              {articleId
                ? "Tell me what this piece is trying to say — or press one of the asks below and I'll start."
                : "You don't need a draft to be here. Tell me the thing you keep turning over, and we'll find out whether there's a piece in it."}
            </p>
            <p className="mx-auto mt-4 max-w-[40ch] font-garamond text-[15px] leading-[1.5] opacity-40">
              I ask more than I answer. Nothing said here goes to the desk.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <Bubble key={message.id} role={message.role}>
                {message.role === "assistant" ? (
                  <Markdown source={message.body} className={CHAT_MD} />
                ) : (
                  message.body
                )}
              </Bubble>
            ))}

            {live && (
              <Bubble role="assistant">
                <Markdown source={live} className={CHAT_MD} />
              </Bubble>
            )}

            {streaming && !live && (
              <p className="pl-4 font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-40">
                Thinking…
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- the composer -------------------------------------------------- */}
      <div className="border-t border-white/10 px-5 py-4 sm:px-6">
        {error && (
          <p className={`${ERROR_BOX} mb-4`} role="alert">
            {error}
          </p>
        )}

        {!configured && (
          <p className="pixel-corner-sm mb-4 bg-white/[0.06] px-4 py-3 font-garamond text-[15px] leading-[1.5] opacity-75">
            The companion isn&rsquo;t switched on for this site yet. Add
            <code className="mx-1 bg-white/10 px-1.5 py-0.5 font-mono text-[13px]">
              OPENAI_API_KEY
            </code>
            to the server&rsquo;s environment and restart.
          </p>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_ASKS.map((quick) => (
            <button
              key={quick.id}
              type="button"
              disabled={streaming || !configured}
              onClick={() => void send(quick.ask, quick.id)}
              className="pixel-corner-sm bg-white/[0.07] px-3 py-2 font-arial text-[9px] font-bold tracking-[0.14em] uppercase transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {quick.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; the writing happens in the editor, and a chat that
              // needs a mouse click per turn stops being a conversation.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input, null);
              }
            }}
            disabled={!configured}
            rows={2}
            maxLength={6000}
            placeholder="Say it badly. That's what this is for."
            className="min-w-0 flex-1 resize-y bg-white/[0.04] px-4 py-3 font-garamond text-[16px] text-[color:var(--bone)] outline-none ring-1 ring-white/15 transition-[box-shadow,background-color] placeholder:opacity-35 focus:bg-white/[0.07] focus:ring-2 focus:ring-[color:var(--cyan)] disabled:opacity-50"
          />

          {streaming ? (
            <button
              type="button"
              onClick={() => abort.current?.abort()}
              className="pixel-corner-sm shrink-0 bg-white/10 px-5 py-3 font-arial text-[10px] font-bold tracking-[0.16em] uppercase transition-colors hover:bg-white/20"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void send(input, null)}
              disabled={!input.trim() || !configured}
              className="pixel-corner-sm shrink-0 bg-[color:var(--bone)] px-5 py-3 font-arial text-[10px] font-bold tracking-[0.16em] text-[color:var(--ink)] uppercase transition-colors hover:bg-[color:var(--cyan)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="font-arial text-[9px] tracking-[0.14em] uppercase opacity-30">
            Enter sends · Shift+Enter for a new line
          </p>

          {messages.length > 0 && (
            <form
              action={(formData) => {
                setMessages([]);
                setLive("");
                clearAction(formData);
              }}
              className="ml-auto"
            >
              <input type="hidden" name="articleId" value={articleId ?? ""} />
              <SubmitButton
                className="font-arial text-[9px] font-bold tracking-[0.14em] uppercase opacity-40 transition-opacity hover:opacity-100"
                pendingLabel="Clearing…"
                confirm="Delete this conversation? The piece itself isn't touched."
              >
                Clear the thread
              </SubmitButton>
            </form>
          )}
        </div>

        {clearState.error && (
          <p className={`${ERROR_BOX} mt-4`} role="alert">
            {clearState.error}
          </p>
        )}
      </div>
    </div>
  );
}
