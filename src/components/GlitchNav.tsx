"use client";

import { useEffect, useState } from "react";

const LINKS = [
  "Home",
  "Unpopular",
  "Untold",
  "Reality Check",
  "Deep Dives",
  "About",
];

export default function GlitchNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-[color:var(--ink)]/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      {/* hairline that reads as a broken signal bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-px">
        <span className="h-full flex-[3] bg-white/60" />
        <span className="h-full flex-[1] bg-transparent" />
        <span className="h-full flex-[6] bg-[color:var(--cyan)]/70" />
        <span className="h-full flex-[1] bg-transparent" />
        <span className="h-full flex-[2] bg-white/30" />
      </div>

      <nav className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-10">
        <ul className="hidden items-center gap-3 lg:flex">
          {LINKS.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <a
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="glitch font-mono text-[11px] tracking-[0.2em] uppercase opacity-90 transition-opacity hover:opacity-100"
                data-text={label}
              >
                {label}
              </a>
              {i < LINKS.length - 1 && (
                <span aria-hidden className="text-[10px] opacity-50">
                  ·
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-4">
          <a
            href="#submit"
            className="glitch hidden border border-white/70 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:bg-white hover:text-[color:var(--red)] sm:inline-block"
            data-text="Submit a glitch →"
          >
            Submit a glitch →
          </a>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-9 flex-col items-center justify-center gap-1.5 border border-white/40 lg:hidden"
          >
            <span
              className={`block h-px w-4 bg-white transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-4 bg-white transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </nav>

      {open && (
        <ul className="border-t border-white/20 bg-[color:var(--ink)]/95 px-5 py-4 lg:hidden">
          {LINKS.map((label) => (
            <li key={label} className="py-2">
              <a
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setOpen(false)}
                className="glitch font-mono text-sm tracking-[0.2em] uppercase"
                data-text={label}
              >
                {label}
              </a>
            </li>
          ))}
          <li className="mt-2 border-t border-white/15 pt-4">
            <a
              href="#submit"
              onClick={() => setOpen(false)}
              className="glitch font-mono text-sm tracking-[0.2em] uppercase"
              data-text="Submit a glitch →"
            >
              Submit a glitch →
            </a>
          </li>
        </ul>
      )}
    </header>
  );
}
