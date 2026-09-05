import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NoteRip from "@/components/NoteRip";
import { recommendedPicks } from "@/lib/articles/listing";
import { listNotes } from "@/lib/notes/queries";
import { listReels } from "@/lib/reels/queries";
import RecommendedGrid from "@/components/RecommendedGrid";
import RipStage from "@/components/RipStage";
import TopicField from "@/components/TopicField";

/**
 * Refreshed on a timer rather than frozen at build.
 *
 * The picks, the board and the film archive are all edited at the desk now, so
 * a static home page would show whatever was true the last time the site was
 * deployed — which is the one thing "most recent" cannot mean.
 */
export const revalidate = 300;

export default async function Home() {
  // Fetched together rather than in sequence: the picks, the board and the
  // archive all sit on the one page.
  const [picks, notes, reels] = await Promise.all([
    recommendedPicks(),
    listNotes(),
    listReels(),
  ]);

  return (
    <>
      <main className="flex-1">
        <Hero />

        <RipStage />

        <TopicField />

        <RecommendedGrid picks={picks} />

        {/* The film archive is the page NoteRip tears off, so it is mounted
            there rather than laid out as a section of its own. */}
        <NoteRip seed={notes} reels={reels} />
      </main>

      {/* The board is the last thing the reader touches, so the sign-off tears
          off it — the footer brings that transition with it. */}
      <Footer />
    </>
  );
}
