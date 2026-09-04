"use client";

import { useEffect, useState } from "react";

import Companion from "@/components/cms/Companion";
import type { ComposedDraft } from "@/lib/ai/compose";
import type { CompanionMessage } from "@/lib/ai/modes";

/**
 * The room, as a panel beside the editor.
 *
 * Deliberately not a modal: there is no backdrop and nothing is trapped, so a
 * writer can take a question from the panel and go straight to the paragraph it
 * was about without closing anything. That is the whole point of it being here
 * rather than on a page of its own.
 */
export default function CompanionDrawer({
  articleId,
  initial,
  configured,
  getDraft,
  onCompose,
}: {
  articleId: string;
  initial: CompanionMessage[];
  configured: boolean;
  getDraft: () => {
    title: string;
    dek: string;
    body: string;
    category: string;
  };
  onCompose: (draft: ComposedDraft) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pixel-corner-sm inline-flex w-full items-center justify-center gap-2 bg-[color:var(--cyan)]/15 px-5 py-3 font-arial text-[10px] font-bold tracking-[0.18em] uppercase ring-1 ring-[color:var(--cyan)]/40 transition-colors hover:bg-[color:var(--cyan)]/25"
        style={{ color: "var(--cyan)" }}
      >
        {open ? "Close the room" : "Talk it through"}
      </button>

      {/* Always mounted so a half-typed message survives closing the panel. */}
      <div
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[32rem] flex-col border-l border-white/12 bg-[color:var(--ink)] shadow-[-24px_0_60px_rgba(0,0,0,0.55)] transition-transform duration-200 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        // `inert` rather than only `aria-hidden`: a hidden panel whose Send
        // button is still in the tab order is worse than no panel.
        inert={!open}
      >
        <header className="flex items-center gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-pixel text-[14px] tracking-[0.02em] uppercase">
              The room
            </p>
            <p className="mt-1 font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-40">
              Reads your draft as it stands
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-50 transition-opacity hover:opacity-100"
          >
            Close
          </button>
        </header>

        <Companion
          articleId={articleId}
          initial={initial}
          configured={configured}
          getDraft={getDraft}
          onCompose={onCompose}
          className="flex-1"
        />
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pixel-corner-sm fixed right-5 bottom-5 z-30 bg-[color:var(--bone)] px-5 py-3 font-arial text-[10px] font-bold tracking-[0.18em] text-[color:var(--ink)] uppercase shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-colors hover:bg-[color:var(--cyan)]"
        >
          Talk it through
        </button>
      )}
    </>
  );
}
