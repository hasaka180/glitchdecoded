import type { Metadata } from "next";

import Footer from "@/components/Footer";
import NoteWall from "@/components/NoteWall";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";

export const metadata: Metadata = {
  title: "Notes — Glitch Decoded",
  description:
    "The board. Pin the thing you do not want to lose to the scroll — it stays in your browser and goes nowhere else.",
};

export default function NotesPage() {
  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="The board"
          title="Notes"
          dek="The one thing this site remembers. Write down what you would rather not lose to the scroll — it is kept in your browser, and it never reaches us."
          rule={false}
        />


        {/* The board is the page here, not a section of a scroll, so every
            note is laid out at once and the masthead carries the heading. */}

        {/* The masthead's dark band coming away to uncover the stock the
            section is printed on. */}
        <PaperTear sheet="var(--ink)" ground="var(--paper)" />

        <NoteWall layout="grid" heading={false} />
      </main>

      <Footer sheet="var(--paper)" />
    </>
  );
}
