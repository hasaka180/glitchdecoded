"use client";

import { useState } from "react";

/**
 * Contact, in the same honest shape as the pitch form: there is no inbox
 * service behind this site and nothing here is tracked, so the form composes
 * the mail and hands the written draft to the reader's own client. Nothing is
 * transmitted by this page.
 */
const TO = "hello@glitchdecoded.com";

const REASONS = [
  { value: "general", label: "Just saying hello", subject: "Hello" },
  { value: "correction", label: "A correction", subject: "Correction" },
  { value: "rights", label: "Rights and permissions", subject: "Rights" },
  { value: "press", label: "Press or an interview", subject: "Press" },
  { value: "problem", label: "Something on the site is broken", subject: "Bug" },
] as const;

const FIELD =
  "mt-2 w-full border border-[color:var(--ink-brown)]/25 bg-white/60 px-3 py-2.5 font-garamond text-[17px] leading-[1.4] text-[color:var(--ink-brown)] outline-none transition-colors placeholder:opacity-35 focus:border-[color:var(--script-red)] focus:bg-white";

const LABEL =
  "font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-55";

export default function ContactForm() {
  const [sent, setSent] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const reason = REASONS.find((r) => r.value === get("reason")) ?? REASONS[0];
    const body = [
      `From: ${get("name") || "(no name given)"}`,
      `Reply to: ${get("email")}`,
      "",
      get("message"),
    ].join("\n");

    const href = `mailto:${TO}?subject=${encodeURIComponent(
      reason.subject,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = href;
    setSent(href);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Your name</span>
          <input name="name" type="text" autoComplete="name" className={FIELD} />
        </label>

        <label className="block">
          <span className={LABEL}>Where we reply</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@somewhere"
            className={FIELD}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>What about</span>
        <select name="reason" defaultValue="general" className={FIELD}>
          {REASONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL}>The message</span>
        <textarea
          name="message"
          required
          rows={8}
          className={`${FIELD} ruled resize-y bg-transparent leading-[34px]`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          className="glitch pixel-corner-sm border border-[color:var(--ink-brown)]/70 bg-[color:var(--ink-brown)] px-5 py-3 font-mono text-[11px] tracking-[0.2em] text-[color:var(--paper)] uppercase transition-colors hover:bg-[color:var(--script-red)]"
          data-text="Send it →"
        >
          Send it →
        </button>

        <p className="max-w-[36ch] font-garamond text-[15px] leading-[1.45] opacity-45">
          This opens your mail app with the message written out. Nothing leaves
          the page until you press send there.
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
          <a href={`mailto:${TO}`} className="underline underline-offset-4">
            {TO}
          </a>{" "}
          yourself.
        </p>
      )}
    </form>
  );
}
