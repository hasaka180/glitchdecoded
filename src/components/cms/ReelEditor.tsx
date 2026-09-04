"use client";

import { useActionState, useState } from "react";

import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_GHOST, ERROR_BOX, INPUT, LABEL } from "@/components/cms/ui";
import { deleteReel, saveReel, type ReelState } from "@/lib/actions/reels";
import { thumbnailSrc, youtubeId } from "@/lib/videos";

/**
 * One reel in the programme.
 *
 * Its own form, so saving a reel touches only that reel — a screen that
 * submitted the whole library at once would make a typo in the last row a
 * reason the first row can't be saved.
 */

export type EditableReel = {
  id: string;
  speaker: string;
  line: string;
  source: string;
  year: string;
  stock: string;
  hue: string;
  inkHue: string;
  url: string;
  runtime: string;
  position: number;
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
  className = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL} htmlFor={`${name}-${label}`}>
        {label}
      </label>
      <input
        id={`${name}-${label}`}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={INPUT}
      />
    </div>
  );
}

export default function ReelEditor({ reel }: { reel: EditableReel }) {
  const [fields, setFields] = useState(reel);
  const set = (key: keyof EditableReel) => (value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const [saveState, save, saving] = useActionState<ReelState, FormData>(
    saveReel,
    {},
  );
  const [removeState, remove] = useActionState<ReelState, FormData>(
    deleteReel,
    {},
  );

  const videoId = youtubeId(fields.url);

  return (
    <li className="pixel-corner bg-white/[0.03] p-5 sm:p-6">
      <form action={save} className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <input type="hidden" name="reelId" value={fields.id} />

        {/* The still, which is the fastest way to see you pasted the right link */}
        <div>
          {videoId ? (
            // YouTube's still server — an arbitrary remote host that next/image
            // would need configured in advance.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailSrc(videoId)}
              alt=""
              className="block aspect-video w-full bg-black object-cover"
            />
          ) : (
            <div
              className="flex aspect-video w-full items-center justify-center px-3 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <span className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-40">
                {fields.url ? "Not a link I can read" : "Not transferred yet"}
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden
              className="size-4 shrink-0"
              style={{ backgroundColor: fields.hue }}
            />
            <span
              aria-hidden
              className="size-4 shrink-0"
              style={{ backgroundColor: fields.inkHue }}
            />
            <span className="font-arial text-[9px] tracking-[0.14em] uppercase opacity-35">
              lit · on graphite
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Speaker"
            name="speaker"
            value={fields.speaker}
            onChange={set("speaker")}
            maxLength={160}
            placeholder="Carl Jung"
          />
          <Field
            label="Order"
            name="position"
            value={String(fields.position)}
            onChange={(v) => set("position")(v.replace(/\D/g, "").slice(0, 3))}
            placeholder="0"
          />

          <Field
            label="YouTube link"
            name="url"
            value={fields.url}
            onChange={set("url")}
            maxLength={500}
            placeholder="https://www.youtube.com/watch?v=…"
            className="sm:col-span-2"
          />

          <Field
            label="The line"
            name="line"
            value={fields.line}
            onChange={set("line")}
            maxLength={400}
            placeholder="What the reel is about, in the magazine's voice."
            className="sm:col-span-2"
          />

          <Field
            label="Source"
            name="source"
            value={fields.source}
            onChange={set("source")}
            maxLength={200}
            placeholder="Face to Face, BBC"
          />
          <Field
            label="Year"
            name="year"
            value={fields.year}
            onChange={set("year")}
            maxLength={12}
            placeholder="1959"
          />

          <Field
            label="Stock"
            name="stock"
            value={fields.stock}
            onChange={set("stock")}
            maxLength={60}
            placeholder="16mm · b/w"
          />
          <Field
            label="Runtime"
            name="runtime"
            value={fields.runtime}
            onChange={set("runtime")}
            maxLength={40}
            placeholder="38 min"
          />

          <Field
            label="Accent (lit)"
            name="hue"
            value={fields.hue}
            onChange={set("hue")}
            maxLength={16}
            placeholder="#d8b06a"
          />
          <Field
            label="Accent (on graphite)"
            name="inkHue"
            value={fields.inkHue}
            onChange={set("inkHue")}
            maxLength={16}
            placeholder="#8a5a12"
          />

          {(saveState.error ?? removeState.error) && (
            <p className={`${ERROR_BOX} sm:col-span-2`} role="alert">
              {saveState.error ?? removeState.error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button type="submit" disabled={saving} className={BUTTON_GHOST}>
              {saving ? "Saving…" : "Save this reel"}
            </button>

            {saveState.savedAt && !saving && (
              <span className="font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
                Saved
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Its own form: nesting one inside the editor's would not be valid HTML */}
      <form action={remove} className="mt-4 border-t border-white/8 pt-4">
        <input type="hidden" name="reelId" value={fields.id} />
        <SubmitButton
          className="font-arial text-[9px] font-bold tracking-[0.14em] uppercase opacity-40 transition-opacity hover:opacity-100"
          pendingLabel="Removing…"
          confirm="Remove this reel from the library?"
        >
          Remove reel
        </SubmitButton>
      </form>
    </li>
  );
}
