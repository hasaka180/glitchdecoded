"use client";

import { useActionState, useRef, useState } from "react";

import { ERROR_BOX, LABEL } from "@/components/cms/ui";
import {
  removeCover,
  uploadCover,
  type CoverState,
} from "@/lib/actions/cover";

/**
 * The cover image and the words that describe it.
 *
 * The upload is dispatched straight from the file input rather than from a
 * form of its own: this sits inside the editor's form, and a form cannot be
 * nested in another one. The alt field is an ordinary input belonging to that
 * outer form, so it saves and autosaves with everything else.
 */

/** What the piece actually needs, said where the writer is choosing a file. */
const RECOMMENDED = "1600 × 900 (16:9)";

export default function CoverField({
  articleId,
  initialUrl,
  alt,
  onAltChange,
  canEdit,
}: {
  articleId: string;
  initialUrl: string | null;
  alt: string;
  onAltChange: (value: string) => void;
  canEdit: boolean;
}) {
  const input = useRef<HTMLInputElement | null>(null);
  /** Set on the Remove click so the preview clears before the round trip ends. */
  const [removedHere, setRemovedHere] = useState(false);

  const [uploadState, upload, uploading] = useActionState<CoverState, FormData>(
    uploadCover,
    {},
  );
  const [removeState, remove] = useActionState<CoverState, FormData>(
    removeCover,
    {},
  );

  /**
   * Derived rather than synchronised: an upload's result is the newest truth,
   * and the only thing local state has to remember is that Remove was pressed.
   * A removal that comes back with a complaint falls straight back to the
   * cover that is still there.
   */
  const url =
    removedHere && !removeState.error ? null : (uploadState.url ?? initialUrl);

  const error = uploadState.error ?? removeState.error;

  return (
    <div className="mt-10">
      <span className={LABEL}>Cover image</span>

      {error && (
        <p className={`${ERROR_BOX} mb-4`} role="alert">
          {error}
        </p>
      )}

      {url ? (
        <div className="pixel-corner overflow-hidden bg-white/[0.03]">
          {/* An Appwrite Storage URL on whatever endpoint the project is on,
              which next/image would need configured as a remote host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt || "The cover, with no description written yet"}
            className="block aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : (
        <div className="pixel-corner flex aspect-[16/9] max-h-64 w-full items-center justify-center bg-white/[0.03] px-6 text-center">
          <p className="font-garamond text-[16px] leading-[1.5] opacity-40">
            No cover yet. The piece runs without one, and link previews fall
            back to the generated card.
          </p>
        </div>
      )}

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const payload = new FormData();
              payload.set("articleId", articleId);
              payload.set("file", file);
              setRemovedHere(false);
              upload(payload);
              // Lets the same file be chosen again after a failed upload.
              event.target.value = "";
            }}
            className="block w-full max-w-[22rem] font-arial text-[11px] file:mr-4 file:cursor-pointer file:border-0 file:bg-white/10 file:px-4 file:py-2 file:font-arial file:text-[10px] file:font-bold file:tracking-[0.16em] file:text-[color:var(--bone)] file:uppercase hover:file:bg-white/20 disabled:opacity-40"
          />

          {uploading && (
            <span className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-50">
              Uploading…
            </span>
          )}

          {url && !uploading && (
            <button
              type="button"
              onClick={() => {
                if (!window.confirm("Remove the cover image?")) return;
                setRemovedHere(true);
                const payload = new FormData();
                payload.set("articleId", articleId);
                remove(payload);
              }}
              className="font-arial text-[9px] font-bold tracking-[0.14em] uppercase opacity-40 transition-opacity hover:opacity-100"
            >
              Remove
            </button>
          )}
        </div>
      )}

      <p className="mt-3 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
        {RECOMMENDED} · at least 1200 × 630 or link previews go soft · jpg, png,
        webp or avif · up to 8 mb
      </p>

      <div className="mt-6">
        <label className={LABEL} htmlFor="coverAlt">
          What the image shows
        </label>
        <input
          id="coverAlt"
          name="coverAlt"
          value={alt}
          onChange={(event) => onAltChange(event.target.value)}
          disabled={!canEdit}
          maxLength={300}
          placeholder="A kitchen table at night, two mugs, nobody in the chairs."
          className="w-full bg-white/[0.04] px-4 py-3 font-garamond text-[17px] text-[color:var(--bone)] outline-none ring-1 ring-white/15 transition-[box-shadow,background-color] placeholder:opacity-35 focus:bg-white/[0.07] focus:ring-2 focus:ring-[color:var(--cyan)]"
        />
        <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
          {alt.length}/125 recommended · read aloud to anyone who can&rsquo;t see
          it, and indexed by image search
        </p>
      </div>
    </div>
  );
}
