"use client";

import { useState } from "react";

/**
 * The pitch form.
 *
 * There is no server behind this site — the magazine is static and nothing is
 * tracked — so the form does what a static site can honestly do: it composes
 * the mail for you and hands it to your own client, fully written. Nothing is
 * transmitted from this page, and nothing is stored by it.
 */
const TO = "hello@glitchdecoded.com";

const KINDS = [
  { value: "unpopular", label: "Unpopular opinion" },
  { value: "untold", label: "Untold story" },
  { value: "reality-check", label: "Reality check" },
  { value: "deep-dive", label: "Deep dive" },
  { value: "nature", label: "Nature" },
  { value: "human", label: "Human" },
  { value: "film", label: "For the screening room" },
  { value: "other", label: "Something else" },
] as const;

const FIELD =
  "mt-2 w-full border border-[color:var(--ink-brown)]/25 bg-white/60 px-3 py-2.5 font-garamond text-[17px] leading-[1.4] text-[color:var(--ink-brown)] outline-none transition-colors placeholder:opacity-35 focus:border-[color:var(--script-red)] focus:bg-white";

const LABEL =
  "font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-55";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {hint && (
        <span className="mt-1 block font-garamond text-[15px] leading-[1.4] opacity-45">
          {hint}
        </span>
      )}
      {children}
    </label>
  );
}

export default function SubmitForm() {
  const [sent, setSent] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const kind = KINDS.find((k) => k.value === get("kind"))?.label ?? "Pitch";
    const subject = `${kind}: ${get("title") || "untitled"}`;
    const body = [
      `From: ${get("name") || "(no name given)"}`,
      `Reply to: ${get("email")}`,
      `Kind: ${kind}`,
      get("link") ? `Link: ${get("link")}` : null,
      "",
      "--- the pitch ---",
      "",
      get("pitch"),
      "",
      get("why") ? `--- why now ---\n\n${get("why")}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const href = `mailto:${TO}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    // Handing it to the mail client is the whole submission; the page keeps
    // the draft on screen in case that hand-off goes nowhere.
    window.location.href = href;
    setSent(href);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Your name">
          <input name="name" type="text" autoComplete="name" className={FIELD} />
        </Field>

        <Field label="Where we reply">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@somewhere"
            className={FIELD}
          />
        </Field>
      </div>

      <div className="grid gap-7 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Field label="What kind">
          <select name="kind" defaultValue="unpopular" className={FIELD}>
            {KINDS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Working title">
          <input
            name="title"
            type="text"
            required
            placeholder="The one line you would put on the cover"
            className={FIELD}
          />
        </Field>
      </div>

      <Field
        label="The pitch"
        hint="Two or three paragraphs. What the piece argues or uncovers, and how you know."
      >
        <textarea
          name="pitch"
          required
          rows={9}
          className={`${FIELD} ruled resize-y bg-transparent leading-[34px]`}
        />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Why now" hint="Optional. If there is a reason it cannot wait.">
          <textarea name="why" rows={3} className={`${FIELD} resize-y`} />
        </Field>

        <Field label="A link" hint="Optional. Published work, a source, a reel.">
          <input
            name="link"
            type="url"
            placeholder="https://"
            className={FIELD}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <button
          type="submit"
          className="glitch pixel-corner-sm border border-[color:var(--ink-brown)]/70 bg-[color:var(--ink-brown)] px-5 py-3 font-mono text-[11px] tracking-[0.2em] text-[color:var(--paper)] uppercase transition-colors hover:bg-[color:var(--script-red)]"
          data-text="Send the pitch →"
        >
          Send the pitch →
        </button>

        <p className="max-w-[38ch] font-garamond text-[15px] leading-[1.45] opacity-45">
          This opens your mail app with the pitch written out. Nothing leaves
          this page until you press send there.
        </p>
      </div>

      {sent && (
        <p
          role="status"
          className="border-l-2 border-[color:var(--script-red)] pl-4 font-garamond text-[16px] leading-[1.5]"
        >
          Your mail app should be open with the draft.{" "}
          <a href={sent} className="underline underline-offset-4">
            Nothing happened? Open it again
          </a>{" "}
          — or write to{" "}
          <a
            href={`mailto:${TO}`}
            className="underline underline-offset-4"
          >
            {TO}
          </a>{" "}
          yourself and paste the box above in.
        </p>
      )}
    </form>
  );
}
