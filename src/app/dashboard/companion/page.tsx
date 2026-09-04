import type { Metadata } from "next";

import Companion from "@/components/cms/Companion";
import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_GHOST, EYEBROW } from "@/components/cms/ui";
import { createArticle } from "@/lib/actions/articles";
import { companionConfigured } from "@/lib/ai/client";
import { listThread, toMessage } from "@/lib/ai/thread";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "The room — The desk",
  robots: { index: false, follow: false },
};

/**
 * The room, with no piece attached.
 *
 * The editor's panel is for a draft that already exists; this is the other
 * half — where somebody arrives with a grievance or a hunch and finds out
 * whether there is a piece in it. Its thread is stored under the `desk`
 * sentinel, so it persists across visits and never mixes with a draft's.
 */
export default async function CompanionPage() {
  const user = await requireUser("/dashboard/companion");
  const thread = await listThread(user.id, null);

  return (
    <div className="flex min-h-0 flex-col">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={EYEBROW}>Before the draft</p>
          <h1 className="mt-4 font-pixel text-[26px] leading-[1.15] uppercase sm:text-[38px]">
            The room
          </h1>
          <p className="mt-5 max-w-[54ch] font-garamond text-[17px] leading-[1.5] opacity-60">
            A companion that asks rather than answers. Bring the thing you keep
            turning over; leave with a piece worth writing. Nothing said here is
            seen by the desk.
          </p>
        </div>

        {/* The conversation is the point, but at some stage it has to become a
            draft — and the writer shouldn't have to go and find the button. */}
        <form action={createArticle}>
          <SubmitButton className={BUTTON_GHOST} pendingLabel="Opening…">
            Start a piece
          </SubmitButton>
        </form>
      </header>

      <div className="pixel-corner flex h-[70vh] min-h-[34rem] flex-col bg-white/[0.03]">
        <Companion
          articleId={null}
          initial={thread.map(toMessage)}
          configured={companionConfigured()}
          className="flex-1"
        />
      </div>
    </div>
  );
}
