"use client";

import { useActionState, useState } from "react";

import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_GHOST, ERROR_BOX, INPUT, LABEL } from "@/components/cms/ui";
import { deleteNote, saveNote, type NoteState } from "@/lib/actions/notes";

/**
 * One note on the board.
 *
 * Its own form, like a reel: saving one note should not depend on every other
 * note on the screen being valid.
 */

export type EditableNote = {
  id: string;
  text: string;
  sign: string;
  position: number;
};

/** The board's own limit, mirrored here so the count is visible while typing. */
const MAX_TEXT = 300;

export default function NoteEditor({ note }: { note: EditableNote }) {
  const [text, setText] = useState(note.text);
  const [sign, setSign] = useState(note.sign);
  const [position, setPosition] = useState(String(note.position));

  const [saveState, save, saving] = useActionState<NoteState, FormData>(
    saveNote,
    {},
  );
  const [removeState, remove] = useActionState<NoteState, FormData>(
    deleteNote,
    {},
  );

  return (
    <li className="pixel-corner bg-white/[0.03] p-5 sm:p-6">
      <form action={save} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <input type="hidden" name="noteId" value={note.id} />

        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor={`text-${note.id}`}>
            The note
          </label>
          <textarea
            id={`text-${note.id}`}
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_TEXT}
            rows={2}
            placeholder="Stop rehearsing conversations that are never going to happen."
            className={`${INPUT} resize-y`}
          />
          <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
            {text.length}/{MAX_TEXT} · written in the second person, the way
            people write to themselves
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor={`sign-${note.id}`}>
            Signed
          </label>
          <input
            id={`sign-${note.id}`}
            name="sign"
            value={sign}
            onChange={(e) => setSign(e.target.value)}
            maxLength={120}
            placeholder="M.K. · Lisbon"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor={`position-${note.id}`}>
            Order
          </label>
          <input
            id={`position-${note.id}`}
            name="position"
            value={position}
            onChange={(e) => setPosition(e.target.value.replace(/\D/g, "").slice(0, 3))}
            className={INPUT}
          />
        </div>

        {(saveState.error ?? removeState.error) && (
          <p className={`${ERROR_BOX} sm:col-span-2`} role="alert">
            {saveState.error ?? removeState.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" disabled={saving} className={BUTTON_GHOST}>
            {saving ? "Saving…" : "Save this note"}
          </button>
          {saveState.savedAt && !saving && (
            <span className="font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
              Saved
            </span>
          )}
        </div>
      </form>

      {/* Its own form — a form cannot be nested inside another one. */}
      <form action={remove} className="mt-4 border-t border-white/8 pt-4">
        <input type="hidden" name="noteId" value={note.id} />
        <SubmitButton
          className="font-arial text-[9px] font-bold tracking-[0.14em] uppercase opacity-40 transition-opacity hover:opacity-100"
          pendingLabel="Removing…"
          confirm="Take this note off the board?"
        >
          Remove note
        </SubmitButton>
      </form>
    </li>
  );
}
