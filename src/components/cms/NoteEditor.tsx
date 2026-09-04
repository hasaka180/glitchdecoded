"use client";

import { useActionState, useState } from "react";

import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_GHOST, ERROR_BOX, INPUT, LABEL } from "@/components/cms/ui";
import {
  deleteNote,
  removeNoteImage,
  saveNote,
  uploadNoteImage,
  type NoteImageState,
  type NoteState,
} from "@/lib/actions/notes";

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
  imageUrl: string | null;
  imageAlt: string;
  position: number;
};

/** The board's own limit, mirrored here so the count is visible while typing. */
const MAX_TEXT = 300;

export default function NoteEditor({ note }: { note: EditableNote }) {
  const [text, setText] = useState(note.text);
  const [sign, setSign] = useState(note.sign);
  const [position, setPosition] = useState(String(note.position));
  const [alt, setAlt] = useState(note.imageAlt);
  /** Set on the Remove click so the preview clears before the round trip ends. */
  const [removedHere, setRemovedHere] = useState(false);

  const [uploadState, upload, uploading] = useActionState<
    NoteImageState,
    FormData
  >(uploadNoteImage, {});
  const [dropState, drop] = useActionState<NoteImageState, FormData>(
    removeNoteImage,
    {},
  );

  // Derived rather than synchronised: the upload's result is the newest truth,
  // and local state only has to remember that Remove was pressed.
  const imageUrl =
    removedHere && !dropState.error ? null : (uploadState.url ?? note.imageUrl);

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

        <div className="sm:col-span-2">
          <span className={LABEL}>Picture</span>

          {(uploadState.error ?? dropState.error) && (
            <p className={`${ERROR_BOX} mb-3`} role="alert">
              {uploadState.error ?? dropState.error}
            </p>
          )}

          <div className="flex flex-wrap items-start gap-5">
            {imageUrl ? (
              // An Appwrite Storage URL on whatever endpoint the project is
              // on, which next/image would need configured as a remote host.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={alt || "This note's picture, with no description yet"}
                className="pixel-corner-sm block size-24 shrink-0 bg-black object-cover"
              />
            ) : (
              <span className="pixel-corner-sm flex size-24 shrink-0 items-center justify-center bg-white/[0.06] px-2 text-center font-arial text-[8px] font-bold tracking-[0.14em] uppercase opacity-35">
                Category art
              </span>
            )}

            <div className="min-w-0 flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const payload = new FormData();
                  payload.set("noteId", note.id);
                  payload.set("file", file);
                  setRemovedHere(false);
                  upload(payload);
                  // Lets the same file be chosen again after a failure.
                  event.target.value = "";
                }}
                className="block w-full max-w-[20rem] font-arial text-[11px] file:mr-3 file:cursor-pointer file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:font-arial file:text-[9px] file:font-bold file:tracking-[0.16em] file:text-[color:var(--bone)] file:uppercase hover:file:bg-white/20 disabled:opacity-40"
              />

              <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
                {uploading
                  ? "Uploading…"
                  : "Square reads best · jpg, png, webp or avif · up to 8 mb · leave it empty and the card keeps its category art"}
              </p>

              {imageUrl && !uploading && (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Take the picture off this note?")) return;
                    setRemovedHere(true);
                    const payload = new FormData();
                    payload.set("noteId", note.id);
                    drop(payload);
                  }}
                  className="mt-3 font-arial text-[9px] font-bold tracking-[0.14em] uppercase opacity-40 transition-opacity hover:opacity-100"
                >
                  Remove picture
                </button>
              )}
            </div>
          </div>

          {imageUrl && (
            <div className="mt-4">
              <label className={LABEL} htmlFor={`imageAlt-${note.id}`}>
                What the picture shows
              </label>
              <input
                id={`imageAlt-${note.id}`}
                name="imageAlt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                maxLength={300}
                placeholder="A hand pinning a torn receipt to a corkboard."
                className={INPUT}
              />
              <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
                Read aloud to anyone who can&rsquo;t see it. Saved with the note.
              </p>
            </div>
          )}
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
