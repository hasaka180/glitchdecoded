import type { Metadata } from "next";

import ReelEditor, { type EditableReel } from "@/components/cms/ReelEditor";
import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_GHOST, BUTTON_PRIMARY, EYEBROW } from "@/components/cms/ui";
import { addReel, seedReels } from "@/lib/actions/reels";
import { listReelRows } from "@/lib/reels/queries";
import { requireSuperadmin } from "@/lib/auth/dal";
import { youtubeId } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Video library — The desk",
  robots: { index: false, follow: false },
};

/**
 * The video library, at the desk.
 *
 * Superadmin only. The library is the magazine's rather than any one
 * contributor's, so unlike an article there is no ownership to weigh — only
 * whether the reader runs the desk, which `requireSuperadmin` settles here and
 * every action settles again for itself.
 */
export default async function ReelsPage() {
  await requireSuperadmin();
  const rows = await listReelRows();

  const reels: EditableReel[] = rows.map((row) => ({
    id: row.$id,
    speaker: row.speaker,
    line: row.line ?? "",
    source: row.source ?? "",
    year: row.year ?? "",
    stock: row.stock ?? "",
    hue: row.hue || "#d8b06a",
    inkHue: row.inkHue || "#8a5a12",
    url: row.url ?? "",
    runtime: row.runtime ?? "",
    position: row.position ?? 0,
  }));

  const transferred = reels.filter((r) => youtubeId(r.url) !== null).length;

  return (
    <>
      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={EYEBROW}>The film archive</p>
          <h1 className="mt-4 font-pixel text-[26px] leading-[1.15] uppercase sm:text-[38px]">
            Video library
          </h1>
          <p className="mt-5 max-w-[54ch] font-garamond text-[17px] leading-[1.5] opacity-60">
            The programme beside the set, on the home page and at{" "}
            <span className="opacity-80">/video-library</span>. Paste a YouTube
            link in any form — <span className="opacity-80">youtu.be/ID</span>,{" "}
            <span className="opacity-80">watch?v=ID</span>, a short or an embed.
            A reel with no link still runs; it reads as not transferred yet.
          </p>
          {reels.length > 0 && (
            <p className="mt-4 font-arial text-[9px] font-bold tracking-[0.18em] uppercase opacity-40">
              {reels.length} reels · {transferred} transferred
            </p>
          )}
        </div>

        {reels.length > 0 && (
          <form action={addReel}>
            <SubmitButton className={BUTTON_PRIMARY} pendingLabel="Adding…">
              Add a reel
            </SubmitButton>
          </form>
        )}
      </header>

      {reels.length === 0 ? (
        <div className="pixel-corner bg-white/[0.03] px-6 py-16 text-center">
          <p className="font-garamond text-[19px] opacity-70">
            The library is still coming from the source file.
          </p>
          <p className="mx-auto mt-3 max-w-[46ch] font-garamond text-[16px] opacity-45">
            Bring those six in and they become editable here. Until then the
            site keeps showing them exactly as it does now, so nothing changes
            for a reader while you decide.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <form action={seedReels}>
              <SubmitButton className={BUTTON_PRIMARY} pendingLabel="Bringing them in…">
                Bring in the six from the file
              </SubmitButton>
            </form>
            <form action={addReel}>
              <SubmitButton className={BUTTON_GHOST} pendingLabel="Adding…">
                Start with an empty reel
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {reels.map((reel) => (
            <ReelEditor key={reel.id} reel={reel} />
          ))}
        </ul>
      )}
    </>
  );
}
