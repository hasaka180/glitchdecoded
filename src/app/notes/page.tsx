import type { Metadata } from "next";

import Footer from "@/components/Footer";
import NoteWall from "@/components/NoteWall";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import { listNotes } from "@/lib/notes/queries";

/** Edited at the desk now, so it refreshes rather than freezing at build. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Notes — Glitch Decoded",
  description:
    "The board: short notes worth keeping where the scroll cannot take them, written at the desk and pinned here.",
};

export default async function NotesPage() {
  const notes = await listNotes();

  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="The board"
          title="Notes"
          dek="The things worth writing down and keeping where the scroll cannot take them. Short, unsigned mostly, and meant for whoever needs them."
          rule={false}
        />


        {/* The board is the page here, not a section of a scroll, so every
            note is laid out at once and the masthead carries the heading. */}

        {/* The masthead's dark band coming away to uncover the stock the
            section is printed on. */}
        <PaperTear sheet="var(--ink)" ground="var(--paper)" />

        <NoteWall layout="grid" heading={false} seed={notes} />
      </main>

      <Footer sheet="var(--paper)" />
    </>
  );
}
