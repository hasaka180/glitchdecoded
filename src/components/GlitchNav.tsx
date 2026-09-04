"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CATEGORIES } from "@/lib/categories";

type IconName =
  | "home"
  | "grid"
  | "film"
  | "pin"
  | "info"
  | "mail"
  | "send"
  | "key"
  | "user";

/** Line icons drawn inline so the menu ships no icon dependency. */
const PATHS: Record<IconName, string[]> = {
  home: ["M3.5 10.5 12 3.5l8.5 7", "M6 9.6V20h12V9.6"],
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  film: [
    "M3.5 5h17v14h-17z",
    "M8 5v14",
    "M16 5v14",
    "M3.5 9.5h4.5",
    "M3.5 14.5h4.5",
    "M16 9.5h4.5",
    "M16 14.5h4.5",
  ],
  pin: ["M12 4a4 4 0 0 1 4 4c0 2-1.2 3-1.2 4.6H9.2C9.2 11 8 10 8 8a4 4 0 0 1 4-4z", "M9.2 12.6h5.6", "M12 15.2V20"],
  info: ["M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8z", "M12 11.2V16.4", "M12 7.7h.01"],
  mail: ["M3.5 6h17v12h-17z", "M3.5 6.6 12 12.8l8.5-6.2"],
  send: ["M7 17 17 7", "M9 7h8v8"],
  key: [
    "M14.6 9.4a3.6 3.6 0 1 0-3.3 5l1.1-1.1h1.7v-1.7h1.7v-1.7h1.1l1.6-1.6-1.6-1.6z",
    "M11 12.2h.01",
  ],
  user: [
    "M12 4.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z",
    "M4.8 20c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6",
  ],
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[17px] shrink-0"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

type Item = { label: string; href: string; icon: IconName; accent?: boolean };

/** The magazine itself. Categories hang off this group as their own rows. */
const PRIMARY: Item[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Video library", href: "/video-library", icon: "film" },
  { label: "Notes", href: "/notes", icon: "pin" },
];

const SECONDARY: Item[] = [
  { label: "About us", href: "/about", icon: "info" },
  { label: "Contact us", href: "/contact", icon: "mail" },
  { label: "Submit a glitch", href: "/submit", icon: "send", accent: true },
];

/**
 * The writer's side of the site. These are the routes the auth flow in
 * `src/app/(auth)/` owns — `/login` is also where the gate in
 * `src/lib/auth/dal.ts` sends anyone who hits a private page signed out.
 */
const ACCOUNT: Item[] = [
  { label: "Sign in", href: "/login", icon: "key" },
  { label: "Sign up", href: "/signup", icon: "user" },
];

function Row({
  item,
  open,
  current,
  onSelect,
}: {
  item: Item;
  open: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={item.href}
      data-menu-item
      tabIndex={open ? 0 : -1}
      aria-current={current ? "page" : undefined}
      onClick={onSelect}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 outline-none transition-colors duration-150 hover:bg-white/[0.09] focus-visible:bg-white/[0.09] ${
        current ? "bg-white/[0.07]" : ""
      } ${
        item.accent
          ? "text-[color:var(--yellow)]"
          : current
            ? "text-white"
            : "text-white/80 hover:text-white focus-visible:text-white"
      }`}
    >
      <span
        className={`transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${
          current ? "opacity-100" : "opacity-65"
        }`}
      >
        <Icon name={item.icon} />
      </span>
      <span
        className="glitch font-mono text-[11px] tracking-[0.18em] uppercase"
        data-text={item.label}
      >
        {item.label}
      </span>
      {item.accent ? (
        <span aria-hidden className="ml-auto text-[11px] opacity-60">
          →
        </span>
      ) : (
        current && (
          <span
            aria-hidden
            className="ml-auto size-1.5 shrink-0 bg-[color:var(--cyan)]"
          />
        )
      )}
    </Link>
  );
}

/**
 * A category row. Its colour chip stands in for an icon — the six hues are how
 * the rail, the footer bars and the category pages already identify them, so
 * repeating that here costs nothing and reads faster than six more line icons.
 */
function CategoryRow({
  name,
  href,
  hue,
  open,
  current,
  onSelect,
}: {
  name: string;
  href: string;
  hue: string;
  open: boolean;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      data-menu-item
      tabIndex={open ? 0 : -1}
      aria-current={current ? "page" : undefined}
      onClick={onSelect}
      className={`group flex items-center gap-3 rounded-lg py-2 pr-3 pl-[26px] outline-none transition-colors duration-150 hover:bg-white/[0.09] focus-visible:bg-white/[0.09] ${
        current ? "bg-white/[0.07] text-white" : "text-white/70 hover:text-white focus-visible:text-white"
      }`}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 transition-transform duration-150 group-hover:scale-125"
        style={{ backgroundColor: hue, opacity: current ? 1 : 0.75 }}
      />
      <span
        className="glitch font-mono text-[10px] tracking-[0.18em] uppercase"
        data-text={name}
      >
        {name}
      </span>
      {current && (
        <span
          aria-hidden
          className="ml-auto size-1.5 shrink-0 bg-[color:var(--cyan)]"
        />
      )}
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-3 pb-1.5 font-mono text-[9px] tracking-[0.3em] text-white/35 uppercase">
      {children}
    </p>
  );
}

export default function GlitchNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /**
   * Every route opens on something dark — the home hero's photograph, or a
   * masthead built as a card over the category art — and then runs onto paper
   * or graphite below it. So the cluster is light at the top of a page and
   * flips its ink once it has been scrolled onto the section's ground. The home
   * page is the exception: its sections stay dark the whole way down.
   *
   * The panel itself stays dark either way — it is a menu hanging in front of
   * the page, not part of it.
   */
  const onDark = pathname === "/" || !scrolled;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  /** Roving focus through the rows; from the trigger it enters at either end. */
  const move = useCallback((dir: 1 | -1) => {
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-item]") ??
        [],
    );
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      at === -1
        ? dir === 1
          ? 0
          : items.length - 1
        : (at + dir + items.length) % items.length;
    items[next].focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, move]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`px-3 transition-[padding] duration-300 sm:px-6 ${
          scrolled ? "pt-2 sm:pt-3" : "pt-3 sm:pt-5"
        }`}
      >
        <div ref={rootRef} className="relative mx-auto flex max-w-[1500px] justify-end">
          {/* A floating cluster rather than a full-bleed strip, so the hero
              keeps its edges. Below sm the glass belongs to the button itself —
              a pane around a single control would only box a box. */}
          <div
            className={`relative flex h-14 items-center gap-2 rounded-2xl px-0 transition-colors duration-300 sm:h-[60px] sm:gap-3 sm:border sm:px-3 sm:backdrop-blur-xl ${
              onDark
                ? `sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_50px_-28px_rgba(0,0,0,0.95)] ${
                    scrolled
                      ? "sm:border-white/15 sm:bg-[color:var(--ink)]/70"
                      : "sm:border-white/10 sm:bg-white/[0.06]"
                  }`
                : `sm:shadow-[0_18px_40px_-30px_rgba(43,33,24,0.7)] ${
                    scrolled
                      ? "sm:border-[color:var(--ink-brown)]/20 sm:bg-[color:var(--paper)]/85"
                      : "sm:border-[color:var(--ink-brown)]/15 sm:bg-[color:var(--ink-brown)]/[0.04]"
                  }`
            }`}
          >
            <Link
              href="/submit"
              className={`glitch hidden rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors sm:inline-block ${
                onDark
                  ? "border-white/25 bg-white/[0.06] text-white hover:bg-white hover:text-[color:var(--red)]"
                  : "border-[color:var(--ink-brown)]/30 bg-transparent text-[color:var(--ink-brown)] hover:bg-[color:var(--ink-brown)] hover:text-[color:var(--paper)]"
              }`}
              data-text="Submit a glitch →"
            >
              Submit a glitch →
            </Link>

            <button
              ref={buttonRef}
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="nav-menu"
              onClick={() => setOpen((v) => !v)}
              className={`flex size-10 flex-col items-center justify-center gap-1 rounded-xl border backdrop-blur-xl transition-colors sm:shadow-none sm:backdrop-blur-none ${
                onDark
                  ? "border-white/15 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/[0.12]"
                  : "border-[color:var(--ink-brown)]/25 bg-[color:var(--paper)]/70 text-[color:var(--ink-brown)] hover:bg-[color:var(--ink-brown)]/10"
              }`}
            >
              <span
                className={`block h-px w-4 bg-current transition-transform duration-200 ${
                  open ? "translate-y-[5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px w-4 bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-px w-4 bg-current transition-transform duration-200 ${
                  open ? "-translate-y-[5px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>

          {/* The menu hangs off the bar as its own floating pane — kept a
              sibling of the bar so the bar can clip its own hairline. */}
          <div
            ref={panelRef}
            id="nav-menu"
            aria-hidden={!open}
            className={`menu-panel scrollbar-none absolute right-0 top-[calc(100%+10px)] max-h-[calc(100lvh-5.5rem)] w-[min(84vw,282px)] origin-top-right overflow-y-auto rounded-[20px] border border-white/12 bg-[color:var(--ink)]/85 p-2 backdrop-blur-2xl transition duration-200 ease-out ${
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-[0.97] opacity-0"
            }`}
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.12), 0 34px 64px -26px rgba(0,0,0,0.95)",
            }}
          >
            <GroupLabel>The magazine</GroupLabel>

            <Row
              item={PRIMARY[0]}
              open={open}
              current={pathname === PRIMARY[0].href}
              onSelect={close}
            />

            {/* Categories: the index, then the six under it. Kept expanded
                rather than behind a disclosure — the whole point of the menu is
                that the six are one press away, and a collapsed group would put
                them two. */}
            <Row
              item={{ label: "Categories", href: "/categories", icon: "grid" }}
              open={open}
              current={pathname === "/categories"}
              onSelect={close}
            />

            <div className="mb-1 border-l border-white/12 pl-1 ml-[22px]">
              {CATEGORIES.map((category) => (
                <CategoryRow
                  key={category.slug}
                  name={category.name}
                  href={`/categories/${category.slug}`}
                  hue={category.hue}
                  open={open}
                  current={pathname === `/categories/${category.slug}`}
                  onSelect={close}
                />
              ))}
            </div>

            {PRIMARY.slice(1).map((item) => (
              <Row
                key={item.href}
                item={item}
                open={open}
                current={pathname === item.href}
                onSelect={close}
              />
            ))}

            <div className="mx-3 my-1.5 h-px bg-white/12" />

            {SECONDARY.map((item) => (
              <Row
                key={item.href}
                item={item}
                open={open}
                current={pathname === item.href}
                onSelect={close}
              />
            ))}

            <div className="mx-3 my-1.5 h-px bg-white/12" />

            <GroupLabel>Your account</GroupLabel>

            {ACCOUNT.map((item) => (
              <Row
                key={item.href}
                item={item}
                open={open}
                current={pathname === item.href}
                onSelect={close}
              />
            ))}

            <p className="px-3 pt-2 pb-1 font-mono text-[9px] tracking-[0.24em] text-white/25 uppercase">
              Esc to close
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
