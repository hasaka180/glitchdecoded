import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import NoteRip from "@/components/NoteRip";
import RecommendedGrid from "@/components/RecommendedGrid";
import RipStage from "@/components/RipStage";
import TopicField from "@/components/TopicField";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />

        <RipStage />

        <TopicField />

        <RecommendedGrid />

        {/* The film archive is the page NoteRip tears off, so it is mounted
            there rather than laid out as a section of its own. */}
        <NoteRip />
      </main>

      {/* The board is the last thing the reader touches, so the sign-off tears
          off it — the footer brings that transition with it. */}
      <Footer />
    </>
  );
}
