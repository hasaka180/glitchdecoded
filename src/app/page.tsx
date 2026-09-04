import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NoteRip from "@/components/NoteRip";
import { listNotes } from "@/lib/notes/queries";
import { listReels } from "@/lib/reels/queries";
import RecommendedGrid from "@/components/RecommendedGrid";
import RipStage from "@/components/RipStage";
import TopicField from "@/components/TopicField";

export default async function Home() {
  // One round trip rather than two: the board and the archive are both
  // above the fold on the same page.
  const [notes, reels] = await Promise.all([listNotes(), listReels()]);

  return (
    <>
      <main className="flex-1">
        <Hero />

        <RipStage />

        <TopicField />

        <RecommendedGrid />

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
