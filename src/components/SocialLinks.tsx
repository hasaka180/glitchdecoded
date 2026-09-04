/**
 * Where the magazine is, off the magazine.
 *
 * The handles live here rather than in the footer so the contact page and the
 * sign-off cannot drift apart. Icons are drawn inline, the way the nav draws
 * its own — a magazine this small has no business shipping an icon font for
 * four marks.
 *
 * The hrefs are still placeholders, like the article slugs elsewhere: swap the
 * four `href` values below and both surfaces follow.
 */
export type Social = { label: string; href: string; paths: string[] };

export const SOCIALS: Social[] = [
  {
    label: "Instagram",
    href: "#instagram",
    paths: [
      "M7.6 3.6h8.8a4 4 0 0 1 4 4v8.8a4 4 0 0 1-4 4H7.6a4 4 0 0 1-4-4V7.6a4 4 0 0 1 4-4z",
      "M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z",
      "M16.9 7.1h.01",
    ],
  },
  {
    label: "YouTube",
    href: "#youtube",
    paths: [
      "M3.4 8.2a2.8 2.8 0 0 1 2.5-2.6c1.8-.2 3.8-.3 6.1-.3s4.3.1 6.1.3a2.8 2.8 0 0 1 2.5 2.6c.1 1.2.2 2.5.2 3.8s-.1 2.6-.2 3.8a2.8 2.8 0 0 1-2.5 2.6c-1.8.2-3.8.3-6.1.3s-4.3-.1-6.1-.3a2.8 2.8 0 0 1-2.5-2.6c-.1-1.2-.2-2.5-.2-3.8s.1-2.6.2-3.8z",
      "M10.2 9.3v5.4l4.6-2.7z",
    ],
  },
  {
    label: "Substack",
    href: "#substack",
    paths: [
      "M4.8 5.2h14.4",
      "M4.8 9.4h14.4",
      "M4.8 13.6h14.4v5.2L12 15.4 4.8 18.8z",
    ],
  },
  {
    label: "RSS",
    href: "#rss",
    paths: [
      "M5.2 18.6h.01",
      "M4.6 12.4a7 7 0 0 1 7 7",
      "M4.6 6.2a13.2 13.2 0 0 1 13.2 13.2",
    ],
  },
];

function SocialIcon({ paths }: { paths: string[] }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * The row of marks. Sized for the paper stock by default; the caller sets the
 * colour, so the same row works on ink.
 */
export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SOCIALS.map(({ label, href, paths }) => (
        <li key={label}>
          <a
            href={href}
            aria-label={label}
            title={label}
            className="inline-flex size-10 items-center justify-center border border-current/25 opacity-70 transition-[opacity,background-color,border-color] hover:border-current/60 hover:bg-current/5 hover:opacity-100"
          >
            <SocialIcon paths={paths} />
          </a>
        </li>
      ))}
    </ul>
  );
}
