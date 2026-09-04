import type { Metadata } from "next";

import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import VideoLibrary from "@/components/VideoLibrary";
import { listReels } from "@/lib/reels/queries";
import { youtubeId } from "@/lib/videos";

/**
 * Refreshed on a timer: the programme is edited at the desk now, and a reel
 * linked this morning should not wait for a deploy to be watchable.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Video Library — Glitch Decoded",
  description:
    "Old men, old tape, live wounds: broadcasts in which people who thought for a living were asked, on camera, how to bear being alive.",
};

export default async function VideoLibraryPage() {
  const reels = await listReels();
  const transferred = reels.filter((reel) => youtubeId(reel.url) !== null).length;

  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="The film archive"
          title="Old men, old tape, live wounds"
          dek="Broadcasts between 1958 and 1974, in which people who thought for a living were asked, on camera, how to bear being alive."
          rule={false}
        />

        <PaperTear sheet="var(--ink)" ground="var(--graphite)" />

        <section className="stock relative overflow-hidden bg-[color:var(--graphite)] pb-20 text-[color:var(--ink)] sm:pb-28">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
              <p className="max-w-[46ch] font-garamond text-[17px] leading-[1.55] opacity-70">
                Pick a reel from the programme and the set changes channel.
                YouTube serves the stills; the player itself is only built when
                you press play, and on the cookie-free host — so nothing starts
                a session until you actually watch something.
              </p>

              <p className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-45">
                {transferred} of {reels.length} transferred
              </p>
            </div>

            <VideoLibrary reels={reels} />

            <p className="mt-12 max-w-[62ch] font-garamond text-[16px] leading-[1.55] opacity-45 sm:mt-16">
              A reel marked untransferred has no link against it yet. It stays
              in the programme regardless — an archive that hides what it has
              not digitised is telling you it is complete, and it never is.
            </p>
          </div>
        </section>
      </main>

      <Footer sheet="var(--graphite)" />
    </>
  );
}
