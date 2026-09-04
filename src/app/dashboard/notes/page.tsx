import type { Metadata } from "next";

import NoteEditor, { type EditableNote } from "@/components/cms/NoteEditor";
import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_GHOST, BUTTON_PRIMARY, EYEBROW } from "@/components/cms/ui";
import { addNote, seedNotes } from "@/lib/actions/notes";
import { listNoteRows } from "@/lib/notes/queries";
import { requireSuperadmin } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Notes to self — The desk",
  robots: { index: false, follow: false },
};

/**
 * The board, at the desk.
 *
 * Only the magazine's own notes are here. A reader's pinned notes are kept in
 * their browser and never reach a server, which is what the board promises
 * them in so many words — there is nothing of theirs on this screen to edit.
 */
export default async function NotesPage() {
  await requireSuperadmin();
  const rows = await listNoteRows();

  const notes: EditableNote[] = rows.map((row) => ({
    id: row.$id,
    text: row.text ?? "",
    sign: row.sign ?? "",
    position: row.position ?? 0,
  }));

  return (
    <>
      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={EYEBROW}>The board</p>
          <h1 className="mt-4 font-pixel text-[26px] leading-[1.15] uppercase sm:text-[38px]">
            Notes to self
          </h1>
          <p className="mt-5 max-w-[54ch] font-garamond text-[17px] leading-[1.5] opacity-60">
            The notes the magazine writes, on the home page and at{" "}
            <span className="opacity-80">/notes</span>. A reader&rsquo;s own
            pinned notes are kept in their browser and never reach us, so
            there&rsquo;s nothing of theirs here.
          </p>
        </div>

        {notes.length > 0 && (
          <form action={addNote}>
            <SubmitButton className={BUTTON_PRIMARY} pendingLabel="Adding…">
              Add a note
            </SubmitButton>
          </form>
        )}
      </header>

      {notes.length === 0 ? (
        <div className="pixel-corner bg-white/[0.03] px-6 py-16 text-center">
          <p className="font-garamond text-[19px] opacity-70">
            The board is still coming from the source file.
          </p>
          <p className="mx-auto mt-3 max-w-[46ch] font-garamond text-[16px] opacity-45">
            Bring those in and they become editable here. Until then the site
            shows them exactly as it does now.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <form action={seedNotes}>
              <SubmitButton className={BUTTON_PRIMARY} pendingLabel="Bringing them in…">
                Bring in the notes from the file
              </SubmitButton>
            </form>
            <form action={addNote}>
              <SubmitButton className={BUTTON_GHOST} pendingLabel="Adding…">
                Start with an empty note
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {notes.map((note) => (
            <NoteEditor key={note.id} note={note} />
          ))}
        </ul>
      )}
    </>
  );
}
