import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Playfair_Display,
} from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "A Glitch in the Matrix — Decoded",
  description:
    "Unpopular opinions and untold stories. Move your cursor and the picture fractures into glass where you look.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
              "    var txt = 'UA ' + navigator.userAgent.slice(0,70) + String.fromCharCode(10) +",
              "      'canvas: ' + (s ? JSON.stringify(s) : 'effect never ran') + String.fromCharCode(10) +",
              "      'fit sizes: ' + Array.prototype.map.call(document.querySelectorAll('h1 div[style]'), function(n){ return n.style.fontSize || '(unset)'; }).join(' / ');",
              "    b.textContent = txt;",
              "  }, 1000);",
              "}",
              "})();",
            ].join(""),
          }}
        />
        {children}
      </body>
    </html>
  );
}
