import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Playfair_Display,
} from "next/font/google";
import localFont from "next/font/local";

import SiteChrome from "@/components/cms/SiteChrome";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// High-contrast editorial display: upright for the first half of the headline,
// italic for the second — the two-tone treatment from the brief.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "700", "900"],
});

// Bitmap face for the word mark, self-hosted from public/assets.
const astheticPixel = localFont({
  src: "../../public/assets/AstheticPixelDemoRegular-2v148.otf",
  variable: "--font-pixel-face",
  display: "swap",
  weight: "400",
});

// Handwritten signature that runs ahead of the bitmap word.
const paquthy = localFont({
  src: "../../public/assets/paquthy.otf",
  variable: "--font-paquthy",
  display: "swap",
  weight: "400",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

/**
 * Where a link to this site is unfurled — a search result, a chat preview, a
 * card in a timeline — this is what it says. `metadataBase` is what lets the
 * relative `url` and `canonical` paths the article pages already set resolve
 * to absolute ones; set NEXT_PUBLIC_SITE_URL in the deploy environment so they
 * point at the real host rather than at localhost.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = "Glitch Decoded — unpopular opinions, untold stories";
const DESCRIPTION =
  "A magazine for the things the scroll hurries past: unpopular opinions, untold stories and long reads, each one chosen by an editor rather than a feed.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Glitch Decoded",
  keywords: [
    "independent magazine",
    "unpopular opinions",
    "untold stories",
    "long reads",
    "essays",
    "reality check",
    "deep dives",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Glitch Decoded",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  // Images and card type are filled in from the opengraph-image route.
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/** Paints the mobile browser chrome the ink the page is already painted. */
export const viewport: Viewport = {
  themeColor: "#07070c",
  colorScheme: "dark",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${astheticPixel.variable} ${paquthy.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Diagnostics. A classic inline script, so it reports even when the
            React bundle fails to evaluate or hydrate. Silent unless something
            throws; ?debug=1 also shows a live status readout. */}
        <script
          dangerouslySetInnerHTML={{
            __html: [
              "(function(){",
              "var box;",
              "function line(text){",
              "  if(!box){",
              "    box=document.createElement('pre');",
              "    box.style.cssText='position:fixed;z-index:99999;left:0;right:0;top:0;margin:0;padding:8px;font:11px/1.4 ui-monospace,monospace;color:#fff;background:#b30f22;white-space:pre-wrap;max-height:45vh;overflow:auto';",
              "    (document.documentElement||document.body).appendChild(box);",
              "  }",
              "  return box;",
              "}",
              "function log(text){ line().appendChild(document.createTextNode(text + String.fromCharCode(10))); }",
              "window.addEventListener('error', function(e){",
              "  log('ERROR: ' + (e.message || e.error) + '  @ ' + (e.filename||'?') + ':' + (e.lineno||'?'));",
              "}, true);",
              "window.addEventListener('unhandledrejection', function(e){",
              "  log('REJECTED: ' + (e.reason && (e.reason.message || e.reason)));",
              "});",
              "if(location.search.indexOf('debug=1') > -1){",
              "  setInterval(function(){",
              "    var s = window.__glitch;",
              "    var b = line();",
              "    b.setAttribute('data-status','1');",
              "    var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
              "    var rail = document.querySelector('.note-rail-track') ? 'autoplay' :",
              "      (document.querySelector('.note-rail-static') ? 'MANUAL (reduced motion)' : 'not on screen');",
              "    var txt = 'UA ' + navigator.userAgent.slice(0,70) + String.fromCharCode(10) +",
              "      'reduce-motion: ' + rm + '   sticky stages: ' + document.querySelectorAll('.sticky.top-0').length +",
              "      '   carousel: ' + rail + String.fromCharCode(10) +",
              "      'canvas: ' + (s ? JSON.stringify(s) : 'effect never ran') + String.fromCharCode(10) +",
              "      'fit sizes: ' + Array.prototype.map.call(document.querySelectorAll('h1 div[style]'), function(n){ return n.style.fontSize || '(unset)'; }).join(' / ');",
              "    b.textContent = txt;",
              "  }, 1000);",
              "}",
              "})();",
            ].join(""),
          }}
        />
        {/* The nav floats over every public route, so it belongs to the shell
            rather than to any one page. It stands down on the dashboard and the
            auth screens, which carry their own header. */}
        <SiteChrome />
        {children}
        {/* A piece opened from a listing renders here, over the page that
            linked to it. Empty on a hard load — see app/@modal/default.tsx. */}
        {modal}
      </body>
    </html>
  );
}
